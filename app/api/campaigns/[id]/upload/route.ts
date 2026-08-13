import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as xlsx from 'xlsx';

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Parse sheet to JSON array
    const data = xlsx.utils.sheet_to_json<{ Name?: string; 'Phone number'?: string; Phone?: string; name?: string; phone?: string }>(sheet);
    
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Excel file is empty' }, { status: 400 });
    }

    const contactsToCreate: any[] = [];
    
    for (const row of data) {
      const name = row.Name || row.name;
      const phone = row['Phone number'] || row.Phone || row.phone;
      
      if (name && phone) {
        contactsToCreate.push({
          campaignId: params.id,
          name: String(name).trim(),
          phone: String(phone).trim(),
          status: 'PENDING'
        });
      }
    }
    
    if (contactsToCreate.length === 0) {
      return NextResponse.json({ error: 'No valid contacts found. Please ensure Name and Phone columns exist.' }, { status: 400 });
    }

    // Use transaction to delete existing pending contacts? Or just append. We will just append.
    await prisma.campaignContact.createMany({
      data: contactsToCreate,
      skipDuplicates: true,
    });

    return NextResponse.json({ success: true, count: contactsToCreate.length });
  } catch (error) {
    console.error('[Campaign API] Error uploading contacts:', error);
    return NextResponse.json({ error: 'Failed to process Excel file' }, { status: 500 });
  }
}

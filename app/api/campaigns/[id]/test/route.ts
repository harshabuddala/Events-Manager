import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendBrochureCampaignMessage } from '@/lib/whatsapp/campaign';

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { contacts } = await req.json();
    
    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json({ error: 'Please provide at least one contact.' }, { status: 400 });
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id }
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const results = [];

    for (const contact of contacts) {
      // Mock contact ID for the helper since these are just test contacts not in DB
      const mockContactData = {
        id: 'test-contact-id',
        name: contact.name,
        phone: contact.phone
      };

      const result = await sendBrochureCampaignMessage(mockContactData, campaign.contentSid);
      results.push({ name: contact.name, phone: contact.phone, ...result });
      
      // Delay slightly between messages
      await new Promise(r => setTimeout(r, 100));
    }

    const allSuccess = results.every(r => r.success);
    
    return NextResponse.json({ 
      success: allSuccess, 
      message: `Tested ${results.length} contacts.`,
      results 
    });
  } catch (error) {
    console.error('[Campaign API] Error testing campaign:', error);
    return NextResponse.json({ error: 'Failed to run test' }, { status: 500 });
  }
}

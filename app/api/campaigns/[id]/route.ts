import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      include: {
        contacts: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Calculate analytics
    const analytics = {
      total: campaign.contacts.length,
      sent: campaign.contacts.filter(c => c.status === 'SENT').length,
      failed: campaign.contacts.filter(c => c.status === 'FAILED').length,
      pending: campaign.contacts.filter(c => c.status === 'PENDING').length,
      responded: campaign.contacts.filter(c => c.hasResponded).length,
    };

    return NextResponse.json({ campaign, analytics });
  } catch (error) {
    console.error('[Campaign API] Error fetching campaign details:', error);
    return NextResponse.json({ error: 'Failed to fetch campaign details' }, { status: 500 });
  }
}

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { name, contentSid } = await req.json();
    if (!name || !contentSid) {
      return NextResponse.json({ error: 'Name and Content SID are required' }, { status: 400 });
    }

    const campaign = await prisma.campaign.update({
      where: { id: params.id },
      data: { name, contentSid }
    });
    
    return NextResponse.json({ campaign });
  } catch (error) {
    console.error('[Campaign API] Error updating campaign:', error);
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await prisma.campaign.delete({
      where: { id: params.id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Campaign API] Error deleting campaign:', error);
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 });
  }
}

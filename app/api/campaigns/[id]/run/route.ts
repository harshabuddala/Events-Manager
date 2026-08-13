import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendBrochureCampaignMessage } from '@/lib/whatsapp/campaign';

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id }
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Update status to RUNNING
    await prisma.campaign.update({
      where: { id: params.id },
      data: { status: 'RUNNING' }
    });

    // Fetch pending contacts
    const pendingContacts = await prisma.campaignContact.findMany({
      where: {
        campaignId: params.id,
        status: 'PENDING'
      }
    });

    // Process asynchronously so we don't block the request
    (async () => {
      for (const contact of pendingContacts) {
        const result = await sendBrochureCampaignMessage(contact, campaign.contentSid);
        
        await prisma.campaignContact.update({
          where: { id: contact.id },
          data: {
            status: result.success ? 'SENT' : 'FAILED',
            errorMessage: result.error || null,
          }
        });
        
        // Optional: wait a bit between messages to avoid rate limiting
        await new Promise(r => setTimeout(r, 100)); 
      }
      
      // Update campaign status to COMPLETED once done
      await prisma.campaign.update({
        where: { id: params.id },
        data: { status: 'COMPLETED' }
      });
    })().catch(console.error);

    return NextResponse.json({ success: true, message: `Started sending to ${pendingContacts.length} contacts.` });
  } catch (error) {
    console.error('[Campaign API] Error running campaign:', error);
    return NextResponse.json({ error: 'Failed to run campaign' }, { status: 500 });
  }
}

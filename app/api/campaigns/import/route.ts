import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    if (!Array.isArray(data)) {
      return NextResponse.json({ error: 'Invalid format. Expected an array of campaigns.' }, { status: 400 });
    }

    const createdCampaigns = [];

    for (const campaign of data) {
      if (!campaign.name || !campaign.contentSid) continue;
      
      const newCampaign = await prisma.campaign.create({
        data: {
          name: campaign.name,
          contentSid: campaign.contentSid,
          status: 'DRAFT'
        }
      });
      createdCampaigns.push(newCampaign);
    }

    return NextResponse.json({ success: true, count: createdCampaigns.length, campaigns: createdCampaigns });
  } catch (error) {
    console.error('[Campaign Import API] Error importing campaigns:', error);
    return NextResponse.json({ error: 'Failed to import campaigns' }, { status: 500 });
  }
}

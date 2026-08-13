import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    let campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { contacts: true }
        }
      }
    });

    // Auto-create default campaign if none exist (e.g., in a fresh production DB)
    if (campaigns.length === 0) {
      const defaultCampaign = await prisma.campaign.create({
        data: {
          name: 'Gymnastics Campaign',
          contentSid: 'HXd909c058fd34a420b04a87e8c44e15ba',
          status: 'DRAFT'
        }
      });
      campaigns = [{ ...defaultCampaign, _count: { contacts: 0 } } as any];
    }

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error('[Campaign API] Error fetching campaigns:', error);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, contentSid } = await req.json();
    if (!name || !contentSid) {
      return NextResponse.json({ error: 'Name and Content SID are required' }, { status: 400 });
    }

    const campaign = await prisma.campaign.create({
      data: {
        name,
        contentSid,
        status: 'DRAFT',
      }
    });
    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error('[Campaign API] Error creating campaign:', error);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}

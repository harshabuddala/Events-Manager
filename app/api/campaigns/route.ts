import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { contacts: true }
        }
      }
    });
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

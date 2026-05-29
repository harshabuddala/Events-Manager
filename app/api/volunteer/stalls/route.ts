import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get stalls assigned to this volunteer
    // For now, return mock data
    const stalls = [
      {
        id: '1',
        name: 'Science Lab',
        code: 'ST-SCI001'
      },
      {
        id: '2',
        name: 'Math Corner',
        code: 'ST-MAT001'
      }
    ]

    return NextResponse.json({ stalls })
  } catch (error) {
    console.error('Volunteer stalls API error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
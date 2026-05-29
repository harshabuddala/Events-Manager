import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get students who have visited stalls assigned to this volunteer
    // For now, return mock data
    const students = [
      {
        id: '1',
        name: 'Aarav Sharma',
        rollNumber: 'REG-2024-001',
        grade: '5',
        stallName: 'Science Lab',
        visitTime: new Date().toISOString(),
        status: 'pending' as const
      },
      {
        id: '2',
        name: 'Diya Patel',
        rollNumber: 'REG-2024-002',
        grade: '6',
        stallName: 'Math Corner',
        visitTime: new Date(Date.now() - 3600000).toISOString(),
        status: 'completed' as const,
        score: 8.5,
        evaluationGrade: 'A'
      },
      {
        id: '3',
        name: 'Rahul Kumar',
        rollNumber: 'REG-2024-003',
        grade: '4',
        stallName: 'Science Lab',
        visitTime: new Date(Date.now() - 7200000).toISOString(),
        status: 'pending' as const
      }
    ]

    return NextResponse.json({ students })
  } catch (error) {
    console.error('Volunteer students API error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
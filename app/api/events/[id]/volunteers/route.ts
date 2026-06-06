import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const postSchema = z.object({
  volunteerId: z.string().uuid(),
  stallId: z.string().uuid(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const result = postSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
    }

    const { volunteerId, stallId } = result.data

    const existing = await prisma.volunteerAssignment.findFirst({
      where: { eventId: id, volunteerId, stallId },
    })

    if (existing) {
      return NextResponse.json({ error: 'Volunteer already assigned to this stall' }, { status: 409 })
    }

    const assignment = await prisma.volunteerAssignment.create({
      data: { eventId: id, volunteerId, stallId },
    })

    await prisma.volunteer.update({
      where: { id: volunteerId },
      data: { status: 'ASSIGNED' },
    })

    return NextResponse.json({ assignment }, { status: 201 })
  } catch (error) {
    console.error('Assign volunteer error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get('assignmentId')

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 })
    }

    await prisma.volunteerAssignment.delete({
      where: { id: assignmentId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove volunteer error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

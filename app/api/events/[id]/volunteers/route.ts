import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { readJsonBody } from '@/lib/request'
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
    const parsed = await readJsonBody(request, postSchema)
    if (!parsed.ok) return parsed.response
    const result = parsed.data

    const { volunteerId, stallId } = result

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

    const existing = await prisma.volunteerAssignment.findUnique({
      where: { id: assignmentId },
      select: { volunteerId: true },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    await prisma.volunteerAssignment.delete({
      where: { id: assignmentId },
    })

    const remainingAssignments = await prisma.volunteerAssignment.count({
      where: { volunteerId: existing.volunteerId },
    })
    if (remainingAssignments === 0) {
      await prisma.volunteer.update({
        where: { id: existing.volunteerId },
        data: { status: 'AVAILABLE' },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove volunteer error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

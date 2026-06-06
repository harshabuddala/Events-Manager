import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { readJsonBody } from '@/lib/request'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  location: z.string().min(1).max(200).optional(),
  zone: z.string().max(50).optional(),
  status: z.enum(['ACTIVE', 'UPCOMING', 'INACTIVE']).optional(),
  contactPerson: z.string().min(1).max(100).optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().max(30).optional().or(z.literal('')),
  description: z.string().max(2000).optional().or(z.literal('')),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const parsed = await readJsonBody(request, updateSchema)
    if (!parsed.ok) return parsed.response
    const result = parsed.data

    const community = await prisma.community.update({
      where: { id },
      data: result,
    })

    return NextResponse.json({ community })
  } catch (error) {
    console.error('Update community error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const eventCount = await prisma.event.count({ where: { communityId: id } })
    if (eventCount > 0) {
      return NextResponse.json({ error: 'Cannot delete community with existing events' }, { status: 400 })
    }

    await prisma.community.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete community error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { readJsonBody } from '@/lib/request'
import { z } from 'zod'

const postSchema = z.object({
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

    const stall = await prisma.stall.update({
      where: { id: result.stallId },
      data: { events: { connect: { id } } },
    })

    return NextResponse.json({ stall })
  } catch (error) {
    console.error('Link stall error:', error instanceof Error ? error.message : 'Unknown')
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
    const stallId = searchParams.get('stallId')

    if (!stallId) {
      return NextResponse.json({ error: 'Stall ID is required' }, { status: 400 })
    }

    const stall = await prisma.stall.update({
      where: { id: stallId },
      data: { events: { disconnect: { id } } },
    })

    return NextResponse.json({ stall })
  } catch (error) {
    console.error('Unlink stall error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

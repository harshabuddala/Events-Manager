import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { z } from 'zod'
import { unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const updateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  cropX: z.coerce.number().int().min(0).optional(),
  cropY: z.coerce.number().int().min(0).optional(),
  cropW: z.coerce.number().int().min(50).optional(),
  cropH: z.coerce.number().int().min(50).optional(),
  isActive: z.coerce.boolean().optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const letterhead = await prisma.letterhead.findUnique({ where: { id } })
    if (!letterhead) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ letterhead })
  } catch (error) {
    console.error('Get letterhead error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
    const body = await request.json()
    const result = updateSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
    }

    const existing = await prisma.letterhead.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const newCropX = result.data.cropX ?? existing.cropX
    const newCropY = result.data.cropY ?? existing.cropY
    const newCropW = result.data.cropW ?? existing.cropW
    const newCropH = result.data.cropH ?? existing.cropH
    if (newCropX + newCropW > existing.imageW || newCropY + newCropH > existing.imageH) {
      return NextResponse.json({ error: 'Crop area exceeds image bounds' }, { status: 400 })
    }

    const letterhead = await prisma.letterhead.update({
      where: { id },
      data: result.data,
    })

    return NextResponse.json({ letterhead })
  } catch (error) {
    console.error('Update letterhead error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const letterhead = await prisma.letterhead.findUnique({ where: { id } })
    if (!letterhead) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const eventCount = await prisma.event.count({ where: { letterheadId: id } })
    if (eventCount > 0) {
      // Soft-delete to preserve history; detach events
      await prisma.event.updateMany({
        where: { letterheadId: id },
        data: { letterheadId: null },
      })
      await prisma.letterhead.update({ where: { id }, data: { isActive: false } })
      return NextResponse.json({ success: true, softDeleted: true, detachedFrom: eventCount })
    }

    const filePath = path.join(process.cwd(), letterhead.filePath.replace(/^\//, ''))
    if (existsSync(filePath)) {
      try {
        await unlink(filePath)
      } catch {
        // ignore — best-effort cleanup
      }
    }
    await prisma.letterhead.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete letterhead error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

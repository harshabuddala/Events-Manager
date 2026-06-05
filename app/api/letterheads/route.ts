import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { z } from 'zod'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'letterheads')

const cropSchema = z.object({
  cropX: z.coerce.number().int().min(0),
  cropY: z.coerce.number().int().min(0),
  cropW: z.coerce.number().int().min(50),
  cropH: z.coerce.number().int().min(50),
  imageW: z.coerce.number().int().min(50),
  imageH: z.coerce.number().int().min(50),
  name: z.string().min(1).max(120),
})

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const letterheads = await prisma.letterhead.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        fileName: true,
        sizeBytes: true,
        cropX: true,
        cropY: true,
        cropW: true,
        cropH: true,
        imageW: true,
        imageH: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { events: true } },
      },
    })

    return NextResponse.json({ letterheads })
  } catch (error) {
    console.error('List letterheads error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'PNG file is required' }, { status: 400 })
    }
    if (file.type !== 'image/png') {
      return NextResponse.json({ error: 'Only PNG files are accepted' }, { status: 400 })
    }
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 15MB)' }, { status: 400 })
    }

    const buf = Buffer.from(await file.arrayBuffer())
    if (buf.length < 8 || !buf.subarray(0, 8).equals(PNG_MAGIC)) {
      return NextResponse.json({ error: 'File is not a valid PNG (signature mismatch)' }, { status: 400 })
    }

    const parsed = cropSchema.safeParse({
      name: form.get('name'),
      cropX: form.get('cropX'),
      cropY: form.get('cropY'),
      cropW: form.get('cropW'),
      cropH: form.get('cropH'),
      imageW: form.get('imageW'),
      imageH: form.get('imageH'),
    })
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }
    const { name, cropX, cropY, cropW, cropH, imageW, imageH } = parsed.data

    if (cropX + cropW > imageW || cropY + cropH > imageH) {
      return NextResponse.json(
        { error: 'Crop area exceeds image bounds' },
        { status: 400 }
      )
    }

    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true })
    }
    const id = randomUUID()
    const fileName = `${id}.png`
    const filePath = path.join(UPLOAD_DIR, fileName)
    await writeFile(filePath, buf)

    const letterhead = await prisma.letterhead.create({
      data: {
        id,
        name,
        filePath: `/uploads/letterheads/${fileName}`,
        fileName: file.name || 'letterhead.png',
        mimeType: 'image/png',
        sizeBytes: buf.length,
        cropX, cropY, cropW, cropH,
        imageW, imageH,
      },
    })

    return NextResponse.json({ letterhead }, { status: 201 })
  } catch (error) {
    console.error('Upload letterhead error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const letterhead = await prisma.letterhead.findUnique({
      where: { id },
      select: { filePath: true, mimeType: true, isActive: true },
    })
    if (!letterhead || !letterhead.isActive) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const filePath = path.join(process.cwd(), letterhead.filePath.replace(/^\//, ''))
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: 'File missing on disk' }, { status: 404 })
    }

    const bytes = await readFile(filePath)
    return new NextResponse(bytes, {
      headers: {
        'Content-Type': letterhead.mimeType,
        'Cache-Control': 'private, max-age=3600',
        'Content-Length': String(bytes.length),
      },
    })
  } catch (error) {
    console.error('Letterhead file error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { generateApiKey, hashApiKey } from '@/lib/api-key'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const keys = await prisma.apiKey.findMany({
      orderBy: { createdAt: 'desc' },
    })

    const masked = keys.map(k => ({
      id: k.id,
      name: k.name,
      keyPreview: `${k.key.slice(0, 8)}...${k.key.slice(-8)}`,
      isActive: k.isActive,
      lastUsedAt: k.lastUsedAt,
      createdAt: k.createdAt,
    }))

    return NextResponse.json({ keys: masked })
  } catch (error) {
    console.error('List API keys error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const rawKey = generateApiKey()
    const hashedKey = hashApiKey(rawKey)

    const apiKey = await prisma.apiKey.create({
      data: { key: hashedKey, name: name.trim(), isActive: true },
    })

    return NextResponse.json({
      id: apiKey.id,
      key: rawKey,
      name: apiKey.name,
      message: 'Save this key — it will not be shown again',
    })
  } catch (error) {
    console.error('Create API key error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

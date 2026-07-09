import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { clearRazorpayConfigCache } from '@/lib/razorpay'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const config = await prisma.razorpayConfig.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    })

    if (!config) {
      return NextResponse.json({ config: null })
    }

    return NextResponse.json({
      config: {
        id: config.id,
        keyId: config.keyId,
        keySecret: config.keySecret.slice(0, 2) + '••••••••••••' + config.keySecret.slice(-2),
        webhookSecret: config.webhookSecret
          ? config.webhookSecret.slice(0, 2) + '••••••••••••' + config.webhookSecret.slice(-2)
          : null,
        isActive: config.isActive,
      },
    })
  } catch (error) {
    console.error('Get Razorpay config error:', error instanceof Error ? error.message : 'Unknown')
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
    const { keyId, keySecret, webhookSecret } = body

    if (!keyId?.trim() || !keySecret?.trim()) {
      return NextResponse.json({ error: 'Key ID and Key Secret are required' }, { status: 400 })
    }

    const existing = await prisma.razorpayConfig.findFirst({ where: { isActive: true } })

    if (existing) {
      await prisma.razorpayConfig.update({
        where: { id: existing.id },
        data: {
          keyId: keyId.trim(),
          keySecret: keySecret.trim(),
          webhookSecret: webhookSecret?.trim() || null,
        },
      })
    } else {
      await prisma.razorpayConfig.create({
        data: {
          keyId: keyId.trim(),
          keySecret: keySecret.trim(),
          webhookSecret: webhookSecret?.trim() || null,
          isActive: true,
        },
      })
    }

    clearRazorpayConfigCache()

    return NextResponse.json({ success: true, message: 'Razorpay configuration saved' })
  } catch (error) {
    console.error('Save Razorpay config error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

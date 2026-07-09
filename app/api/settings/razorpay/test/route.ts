import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST() {
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
      return NextResponse.json({ success: false, error: 'No Razorpay configuration found. Save your keys first.' })
    }

    const Razorpay = (await import('razorpay')).default
    const razorpay = new Razorpay({
      key_id: config.keyId,
      key_secret: config.keySecret,
    })

    try {
      const order = await razorpay.orders.create({
        amount: 100,
        currency: 'INR',
        receipt: `test_${Date.now()}`,
      })

      if (order && order.id) {
        return NextResponse.json({
          success: true,
          message: `Connected! Test order created: ${order.id}`,
          keyId: config.keyId,
        })
      }

      return NextResponse.json({ success: false, error: 'Unexpected response from Razorpay' })
    } catch (rzpError: any) {
      const msg = rzpError?.error?.description || rzpError?.message || 'Connection failed'
      return NextResponse.json({ success: false, error: `Razorpay error: ${msg}` })
    }
  } catch (error) {
    console.error('Test Razorpay error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ success: false, error: 'Internal server error' })
  }
}

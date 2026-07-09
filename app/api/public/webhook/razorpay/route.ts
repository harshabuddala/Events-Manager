import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyWebhookSignature } from '@/lib/razorpay'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-razorpay-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    const isValid = await verifyWebhookSignature(body, signature)
    if (!isValid) {
      console.error('Razorpay webhook: signature verification failed (webhook secret may not be configured)')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(body)
    const payload = event.payload?.payment?.entity

    if (!payload?.order_id) {
      return NextResponse.json({ received: true })
    }

    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId: payload.order_id },
    })

    if (!payment) {
      return NextResponse.json({ received: true })
    }

    switch (event.event) {
      case 'payment.captured':
        if (payment.status === 'CREATED') {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              razorpayPaymentId: payload.id,
              status: 'CAPTURED',
              method: payload.method,
              capturedAt: new Date(),
            },
          })
        }
        break

      case 'payment.failed':
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'FAILED',
            errorDescription: payload.error_description || 'Payment failed',
          },
        })
        break

      case 'refund.processed':
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'REFUNDED' },
        })
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Razorpay webhook error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

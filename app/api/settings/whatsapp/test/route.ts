import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { testWhatsAppConnection } from '@/lib/whatsapp'

export async function POST() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const result = await testWhatsAppConnection()

    if (result.success) {
      return NextResponse.json({
        success: true,
        phone: result.phone,
        verifiedName: result.verifiedName,
        message: 'WhatsApp connection is working',
      })
    }

    return NextResponse.json({
      success: false,
      error: result.error,
      message: 'WhatsApp connection failed',
    })
  } catch (error) {
    console.error('Test WhatsApp connection error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

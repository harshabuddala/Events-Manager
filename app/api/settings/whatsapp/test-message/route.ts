import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { sendTextMessage, sendTemplateMessage, formatPhone, getWhatsAppConfig } from '@/lib/whatsapp'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { phone, message, templateName } = body

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    const formattedPhone = formatPhone(phone)
    const config = await getWhatsAppConfig()

    // If a templateName is provided, send a template message directly
    if (templateName) {
      const result = await sendTemplateMessage(formattedPhone, templateName, 'en_US')
      if (result.success) {
        return NextResponse.json({
          success: true,
          messageId: result.messageId,
          method: 'template',
          message: `Template "${templateName}" sent to ${formattedPhone}`,
        })
      }
      return NextResponse.json({
        success: false,
        error: result.error,
        message: `Failed to send template "${templateName}"`,
      }, { status: 500 })
    }

    const testMessage = message || `🧪 Test message from Edunura Events\n\nThis is a test message to verify your WhatsApp Business API connection is working correctly.\n\nIf you received this, your WhatsApp integration is configured properly! ✅\n\n_Sent by: ${session.name}_`

    // Try free-form text first
    const textResult = await sendTextMessage(formattedPhone, testMessage)

    if (textResult.success) {
      return NextResponse.json({
        success: true,
        messageId: textResult.messageId,
        method: 'text',
        message: `Test message sent to ${formattedPhone}`,
      })
    }

    // Free-form text failed (likely test account / no 24hr session window).
    // Fall back to Meta's built-in sample template which works on all test accounts.
    console.warn(`Free-form text failed (${textResult.error}). Falling back to sample template.`)

    const sampleTemplate = 'hello_world'
    const templateResult = await sendTemplateMessage(formattedPhone, sampleTemplate, 'en_US')

    if (templateResult.success) {
      return NextResponse.json({
        success: true,
        messageId: templateResult.messageId,
        method: 'template_fallback',
        message: `Test message sent to ${formattedPhone} via template (free-form text requires a 24hr session window — add this number as a test recipient in Meta Console for full support)`,
      })
    }

    return NextResponse.json({
      success: false,
      error: textResult.error,
      templateError: templateResult.error,
      message: 'Failed to send test message. Ensure the recipient number is added in Meta Developer Console → WhatsApp → API Setup → To field.',
    }, { status: 500 })
  } catch (error) {
    console.error('Test message error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

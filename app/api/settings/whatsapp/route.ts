import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { clearWhatsAppConfigCache } from '@/lib/whatsapp'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const config = await prisma.whatsAppConfig.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    })

    if (!config) {
      return NextResponse.json({ config: null })
    }

    return NextResponse.json({
      config: {
        id: config.id,
        phoneNumberId: config.phoneNumberId,
        accessToken: config.accessToken.slice(0, 8) + '••••••••' + config.accessToken.slice(-4),
        apiVersion: config.apiVersion,
        businessAccountId: config.businessAccountId,
        autoSendOnRegistration: config.autoSendOnRegistration,
        registrationMessageTemplate: config.registrationMessageTemplate,
        reportMessageTemplate: config.reportMessageTemplate,
        isActive: config.isActive,
      },
    })
  } catch (error) {
    console.error('Get WhatsApp config error:', error instanceof Error ? error.message : 'Unknown')
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
    const {
      phoneNumberId, accessToken, apiVersion, businessAccountId,
      autoSendOnRegistration, registrationMessageTemplate, reportMessageTemplate,
    } = body

    if (!phoneNumberId || !accessToken) {
      return NextResponse.json({ error: 'Phone Number ID and Access Token are required' }, { status: 400 })
    }

    const existing = await prisma.whatsAppConfig.findFirst({ where: { isActive: true } })

    if (existing) {
      await prisma.whatsAppConfig.update({
        where: { id: existing.id },
        data: {
          phoneNumberId,
          accessToken,
          apiVersion: apiVersion || 'v18.0',
          businessAccountId: businessAccountId || null,
          autoSendOnRegistration: autoSendOnRegistration ?? false,
          registrationMessageTemplate: registrationMessageTemplate || null,
          reportMessageTemplate: reportMessageTemplate || null,
        },
      })
    } else {
      await prisma.whatsAppConfig.create({
        data: {
          phoneNumberId,
          accessToken,
          apiVersion: apiVersion || 'v18.0',
          businessAccountId: businessAccountId || null,
          autoSendOnRegistration: autoSendOnRegistration ?? false,
          registrationMessageTemplate: registrationMessageTemplate || null,
          reportMessageTemplate: reportMessageTemplate || null,
          isActive: true,
        },
      })
    }

    clearWhatsAppConfigCache()

    return NextResponse.json({ success: true, message: 'WhatsApp configuration saved' })
  } catch (error) {
    console.error('Save WhatsApp config error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

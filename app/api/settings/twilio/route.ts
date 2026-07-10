import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const config = await prisma.twilioConfig.findFirst()
    return NextResponse.json({ config })
  } catch (error) {
    console.error('Fetch Twilio config error:', error)
    return NextResponse.json({ error: 'Failed to fetch configuration' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      accountSid,
      authToken,
      whatsAppFrom,
      autoSendOnRegistration,
      registrationContentSid,
      reportContentSid,
      isActive,
    } = body

    const existingConfig = await prisma.twilioConfig.findFirst()

    let config
    if (existingConfig) {
      config = await prisma.twilioConfig.update({
        where: { id: existingConfig.id },
        data: {
          accountSid,
          authToken,
          whatsAppFrom,
          autoSendOnRegistration,
          registrationContentSid,
          reportContentSid,
          isActive,
        },
      })
    } else {
      config = await prisma.twilioConfig.create({
        data: {
          accountSid,
          authToken,
          whatsAppFrom,
          autoSendOnRegistration,
          registrationContentSid,
          reportContentSid,
          isActive,
        },
      })
    }

    return NextResponse.json({ config })
  } catch (error) {
    console.error('Update Twilio config error:', error)
    return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 })
  }
}

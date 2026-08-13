import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadMedia, sendDocumentMessage, sendTextMessage } from '@/lib/whatsapp/dispatcher'
import { generateIdCardPdf } from '@/lib/id-card-pdf'
import { formatPhone } from '@/lib/whatsapp/messages'

async function handleSendIdCard(phone: string, student: any, registration: any) {
  console.log('[Twilio Webhook] Generating PDF for:', student.name)
  const pdfBuffer = await generateIdCardPdf({
    student: {
      name: student.name,
      rollNumber: student.rollNumber,
      grade: student.grade,
      parentName: student.parentName,
    },
    event: {
      name: registration.event.name,
    },
    qrToken: registration.qrToken || '',
  })
  
  console.log('[Twilio Webhook] PDF generated, uploading...')
  const filename = `${student.rollNumber}-idcard.pdf`
  const mediaUrl = await uploadMedia(pdfBuffer, 'application/pdf', filename)
  console.log('[Twilio Webhook] Media uploaded at:', mediaUrl)
  
  const sendResult = await sendDocumentMessage(
    phone, 
    mediaUrl, 
    `Here is the ID card for ${student.name}!`, 
    filename,
    { eventId: registration.eventId, studentId: student.id }
  )
  console.log(`[Twilio Webhook] Send result for ${student.name}:`, sendResult)
  return sendResult
}

export async function POST(req: Request) {
  try {
    const text = await req.text()
    const params = new URLSearchParams(text)
    
    const buttonPayload = params.get('ButtonPayload')
    const fromStr = params.get('From')
    const body = params.get('Body')
    
    console.log('[Twilio Webhook] Received:', { buttonPayload, fromStr, body })
    
    if (!fromStr) {
      console.log('[Twilio Webhook] No From field, ignoring')
      return new NextResponse('<Response></Response>', {
        status: 200,
        headers: { 'Content-Type': 'application/xml' },
      })
    }

    const phone = formatPhone(fromStr)
    const phoneSearch = phone.length >= 10 ? phone.slice(-10) : phone
    console.log('[Twilio Webhook] Formatted phone:', phone, '| Search term:', phoneSearch)

    const bodyClean = body?.toLowerCase().trim() || ''
    
    if (buttonPayload === 'get_id_card' || bodyClean === 'get id card') {
      console.log('[Twilio Webhook] get_id_card triggered, looking up student...')
      
      const students = await prisma.student.findMany({
        where: {
          OR: [
            { phoneNumber: { contains: phoneSearch } },
            { parentPhone: { contains: phoneSearch } }
          ]
        },
        include: {
          registrations: {
            include: { event: true },
            orderBy: { registeredAt: 'desc' },
          }
        }
      })
      
      console.log(`[Twilio Webhook] Found ${students.length} students for phone ${phone}`)
      
      // Flatten all registrations
      const allRegs: Array<{ student: typeof students[0]; registration: typeof students[0]['registrations'][0] }> = []
      for (const s of students) {
        for (const r of s.registrations) {
          allRegs.push({ student: s, registration: r })
        }
      }

      if (allRegs.length > 0) {
        for (const { student, registration } of allRegs) {
          await handleSendIdCard(phone, student, registration)
        }
      } else {
        console.log('[Twilio Webhook] No student/registration found, sending error message')
        await sendTextMessage(phone, "Sorry, we couldn't find a registration associated with this phone number.", { messageType: 'ERROR_NO_REGISTRATION' })
      }
    } else if (buttonPayload === 'more_info') {
      await sendTextMessage(phone, "For more information about the EduNura Kids Learning Carnival, please visit our website or reply to this message with your specific questions!")
    } else if (buttonPayload === 'get_help') {
      await sendTextMessage(phone, "Our support team has been notified and will get back to you shortly. In the meantime, feel free to drop your questions here.")
    } else if (buttonPayload === 'get_brochure' || bodyClean === 'get brochure' || buttonPayload === 'Get Brochure' || bodyClean === 'get_brochure') {
      console.log('[Twilio Webhook] get_brochure triggered for phone:', phoneSearch)
      
      // Update CampaignContact if exists
      try {
        const contact = await prisma.campaignContact.findFirst({
          where: { phone: { contains: phoneSearch } }
        })
        if (contact) {
          await prisma.campaignContact.update({
            where: { id: contact.id },
            data: { hasResponded: true }
          })
          console.log('[Twilio Webhook] Updated campaign contact response status for:', phoneSearch)
        }
      } catch (err) {
        console.error('[Twilio Webhook] Failed to update campaign contact:', err)
      }

      // Return TwiML with the PDF Media
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>
    <Body>Here is the Edunura Kids Learning Carnival brochure!</Body>
    <Media>https://powerlineenergysolutions.com/wp-content/uploads/2026/08/edunura_work-1-1.pdf</Media>
  </Message>
</Response>`,
        {
          status: 200,
          headers: { 'Content-Type': 'application/xml' },
        }
      )
    } else {
      console.log('[Twilio Webhook] Unhandled buttonPayload:', buttonPayload, '| body:', body)
    }

    // Twilio expects a 200 OK
    return new NextResponse('<Response></Response>', {
      status: 200,
      headers: { 'Content-Type': 'application/xml' },
    })
  } catch (error) {
    console.error('[Twilio Webhook] Error:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

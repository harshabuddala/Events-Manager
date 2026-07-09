import { prisma } from './prisma'

interface WhatsAppConfig {
  phoneNumberId: string
  accessToken: string
  apiVersion: string
  businessAccountId?: string | null
  autoSendOnRegistration: boolean
  registrationMessageTemplate: string | null
  reportMessageTemplate: string | null
}

let cachedConfig: WhatsAppConfig | null = null
let configCacheTime = 0
const CONFIG_CACHE_TTL = 60_000

export async function getWhatsAppConfig(): Promise<WhatsAppConfig | null> {
  const now = Date.now()
  if (cachedConfig && now - configCacheTime < CONFIG_CACHE_TTL) {
    return cachedConfig
  }

  const config = await prisma.whatsAppConfig.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: 'desc' },
  })

  if (!config) return null

  cachedConfig = {
    phoneNumberId: config.phoneNumberId,
    accessToken: config.accessToken,
    apiVersion: config.apiVersion,
    businessAccountId: config.businessAccountId,
    autoSendOnRegistration: config.autoSendOnRegistration,
    registrationMessageTemplate: config.registrationMessageTemplate,
    reportMessageTemplate: config.reportMessageTemplate,
  }
  configCacheTime = now

  return cachedConfig
}

export function clearWhatsAppConfigCache() {
  cachedConfig = null
  configCacheTime = 0
}

async function getApiBase(): Promise<string> {
  const config = await getWhatsAppConfig()
  if (!config) throw new Error('WhatsApp is not configured. Please set up WhatsApp in Settings.')
  return `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}`
}

async function getAuthHeader(): Promise<string> {
  const config = await getWhatsAppConfig()
  if (!config) throw new Error('WhatsApp is not configured.')
  return `Bearer ${config.accessToken}`
}

export async function testWhatsAppConnection(): Promise<{ success: boolean; phone?: string; verifiedName?: string; error?: string }> {
  try {
    const config = await getWhatsAppConfig()
    if (!config) return { success: false, error: 'WhatsApp is not configured' }

    const url = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}`
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${config.accessToken}` },
    })

    if (!res.ok) {
      const err = await res.json()
      return { success: false, error: err.error?.message || `HTTP ${res.status}` }
    }

    const data = await res.json()
    return {
      success: true,
      phone: data.verified_name || data.display_phone_number,
      verifiedName: data.verified_name,
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function uploadMedia(buffer: Buffer, mimeType: string, filename: string): Promise<string> {
  const config = await getWhatsAppConfig()
  if (!config) throw new Error('WhatsApp is not configured')

  const formData = new FormData()
  const uint8Array = new Uint8Array(buffer)
  formData.append('file', new Blob([uint8Array], { type: mimeType }), filename)
  formData.append('messaging_product', 'whatsapp')
  formData.append('type', mimeType)

  const res = await fetch(`https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/media`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${config.accessToken}` },
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Media upload failed: ${err.error?.message || res.status}`)
  }

  const data = await res.json()
  return data.id
}

export async function sendImageMessage(to: string, mediaId: string, caption?: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const base = await getApiBase()
    const auth = await getAuthHeader()

    const body: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      to,
      type: 'image',
      image: { id: mediaId },
    }

    if (caption) {
      (body.image as Record<string, unknown>).caption = caption
    }

    const res = await fetch(`${base}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': auth,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.json()
      return { success: false, error: err.error?.message || `HTTP ${res.status}` }
    }

    const data = await res.json()
    return { success: true, messageId: data.messages?.[0]?.id }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function sendDocumentMessage(to: string, mediaId: string, caption?: string, filename?: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const base = await getApiBase()
    const auth = await getAuthHeader()

    const body: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      to,
      type: 'document',
      document: { id: mediaId },
    }

    if (caption) {
      (body.document as Record<string, unknown>).caption = caption
    }
    if (filename) {
      (body.document as Record<string, unknown>).filename = filename
    }

    const res = await fetch(`${base}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': auth,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.json()
      return { success: false, error: err.error?.message || `HTTP ${res.status}` }
    }

    const data = await res.json()
    return { success: true, messageId: data.messages?.[0]?.id }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function sendTextMessage(to: string, text: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const base = await getApiBase()
    const auth = await getAuthHeader()

    const res = await fetch(`${base}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': auth,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      return { success: false, error: err.error?.message || `HTTP ${res.status}` }
    }

    const data = await res.json()
    return { success: true, messageId: data.messages?.[0]?.id }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function sendTemplateMessage(
  to: string,
  templateName: string,
  languageCode: string = 'en',
  components?: Array<{ type: string; parameters: Array<{ type: string; text?: string; image?: { id: string } }> }>
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const base = await getApiBase()
    const auth = await getAuthHeader()

    const body: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
      },
    }

    if (components && components.length > 0) {
      (body.template as Record<string, unknown>).components = components
    }

    const res = await fetch(`${base}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': auth,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.json()
      return { success: false, error: err.error?.message || `HTTP ${res.status}` }
    }

    const data = await res.json()
    return { success: true, messageId: data.messages?.[0]?.id }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function sendRegistrationMessage(
  phone: string,
  parentName: string,
  studentName: string,
  eventName: string,
  rollNumber: string,
  qrImageBuffer: Buffer
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const config = await getWhatsAppConfig()
  if (!config) return { success: false, error: 'WhatsApp is not configured' }

  const caption = `Hi ${parentName}, your child ${studentName} has been registered for ${eventName}.\n\nRoll Number: ${rollNumber}\n\nPresent this QR code at the event entry.`

  const mediaId = await uploadMedia(qrImageBuffer, 'image/png', `${rollNumber}-qr.png`)

  return sendImageMessage(phone, mediaId, caption)
}

export async function sendIdCardMessage(
  phone: string,
  parentName: string,
  studentName: string,
  eventName: string,
  rollNumber: string,
  grade: string,
  eventDate: string,
  communityName: string,
  registrationCode: string,
  idCardPdfBuffer: Buffer
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const config = await getWhatsAppConfig()
  if (!config) return { success: false, error: 'WhatsApp is not configured' }

  const defaultTemplate = `Hi {parentName} 👋

Your child *{studentName}* has been successfully registered for *{eventName}*.

📋 *Registration Details:*
• Roll Number: {rollNumber}
• Class: {grade}
• Event Date: {eventDate}
• Community: {communityName}

🎫 Please find the ID card attached below. Present it at the event entry.

_Powered by Edunura Events_`

  const template = config.registrationMessageTemplate || defaultTemplate

  const caption = template
    .replace(/\{parentName\}/g, parentName)
    .replace(/\{studentName\}/g, studentName)
    .replace(/\{eventName\}/g, eventName)
    .replace(/\{rollNumber\}/g, rollNumber)
    .replace(/\{eventDate\}/g, eventDate)
    .replace(/\{communityName\}/g, communityName)
    .replace(/\{registrationCode\}/g, registrationCode)
    .replace(/\{grade\}/g, grade)

  const mediaId = await uploadMedia(idCardPdfBuffer, 'application/pdf', `${rollNumber}-id-card.pdf`)

  return sendDocumentMessage(phone, mediaId, caption, `${rollNumber}-id-card.pdf`)
}

export async function sendReportMessage(
  phone: string,
  parentName: string,
  studentName: string,
  eventName: string,
  totalStalls: number,
  visitedStalls: number,
  avgScore: number,
  grade: string,
  rollNumber: string,
  reportPdfBuffer?: Buffer
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const config = await getWhatsAppConfig()
  if (!config) return { success: false, error: 'WhatsApp is not configured' }

  const defaultTemplate = `Hi {parentName} 👋

Here's the assessment report for *{studentName}* at *{eventName}*.

📊 *Assessment Summary:*
• Stalls Completed: {visitedStalls}/{totalStalls}
• Overall Score: {avgScore}/10
• Grade: {grade}

⭐ *Performance Rating:* {avgScore}/10

Thank you for participating in Edunura Events! 🎓`

  const template = config.reportMessageTemplate || defaultTemplate

  const text = template
    .replace(/\{parentName\}/g, parentName)
    .replace(/\{studentName\}/g, studentName)
    .replace(/\{eventName\}/g, eventName)
    .replace(/\{rollNumber\}/g, rollNumber)
    .replace(/\{totalStalls\}/g, String(totalStalls))
    .replace(/\{visitedStalls\}/g, String(visitedStalls))
    .replace(/\{avgScore\}/g, String(avgScore))
    .replace(/\{grade\}/g, grade)

  if (reportPdfBuffer) {
    const mediaId = await uploadMedia(reportPdfBuffer, 'application/pdf', `${rollNumber}-report-card.pdf`)
    return sendDocumentMessage(phone, mediaId, text, `${rollNumber}-report-card.pdf`)
  }

  return sendTextMessage(phone, text)
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, '')
  if (cleaned.startsWith('+')) return cleaned.slice(1)
  if (cleaned.startsWith('91') && cleaned.length === 12) return cleaned
  if (cleaned.length === 10) return `91${cleaned}`
  return cleaned
}

export async function autoSendOnRegistration(registration: {
  student: { name: string; rollNumber: string; grade: string; phoneNumber?: string | null; parentName?: string | null }
  event: { name: string; date: Date | string; community?: { name: string } | null }
  registrationCode: string
  qrToken: string
}): Promise<void> {
  try {
    const config = await getWhatsAppConfig()
    if (!config || !config.autoSendOnRegistration) return

    const phone = registration.student.phoneNumber
    if (!phone) return

    const formattedPhone = formatPhone(phone)

    const eventDate = new Date(registration.event.date).toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    const { generateIdCardPdf } = await import('./id-card-pdf')

    const idCardPdfBuffer = await generateIdCardPdf({
      student: {
        name: registration.student.name,
        rollNumber: registration.student.rollNumber,
        grade: registration.student.grade,
        parentName: registration.student.parentName,
      },
      event: {
        name: registration.event.name,
      },
      qrToken: registration.qrToken,
    })

    await sendIdCardMessage(
      formattedPhone,
      registration.student.parentName || 'Parent',
      registration.student.name,
      registration.event.name,
      registration.student.rollNumber,
      registration.student.grade,
      eventDate,
      registration.event.community?.name || '',
      registration.registrationCode,
      idCardPdfBuffer
    )

    console.log(`WhatsApp auto-sent ID card to ${formattedPhone} for ${registration.student.name}`)
  } catch (error) {
    console.error('Auto-send WhatsApp failed:', error instanceof Error ? error.message : 'Unknown error')
  }
}

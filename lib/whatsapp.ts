import { prisma } from './prisma'

interface WhatsAppConfig {
  phoneNumberId: string
  accessToken: string
  apiVersion: string
  businessAccountId?: string | null
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

export async function sendReportMessage(
  phone: string,
  parentName: string,
  studentName: string,
  eventName: string,
  totalStalls: number,
  visitedStalls: number,
  avgScore: number,
  grade: string,
  summaryImageBuffer?: Buffer
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const config = await getWhatsAppConfig()
  if (!config) return { success: false, error: 'WhatsApp is not configured' }

  const text = `📊 Report Card — ${studentName}\n\n` +
    `Event: ${eventName}\n` +
    `Stalls Completed: ${visitedStalls}/${totalStalls}\n` +
    `Overall Score: ${avgScore}/10\n` +
    `Grade: ${grade}\n\n` +
    `Thank you for participating in Edunura Events!`

  if (summaryImageBuffer) {
    const mediaId = await uploadMedia(summaryImageBuffer, 'image/png', `${studentName}-report.png`)
    return sendImageMessage(phone, mediaId, text)
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

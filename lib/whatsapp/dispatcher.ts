import { getTwilioConfig, type TwilioConfig } from './config'
import { TwilioProvider } from './providers/twilio'
import { prisma } from '../prisma'
import type {
  SendResult,
  SendTemplateWithMediaParams,
  TestConnectionResult,
  WhatsAppProvider,
} from './types'

let cachedProvider: WhatsAppProvider | null = null
let cachedProviderConfigId: string | null = null

function buildProvider(config: TwilioConfig): WhatsAppProvider {
  return new TwilioProvider(config)
}

export async function getProvider(): Promise<WhatsAppProvider> {
  const config = await getTwilioConfig()
  if (!config) {
    throw new Error('Twilio is not configured. Please set up Twilio in Settings.')
  }
  if (cachedProvider && cachedProviderConfigId === config.id) {
    return cachedProvider
  }
  cachedProvider = buildProvider(config)
  cachedProviderConfigId = config.id
  return cachedProvider
}

export function clearProviderCache() {
  cachedProvider = null
  cachedProviderConfigId = null
}

export async function testWhatsAppConnection(): Promise<TestConnectionResult> {
  const config = await getTwilioConfig()
  if (!config) return { success: false, error: 'Twilio is not configured' }
  return buildProvider(config).testConnection()
}

export interface ProviderDiagnostics {
  provider: 'TWILIO'
  warnings: string[]
}

export async function getProviderDiagnostics(): Promise<ProviderDiagnostics | null> {
  const config = await getTwilioConfig()
  if (!config) return null
  const warnings: string[] = []
  const appUrl =
    process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || ''
  if (!appUrl) {
    warnings.push(
      'APP_URL is not set — Twilio will default to http://localhost:8472, which is unreachable from the public internet. Set APP_URL to a public domain (or use ngrok).',
    )
  } else if (/localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(appUrl)) {
    warnings.push(
      `APP_URL is ${appUrl} — Twilio cannot reach localhost. Use a public URL or tunnel (ngrok, cloudflared) to send media.`,
    )
  }
  return { provider: 'TWILIO', warnings }
}

export async function uploadMedia(
  buffer: Buffer,
  mimeType: string,
  filename: string,
): Promise<string> {
  const provider = await getProvider()
  return provider.uploadMedia(buffer, mimeType, filename)
}

async function logMessage(
  to: string,
  result: SendResult,
  messageType: string,
  metadata?: { eventId?: string; studentId?: string }
) {
  try {
    await prisma.whatsAppLog.create({
      data: {
        eventId: metadata?.eventId || null,
        studentId: metadata?.studentId || null,
        phoneNumber: to,
        status: result.success ? 'SUCCESS' : 'FAILED',
        messageType,
        errorMessage: result.error || null,
        messageId: result.messageId || null,
      }
    })
  } catch (err) {
    console.error('[WhatsApp Logging] Failed to save log to DB:', err)
  }
}

export async function sendImageMessage(
  to: string,
  mediaId: string,
  caption?: string,
  metadata?: { eventId?: string; studentId?: string }
): Promise<SendResult> {
  let result: SendResult
  try {
    result = await (await getProvider()).sendImageMessage(to, mediaId, caption)
  } catch (error) {
    result = { success: false, error: error instanceof Error ? error.message : String(error) }
  }
  await logMessage(to, result, 'IMAGE_MESSAGE', metadata)
  return result
}

export async function sendDocumentMessage(
  to: string,
  mediaId: string,
  caption?: string,
  filename?: string,
  metadata?: { eventId?: string; studentId?: string }
): Promise<SendResult> {
  let result: SendResult
  try {
    result = await (await getProvider()).sendDocumentMessage(to, mediaId, caption, filename)
  } catch (error) {
    result = { success: false, error: error instanceof Error ? error.message : String(error) }
  }
  await logMessage(to, result, 'DOCUMENT_MESSAGE', metadata)
  return result
}

export async function sendTextMessage(
  to: string, 
  text: string,
  metadata?: { eventId?: string; studentId?: string; messageType?: string }
): Promise<SendResult> {
  let result: SendResult
  try {
    result = await (await getProvider()).sendTextMessage(to, text)
  } catch (error) {
    result = { success: false, error: error instanceof Error ? error.message : String(error) }
  }
  await logMessage(to, result, metadata?.messageType || 'TEXT_MESSAGE', metadata)
  return result
}

export async function sendTemplateWithMedia(
  params: SendTemplateWithMediaParams,
  metadata?: { eventId?: string; studentId?: string }
): Promise<SendResult> {
  let result: SendResult
  try {
    result = await (await getProvider()).sendTemplateWithMedia(params)
  } catch (error) {
    result = { success: false, error: error instanceof Error ? error.message : String(error) }
  }
  await logMessage(params.to, result, `TEMPLATE_${params.kind}`, metadata)
  return result
}

import { promises as fs } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import twilio from 'twilio'
import type { Twilio } from 'twilio'
import type {
  SendResult,
  SendTemplateWithMediaParams,
  TestConnectionResult,
  WhatsAppProvider,
} from '../types'
import type { TwilioConfig } from '../config'

const MEDIA_DIR = path.join(process.cwd(), 'uploads', 'twilio-media')
const MEDIA_TTL_MS = 5 * 60 * 1000 // auto-delete uploaded media after 5 min

function getPublicBaseUrl(): string {
  return (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:8472'
  ).replace(/\/+$/, '')
}

function isPublicUrlReachable(): { reachable: boolean; reason?: string } {
  const base = getPublicBaseUrl()
  if (!process.env.APP_URL && !process.env.NEXT_PUBLIC_APP_URL) {
    return {
      reachable: false,
      reason: 'APP_URL is not set — Twilio will use http://localhost:8472 which is unreachable from the public internet.',
    }
  }
  if (/localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(base)) {
    return {
      reachable: false,
      reason: `APP_URL is set to ${base}. Twilio cannot fetch media from your local machine. Use a tunnel (e.g. ngrok) or deploy to a public host.`,
    }
  }
  return { reachable: true }
}

function extFromMime(mimeType: string): string {
  if (mimeType.includes('pdf')) return 'pdf'
  if (mimeType.includes('png')) return 'png'
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpg'
  if (mimeType.includes('webp')) return 'webp'
  return 'bin'
}

async function writePublicFile(
  buffer: Buffer,
  filename: string,
): Promise<{ url: string; filepath: string }> {
  await fs.mkdir(MEDIA_DIR, { recursive: true })
  const filepath = path.join(MEDIA_DIR, filename)
  await fs.writeFile(filepath, buffer)
  const url = `${getPublicBaseUrl()}/twilio-media/${filename}`
  return { url, filepath }
}

function scheduleCleanup(filepath: string) {
  setTimeout(() => {
    fs.unlink(filepath).catch(() => {})
  }, MEDIA_TTL_MS).unref()
}

function normalizeTo(to: string): string {
  const digits = to.replace(/[^\d+]/g, '')
  const cleaned = digits.startsWith('+') ? digits.slice(1) : digits
  return `whatsapp:+${cleaned}`
}

function normalizeFrom(from: string): string {
  return from.startsWith('whatsapp:') ? from : `whatsapp:${from.startsWith('+') ? from : `+${from}`}`
}

export class TwilioProvider implements WhatsAppProvider {
  private client: Twilio | null = null

  constructor(private readonly config: TwilioConfig) {}

  private getClient(): Twilio {
    if (!this.config.accountSid || !this.config.authToken) {
      throw new Error('Twilio WhatsApp: accountSid / authToken are not configured')
    }
    if (!this.client) {
      this.client = twilio(this.config.accountSid, this.config.authToken)
    }
    return this.client
  }

  private get from(): string {
    if (!this.config.whatsAppFrom) {
      throw new Error('Twilio WhatsApp: whatsAppFrom is not configured')
    }
    return normalizeFrom(this.config.whatsAppFrom)
  }

  async testConnection(): Promise<TestConnectionResult> {
    try {
      if (!this.config.accountSid || !this.config.authToken) {
        return { success: false, error: 'Twilio credentials are not configured' }
      }
      const account = await this.getClient().api.v2010
        .accounts(this.config.accountSid)
        .fetch()
      return {
        success: true,
        phone: this.config.whatsAppFrom || undefined,
        verifiedName: account.friendlyName || account.status || undefined,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async uploadMedia(buffer: Buffer, mimeType: string, filename: string): Promise<string> {
    const ext = extFromMime(mimeType)
    const safeName = `${randomUUID()}.${ext}`
    const { url, filepath } = await writePublicFile(buffer, safeName)
  const reach = isPublicUrlReachable()
  if (!reach.reachable) {
    console.warn(`[Twilio] ${reach.reason} Media URL ${url} will be unreachable.`)
  }
  scheduleCleanup(filepath)
    scheduleCleanup(filepath)
    // Echo back the original filename via response header on a future fetch if needed;
    // for now the caller passes the filename again at send time.
    void filename
    return url
  }

  async sendTextMessage(to: string, text: string): Promise<SendResult> {
    try {
      const msg = await this.getClient().messages.create({
        from: this.from,
        to: normalizeTo(to),
        body: text,
      })
      return { success: true, messageId: msg.sid }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async sendImageMessage(to: string, mediaId: string, caption?: string): Promise<SendResult> {
    return this.sendMedia(to, [mediaId], caption)
  }

  async sendDocumentMessage(
    to: string,
    mediaId: string,
    caption?: string,
    filename?: string,
  ): Promise<SendResult> {
    void filename
    return this.sendMedia(to, [mediaId], caption)
  }

  async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode: string = 'en',
    components?: Array<{
      type: string
      parameters: Array<{ type: string; text?: string; image?: { id: string } }>
    }>,
  ): Promise<SendResult> {
    // Twilio templates use Content API with a contentSid and contentVariables.
    // For first cut we accept `templateName` as either:
    //   - a Twilio Content SID (HX...) — used as contentSid
    //   - a free-form body text (fallback)
    void languageCode
    try {
      const variables: Record<string, string> = {}
      if (components) {
        const body = components.find(c => c.type === 'body')
        body?.parameters.forEach((p, i) => {
          if (p.text) variables[String(i + 1)] = p.text
        })
      }

      const isContentSid = /^HX[0-9a-f]{32}$/i.test(templateName)
      const msg = await this.getClient().messages.create({
        from: this.from,
        to: normalizeTo(to),
        ...(isContentSid
          ? {
              contentSid: templateName,
              ...(Object.keys(variables).length > 0
                ? { contentVariables: JSON.stringify(variables) }
                : {}),
            }
          : { body: templateName }),
      })
      return { success: true, messageId: msg.sid }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async sendTemplateWithMedia(params: SendTemplateWithMediaParams): Promise<SendResult> {
    const contentSid =
      params.kind === 'REGISTRATION'
        ? this.config.registrationContentSid
        : this.config.reportContentSid
    if (!contentSid) {
      return {
        success: false,
        error: `No Twilio Content SID configured for kind=${params.kind}. Find the HX... SID in Twilio Console → Content → Templates and paste it into WhatsApp settings.`,
      }
    }

    try {
      // Collect all template variables: body variables + (if present) button url param.
      const contentVariables: Record<string, string> = {}
      params.variables.forEach((v, i) => {
        contentVariables[String(i + 1)] = v
      })
      if (params.button) {
        contentVariables[String(params.variables.length + 1)] = params.button.urlParam
      }

      const mediaUrl = params.media
        ? [await this.uploadMedia(params.media.buffer, params.media.mimeType, params.media.filename)]
        : undefined

      const msg = await this.getClient().messages.create({
        from: this.from,
        to: normalizeTo(params.to),
        contentSid,
        contentVariables: JSON.stringify(contentVariables),
        ...(mediaUrl ? { mediaUrl } : {}),
      })
      return { success: true, messageId: msg.sid }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  private async sendMedia(
    to: string,
    mediaUrl: string[],
    caption?: string,
  ): Promise<SendResult> {
    try {
      const msg = await this.getClient().messages.create({
        from: this.from,
        to: normalizeTo(to),
        ...(caption ? { body: caption } : {}),
        mediaUrl,
      })
      return { success: true, messageId: msg.sid }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}

import Razorpay from 'razorpay'
import crypto from 'crypto'
import { prisma } from './prisma'

interface RazorpayCredentials {
  keyId: string
  keySecret: string
  webhookSecret?: string | null
}

let cachedCredentials: RazorpayCredentials | null = null
let cacheExpiry = 0

async function getCredentials(): Promise<RazorpayCredentials> {
  const now = Date.now()
  if (cachedCredentials && now < cacheExpiry) return cachedCredentials

  const config = await prisma.razorpayConfig.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: 'desc' },
  })

  if (!config) {
    throw new Error('Razorpay not configured. Go to Settings → Razorpay and add your API keys.')
  }

  cachedCredentials = {
    keyId: config.keyId,
    keySecret: config.keySecret,
    webhookSecret: config.webhookSecret,
  }
  cacheExpiry = now + 60_000
  return cachedCredentials
}

export function clearRazorpayConfigCache() {
  cachedCredentials = null
  cacheExpiry = 0
}

export async function getRazorpayInstance(): Promise<Razorpay> {
  const creds = await getCredentials()
  return new Razorpay({ key_id: creds.keyId, key_secret: creds.keySecret })
}

export async function getRazorpayKeyId(): Promise<string> {
  const creds = await getCredentials()
  return creds.keyId
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

export async function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): Promise<boolean> {
  const creds = await getCredentials()
  const expectedSignature = crypto
    .createHmac('sha256', creds.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex')
  return safeEqual(expectedSignature, signature)
}

export async function verifyWebhookSignature(
  body: string,
  signature: string
): Promise<boolean> {
  const creds = await getCredentials()
  if (!creds.webhookSecret) return false
  const expectedSignature = crypto
    .createHmac('sha256', creds.webhookSecret)
    .update(body)
    .digest('hex')
  return safeEqual(expectedSignature, signature)
}

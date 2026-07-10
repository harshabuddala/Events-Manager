import { prisma } from '../prisma'

export interface TwilioConfig {
  id: string
  accountSid: string | null
  authToken: string | null
  whatsAppFrom: string | null
  autoSendOnRegistration: boolean
  registrationContentSid: string | null
  reportContentSid: string | null
  isActive: boolean
}

let cachedConfig: TwilioConfig | null = null
let configCacheTime = 0
const CONFIG_CACHE_TTL = 60_000

export async function getTwilioConfig(): Promise<TwilioConfig | null> {
  const now = Date.now()
  if (cachedConfig && now - configCacheTime < CONFIG_CACHE_TTL) {
    return cachedConfig
  }

  const config = await prisma.twilioConfig.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: 'desc' },
  })

  if (!config) return null

  cachedConfig = {
    id: config.id,
    accountSid: config.accountSid,
    authToken: config.authToken,
    whatsAppFrom: config.whatsAppFrom,
    autoSendOnRegistration: config.autoSendOnRegistration,
    registrationContentSid: config.registrationContentSid,
    reportContentSid: config.reportContentSid,
    isActive: config.isActive,
  }
  configCacheTime = now

  return cachedConfig
}

export function clearTwilioConfigCache() {
  cachedConfig = null
  configCacheTime = 0
}

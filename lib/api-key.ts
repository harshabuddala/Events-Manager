import { randomBytes, createHash } from 'crypto'
import { prisma } from './prisma'

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

export function generateApiKey(): string {
  return randomBytes(32).toString('hex')
}

export async function validateApiKey(key: string): Promise<boolean> {
  const hashed = hashApiKey(key)
  const apiKey = await prisma.apiKey.findUnique({
    where: { key: hashed, isActive: true },
  })
  if (!apiKey) return false

  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  })
  return true
}

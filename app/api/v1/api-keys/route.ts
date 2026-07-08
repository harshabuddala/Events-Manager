import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withApiKey } from '@/lib/api-auth'
import { apiSuccess, apiCreated, apiError } from '@/lib/api-response'
import { generateApiKey, hashApiKey } from '@/lib/api-key'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1).max(100),
})

export const GET = withApiKey(async (request: NextRequest) => {
  const keys = await prisma.apiKey.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const masked = keys.map(k => ({
    id: k.id,
    name: k.name,
    keyPreview: `${k.key.slice(0, 8)}...${k.key.slice(-8)}`,
    isActive: k.isActive,
    lastUsedAt: k.lastUsedAt,
    createdAt: k.createdAt,
  }))

  return apiSuccess(masked)
})

export const POST = withApiKey(async (request: NextRequest) => {
  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return apiError('VALIDATION_ERROR', parsed.error.issues[0].message)

  const rawKey = generateApiKey()
  const hashedKey = hashApiKey(rawKey)

  const apiKey = await prisma.apiKey.create({
    data: { key: hashedKey, name: parsed.data.name, isActive: true },
  })

  return apiCreated({ id: apiKey.id, key: rawKey, name: parsed.data.name, message: 'Save this key — it will not be shown again' })
})

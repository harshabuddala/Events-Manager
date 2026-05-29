import { RateLimiterPrisma } from 'rate-limiter-flexible'
import { prisma } from './prisma'

export const loginRateLimiter = new RateLimiterPrisma({
  storeClient: prisma,
  tableName: 'rateLimiterFlexible',
  points: 5,
  duration: 15 * 60,
})

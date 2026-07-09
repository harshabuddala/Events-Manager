import { RateLimiterPrisma } from 'rate-limiter-flexible'
import { prisma } from './prisma'

export const loginRateLimiter = new RateLimiterPrisma({
  storeClient: prisma,
  tableName: 'rateLimiterFlexible',
  points: 5,
  duration: 15 * 60,
})

// Per-IP rate limit for the auto-login token consumption endpoint.
// Prevents a single IP from brute-forcing or flooding the auto-login flow
// (CVE-class: CSRF on GET auto-login was the original attack vector).
export const autoLoginRateLimiter = new RateLimiterPrisma({
  storeClient: prisma,
  tableName: 'rateLimiterFlexible',
  points: 10,
  duration: 60,
})

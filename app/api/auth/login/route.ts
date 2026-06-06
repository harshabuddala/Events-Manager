import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { setSession, clearSession } from '@/lib/auth'
import { compare } from 'bcryptjs'
import { z } from 'zod'
import { loginRateLimiter } from '@/lib/rate-limiter'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  // Optional portal selector: 'admin' | 'volunteer'. When omitted, falls back
  // to a user-first lookup for backward compat (the original ambiguous flow).
  portal: z.enum(['admin', 'volunteer']).optional(),
})

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() || '127.0.0.1'
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request)

  try {
    await loginRateLimiter.consume(clientIp)
  } catch {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      { status: 429 }
    )
  }

  try {
    await clearSession()
  } catch {}

  try {
    const body = await request.json()
    const result = loginSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email, password, portal } = result.data

    // Admin portal: only look up in the User table (ADMIN/MANAGER accounts).
    // Volunteer portal: only look up in the Volunteer table. This eliminates
    // the previous ambiguity where the same email could match a User OR
    // a Volunteer record.
    if (portal === 'admin') {
      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
      }
      if (!['ADMIN', 'MANAGER'].includes(user.role)) {
        // Don't leak that the email exists with a different role.
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
      }
      const valid = await compare(password, user.password)
      if (!valid) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
      }
      await setSession({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      })
      return noStoreJson({
        success: true,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      })
    }

    if (portal === 'volunteer') {
      const volunteer = await prisma.volunteer.findUnique({ where: { email } })
      if (!volunteer) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
      }
      const valid = await compare(password, volunteer.password)
      if (!valid) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
      }
      await setSession({
        id: volunteer.id,
        email: volunteer.email,
        name: volunteer.name,
        role: volunteer.role,
      })
      return noStoreJson({
        success: true,
        user: { id: volunteer.id, email: volunteer.email, name: volunteer.name, role: volunteer.role },
      })
    }

    // Backward-compatible fallback (no portal specified): check User first,
    // then Volunteer. Same ambiguity as before but preserves existing clients.
    const user = await prisma.user.findUnique({ where: { email } })
    if (user) {
      const valid = await compare(password, user.password)
      if (!valid) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
      }
      await setSession({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      })
      return noStoreJson({
        success: true,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      })
    }

    const volunteer = await prisma.volunteer.findUnique({ where: { email } })
    if (volunteer) {
      const valid = await compare(password, volunteer.password)
      if (!valid) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
      }
      await setSession({
        id: volunteer.id,
        email: volunteer.email,
        name: volunteer.name,
        role: volunteer.role,
      })
      return noStoreJson({
        success: true,
        user: { id: volunteer.id, email: volunteer.email, name: volunteer.name, role: volunteer.role },
      })
    }

    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  } catch (error) {
    console.error('Login error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function noStoreJson(body: unknown) {
  const res = NextResponse.json(body)
  res.headers.set('Cache-Control', 'no-store')
  return res
}
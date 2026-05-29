import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { setSession } from '@/lib/auth'
import { compare } from 'bcryptjs'
import { z } from 'zod'
import { RateLimiterMemory } from 'rate-limiter-flexible'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// In-memory rate limiter: 5 attempts per IP per 15 minutes
const rateLimiter = new RateLimiterMemory({
  keyPrefix: 'login_fail',
  points: 5,
  duration: 15 * 60,
})

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() || '127.0.0.1'
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request)

  try {
    await rateLimiter.consume(clientIp)
  } catch {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const result = loginSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email, password } = result.data

    // ─── Try Admin/User login first ───
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (user) {
      const valid = await compare(password, user.password)
      if (!valid) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }

      await setSession({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      })

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      })
    }

    // ─── Try Volunteer login ───
    const volunteer = await prisma.volunteer.findUnique({
      where: { email },
    })

    if (volunteer) {
      const valid = await compare(password, volunteer.password)
      if (!valid) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }

      await setSession({
        id: volunteer.id,
        email: volunteer.email,
        name: volunteer.name,
        role: volunteer.role,
      })

      return NextResponse.json({
        success: true,
        user: {
          id: volunteer.id,
          email: volunteer.email,
          name: volunteer.name,
          role: volunteer.role,
        },
      })
    }

    // ─── No account found ───
    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    )
  } catch (error) {
    console.error('Login error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
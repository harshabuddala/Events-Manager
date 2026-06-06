import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { compare } from 'bcryptjs'
import { createToken } from '@/lib/auth'
import { loginRateLimiter } from '@/lib/rate-limiter'

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() || '127.0.0.1'
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request)

  try {
    await loginRateLimiter.consume(`volunteer:${clientIp}`)
  } catch {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      { status: 429 }
    )
  }

  try {
    let body: { email?: string; password?: string } = {}
    try {
      body = await request.json()
    } catch {
      // Empty or invalid body
    }
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Find volunteer by email
    const volunteer = await prisma.volunteer.findUnique({
      where: { email },
    })

    if (!volunteer) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Verify password
    const isValidPassword = await compare(password, volunteer.password)
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Create JWT token with volunteer role
    const token = await createToken({
      id: volunteer.id,
      email: volunteer.email,
      name: volunteer.name,
      role: volunteer.role,
    })

    // Set cookie
    const response = NextResponse.json({
      success: true,
      volunteer: {
        id: volunteer.id,
        email: volunteer.email,
        name: volunteer.name,
        role: volunteer.role,
      },
    })

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Volunteer login error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
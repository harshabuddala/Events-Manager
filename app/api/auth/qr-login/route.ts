import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, setSession, createAutoLoginToken } from '@/lib/auth'

// In-memory token store for QR login (dev only — use Redis in production)
// Maps token -> { userId, userType, expiresAt }
const qrLoginTokens = new Map<string, { userId: string; userType: 'user' | 'volunteer'; expiresAt: number }>()

// Clean up expired tokens every 60 seconds
setInterval(() => {
  const now = Date.now()
  for (const [token, data] of qrLoginTokens.entries()) {
    if (data.expiresAt < now) {
      qrLoginTokens.delete(token)
    }
  }
}, 60000)

/**
 * POST /api/auth/qr-login/generate
 * Generates a temporary QR login token for the currently logged-in user.
 * Token expires in 5 minutes.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if target user is specified
    const bodyText = await request.text()
    const body = bodyText ? JSON.parse(bodyText) : {}
    const { targetUserId, targetUserType } = body

    // Generate a random token (32 chars hex)
    const token = Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('')

    if (targetUserId && targetUserType) {
      // Must be an admin or manager to generate for someone else
      if (!['ADMIN', 'MANAGER'].includes(session.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      qrLoginTokens.set(token, {
        userId: targetUserId,
        userType: targetUserType,
        expiresAt: Date.now() + 5 * 60 * 1000,
      })
    } else {
      // Determine if this is a user or volunteer
      const isVolunteer = ['VOLUNTEER', 'LEAD_EVALUATOR', 'COORDINATOR'].includes(session.role)

      qrLoginTokens.set(token, {
        userId: session.id,
        userType: isVolunteer ? 'volunteer' : 'user',
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      })
    }

    return NextResponse.json({ token })
  } catch (error) {
    console.error('QR login generate error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/auth/qr-login/validate?token=xyz
 * Validates a QR login token and returns user info.
 * Called by the scanner to check if token is valid before logging in.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    const data = qrLoginTokens.get(token)
    if (!data || data.expiresAt < Date.now()) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    // Look up user/volunteer
    if (data.userType === 'volunteer') {
      const volunteer = await prisma.volunteer.findUnique({
        where: { id: data.userId },
        select: { id: true, name: true, email: true, role: true },
      })
      if (!volunteer) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      return NextResponse.json({
        valid: true,
        user: {
          id: volunteer.id,
          name: volunteer.name,
          email: volunteer.email,
          role: volunteer.role,
        },
      })
    } else {
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        select: { id: true, name: true, email: true, role: true },
      })
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      return NextResponse.json({
        valid: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      })
    }
  } catch (error) {
    console.error('QR login validate error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/auth/qr-login/validate
 * Consumes the token and creates a session (actual login).
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    const data = qrLoginTokens.get(token)
    if (!data || data.expiresAt < Date.now()) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    // Look up and create session
    let userPayload: { id: string; email: string; name: string; role: string } | null = null

    if (data.userType === 'volunteer') {
      const volunteer = await prisma.volunteer.findUnique({
        where: { id: data.userId },
        select: { id: true, name: true, email: true, role: true },
      })
      if (volunteer) {
        userPayload = volunteer
      }
    } else {
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        select: { id: true, name: true, email: true, role: true },
      })
      if (user) {
        userPayload = user
      }
    }

    if (!userPayload) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Consume token (one-time use)
    qrLoginTokens.delete(token)

    // Create session and auto-login token
    await setSession(userPayload)
    const autoLoginToken = await createAutoLoginToken(userPayload)

    return NextResponse.json({
      success: true,
      autoLoginToken,
      user: {
        id: userPayload.id,
        name: userPayload.name,
        email: userPayload.email,
        role: userPayload.role,
      },
    })
  } catch (error) {
    console.error('QR login consume error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, createToken } from '@/lib/auth'
import { readJsonBody } from '@/lib/request'
import { randomBytes } from 'crypto'
import { z } from 'zod'

const qrTokenSchema = z.object({
  targetUserId: z.string().optional(),
  targetUserType: z.enum(['user', 'volunteer']).optional(),
}).optional()

const consumeSchema = z.object({
  token: z.string().min(1, 'Token is required'),
})

/**
 * POST /api/auth/qr-login
 * Generates a temporary QR login token for the currently logged-in user.
 * Token expires in 5 minutes.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bodyText = await request.text()
    const body = bodyText ? JSON.parse(bodyText) : {}
    const parsed = qrTokenSchema.safeParse(body)
    if (!parsed.success || !parsed.data) {
      return NextResponse.json({ error: parsed.error?.issues[0]?.message || 'Invalid body' }, { status: 400 })
    }
    const { targetUserId, targetUserType } = parsed.data

    const token = randomBytes(32).toString('hex')

    let userId = session.id
    let userType: 'user' | 'volunteer' = 'user'

    if (targetUserId && targetUserType) {
      if (!['ADMIN', 'MANAGER'].includes(session.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      userId = targetUserId
      userType = targetUserType
    } else {
      const isVolunteer = ['VOLUNTEER', 'LEAD_EVALUATOR', 'COORDINATOR'].includes(session.role)
      userType = isVolunteer ? 'volunteer' : 'user'
    }

    await prisma.authToken.create({
      data: {
        token,
        type: 'QR_LOGIN',
        userId,
        userType,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    })

    return NextResponse.json({ token })
  } catch (error) {
    console.error('QR login generate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/auth/qr-login?token=xyz
 * Validates a QR login token and returns user info.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    const tokenRecord = await prisma.authToken.findFirst({
      where: {
        token,
        type: 'QR_LOGIN',
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
    })

    if (!tokenRecord) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    if (tokenRecord.userType === 'volunteer') {
      const volunteer = await prisma.volunteer.findUnique({
        where: { id: tokenRecord.userId },
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
        where: { id: tokenRecord.userId },
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
    console.error('QR login validate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/auth/qr-login
 * Consumes the token and creates a session (actual login).
 */
export async function PUT(request: NextRequest) {
  try {
    const parsed = await readJsonBody(request, consumeSchema)
    if (!parsed.ok) return parsed.response
    const { token } = parsed.data

    const result = await prisma.authToken.updateMany({
      where: {
        token,
        type: 'QR_LOGIN',
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: {
        consumedAt: new Date(),
      },
    })

    if (result.count === 0) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    const tokenRecord = await prisma.authToken.findUnique({
      where: { token },
    })

    if (!tokenRecord) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 })
    }

    let userPayload: { id: string; email: string; name: string; role: string } | null = null

    if (tokenRecord.userType === 'volunteer') {
      const volunteer = await prisma.volunteer.findUnique({
        where: { id: tokenRecord.userId },
        select: { id: true, name: true, email: true, role: true },
      })
      if (volunteer) {
        userPayload = volunteer
      }
    } else {
      const user = await prisma.user.findUnique({
        where: { id: tokenRecord.userId },
        select: { id: true, name: true, email: true, role: true },
      })
      if (user) {
        userPayload = user
      }
    }

    if (!userPayload) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const sessionToken = await createToken(userPayload)
    const response = NextResponse.json({
      success: true,
      user: {
        id: userPayload.id,
        name: userPayload.name,
        email: userPayload.email,
        role: userPayload.role,
      },
    })
    response.cookies.set('auth-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    })
    return response
  } catch (error) {
    console.error('QR login consume error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

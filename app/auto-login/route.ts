import { NextRequest, NextResponse } from 'next/server'
import { consumeAutoLoginToken, createToken } from '@/lib/auth'

/**
 * GET /auto-login?token=xxx
 * Validates a short-lived auto-login token, sets the session cookie,
 * and redirects to the dashboard.
 * Used by QR login flow — no timing issues with cookies.
 */

function getOrigin(request: NextRequest): string {
  const proto = request.headers.get('x-forwarded-proto') || 'https'
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:8473'
  return `${proto}://${host}`
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/', getOrigin(request)))
  }

  const user = await consumeAutoLoginToken(token)
  if (!user) {
    return NextResponse.redirect(new URL('/?error=expired', getOrigin(request)))
  }

  const sessionToken = await createToken(user)
  const isSecure = process.env.NODE_ENV === 'production'

  const response = NextResponse.redirect(new URL('/dashboard', getOrigin(request)))
  response.cookies.set('auth-token', sessionToken, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  })

  return response
}

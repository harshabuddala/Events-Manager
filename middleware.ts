import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const publicPaths = ['/']
const publicPrefixes = ['/api/auth/login', '/api/auth/qr-login', '/api/volunteer/login', '/auto-login', '/_next/', '/favicon.ico', '/scan', '/api/scan']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Add security headers to all responses
  const response = NextResponse.next()
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: http:; font-src 'self'; connect-src 'self' ws: wss: http: https:")
  response.headers.set('X-DNS-Prefetch-Control', 'off')

  const isPublic = publicPaths.includes(pathname) || publicPrefixes.some(p => pathname.startsWith(p))

  // Get the auth token from cookies
  const token = request.cookies.get('auth-token')?.value
  const user = token ? await verifyToken(token) : null

  // If unauthenticated and trying to access protected route, redirect to login
  if (!isPublic && !user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // If authenticated and trying to access login page, redirect to dashboard
  if (pathname === '/' && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
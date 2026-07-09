import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const publicPaths = ['/']
const publicPrefixes = ['/api/auth/login', '/api/auth/qr-login', '/api/auth/clear-session', '/api/volunteer/login', '/api/health', '/auto-login', '/_next/', '/favicon.ico', '/api/scan', '/scan', '/r', '/public', '/api/public', '/api/v1']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isDev = process.env.NODE_ENV === 'development'

  const response = NextResponse.next()

  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-DNS-Prefetch-Control', 'off')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Permissions-Policy', 'camera=(self), microphone=(), geolocation=(), payment=(self)')
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')
  // Changed from 'same-origin' to 'same-origin-allow-popups'.
  // Razorpay opens a popup for payment processing and needs to communicate
  // back to the parent window via window.opener. 'same-origin' severs that
  // link entirely, causing the blank page bug after payment selection.
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups')
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin')

  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://unpkg.com https://checkout.razorpay.com",
    "style-src 'self' 'unsafe-inline' https://unpkg.com https://fonts.googleapis.com",
    "img-src 'self' blob: data: https://unpkg.com https://edunura.com https://images.unsplash.com",
    "font-src 'self' data: https://unpkg.com https://fonts.gstatic.com",
    "connect-src 'self' https: wss: blob:",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self' https:",
    "worker-src 'self' blob:",
    "child-src 'self' blob:",
    "frame-src 'self' blob: https://*.razorpay.com",
  ].join('; ')
  response.headers.set('Content-Security-Policy', csp)

  const isPublic = publicPaths.includes(pathname) || publicPrefixes.some(p => pathname.startsWith(p))

  // Apply Cache-Control: no-store to all /api/* responses (except health check)
  // to prevent browsers/proxies from caching sensitive data.
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/health')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }

  const token = request.cookies.get('auth-token')?.value
  const user = token ? await verifyToken(token) : null

  if (!isPublic && !user) {
    const redirectResponse = NextResponse.redirect(new URL('/', request.url))
    redirectResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    redirectResponse.headers.set('Pragma', 'no-cache')
    redirectResponse.headers.set('Expires', '0')
    return redirectResponse
  }

  // If user is authenticated and on login page, redirect to dashboard
  // BUT: if there is a ?token= query param, let the login page handle QR login first
  const hasQrToken = request.nextUrl.searchParams.has('token')
  if (pathname === '/' && user && !hasQrToken) {
    const redirectResponse = NextResponse.redirect(new URL('/dashboard', request.url))
    redirectResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    redirectResponse.headers.set('Pragma', 'no-cache')
    redirectResponse.headers.set('Expires', '0')
    return redirectResponse
  }

  if (pathname === '/') {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}

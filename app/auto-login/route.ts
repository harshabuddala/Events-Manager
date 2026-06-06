import { NextRequest, NextResponse } from 'next/server'
import { consumeAutoLoginToken, createToken } from '@/lib/auth'
import { autoLoginRateLimiter } from '@/lib/rate-limiter'

/**
 * Auto-login flow.
 *
 * Security notes:
 * - The previous implementation exposed this as a GET, which is hijackable
 *   via a third-party <img src="..."> tag (CSRF) and leaks the token via
 *   Referer / browser history / proxy logs. We now require POST + same-origin
 *   check (Origin/Referer must match the app's host).
 * - Per-IP rate-limit to prevent brute force / flooding.
 *
 * Endpoints:
 * - GET  /auto-login?token=xxx   → Renders a tiny HTML page that auto-POSTs
 *   to /api/auto-login. This is the entry point for QR-code scan pages.
 * - POST /api/auto-login (token in JSON body) → Consumes the token, sets
 *   the session cookie, returns { ok: true }. The caller is responsible
 *   for the final redirect.
 */

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() || '127.0.0.1'
}

function getOrigin(request: NextRequest): string {
  const proto = request.headers.get('x-forwarded-proto') || 'https'
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:8472'
  return `${proto}://${host}`
}

function safeRedirectUrl(target: string, base: string): string {
  try {
    const resolved = new URL(target, base)
    // Only allow same-origin redirects
    if (resolved.origin !== new URL(base).origin) return base
    return resolved.toString()
  } catch {
    return base
  }
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.redirect(new URL('/?error=missing_token', getOrigin(request)))
  }

  // Render a small HTML form that auto-submits the token via POST. The
  // auto-submit happens with a same-origin fetch so the cookie set by
  // /api/auto-login is accepted by the browser.
  const base = getOrigin(request)
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Signing you in…</title>
  <style>body{font-family:system-ui,sans-serif;background:#f8fafc;color:#0f172a;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:1rem}</style>
</head>
<body>
  <main style="text-align:center;max-width:24rem">
    <h1 style="font-size:1.125rem;font-weight:600">Signing you in…</h1>
    <p style="font-size:.875rem;color:#475569;margin-top:.5rem">Please wait while we complete your sign-in.</p>
    <noscript><p style="font-size:.75rem;color:#b91c1c;margin-top:1rem">JavaScript is required to complete sign-in.</p></noscript>
  </main>
  <script>
    (async function() {
      try {
        const res = await fetch('/api/auto-login', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: ${JSON.stringify(token)} }),
        })
        const data = await res.json().catch(() => ({}))
        if (res.ok && data.ok && data.redirect) {
          window.location.replace(data.redirect)
        } else {
          const reason = data && data.error ? '?error=' + encodeURIComponent(data.error) : '?error=expired'
          window.location.replace('/' + reason)
        }
      } catch (e) {
        window.location.replace('/?error=network')
      }
    })()
  </script>
</body>
</html>`
  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Referrer-Policy': 'no-referrer',
    },
  })
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request)

  try {
    await autoLoginRateLimiter.consume(clientIp)
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Too many sign-in attempts. Please try again in a minute.' },
      { status: 429 }
    )
  }

  // Same-origin / CSRF check: the POST must come from our own app
  const origin = request.headers.get('origin') || ''
  const referer = request.headers.get('referer') || ''
  const base = getOrigin(request)
  const isSameOrigin = (origin && origin === base) || (referer && referer.startsWith(base))
  if (!isSameOrigin) {
    return NextResponse.json({ ok: false, error: 'Invalid origin' }, { status: 403 })
  }

  let body: { token?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid body' }, { status: 400 })
  }
  const token = body?.token
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ ok: false, error: 'Token is required' }, { status: 400 })
  }

  const user = await consumeAutoLoginToken(token)
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Token expired or invalid' }, { status: 401 })
  }

  const sessionToken = await createToken(user)
  const isSecure = process.env.NODE_ENV === 'production'

  const response = NextResponse.json({
    ok: true,
    redirect: safeRedirectUrl('/dashboard', base),
  })
  response.cookies.set('auth-token', sessionToken, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  })
  response.headers.set('Cache-Control', 'no-store')
  return response
}

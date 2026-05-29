import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

function getSecret(): Uint8Array {
  const secretEnv = process.env.JWT_SECRET
  if (!secretEnv) {
    throw new Error('JWT_SECRET environment variable is required')
  }
  return new TextEncoder().encode(secretEnv)
}

export interface UserPayload {
  id: string
  email: string
  name: string
  role: string
}

export async function createToken(user: UserPayload) {
  return await new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getSecret())
}

export async function verifyToken(token: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as UserPayload
  } catch {
    return null
  }
}

export async function getSession(): Promise<UserPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  if (!token) return null
  return await verifyToken(token)
}

// Only use secure cookies in production (HTTPS)
const isSecure = process.env.NODE_ENV === 'production'

export async function setSession(user: UserPayload) {
  const token = await createToken(user)
  const cookieStore = await cookies()
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  })
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.set('auth-token', '', {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
}

// ─── Auto-Login Token System ───
// Used for passwordless login (QR scan, magic links).
// Short-lived JWT tokens tracked in database to prevent replay.

export async function createAutoLoginToken(user: UserPayload): Promise<string> {
  const { prisma } = await import(/* webpackIgnore: true */ './prisma')
  
  const token = await new SignJWT({ sub: user.id, email: user.email, name: user.name, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30s')
    .sign(getSecret())

  await prisma.authToken.create({
    data: {
      token,
      type: 'AUTO_LOGIN',
      userId: user.id,
      userType: user.role,
      expiresAt: new Date(Date.now() + 30 * 1000),
    },
  })

  return token
}

export async function consumeAutoLoginToken(token: string): Promise<UserPayload | null> {
  const { prisma } = await import(/* webpackIgnore: true */ './prisma')
  
  const payload = await verifyToken(token)
  if (!payload) return null

  const result = await prisma.authToken.updateMany({
    where: {
      token,
      type: 'AUTO_LOGIN',
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: {
      consumedAt: new Date(),
    },
  })

  if (result.count === 0) return null

  return payload
}

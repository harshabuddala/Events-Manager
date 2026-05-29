import { NextResponse } from 'next/server'
import { clearSession } from '@/lib/auth'

export async function POST() {
  try {
    await clearSession()
    const response = NextResponse.json({ success: true })
    response.headers.set('Cache-Control', 'no-store')
    return response
  } catch {
    const response = NextResponse.json({ success: true })
    response.headers.set('Cache-Control', 'no-store')
    return response
  }
}

// Reject request bodies larger than the given limit. Returns a NextResponse
// when the body is too large or missing, or null when the body is within
// limits. The caller is responsible for actually parsing the body.
import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_MAX_BYTES = 1 * 1024 * 1024 // 1 MB

export function checkBodySize(
  request: NextRequest,
  maxBytes: number = DEFAULT_MAX_BYTES
): NextResponse | null {
  const lengthHeader = request.headers.get('content-length')
  if (lengthHeader) {
    const length = parseInt(lengthHeader, 10)
    if (Number.isFinite(length) && length > maxBytes) {
      return NextResponse.json(
        { error: `Request body too large. Maximum allowed: ${maxBytes} bytes.` },
        { status: 413 }
      )
    }
  }
  return null
}

// Helper to safely read and parse a JSON body, enforcing both a size limit
// and a JSON shape. Returns either the parsed body or a NextResponse error.
export async function readJsonBody<T = unknown>(
  request: NextRequest,
  schema: { safeParse: (input: unknown) => { success: true; data: T } | { success: false; error: { issues: { message: string }[] } } },
  maxBytes: number = DEFAULT_MAX_BYTES
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  const tooLarge = checkBodySize(request, maxBytes)
  if (tooLarge) return { ok: false, response: tooLarge }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }),
    }
  }

  const result = schema.safeParse(body)
  if (!result.success) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: result.error.issues[0]?.message || 'Invalid request body' },
        { status: 400 }
      ),
    }
  }
  return { ok: true, data: result.data }
}

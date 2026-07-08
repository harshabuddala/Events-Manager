import { NextResponse } from 'next/server'

export function apiSuccess(data: unknown, meta?: Record<string, unknown>, status = 200) {
  return NextResponse.json(
    { success: true, data, ...(meta ? { meta } : {}) },
    { status }
  )
}

export function apiCreated(data: unknown) {
  return NextResponse.json({ success: true, data }, { status: 201 })
}

export function apiError(code: string, message: string, status = 400) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  )
}

export function apiUnauthorized(message = 'Invalid or missing API key') {
  return apiError('UNAUTHORIZED', message, 401)
}

export function apiNotFound(resource = 'Resource') {
  return apiError('NOT_FOUND', `${resource} not found`, 404)
}

export function apiForbidden(message = 'Forbidden') {
  return apiError('FORBIDDEN', message, 403)
}

export function apiPaginated(data: unknown[], page: number, limit: number, total: number) {
  return NextResponse.json({
    success: true,
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}

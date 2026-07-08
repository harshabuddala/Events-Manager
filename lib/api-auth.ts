import { NextRequest } from 'next/server'
import { validateApiKey } from './api-key'
import { apiUnauthorized } from './api-response'

type ApiHandler = (request: NextRequest, context?: unknown) => Promise<Response>

export function withApiKey(handler: ApiHandler): ApiHandler {
  return async (request: NextRequest, context?: unknown) => {
    const apiKey = request.headers.get('x-api-key')
    if (!apiKey) {
      return apiUnauthorized('Missing x-api-key header')
    }

    const isValid = await validateApiKey(apiKey)
    if (!isValid) {
      return apiUnauthorized('Invalid or inactive API key')
    }

    return handler(request, context)
  }
}

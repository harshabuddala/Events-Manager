'use client'

import { useEffect, useRef, useState } from 'react'

export default function SwaggerDocsPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState('')

  useEffect(() => {
    const storedKey = localStorage.getItem('swagger-api-key') || ''
    setApiKey(storedKey)
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    const loadSwagger = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Load CSS
        if (!document.querySelector('link[href*="swagger-ui.css"]')) {
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.href = 'https://unpkg.com/swagger-ui-dist@5/swagger-ui.css'
          document.head.appendChild(link)
        }

        // Load JS
        if (!(window as any).SwaggerUIBundle) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script')
            script.src = 'https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js'
            script.onload = () => resolve()
            script.onerror = () => reject(new Error('Failed to load Swagger UI script'))
            document.head.appendChild(script)
          })
        }

        // Initialize
        if (containerRef.current && (window as any).SwaggerUIBundle) {
          containerRef.current.innerHTML = ''
          ;(window as any).SwaggerUIBundle({
            domNode: containerRef.current,
            url: '/api/v1/docs',
            deepLinking: true,
            presets: [(window as any).SwaggerUIBundle.presets.apis, (window as any).SwaggerUIStandalonePreset],
            layout: 'BaseLayout',
            defaultModelsExpandDepth: 1,
            defaultModelExpandDepth: 1,
            docExpansion: 'list',
            filter: true,
            showRequestHeaders: true,
            tryItOutEnabled: true,
            requestInterceptor: (req: { headers: Record<string, string> }) => {
              const key = localStorage.getItem('swagger-api-key')
              if (key) {
                req.headers['x-api-key'] = key
              }
              return req
            },
          })
        }

        setIsLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load Swagger UI')
        setIsLoading(false)
      }
    }

    loadSwagger()
  }, [])

  const handleKeyChange = (value: string) => {
    setApiKey(value)
    localStorage.setItem('swagger-api-key', value)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-slate-900 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-white">Edunura API Documentation</h1>
            <p className="text-xs text-slate-400 mt-0.5">v1.0.0 — Interactive API reference</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 font-medium whitespace-nowrap">API Key:</label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => handleKeyChange(e.target.value)}
                placeholder="Enter your API key"
                className="px-3 py-1.5 text-xs font-mono bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 w-72"
              />
            </div>
            <a
              href="/settings/api"
              className="text-xs text-slate-400 hover:text-white transition-colors font-medium"
            >
              Manage Keys
            </a>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
            <p className="text-sm text-slate-500">Loading Swagger UI...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-center justify-center py-20">
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 max-w-md text-center">
            <p className="text-sm font-semibold text-rose-700 mb-2">Failed to load Swagger UI</p>
            <p className="text-xs text-rose-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Swagger UI Container */}
      <div
        ref={containerRef}
        id="swagger-ui"
        style={{ opacity: isLoading ? 0 : 1, transition: 'opacity 0.3s' }}
      />
    </div>
  )
}

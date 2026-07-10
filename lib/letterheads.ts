// Background image helpers used by the PDF generators.
// Kept separate from the @react-pdf/renderer imports so the heavy dep
// only loads when a PDF is actually generated.

let cachedReportCard: string | null = null
let cachedIdCard: string | null = null
let reportCardPromise: Promise<string> | null = null
let idCardPromise: Promise<string> | null = null

async function fetchAsBase64(path: string): Promise<string> {
  if (typeof window === 'undefined') return path
  const origin = window.location.origin
  const url = `${origin}${path}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
  }
  const blob = await response.blob()
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = (err) => reject(err)
    reader.readAsDataURL(blob)
  })
}

export const fetchReportCardImageBase64 = async (): Promise<string> => {
  if (typeof window === 'undefined') {
    try {
      const fs = await import('fs')
      const path = await import('path')
      const localPath = path.join(process.cwd(), 'public', 'report_card_design.png')
      if (fs.existsSync(localPath)) {
        const buffer = fs.readFileSync(localPath)
        return `data:image/png;base64,${buffer.toString('base64')}`
      }
    } catch (e) {
      console.error('Server-side fetchReportCardImageBase64 error:', e)
    }
    return '/report_card_design.png'
  }
  if (cachedReportCard) return cachedReportCard
  if (reportCardPromise) return reportCardPromise

  reportCardPromise = fetchAsBase64('/report_card_design.png')
    .then((base64) => {
      cachedReportCard = base64
      return base64
    })
    .catch(() => {
      reportCardPromise = null
      return `${window.location.origin}/report_card_design.png`
    })
  return reportCardPromise
}

export const fetchIdCardImageBase64 = async (): Promise<string> => {
  if (typeof window === 'undefined') {
    try {
      const fs = await import('fs')
      const path = await import('path')
      const localPath = path.join(process.cwd(), 'public', 'id_card_design.png')
      if (fs.existsSync(localPath)) {
        const buffer = fs.readFileSync(localPath)
        return `data:image/png;base64,${buffer.toString('base64')}`
      }
    } catch (e) {
      console.error('Server-side fetchIdCardImageBase64 error:', e)
    }
    return '/id_card_design.png'
  }
  if (cachedIdCard) return cachedIdCard
  if (idCardPromise) return idCardPromise

  idCardPromise = fetchAsBase64('/id_card_design.png')
    .then((base64) => {
      cachedIdCard = base64
      return base64
    })
    .catch(() => {
      idCardPromise = null
      return `${window.location.origin}/id_card_design.png`
    })
  return idCardPromise
}

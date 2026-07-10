import { NextRequest } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params

    // Security check: prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return new Response('Invalid filename', { status: 400 })
    }

    // Path to the media file in the uploads directory
    const MEDIA_DIR = path.join(process.cwd(), 'uploads', 'twilio-media')
    const filepath = path.join(MEDIA_DIR, filename)

    try {
      const fileBuffer = await fs.readFile(filepath)

      // Determine content type
      let contentType = 'application/octet-stream'
      if (filename.endsWith('.pdf')) {
        contentType = 'application/pdf'
      } else if (filename.endsWith('.png')) {
        contentType = 'image/png'
      } else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) {
        contentType = 'image/jpeg'
      } else if (filename.endsWith('.webp')) {
        contentType = 'image/webp'
      }

      return new Response(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Length': fileBuffer.length.toString(),
          'Cache-Control': 'public, max-age=300', // Cache for 5 mins (matching TTL)
        },
      })
    } catch {
      return new Response('File not found', { status: 404 })
    }
  } catch (error) {
    console.error('Error serving twilio media:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

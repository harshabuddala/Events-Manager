import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

interface RouteProps {
  params: Promise<{ code: string }>
}

// Opaque QR redirect. The QR code encodes `/r/<qrToken>` (e.g. `/r/A3F7B2D1`).
// The server looks up the registration by qrToken and redirects to
// `/scan/<qrToken>` so the URL bar never shows the registration code
// (which contains the roll-number suffix). The scan page then looks up
// by either qrToken or registrationCode.
export async function GET(_request: Request, { params }: RouteProps) {
  const { code } = await params

  if (!code || code.length > 100) {
    redirect('/?error=invalid_scan_code')
  }

  // Validate the qrToken exists
  const reg = await prisma.registration.findUnique({
    where: { qrToken: code },
    select: { id: true },
  })

  if (!reg) {
    redirect('/?error=invalid_scan_code')
  }

  redirect(`/scan/${encodeURIComponent(code)}`)
}

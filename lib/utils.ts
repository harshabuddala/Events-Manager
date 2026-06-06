import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { randomBytes } from "crypto"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate an opaque QR token (8-char hex) for a registration.
 * This keeps the registration code out of the QR URL so scanners
 * like Google Lens don't leak the roll number in the URL preview.
 */
export function generateQrToken(): string {
  return randomBytes(4).toString('hex').toUpperCase()
}

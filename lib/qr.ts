import QRCode from 'qrcode'

export const generateLogoQrCode = async (text: string, size: number = 300): Promise<string> => {
  if (typeof window === 'undefined') {
    return ''
  }
  
  return QRCode.toDataURL(text, {
    width: size,
    margin: 1,
    color: { dark: '#0a0f2d', light: '#ffffff' },
  })
}

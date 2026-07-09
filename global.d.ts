interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description?: string
  image?: string
  order_id: string
  handler: (response: RazorpayPaymentResponse) => void
  prefill?: {
    name?: string
    contact?: string
    email?: string
  }
  theme?: {
    color?: string
  }
  redirect?: boolean
  callback_url?: string
  retry?: { enabled: boolean }
  timeout?: number
  modal?: {
    ondismiss?: () => void
    confirm_close?: boolean
    escape?: boolean
    closeOnSuccess?: boolean
    backdropclose?: boolean
  }
  notes?: Record<string, string>
}

interface RazorpayPaymentResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

interface RazorpayInstance {
  open(): void
  on(event: string, handler: (response: any) => void): void
}

interface RazorpayConstructor {
  new (options: RazorpayOptions): RazorpayInstance
}

interface Window {
  Razorpay: RazorpayConstructor
}

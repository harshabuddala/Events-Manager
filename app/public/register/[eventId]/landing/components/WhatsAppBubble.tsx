'use client'
import { MessageCircle } from 'lucide-react'

export default function WhatsAppBubble() {
  const phoneNumber = '918019028822'
  const message = encodeURIComponent('Hi EduNura team, I have a question about the Kids Learning Carnival.')
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`

  return (
    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 bg-[#25D366] hover:bg-[#20bd5a] text-white p-4 rounded-full shadow-lg shadow-[#25D366]/30 transition-transform hover:scale-110 z-50 flex items-center justify-center" aria-label="Chat on WhatsApp">
      <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8" />
    </a>
  )
}

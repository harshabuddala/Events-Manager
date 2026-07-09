'use client'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  { question: 'Is this only for community residents?', answer: 'Yes, this particular carnival is a community-exclusive event designed specifically for families residing in the community.' },
  { question: 'What should my child bring?', answer: 'Just comfortable clothes, shoes for physical activities, and a water bottle! All materials for the activities will be provided.' },
  { question: 'Is the registration fee refundable if plans change?', answer: 'The nominal fee is non-refundable as it helps us arrange materials and confirm headcounts accurately.' }
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-3xl mx-auto">
        <h3 className="font-display text-3xl font-bold text-center text-brand-primary mb-8">Frequently Asked Questions</h3>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-gray-200 rounded-2xl overflow-hidden transition-all duration-200 hover:border-brand-accent/50">
              <button className="w-full px-6 py-4 flex items-center justify-between bg-white text-left focus:outline-none" onClick={() => setOpenIndex(openIndex === index ? null : index)}>
                <span className="font-bold text-gray-800">{faq.question}</span>
                <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${openIndex === index ? 'rotate-180 text-brand-accent' : ''}`} />
              </button>
              <div className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-40 pb-4 opacity-100' : 'max-h-0 opacity-0'}`}>
                <p className="text-gray-600 text-sm">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

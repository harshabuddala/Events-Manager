import { Suspense } from 'react'
import EventsPageContent from './EventsPageContent'

export const dynamic = 'force-dynamic'

export default function EventsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <EventsPageContent />
    </Suspense>
  )
}

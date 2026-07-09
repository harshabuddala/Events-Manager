export interface LandingEventData {
  id: string
  name: string
  code: string
  date: string
  endDate: string | null
  description: string | null
  registrationFee: number | null
  feeCurrency: string
  feeDescription: string | null
  isClosed: boolean
  community: {
    name: string
    location: string
  }
}

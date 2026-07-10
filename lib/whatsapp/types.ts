export interface SendResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface TestConnectionResult {
  success: boolean
  phone?: string
  verifiedName?: string
  error?: string
}

export interface TemplateComponent {
  type: string
  parameters: Array<{ type: string; text?: string; image?: { id: string } }>
}

/**
 * Canonical variable order for the registration template.
 * Admins must define their Meta / Twilio template variables in this exact order:
 *   {{1}} = parentName, {{2}} = studentName, {{3}} = eventName, {{4}} = rollNumber,
 *   {{5}} = grade, {{6}} = eventDate, {{7}} = communityName, {{8}} = registrationCode
 */
export const REGISTRATION_TEMPLATE_VARS = [
  'parentName',
  'studentName',
  'eventName',
  'rollNumber',
  'grade',
  'eventDate',
  'communityName',
  'registrationCode',
] as const

/**
 * Canonical variable order for the report template:
 *   {{1}} = parentName, {{2}} = studentName, {{3}} = eventName, {{4}} = rollNumber,
 *   {{5}} = totalStalls, {{6}} = visitedStalls, {{7}} = avgScore, {{8}} = grade
 */
export const REPORT_TEMPLATE_VARS = [
  'parentName',
  'studentName',
  'eventName',
  'rollNumber',
  'totalStalls',
  'visitedStalls',
  'avgScore',
  'grade',
] as const

export type RegistrationTemplateVar = (typeof REGISTRATION_TEMPLATE_VARS)[number]
export type ReportTemplateVar = (typeof REPORT_TEMPLATE_VARS)[number]

export type TemplateKind = 'REGISTRATION' | 'REPORT'

export interface SendTemplateWithMediaParams {
  to: string
  kind: TemplateKind
  /** Positional string values matching the canonical variable order. */
  variables: string[]
  /**
   * Optional media (PDF or image) to attach as the template's header. Omit
   * to use a button-based template that has no header.
   */
  media?: { buffer: Buffer; mimeType: string; filename: string }
  /**
   * Optional button parameters. For a single URL button, pass the URL
   * parameter (e.g. a qrToken) here. The system sends a `button` component
   * with `sub_type: "url"` and `index: "0"`.
   */
  button?: { urlParam: string }
}

export interface WhatsAppProvider {
  testConnection(): Promise<TestConnectionResult>
  uploadMedia(buffer: Buffer, mimeType: string, filename: string): Promise<string>
  sendTextMessage(to: string, text: string): Promise<SendResult>
  sendImageMessage(to: string, mediaId: string, caption?: string): Promise<SendResult>
  sendDocumentMessage(
    to: string,
    mediaId: string,
    caption?: string,
    filename?: string,
  ): Promise<SendResult>
  sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode?: string,
    components?: TemplateComponent[],
  ): Promise<SendResult>
  /**
   * Sends an approved business-initiated template message with an attached
   * media file (PDF / image). Works on first contact to the user (no 24h
   * session window required) provided the template is approved.
   */
  sendTemplateWithMedia(params: SendTemplateWithMediaParams): Promise<SendResult>
}

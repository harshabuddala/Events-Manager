import { getTwilioConfig } from './config'
import { sendTemplateWithMedia, uploadMedia, sendDocumentMessage } from './dispatcher'
import type { SendResult } from './types'

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, '')
  if (cleaned.startsWith('+')) return cleaned.slice(1)
  if (cleaned.startsWith('91') && cleaned.length === 12) return cleaned
  if (cleaned.length === 10) return `91${cleaned}`
  return cleaned
}

export async function autoSendOnRegistration(params: {
  student: { id: string; phoneNumber: string | null; parentName: string | null; name: string; rollNumber: string; grade: string };
  event: { id: string; name: string; date: Date; community?: { name: string } | null };
  registrationCode: string;
  qrToken: string;
}) {
  const config = await getTwilioConfig()
  if (!config?.autoSendOnRegistration || !params.student.phoneNumber) return

  await sendRegistrationMessage(
    params.student.phoneNumber,
    params.student.parentName || 'Parent',
    params.student.name,
    params.event.name,
    params.student.rollNumber,
    params.student.grade,
    params.event.date.toISOString(),
    params.event.community?.name ?? 'General',
    params.registrationCode,
    params.qrToken,
    { eventId: params.event.id, studentId: params.student.id }
  )
}

function hasTemplate(
  config: NonNullable<Awaited<ReturnType<typeof getTwilioConfig>>>,
  kind: 'REGISTRATION' | 'REPORT',
): boolean {
  return kind === 'REGISTRATION'
    ? !!config.registrationContentSid
    : !!config.reportContentSid
}

export async function sendRegistrationMessage(
  phone: string,
  parentName: string,
  _studentName: string,
  _eventName: string,
  _rollNumber: string,
  _grade: string,
  _eventDate: string,
  _communityName: string,
  _registrationCode: string,
  _qrToken: string,
  metadata?: { eventId?: string; studentId?: string }
): Promise<SendResult> {
  const config = await getTwilioConfig()
  if (!config) return { success: false, error: 'Twilio is not configured' }
  if (!hasTemplate(config, 'REGISTRATION')) {
    return {
      success: false,
      error: 'Twilio Content SID for registration template is not configured.',
    }
  }

  return sendTemplateWithMedia({
    to: phone,
    kind: 'REGISTRATION',
    variables: [parentName],
  }, metadata)
}

export async function sendIdCardMessage(
  phone: string,
  parentName: string,
  _studentName: string,
  _eventName: string,
  _rollNumber: string,
  _grade: string,
  _eventDate: string,
  _communityName: string,
  _registrationCode: string,
  _idCardPdfBuffer: Buffer,
  _qrToken: string,
  metadata?: { eventId?: string; studentId?: string }
): Promise<SendResult> {
  const config = await getTwilioConfig()
  if (!config) return { success: false, error: 'Twilio is not configured' }
  if (!hasTemplate(config, 'REGISTRATION')) {
    return {
      success: false,
      error: 'Twilio Content SID for registration template is not configured.',
    }
  }

  return sendTemplateWithMedia({
    to: phone,
    kind: 'REGISTRATION',
    variables: [parentName],
  }, metadata)
}

export async function sendReportMessage(
  phone: string,
  parentName: string,
  studentName: string,
  eventName: string,
  _totalStalls: number,
  _visitedStalls: number,
  _avgScore: number,
  _grade: string,
  rollNumber: string,
  reportPdfBuffer?: Buffer,
  _qrToken?: string,
  metadata?: { eventId?: string; studentId?: string }
): Promise<SendResult> {
  if (!reportPdfBuffer) {
    return { success: false, error: 'Report PDF buffer is missing' }
  }

  try {
    const filename = `${rollNumber}-report.pdf`
    const mediaUrl = await uploadMedia(reportPdfBuffer, 'application/pdf', filename)

    return sendDocumentMessage(
      phone,
      mediaUrl,
      `Hi ${parentName}, here is the report card of ${studentName} for the event "${eventName}"!`,
      filename,
      metadata
    )
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

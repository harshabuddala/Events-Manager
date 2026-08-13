import twilio from 'twilio';
import { getTwilioConfig } from './config';

export interface CampaignContactData {
  id: string;
  name: string;
  phone: string;
}

export async function sendBrochureCampaignMessage(contact: CampaignContactData, contentSid: string): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const config = await getTwilioConfig();
  if (!config || !config.accountSid || !config.authToken || !config.whatsAppFrom) {
    return { success: false, error: 'Twilio is not configured properly.' };
  }

  const client = twilio(config.accountSid, config.authToken);

  const digits = contact.phone.replace(/[^\d+]/g, '');
  const cleanedPhone = digits.startsWith('+') ? digits.slice(1) : digits;
  const to = `whatsapp:+${cleanedPhone}`;
  
  const from = config.whatsAppFrom.startsWith('whatsapp:') 
    ? config.whatsAppFrom 
    : `whatsapp:${config.whatsAppFrom.startsWith('+') ? config.whatsAppFrom : `+${config.whatsAppFrom}`}`;

  try {
    const msg = await client.messages.create({
      from,
      to,
      contentSid,
      contentVariables: JSON.stringify({
        "1": contact.name
      })
    });
    return { success: true, messageId: msg.sid };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

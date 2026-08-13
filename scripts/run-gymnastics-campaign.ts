import 'dotenv/config';
import twilio from 'twilio';
import { prisma } from '../lib/prisma';
import { getTwilioConfig } from '../lib/whatsapp/config';

// Replace this with the Twilio Template SID
const CONTENT_SID = 'HXd909c058fd34a420b04a87e8c44e15ba';

// PASTE YOUR CONTACTS HERE
// Example: { name: 'John Doe', phone: '919876543210' }
const CONTACTS = [
  { name: 'Harsha', phone: '+919398301382' }
];

async function main() {
  const config = await getTwilioConfig();
  
  if (!config || !config.accountSid || !config.authToken || !config.whatsAppFrom) {
    console.error('❌ Twilio is not configured properly.');
    process.exit(1);
  }

  const client = twilio(config.accountSid, config.authToken);
  
  const from = config.whatsAppFrom.startsWith('whatsapp:') 
    ? config.whatsAppFrom 
    : `whatsapp:${config.whatsAppFrom.startsWith('+') ? config.whatsAppFrom : `+${config.whatsAppFrom}`}`;

  console.log(`🚀 Starting Gymnastics Campaign for ${CONTACTS.length} contacts...`);
  
  let successCount = 0;
  let failCount = 0;

  for (const contact of CONTACTS) {
    try {
      const digits = contact.phone.replace(/[^\d+]/g, '');
      const cleanedPhone = digits.startsWith('+') ? digits.slice(1) : digits;
      const to = `whatsapp:+${cleanedPhone}`;

      const msg = await client.messages.create({
        from,
        to,
        contentSid: CONTENT_SID,
        contentVariables: JSON.stringify({
          "1": contact.name
        })
      });
      
      console.log(`✅ Sent to ${contact.name} (${contact.phone}) - Message SID: ${msg.sid}`);
      successCount++;
    } catch (error: any) {
      console.error(`❌ Failed to send to ${contact.name} (${contact.phone}):`, error.message);
      failCount++;
    }
    
    // Sleep to avoid Twilio rate limits (e.g. 100ms)
    await new Promise(r => setTimeout(r, 100));
  }

  console.log('\n📊 Campaign Summary:');
  console.log(`- Total Contacts: ${CONTACTS.length}`);
  console.log(`- Successfully Sent: ${successCount}`);
  console.log(`- Failed: ${failCount}`);
}

main()
  .catch(console.error)
  .finally(async () => {
    // @ts-ignore
    await prisma.$disconnect();
  });

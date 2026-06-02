import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER || '+14155238886'; // Twilio sandbox fallback

export async function sendWhatsAppApprovalMessage(phone: string, name: string) {
  if (!accountSid || !authToken) {
    console.log('Twilio credentials missing. Skipping WhatsApp notification.');
    return false;
  }

  // Format to correct international formats for WhatsApp
  // Clean phone: keep only digits
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  
  // If it doesn't have a country code, prepend '91' (standard Indian prefix in NexBill context)
  const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  const to = `whatsapp:+${phoneWithCountry}`;
  const from = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`;

  try {
    const client = twilio(accountSid, authToken);
    const message = await client.messages.create({
      from,
      to,
      body: `Hello ${name}! 🎉\n\nYour NexBill POS Terminal account has been approved by the super administrator. For now, login to your account to start billing.\n\nDashboard URL: http://localhost:3000\n\nThank you! 🙏`,
    });

    console.log(`WhatsApp notification dispatched successfully: ${message.sid}`);
    return true;
  } catch (error: any) {
    console.error('Error dispatching WhatsApp via Twilio:', error);
    return false;
  }
}

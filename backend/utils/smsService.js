import dotenv from 'dotenv';
import { normalizePhone } from './phoneNormalizer.js';

dotenv.config();

/**
 * Convert Malaysian phone number to international format for Twilio
 * Input: 012-3456789 or 0123456789
 * Output: +60123456789
 */
const toInternationalFormat = (phone) => {
  if (!phone) return null;
  
  // Remove all non-digits
  const cleaned = phone.toString().replace(/\D/g, '');
  
  // If already starts with +60, return as is
  if (phone.startsWith('+60')) {
    return phone;
  }
  
  // If starts with 60, add +
  if (cleaned.startsWith('60')) {
    return `+${cleaned}`;
  }
  
  // If starts with 0, replace with +60
  if (cleaned.startsWith('0')) {
    return `+60${cleaned.substring(1)}`;
  }
  
  // Otherwise, assume it's already in international format or add +60
  return cleaned.startsWith('+') ? cleaned : `+60${cleaned}`;
};

/**
 * SMS Service for sending password reset codes via SMS
 * Uses Twilio if configured, otherwise simulates in development
 */

// Generate a 6-digit verification code
export const generateResetCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send SMS with password reset code
 * @param {string} phoneNumber - Phone number to send SMS to
 * @param {string} resetCode - 6-digit reset code
 * @param {string} userName - User's name
 * @returns {Promise<{success: boolean, messageId?: string, error?: string, devCode?: string, devMessage?: string}>}
 */
export const sendPasswordResetSMS = async (phoneNumber, resetCode, userName) => {
  try {
    const normalizedPhoneNumber = normalizePhone(phoneNumber);
    const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!normalizedPhoneNumber) {
      return { success: false, error: 'Invalid recipient phone number.' };
    }

    const messageBody = `Kod reset kata laluan e-Quran anda ialah: ${resetCode}. Kod ini sah selama 10 minit. Jangan kongsikan kod ini dengan sesiapa.`;

    console.log('\n📱 ===== ATTEMPTING TO SEND SMS =====');
    console.log('To:', normalizedPhoneNumber);
    console.log('User Name:', userName);
    console.log('Reset Code:', resetCode);
    console.log('Message:', messageBody);

    // Try to use Twilio if configured
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && fromPhoneNumber) {
      try {
        // Dynamically import Twilio
        const twilio = await import('twilio');
        const client = twilio.default(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        
        // Convert to international format for Twilio
        const internationalPhone = toInternationalFormat(normalizedPhoneNumber);
        
        const message = await client.messages.create({
          body: messageBody,
          from: fromPhoneNumber,
          to: internationalPhone,
        });
        console.log('✅ SMS sent successfully! Message SID:', message.sid);
        console.log('International Phone:', internationalPhone);
        console.log('=====================================\n');
        return { success: true, messageId: message.sid };
      } catch (error) {
        console.error('❌ Error sending SMS via Twilio:', error);
        console.error('Twilio Error Code:', error.code);
        console.error('Twilio Error Message:', error.message);
        console.error('=====================================\n');
        return { success: false, error: error.message, code: error.code };
      }
    } else {
      // Twilio not configured - simulate SMS send (for development/testing)
      console.warn('⚠️ Twilio not configured or missing phone number. Simulating SMS send.');
      console.log('Simulated SMS to:', normalizedPhoneNumber);
      console.log('Simulated Message:', messageBody);
      console.log('=====================================\n');
      return {
        success: true,
        message: 'SMS simulated (Twilio not configured).',
        devCode: resetCode,
        devMessage: messageBody,
      };
    }
  } catch (error) {
    console.error('\n❌ ===== ERROR SENDING SMS =====');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('=====================================\n');
    
    return { 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * Check if SMS service is configured
 * @returns {boolean}
 */
export const isSMSConfigured = () => {
  return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);
};

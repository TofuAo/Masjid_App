import axios from 'axios';

/**
 * WhatsApp Business API Service
 * Supports multiple providers:
 * - Twilio WhatsApp API
 * - WhatsApp Business API (Meta)
 * - Generic webhook-based services
 */

/**
 * Send WhatsApp message using Twilio
 * @param {string} to - Phone number in E.164 format (e.g., +60123456789)
 * @param {string} message - Message content
 * @param {string} accountSid - Twilio Account SID
 * @param {string} authToken - Twilio Auth Token
 * @param {string} from - Twilio WhatsApp number (e.g., whatsapp:+14155238886)
 */
export const sendWhatsAppViaTwilio = async (to, message, accountSid, authToken, from) => {
  try {
    // Ensure phone number is in E.164 format
    const formattedTo = formatPhoneNumber(to);
    
    const response = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      new URLSearchParams({
        From: from || `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886'}`,
        To: `whatsapp:${formattedTo}`,
        Body: message
      }),
      {
        auth: {
          username: accountSid,
          password: authToken
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    return {
      success: true,
      messageId: response.data.sid,
      status: response.data.status
    };
  } catch (error) {
    console.error('Twilio WhatsApp error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

/**
 * Send WhatsApp message using WhatsApp Business API (Meta)
 * @param {string} to - Phone number
 * @param {string} message - Message content
 * @param {string} phoneNumberId - WhatsApp Business Phone Number ID
 * @param {string} accessToken - WhatsApp Business API Access Token
 */
export const sendWhatsAppViaMeta = async (to, message, phoneNumberId, accessToken) => {
  try {
    const formattedTo = formatPhoneNumber(to);
    
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: formattedTo,
        type: 'text',
        text: {
          body: message
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      messageId: response.data.messages[0].id,
      status: 'sent'
    };
  } catch (error) {
    console.error('Meta WhatsApp error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message
    };
  }
};

/**
 * Send WhatsApp message via webhook (generic)
 * @param {string} to - Phone number
 * @param {string} message - Message content
 * @param {string} webhookUrl - Webhook URL
 * @param {object} headers - Optional headers
 */
export const sendWhatsAppViaWebhook = async (to, message, webhookUrl, headers = {}) => {
  try {
    const formattedTo = formatPhoneNumber(to);
    
    const response = await axios.post(
      webhookUrl,
      {
        to: formattedTo,
        message: message,
        timestamp: new Date().toISOString()
      },
      {
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      }
    );

    return {
      success: true,
      messageId: response.data.id || response.data.messageId,
      status: response.data.status || 'sent'
    };
  } catch (error) {
    console.error('Webhook WhatsApp error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

/**
 * Send WhatsApp message (auto-detect provider from environment)
 * @param {string} to - Phone number
 * @param {string} message - Message content
 */
export const sendWhatsApp = async (to, message) => {
  const provider = process.env.WHATSAPP_PROVIDER || 'twilio';
  
  switch (provider.toLowerCase()) {
    case 'twilio':
      return await sendWhatsAppViaTwilio(
        to,
        message,
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN,
        process.env.TWILIO_WHATSAPP_NUMBER
      );
    
    case 'meta':
    case 'facebook':
      return await sendWhatsAppViaMeta(
        to,
        message,
        process.env.WHATSAPP_PHONE_NUMBER_ID,
        process.env.WHATSAPP_ACCESS_TOKEN
      );
    
    case 'webhook':
      return await sendWhatsAppViaWebhook(
        to,
        message,
        process.env.WHATSAPP_WEBHOOK_URL,
        process.env.WHATSAPP_WEBHOOK_HEADERS ? JSON.parse(process.env.WHATSAPP_WEBHOOK_HEADERS) : {}
      );
    
    default:
      console.warn(`Unknown WhatsApp provider: ${provider}. Using webhook fallback.`);
      if (process.env.WHATSAPP_WEBHOOK_URL) {
        return await sendWhatsAppViaWebhook(
          to,
          message,
          process.env.WHATSAPP_WEBHOOK_URL
        );
      }
      return {
        success: false,
        error: `WhatsApp provider '${provider}' not configured`
      };
  }
};

/**
 * Format phone number to E.164 format
 * @param {string} phone - Phone number in various formats
 * @returns {string} - Formatted phone number
 */
const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // If starts with 0, replace with country code
  if (cleaned.startsWith('0')) {
    cleaned = '60' + cleaned.substring(1);
  }
  
  // If doesn't start with +, add it
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  
  return cleaned;
};

export default {
  sendWhatsApp,
  sendWhatsAppViaTwilio,
  sendWhatsAppViaMeta,
  sendWhatsAppViaWebhook
};


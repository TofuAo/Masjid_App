# WhatsApp API Integration Setup Guide

This guide explains how to configure WhatsApp API integration for e-Quran.

## Supported Providers

The system supports multiple WhatsApp providers:

1. **Twilio WhatsApp API** (Recommended for production)
2. **Meta WhatsApp Business API** (Official WhatsApp Business API)
3. **Webhook-based services** (Generic webhook integration)

---

## Option 1: Twilio WhatsApp API (Recommended)

### Prerequisites
- Twilio account (sign up at https://www.twilio.com)
- Twilio WhatsApp-enabled phone number

### Setup Steps

1. **Get Twilio Credentials**
   - Log in to Twilio Console
   - Go to Account → API Keys & Tokens
   - Copy your Account SID and Auth Token

2. **Enable WhatsApp on Twilio**
   - Go to Messaging → Try it out → Send a WhatsApp message
   - Follow the setup wizard to enable WhatsApp
   - Note your WhatsApp number (format: `whatsapp:+14155238886`)

3. **Configure Environment Variables**

   Add to `backend/.env`:
   ```env
   # WhatsApp Configuration
   WHATSAPP_PROVIDER=twilio
   TWILIO_ACCOUNT_SID=your_account_sid_here
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
   
   # Admin contact for WhatsApp notifications
   WHATSAPP_ADMIN_NUMBER=+60123456789
   ADMIN_PHONE=+60123456789
   ```

4. **Test the Integration**
   - Submit a contact form with "WhatsApp" or "Both" selected
   - Check if admin receives WhatsApp message

---

## Option 2: Meta WhatsApp Business API

### Prerequisites
- Meta Business Account
- WhatsApp Business API access (requires approval)
- Phone number verified with Meta

### Setup Steps

1. **Create Meta App**
   - Go to https://developers.facebook.com
   - Create a new app → Select "Business" type
   - Add "WhatsApp" product to your app

2. **Get API Credentials**
   - Go to WhatsApp → API Setup
   - Copy your Phone Number ID
   - Generate a Permanent Access Token

3. **Configure Environment Variables**

   Add to `backend/.env`:
   ```env
   # WhatsApp Configuration
   WHATSAPP_PROVIDER=meta
   WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
   WHATSAPP_ACCESS_TOKEN=your_permanent_access_token
   
   # Admin contact
   WHATSAPP_ADMIN_NUMBER=+60123456789
   ADMIN_PHONE=+60123456789
   ```

---

## Option 3: Webhook-based Service

### Setup Steps

1. **Get Webhook URL**
   - Use any WhatsApp API service that provides webhook
   - Examples: ChatAPI, Wati, 360dialog, etc.

2. **Configure Environment Variables**

   Add to `backend/.env`:
   ```env
   # WhatsApp Configuration
   WHATSAPP_PROVIDER=webhook
   WHATSAPP_WEBHOOK_URL=https://api.example.com/send-message
   WHATSAPP_WEBHOOK_HEADERS={"Authorization": "Bearer YOUR_TOKEN", "Content-Type": "application/json"}
   
   # Admin contact
   WHATSAPP_ADMIN_NUMBER=+60123456789
   ADMIN_PHONE=+60123456789
   ```

   **Webhook Payload Format:**
   The system will send:
   ```json
   {
     "to": "+60123456789",
     "message": "Your message content here",
     "timestamp": "2025-11-20T15:30:00.000Z"
   }
   ```

---

## Configuration

### Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `WHATSAPP_PROVIDER` | Provider type: `twilio`, `meta`, or `webhook` | Yes | `twilio` |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | If using Twilio | `ACxxxxxxxxxxxxx` |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | If using Twilio | `your_auth_token` |
| `TWILIO_WHATSAPP_NUMBER` | Twilio WhatsApp number | If using Twilio | `whatsapp:+14155238886` |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta Phone Number ID | If using Meta | `123456789012345` |
| `WHATSAPP_ACCESS_TOKEN` | Meta Access Token | If using Meta | `your_access_token` |
| `WHATSAPP_WEBHOOK_URL` | Webhook endpoint URL | If using webhook | `https://api.example.com/send` |
| `WHATSAPP_WEBHOOK_HEADERS` | Webhook headers (JSON) | If using webhook | `{"Authorization": "Bearer TOKEN"}` |
| `WHATSAPP_ADMIN_NUMBER` | Admin phone for notifications | Yes | `+60123456789` |
| `ADMIN_PHONE` | Admin phone (alternative) | Yes | `+60123456789` |
| `ADMIN_EMAIL` | Admin email for notifications | Yes | `admin@epengajian.com` |

---

## Phone Number Format

All phone numbers should be in **E.164 format**:
- ✅ Correct: `+60123456789`
- ✅ Correct: `+6012-345-6789` (will be auto-formatted)
- ❌ Wrong: `0123456789` (missing country code)
- ❌ Wrong: `60123456789` (missing +)

The system automatically formats phone numbers to E.164 format.

---

## Testing

### Test Contact Form

1. Go to `/contact` page
2. Fill in the contact form
3. Select "WhatsApp" or "Both" as contact method
4. Submit the form
5. Check if:
   - Admin receives WhatsApp message
   - User receives auto-reply email
   - Submission is saved in database

### Test WhatsApp Service Directly

You can test the WhatsApp service in Node.js:

```javascript
import { sendWhatsApp } from './backend/utils/whatsappService.js';

const result = await sendWhatsApp(
  '+60123456789',
  'Test message from e-Quran'
);

console.log(result);
```

---

## Troubleshooting

### WhatsApp messages not sending

1. **Check Environment Variables**
   ```bash
   docker-compose exec backend env | grep WHATSAPP
   ```

2. **Check Logs**
   ```bash
   docker-compose logs backend | grep -i whatsapp
   ```

3. **Verify Phone Number Format**
   - Must include country code
   - Must start with `+`
   - Example: `+60123456789` for Malaysia

4. **Test Provider Credentials**
   - For Twilio: Check Twilio Console → Logs
   - For Meta: Check Meta Business Manager → WhatsApp → API Logs
   - For Webhook: Check webhook service logs

### Common Errors

**Error: "WhatsApp provider not configured"**
- Solution: Set `WHATSAPP_PROVIDER` in `.env`

**Error: "Invalid phone number"**
- Solution: Ensure phone number is in E.164 format (`+60...`)

**Error: "Authentication failed"**
- Solution: Check API credentials (SID, Token, etc.)

**Error: "Rate limit exceeded"**
- Solution: Wait and retry, or upgrade your WhatsApp API plan

---

## Features

### Contact Form Integration
- Users can submit contact forms
- Admin receives notifications via email and/or WhatsApp
- Auto-reply sent to users
- All submissions saved in database

### Notification Types
- Contact form submissions
- Payment confirmations (can be extended)
- Attendance reminders (can be extended)
- Class announcements (can be extended)

---

## Security Notes

1. **Never commit `.env` file** with real credentials
2. **Use environment variables** for all sensitive data
3. **Rotate API tokens** regularly
4. **Monitor usage** to prevent abuse
5. **Rate limiting** is handled by the provider

---

## Support

For issues or questions:
- Check backend logs: `docker-compose logs backend`
- Review provider documentation (Twilio/Meta)
- Contact system administrator

---

**Last Updated:** 2025-11-20


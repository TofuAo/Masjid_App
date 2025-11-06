// Quick script to check email configuration
import dotenv from 'dotenv';
dotenv.config();

console.log('\n📧 ===== EMAIL CONFIGURATION CHECK =====\n');

const emailUser = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_PASSWORD;
const emailFromName = process.env.EMAIL_FROM_NAME;

console.log('EMAIL_USER:', emailUser ? `✅ Set (${emailUser})` : '❌ MISSING');
console.log('EMAIL_PASSWORD:', emailPassword ? '✅ Set (hidden)' : '❌ MISSING');
console.log('EMAIL_FROM_NAME:', emailFromName || 'Not set (will use default)');

if (!emailUser || !emailPassword) {
  console.log('\n❌ Email configuration is incomplete!');
  console.log('\nPlease set the following in your .env file:');
  console.log('EMAIL_USER=your-email@gmail.com');
  console.log('EMAIL_PASSWORD=your-app-password');
  console.log('\nFor Gmail, you need to:');
  console.log('1. Enable 2-Step Verification');
  console.log('2. Generate an App Password');
  console.log('3. Use the App Password (not your regular password)');
  console.log('\nSee EMAIL_SETUP_GUIDE.md for detailed instructions.\n');
} else {
  console.log('\n✅ Email credentials are configured!');
  console.log('\nTo test email sending, try requesting a password reset.\n');
}


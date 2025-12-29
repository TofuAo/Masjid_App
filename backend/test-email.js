import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

console.log('\n📧 ===== TESTING EMAIL CONFIGURATION =====\n');

const emailUser = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_PASSWORD;

console.log('EMAIL_USER:', emailUser || '❌ NOT SET');
console.log('EMAIL_PASSWORD:', emailPassword ? `✅ Set (${emailPassword.length} characters)` : '❌ NOT SET');

if (!emailUser || !emailPassword) {
  console.log('\n❌ Email credentials are missing!');
  process.exit(1);
}

// Check password format
if (emailPassword.length !== 16) {
  console.log(`\n⚠️ WARNING: App Password should be 16 characters, but got ${emailPassword.length}`);
  console.log('Make sure there are no spaces or extra characters.');
}

// Check for spaces
if (emailPassword.includes(' ')) {
  console.log('\n⚠️ WARNING: Password contains spaces! Remove them.');
  console.log('Current password:', emailPassword);
  console.log('Should be:', emailPassword.replace(/\s/g, ''));
}

console.log('\n🔐 Creating Gmail transporter...');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailUser,
    pass: emailPassword.replace(/\s/g, ''), // Remove any spaces
  },
});

console.log('📤 Testing connection...\n');

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ ===== AUTHENTICATION FAILED =====');
    console.error('Error:', error.message);
    console.error('Error Code:', error.code);
    
    if (error.code === 'EAUTH') {
      console.error('\n🔐 AUTHENTICATION ERROR DETECTED');
      console.error('\nPossible causes:');
      console.error('1. ❌ Using regular password instead of App Password');
      console.error('2. ❌ App Password has spaces (remove them)');
      console.error('3. ❌ App Password was revoked or regenerated');
      console.error('4. ❌ 2-Step Verification not enabled');
      console.error('5. ❌ App Password copied incorrectly');
      
      console.error('\n✅ Solutions:');
      console.error('1. Go to: https://myaccount.google.com/apppasswords');
      console.error('2. Generate a NEW App Password');
      console.error('3. Copy it EXACTLY (no spaces)');
      console.error('4. Update EMAIL_PASSWORD in .env file');
      console.error('5. Restart backend: docker-compose restart backend');
    } else {
      console.error('\nOther error:', error);
    }
    
    console.error('\n=====================================\n');
    process.exit(1);
  } else {
    console.log('✅ ===== AUTHENTICATION SUCCESSFUL =====');
    console.log('✅ Email transporter verified successfully!');
    console.log('✅ Server is ready to send emails');
    console.log('\n📧 Testing email send...\n');
    
    const mailOptions = {
      from: `"Test" <${emailUser}>`,
      to: emailUser, // Send to yourself
      subject: 'Test Email from MyMasjidApp',
      text: 'This is a test email. If you receive this, your email configuration is working correctly!',
      html: '<p>This is a test email. If you receive this, your email configuration is working correctly!</p>'
    };
    
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('❌ Failed to send test email:', error.message);
        process.exit(1);
      } else {
        console.log('✅ Test email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('Response:', info.response);
        console.log('\n📬 Check your inbox (and spam folder) for the test email.');
        console.log('\n=====================================\n');
        process.exit(0);
      }
    });
  }
});


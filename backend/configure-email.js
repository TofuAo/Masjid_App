import dotenv from 'dotenv';
import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n📧 ===== EMAIL CONFIGURATION WIZARD =====\n');

// Check current configuration
const currentEmail = process.env.EMAIL_USER;
const currentPassword = process.env.EMAIL_PASSWORD;

console.log('Current Configuration:');
console.log('EMAIL_USER:', currentEmail || 'NOT SET');
console.log('EMAIL_PASSWORD:', currentPassword ? `SET (${currentPassword.length} chars)` : 'NOT SET');
console.log('');

// Function to update .env file
function updateEnvFile(email, password) {
  const envPath = path.join(__dirname, '.env');
  
  try {
    let envContent = '';
    
    // Read existing .env file if it exists
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Update or add EMAIL_USER
    if (envContent.includes('EMAIL_USER=')) {
      envContent = envContent.replace(/EMAIL_USER=.*/g, `EMAIL_USER=${email}`);
    } else {
      envContent += `\nEMAIL_USER=${email}\n`;
    }
    
    // Update or add EMAIL_PASSWORD
    if (envContent.includes('EMAIL_PASSWORD=')) {
      envContent = envContent.replace(/EMAIL_PASSWORD=.*/g, `EMAIL_PASSWORD=${password}`);
    } else {
      envContent += `EMAIL_PASSWORD=${password}\n`;
    }
    
    // Ensure EMAIL_FROM_NAME exists
    if (!envContent.includes('EMAIL_FROM_NAME=')) {
      envContent += `EMAIL_FROM_NAME=e-Sistem Kelas Pengajian Al-quran\n`;
    }
    
    // Write back to file
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('✅ .env file updated successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error updating .env file:', error.message);
    return false;
  }
}

// Ask for email
rl.question('Enter your Gmail address (or press Enter to keep current): ', (email) => {
  const finalEmail = email.trim() || currentEmail || 'khalidkingez@gmail.com';
  
  if (!finalEmail || !finalEmail.includes('@gmail.com')) {
    console.error('❌ Invalid Gmail address');
    rl.close();
    process.exit(1);
  }
  
  console.log('\n📝 To get your Gmail App Password:');
  console.log('1. Go to: https://myaccount.google.com/apppasswords');
  console.log('2. Sign in with your Gmail account');
  console.log('3. Select "Mail" and "Other (Custom name)"');
  console.log('4. Type: MyMasjidApp');
  console.log('5. Click Generate');
  console.log('6. Copy the 16-character password (remove spaces)\n');
  
  rl.question('Enter your Gmail App Password (16 characters, no spaces): ', (password) => {
    const cleanPassword = password.trim().replace(/\s/g, ''); // Remove all spaces
    
    if (cleanPassword.length !== 16) {
      console.error(`❌ App Password must be exactly 16 characters. You entered ${cleanPassword.length} characters.`);
      rl.close();
      process.exit(1);
    }
    
    console.log('\n📝 Updating .env file...');
    const success = updateEnvFile(finalEmail, cleanPassword);
    
    if (success) {
      console.log('\n✅ Email configuration updated!');
      console.log('\n📋 Next steps:');
      console.log('1. Restart backend: docker-compose restart backend');
      console.log('2. Test email: docker-compose exec backend node test-email.js');
      console.log('\n⚠️  Make sure:');
      console.log('- 2-Step Verification is enabled on your Gmail account');
      console.log('- You used a Gmail App Password (not your regular password)');
      console.log('- The password has no spaces');
    }
    
    rl.close();
  });
});


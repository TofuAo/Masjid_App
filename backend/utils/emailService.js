import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create reusable transporter object using Gmail SMTP
const createTransporter = () => {
  // Check if email is configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('❌ Email credentials not configured!');
    console.error('EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'MISSING');
    console.error('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'Set (hidden)' : 'MISSING');
    console.error('Please configure EMAIL_USER and EMAIL_PASSWORD in your .env file');
    return null;
  }

  console.log('✅ Email credentials found');
  console.log('Email user:', process.env.EMAIL_USER);
  console.log('Creating Gmail transporter...');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Your Gmail address
      pass: process.env.EMAIL_PASSWORD, // Your Gmail App Password
    },
    // Add connection timeout and retry options
    pool: true,
    maxConnections: 1,
    maxMessages: 3,
  });

  // Verify transporter configuration
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Email transporter verification failed:', error);
      console.error('Please check:');
      console.error('1. EMAIL_USER is a valid Gmail address');
      console.error('2. EMAIL_PASSWORD is a Gmail App Password (not your regular password)');
      console.error('3. 2-Step Verification is enabled on your Gmail account');
      console.error('4. App Password is generated correctly');
    } else {
      console.log('✅ Email transporter verified successfully');
      console.log('Server is ready to send emails');
    }
  });

  return transporter;
};

// Email templates
export const emailTemplates = {
  passwordReset: (resetLink, userNama, userIc) => ({
    subject: 'Penetapan Semula Kata Laluan Sistem Kelas Pengajian',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333333; 
            margin: 0; 
            padding: 0; 
            background-color: #f5f5f5;
          }
          .email-container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff;
            padding: 0;
          }
          .email-header {
            background-color: #ffffff;
            padding: 20px;
            text-align: center;
            border-bottom: 1px solid #e0e0e0;
          }
          .email-body { 
            padding: 30px 40px;
            background-color: #ffffff;
          }
          .greeting {
            font-size: 16px;
            color: #333333;
            margin-bottom: 20px;
          }
          .salutation {
            font-size: 16px;
            color: #333333;
            margin-bottom: 20px;
          }
          .purpose-title {
            font-size: 16px;
            font-weight: bold;
            color: #333333;
            margin-bottom: 20px;
          }
          .account-intro {
            font-size: 14px;
            color: #333333;
            margin-bottom: 15px;
          }
          .account-info {
            background-color: #f9f9f9;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            padding: 15px 20px;
            margin-bottom: 20px;
          }
          .account-item {
            font-size: 14px;
            color: #333333;
            margin-bottom: 8px;
            line-height: 1.8;
          }
          .account-item:last-child {
            margin-bottom: 0;
          }
          .reason-text {
            font-size: 14px;
            color: #333333;
            margin-bottom: 25px;
            line-height: 1.8;
          }
          .button-container {
            text-align: center;
            margin: 30px 0;
          }
          .reset-button { 
            display: inline-block; 
            padding: 14px 32px; 
            background-color: #2563eb; 
            color: #ffffff; 
            text-decoration: none; 
            border-radius: 4px; 
            font-size: 14px;
            font-weight: 500;
            text-align: center;
          }
          .reset-button:hover {
            background-color: #1d4ed8;
          }
          .expiry-notice {
            font-size: 14px;
            color: #333333;
            margin-top: 25px;
            margin-bottom: 20px;
            line-height: 1.8;
          }
          .disclaimer {
            font-size: 14px;
            color: #333333;
            margin-bottom: 25px;
            line-height: 1.8;
          }
          .closing {
            font-size: 14px;
            color: #333333;
            margin-bottom: 30px;
            font-weight: 500;
          }
          .signature {
            font-size: 14px;
            color: #333333;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
          }
          .signature-name {
            font-weight: 500;
            margin-bottom: 5px;
          }
          .signature-org {
            color: #666666;
            font-size: 13px;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-body">
            <div class="greeting">
              Assalamualaikum WBT / Salam Sejahtera
            </div>
            <div class="salutation">
              Tuan/Puan,
            </div>
            <div class="purpose-title">
              Penetapan Semula Kata Laluan Sistem Kelas Pengajian
            </div>
            <div class="account-intro">
              Butiran Akaun Sistem Kelas Pengajian adalah seperti dibawah :
            </div>
            <div class="account-info">
              <div class="account-item">
                <strong>Nama Akaun Pengguna:</strong> ${userNama}
              </div>
              <div class="account-item">
                <strong>No Kad Pengenalan / Passport:</strong> ${userIc || 'N/A'}
              </div>
            </div>
            <div class="reason-text">
              Emel ini dihantar kerana kami telah menerima permintaan anda untuk menetapkan semula kata laluan.
            </div>
            <div class="button-container">
              <a href="${resetLink}" class="reset-button">Penetapan Semula Kata Laluan Akaun Pengguna</a>
            </div>
            <div class="expiry-notice">
              Pautan penetapan semula kata laluan ini akan tamat dalam tempoh 24 jam.
            </div>
            <div class="disclaimer">
              Sila abaikan emel ini sekiranya tiada permintaan yang dibuat untuk penetapan semula kata laluan.
            </div>
            <div class="closing">
              Terima Kasih
            </div>
            <div class="signature">
              <div class="signature-name">Pentadbir Sistem Kelas Pengajian</div>
              <div class="signature-org">Masjid Negeri Sultan Ahmad 1</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Penetapan Semula Kata Laluan Sistem Kelas Pengajian

      Assalamualaikum WBT / Salam Sejahtera

      Tuan/Puan,

      Penetapan Semula Kata Laluan Sistem Kelas Pengajian

      Butiran Akaun Sistem Kelas Pengajian adalah seperti dibawah :

      Nama Akaun Pengguna: ${userNama}
      No Kad Pengenalan / Passport: ${userIc || 'N/A'}

      Emel ini dihantar kerana kami telah menerima permintaan anda untuk menetapkan semula kata laluan.

      Klik pautan berikut untuk menetapkan semula kata laluan:
      ${resetLink}

      Pautan penetapan semula kata laluan ini akan tamat dalam tempoh 24 jam.

      Sila abaikan emel ini sekiranya tiada permintaan yang dibuat untuk penetapan semula kata laluan.

      Terima Kasih

      Pentadbir Sistem Kelas Pengajian
      Masjid Negeri Sultan Ahmad 1
    `
  }),

  welcome: (userNama, loginLink, tempPassword) => ({
    subject: 'Selamat Datang ke Masjid App',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #059669; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #059669; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .info-box { background-color: #eff6ff; border-left: 4px solid #059669; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Masjid Negeri Sultan Ahmad 1</h2>
          </div>
          <div class="content">
            <h3>Selamat Datang ke Sistem Masjid App!</h3>
            <p>Assalamualaikum ${userNama},</p>
            <p>Akaun anda telah berjaya dicipta dalam sistem Masjid App.</p>
            ${tempPassword ? `
              <div class="info-box">
                <p><strong>Maklumat Log Masuk:</strong></p>
                <p>Kata Laluan Sementara: <code style="background: white; padding: 5px; border-radius: 3px;">${tempPassword}</code></p>
                <p><strong>Sila tukar kata laluan selepas log masuk pertama kali.</strong></p>
              </div>
            ` : ''}
            <p>Klik butang di bawah untuk log masuk:</p>
            <a href="${loginLink}" class="button">Log Masuk Sekarang</a>
            <p>Salam hormat,<br>Pasukan Sistem Masjid App</p>
          </div>
          <div class="footer">
            <p>Emel ini dihantar secara automatik. Jangan balas emel ini.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Selamat Datang ke Masjid App
      
      Assalamualaikum ${userNama},
      
      Akaun anda telah berjaya dicipta dalam sistem Masjid App.
      ${tempPassword ? `\nKata Laluan Sementara: ${tempPassword}\nSila tukar kata laluan selepas log masuk pertama kali.` : ''}
      
      Log masuk di: ${loginLink}
      
      Salam hormat,
      Pasukan Sistem Masjid App
    `
  }),

  feePaymentReminder: (userNama, bulan, tahun, jumlah, paymentLink) => ({
    subject: `Peringatan: Yuran ${bulan} ${tahun} Masih Belum Dibayar`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #059669; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .amount-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Peringatan Pembayaran Yuran</h2>
          </div>
          <div class="content">
            <p>Assalamualaikum ${userNama},</p>
            <p>Ini adalah peringatan bahawa yuran bulanan anda masih belum dibayar.</p>
            <div class="amount-box">
              <p><strong>Yuran: ${bulan} ${tahun}</strong></p>
              <p style="font-size: 24px; margin: 10px 0;"><strong>RM ${jumlah}</strong></p>
            </div>
            <p>Sila selesaikan pembayaran secepat mungkin untuk mengelakkan tunggakan.</p>
            <a href="${paymentLink}" class="button">Bayar Yuran Sekarang</a>
            <p>Salam hormat,<br>Pasukan Sistem Masjid App</p>
          </div>
          <div class="footer">
            <p>Emel ini dihantar secara automatik. Jangan balas emel ini.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Peringatan: Yuran ${bulan} ${tahun} Masih Belum Dibayar
      
      Assalamualaikum ${userNama},
      
      Ini adalah peringatan bahawa yuran bulanan anda masih belum dibayar.
      
      Yuran: ${bulan} ${tahun}
      Jumlah: RM ${jumlah}
      
      Sila selesaikan pembayaran secepat mungkin.
      Bayar di: ${paymentLink}
      
      Salam hormat,
      Pasukan Sistem Masjid App
    `
  }),

  feePaymentConfirmation: (userNama, bulan, tahun, jumlah, no_resit) => ({
    subject: `Konfirmasi Pembayaran Yuran ${bulan} ${tahun}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #059669; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
          .success-box { background-color: #d1fae5; border-left: 4px solid #059669; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Konfirmasi Pembayaran Yuran</h2>
          </div>
          <div class="content">
            <p>Assalamualaikum ${userNama},</p>
            <div class="success-box">
              <p><strong>Pembayaran anda telah diterima!</strong></p>
              <p>Yuran: ${bulan} ${tahun}</p>
              <p>Jumlah: RM ${jumlah}</p>
              ${no_resit ? `<p>No. Resit: ${no_resit}</p>` : ''}
              <p>Tarikh Pembayaran: ${new Date().toLocaleDateString('ms-MY')}</p>
            </div>
            <p>Terima kasih kerana menyelesaikan pembayaran yuran anda tepat pada masanya.</p>
            <p>Salam hormat,<br>Pasukan Sistem Masjid App</p>
          </div>
          <div class="footer">
            <p>Emel ini dihantar secara automatik. Jangan balas emel ini.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Konfirmasi Pembayaran Yuran ${bulan} ${tahun}
      
      Assalamualaikum ${userNama},
      
      Pembayaran anda telah diterima!
      
      Yuran: ${bulan} ${tahun}
      Jumlah: RM ${jumlah}
      ${no_resit ? `No. Resit: ${no_resit}\n` : ''}Tarikh Pembayaran: ${new Date().toLocaleDateString('ms-MY')}
      
      Terima kasih kerana menyelesaikan pembayaran yuran anda tepat pada masanya.
      
      Salam hormat,
      Pasukan Sistem Masjid App
    `
  }),

  attendanceNotification: (userNama, tarikh, status, kelas_nama) => ({
    subject: `Notifikasi Kehadiran - ${tarikh}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #059669; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
          .info-box { background-color: #eff6ff; border-left: 4px solid #059669; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Notifikasi Kehadiran</h2>
          </div>
          <div class="content">
            <p>Assalamualaikum ${userNama},</p>
            <p>Maklumat kehadiran anda untuk hari ini:</p>
            <div class="info-box">
              <p><strong>Tarikh:</strong> ${tarikh}</p>
              <p><strong>Kelas:</strong> ${kelas_nama}</p>
              <p><strong>Status:</strong> ${status}</p>
            </div>
            <p>Terima kasih.</p>
            <p>Salam hormat,<br>Pasukan Sistem Masjid App</p>
          </div>
          <div class="footer">
            <p>Emel ini dihantar secara automatik. Jangan balas emel ini.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Notifikasi Kehadiran - ${tarikh}
      
      Assalamualaikum ${userNama},
      
      Maklumat kehadiran anda:
      Tarikh: ${tarikh}
      Kelas: ${kelas_nama}
      Status: ${status}
      
      Salam hormat,
      Pasukan Sistem Masjid App
    `
  }),
};

// Send email function
export const sendEmail = async (to, subject, html, text) => {
  try {
    console.log('\n📧 ===== ATTEMPTING TO SEND EMAIL =====');
    console.log('To:', to);
    console.log('Subject:', subject);
    
    const transporter = createTransporter();
    
    if (!transporter) {
      console.error('❌ Email transporter not available. Email not sent.');
      return { success: false, message: 'Email service not configured', error: 'Transporter not available' };
    }

    const mailOptions = {
      from: `"Pentadbir Sistem Kelas Pengajian" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html,
      text: text || html.replace(/<[^>]*>/g, ''), // Fallback to plain text if text not provided
    };

    console.log('📤 Sending email...');
    console.log('From:', mailOptions.from);
    console.log('To:', mailOptions.to);
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    console.log('=====================================\n');
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('\n❌ ===== ERROR SENDING EMAIL =====');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    
    // Provide helpful error messages
    if (error.code === 'EAUTH') {
      console.error('\n🔐 AUTHENTICATION ERROR:');
      console.error('Please verify:');
      console.error('1. EMAIL_USER is correct');
      console.error('2. EMAIL_PASSWORD is a Gmail App Password (not regular password)');
      console.error('3. 2-Step Verification is enabled');
      console.error('4. App Password was generated correctly');
    } else if (error.code === 'ECONNECTION') {
      console.error('\n🌐 CONNECTION ERROR:');
      console.error('Cannot connect to Gmail SMTP server');
      console.error('Please check your internet connection');
    } else {
      console.error('\n❓ UNKNOWN ERROR:');
      console.error('Please check the error details above');
    }
    console.error('=====================================\n');
    
    return { success: false, error: error.message, code: error.code };
  }
};

// Convenience functions
export const sendPasswordResetEmail = async (email, resetLink, userNama, userIc) => {
  const template = emailTemplates.passwordReset(resetLink, userNama, userIc);
  return await sendEmail(email, template.subject, template.html, template.text);
};

export const sendWelcomeEmail = async (email, loginLink, userNama, tempPassword = null) => {
  const template = emailTemplates.welcome(userNama, loginLink, tempPassword);
  return await sendEmail(email, template.subject, template.html, template.text);
};

export const sendFeePaymentReminder = async (email, userNama, bulan, tahun, jumlah, paymentLink) => {
  const template = emailTemplates.feePaymentReminder(userNama, bulan, tahun, jumlah, paymentLink);
  return await sendEmail(email, template.subject, template.html, template.text);
};

export const sendFeePaymentConfirmation = async (email, userNama, bulan, tahun, jumlah, no_resit) => {
  const template = emailTemplates.feePaymentConfirmation(userNama, bulan, tahun, jumlah, no_resit);
  return await sendEmail(email, template.subject, template.html, template.text);
};

export const sendAttendanceNotification = async (email, userNama, tarikh, status, kelas_nama) => {
  const template = emailTemplates.attendanceNotification(userNama, tarikh, status, kelas_nama);
  return await sendEmail(email, template.subject, template.html, template.text);
};

export default {
  sendEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendFeePaymentReminder,
  sendFeePaymentConfirmation,
  sendAttendanceNotification,
  emailTemplates,
};


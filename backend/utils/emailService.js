import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create reusable transporter object using Gmail SMTP
const createTransporter = () => {
  // Check if email is configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('Email credentials not configured. Email functionality will be disabled.');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Your Gmail address
      pass: process.env.EMAIL_PASSWORD, // Your Gmail App Password
    },
  });
};

// Email templates
export const emailTemplates = {
  passwordReset: (resetLink, userNama) => ({
    subject: 'Reset Kata Laluan - Masjid App',
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
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Masjid Negeri Sultan Ahmad 1</h2>
          </div>
          <div class="content">
            <h3>Reset Kata Laluan</h3>
            <p>Assalamualaikum ${userNama},</p>
            <p>Kami telah menerima permintaan untuk menetapkan semula kata laluan anda.</p>
            <p>Klik butang di bawah untuk menetapkan kata laluan baharu:</p>
            <a href="${resetLink}" class="button">Tetapkan Kata Laluan Baharu</a>
            <p>Atau salin dan tampal pautan ini ke pelayar anda:</p>
            <p style="word-break: break-all; color: #059669;">${resetLink}</p>
            <p><strong>Pautan ini akan tamat tempoh dalam 1 jam.</strong></p>
            <p>Jika anda tidak meminta reset kata laluan, sila abaikan emel ini.</p>
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
      Reset Kata Laluan - Masjid App
      
      Assalamualaikum ${userNama},
      
      Kami telah menerima permintaan untuk menetapkan semula kata laluan anda.
      
      Klik pautan di bawah untuk menetapkan kata laluan baharu:
      ${resetLink}
      
      Pautan ini akan tamat tempoh dalam 1 jam.
      
      Jika anda tidak meminta reset kata laluan, sila abaikan emel ini.
      
      Salam hormat,
      Pasukan Sistem Masjid App
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
    const transporter = createTransporter();
    
    if (!transporter) {
      console.warn('Email transporter not available. Email not sent.');
      return { success: false, message: 'Email service not configured' };
    }

    const mailOptions = {
      from: `"Masjid App" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html,
      text: text || html.replace(/<[^>]*>/g, ''), // Fallback to plain text if text not provided
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Convenience functions
export const sendPasswordResetEmail = async (email, resetLink, userNama) => {
  const template = emailTemplates.passwordReset(resetLink, userNama);
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


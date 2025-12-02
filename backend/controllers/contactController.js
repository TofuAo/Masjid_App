import { pool } from '../config/database.js';
import { validationResult } from 'express-validator';
import { sendEmail } from '../utils/emailService.js';
import { sendWhatsApp } from '../utils/whatsappService.js';

/**
 * Submit contact form
 * Sends email and/or WhatsApp based on user preference
 */
export const submitContactForm = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, phone, subject, message, contact_method } = req.body;

    // Save contact form submission to database
    const [result] = await pool.execute(
      `INSERT INTO contact_submissions 
       (name, email, phone, subject, message, contact_method, status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [name, email, phone, subject, message, contact_method || 'email']
    );

    const submissionId = result.insertId;

    // Prepare notification message
    const notificationMessage = `
Mesej Baru dari Borang Hubungi Kami

Nama: ${name}
Emel: ${email}
Telefon: ${phone}
Subjek: ${subject}

Mesej:
${message}

---
Dihantar melalui e-Quran
Tarikh: ${new Date().toLocaleString('ms-MY')}
    `.trim();

    // Send notifications based on contact method
    const notifications = [];

    // Always send email to admin
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'admin@epengajian.com';
    const emailResult = await sendEmail(
      adminEmail,
      `[Hubungi Kami] ${subject}`,
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Mesej Baru dari Borang Hubungi Kami</h2>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Nama:</strong> ${name}</p>
            <p><strong>Emel:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Telefon:</strong> <a href="tel:${phone}">${phone}</a></p>
            <p><strong>Subjek:</strong> ${subject}</p>
          </div>
          <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h3 style="color: #374151;">Mesej:</h3>
            <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
          </div>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
            <p>Dihantar melalui e-Quran</p>
            <p>Tarikh: ${new Date().toLocaleString('ms-MY')}</p>
          </div>
        </div>
      `,
      notificationMessage
    );

    notifications.push({
      method: 'email',
      success: emailResult.success,
      messageId: emailResult.messageId
    });

    // Send WhatsApp if requested
    if (contact_method === 'whatsapp' || contact_method === 'both') {
      const adminPhone = process.env.ADMIN_PHONE || process.env.WHATSAPP_ADMIN_NUMBER;
      if (adminPhone) {
        const whatsappResult = await sendWhatsApp(adminPhone, notificationMessage);
        notifications.push({
          method: 'whatsapp',
          success: whatsappResult.success,
          messageId: whatsappResult.messageId
        });
      }
    }

    // Send auto-reply to user
    const userAutoReply = `
Terima kasih kerana menghubungi e-Quran.

Kami telah menerima mesej anda dengan subjek:
"${subject}"

Kami akan membalas mesej anda secepat mungkin.

Sekiranya anda mempunyai soalan segera, sila hubungi kami di:
📞 Telefon: +60 9-123 4567
📧 Emel: admin@epengajian.com
💬 WhatsApp: +60 12-345 6789

Terima kasih,
Pasukan e-Quran
    `.trim();

    // Send auto-reply email
    await sendEmail(
      email,
      'Terima Kasih - Mesej Anda Telah Diterima',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Terima Kasih!</h2>
          <p>Terima kasih kerana menghubungi <strong>e-Quran</strong>.</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Subjek mesej anda:</strong> ${subject}</p>
            <p>Kami telah menerima mesej anda dan akan membalas secepat mungkin.</p>
          </div>
          <div style="margin-top: 20px; padding: 20px; background-color: #ecfdf5; border-radius: 8px;">
            <h3 style="color: #059669; margin-top: 0;">Maklumat Perhubungan:</h3>
            <p>📞 <strong>Telefon:</strong> <a href="tel:+6091234567">+60 9-123 4567</a></p>
            <p>📧 <strong>Emel:</strong> <a href="mailto:admin@epengajian.com">admin@epengajian.com</a></p>
            <p>💬 <strong>WhatsApp:</strong> <a href="https://wa.me/60123456789">+60 12-345 6789</a></p>
          </div>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
            <p>e-Quran<br />Masjid Negeri Sultan Ahmad 1, Kuantan</p>
          </div>
        </div>
      `,
      userAutoReply
    );

    // Update submission status
    await pool.execute(
      'UPDATE contact_submissions SET status = ? WHERE id = ?',
      ['sent', submissionId]
    );

    res.json({
      success: true,
      message: 'Mesej anda telah dihantar dengan jayanya',
      submissionId,
      notifications
    });
  } catch (error) {
    console.error('Contact form submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghantar mesej. Sila cuba lagi kemudian.'
    });
  }
};

/**
 * Get contact submissions (admin only)
 */
export const getContactSubmissions = async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    
    let query = 'SELECT * FROM contact_submissions WHERE 1=1';
    const queryParams = [];

    if (status) {
      query += ' AND status = ?';
      queryParams.push(status);
    }

    const safeLimit = Math.max(1, parseInt(limit));
    const offset = (Math.max(1, parseInt(page)) - 1) * safeLimit;
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    queryParams.push(safeLimit, offset);

    const [submissions] = await pool.execute(query, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM contact_submissions WHERE 1=1';
    const countParams = [];
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: submissions,
      pagination: {
        page: parseInt(page),
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit)
      }
    });
  } catch (error) {
    console.error('Get contact submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memuatkan senarai mesej'
    });
  }
};


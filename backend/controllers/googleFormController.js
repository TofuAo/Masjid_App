import { pool } from '../config/database.js';
import { validationResult } from 'express-validator';

// Webhook endpoint to receive Google Form submissions
// This endpoint should be called by Google Apps Script when form is submitted
export const receiveGoogleFormData = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { class_id, tarikh, attendance_data, secret_key } = req.body;

    // Verify secret key (optional security measure)
    const expectedSecret = process.env.GOOGLE_FORM_WEBHOOK_SECRET || 'default_secret_key';
    if (secret_key && secret_key !== expectedSecret) {
      return res.status(401).json({
        success: false,
        message: 'Invalid secret key'
      });
    }

    // Use current date if tarikh is not provided
    const attendanceDate = tarikh || new Date().toISOString().split('T')[0];

    if (!class_id || !attendance_data || !Array.isArray(attendance_data)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request: class_id and attendance_data array are required'
      });
    }

    // Start transaction
    await pool.execute('START TRANSACTION');

    try {
      const results = [];
      const errors = [];

      for (const record of attendance_data) {
        const { student_ic, student_name, status } = record;

        // Normalize status
        const normalizedStatus = status === 'Hadir' || status === 'hadir' || status === 'Present' ? 'Hadir' :
                                status === 'Tidak Hadir' || status === 'tidak_hadir' || status === 'Absent' ? 'Tidak Hadir' :
                                status === 'Cuti' || status === 'cuti' || status === 'Leave' ? 'Cuti' :
                                status === 'Lewat' || status === 'lewat' || status === 'Late' ? 'Lewat' :
                                status === 'Sakit' || status === 'sakit' || status === 'Sick' ? 'Sakit' :
                                'Hadir'; // Default to 'Hadir' if status is checked

        if (!student_ic) {
          errors.push({ student_name, error: 'Student IC is missing' });
          continue;
        }

        // Check if student exists in the class
        const [existingStudents] = await pool.execute(
          'SELECT user_ic FROM students WHERE user_ic = ? AND kelas_id = ?',
          [student_ic, class_id]
        );

        if (existingStudents.length === 0) {
          errors.push({ student_name, error: 'Student not found in this class' });
          continue;
        }

        // Check if attendance already exists
        const [existingAttendance] = await pool.execute(
          'SELECT id FROM attendance WHERE student_ic = ? AND class_id = ? AND tarikh = ?',
          [student_ic, class_id, attendanceDate]
        );

        if (existingAttendance.length > 0) {
          // Update existing
          await pool.execute(
            `UPDATE attendance 
             SET status = ?, updated_at = CURRENT_TIMESTAMP
             WHERE student_ic = ? AND class_id = ? AND tarikh = ?`,
            [normalizedStatus, student_ic, class_id, attendanceDate]
          );
          results.push({ student_ic, student_name, status: normalizedStatus, action: 'updated' });
        } else {
          // Insert new
          await pool.execute(
            `INSERT INTO attendance (student_ic, class_id, tarikh, status)
             VALUES (?, ?, ?, ?)`,
            [student_ic, class_id, attendanceDate, normalizedStatus]
          );
          results.push({ student_ic, student_name, status: normalizedStatus, action: 'created' });
        }
      }

      await pool.execute('COMMIT');

      res.json({
        success: true,
        message: 'Attendance data received and processed successfully',
        data: {
          processed: results.length,
          errors: errors.length,
          results,
          errors: errors.length > 0 ? errors : undefined
        }
      });
    } catch (error) {
      await pool.execute('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Receive Google Form data error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get or set Google Form URL for a class
export const getClassGoogleFormUrl = async (req, res) => {
  try {
    const { class_id } = req.params;

    // Check if class has a Google Form URL stored in settings or classes table
    // For now, we'll check if there's a setting for this class
    const [settings] = await pool.execute(
      `SELECT setting_value FROM settings 
       WHERE setting_key = ?`,
      [`google_form_url_${class_id}`]
    );

    const formUrl = settings.length > 0 ? settings[0].setting_value : null;

    res.json({
      success: true,
      data: {
        class_id: parseInt(class_id),
        google_form_url: formUrl
      }
    });
  } catch (error) {
    console.error('Get Google Form URL error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const setClassGoogleFormUrl = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can set Google Form URL'
      });
    }

    const { class_id } = req.params;
    const { google_form_url } = req.body;

    // Store Google Form URL in settings
    const settingKey = `google_form_url_${class_id}`;
    
    // Check if setting exists
    const [existing] = await pool.execute(
      'SELECT id FROM settings WHERE setting_key = ?',
      [settingKey]
    );

    if (existing.length > 0) {
      // Update existing
      await pool.execute(
        'UPDATE settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?',
        [google_form_url, settingKey]
      );
    } else {
      // Create new
      await pool.execute(
        'INSERT INTO settings (setting_key, setting_value, setting_type, description) VALUES (?, ?, ?, ?)',
        [settingKey, google_form_url, 'link', `Google Form URL for class ${class_id}`]
      );
    }

    res.json({
      success: true,
      message: 'Google Form URL set successfully',
      data: {
        class_id: parseInt(class_id),
        google_form_url
      }
    });
  } catch (error) {
    console.error('Set Google Form URL error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};


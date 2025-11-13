import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool } from '../config/database.js';
import { validationResult } from 'express-validator';
import { sendPasswordResetEmail } from '../utils/emailService.js';
import { formatICWithHyphen } from '../utils/icFormatter.js';
import { logFailedAuthAttempt, logSuspiciousActivity } from '../middleware/securityLogger.js';

const SESSION_DURATION_SECONDS = 24 * 60 * 60; // 24 hours

export const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Get the first error message for better user experience
      const firstError = errors.array()[0];
      return res.status(400).json({
        success: false,
        message: firstError.msg || 'Validation failed',
        errors: errors.array()
      });
    }

    const { nama, ic_number, email, password, confirmPassword } = req.body;

    if (confirmPassword && confirmPassword !== password) {
      return res.status(400).json({
        success: false,
        message: 'Kata laluan dan pengesahan tidak sepadan',
        errors: [{ msg: 'Kata laluan dan pengesahan tidak sepadan', param: 'confirmPassword' }]
      });
    }

    // Normalize IC number (remove hyphens and ensure it's 12 digits)
    const normalizedIC = ic_number.replace(/\D/g, '');
    
    if (normalizedIC.length !== 12) {
      return res.status(400).json({
        success: false,
        message: 'Nombor IC mestilah 12 digit'
      });
    }

    // Hardcode role to 'student' for registration
    const userRole = 'student';

    // Check if user already exists by IC number
    const [existingUsers] = await pool.execute(
      "SELECT * FROM users WHERE ic = ?",
      [normalizedIC]
    );

    if (existingUsers && existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Nombor IC ini sudah didaftarkan. Sila log masuk atau gunakan nombor IC lain.'
      });
    }

    // Check if email already exists
    if (email) {
      const [existingEmails] = await pool.execute(
        "SELECT * FROM users WHERE email = ?",
        [email.trim()]
      );

      if (existingEmails && existingEmails.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Emel ini sudah didaftarkan. Sila gunakan emel lain atau log masuk.'
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user with IC number as primary key
    // Set status to 'pending' - requires admin approval
    await pool.execute(
      "INSERT INTO users (ic, nama, email, password, role, status) VALUES (?, ?, ?, ?, ?, 'pending')",
      [normalizedIC, nama, email ? email.trim() : null, hashedPassword, userRole]
    );

 // Get newly created user
    const [users] = await pool.execute(
      "SELECT * FROM users WHERE ic = ?",
      [normalizedIC]
    );

    const user = users[0];
    user.ic_formatted = formatICWithHyphen(user.ic);
    user.ic_formatted = formatICWithHyphen(user.ic);

    // Don't generate token for pending users - they need approval first
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    userWithoutPassword.ic_formatted = formatICWithHyphen(user.ic);
    userWithoutPassword.ic_formatted = formatICWithHyphen(user.ic);

    // Skip welcome email since we don't have email for registration
    // Email can be added later in profile completion

    res.status(201).json({
      success: true,
      message: 'Pendaftaran berjaya! Akaun anda sedang menunggu kelulusan daripada pentadbir. Anda akan dimaklumkan selepas kelulusan.',
      data: {
        user: userWithoutPassword,
        // No token - user must wait for approval
        token: null
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const registerExistingUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const firstError = errors.array()[0];
      return res.status(400).json({
        success: false,
        message: firstError.msg || 'Validation failed',
        errors: errors.array()
      });
    }

    const { nama, ic_number, password } = req.body;
    const confirmPassword = req.body.confirmPassword ?? req.body.confirm_password;

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Kata laluan dan pengesahan tidak sepadan.'
      });
    }

    const cleanedName = nama?.trim();
    if (!cleanedName) {
      return res.status(400).json({
        success: false,
        message: 'Nama diperlukan.'
      });
    }

    const normalizedIC = ic_number.replace(/\D/g, '');
    if (normalizedIC.length !== 12) {
      return res.status(400).json({
        success: false,
        message: 'Nombor IC mestilah 12 digit.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Kata laluan mestilah sekurang-kurangnya 6 aksara.'
      });
    }

    // Ensure IC not already used by another user
    const [icConflicts] = await pool.execute(
      'SELECT ic, nama FROM users WHERE ic = ?',
      [normalizedIC]
    );

    if (icConflicts.length > 0) {
      const conflictUser = icConflicts[0];
      if (conflictUser.nama.trim().toLowerCase() !== cleanedName.toLowerCase()) {
        return res.status(400).json({
          success: false,
          message: 'Nombor IC ini telah digunakan oleh pengguna lain. Sila hubungi pentadbir.'
        });
      }
    }

    const [matchingUsers] = await pool.execute(
      `
        SELECT *
        FROM users
        WHERE LOWER(TRIM(nama)) = LOWER(TRIM(?))
        ORDER BY created_at ASC
      `,
      [cleanedName]
    );

    if (matchingUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nama tidak ditemui dalam sistem. Sila hubungi pentadbir untuk bantuan.'
      });
    }

    if (matchingUsers.length > 1) {
      return res.status(409).json({
        success: false,
        message: 'Lebih daripada satu pengguna ditemui dengan nama ini. Sila hubungi pentadbir untuk pengesahan.'
      });
    }

    const existingUser = matchingUsers[0];
    const oldIC = existingUser.ic;
    const requiresICUpdate = oldIC !== normalizedIC;

    if (existingUser.password && existingUser.password.length > 0 && !requiresICUpdate) {
      return res.status(400).json({
        success: false,
        message: 'Akaun ini telah didaftarkan. Sila log masuk menggunakan kata laluan sedia ada.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const tablesToUpdate = [
      { table: 'students', column: 'user_ic' },
      { table: 'teachers', column: 'user_ic' },
      { table: 'classes', column: 'guru_ic' },
      { table: 'attendance', column: 'student_ic' },
      { table: 'results', column: 'student_ic' },
      { table: 'fees', column: 'student_ic' },
      { table: 'staff_checkin', column: 'staff_ic' },
      { table: 'announcements', column: 'author_ic' },
      { table: 'password_reset_tokens', column: 'user_ic' },
    ];

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query('SET FOREIGN_KEY_CHECKS = 0');

      // Update users table
      await connection.execute(
        `
          UPDATE users
          SET ic = ?, password = ?, status = CASE WHEN status IS NULL OR status = '' THEN 'aktif' ELSE status END, updated_at = CURRENT_TIMESTAMP
          WHERE ic = ?
        `,
        [normalizedIC, hashedPassword, oldIC]
      );

      if (requiresICUpdate) {
        for (const { table, column } of tablesToUpdate) {
          try {
            await connection.execute(
              `UPDATE ${table} SET ${column} = ? WHERE ${column} = ?`,
              [normalizedIC, oldIC]
            );
          } catch (error) {
            // Ignore missing tables
            if (error.code !== 'ER_NO_SUCH_TABLE') {
              throw error;
            }
          }
        }
      }

      await connection.query('SET FOREIGN_KEY_CHECKS = 1');
      await connection.commit();
    } catch (error) {
      await connection.query('SET FOREIGN_KEY_CHECKS = 1').catch(() => {});
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    const [updatedUsers] = await pool.execute(
      'SELECT * FROM users WHERE ic = ?',
      [normalizedIC]
    );

    if (updatedUsers.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Gagal mengemaskini akaun. Sila cuba lagi atau hubungi pentadbir.'
      });
    }

    const updatedUser = updatedUsers[0];
    updatedUser.ic_formatted = formatICWithHyphen(updatedUser.ic);
    const { password: _, ...userWithoutPassword } = updatedUser;
    userWithoutPassword.ic_formatted = formatICWithHyphen(updatedUser.ic);

    if (updatedUser.status !== 'aktif') {
      return res.status(200).json({
        success: true,
        message: 'Maklumat berjaya dikemaskini. Akaun anda masih memerlukan kelulusan pentadbir.',
        data: {
          user: userWithoutPassword,
          token: null
        }
      });
    }

    const token = jwt.sign(
      {
        userId: updatedUser.ic,
        nama: updatedUser.nama,
        role: updatedUser.role
      },
      process.env.JWT_SECRET,
      { expiresIn: SESSION_DURATION_SECONDS }
    );

    const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000).toISOString();

    res.status(200).json({
      success: true,
      message: 'Pendaftaran berjaya! Anda kini boleh mengakses sistem.',
      data: {
        user: userWithoutPassword,
        token,
        expiresIn: SESSION_DURATION_SECONDS,
        expiresAt
      }
    });
  } catch (error) {
    console.error('Register existing user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { icNumber, password } = req.body;

    // Find user by icNumber
    const [users] = await pool.execute(
      "SELECT * FROM users WHERE ic = ?",
      [icNumber]
    );

    if (!users || users.length === 0) {
      // Log failed authentication attempt
      logFailedAuthAttempt(req, 'User not found');
      return res.status(401).json({
        success: false,
        message: 'IC Number atau kata laluan salah'
      });
    }

    const user = users[0];

    // SECURITY: Only use bcrypt comparison - never allow plaintext passwords
    // Check if password is already hashed (starts with $2a$, $2b$, or $2y$)
    const isHashed = user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$'));
    
    let isPasswordValid = false;
    if (isHashed) {
      // Password is hashed, use bcrypt comparison
      isPasswordValid = await bcrypt.compare(password, user.password);
    } else {
      // Password is not hashed (legacy data), hash it and update the database
      // This should not happen in production, but we handle it securely
      console.warn(`⚠️ SECURITY WARNING: User ${user.ic} has unhashed password. Migrating to hashed password.`);
      const hashedPassword = await bcrypt.hash(password, 12);
      await pool.execute(
        'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE ic = ?',
        [hashedPassword, user.ic]
      );
      // For this login attempt, compare the provided password with the newly hashed one
      isPasswordValid = await bcrypt.compare(password, hashedPassword);
    }
    
    if (!isPasswordValid) {
      // Log failed authentication attempt
      logFailedAuthAttempt(req, 'Invalid password');
      return res.status(401).json({
        success: false,
        message: 'IC Number atau kata laluan salah'
      });
    }

    // Check if user account is approved (status must be 'aktif')
    if (user.status === 'pending') {
      logFailedAuthAttempt(req, 'Account pending approval');
      return res.status(403).json({
        success: false,
        message: 'Akaun anda sedang menunggu kelulusan daripada pentadbir. Sila tunggu sehingga kelulusan diberikan.',
        accountStatus: 'pending'
      });
    }

    if (user.status === 'tidak_aktif') {
      logFailedAuthAttempt(req, 'Account inactive');
      return res.status(403).json({
        success: false,
        message: 'Akaun anda telah dinyahaktifkan. Sila hubungi pentadbir untuk maklumat lanjut.',
        accountStatus: 'tidak_aktif'
      });
    }

    // Generate JWT token only for approved (aktif) users
    const token = jwt.sign(
      { 
        userId: user.ic, 
        nama: user.nama,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: SESSION_DURATION_SECONDS }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000).toISOString();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        token,
        expiresIn: SESSION_DURATION_SECONDS,
        expiresAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    console.error('Database error details:', error.message, error.code);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT ic, nama, email, role, status, created_at, updated_at FROM users WHERE ic = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get current user with password
    const [users] = await pool.execute(
      'SELECT password FROM users WHERE ic = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, users[0].password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await pool.execute(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE ic = ?',
      [hashedNewPassword, req.user.userId]
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Admin-only: Change any user's password
export const adminChangePassword = async (req, res) => {
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
        message: 'Only admin can change other users\' passwords'
      });
    }

    const { user_ic, newPassword } = req.body;

    // Check if target user exists
    const [users] = await pool.execute(
      'SELECT ic, nama, role FROM users WHERE ic = ?',
      [user_ic]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await pool.execute(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE ic = ?',
      [hashedNewPassword, user_ic]
    );

    res.json({
      success: true,
      message: `Password for ${users[0].nama} (${users[0].role}) has been changed successfully`
    });
  } catch (error) {
    console.error('Admin change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Request password reset (send reset email)
export const requestPasswordReset = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { icNumber } = req.body;

    // Find user by IC number
    const [users] = await pool.execute(
      'SELECT ic, nama, email FROM users WHERE ic = ?',
      [icNumber]
    );

    // Don't reveal if user exists or not for security
    if (users.length === 0) {
      // Still return success to prevent user enumeration
      return res.json({
        success: true,
        message: 'Jika nombor kad pengenalan wujud dalam sistem, pautan reset kata laluan telah dihantar ke emel pendaftaran anda.'
      });
    }

    const user = users[0];

    // Check if user has an email registered
    if (!user.email) {
      return res.status(400).json({
        success: false,
        message: 'Tiada emel didaftarkan untuk akaun ini. Sila hubungi pentadbir sistem.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Token expires in 24 hours (matching idMe style)

    // Store token in database
    try {
      await pool.execute(
        'INSERT INTO password_reset_tokens (user_ic, token, expires_at) VALUES (?, ?, ?)',
        [user.ic, resetToken, expiresAt]
      );
    } catch (dbError) {
      // If table doesn't exist yet, we'll handle it gracefully
      console.error('Error storing reset token:', dbError);
      // For now, we'll still try to send email, but the reset won't work until migration is run
    }

    // Create reset link
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    // Send password reset email with idMe style
    console.log('\n🔐 ===== PASSWORD RESET REQUEST =====');
    console.log('User IC:', user.ic);
    console.log('User Name:', user.nama);
    console.log('User Email:', user.email);
    console.log('Reset Link:', resetLink);
    console.log('Token expires at:', expiresAt);
    
    const emailResult = await sendPasswordResetEmail(user.email, resetLink, user.nama, user.ic);

    if (!emailResult.success) {
      console.error('\n❌ FAILED TO SEND PASSWORD RESET EMAIL');
      console.error('Error:', emailResult.error);
      console.error('Error code:', emailResult.code);
      console.error('=====================================\n');
      
      // Check if email service is not configured
      if (emailResult.error === 'Transporter not available' || emailResult.message === 'Email service not configured') {
        console.error('⚠️ Email service is not configured. Please set EMAIL_USER and EMAIL_PASSWORD environment variables.');
        return res.status(500).json({
          success: false,
          message: 'Perkhidmatan emel tidak dikonfigurasi. Sila hubungi pentadbir sistem.',
          error: process.env.NODE_ENV === 'development' ? 'Email service not configured. Please set EMAIL_USER and EMAIL_PASSWORD.' : undefined
        });
      }
      
      // Return detailed error to help with debugging
      return res.status(500).json({
        success: false,
        message: 'Gagal menghantar emel reset kata laluan. Sila cuba lagi kemudian.',
        error: process.env.NODE_ENV === 'development' ? emailResult.error : undefined
      });
    }

    console.log('✅ Password reset email sent successfully');
    console.log('Message ID:', emailResult.messageId);
    console.log('=====================================\n');

    res.json({
      success: true,
      message: 'Jika nombor kad pengenalan wujud dalam sistem, pautan reset kata laluan telah dihantar ke emel pendaftaran anda.'
    });
  } catch (error) {
    console.error('Request password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Reset password with token
// Get pending registrations (admin/staff only)
export const getPendingRegistrations = async (req, res) => {
  try {
    // Only admin and staff (teachers) can view pending registrations
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can view pending registrations.'
      });
    }

    const [pendingUsers] = await pool.execute(
      `SELECT 
        ic, 
        nama, 
        role, 
        status, 
        created_at,
        email,
        telefon,
        alamat,
        umur
      FROM users 
      WHERE status = 'pending' 
      ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      data: pendingUsers
    });
  } catch (error) {
    console.error('Get pending registrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Approve registration (admin/staff only)
export const approveRegistration = async (req, res) => {
  try {
    // Only admin and staff can approve registrations
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can approve registrations.'
      });
    }

    const { user_ic } = req.body;

    if (!user_ic) {
      return res.status(400).json({
        success: false,
        message: 'User IC is required'
      });
    }

    // Check if user exists and is pending
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE ic = ?',
      [user_ic]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];

    if (user.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `User status is ${user.status}, not pending. Cannot approve.`
      });
    }

    // Update user status to 'aktif'
    await pool.execute(
      'UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE ic = ?',
      ['aktif', user_ic]
    );

    // Get updated user
    const [updatedUsers] = await pool.execute(
      'SELECT ic, nama, role, status, email, telefon FROM users WHERE ic = ?',
      [user_ic]
    );

    res.json({
      success: true,
      message: `Registration for ${updatedUsers[0].nama} has been approved.`,
      data: updatedUsers[0]
    });
  } catch (error) {
    console.error('Approve registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Reject registration (admin/staff only)
// Get user preferences
export const getPreferences = async (req, res) => {
  try {
    const userId = req.user?.ic || req.user?.userId || req.user?.user_ic;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User identifier is missing'
      });
    }

    const [users] = await pool.execute(
      'SELECT preferences FROM users WHERE ic = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Parse preferences JSON or return defaults
    let preferences = {};
    if (users[0].preferences) {
      try {
        preferences = typeof users[0].preferences === 'string' 
          ? JSON.parse(users[0].preferences) 
          : users[0].preferences;
      } catch (e) {
        console.error('Error parsing preferences:', e);
        preferences = {};
      }
    }

    // Return defaults if no preferences set
    const defaultPreferences = {
      theme: 'light',
      colorScheme: 'summer', // Default to green emerald (summer)
      language: 'ms',
      fontFamily: 'system',
      fontSize: 'medium'
    };

    res.json({
      success: true,
      data: { ...defaultPreferences, ...preferences }
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update user preferences
export const updatePreferences = async (req, res) => {
  try {
    const userId = req.user?.ic || req.user?.userId || req.user?.user_ic;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User identifier is missing'
      });
    }

    const { theme, colorScheme, language, fontFamily, fontSize } = req.body;

    // Validate preferences
    const validThemes = ['light', 'dark', 'auto'];
    const validColorSchemes = ['spring', 'summer', 'fall', 'winter'];
    const validLanguages = ['ms', 'en'];
    const validFontFamilies = ['system', 'sans-serif', 'serif', 'monospace'];
    const validFontSizes = ['small', 'medium', 'large', 'xlarge'];

    const preferences = {};
    if (theme && validThemes.includes(theme)) {
      preferences.theme = theme;
    }
    if (colorScheme && validColorSchemes.includes(colorScheme)) {
      preferences.colorScheme = colorScheme;
    }
    if (language && validLanguages.includes(language)) {
      preferences.language = language;
    }
    if (fontFamily && validFontFamilies.includes(fontFamily)) {
      preferences.fontFamily = fontFamily;
    }
    if (fontSize && validFontSizes.includes(fontSize)) {
      preferences.fontSize = fontSize;
    }

    // Get existing preferences and merge
    const [users] = await pool.execute(
      'SELECT preferences FROM users WHERE ic = ?',
      [userId]
    );

    let existingPreferences = {};
    if (users[0]?.preferences) {
      try {
        existingPreferences = typeof users[0].preferences === 'string'
          ? JSON.parse(users[0].preferences)
          : users[0].preferences;
      } catch (e) {
        console.error('Error parsing existing preferences:', e);
      }
    }

    const mergedPreferences = { ...existingPreferences, ...preferences };

    // Update preferences in database
    await pool.execute(
      'UPDATE users SET preferences = ?, updated_at = CURRENT_TIMESTAMP WHERE ic = ?',
      [JSON.stringify(mergedPreferences), userId]
    );

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: mergedPreferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const rejectRegistration = async (req, res) => {
  try {
    // Only admin and staff can reject registrations
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can reject registrations.'
      });
    }

    const { user_ic } = req.body;

    if (!user_ic) {
      return res.status(400).json({
        success: false,
        message: 'User IC is required'
      });
    }

    // Check if user exists and is pending
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE ic = ?',
      [user_ic]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];

    if (user.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `User status is ${user.status}, not pending. Cannot reject.`
      });
    }

    // Update user status to 'tidak_aktif' (rejected)
    await pool.execute(
      'UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE ic = ?',
      ['tidak_aktif', user_ic]
    );

    // Get updated user
    const [updatedUsers] = await pool.execute(
      'SELECT ic, nama, role, status FROM users WHERE ic = ?',
      [user_ic]
    );

    res.json({
      success: true,
      message: `Registration for ${updatedUsers[0].nama} has been rejected.`,
      data: updatedUsers[0]
    });
  } catch (error) {
    console.error('Reject registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { token, newPassword } = req.body;

    // Find valid token
    const [tokens] = await pool.execute(
      'SELECT * FROM password_reset_tokens WHERE token = ? AND used = FALSE AND expires_at > NOW()',
      [token]
    );

    if (tokens.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    const resetToken = tokens[0];

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password and mark token as used
    await pool.execute('START TRANSACTION');

    try {
      // Update password
      await pool.execute(
        'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE ic = ?',
        [hashedNewPassword, resetToken.user_ic]
      );

      // Mark token as used
      await pool.execute(
        'UPDATE password_reset_tokens SET used = TRUE WHERE token = ?',
        [token]
      );

      await pool.execute('COMMIT');
    } catch (error) {
      await pool.execute('ROLLBACK');
      throw error;
    }

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Check if user profile is complete
export const checkProfileComplete = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.ic || req.user?.user_ic;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot determine user identity from token'
      });
    }

    // Get user data
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE ic = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];
    const missingFields = [];

    // Check required fields for all users
    if (!user.umur || user.umur === null || user.umur === 0) missingFields.push('umur');
    if (!user.telefon || user.telefon.trim() === '') missingFields.push('telefon');
    if (!user.email || user.email.trim() === '') missingFields.push('email');

    // Check role-specific fields
    if (user.role === 'student') {
      const [students] = await pool.execute(
        'SELECT * FROM students WHERE user_ic = ?',
        [userId]
      );
      
      if (students.length === 0 || !students[0].kelas_id || !students[0].tarikh_daftar) {
        missingFields.push('kelas_id');
        missingFields.push('tarikh_daftar');
      }
    } else if (user.role === 'teacher') {
      const [teachers] = await pool.execute(
        'SELECT * FROM teachers WHERE user_ic = ?',
        [userId]
      );
      
      if (teachers.length === 0 || !teachers[0].kepakaran) {
        missingFields.push('kepakaran');
      }
    }

    const isComplete = missingFields.length === 0;

    res.json({
      success: true,
      data: {
        isComplete,
        missingFields
      }
    });
  } catch (error) {
    console.error('Check profile complete error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user?.ic || req.user?.userId || req.user?.user_ic;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User identifier is missing from the session'
      });
    }
    const { umur, telefon, email, kelas_id, tarikh_daftar, kepakaran } = req.body;

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Update users table
      const updateFields = [];
      const updateValues = [];

      if (umur !== undefined) {
        updateFields.push('umur = ?');
        updateValues.push(umur === null ? null : umur);
      }
      if (telefon !== undefined) {
        updateFields.push('telefon = ?');
        updateValues.push(telefon === null ? null : telefon);
      }
      if (email !== undefined) {
        updateFields.push('email = ?');
        updateValues.push(email === null ? null : email);
      }

      if (updateFields.length > 0) {
        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(userId);

        await connection.execute(
          `UPDATE users SET ${updateFields.join(', ')} WHERE ic = ?`,
          updateValues
        );
      }

      // Update role-specific tables
      const [users] = await connection.execute('SELECT role FROM users WHERE ic = ?', [userId]);
      const userRole = users[0]?.role;

      if (userRole === 'student') {
        const [students] = await connection.execute(
          'SELECT * FROM students WHERE user_ic = ?',
          [userId]
        );

        if (students.length === 0) {
          await connection.execute(
            'INSERT INTO students (user_ic, kelas_id, tarikh_daftar) VALUES (?, ?, ?)',
            [
              userId,
              kelas_id === undefined || kelas_id === null ? null : kelas_id,
              tarikh_daftar === undefined || tarikh_daftar === null ? null : tarikh_daftar
            ]
          );
        } else {
          const studentUpdateFields = [];
          const studentUpdateValues = [];

          if (kelas_id !== undefined) {
            studentUpdateFields.push('kelas_id = ?');
            studentUpdateValues.push(kelas_id === null ? null : kelas_id);
          }
          if (tarikh_daftar !== undefined) {
            studentUpdateFields.push('tarikh_daftar = ?');
            studentUpdateValues.push(tarikh_daftar === null ? null : tarikh_daftar);
          }

          if (studentUpdateFields.length > 0) {
            studentUpdateValues.push(userId);
            await connection.execute(
              `UPDATE students SET ${studentUpdateFields.join(', ')} WHERE user_ic = ?`,
              studentUpdateValues
            );
          }
        }
      } else if (userRole === 'teacher') {
        const [teachers] = await connection.execute(
          'SELECT * FROM teachers WHERE user_ic = ?',
          [userId]
        );

        if (teachers.length === 0) {
          const kepakaranJSON = kepakaran ? JSON.stringify(kepakaran) : null;
          await connection.execute(
            'INSERT INTO teachers (user_ic, kepakaran) VALUES (?, ?)',
            [userId, kepakaranJSON]
          );
        } else if (kepakaran !== undefined) {
          const kepakaranJSON =
            Array.isArray(kepakaran) && kepakaran.length > 0
              ? JSON.stringify(kepakaran)
              : null;
          await connection.execute(
            'UPDATE teachers SET kepakaran = ? WHERE user_ic = ?',
            [kepakaranJSON, userId]
          );
        }
      }

      await connection.commit();
      connection.release();

      const [updatedUsers] = await pool.execute(
        'SELECT ic, nama, email, role, status, umur, alamat, telefon FROM users WHERE ic = ?',
        [userId]
      );

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUsers[0]
      });
    } catch (error) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Rollback error:', rollbackError);
      }
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
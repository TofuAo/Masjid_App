import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool } from '../config/database.js';
import { validationResult } from 'express-validator';
import { sendPasswordResetEmail, sendWelcomeEmail } from '../utils/emailService.js';

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

    const { nama, ic_number, email, password, role } = req.body;

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

    // Don't generate token for pending users - they need approval first
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

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
      return res.status(401).json({
        success: false,
        message: 'IC Number atau kata laluan salah'
      });
    }

    const user = users[0];

    // DEV ONLY: allow bcrypt OR plaintext password for demo users. REMOVE BEFORE PRODUCTION
    const isPasswordValid = password === user.password || await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'IC Number atau kata laluan salah'
      });
    }

    // Check if user account is approved (status must be 'aktif')
    if (user.status === 'pending') {
      return res.status(403).json({
        success: false,
        message: 'Akaun anda sedang menunggu kelulusan daripada pentadbir. Sila tunggu sehingga kelulusan diberikan.',
        accountStatus: 'pending'
      });
    }

    if (user.status === 'tidak_aktif') {
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
      process.env.JWT_SECRET
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        token
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

    const userId = req.user.userId;
    const { umur, telefon, email, kelas_id, tarikh_daftar, kepakaran } = req.body;

    // Start transaction
    await pool.execute('START TRANSACTION');

    try {
      // Update users table
      const updateFields = [];
      const updateValues = [];

      if (umur !== undefined) {
        updateFields.push('umur = ?');
        updateValues.push(umur);
      }
      if (telefon !== undefined) {
        updateFields.push('telefon = ?');
        updateValues.push(telefon);
      }
      if (email !== undefined) {
        updateFields.push('email = ?');
        updateValues.push(email);
      }

      if (updateFields.length > 0) {
        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(userId);
        
        await pool.execute(
          `UPDATE users SET ${updateFields.join(', ')} WHERE ic = ?`,
          updateValues
        );
      }

      // Update role-specific tables
      const [users] = await pool.execute('SELECT role FROM users WHERE ic = ?', [userId]);
      const userRole = users[0].role;

      if (userRole === 'student') {
        // Check if student record exists
        const [students] = await pool.execute(
          'SELECT * FROM students WHERE user_ic = ?',
          [userId]
        );

        if (students.length === 0) {
          // Insert new student record
          await pool.execute(
            'INSERT INTO students (user_ic, kelas_id, tarikh_daftar) VALUES (?, ?, ?)',
            [userId, kelas_id || null, tarikh_daftar || null]
          );
        } else {
          // Update existing student record
          const studentUpdateFields = [];
          const studentUpdateValues = [];

          if (kelas_id !== undefined) {
            studentUpdateFields.push('kelas_id = ?');
            studentUpdateValues.push(kelas_id);
          }
          if (tarikh_daftar !== undefined) {
            studentUpdateFields.push('tarikh_daftar = ?');
            studentUpdateValues.push(tarikh_daftar);
          }

          if (studentUpdateFields.length > 0) {
            studentUpdateValues.push(userId);
            await pool.execute(
              `UPDATE students SET ${studentUpdateFields.join(', ')} WHERE user_ic = ?`,
              studentUpdateValues
            );
          }
        }
      } else if (userRole === 'teacher') {
        // Check if teacher record exists
        const [teachers] = await pool.execute(
          'SELECT * FROM teachers WHERE user_ic = ?',
          [userId]
        );

        if (teachers.length === 0) {
          // Insert new teacher record
          const kepakaranJSON = kepakaran ? JSON.stringify(kepakaran) : null;
          await pool.execute(
            'INSERT INTO teachers (user_ic, kepakaran) VALUES (?, ?)',
            [userId, kepakaranJSON]
          );
        } else {
          // Update existing teacher record
          if (kepakaran !== undefined) {
            const kepakaranJSON = kepakaran ? JSON.stringify(kepakaran) : null;
            await pool.execute(
              'UPDATE teachers SET kepakaran = ? WHERE user_ic = ?',
              [kepakaranJSON, userId]
            );
          }
        }
      }

      await pool.execute('COMMIT');

      // Get updated user data
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
      await pool.execute('ROLLBACK');
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
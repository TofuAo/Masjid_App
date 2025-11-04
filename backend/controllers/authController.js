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
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { nama, email, password, role } = req.body;

    // Check if user already exists
    const [existingUsers] = await pool.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers && existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

// Generate IC (using email as base for now, in production you'd want proper IC generation)
    const ic = email.split('@')[0] + Math.random().toString(36).substr(2, 4);
    //const username = 'user_' + Math.random().toString(36).substr(2, 8);

    // Create new user
    await pool.execute(
      "INSERT INTO users (ic, nama, email, password, role) VALUES (?, ?, ?, ?, ?)",
      [ic, nama, email, hashedPassword, role]
    );

 // Get newly created user
    const [users] = await pool.execute(
      "SELECT * FROM users WHERE ic = ?",
      [ic]
    );

    const user = users[0];

    // Generate JWT token
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

    // Send welcome email (don't fail registration if email fails)
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const loginLink = `${frontendUrl}/login`;
      await sendWelcomeEmail(user.email, loginLink, user.nama, null);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Continue with registration even if email fails
    }

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: userWithoutPassword,
        token
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
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
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

    const { email } = req.body;

    // Find user by email
    const [users] = await pool.execute(
      'SELECT ic, nama, email FROM users WHERE email = ?',
      [email]
    );

    // Don't reveal if email exists or not for security
    if (users.length === 0) {
      // Still return success to prevent email enumeration
      return res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent.'
      });
    }

    const user = users[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

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

    // Send password reset email
    const emailResult = await sendPasswordResetEmail(user.email, resetLink, user.nama);

    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email. Please try again later.'
      });
    }

    res.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent.'
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
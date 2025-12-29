import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool } from '../config/database.js';
import { validationResult } from 'express-validator';
import { sendPasswordResetEmail } from '../utils/emailService.js';
import { sendPasswordResetSMS, generateResetCode } from '../utils/smsService.js';
import { formatICWithHyphen, normalizeICForQuery, isValidICFormat } from '../utils/icUtils.js';
import { normalizePhone } from '../utils/phoneNormalizer.js';
import { logFailedAuthAttempt, logSuspiciousActivity } from '../middleware/securityLogger.js';
import { fetchUserRoles } from '../services/userRoleService.js';
import { findUserByNormalizedIc, findAllUsersByNormalizedIc, getUserWithRoles } from '../services/userLookupService.js';
import { createSnapshot, SNAPSHOT_TTL_HOURS } from '../utils/adminActionSnapshots.js';
import { validatePasswordStrength as checkPasswordStrength } from '../utils/passwordPolicy.js';
import { isAccountLocked, recordFailedAttempt, recordSuccessfulLogin, ensureLoginAttemptsTable } from '../services/accountLockoutService.js';

const SESSION_DURATION_SECONDS = 24 * 60 * 60; // 24 hours
const REFRESH_TOKEN_DURATION_SECONDS = 7 * 24 * 60 * 60; // 7 days

async function attachRoleMetadata(user) {
  const roles = await fetchUserRoles(user.ic, user.role);
  const normalizedRoles = roles.length > 0 ? roles : [user.role];
  const activeRole = normalizedRoles.includes(user.role) ? user.role : normalizedRoles[0];
  return {
    roles: normalizedRoles,
    activeRole
  };
}

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

    const { nama, ic_number, email, password, confirmPassword, telefon, umur } = req.body;

    // Password is optional for student registration
    if (password && confirmPassword && confirmPassword !== password) {
      return res.status(400).json({
        success: false,
        message: 'Kata laluan dan pengesahan tidak sepadan',
        errors: [{ msg: 'Kata laluan dan pengesahan tidak sepadan', param: 'confirmPassword' }]
      });
    }

    // Validate and normalize IC number
    if (!isValidICFormat(ic_number)) {
      return res.status(400).json({
        success: false,
        message: 'Format IC tidak sah. Sila masukkan 12 digit nombor IC.'
      });
    }

    const normalizedIC = normalizeICForQuery(ic_number);
    
    // Hardcode role to 'student' for registration
    const userRole = 'student';
    const normalizedEmail = email && email.trim() !== '' ? email.trim().toLowerCase() : null;

    // Check for duplicate users using robust lookup (handles different IC formats)
    let existingUsers = [];
    try {
      const allUsers = await findAllUsersByNormalizedIc(normalizedIC);
      existingUsers = allUsers.map(u => ({ ...u, ic: u.ic })); // Keep original IC format
    } catch (error) {
      console.error('[REGISTER] Error checking for existing users:', error);
      // Fallback to simple query
      const [users] = await pool.execute(
        "SELECT * FROM users WHERE REPLACE(REPLACE(ic, '-', ''), ' ', '') = ?",
        [normalizedIC]
      );
      existingUsers = users;
    }

    if (normalizedEmail) {
      const [existingEmails] = await pool.execute(
        "SELECT * FROM users WHERE email = ?",
        [normalizedEmail]
      );

      if (existingEmails && existingEmails.length > 0 && existingEmails[0].ic !== normalizedIC) {
        return res.status(400).json({
          success: false,
          message: 'Emel ini sudah didaftarkan. Sila gunakan emel lain atau log masuk.'
        });
      }
    }

    // Validate password strength if provided
    if (password && password.trim() !== '') {
      const passwordValidation = checkPasswordStrength(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({
          success: false,
          message: passwordValidation.message
        });
      }
      // Warn user if password is weak but still accept it
      if (passwordValidation.warning) {
        console.warn(`[REGISTER] Weak password used for IC: ${normalizedIC}`);
      }
    }

    // Hash password only if provided (password is optional for student registration)
    let hashedPassword = null;
    if (password && password.trim() !== '') {
      try {
        hashedPassword = await bcrypt.hash(password, 12);
      } catch (error) {
        console.error('[REGISTER] Password hashing error:', error);
        return res.status(500).json({
          success: false,
          message: 'Ralat sistem semasa memproses kata laluan. Sila cuba lagi.'
        });
      }
    }

    if (existingUsers && existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      
      // Check if user already has student role (either as primary role or in user_roles)
      const hasStudentRole = existingUser.role === userRole || 
                            (existingUser.allRoles && existingUser.allRoles.includes(userRole));
      
      // Also check user_roles table directly
      let hasRoleInUserRoles = false;
      try {
        const normalizedExistingIC = normalizeICForQuery(existingUser.ic);
        const [duplicateRole] = await pool.execute(
          `SELECT id FROM user_roles 
           WHERE REPLACE(REPLACE(user_ic, '-', ''), ' ', '') = ? AND role = ?`,
          [normalizedExistingIC, userRole]
        );
        hasRoleInUserRoles = duplicateRole.length > 0;
      } catch (error) {
        console.error('[REGISTER] Error checking user_roles:', error);
      }

      if (hasStudentRole || hasRoleInUserRoles) {
        return res.status(400).json({
          success: false,
          message: 'Nombor IC ini sudah didaftarkan sebagai pelajar. Sila log masuk atau hubungi pentadbir jika anda memerlukan bantuan.',
          accountStatus: 'already_registered'
        });
      }

      const fields = [];
      const params = [];

      if (nama && nama.trim() !== '' && nama.trim() !== existingUser.nama) {
        fields.push('nama = ?');
        params.push(nama.trim());
      }

      if (normalizedEmail && normalizedEmail !== existingUser.email) {
        fields.push('email = ?');
        params.push(normalizedEmail);
      }

      if (telefon && telefon.trim() !== '' && telefon.trim() !== existingUser.telefon) {
        fields.push('telefon = ?');
        params.push(normalizePhone(telefon.trim()));
      }

      if (hashedPassword) {
        fields.push('password = ?');
        params.push(hashedPassword);
      }

      if (fields.length > 0) {
        await pool.execute(
          `UPDATE users
           SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
           WHERE ic = ?`,
          [...params, normalizedIC]
        );
      }

      await pool.execute(
        'INSERT INTO user_roles (user_ic, role) VALUES (?, ?)',
        [normalizedIC, userRole]
      );

      const [updatedUsers] = await pool.execute(
        `SELECT ic, nama, email, telefon, umur, status, role, created_at, updated_at
         FROM users
         WHERE ic = ?`,
        [normalizedIC]
      );

      if (updatedUsers.length === 0) {
        console.error('User expected after role addition not found:', normalizedIC);
        return res.status(500).json({
          success: false,
          message: 'Gagal mengemas kini akaun. Sila cuba lagi.'
        });
      }

      const updatedUser = updatedUsers[0];
      const { password: __, ...userWithoutPassword } = updatedUser;
      userWithoutPassword.ic_formatted = formatICWithHyphen(updatedUser.ic);

      return res.status(201).json({
        success: true,
        message: 'Peranan pelajar telah ditambahkan kepada akaun sedia ada.',
        data: {
          user: userWithoutPassword,
          token: null
        }
      });
    }

    // Create new user with IC number as primary key
    // Set status to 'pending' - requires admin approval
    // Password is optional for students - they will set it later or admin will set it
    await pool.execute(
      "INSERT INTO users (ic, nama, email, telefon, umur, password, role, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')",
      [
        normalizedIC, 
        nama, 
        normalizedEmail, 
        telefon && telefon.trim() !== '' ? normalizePhone(telefon.trim()) : null,
        umur && umur !== '' ? parseInt(umur) : null,
        hashedPassword, 
        userRole
      ]
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

export const studentLogin = async (req, res) => {
  try {
    const { icNumber } = req.body;

    if (!icNumber) {
      return res.status(400).json({
        success: false,
        message: 'IC Number diperlukan'
      });
    }

    // Normalize IC number
    const normalizedIC = icNumber.replace(/\D/g, '');
    
    if (normalizedIC.length !== 12) {
      return res.status(400).json({
        success: false,
        message: 'Nombor IC mestilah 12 digit'
      });
    }

    // Find student by IC number (handle both formats: with and without hyphens)
    // The normalizeICMiddleware should have normalized req.body.icNumber, but we'll also check both formats
    const [users] = await pool.execute(
      "SELECT * FROM users WHERE (REPLACE(ic, '-', '') = ? OR ic = ?) AND role = 'student'",
      [normalizedIC, normalizedIC]
    );

    if (users.length === 0) {
      logFailedAuthAttempt(req, normalizedIC, 'Student not found');
      return res.status(401).json({
        success: false,
        message: 'Pelajar tidak ditemui. Sila pastikan nombor IC anda betul.'
      });
    }

    const user = users[0];

    // Check account status
    if (user.status === 'pending') {
      return res.status(403).json({
        success: false,
        message: 'Akaun anda sedang menunggu kelulusan daripada pentadbir.'
      });
    }

    if (user.status !== 'aktif') {
      return res.status(403).json({
        success: false,
        message: 'Akaun anda telah dinyahaktifkan. Sila hubungi pentadbir.'
      });
    }

    // Generate token
    const token = jwt.sign(
      {
        userId: user.ic,
        nama: user.nama,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: SESSION_DURATION_SECONDS }
    );

    const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000).toISOString();

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    userWithoutPassword.ic_formatted = formatICWithHyphen(user.ic);

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
    console.error('Student login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const mapRequestedRoleToActiveRole = (requestedRole, availableRoles = [], primaryRole) => {
  if (!requestedRole || !availableRoles.length) return null;
  const normalized = availableRoles.map((r) => (r || '').toLowerCase());

  if (requestedRole === 'admin') {
    return normalized.includes('admin') ? 'admin' : null;
  }

  if (requestedRole === 'pic') {
    if (normalized.includes('pic')) return 'pic';
    // Allow admin to act as PIC even if not explicitly assigned
    if (normalized.includes('admin') || (primaryRole && primaryRole.toLowerCase() === 'admin')) {
      return 'pic';
    }
    return null;
  }

  if (requestedRole === 'ib') {
    return normalized.includes('ib') ? 'ib' : null;
  }

  if (requestedRole === 'staff-teacher') {
    if (normalized.includes('staff')) return 'staff';
    if (normalized.includes('teacher')) return 'teacher';
    // Allow admin to act as teacher/staff even if not explicitly assigned
    if (normalized.includes('admin') || (primaryRole && primaryRole.toLowerCase() === 'admin')) {
      return 'teacher';
    }
  }

  return null;
};

export const login = async (req, res) => {
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

    const { icNumber, password, requestedRole } = req.body;

    // Validate IC format
    if (!icNumber || !isValidICFormat(icNumber)) {
      logFailedAuthAttempt(req, 'Invalid IC format');
      return res.status(400).json({
        success: false,
        message: 'Format IC tidak sah. Sila masukkan 12 digit nombor IC.'
      });
    }

    // Validate password presence
    if (!password || password.trim().length === 0) {
      logFailedAuthAttempt(req, 'Missing password');
      return res.status(400).json({
        success: false,
        message: 'Kata laluan diperlukan'
      });
    }

    // Normalize IC for database lookup (ignore hyphens/spaces)
    const normalizedICForQuery = normalizeICForQuery(icNumber);
    
    console.log('[LOGIN] Attempt - Original IC:', icNumber, 'Normalized:', normalizedICForQuery, 'Requested Role:', requestedRole);

    // SECURITY: Check if account is locked before attempting login
    const lockStatus = await isAccountLocked(normalizedICForQuery);
    if (lockStatus.locked) {
      logFailedAuthAttempt(req, 'Account locked');
      return res.status(423).json({
        success: false,
        message: `Akaun telah dikunci disebabkan terlalu banyak percubaan log masuk yang gagal. Sila cuba lagi selepas ${lockStatus.minutesRemaining} minit.`,
        accountStatus: 'locked',
        lockoutExpires: lockStatus.lockoutExpires,
        minutesRemaining: lockStatus.minutesRemaining
      });
    }

    // Find user by normalized IC (supports both hyphenated and non-hyphenated formats)
    // If a specific role is requested, prioritize users with that role
    let user;
    try {
      user = await findUserByNormalizedIc(normalizedICForQuery, requestedRole);
    } catch (error) {
      console.error('[LOGIN] Database error finding user:', error);
      logFailedAuthAttempt(req, 'Database error during lookup');
      return res.status(500).json({
        success: false,
        message: 'Ralat sistem. Sila cuba lagi kemudian.'
      });
    }
    
    if (user) {
      console.log('[LOGIN] User found - IC:', user.ic, 'Nama:', user.nama, 'Role:', user.role, 'Status:', user.status);
      console.log('[LOGIN] User has password:', !!user.password);
    } else {
      console.log('[LOGIN] User NOT found for IC:', normalizedICForQuery);
      
      // Record failed attempt for unknown user (potential brute force)
      await recordFailedAttempt(normalizedICForQuery, req.ip || req.connection.remoteAddress);
      
      // Check for duplicate accounts that might exist
      try {
        const allUsers = await findAllUsersByNormalizedIc(normalizedICForQuery);
        if (allUsers.length > 0) {
          console.log('[LOGIN] Found duplicate accounts:', allUsers.map(u => `${u.ic} (${u.role})`).join(', '));
        }
      } catch (error) {
        console.error('[LOGIN] Error checking for duplicates:', error);
      }
      
      // Log failed authentication attempt
      logFailedAuthAttempt(req, 'User not found');
      return res.status(401).json({
        success: false,
        message: 'IC Number atau kata laluan salah'
      });
    }

    // Reject student logins - they must use student login endpoint
    if (user.role === 'student') {
      logFailedAuthAttempt(req, 'Student attempted normal login');
      return res.status(403).json({
        success: false,
        message: 'Pelajar mesti menggunakan Student Login. Sila gunakan tab "Student Login" untuk log masuk.',
        accountStatus: 'student_restricted'
      });
    }

    // Check if user has a password set
    if (!user.password) {
      logFailedAuthAttempt(req, 'User has no password');
      return res.status(401).json({
        success: false,
        message: 'Akaun ini tidak mempunyai kata laluan. Sila hubungi pentadbir untuk menetapkan kata laluan.',
        accountStatus: 'no_password'
      });
    }

    // SECURITY: Only use bcrypt comparison - never allow plaintext passwords
    // Check if password is already hashed (starts with $2a$, $2b$, or $2y$)
    const isHashed = user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$');
    
    console.log('[LOGIN] Password check - Has password:', !!user.password, 'Is hashed:', isHashed);
    
    let isPasswordValid = false;
    try {
      if (isHashed) {
        // Password is hashed, use bcrypt comparison
        isPasswordValid = await bcrypt.compare(password, user.password);
        console.log('[LOGIN] Password comparison result:', isPasswordValid);
      } else {
        // Password is not hashed (legacy data), hash it and update the database
        // This should not happen in production, but we handle it securely
        console.warn(`⚠️ SECURITY WARNING: User ${user.ic} has unhashed password. Migrating to hashed password.`);
        logSuspiciousActivity(req, `User ${user.ic} has unhashed password - migrating to bcrypt`);
        
        const hashedPassword = await bcrypt.hash(password, 12);
        await pool.execute(
          'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE ic = ?',
          [hashedPassword, user.ic]
        );
        // For this login attempt, compare the provided password with the newly hashed one
        isPasswordValid = await bcrypt.compare(password, hashedPassword);
      }
    } catch (error) {
      console.error('[LOGIN] Password comparison error:', error);
      logFailedAuthAttempt(req, 'Password comparison error');
      return res.status(500).json({
        success: false,
        message: 'Ralat sistem semasa mengesahkan kata laluan. Sila cuba lagi.'
      });
    }
    
    if (!isPasswordValid) {
      // Record failed login attempt for account lockout
      const lockoutInfo = await recordFailedAttempt(user.ic, req.ip || req.connection.remoteAddress);
      
      // Log failed authentication attempt
      logFailedAuthAttempt(req, 'Invalid password');
      
      // Check if there are duplicate accounts that might have the correct password
      try {
        const allUsers = await findAllUsersByNormalizedIc(normalizedICForQuery);
        if (allUsers.length > 1) {
          console.log('[LOGIN] Multiple accounts found for this IC. User may need to specify role.');
        }
      } catch (error) {
        // Ignore errors in duplicate check
      }
      
      // If account is now locked, inform user
      if (lockoutInfo.locked) {
        return res.status(423).json({
          success: false,
          message: `Terlalu banyak percubaan log masuk yang gagal. Akaun telah dikunci selama 15 minit.`,
          accountStatus: 'locked',
          lockoutExpires: lockoutInfo.lockoutExpires
        });
      }
      
      return res.status(401).json({
        success: false,
        message: `IC Number atau kata laluan salah. ${lockoutInfo.attemptsRemaining > 0 ? `${lockoutInfo.attemptsRemaining} percubaan lagi sebelum akaun dikunci.` : ''}`,
        attemptsRemaining: lockoutInfo.attemptsRemaining
      });
    }
    
    // SECURITY: Record successful login (clears failed attempts)
    await recordSuccessfulLogin(user.ic);

    // Update last_login timestamp
    try {
      await pool.execute(
        'UPDATE users SET last_login = NOW() WHERE ic = ?',
        [user.ic]
      );
    } catch (error) {
      // Log but don't fail login if last_login update fails
      console.warn('[LOGIN] Could not update last_login:', error.message);
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

    // Enrich user with all roles (RBAC)
    let roleMeta;
    let availableRoles;
    try {
      roleMeta = await attachRoleMetadata(user);
      availableRoles = roleMeta.roles || [user.role];
    } catch (error) {
      console.error('[LOGIN] Error fetching role metadata:', error);
      // Fallback to primary role if role fetching fails
      availableRoles = [user.role];
      roleMeta = { roles: availableRoles, activeRole: user.role };
    }

    // Determine active role based on requestedRole and available roles
    let activeRole = mapRequestedRoleToActiveRole(requestedRole, availableRoles, user.role);
    if (!activeRole) {
      // Fallback to metadata activeRole or primary role
      activeRole = roleMeta.activeRole || user.role || availableRoles[0];
    }

    // If user explicitly chose a role, ensure we can honor that choice.
    if (requestedRole) {
      const normalizedRequested = String(requestedRole).toLowerCase().trim();
      const normalizedActive = String(activeRole).toLowerCase().trim();
      
      // Check if the requested role is available
      const hasRequestedRole = availableRoles.some(r => r.toLowerCase() === normalizedRequested);
      
      if (!hasRequestedRole) {
        // Check for aliases (e.g., 'staff-teacher')
        if (normalizedRequested === 'staff-teacher' && (availableRoles.includes('staff') || availableRoles.includes('teacher'))) {
          // Allow staff-teacher to map to staff or teacher
          activeRole = availableRoles.find(r => r === 'teacher' || r === 'staff') || activeRole;
        } else {
          return res.status(403).json({
            success: false,
            message: `Anda tidak mempunyai akses untuk peranan "${requestedRole}". Peranan yang tersedia: ${availableRoles.join(', ')}.`
          });
        }
      } else {
        // User has the role, use it
        activeRole = availableRoles.find(r => r.toLowerCase() === normalizedRequested) || activeRole;
      }
    }

    // Generate JWT access token (short-lived) and refresh token (long-lived)
    const accessToken = jwt.sign(
      { 
        userId: user.ic, 
        nama: user.nama,
        role: activeRole,
        type: 'access'
      },
      process.env.JWT_SECRET,
      { expiresIn: SESSION_DURATION_SECONDS }
    );

    // Generate refresh token for token renewal
    const refreshToken = jwt.sign(
      {
        userId: user.ic,
        type: 'refresh'
      },
      process.env.JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_DURATION_SECONDS }
    );

    // Store refresh token in database (optional - for token revocation)
    // Use normalized IC (without hyphens) for database storage
    const normalizedIcForStorage = normalizeICForQuery(user.ic);
    try {
      await pool.execute(
        `INSERT INTO refresh_tokens (user_ic, token, expires_at, created_at) 
         VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? SECOND), NOW())
         ON DUPLICATE KEY UPDATE token = ?, expires_at = DATE_ADD(NOW(), INTERVAL ? SECOND), created_at = NOW()`,
        [normalizedIcForStorage, refreshToken, REFRESH_TOKEN_DURATION_SECONDS, refreshToken, REFRESH_TOKEN_DURATION_SECONDS]
      );
    } catch (error) {
      // If table doesn't exist, continue without storing (graceful degradation)
      console.warn('[LOGIN] Could not store refresh token (table may not exist):', error.message);
    }

    // Remove password from response and attach role metadata
    const { password: _, ...userWithoutPassword } = user;
    userWithoutPassword.role = activeRole;
    userWithoutPassword.roles = availableRoles;
    userWithoutPassword.activeRole = activeRole;

    const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000).toISOString();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        token: accessToken, // Backward compatibility - use accessToken as token
        accessToken, // New field for clarity
        refreshToken, // New field for refresh token functionality
        expiresIn: SESSION_DURATION_SECONDS,
        expiresAt,
        refreshTokenExpiresIn: REFRESH_TOKEN_DURATION_SECONDS
      }
    });
  } catch (error) {
    console.error('[LOGIN] Unexpected error:', error);
    console.error('[LOGIN] Error stack:', error.stack);
    console.error('[LOGIN] Error details:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState
    });
    
    // Log suspicious activity for unexpected errors
    logSuspiciousActivity(req, `Unexpected login error: ${error.message}`);
    
    // Don't expose internal error details to client
    res.status(500).json({
      success: false,
      message: 'Ralat sistem berlaku. Sila cuba lagi kemudian atau hubungi pentadbir jika masalah berterusan.'
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    // Get user IC from req.user (set by auth middleware)
    // The auth middleware sets req.user with the user object from DB, which has 'ic' property
    if (!req.user) {
      console.error('[GetProfile] req.user is null/undefined');
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const userIc = req.user.ic || req.user.userId;
    
    console.log('[GetProfile] req.user keys:', Object.keys(req.user || {}));
    console.log('[GetProfile] req.user.ic:', req.user.ic);
    console.log('[GetProfile] req.user.userId:', req.user.userId);
    console.log('[GetProfile] userIc:', userIc);
    
    if (!userIc) {
      console.error('[GetProfile] No user IC found. req.user:', JSON.stringify(req.user, null, 2));
      return res.status(401).json({
        success: false,
        message: 'User not authenticated - missing user identifier'
      });
    }

    const [users] = await pool.execute(
      'SELECT ic, nama, email, role, status, created_at, updated_at FROM users WHERE ic = ?',
      [userIc]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const profile = { ...users[0] };
    const roleMeta = await attachRoleMetadata(profile);
    profile.roles = roleMeta.roles;
    profile.activeRole = roleMeta.activeRole;

    res.json({
      success: true,
      data: profile
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

    // Get current user with password and role
    const userIc = req.user?.ic || req.user?.userId;
    
    if (!userIc) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const normalizedUserIc = normalizeIcForQuery(userIc);
    const user = await findUserByNormalizedIc(normalizedUserIc);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Students don't have passwords - reject password change for students
    if (user.role === 'student') {
      return res.status(403).json({
        success: false,
        message: 'Pelajar tidak mempunyai kata laluan. Sila hubungi pentadbir untuk bantuan.'
      });
    }

    // Check if user has a password
    if (!user.password || user.password.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Anda tidak mempunyai kata laluan. Sila hubungi pentadbir untuk menetapkan kata laluan.'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
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
      "UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE REPLACE(ic, '-', '') = ?",
      [hashedNewPassword, normalizedUserIc]
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
    const normalizedTargetIc = normalizeIcForQuery(user_ic);

    // Check if target user exists
    const targetUser = await findUserByNormalizedIc(normalizedTargetIc);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await pool.execute(
      "UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE REPLACE(ic, '-', '') = ?",
      [hashedNewPassword, normalizedTargetIc]
    );

    res.json({
      success: true,
      message: `Password for ${targetUser.nama} (${targetUser.role}) has been changed successfully`
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

// Check reset options (email/phone availability)
export const checkResetOptions = async (req, res) => {
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
      'SELECT ic, nama, email, telefon FROM users WHERE ic = ?',
      [icNumber]
    );

    // Don't reveal if user exists or not for security
    if (users.length === 0) {
      // Return generic response to prevent user enumeration
      return res.json({
        success: true,
        data: {
          hasEmail: false,
          hasPhone: false
        }
      });
    }

    const user = users[0];

    res.json({
      success: true,
      data: {
        hasEmail: !!user.email,
        hasPhone: !!user.telefon,
        email: user.email ? `${user.email.substring(0, 3)}***@${user.email.split('@')[1]}` : null,
        telefon: user.telefon ? `${user.telefon.substring(0, 3)}***${user.telefon.substring(user.telefon.length - 2)}` : null
      }
    });
  } catch (error) {
    console.error('Check reset options error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Request password reset via email
export const requestPasswordResetEmail = async (req, res) => {
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
        message: 'Tiada emel didaftarkan untuk akaun ini. Sila pilih kaedah lain atau hubungi pentadbir sistem.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Store token in database
    try {
      await pool.execute(
        'INSERT INTO password_reset_tokens (user_ic, token, expires_at) VALUES (?, ?, ?)',
        [user.ic, resetToken, expiresAt]
      );
    } catch (dbError) {
      console.error('Error storing reset token:', dbError);
      // If table doesn't exist, log but continue (token won't be usable, but we'll handle gracefully)
      if (dbError.code === 'ER_NO_SUCH_TABLE') {
        console.error('⚠️ password_reset_tokens table does not exist. Please run migrations.');
      }
    }

    // Create reset link
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    // Send password reset email
    let emailResult;
    try {
      emailResult = await sendPasswordResetEmail(user.email, resetLink, user.nama, user.ic);
    } catch (emailError) {
      // Catch any exceptions thrown by email service
      console.error('Exception in sendPasswordResetEmail:', emailError);
      emailResult = {
        success: false,
        error: emailError.message || 'Unknown error',
        message: 'Email service error'
      };
    }

    // Ensure emailResult is an object
    if (!emailResult || typeof emailResult !== 'object') {
      emailResult = {
        success: false,
        error: 'Invalid email service response',
        message: 'Email service not configured'
      };
    }

    if (!emailResult.success) {
      // Check if email service is not configured or authentication failed
      const isEmailNotConfigured = emailResult.error === 'Transporter not available' || 
                                   emailResult.message === 'Email service not configured' ||
                                   emailResult.error === 'Invalid email service response';
      
      const isAuthError = emailResult.code === 'EAUTH' || 
                         (emailResult.error && emailResult.error.includes('Username and Password not accepted')) ||
                         (emailResult.error && emailResult.error.includes('Invalid login'));
      
      // If email service is not configured or authentication failed, still generate token and log it
      // This allows the password reset flow to be tested even without email configured
      if (isEmailNotConfigured || isAuthError) {
        console.log('\n📧 ===== EMAIL SERVICE ERROR =====');
        if (isAuthError) {
          console.log('⚠️ Gmail authentication failed. Please check:');
          console.log('1. EMAIL_PASSWORD is a Gmail App Password (not regular password)');
          console.log('2. 2-Step Verification is enabled on Gmail account');
          console.log('3. App Password was generated correctly');
        } else {
          console.log('⚠️ Email service not configured');
        }
        console.log('Reset link generated (not sent via email):');
        console.log('Reset Link:', resetLink);
        console.log('User:', user.nama);
        console.log('Email:', user.email);
        console.log('Token:', resetToken);
        console.log('Expires at:', expiresAt);
        console.log('=====================================\n');
        
        // Return success with info about the reset link being logged
        // Always include resetLink in response when email fails (for development/testing)
        return res.json({
          success: true,
          message: 'Pautan reset kata laluan telah dijana. (Emel tidak dikonfigurasi - sila semak log pelayan untuk pautan reset)',
          emailNotConfigured: true,
          resetLink: resetLink, // Always include reset link when email fails
          devInfo: process.env.NODE_ENV === 'development' ? {
            resetLink: resetLink,
            token: resetToken,
            message: isAuthError 
              ? 'Gmail authentication failed. Reset link generated and logged to console.'
              : 'Email service not configured. Reset link generated and logged to console.',
            error: isAuthError ? emailResult.error : undefined
          } : undefined
        });
      }
      
      // For other email errors (network, etc.), still return success to user
      // but log the error for debugging
      console.error('Email sending failed:', emailResult.error || emailResult.message);
      return res.status(500).json({
        success: false,
        message: 'Gagal menghantar emel reset kata laluan. Sila cuba lagi kemudian.',
        error: process.env.NODE_ENV === 'development' ? (emailResult.error || emailResult.message) : undefined
      });
    }

    res.json({
      success: true,
      message: 'Jika nombor kad pengenalan wujud dalam sistem, pautan reset kata laluan telah dihantar ke emel pendaftaran anda.'
    });
  } catch (error) {
    console.error('Request password reset email error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Request password reset via phone (SMS)
export const requestPasswordResetPhone = async (req, res) => {
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
      'SELECT ic, nama, telefon FROM users WHERE ic = ?',
      [icNumber]
    );

    // Don't reveal if user exists or not for security
    if (users.length === 0) {
      return res.json({
        success: true,
        message: 'Jika nombor kad pengenalan wujud dalam sistem, kod reset kata laluan telah dihantar ke nombor telefon pendaftaran anda.'
      });
    }

    const user = users[0];

    // Check if user has a phone registered
    if (!user.telefon) {
      return res.status(400).json({
        success: false,
        message: 'Tiada nombor telefon didaftarkan untuk akaun ini. Sila pilih kaedah lain atau hubungi pentadbir sistem.'
      });
    }

    // Generate 6-digit reset code
    const resetCode = generateResetCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // Code expires in 10 minutes

    // Store code in database (using the same password_reset_tokens table)
    try {
      // First, delete any existing tokens for this user
      await pool.execute(
        'DELETE FROM password_reset_tokens WHERE user_ic = ?',
        [user.ic]
      );
      
      // Store new reset code (we'll use token field to store the code)
      await pool.execute(
        'INSERT INTO password_reset_tokens (user_ic, token, expires_at) VALUES (?, ?, ?)',
        [user.ic, resetCode, expiresAt]
      );
    } catch (dbError) {
      console.error('Error storing reset code:', dbError);
    }

    // Send SMS with reset code
    const smsResult = await sendPasswordResetSMS(user.telefon, resetCode, user.nama);

    if (!smsResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Gagal menghantar SMS reset kata laluan. Sila cuba lagi kemudian atau pilih kaedah emel.',
        error: process.env.NODE_ENV === 'development' ? smsResult.error : undefined
      });
    }

    // In development, include the code in response for testing
    const response = {
      success: true,
      message: 'Jika nombor kad pengenalan wujud dalam sistem, kod reset kata laluan telah dihantar ke nombor telefon pendaftaran anda.'
    };

    if (process.env.NODE_ENV === 'development' && smsResult.devCode) {
      response.devCode = smsResult.devCode;
      response.devMessage = smsResult.devMessage;
    }

    res.json(response);
  } catch (error) {
    console.error('Request password reset phone error:', error);
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
    // Verify database connection first
    try {
      await pool.execute('SELECT 1');
    } catch (dbError) {
      console.error('[DB] Database connection error:', dbError.message);
      return res.status(503).json({
        success: false,
        message: 'Database connection failed. Please try again later.'
      });
    }

    // Check if user has admin or teacher role in their available roles
    const availableRoles = (req.user.roles || []).map(r => (r || '').toLowerCase());
    const effectiveRole = (req.user.activeRole || req.user.role || '').toLowerCase();
    const dbPrimaryRole = (req.user.dbPrimaryRole || req.user.role || '').toLowerCase();
    
    // Include all possible roles for checking
    const allRoles = [...new Set([...availableRoles, effectiveRole, dbPrimaryRole].filter(Boolean))];
    
    // Only admin and staff (teachers) can view pending registrations
    const hasAccess = allRoles.includes('admin') || allRoles.includes('teacher');
    
    if (!hasAccess) {
      console.log('[AUTH DEBUG] getPendingRegistrations: Access denied.', {
        userIc: req.user?.ic,
        effectiveRole,
        availableRoles: availableRoles.join(', '),
        dbPrimaryRole,
        allRoles: allRoles.join(', ')
      });
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can view pending registrations.'
      });
    }

    // Query database for pending registrations
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
      data: pendingUsers || []
    });
  } catch (error) {
    console.error('Get pending registrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

    // Log admin action before update
    if (req.user && req.user.role === 'admin') {
      await createSnapshot({
        entityType: 'student',
        entityId: 0,
        entityIdentifier: user_ic,
        operation: 'update',
        data: { ...user, previous_status: 'pending' },
        metadata: {
          title: user.nama,
          nama: user.nama,
          operationLabel: 'Kelulusan pendaftaran',
          redirectPath: '/pending-registrations'
        },
        actorIc: req.user.ic
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

    const { token, code, newPassword } = req.body;

    // Support both token (email) and code (phone) - code takes precedence if both provided
    const resetTokenValue = code || token;

    if (!resetTokenValue) {
      return res.status(400).json({
        success: false,
        message: 'Reset token or code is required'
      });
    }

    // Find valid token/code
    const [tokens] = await pool.execute(
      'SELECT * FROM password_reset_tokens WHERE token = ? AND used = FALSE AND expires_at > NOW()',
      [resetTokenValue]
    );

    if (tokens.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset code/token'
      });
    }

    const resetToken = tokens[0];

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Get connection for transaction
    const connection = await pool.getConnection();
    
    try {
      // Start transaction (must use query, not execute for transaction commands)
      await connection.query('START TRANSACTION');

      // Update password
      await connection.execute(
        'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE ic = ?',
        [hashedNewPassword, resetToken.user_ic]
      );

      // Mark token/code as used
      await connection.execute(
        'UPDATE password_reset_tokens SET used = TRUE WHERE token = ?',
        [resetTokenValue]
      );

      await connection.query('COMMIT');
    } catch (error) {
      await connection.query('ROLLBACK');
      throw error;
    } finally {
      connection.release();
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
    const userId = req.user?.ic || req.user?.userId || req.user?.user_ic;

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
    // Telefon and email are optional - can be updated in settings later

    // Check role-specific fields
    // Note: For students, kelas_id and tarikh_daftar are assigned by admin, not required for profile completion
    // Students only need: umur (telefon and email are optional and can be updated in settings)
    if (user.role === 'teacher') {
      const [teachers] = await pool.execute(
        'SELECT * FROM teachers WHERE user_ic = ?',
        [userId]
      );
      
      if (teachers.length === 0 || !teachers[0].kepakaran) {
        missingFields.push('kepakaran');
      }
    }
    // For students: no additional fields required - kelas_id and tarikh_daftar are admin-assigned

    const isComplete = missingFields.length === 0;
    
    console.log(`[Profile Complete Check] User: ${userId}, Role: ${user.role}, Complete: ${isComplete}, Missing: [${missingFields.join(', ')}]`);

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
        updateValues.push(telefon === null || telefon === '' ? null : normalizePhone(telefon.trim()));
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
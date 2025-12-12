/**
 * Account Lockout Service
 * Handles account lockout after failed login attempts
 */

import { pool } from '../config/database.js';
import { normalizeICForQuery } from '../utils/icUtils.js';

// Configuration
const MAX_FAILED_ATTEMPTS = 5; // Lock after 5 failed attempts
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // Track attempts within 15 minutes

/**
 * Record a failed login attempt
 */
export const recordFailedAttempt = async (ic, ip) => {
  try {
    const normalizedIc = normalizeICForQuery(ic);
    const now = new Date();
    
    // Clean old attempts
    await pool.execute(
      `DELETE FROM login_attempts 
       WHERE timestamp < DATE_SUB(?, INTERVAL ? SECOND)`,
      [now, LOCKOUT_DURATION_MS / 1000]
    );

    // Record the attempt
    await pool.execute(
      `INSERT INTO login_attempts (user_ic, ip_address, timestamp, successful) 
       VALUES (?, ?, ?, 0)`,
      [normalizedIc, ip, now]
    );

    // Check if account should be locked
    const [attempts] = await pool.execute(
      `SELECT COUNT(*) as count 
       FROM login_attempts 
       WHERE user_ic = ? 
         AND successful = 0 
         AND timestamp > DATE_SUB(?, INTERVAL ? SECOND)`,
      [normalizedIc, now, ATTEMPT_WINDOW_MS / 1000]
    );

    const failedCount = attempts[0]?.count || 0;

    if (failedCount >= MAX_FAILED_ATTEMPTS) {
      // Lock the account
      await lockAccount(normalizedIc);
      return {
        locked: true,
        attemptsRemaining: 0,
        lockoutExpires: new Date(Date.now() + LOCKOUT_DURATION_MS)
      };
    }

    return {
      locked: false,
      attemptsRemaining: MAX_FAILED_ATTEMPTS - failedCount - 1,
      lockoutExpires: null
    };
  } catch (error) {
    console.error('[AccountLockout] Error recording failed attempt:', error);
    // Don't block login if lockout service fails
    return { locked: false, attemptsRemaining: null, lockoutExpires: null };
  }
};

/**
 * Record a successful login (clears failed attempts)
 */
export const recordSuccessfulLogin = async (ic) => {
  try {
    const normalizedIc = normalizeICForQuery(ic);
    
    // Clear all failed attempts for this user
    await pool.execute(
      `DELETE FROM login_attempts WHERE user_ic = ?`,
      [normalizedIc]
    );

    // Unlock account if locked
    await unlockAccount(normalizedIc);
  } catch (error) {
    console.error('[AccountLockout] Error recording successful login:', error);
  }
};

/**
 * Check if account is locked
 */
export const isAccountLocked = async (ic) => {
  try {
    const normalizedIc = normalizeICForQuery(ic);
    
    const [users] = await pool.execute(
      `SELECT ic, account_locked_until 
       FROM users 
       WHERE REPLACE(REPLACE(ic, '-', ''), ' ', '') = ?`,
      [normalizedIc]
    );

    if (users.length === 0) {
      return { locked: false };
    }

    const user = users[0];
    
    if (!user.account_locked_until) {
      return { locked: false };
    }

    const lockoutUntil = new Date(user.account_locked_until);
    const now = new Date();

    if (lockoutUntil > now) {
      return {
        locked: true,
        lockoutExpires: lockoutUntil,
        minutesRemaining: Math.ceil((lockoutUntil - now) / (60 * 1000))
      };
    }

    // Lockout expired, unlock account
    await unlockAccount(normalizedIc);
    return { locked: false };
  } catch (error) {
    console.error('[AccountLockout] Error checking account lock:', error);
    return { locked: false };
  }
};

/**
 * Lock an account
 */
const lockAccount = async (normalizedIc) => {
  try {
    const lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
    
    await pool.execute(
      `UPDATE users 
       SET account_locked_until = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE REPLACE(REPLACE(ic, '-', ''), ' ', '') = ?`,
      [lockoutUntil, normalizedIc]
    );

    console.warn(`[AccountLockout] Account locked: ${normalizedIc} until ${lockoutUntil}`);
  } catch (error) {
    console.error('[AccountLockout] Error locking account:', error);
  }
};

/**
 * Unlock an account
 */
const unlockAccount = async (normalizedIc) => {
  try {
    await pool.execute(
      `UPDATE users 
       SET account_locked_until = NULL, updated_at = CURRENT_TIMESTAMP 
       WHERE REPLACE(REPLACE(ic, '-', ''), ' ', '') = ? 
         AND account_locked_until IS NOT NULL`,
      [normalizedIc]
    );
  } catch (error) {
    console.error('[AccountLockout] Error unlocking account:', error);
  }
};

/**
 * Initialize login_attempts table if it doesn't exist
 */
export const ensureLoginAttemptsTable = async () => {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS login_attempts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_ic VARCHAR(20) NOT NULL,
        ip_address VARCHAR(45) NOT NULL,
        timestamp DATETIME NOT NULL,
        successful TINYINT(1) DEFAULT 0,
        INDEX idx_user_ic (user_ic),
        INDEX idx_timestamp (timestamp),
        INDEX idx_user_timestamp (user_ic, timestamp)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Update existing login_attempts table if user_ic is VARCHAR(12)
    try {
      await pool.execute(`
        ALTER TABLE login_attempts 
        MODIFY COLUMN user_ic VARCHAR(20) NOT NULL
      `);
      console.log('✅ Updated login_attempts.user_ic column to VARCHAR(20)');
    } catch (error) {
      // Column might already be correct, ignore error
      if (!error.message.includes('Duplicate column name') && !error.message.includes("doesn't exist")) {
        console.warn('Could not update login_attempts.user_ic:', error.message);
      }
    }

    // Add account_locked_until column to users table if it doesn't exist
    try {
      await pool.execute(`
        ALTER TABLE users 
        ADD COLUMN account_locked_until DATETIME NULL 
        AFTER status
      `);
      console.log('✅ Added account_locked_until column to users table');
    } catch (error) {
      // Column might already exist, ignore error
      if (!error.message.includes('Duplicate column name')) {
        console.error('Error adding account_locked_until column:', error);
      }
    }

    // Ensure refresh_tokens table exists with correct column size
    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS refresh_tokens (
          user_ic VARCHAR(20) PRIMARY KEY,
          token TEXT NOT NULL,
          expires_at DATETIME NOT NULL,
          created_at DATETIME NOT NULL,
          INDEX idx_expires_at (expires_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ Verified refresh_tokens table exists');
      
      // Update existing refresh_tokens table if user_ic is VARCHAR(12)
      try {
        await pool.execute(`
          ALTER TABLE refresh_tokens 
          MODIFY COLUMN user_ic VARCHAR(20)
        `);
        console.log('✅ Updated refresh_tokens.user_ic column to VARCHAR(20)');
      } catch (error) {
        // Column might already be correct, ignore error
        if (!error.message.includes("doesn't exist")) {
          console.warn('Could not update refresh_tokens.user_ic:', error.message);
        }
      }
    } catch (error) {
      console.error('[AccountLockout] Error ensuring refresh_tokens table:', error);
    }
  } catch (error) {
    console.error('[AccountLockout] Error ensuring tables:', error);
  }
};


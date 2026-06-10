// services/accountLockoutService.js
// Login uses phone number (telefon) as identifier
import { pool } from '../config/database.js';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 30;

export async function ensureLoginAttemptsTable() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS login_attempts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        identifier VARCHAR(50) NOT NULL COMMENT 'Phone number used to login',
        ip_address VARCHAR(45) DEFAULT NULL,
        attempted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        success TINYINT(1) DEFAULT 0,
        INDEX idx_identifier (identifier),
        INDEX idx_attempted_at (attempted_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  } catch (error) {
    console.error('[accountLockoutService] ensureLoginAttemptsTable error:', error.message);
  }
}

export async function isAccountLocked(identifier) {
  try {
    const cutoff = new Date(Date.now() - LOCKOUT_MINUTES * 60 * 1000);
    const [rows] = await pool.execute(
      `SELECT COUNT(*) as attempts FROM login_attempts
       WHERE identifier = ? AND success = 0 AND attempted_at > ?`,
      [identifier, cutoff]
    );
    return rows[0].attempts >= MAX_ATTEMPTS;
  } catch (error) {
    console.error('[accountLockoutService] isAccountLocked error:', error.message);
    return false;
  }
}

export async function recordFailedAttempt(identifier, ipAddress = null) {
  try {
    await pool.execute(
      'INSERT INTO login_attempts (identifier, ip_address, success) VALUES (?, ?, 0)',
      [identifier, ipAddress]
    );
  } catch (error) {
    console.error('[accountLockoutService] recordFailedAttempt error:', error.message);
  }
}

export async function recordSuccessfulLogin(identifier, ipAddress = null) {
  try {
    await pool.execute(
      'INSERT INTO login_attempts (identifier, ip_address, success) VALUES (?, ?, 1)',
      [identifier, ipAddress]
    );
  } catch (error) {
    console.error('[accountLockoutService] recordSuccessfulLogin error:', error.message);
  }
}

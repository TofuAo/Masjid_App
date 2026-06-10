/**
 * Audit Log Utility
 * Logs critical actions for Admin and IB roles.
 * Format: [Timestamp] | User: <user_telefon> | Action: <ACTION> | Target: <target_id>
 */
import { pool } from '../config/database.js';

/**
 * Log an audit event for Admin actions (admin_logs table).
 */
export const logAdminAudit = async (userPhone, action, target = null, metadata = {}) => {
  if (!userPhone || !action) return;
  try {
    const details = JSON.stringify({ action, target, timestamp: new Date().toISOString(), ...metadata });
    await pool.execute(
      'INSERT INTO admin_logs (admin_ic, action, details) VALUES (?, ?, ?)',
      [userPhone, action, details]
    );
  } catch (err) {
    console.error('[AUDIT] Failed to log admin action:', err.message);
  }
};

/**
 * Log an audit event for IB actions (ib_action_logs table).
 * Use when IB verifies/confirms payments or documents.
 */
export const logIbAudit = async ({ userPhone, actionType, paymentId = null, feeId = null, amount = null, notes = null, metadata = {} }) => {
  if (!userPhone || !actionType) return;
  try {
    await pool.execute(
      `INSERT INTO ib_action_logs 
        (action_type, user_telefon, payment_id, document_type, amount, notes, metadata)
       VALUES (?, ?, ?, 'fee', ?, ?, ?)`,
      [actionType, userPhone, paymentId, amount, notes, JSON.stringify(metadata)]
    );
  } catch (err) {
    console.error('[AUDIT] Failed to log IB action:', err.message);
  }
};

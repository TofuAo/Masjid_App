/**
 * Audit Log Utility
 * Logs critical actions for Admin and IB roles.
 * Format: [Timestamp] | User: <user_ic> | Action: <ACTION> | Target: <target_id>
 */
import { pool } from '../config/database.js';

/**
 * Log an audit event for Admin actions (admin_logs table).
 */
export const logAdminAudit = async (userIc, action, target = null, metadata = {}) => {
  if (!userIc || !action) return;
  try {
    const details = JSON.stringify({ action, target, timestamp: new Date().toISOString(), ...metadata });
    await pool.execute(
      'INSERT INTO admin_logs (admin_ic, action, details) VALUES (?, ?, ?)',
      [userIc, action, details]
    );
  } catch (err) {
    console.error('[AUDIT] Failed to log admin action:', err.message);
  }
};

/**
 * Log an audit event for IB actions (ib_action_logs table).
 * Use when IB verifies/confirms payments or documents.
 */
export const logIbAudit = async ({ userIc, actionType, paymentId = null, feeId = null, amount = null, notes = null, metadata = {} }) => {
  if (!userIc || !actionType) return;
  try {
    await pool.execute(
      `INSERT INTO ib_action_logs 
        (action_type, user_ic, payment_id, document_type, amount, notes, metadata)
       VALUES (?, ?, ?, 'fee', ?, ?, ?)`,
      [actionType, userIc, paymentId, amount, notes, JSON.stringify(metadata)]
    );
  } catch (err) {
    console.error('[AUDIT] Failed to log IB action:', err.message);
  }
};

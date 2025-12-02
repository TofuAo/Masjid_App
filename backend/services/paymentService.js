import { pool } from '../config/database.js';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

/**
 * Payment Service
 * Handles payment creation, status updates, and idempotency
 */

// Generate payment ID
export const generatePaymentId = () => {
  return uuidv4();
};

// Create a new payment intent
export const createPaymentIntent = async (paymentData) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const paymentId = generatePaymentId();
    const {
      user_ic,
      amount,
      currency = 'MYR',
      method,
      provider,
      metadata = {},
      idempotency_key,
      expires_at
    } = paymentData;

    // Insert payment
    await connection.execute(
      `INSERT INTO payments 
       (id, user_ic, amount, currency, method, provider, metadata, idempotency_key, expires_at, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        paymentId,
        user_ic,
        amount,
        currency,
        method,
        provider,
        JSON.stringify(metadata),
        idempotency_key || null,
        expires_at || null
      ]
    );

    // Log payment creation
    await connection.execute(
      `INSERT INTO payment_logs (payment_id, action, status_from, status_to, message)
       VALUES (?, 'created', NULL, 'pending', 'Payment intent created')`,
      [paymentId]
    );

    await connection.commit();

    // Fetch created payment
    const [payments] = await connection.execute(
      'SELECT * FROM payments WHERE id = ?',
      [paymentId]
    );

    return payments[0];
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Get payment by ID
export const getPaymentById = async (paymentId) => {
  const [payments] = await pool.execute(
    'SELECT * FROM payments WHERE id = ?',
    [paymentId]
  );
  return payments[0] || null;
};

// Get payments by user
export const getPaymentsByUser = async (userIc, limit = 50, offset = 0) => {
  const [payments] = await pool.execute(
    `SELECT * FROM payments 
     WHERE user_ic = ? 
     ORDER BY created_at DESC 
     LIMIT ? OFFSET ?`,
    [userIc, limit, offset]
  );
  return payments;
};

// Get all payments (admin)
export const getAllPayments = async (filters = {}, limit = 50, offset = 0) => {
  let query = 'SELECT p.*, u.nama as user_name FROM payments p LEFT JOIN users u ON p.user_ic = u.ic WHERE 1=1';
  const params = [];

  if (filters.status) {
    query += ' AND p.status = ?';
    params.push(filters.status);
  }

  if (filters.method) {
    query += ' AND p.method = ?';
    params.push(filters.method);
  }

  if (filters.provider) {
    query += ' AND p.provider = ?';
    params.push(filters.provider);
  }

  if (filters.user_ic) {
    query += ' AND p.user_ic = ?';
    params.push(filters.user_ic);
  }

  if (filters.search) {
    query += ' AND (p.id LIKE ? OR p.provider_reference LIKE ? OR u.nama LIKE ?)';
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const [payments] = await pool.execute(query, params);
  return payments;
};

// Update payment status
export const updatePaymentStatus = async (paymentId, newStatus, providerReference = null, webhookData = null) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Get current payment
    const [payments] = await connection.execute(
      'SELECT * FROM payments WHERE id = ?',
      [paymentId]
    );

    if (payments.length === 0) {
      throw new Error('Payment not found');
    }

    const currentPayment = payments[0];
    const oldStatus = currentPayment.status;

    // Update payment
    const updateFields = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
    const updateValues = [newStatus];

    if (providerReference) {
      updateFields.push('provider_reference = ?');
      updateValues.push(providerReference);
    }

    if (webhookData) {
      updateFields.push('webhook_data = ?', 'webhook_received = TRUE');
      updateValues.push(JSON.stringify(webhookData));
    }

    updateValues.push(paymentId);

    await connection.execute(
      `UPDATE payments SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Log status change
    await connection.execute(
      `INSERT INTO payment_logs (payment_id, action, status_from, status_to, message, metadata)
       VALUES (?, 'status_update', ?, ?, 'Status updated', ?)`,
      [
        paymentId,
        oldStatus,
        newStatus,
        JSON.stringify({ provider_reference: providerReference, webhook_received: !!webhookData })
      ]
    );

    await connection.commit();

    // Fetch updated payment
    const [updatedPayments] = await connection.execute(
      'SELECT * FROM payments WHERE id = ?',
      [paymentId]
    );

    return updatedPayments[0];
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Update payment proof URL
export const updatePaymentProof = async (paymentId, proofUrl) => {
  await pool.execute(
    'UPDATE payments SET proof_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [proofUrl, paymentId]
  );

  // Log proof upload
  await pool.execute(
    `INSERT INTO payment_logs (payment_id, action, message, metadata)
     VALUES (?, 'proof_uploaded', 'Payment proof uploaded', ?)`,
    [paymentId, JSON.stringify({ proof_url: proofUrl })]
  );
};

// Check idempotency
export const checkIdempotency = async (idempotencyKey) => {
  if (!idempotencyKey) return null;

  const keyHash = crypto.createHash('sha256').update(idempotencyKey).digest('hex');
  
  const [keys] = await pool.execute(
    'SELECT * FROM idempotency_keys WHERE key_hash = ? AND expires_at > NOW()',
    [keyHash]
  );

  if (keys.length > 0) {
    return keys[0];
  }

  return null;
};

// Store idempotency key
export const storeIdempotencyKey = async (idempotencyKey, paymentId, responseData, expiresInSeconds = 3600) => {
  if (!idempotencyKey) return;

  const keyHash = crypto.createHash('sha256').update(idempotencyKey).digest('hex');
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

  await pool.execute(
    `INSERT INTO idempotency_keys (key_hash, payment_id, response_data, expires_at)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE payment_id = VALUES(payment_id), response_data = VALUES(response_data)`,
    [keyHash, paymentId, JSON.stringify(responseData), expiresAt]
  );
};

// Get payment logs
export const getPaymentLogs = async (paymentId) => {
  const [logs] = await pool.execute(
    'SELECT * FROM payment_logs WHERE payment_id = ? ORDER BY created_at DESC',
    [paymentId]
  );
  return logs;
};

// Create reconciliation record
export const createReconciliationRecord = async (paymentId, providerStatus, localStatus, notes = null) => {
  const statusMatch = providerStatus === localStatus;

  await pool.execute(
    `INSERT INTO payment_reconciliation 
     (payment_id, reconciliation_date, provider_status, local_status, status_match, notes)
     VALUES (?, CURDATE(), ?, ?, ?, ?)`,
    [paymentId, providerStatus, localStatus, statusMatch, notes]
  );
};


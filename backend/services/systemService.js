/**
 * System Health Service
 * Real backend checks: database, metrics, payment gateway, storage, ToyyibPay ping.
 * Used by GET /api/system/health for admin dashboard.
 */
import { pool } from '../config/database.js';
import fs from 'fs';
import path from 'path';

const CRITICAL_FAILED_PAYMENTS_THRESHOLD = 5;
const TOYYIBPAY_PING_TIMEOUT_MS = 5000;

export async function getSystemHealth() {
  const timestamp = new Date().toISOString();

  // 1. Database check
  let dbStatus = 'Down';
  let dbResponseTime = null;
  try {
    const start = Date.now();
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    dbStatus = 'Operational';
    dbResponseTime = Date.now() - start;
  } catch (err) {
    // DB down - return early with degraded state
    return {
      status: 'down',
      timestamp,
      services: {
        database: { status: 'down', label: err?.message || 'Connection failed' },
        api: { status: 'up' },
        storage: { status: 'down' },
        payment_gateway: { status: 'unknown' },
      },
      metrics: { totalUsers: 0, pendingApprovals: 0, failedPayments24h: 0, totalClasses: 0, totalStudents: 0 },
      alerts: [{ type: 'error', message: 'Database connection failed', timestamp }],
    };
  }

  // 2. Real metrics (parallel queries)
  let totalUsers = 0;
  let pendingApprovals = 0;
  let failedPayments24h = 0;
  let totalClasses = 0;
  let totalStudents = 0;

  try {
    const [usersRes, pendingRes, classesRes, studentsRes] = await Promise.all([
      pool.execute('SELECT COUNT(*) as c FROM users'),
      pool.execute("SELECT COUNT(*) as c FROM users WHERE status = 'pending'"),
      pool.execute('SELECT COUNT(*) as c FROM classes'),
      pool.execute('SELECT COUNT(*) as c FROM students'),
    ]);

    totalUsers = parseInt(usersRes[0]?.[0]?.c ?? 0, 10);
    pendingApprovals = parseInt(pendingRes[0]?.[0]?.c ?? 0, 10);
    totalClasses = parseInt(classesRes[0]?.[0]?.c ?? 0, 10);
    totalStudents = parseInt(studentsRes[0]?.[0]?.c ?? 0, 10);

    // Pending PIC changes (may not exist)
    try {
      const [picRes] = await pool.execute(
        "SELECT COUNT(*) as c FROM pending_pic_changes WHERE status = 'pending'"
      );
      pendingApprovals += parseInt(picRes[0]?.c ?? 0, 10);
    } catch (_) {
      // Table may not exist
    }

    // Failed payments in last 24h (payments table may not exist)
    try {
      const [payRes] = await pool.execute(
        `SELECT COUNT(*) as c FROM payments 
         WHERE status = 'failed' AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`
      );
      failedPayments24h = parseInt(payRes[0]?.c ?? 0, 10);
    } catch (_) {
      // payments table may not exist
    }
  } catch (err) {
    console.error('[systemService] Error fetching metrics:', err.message);
  }

  // 3. Storage check (uploads folder for IC/docs)
  let storageStatus = 'up';
  try {
    const uploadsPath = path.join(process.cwd(), 'uploads');
    fs.accessSync(uploadsPath, fs.constants.W_OK | fs.constants.R_OK);
  } catch (_) {
    storageStatus = 'down';
  }

  // 4. Payment gateway config + optional ToyyibPay API ping
  const hasToyyibPay = !!(
    process.env.TOYYIBPAY_SECRET_KEY &&
    process.env.TOYYIBPAY_CATEGORY_CODE &&
    process.env.TOYYIBPAY_SECRET_KEY !== 'your_secret_key' &&
    process.env.TOYYIBPAY_CATEGORY_CODE !== 'your_category_code'
  );
  let paymentGatewayStatus = hasToyyibPay ? 'Connected' : 'Configuration Error';
  let paymentGatewayStatusKey = hasToyyibPay ? 'up' : 'warning';

  if (hasToyyibPay) {
    try {
      const { default: axios } = await import('axios');
      const baseUrl = process.env.TOYYIBPAY_BASE_URL || 'https://toyyibpay.com';
      await axios.get(baseUrl, { timeout: TOYYIBPAY_PING_TIMEOUT_MS });
    } catch (pingErr) {
      paymentGatewayStatus = 'Connection failed';
      paymentGatewayStatusKey = 'down';
      console.warn('[systemService] ToyyibPay ping failed:', pingErr?.message || 'timeout');
    }
  }

  // 5. Overall status
  let status = 'healthy';
  const alerts = [];

  if (paymentGatewayStatusKey === 'down') {
    alerts.push({
      type: 'error',
      message: 'ToyyibPay API tidak dapat disambung. IB perlu dimaklumkan serta-merta.',
      timestamp,
    });
    status = 'degraded';
  }

  if (failedPayments24h >= CRITICAL_FAILED_PAYMENTS_THRESHOLD) {
    alerts.push({
      type: 'warning',
      message: `${failedPayments24h} pembayaran gagal dalam 24 jam lepas. Semak log pembayaran.`,
      timestamp,
    });
    status = 'degraded';
  }

  if (pendingApprovals > 50) {
    alerts.push({
      type: 'warning',
      message: `${pendingApprovals} permohonan menunggu kelulusan.`,
      timestamp,
    });
    if (status === 'healthy') status = 'degraded';
  }

  if (paymentGatewayStatus === 'Configuration Error') {
    alerts.push({
      type: 'warning',
      message: 'ToyyibPay tidak dikonfigurasi. Pembayaran dalam talian mungkin tidak berfungsi.',
      timestamp,
    });
  }

  if (storageStatus === 'down') {
    alerts.push({ type: 'warning', message: 'Folder upload tidak boleh diakses.', timestamp });
    if (status === 'healthy') status = 'degraded';
  }

  return {
    status,
    timestamp,
    services: {
      database: {
        status: dbStatus === 'Operational' ? 'up' : 'down',
        responseTime: dbResponseTime,
      },
      api: { status: 'up' },
      storage: { status: storageStatus },
      payment_gateway: {
        status: paymentGatewayStatusKey,
        ...(paymentGatewayStatus !== 'Connected' && { label: paymentGatewayStatus }),
      },
    },
    metrics: {
      totalUsers,
      pendingApprovals,
      failedPayments24h,
      totalClasses,
      totalStudents,
    },
    alerts,
  };
}

import { pool } from '../config/database.js';
import { ensurePendingPicTable } from '../utils/pendingPicChanges.js';

const toISOString = (value) => {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();
  return new Date(value).toISOString();
};

const createNotification = ({
  id,
  type,
  title,
  message,
  priority = 'default',
  action_url = null,
  timestamp = null
}) => ({
  id,
  type,
  title,
  message,
  priority,
  action_url,
  read: false,
  timestamp: toISOString(timestamp)
});

export const fetchDashboardNotifications = async () => {
  try {
    await ensurePendingPicTable();

    const [
      [pendingRegistrationStats],
      [pendingPicStats],
      [failedPaymentStats]
    ] = await Promise.all([
      pool.execute(
        `SELECT COUNT(*) AS count, MAX(created_at) AS latest
         FROM users
         WHERE status = 'pending'`
      ),
      pool.execute(
        `SELECT COUNT(*) AS count, MAX(created_at) AS latest
         FROM pending_pic_changes
         WHERE status = 'pending'`
      ),
      pool.execute(
        `SELECT COUNT(*) AS count, MAX(updated_at) AS latest
         FROM payments
         WHERE status = 'failed'
           AND updated_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)`
      )
    ]);

    const pendingRegistrations = pendingRegistrationStats[0] || { count: 0, latest: null };
    const pendingPics = pendingPicStats[0] || { count: 0, latest: null };
    const failedPayments = failedPaymentStats[0] || { count: 0, latest: null };

    const notifications = [];

    if (pendingRegistrations.count > 0) {
      notifications.push(createNotification({
        id: 'pending-registrations',
        type: 'pending_approval',
        title: 'Pendaftaran Menunggu Kelulusan',
        message: `${pendingRegistrations.count} pendaftaran baru menunggu kelulusan`,
        priority: 'high',
        action_url: '/pending-registrations',
        timestamp: pendingRegistrations.latest
      }));
    }

    if (pendingPics.count > 0) {
      notifications.push(createNotification({
        id: 'pending-pic-approvals',
        type: 'pending_pic',
        title: 'PIC Approval Pending',
        message: `${pendingPics.count} permohonan PIC menunggu kelulusan`,
        priority: 'high',
        action_url: '/pic-approvals',
        timestamp: pendingPics.latest || pendingRegistrations.latest
      }));
    }

    if (failedPayments.count > 0) {
      notifications.push(createNotification({
        id: 'payment-gateway-errors',
        type: 'error',
        title: 'Payment Gateway Error',
        message: `${failedPayments.count} pembayaran ToyyibPay gagal dalam 24 jam terakhir`,
        priority: 'urgent',
        action_url: '/toyyibpay-settings',
        timestamp: failedPayments.latest || pendingPics.latest || pendingRegistrations.latest
      }));
    }

    // IB-specific notifications
    const [readyReports] = await pool.execute(
      `SELECT bulan, tahun, COUNT(*) as count, MAX(confirmation_period_end) as latest
       FROM payment_confirmations
       WHERE status = 'pending'
         AND confirmation_period_start <= CURRENT_DATE()
         AND confirmation_period_end >= CURRENT_DATE()
       GROUP BY bulan, tahun`
    );
    if (readyReports.length > 0) {
      const months = readyReports.map(r => `${r.bulan} ${r.tahun}`).join(', ');
      notifications.push(createNotification({
        id: `ib-month-ready-${readyReports[0].bulan}-${readyReports[0].tahun}`,
        type: 'ib_ready',
        title: 'Laporan Bulanan Sedia Disahkan',
        message: `${months} kini berada dalam tempoh pengesahan`,
        priority: 'high',
        action_url: '/ib-dashboard',
        timestamp: readyReports[0].latest
      }));
    }

    const [missingFeeDocs] = await pool.execute(
      `SELECT bulan, tahun, COUNT(*) as missing
       FROM fees
       WHERE resit_img IS NULL
         OR resit_img = ''
         OR document_confirmed = 0
       GROUP BY bulan, tahun
       ORDER BY tahun DESC, FIELD(bulan, 'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember') DESC
       LIMIT 1`
    );
    if (missingFeeDocs.length && missingFeeDocs[0].missing > 0) {
      notifications.push(createNotification({
        id: `ib-missing-docs-${missingFeeDocs[0].bulan}-${missingFeeDocs[0].tahun}`,
        type: 'ib_missing_docs',
        title: 'Dokumen Pembayaran Belum Lengkap',
        message: `${missingFeeDocs[0].missing} pembayaran ${missingFeeDocs[0].bulan} ${missingFeeDocs[0].tahun} belum mempunyai dokumen lengkap`,
        priority: 'high',
        action_url: '/ib-dashboard',
        timestamp: new Date()
      }));
    }

    const [recentApprovals] = await pool.execute(
      `SELECT COUNT(*) as count, MAX(created_at) as latest
       FROM ib_action_logs
       WHERE action_type IN ('approve_payments', 'confirm_month', 'reject_month')
         AND created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)`
    );
    if (recentApprovals.length && recentApprovals[0].count > 0) {
      notifications.push(createNotification({
        id: 'ib-recent-approvals',
        type: 'ib_activity',
        title: 'Tindakan IB Diproses',
        message: `${recentApprovals[0].count} tindakan kelulusan direkod dalam 24 jam terakhir`,
        priority: 'default',
        action_url: '/notifications',
        timestamp: recentApprovals[0].latest
      }));
    }

    const [overdueConfirmations] = await pool.execute(
      `SELECT bulan, tahun, COUNT(*) as overdue, MAX(confirmation_period_end) as latest
       FROM payment_confirmations
       WHERE status != 'confirmed'
         AND confirmation_period_end < CURRENT_DATE()
       GROUP BY bulan, tahun
       ORDER BY tahun DESC, FIELD(bulan, 'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember') DESC
       LIMIT 1`
    );
    if (overdueConfirmations.length && overdueConfirmations[0].overdue > 0) {
      notifications.push(createNotification({
        id: `ib-overdue-${overdueConfirmations[0].bulan}-${overdueConfirmations[0].tahun}`,
        type: 'ib_overdue',
        title: 'Pengesahan Tertunggak',
        message: `${overdueConfirmations[0].bulan} ${overdueConfirmations[0].tahun} telah melepasi tempoh pengesahan`,
        priority: 'high',
        action_url: '/ib-dashboard',
        timestamp: overdueConfirmations[0].latest
      }));
    }

    return notifications;
  } catch (error) {
    console.error('[NOTIFICATIONS] Failed to build dashboard notifications', error);
    return [];
  }
};

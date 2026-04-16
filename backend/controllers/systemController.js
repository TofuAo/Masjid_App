/**
 * System Health Controller
 * Admin-only endpoint for system status and metrics.
 * Always returns a valid structure the frontend expects.
 */
import { getSystemHealth } from '../services/systemService.js';

const EMPTY_HEALTH = {
  status: 'down',
  timestamp: new Date().toISOString(),
  services: {
    database: { status: 'down', label: 'Unknown' },
    api: { status: 'up' },
    storage: { status: 'down', label: 'Unknown' },
    payment_gateway: { status: 'down', label: 'Unknown' },
  },
  metrics: {
    totalUsers: 0,
    pendingApprovals: 0,
    failedPayments24h: 0,
    totalClasses: 0,
    totalStudents: 0,
  },
  alerts: [{ type: 'error', message: 'Sistem tidak dapat memeriksa status', timestamp: new Date().toISOString() }],
};

export const getHealth = async (req, res) => {
  try {
    const healthData = await getSystemHealth();
    // MUST match frontend: { success, data: { status, services, metrics, alerts } }
    const data = {
      status: healthData?.status ?? 'healthy',
      timestamp: healthData?.timestamp ?? new Date().toISOString(),
      services: healthData?.services ?? EMPTY_HEALTH.services,
      metrics: healthData?.metrics ?? EMPTY_HEALTH.metrics,
      alerts: Array.isArray(healthData?.alerts) ? healthData.alerts : [],
    };
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('[systemController] getHealth error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching system health',
      data: EMPTY_HEALTH,
    });
  }
};

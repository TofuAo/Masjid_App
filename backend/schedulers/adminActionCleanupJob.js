import { purgeExpiredSnapshots } from '../utils/adminActionSnapshots.js';

/**
 * Schedule automatic cleanup of expired admin action snapshots
 * Runs every hour to remove snapshots that have passed their 25-hour expiry
 */
export const scheduleAdminActionCleanup = () => {
  // Run cleanup immediately on startup
  purgeExpiredSnapshots().catch(err => {
    console.error('Failed to purge expired admin action snapshots on startup:', err);
  });

  // Schedule cleanup to run every hour
  const cleanupInterval = setInterval(() => {
    purgeExpiredSnapshots().catch(err => {
      console.error('Failed to purge expired admin action snapshots:', err);
    });
  }, 60 * 60 * 1000); // 1 hour in milliseconds

  console.log('Admin action snapshot cleanup scheduled (runs every hour)');

  // Return cleanup function for graceful shutdown if needed
  return () => {
    clearInterval(cleanupInterval);
  };
};


import { purgeExpiredPicSnapshots } from '../utils/picActionSnapshots.js';

/**
 * Schedule automatic cleanup of expired PIC action snapshots
 * Runs every hour to remove snapshots that have passed their 25-hour expiry
 */
export const schedulePicRecycleBinCleanup = () => {
  // Run cleanup immediately on startup
  purgeExpiredPicSnapshots()
    .then(count => {
      if (count > 0) {
        console.log(`✓ PIC recycle bin cleanup: Removed ${count} expired item(s) on startup`);
      }
    })
    .catch(err => {
      console.error('Failed to purge expired PIC action snapshots on startup:', err);
    });

  // Schedule cleanup to run every hour
  const cleanupInterval = setInterval(() => {
    purgeExpiredPicSnapshots()
      .then(count => {
        if (count > 0) {
          console.log(`✓ PIC recycle bin cleanup: Removed ${count} expired item(s)`);
        }
      })
      .catch(err => {
        console.error('Failed to purge expired PIC action snapshots:', err);
      });
  }, 60 * 60 * 1000); // 1 hour in milliseconds

  console.log('PIC recycle bin cleanup scheduled (runs every hour)');

  // Return cleanup function for graceful shutdown if needed
  return () => {
    clearInterval(cleanupInterval);
  };
};


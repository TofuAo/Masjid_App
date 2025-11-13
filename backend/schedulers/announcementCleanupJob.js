import cron from 'node-cron';
import { pool } from '../config/database.js';

let cleanupJob;

async function removeExpiredAnnouncements() {
  try {
    const [result] = await pool.execute(`
      DELETE FROM announcements
      WHERE end_date IS NOT NULL
        AND end_date < (NOW() - INTERVAL 14 DAY)
    `);

    if (result.affectedRows > 0) {
      console.info(`[Announcements] Removed ${result.affectedRows} expired announcement(s).`);
    }
  } catch (error) {
    console.error('[Announcements] Failed to remove expired announcements:', error);
  }
}

export function scheduleAnnouncementCleanup() {
  if (cleanupJob) {
    return cleanupJob;
  }

  if (process.env.DISABLE_ANNOUNCEMENT_CLEANUP === 'true') {
    console.info('[Announcements] Cleanup scheduler disabled via DISABLE_ANNOUNCEMENT_CLEANUP.');
    return null;
  }

  const cronExpression = process.env.ANNOUNCEMENT_CLEANUP_CRON || '0 3 * * *';
  const timezone = process.env.ANNOUNCEMENT_CLEANUP_TIMEZONE || undefined;

  cleanupJob = cron.schedule(
    cronExpression,
    async () => {
      console.info('[Announcements] Running scheduled cleanup...');
      await removeExpiredAnnouncements();
    },
    {
      scheduled: true,
      timezone,
    }
  );

  // Run once on startup to ensure stale data is cleaned promptly
  removeExpiredAnnouncements().catch((error) => {
    console.error('[Announcements] Initial cleanup run failed:', error);
  });

  return cleanupJob;
}

export function stopAnnouncementCleanup() {
  if (cleanupJob) {
    cleanupJob.stop();
    cleanupJob = null;
  }
}



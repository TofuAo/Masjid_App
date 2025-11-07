import cron from 'node-cron';
import { createAndUploadDatabaseBackup } from '../services/databaseBackupService.js';

let scheduledJob;

export function scheduleAnnualDatabaseBackup() {
  if (scheduledJob) {
    return scheduledJob;
  }

  if (process.env.DISABLE_ANNUAL_DATABASE_EXPORT === 'true') {
    console.info('[Backup] Annual database export scheduler disabled via DISABLE_ANNUAL_DATABASE_EXPORT.');
    return null;
  }

  const cronExpression = process.env.DATABASE_BACKUP_CRON || '55 23 31 12 *';
  const timezone = process.env.DATABASE_BACKUP_TIMEZONE || undefined;

  scheduledJob = cron.schedule(
    cronExpression,
    async () => {
      try {
        console.info('[Backup] Running scheduled annual database export...');
        await createAndUploadDatabaseBackup({
          triggerType: 'scheduled-year-end',
          triggeredBy: 'system',
        });
        console.info('[Backup] Scheduled annual database export completed successfully.');
      } catch (error) {
        console.error('[Backup] Scheduled database export failed:', error);
      }
    },
    {
      scheduled: true,
      timezone,
    }
  );

  return scheduledJob;
}



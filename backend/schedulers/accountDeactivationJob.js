import { deactivateInactiveAccounts } from '../services/accountDeactivationService.js';

/**
 * Scheduled job to automatically deactivate inactive accounts
 * Runs daily at 2:00 AM
 * 
 * This job checks for accounts that haven't logged in for 1 year
 * and automatically sets their status to 'tidak_aktif'
 */
let deactivationInterval = null;
let isRunning = false;

/**
 * Start the automatic account deactivation scheduler
 * Runs the check daily at 2:00 AM
 */
export const startAccountDeactivationScheduler = () => {
  // Don't start if already running
  if (deactivationInterval) {
    console.log('⚠️ [AUTO-DEACTIVATION] Scheduler already running');
    return;
  }

  console.log('🔄 [AUTO-DEACTIVATION] Starting automatic account deactivation scheduler...');

  // Calculate milliseconds until next 2:00 AM
  const getNextRunTime = () => {
    const now = new Date();
    const nextRun = new Date();
    nextRun.setHours(2, 0, 0, 0); // 2:00 AM
    
    // If it's already past 2:00 AM today, schedule for tomorrow
    if (now >= nextRun) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
    
    return nextRun.getTime() - now.getTime();
  };

  // Run immediately on startup (optional - comment out if you don't want this)
  // deactivateInactiveAccounts().catch(console.error);

  // Schedule daily runs at 2:00 AM
  const scheduleNextRun = () => {
    const msUntilNextRun = getNextRunTime();
    
    setTimeout(async () => {
      if (!isRunning) {
        isRunning = true;
        try {
          await deactivateInactiveAccounts();
        } catch (error) {
          console.error('❌ [AUTO-DEACTIVATION] Error in scheduled job:', error);
        } finally {
          isRunning = false;
          // Schedule next run (24 hours from now)
          scheduleNextRun();
        }
      }
    }, msUntilNextRun);

    const nextRunDate = new Date(Date.now() + msUntilNextRun);
    console.log(`✅ [AUTO-DEACTIVATION] Next deactivation check scheduled for: ${nextRunDate.toLocaleString()}`);
  };

  // Start the scheduler
  scheduleNextRun();
  deactivationInterval = true; // Mark as running

  console.log('✅ [AUTO-DEACTIVATION] Scheduler started successfully');
};

/**
 * Stop the automatic account deactivation scheduler
 */
export const stopAccountDeactivationScheduler = () => {
  if (deactivationInterval) {
    clearTimeout(deactivationInterval);
    deactivationInterval = null;
    console.log('🛑 [AUTO-DEACTIVATION] Scheduler stopped');
  }
};

/**
 * Run the deactivation check manually (for testing or admin triggers)
 */
export const runDeactivationCheck = async () => {
  if (isRunning) {
    return {
      success: false,
      message: 'Deactivation check is already running'
    };
  }

  isRunning = true;
  try {
    const result = await deactivateInactiveAccounts();
    return result;
  } catch (error) {
    console.error('❌ [AUTO-DEACTIVATION] Error in manual check:', error);
    return {
      success: false,
      message: 'Error running deactivation check',
      error: error.message
    };
  } finally {
    isRunning = false;
  }
};


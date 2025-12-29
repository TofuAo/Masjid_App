import { pool } from '../config/database.js';

/**
 * Automatically deactivate accounts that haven't logged in for 1 year
 * This service checks for accounts with last_login older than 365 days
 * and sets their status to 'tidak_aktif'
 * 
 * Excludes:
 * - Admin accounts (always kept active)
 * - Accounts already deactivated
 * - Accounts in 'cuti' status (on leave)
 */
export const deactivateInactiveAccounts = async () => {
  try {
    console.log('\n🔄 [AUTO-DEACTIVATION] Starting automatic account deactivation check...');

    // Check if last_login column exists
    let lastLoginColumnExists = false;
    try {
      const [columns] = await pool.execute(`
        SELECT COLUMN_NAME 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'last_login'
      `);
      lastLoginColumnExists = columns.length > 0;
    } catch (error) {
      console.warn('[AUTO-DEACTIVATION] Could not check for last_login column:', error.message);
    }

    if (!lastLoginColumnExists) {
      console.log('⚠️ [AUTO-DEACTIVATION] last_login column does not exist. Running migration...');
      try {
        await pool.execute(`
          ALTER TABLE users 
          ADD COLUMN last_login TIMESTAMP NULL DEFAULT NULL COMMENT 'Last successful login timestamp'
        `);
        await pool.execute(`CREATE INDEX idx_last_login ON users(last_login)`);
        console.log('✅ [AUTO-DEACTIVATION] last_login column added successfully');
      } catch (migrationError) {
        console.error('❌ [AUTO-DEACTIVATION] Failed to add last_login column:', migrationError.message);
        return {
          success: false,
          message: 'Migration failed',
          error: migrationError.message
        };
      }
    }

    // Find accounts that haven't logged in for 1 year (365 days)
    // Only deactivate accounts that are currently 'aktif' or 'pending'
    // Exclude admin accounts and accounts already deactivated or on leave
    const [inactiveAccounts] = await pool.execute(`
      SELECT ic, nama, email, role, status, last_login, updated_at, created_at
      FROM users
      WHERE (
        -- Accounts with last_login older than 365 days
        (last_login IS NOT NULL AND last_login < DATE_SUB(NOW(), INTERVAL 365 DAY))
        OR
        -- Accounts that have never logged in and were created more than 365 days ago
        (last_login IS NULL AND created_at < DATE_SUB(NOW(), INTERVAL 365 DAY))
      )
      AND status IN ('aktif', 'pending')
      AND role != 'admin'  -- Never deactivate admin accounts
      ORDER BY COALESCE(last_login, created_at) ASC
    `);

    if (inactiveAccounts.length === 0) {
      console.log('✅ [AUTO-DEACTIVATION] No inactive accounts found. All accounts are active.');
      return {
        success: true,
        message: 'No inactive accounts found',
        deactivatedCount: 0,
        accounts: []
      };
    }

    console.log(`📋 [AUTO-DEACTIVATION] Found ${inactiveAccounts.length} inactive account(s) to deactivate:`);
    
    const deactivatedAccounts = [];
    const errors = [];

    for (const account of inactiveAccounts) {
      try {
        const lastActivity = account.last_login || account.created_at;
        const daysSinceActivity = Math.floor(
          (new Date() - new Date(lastActivity)) / (1000 * 60 * 60 * 24)
        );

        // Update account status to tidak_aktif
        await pool.execute(
          `UPDATE users 
           SET status = 'tidak_aktif', 
               updated_at = NOW() 
           WHERE ic = ?`,
          [account.ic]
        );

        deactivatedAccounts.push({
          ic: account.ic,
          nama: account.nama,
          email: account.email,
          role: account.role,
          lastActivity: lastActivity,
          daysInactive: daysSinceActivity
        });

        console.log(`  ✓ Deactivated: ${account.nama} (IC: ${account.ic}) - ${daysSinceActivity} days inactive`);
      } catch (error) {
        console.error(`  ✗ Failed to deactivate ${account.ic}:`, error.message);
        errors.push({
          ic: account.ic,
          error: error.message
        });
      }
    }

    console.log(`\n✅ [AUTO-DEACTIVATION] Completed:`);
    console.log(`   - Deactivated: ${deactivatedAccounts.length} account(s)`);
    if (errors.length > 0) {
      console.log(`   - Errors: ${errors.length} account(s)`);
    }
    console.log('');

    return {
      success: true,
      message: `Deactivated ${deactivatedAccounts.length} inactive account(s)`,
      deactivatedCount: deactivatedAccounts.length,
      accounts: deactivatedAccounts,
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (error) {
    console.error('❌ [AUTO-DEACTIVATION] Error during automatic deactivation:', error);
    return {
      success: false,
      message: 'Error during automatic deactivation',
      error: error.message
    };
  }
};

/**
 * Get statistics about inactive accounts
 */
export const getInactiveAccountStats = async () => {
  try {
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_inactive,
        COUNT(CASE WHEN last_login IS NOT NULL THEN 1 END) as with_login_history,
        COUNT(CASE WHEN last_login IS NULL THEN 1 END) as never_logged_in,
        MIN(COALESCE(last_login, created_at)) as oldest_inactive_date
      FROM users
      WHERE (
        (last_login IS NOT NULL AND last_login < DATE_SUB(NOW(), INTERVAL 365 DAY))
        OR
        (last_login IS NULL AND created_at < DATE_SUB(NOW(), INTERVAL 365 DAY))
      )
      AND status IN ('aktif', 'pending')
      AND role != 'admin'
    `);

    return {
      success: true,
      stats: stats[0] || {
        total_inactive: 0,
        with_login_history: 0,
        never_logged_in: 0,
        oldest_inactive_date: null
      }
    };
  } catch (error) {
    console.error('[AUTO-DEACTIVATION] Error getting stats:', error);
    return {
      success: false,
      error: error.message
    };
  }
};


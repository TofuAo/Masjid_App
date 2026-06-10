import { pool } from '../config/database.js';

/**
 * Maintenance Mode / Emergency Shutdown Utility
 * 
 * Allows admins to put the system in maintenance mode or emergency shutdown
 * 
 * Features:
 * - Emergency shutdown (complete system stop)
 * - Maintenance mode (read-only access)
 * - Scheduled maintenance
 * - Reason tracking and logging
 * - Admin-only access during maintenance
 */

// Maintenance mode types
export const MAINTENANCE_TYPES = {
  NONE: 'none',                    // System is running normally
  MAINTENANCE: 'maintenance',      // Scheduled maintenance - read-only mode
  EMERGENCY: 'emergency',          // Emergency shutdown - no access except admins
  READONLY: 'readonly'             // Read-only mode - no write operations
};

/**
 * Initialize maintenance_mode table if not exists
 */
export async function ensureMaintenanceModeTable() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS maintenance_mode (
        id INT AUTO_INCREMENT PRIMARY KEY,
        is_active BOOLEAN DEFAULT FALSE,
        mode_type VARCHAR(20) DEFAULT 'none',
        reason TEXT,
        scheduled_start TIMESTAMP NULL,
        scheduled_end TIMESTAMP NULL,
        activated_by VARCHAR(50),
        activated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deactivated_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_is_active (is_active),
        INDEX idx_mode_type (mode_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Ensure at least one record exists
    const [records] = await pool.execute('SELECT COUNT(*) as count FROM maintenance_mode');
    if (records[0].count === 0) {
      await pool.execute(`
        INSERT INTO maintenance_mode (is_active, mode_type, reason) 
        VALUES (FALSE, 'none', 'Initial record')
      `);
    }
    
    console.log('✅ Maintenance mode table verified');
  } catch (error) {
    console.error('Error ensuring maintenance mode table:', error);
    throw error;
  }
}

/**
 * Get current maintenance mode status
 * 
 * @returns {Object} { isActive, modeType, reason, scheduledEnd, activatedBy }
 */
export async function getMaintenanceStatus() {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        m.*,
        u.nama as activated_by_name
      FROM maintenance_mode m
      LEFT JOIN users u ON m.activated_by COLLATE utf8mb4_unicode_ci = u.telefon COLLATE utf8mb4_unicode_ci
      ORDER BY m.id DESC 
      LIMIT 1
    `);
    
    if (rows.length === 0) {
      return {
        isActive: false,
        modeType: MAINTENANCE_TYPES.NONE,
        reason: null,
        scheduledEnd: null,
        activatedBy: null,
        activatedByName: null
      };
    }
    
    const status = rows[0];
    
    // Check if scheduled maintenance should end
    if (status.is_active && status.scheduled_end) {
      const now = new Date();
      const scheduledEnd = new Date(status.scheduled_end);
      
      if (now > scheduledEnd) {
        // Auto-deactivate if scheduled end has passed
        await deactivateMaintenanceMode('System', 'Scheduled maintenance period ended');
        return {
          isActive: false,
          modeType: MAINTENANCE_TYPES.NONE,
          reason: null,
          scheduledEnd: null,
          activatedBy: null,
          activatedByName: null
        };
      }
    }
    
    return {
      isActive: Boolean(status.is_active),
      modeType: status.mode_type || MAINTENANCE_TYPES.NONE,
      reason: status.reason,
      scheduledStart: status.scheduled_start,
      scheduledEnd: status.scheduled_end,
      activatedBy: status.activated_by,
      activatedByName: status.activated_by_name,
      activatedAt: status.activated_at
    };
  } catch (error) {
    console.error('Error getting maintenance status:', error);
    // Return safe default if error
    return {
      isActive: false,
      modeType: MAINTENANCE_TYPES.NONE,
      reason: null
    };
  }
}

/**
 * Check if system is in maintenance mode
 * 
 * @returns {Boolean}
 */
export async function isMaintenanceMode() {
  const status = await getMaintenanceStatus();
  return status.isActive;
}

/**
 * Activate maintenance mode or emergency shutdown
 * 
 * @param {String} adminIc - IC of admin activating maintenance
 * @param {String} modeType - Type of maintenance (maintenance, emergency, readonly)
 * @param {String} reason - Reason for maintenance
 * @param {Date|null} scheduledEnd - When maintenance should end (optional)
 * @returns {Object} Updated status
 */
export async function activateMaintenanceMode(adminIc, modeType, reason, scheduledEnd = null) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Validate mode type
    if (!Object.values(MAINTENANCE_TYPES).includes(modeType)) {
      throw new Error(`Invalid maintenance mode type: ${modeType}`);
    }
    
    // Deactivate any existing maintenance mode first
    await connection.execute(`
      UPDATE maintenance_mode 
      SET 
        is_active = FALSE,
        deactivated_at = NOW()
      WHERE is_active = TRUE
    `);
    
    // Insert new maintenance mode record
    await connection.execute(`
      INSERT INTO maintenance_mode 
      (is_active, mode_type, reason, scheduled_end, activated_by, activated_at)
      VALUES (TRUE, ?, ?, ?, ?, NOW())
    `, [modeType, reason, scheduledEnd, adminIc]);
    
    // Log the action
    await connection.execute(`
      INSERT INTO admin_actions 
      (admin_ic, action_type, details, timestamp)
      VALUES (?, 'activate_maintenance', ?, NOW())
    `, [
      adminIc,
      JSON.stringify({ modeType, reason, scheduledEnd })
    ]);
    
    await connection.commit();
    
    // Get updated status
    const status = await getMaintenanceStatus();
    
    // Log to console
    console.log(`🚨 MAINTENANCE MODE ACTIVATED by ${adminIc}`);
    console.log(`   Type: ${modeType.toUpperCase()}`);
    console.log(`   Reason: ${reason}`);
    if (scheduledEnd) {
      console.log(`   Scheduled End: ${scheduledEnd}`);
    }
    
    return status;
  } catch (error) {
    await connection.rollback();
    console.error('Error activating maintenance mode:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Deactivate maintenance mode
 * 
 * @param {String} adminIc - IC of admin deactivating maintenance
 * @param {String} reason - Reason for deactivation
 * @returns {Object} Updated status
 */
export async function deactivateMaintenanceMode(adminIc, reason = 'Maintenance completed') {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Update maintenance mode
    await connection.execute(`
      UPDATE maintenance_mode 
      SET 
        is_active = FALSE,
        deactivated_at = NOW()
      WHERE is_active = TRUE
    `);
    
    // Log the action (if not system auto-deactivation)
    if (adminIc !== 'System') {
      await connection.execute(`
        INSERT INTO admin_actions 
        (admin_ic, action_type, details, timestamp)
        VALUES (?, 'deactivate_maintenance', ?, NOW())
      `, [
        adminIc,
        JSON.stringify({ reason })
      ]);
    }
    
    await connection.commit();
    
    console.log(`✅ MAINTENANCE MODE DEACTIVATED by ${adminIc}`);
    console.log(`   Reason: ${reason}`);
    
    return await getMaintenanceStatus();
  } catch (error) {
    await connection.rollback();
    console.error('Error deactivating maintenance mode:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Emergency shutdown - immediately stop system
 * 
 * @param {String} adminIc - IC of admin triggering shutdown
 * @param {String} reason - Reason for emergency shutdown
 */
export async function emergencyShutdown(adminIc, reason) {
  console.log('🚨🚨🚨 EMERGENCY SHUTDOWN INITIATED 🚨🚨🚨');
  console.log(`   By: ${adminIc}`);
  console.log(`   Reason: ${reason}`);
  
  await activateMaintenanceMode(
    adminIc, 
    MAINTENANCE_TYPES.EMERGENCY, 
    `EMERGENCY SHUTDOWN: ${reason}`,
    null
  );
  
  return {
    success: true,
    message: 'Emergency shutdown activated',
    status: await getMaintenanceStatus()
  };
}

/**
 * Schedule maintenance for future time
 * 
 * @param {String} adminIc - IC of admin scheduling maintenance
 * @param {Date} startTime - When maintenance should start
 * @param {Date} endTime - When maintenance should end
 * @param {String} reason - Reason for maintenance
 */
export async function scheduleMaintenanceMode(adminIc, startTime, endTime, reason) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Insert scheduled maintenance
    await connection.execute(`
      INSERT INTO maintenance_mode 
      (is_active, mode_type, reason, scheduled_start, scheduled_end, activated_by)
      VALUES (FALSE, 'maintenance', ?, ?, ?, ?)
    `, [reason, startTime, endTime, adminIc]);
    
    // Log the action
    await connection.execute(`
      INSERT INTO admin_actions 
      (admin_ic, action_type, details, timestamp)
      VALUES (?, 'schedule_maintenance', ?, NOW())
    `, [
      adminIc,
      JSON.stringify({ startTime, endTime, reason })
    ]);
    
    await connection.commit();
    
    console.log(`📅 MAINTENANCE SCHEDULED by ${adminIc}`);
    console.log(`   Start: ${startTime}`);
    console.log(`   End: ${endTime}`);
    console.log(`   Reason: ${reason}`);
    
    return {
      success: true,
      message: 'Maintenance scheduled successfully',
      scheduledStart: startTime,
      scheduledEnd: endTime
    };
  } catch (error) {
    await connection.rollback();
    console.error('Error scheduling maintenance:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Get maintenance history
 * 
 * @param {Number} limit - Number of records to return
 * @returns {Array} Maintenance history
 */
export async function getMaintenanceHistory(limit = 50) {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        m.*,
        u.nama as activated_by_name
      FROM maintenance_mode m
      LEFT JOIN users u ON m.activated_by = u.telefon
      ORDER BY m.created_at DESC
      LIMIT ?
    `, [limit]);
    
    return rows;
  } catch (error) {
    console.error('Error getting maintenance history:', error);
    return [];
  }
}

/**
 * Check if user is allowed access during maintenance
 * 
 * @param {Object} user - User object with role and IC
 * @returns {Boolean}
 */
export function isUserAllowedDuringMaintenance(user) {
  if (!user) return false;
  
  // Allow admins and master admin
  const allowedRoles = ['admin', 'superadmin', 'master'];
  
  // Check if user has any allowed role
  if (user.roles && Array.isArray(user.roles)) {
    return user.roles.some(role => allowedRoles.includes(role.toLowerCase()));
  }
  
  // Check primary role
  const userRole = (user.role || '').toLowerCase();
  return allowedRoles.includes(userRole);
}

export default {
  MAINTENANCE_TYPES,
  ensureMaintenanceModeTable,
  getMaintenanceStatus,
  isMaintenanceMode,
  activateMaintenanceMode,
  deactivateMaintenanceMode,
  emergencyShutdown,
  scheduleMaintenanceMode,
  getMaintenanceHistory,
  isUserAllowedDuringMaintenance
};

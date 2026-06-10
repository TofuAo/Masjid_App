import {
  getMaintenanceStatus,
  activateMaintenanceMode,
  deactivateMaintenanceMode,
  emergencyShutdown,
  scheduleMaintenanceMode,
  getMaintenanceHistory,
  MAINTENANCE_TYPES
} from '../utils/maintenanceMode.js';

/**
 * Maintenance Mode Controller
 * 
 * Admin endpoints to control system maintenance mode
 */

/**
 * Get current maintenance status
 * Public endpoint - anyone can check status
 */
export const getStatus = async (req, res) => {
  try {
    const status = await getMaintenanceStatus();
    
    res.json({
      success: true,
      status: {
        isActive: status.isActive,
        modeType: status.modeType,
        reason: status.reason,
        scheduledEnd: status.scheduledEnd,
        activatedBy: status.activatedByName,
        activatedAt: status.activatedAt
      }
    });
  } catch (error) {
    console.error('Error getting maintenance status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get maintenance status',
      error: error.message
    });
  }
};

/**
 * Activate maintenance mode
 * Admin only
 */
export const activate = async (req, res) => {
  try {
    const { modeType, reason, scheduledEnd } = req.body;
    
    // Validate mode type
    if (!modeType || !Object.values(MAINTENANCE_TYPES).includes(modeType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid maintenance mode type',
        validTypes: Object.values(MAINTENANCE_TYPES)
      });
    }
    
    // Don't allow activating to 'none'
    if (modeType === MAINTENANCE_TYPES.NONE) {
      return res.status(400).json({
        success: false,
        message: 'Use deactivate endpoint to turn off maintenance mode'
      });
    }
    
    // Require reason
    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Reason is required for activating maintenance mode'
      });
    }
    
    // Parse scheduled end if provided
    let endDate = null;
    if (scheduledEnd) {
      endDate = new Date(scheduledEnd);
      if (isNaN(endDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid scheduled end date'
        });
      }
      
      // Ensure scheduled end is in the future
      if (endDate <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Scheduled end must be in the future'
        });
      }
    }
    
    // Activate maintenance mode
    const status = await activateMaintenanceMode(
      req.user.telefon,
      modeType,
      reason,
      endDate
    );
    
    res.json({
      success: true,
      message: `Maintenance mode activated: ${modeType.toUpperCase()}`,
      status: {
        isActive: status.isActive,
        modeType: status.modeType,
        reason: status.reason,
        scheduledEnd: status.scheduledEnd,
        activatedBy: status.activatedByName,
        activatedAt: status.activatedAt
      }
    });
  } catch (error) {
    console.error('Error activating maintenance mode:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate maintenance mode',
      error: error.message
    });
  }
};

/**
 * Deactivate maintenance mode
 * Admin only
 */
export const deactivate = async (req, res) => {
  try {
    const { reason } = req.body;
    
    const status = await deactivateMaintenanceMode(
      req.user.telefon,
      reason || 'Maintenance completed'
    );
    
    res.json({
      success: true,
      message: 'Maintenance mode deactivated',
      status: {
        isActive: status.isActive,
        modeType: status.modeType
      }
    });
  } catch (error) {
    console.error('Error deactivating maintenance mode:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate maintenance mode',
      error: error.message
    });
  }
};

/**
 * Emergency shutdown
 * Admin only - immediate system shutdown
 */
export const emergencyStop = async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Reason is required for emergency shutdown'
      });
    }
    
    const result = await emergencyShutdown(req.user.telefon, reason);
    
    res.json({
      success: true,
      message: '🚨 EMERGENCY SHUTDOWN ACTIVATED',
      status: result.status
    });
  } catch (error) {
    console.error('Error during emergency shutdown:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate emergency shutdown',
      error: error.message
    });
  }
};

/**
 * Schedule maintenance for future time
 * Admin only
 */
export const schedule = async (req, res) => {
  try {
    const { startTime, endTime, reason } = req.body;
    
    // Validate inputs
    if (!startTime || !endTime || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Start time, end time, and reason are required'
      });
    }
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }
    
    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }
    
    if (start <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Start time must be in the future'
      });
    }
    
    const result = await scheduleMaintenanceMode(
      req.user.telefon,
      start,
      end,
      reason
    );
    
    res.json({
      success: true,
      message: 'Maintenance scheduled successfully',
      scheduled: {
        startTime: start,
        endTime: end,
        reason
      }
    });
  } catch (error) {
    console.error('Error scheduling maintenance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule maintenance',
      error: error.message
    });
  }
};

/**
 * Get maintenance history
 * Admin only
 */
export const getHistory = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    
    const history = await getMaintenanceHistory(limit);
    
    res.json({
      success: true,
      history: history.map(record => ({
        id: record.id,
        isActive: Boolean(record.is_active),
        modeType: record.mode_type,
        reason: record.reason,
        scheduledStart: record.scheduled_start,
        scheduledEnd: record.scheduled_end,
        activatedBy: record.activated_by_name,
        activatedAt: record.activated_at,
        deactivatedAt: record.deactivated_at
      }))
    });
  } catch (error) {
    console.error('Error getting maintenance history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get maintenance history',
      error: error.message
    });
  }
};

/**
 * Get available maintenance types
 * Public endpoint
 */
export const getTypes = async (req, res) => {
  res.json({
    success: true,
    types: Object.entries(MAINTENANCE_TYPES).map(([key, value]) => ({
      key,
      value,
      description: getMaintenanceTypeDescription(value)
    }))
  });
};

/**
 * Helper function to get maintenance type descriptions
 */
function getMaintenanceTypeDescription(type) {
  const descriptions = {
    [MAINTENANCE_TYPES.NONE]: 'System operating normally',
    [MAINTENANCE_TYPES.EMERGENCY]: 'Emergency shutdown - admin access only',
    [MAINTENANCE_TYPES.MAINTENANCE]: 'Scheduled maintenance - read-only for users',
    [MAINTENANCE_TYPES.READONLY]: 'Read-only mode - no write operations'
  };
  
  return descriptions[type] || 'Unknown mode';
}

export default {
  getStatus,
  activate,
  deactivate,
  emergencyStop,
  schedule,
  getHistory,
  getTypes
};

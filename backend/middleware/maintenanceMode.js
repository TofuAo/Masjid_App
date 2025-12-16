import { getMaintenanceStatus, isUserAllowedDuringMaintenance, MAINTENANCE_TYPES } from '../utils/maintenanceMode.js';

/**
 * Maintenance Mode Middleware
 * 
 * Checks if system is in maintenance mode and blocks access accordingly
 * 
 * Modes:
 * - EMERGENCY: Complete shutdown - only admins can access
 * - MAINTENANCE: Scheduled maintenance - read-only for users, full access for admins
 * - READONLY: Read-only mode - no write operations
 * - NONE: Normal operation
 */

/**
 * Check maintenance mode on every request
 * Apply this early in middleware chain
 */
export async function checkMaintenanceMode(req, res, next) {
  try {
    // Get current maintenance status
    const status = await getMaintenanceStatus();
    
    // Store status in request for later use
    req.maintenanceMode = status;
    
    // If not in maintenance, continue normally
    if (!status.isActive || status.modeType === MAINTENANCE_TYPES.NONE) {
      return next();
    }
    
    // Check if this is a whitelisted endpoint (always allowed)
    const whitelistedPaths = [
      '/health',
      '/api/maintenance/status',
      '/api/auth/login',
      '/api/auth/logout',
      // Add maintenance mode control endpoints for admins
      '/api/admin/maintenance'
    ];
    
    const isWhitelisted = whitelistedPaths.some(path => 
      req.path.startsWith(path) || req.originalUrl.startsWith(path)
    );
    
    if (isWhitelisted) {
      return next();
    }
    
    // Check if user is authenticated and allowed during maintenance
    const isAllowed = req.user && isUserAllowedDuringMaintenance(req.user);
    
    // Handle different maintenance modes
    switch (status.modeType) {
      case MAINTENANCE_TYPES.EMERGENCY:
        // Emergency mode - only admins allowed
        if (isAllowed) {
          // Admin access - add warning header
          res.setHeader('X-Maintenance-Mode', 'emergency');
          res.setHeader('X-Maintenance-Reason', status.reason || 'Emergency shutdown');
          return next();
        } else {
          // Block all non-admin access
          return res.status(503).json({
            success: false,
            error: 'EMERGENCY_SHUTDOWN',
            message: '🚨 System is currently unavailable due to emergency maintenance. Please try again later.',
            reason: status.reason || 'Emergency maintenance in progress',
            modeType: 'emergency'
          });
        }
      
      case MAINTENANCE_TYPES.MAINTENANCE:
        // Maintenance mode - read-only for users, full access for admins
        if (isAllowed) {
          // Admin - full access with warning
          res.setHeader('X-Maintenance-Mode', 'maintenance');
          res.setHeader('X-Maintenance-Reason', status.reason || 'Maintenance mode');
          return next();
        } else {
          // Users - only allow GET requests (read-only)
          if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
            res.setHeader('X-Maintenance-Mode', 'maintenance-readonly');
            res.setHeader('X-Maintenance-Reason', status.reason || 'Maintenance mode');
            return next();
          } else {
            return res.status(503).json({
              success: false,
              error: 'MAINTENANCE_MODE',
              message: '⚠️ System is in maintenance mode. Read-only access only.',
              reason: status.reason || 'Scheduled maintenance',
              scheduledEnd: status.scheduledEnd,
              modeType: 'maintenance'
            });
          }
        }
      
      case MAINTENANCE_TYPES.READONLY:
        // Read-only mode - only GET requests allowed for everyone
        if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
          res.setHeader('X-Maintenance-Mode', 'readonly');
          if (status.reason) {
            res.setHeader('X-Maintenance-Reason', status.reason);
          }
          return next();
        } else {
          return res.status(503).json({
            success: false,
            error: 'READONLY_MODE',
            message: '⚠️ System is in read-only mode. Write operations are temporarily disabled.',
            reason: status.reason || 'Read-only mode active',
            modeType: 'readonly'
          });
        }
      
      default:
        // Unknown mode - continue but log warning
        console.warn('Unknown maintenance mode:', status.modeType);
        return next();
    }
  } catch (error) {
    console.error('Error checking maintenance mode:', error);
    // On error, allow request to continue (fail open for availability)
    // but log the error for investigation
    return next();
  }
}

/**
 * Middleware to block write operations in read-only mode
 * Apply to specific routes that should be blocked
 */
export async function blockWriteOperations(req, res, next) {
  try {
    const status = await getMaintenanceStatus();
    
    // If not in maintenance or user is admin, allow
    if (!status.isActive || 
        (req.user && isUserAllowedDuringMaintenance(req.user))) {
      return next();
    }
    
    // If in any maintenance mode and method is not safe, block
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (!safeMethods.includes(req.method)) {
      return res.status(503).json({
        success: false,
        error: 'WRITE_OPERATION_BLOCKED',
        message: 'Write operations are not allowed during maintenance mode',
        reason: status.reason
      });
    }
    
    next();
  } catch (error) {
    console.error('Error in blockWriteOperations middleware:', error);
    next();
  }
}

/**
 * Require admin access (used for maintenance control endpoints)
 */
export function requireAdminForMaintenance(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  if (!isUserAllowedDuringMaintenance(req.user)) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required to control maintenance mode'
    });
  }
  
  next();
}

/**
 * Add maintenance status to response headers
 * Use this to inform clients about maintenance status
 */
export async function addMaintenanceHeaders(req, res, next) {
  try {
    const status = await getMaintenanceStatus();
    
    if (status.isActive) {
      res.setHeader('X-Maintenance-Active', 'true');
      res.setHeader('X-Maintenance-Type', status.modeType);
      
      if (status.scheduledEnd) {
        res.setHeader('X-Maintenance-End', status.scheduledEnd.toISOString());
      }
    } else {
      res.setHeader('X-Maintenance-Active', 'false');
    }
    
    next();
  } catch (error) {
    console.error('Error adding maintenance headers:', error);
    next();
  }
}

export default {
  checkMaintenanceMode,
  blockWriteOperations,
  requireAdminForMaintenance,
  addMaintenanceHeaders
};

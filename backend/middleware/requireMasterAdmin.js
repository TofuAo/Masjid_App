import { logUnauthorizedAccess } from './securityLogger.js';

// Master admin IC (stored in database without hyphens)
const MASTER_ADMIN_IC = '731014065251';

export const requireMasterAdmin = (req, res, next) => {
  // Check if user is authenticated
  if (!req.user) {
    logUnauthorizedAccess(req, 'Master admin check failed: User not authenticated');
    return res.status(401).json({
      success: false,
      message: 'Akses dinafikan. Sila log masuk terlebih dahulu.'
    });
  }

  // Normalize IC for comparison (remove hyphens, database stores without hyphens)
  const userIC = req.user.ic ? req.user.ic.replace(/[-\s]/g, '') : '';
  const masterIC = MASTER_ADMIN_IC.replace(/[-\s]/g, '');

  // Check if user is the master admin
  if (userIC !== masterIC) {
    logUnauthorizedAccess(req, `Master admin check failed: User ${userIC} attempted to access master admin only endpoint`);
    return res.status(403).json({
      success: false,
      message: 'Akses dinafikan. Hanya Master Admin boleh mengakses fungsi ini.'
    });
  }

  // User is master admin, proceed
  next();
};


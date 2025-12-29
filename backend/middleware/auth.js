import jwt from 'jsonwebtoken';
import { pool, testConnection } from '../config/database.js';
import { logUnauthorizedAccess, logSuspiciousActivity } from './securityLogger.js';
import { fetchUserRoles } from '../services/userRoleService.js';

const attachRolesToUser = async (user, dbPrimaryRole = null) => {
  // Use dbPrimaryRole if provided, otherwise use user.role
  // This ensures we fetch all roles based on the database primary role, not the session role
  const primaryRoleForFetch = dbPrimaryRole || user.role;
  const roles = await fetchUserRoles(user.ic, primaryRoleForFetch);
  
  // Normalize all roles to lowercase
  let normalizedRoles = roles.length > 0 
    ? roles.map(r => (r || '').toLowerCase())
    : [];
  
  // CRITICAL: Always include the primary role from database
  const normalizedPrimary = (primaryRoleForFetch || '').toLowerCase();
  if (normalizedPrimary && !normalizedRoles.includes(normalizedPrimary)) {
    normalizedRoles.push(normalizedPrimary);
  }
  
  // Also ensure user.role is included (might be different from primaryRoleForFetch)
  const userRoleNormalized = (user.role || '').toLowerCase();
  if (userRoleNormalized && !normalizedRoles.includes(userRoleNormalized)) {
    normalizedRoles.push(userRoleNormalized);
  }
  
  // If still no roles, use primary role as fallback
  if (normalizedRoles.length === 0 && normalizedPrimary) {
    normalizedRoles.push(normalizedPrimary);
  }
  
  user.roles = normalizedRoles;

  const preferred = user.preferredRole && normalizedRoles.includes((user.preferredRole || '').toLowerCase())
    ? (user.preferredRole || '').toLowerCase()
    : null;

  user.activeRole = preferred || (normalizedRoles.includes(userRoleNormalized) ? userRoleNormalized : (normalizedRoles[0] || userRoleNormalized));
};

export const authenticateToken = async (req, res, next) => {
  // Get path values first
  const path = req.path || '';
  const originalUrl = req.originalUrl || '';
  const url = req.url || '';
  const baseUrl = req.baseUrl || '';
  
  // ============================================
  // CRITICAL: PUBLIC ENDPOINTS - NO AUTH REQUIRED
  // ============================================
  // Skip authentication for registration endpoints - CHECK FIRST before anything else
  
  // ULTIMATE CHECK: If it's a POST request to any registration endpoint, skip auth
  // Check in the simplest way possible - if path or originalUrl contains "register", skip auth
  if (req.method === 'POST') {
    // Simple string check - if ANY of these contain "register", skip auth
    const pathStr = String(path || '').toLowerCase();
    const originalUrlStr = String(originalUrl || '').toLowerCase();
    const urlStr = String(url || '').toLowerCase();
    const baseUrlStr = String(baseUrl || '').toLowerCase();
    
    if (pathStr.includes('register') || 
        originalUrlStr.includes('register') || 
        urlStr.includes('register') ||
        baseUrlStr.includes('register') ||
        (baseUrlStr + pathStr).includes('register')) {
      // COMPLETELY SKIP AUTHENTICATION
      return next();
    }
  }
  
  // Skip authentication for public endpoints
  // Check if request has skipAuth flag (set by route middleware)
  if (req.skipAuth || req._skipAuthForMasjidLocation || req._skipAuthForTeacherRegister) {
    console.log('✅ Auth skipped - flag set:', {
      skipAuth: req.skipAuth,
      _skipAuthForMasjidLocation: req._skipAuthForMasjidLocation,
      _skipAuthForTeacherRegister: req._skipAuthForTeacherRegister,
      path,
      originalUrl
    });
    return next();
  }
  
  // Check if this is the masjid-location endpoint (public endpoint)
  const isMasjidLocation = 
    path === '/masjid-location' ||
    path.includes('masjid-location') || 
    originalUrl.includes('masjid-location') ||
    originalUrl.includes('/api/settings/masjid-location') ||
    url.includes('masjid-location') ||
    (baseUrl + path).includes('masjid-location');
  
  if (isMasjidLocation) {
    console.log('✅ Auth skipped - Masjid location endpoint');
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    logUnauthorizedAccess(req, 'Missing authentication token');
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user still exists and is active
    const [users] = await pool.execute(
      'SELECT ic, nama, email, role, status FROM users WHERE ic = ? AND status = "aktif"',
      [decoded.userId]
    );

    if (users.length === 0) {
      logUnauthorizedAccess(req, 'User not found or inactive');
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    const user = users[0];
    // Store the database primary role before overriding (normalize it)
    const dbPrimaryRole = (user.role || '').toLowerCase();
    user.dbPrimaryRole = dbPrimaryRole; // Store for later use in requireRole
    
    // IMPORTANT: Store the original database role separately
    // user.role will remain as the database primary role for permission checks
    const originalDbRole = user.role;
    
    // Fetch all roles using the database primary role (not the token role)
    // This ensures we get all roles including admin if user has admin in database
    await attachRolesToUser(user, dbPrimaryRole);
    
    // Restore user.role to database primary role (in case attachRolesToUser changed it)
    user.role = originalDbRole;
    
    // Now set active role from token (session-selected role)
    // But keep user.role as database primary role for permission checks
    if (decoded.role) {
      const tokenRole = (decoded.role || '').toLowerCase();
      user.preferredRole = tokenRole;
      user.activeRole = tokenRole;
    } else {
      // If no role in token, use database primary role
      user.activeRole = dbPrimaryRole;
    }
    
    // Ensure database primary role is always in available roles for admin access check
    // Normalize all roles for comparison
    let normalizedRoles = (user.roles || []).map(r => (r || '').toLowerCase());
    if (dbPrimaryRole && !normalizedRoles.includes(dbPrimaryRole)) {
      normalizedRoles.push(dbPrimaryRole);
    }
    // Also ensure the active role from token is in available roles
    if (user.activeRole && !normalizedRoles.includes(user.activeRole)) {
      normalizedRoles.push(user.activeRole);
    }
    // CRITICAL: Always ensure the original database role is in the roles array
    // This is the most reliable source of truth
    if (originalDbRole) {
      const normalizedOriginal = (originalDbRole || '').toLowerCase();
      if (!normalizedRoles.includes(normalizedOriginal)) {
        normalizedRoles.push(normalizedOriginal);
      }
    }
    // Update user.roles to use normalized versions
    user.roles = normalizedRoles;
    
    // Debug: Log roles for all requests (to help diagnose admin access issues)
    console.log('[AUTH] User authenticated:', {
      ic: user.ic,
      dbPrimaryRole,
      originalDbRole,
      activeRole: user.activeRole,
      availableRoles: normalizedRoles.join(', '),
      rolesFromDB: user.roles?.join(', ') || 'none'
    });

    // Fetch related data based on user role
    if (user.role === 'teacher') {
      const [classes] = await pool.execute(
        'SELECT * FROM classes WHERE guru_ic = ?',
        [user.ic]
      );
      user.classes = classes;
    } else if (user.role === 'student') {
      const [student] = await pool.execute(
        'SELECT * FROM students WHERE user_ic = ?', // Corrected to match schema
        [user.ic]
      );
      user.student = student[0];

      if (user.student) { // Only fetch if student profile exists
        const [attendance] = await pool.execute(
          'SELECT * FROM attendance WHERE student_ic = ?',
          [user.ic]
        );
        user.attendance = attendance;

        const [fees] = await pool.execute(
          'SELECT * FROM fees WHERE student_ic = ?',
          [user.ic]
        );
        user.fees = fees;

        const [results] = await pool.execute(
          'SELECT * FROM results WHERE student_ic = ?',
          [user.ic]
        );
        user.results = results;
      }
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    logUnauthorizedAccess(req, `Invalid or expired token: ${error.message}`);
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

/**
 * Optional authentication middleware - sets req.user if token is present, but doesn't fail if missing
 */
export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // No token, continue without setting req.user
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user still exists and is active
    const [users] = await pool.execute(
      'SELECT ic, nama, email, role, status FROM users WHERE ic = ? AND status = "aktif"',
      [decoded.userId]
    );

    if (users.length > 0) {
      const user = users[0];
      const dbPrimaryRole = (user.role || '').toLowerCase();
      user.dbPrimaryRole = dbPrimaryRole;
      
      // Fetch all roles using the database primary role
      await attachRolesToUser(user, dbPrimaryRole);
      
      if (decoded.role) {
        const tokenRole = (decoded.role || '').toLowerCase();
        user.preferredRole = tokenRole;
        user.activeRole = tokenRole;
      }
      
      // Ensure all roles are normalized
      let normalizedRoles = (user.roles || []).map(r => (r || '').toLowerCase());
      if (dbPrimaryRole && !normalizedRoles.includes(dbPrimaryRole)) {
        normalizedRoles.push(dbPrimaryRole);
      }
      if (user.activeRole && !normalizedRoles.includes(user.activeRole)) {
        normalizedRoles.push(user.activeRole);
      }
      user.roles = normalizedRoles;
      
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Invalid token, continue without setting req.user
    next();
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    // Simple check: User's active role from token must match required role
    const requiredRoles = roles.map(r => String(r || '').toLowerCase());
    const userActiveRole = String(req.user.activeRole || req.user.role || '').toLowerCase();
    
    // Also check available roles as fallback
    let availableRoles = [];
    if (Array.isArray(req.user.roles)) {
      availableRoles = req.user.roles.map(r => String(r || '').toLowerCase());
    }
    
    // Allow if active role matches OR if any required role is in available roles
    const hasAccess = requiredRoles.includes(userActiveRole) || 
                     requiredRoles.some(role => availableRoles.includes(role));

    // Log for debugging PIC access
    if (requiredRoles.includes('pic') || userActiveRole === 'pic') {
      console.log('[REQUIRE_ROLE] PIC access check:', {
        path: req.path,
        requiredRoles,
        userActiveRole,
        availableRoles,
        reqUserRolesType: typeof req.user.roles,
        reqUserRoles: req.user.roles,
        check1: requiredRoles.includes(userActiveRole),
        check2: requiredRoles.some(role => availableRoles.includes(role)),
        hasAccess
      });
    }

    if (!hasAccess) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
};

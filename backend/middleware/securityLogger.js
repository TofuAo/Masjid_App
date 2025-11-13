/**
 * Security logging middleware
 * Logs security-related events like failed authentication attempts, suspicious activities, etc.
 */

export const logSecurityEvent = (eventType, details) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    eventType,
    ...details
  };

  // Log to console (in production, this should go to a secure log file or service)
  console.log(`[SECURITY] ${JSON.stringify(logEntry)}`);

  // TODO: In production, send to:
  // - Secure log file (with rotation)
  // - Security monitoring service (e.g., Sentry, LogRocket)
  // - Alert system for critical events
};

export const logFailedAuthAttempt = (req, reason) => {
  logSecurityEvent('FAILED_AUTH_ATTEMPT', {
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    endpoint: req.path,
    method: req.method,
    reason,
    icNumber: req.body?.icNumber ? '***' : undefined, // Don't log actual IC numbers
  });
};

export const logSuspiciousActivity = (req, activity, details = {}) => {
  logSecurityEvent('SUSPICIOUS_ACTIVITY', {
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    endpoint: req.path,
    method: req.method,
    activity,
    ...details
  });
};

export const logUnauthorizedAccess = (req, reason) => {
  logSecurityEvent('UNAUTHORIZED_ACCESS', {
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    endpoint: req.path,
    method: req.method,
    reason,
    userId: req.user?.ic || 'anonymous'
  });
};

export const logRateLimitExceeded = (req) => {
  logSecurityEvent('RATE_LIMIT_EXCEEDED', {
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    endpoint: req.path,
    method: req.method
  });
};


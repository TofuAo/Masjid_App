/**
 * Route access mapping – which roles can access which routes.
 * Used by ProtectedRoute to enforce role-based access.
 * Roles: ib, admin, pic, staff, teacher, student
 */
export const ROUTE_ACCESS = {
  // IB Dashboard / Payments – IB only
  '/ib-dashboard': ['ib'],
  '/ib-account': ['ib'],

  // System Settings / Maintenance – Admin only
  '/settings': ['admin'],
  '/system-health': ['admin'],
  '/audit-logs': ['admin'],
  '/permission-matrix': ['admin'],
  '/toyyibpay-settings': ['admin'],
  '/admins': ['admin'],
  '/pic-approvals': ['admin'],
  '/pic-users': ['admin'],
  '/pending-registrations': ['admin'],
  '/all-users': ['admin'],

  // Fee Management – IB, Admin, PIC, Staff, Student (own fees)
  '/yuran': ['ib', 'admin', 'pic', 'staff', 'student'],

  // Attendance Entry – Admin, PIC, Staff, Teacher (covers /attendance, /attendance/take, /attendance/:classId/:date)
  '/attendance': ['admin', 'pic', 'staff', 'teacher'],
  '/kehadiran': ['admin', 'pic', 'staff', 'teacher'],

  // Own Results / Resits – Student only
  '/resit': ['student'],

  // Campus Life – Admin, PIC, Staff, Teacher
  '/campus-life': ['admin', 'pic', 'staff', 'teacher'],
  '/campus-life/takwim': ['admin', 'pic', 'staff', 'teacher'],
  '/campus-life/garis-panduan': ['admin', 'pic', 'staff', 'teacher'],
  '/campus-life/modul': ['admin', 'pic', 'staff', 'teacher'],
  '/campus-life/fasiliti': ['admin', 'pic', 'staff', 'teacher'],
  // Executive Approvals – Admin, PIC
  '/executive-approvals': ['admin', 'pic'],
  // Carian (Search Hub) – Admin, PIC, Staff, Teacher
  '/carian': ['admin', 'pic', 'staff', 'teacher'],
  // Appointments (Pelantikan Guru) – Admin, PIC
  '/appointments': ['admin', 'pic'],
};

/**
 * Get allowed roles for a path (exact or prefix match).
 * Returns empty array if route is open to all authenticated users.
 */
export function getAllowedRoles(pathname) {
  const path = pathname.replace(/\/$/, '') || '/';
  const exact = ROUTE_ACCESS[path];
  if (exact) return exact;
  // Check prefix (e.g. /all-users/123)
  const prefix = Object.keys(ROUTE_ACCESS).find((key) => path.startsWith(key + '/'));
  return prefix ? ROUTE_ACCESS[prefix] : [];
}

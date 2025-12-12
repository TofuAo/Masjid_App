import { pool } from '../config/database.js';

const VALID_ROLES = ['admin', 'teacher', 'student', 'pic', 'staff', 'ib'];

export async function fetchUserRoles(userIc, primaryRole) {
  if (!userIc) {
    return primaryRole ? [primaryRole.toLowerCase()] : [];
  }
  
  // Normalize IC for comparison (remove hyphens and spaces)
  const normalizedIc = userIc.toString().replace(/[-\s]/g, '');
  
  // Try to find roles with normalized IC (both with and without hyphens)
  const hyphenatedIc = normalizedIc && normalizedIc.length === 12 
    ? `${normalizedIc.substring(0, 6)}-${normalizedIc.substring(6, 8)}-${normalizedIc.substring(8, 12)}`
    : userIc;
  
  const [rows] = await pool.execute(
    `SELECT DISTINCT role FROM user_roles 
     WHERE REPLACE(REPLACE(user_ic, '-', ''), ' ', '') = ? 
        OR user_ic = ? 
        OR user_ic = ?
        OR REPLACE(REPLACE(user_ic, '-', ''), ' ', '') = ?`,
    [normalizedIc, userIc, hyphenatedIc, normalizedIc]
  );

  const roles = new Set();
  
  // Normalize and add primary role first
  if (primaryRole) {
    const normalizedPrimary = (primaryRole || '').toLowerCase();
    if (normalizedPrimary && VALID_ROLES.includes(normalizedPrimary)) {
      roles.add(normalizedPrimary);
    }
  }

  // Add all roles from user_roles table
  for (const row of rows) {
    const normalized = (row.role || '').toLowerCase();
    if (normalized && VALID_ROLES.includes(normalized)) {
      roles.add(normalized);
    }
  }

  // If no roles found, ensure primary role is included (even if not in VALID_ROLES)
  if (roles.size === 0 && primaryRole) {
    const normalizedPrimary = (primaryRole || '').toLowerCase();
    roles.add(normalizedPrimary);
  }

  return Array.from(roles);
}


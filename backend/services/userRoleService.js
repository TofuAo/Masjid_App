import { pool } from '../config/database.js';

const VALID_ROLES = ['admin', 'teacher', 'student', 'pic', 'staff', 'ib'];

export async function fetchUserRoles(userIc, primaryRole) {
  const [rows] = await pool.execute(
    'SELECT role FROM user_roles WHERE user_ic = ?',
    [userIc]
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


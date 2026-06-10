// services/userRoleService.js
import { pool } from '../config/database.js';

export async function fetchUserRoles(userIc) {
  try {
    const [rows] = await pool.execute(
      'SELECT role FROM user_roles WHERE user_ic = ?',
      [userIc]
    );
    return rows.map(r => r.role);
  } catch (error) {
    console.error('[userRoleService] fetchUserRoles error:', error.message);
    return [];
  }
}

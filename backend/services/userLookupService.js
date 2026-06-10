// services/userLookupService.js
import { pool } from '../config/database.js';
import { fetchUserRoles } from './userRoleService.js';

export async function findUserByNormalizedPhone(phone) {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE telefon = ? LIMIT 1',
      [phone]
    );
    return rows[0] || null;
  } catch (error) {
    console.error('[userLookupService] findUserByNormalizedPhone error:', error.message);
    return null;
  }
}

export async function findAllUsersByNormalizedPhone(phone) {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE telefon = ?',
      [phone]
    );
    return rows;
  } catch (error) {
    console.error('[userLookupService] findAllUsersByNormalizedPhone error:', error.message);
    return [];
  }
}

export async function getUserWithRoles(userIc) {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE ic = ? LIMIT 1',
      [userIc]
    );
    if (!rows[0]) return null;
    const user = rows[0];
    user.roles = await fetchUserRoles(userIc);
    return user;
  } catch (error) {
    console.error('[userLookupService] getUserWithRoles error:', error.message);
    return null;
  }
}

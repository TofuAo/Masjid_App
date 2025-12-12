/**
 * Robust user lookup service with duplicate detection and role-aware searching
 */

import { pool } from '../config/database.js';
import { normalizeICForQuery } from '../utils/icUtils.js';
import { fetchUserRoles } from './userRoleService.js';

/**
 * Finds a user by normalized IC with role-aware prioritization
 * Handles duplicate accounts by prioritizing the requested role
 * 
 * @param {string} normalizedIc - Normalized IC (digits only)
 * @param {string|null} requestedRole - Optional role to prioritize
 * @returns {Promise<Object|null>} User object or null if not found
 */
export const findUserByNormalizedIc = async (normalizedIc, requestedRole = null) => {
  if (!normalizedIc || normalizedIc.length !== 12) {
    return null;
  }

  let query, params;

  if (requestedRole) {
    // Prioritize users with the requested role
    // Use subquery to check if user has the requested role in user_roles table
    query = `
      SELECT u.*
      FROM users u
      WHERE REPLACE(REPLACE(u.ic, '-', ''), ' ', '') = ?
      ORDER BY 
        CASE 
          WHEN u.role = ? THEN 0
          WHEN EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE REPLACE(REPLACE(ur.user_ic, '-', ''), ' ', '') = ? 
            AND ur.role = ?
          ) THEN 1
          ELSE 2
        END,
        (u.ic LIKE '%-%') DESC,
        u.created_at DESC
      LIMIT 1
    `;
    params = [normalizedIc, requestedRole, normalizedIc, requestedRole];
  } else {
    // No role preference - get the most recent or hyphenated format
    query = `
      SELECT * FROM users 
      WHERE REPLACE(REPLACE(ic, '-', ''), ' ', '') = ? 
      ORDER BY (ic LIKE '%-%') DESC, created_at DESC, ic ASC
      LIMIT 1
    `;
    params = [normalizedIc];
  }

  try {
    const [users] = await pool.execute(query, params);
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error('[findUserByNormalizedIc] Database error:', error);
    throw error;
  }
};

/**
 * Finds all users with the same normalized IC (for duplicate detection)
 * 
 * @param {string} normalizedIc - Normalized IC (digits only)
 * @returns {Promise<Array>} Array of user objects
 */
export const findAllUsersByNormalizedIc = async (normalizedIc) => {
  if (!normalizedIc || normalizedIc.length !== 12) {
    return [];
  }

  try {
    const [users] = await pool.execute(
      `SELECT u.*, 
              GROUP_CONCAT(DISTINCT ur.role ORDER BY ur.role SEPARATOR ',') as additional_roles
       FROM users u
       LEFT JOIN user_roles ur ON REPLACE(REPLACE(u.ic, '-', ''), ' ', '') = REPLACE(REPLACE(ur.user_ic, '-', ''), ' ', '')
       WHERE REPLACE(REPLACE(u.ic, '-', ''), ' ', '') = ?
       GROUP BY u.ic, u.nama, u.email, u.telefon, u.umur, u.alamat, u.role, u.status, u.password, u.created_at, u.updated_at
       ORDER BY u.created_at DESC`,
      [normalizedIc]
    );

    return users.map(user => ({
      ...user,
      allRoles: user.additional_roles 
        ? [user.role, ...user.additional_roles.split(',')].filter((v, i, a) => a.indexOf(v) === i)
        : [user.role]
    }));
  } catch (error) {
    console.error('[findAllUsersByNormalizedIc] Database error:', error);
    throw error;
  }
};

/**
 * Checks if a user with the given IC exists (any role)
 * 
 * @param {string} ic - IC number (any format)
 * @returns {Promise<boolean>} True if user exists
 */
export const userExists = async (ic) => {
  const normalizedIc = normalizeICForQuery(ic);
  const user = await findUserByNormalizedIc(normalizedIc);
  return user !== null;
};

/**
 * Gets user with all roles attached
 * 
 * @param {string} ic - IC number (any format)
 * @param {string|null} requestedRole - Optional role to prioritize
 * @returns {Promise<Object|null>} User object with roles array
 */
export const getUserWithRoles = async (ic, requestedRole = null) => {
  const normalizedIc = normalizeICForQuery(ic);
  const user = await findUserByNormalizedIc(normalizedIc, requestedRole);
  
  if (!user) {
    return null;
  }

  // Fetch all roles from user_roles table
  const roles = await fetchUserRoles(user.ic, user.role);
  const allRoles = roles.length > 0 ? roles : [user.role];
  
  return {
    ...user,
    roles: allRoles,
    primaryRole: user.role,
    hasMultipleAccounts: false // Could be enhanced to check for duplicates
  };
};


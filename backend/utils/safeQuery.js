/**
 * Safe SQL execution layer – eliminates runtime API errors from MySQL.
 *
 * Rules:
 * - Never bind LIMIT or OFFSET with ? (use sanitized literals).
 * - Placeholder count must exactly match params length.
 * - No undefined or NaN in params; reject before execute.
 * - All DB errors are caught and converted to safe API responses (no raw MySQL to client).
 */

import { pool } from '../config/database.js';

/** Count `?` placeholders in SQL (excluding quoted strings). */
export function countPlaceholders(sql) {
  const singleQuoted = /'(?:[^'\\]|\\.)*'/g;
  const doubleQuoted = /"(?:[^"\\]|\\.)*"/g;
  const cleaned = sql.replace(singleQuoted, '').replace(doubleQuoted, '');
  const matches = cleaned.match(/\?/g);
  return matches ? matches.length : 0;
}

/**
 * Sanitize a value for use as LIMIT or OFFSET (integer only, clamped).
 * Use this to build SQL with LIMIT/OFFSET as literals, never as ?.
 */
export function safeLimit(value, defaultVal = 50, minVal = 1, maxVal = 200) {
  if (value == null || value === '') return defaultVal;
  const n = parseInt(value, 10);
  if (!Number.isInteger(n) || Number.isNaN(n)) return defaultVal;
  return Math.max(minVal, Math.min(n, maxVal));
}

export function safeOffset(value, defaultVal = 0, maxVal = 10000) {
  if (value == null || value === '') return defaultVal;
  const n = parseInt(value, 10);
  if (!Number.isInteger(n) || Number.isNaN(n) || n < 0) return defaultVal;
  return Math.min(n, maxVal);
}

/**
 * Ensure every element is valid for MySQL binding (no undefined, no NaN).
 * @returns {{ valid: boolean, invalidIndex?: number }}
 */
export function validateParams(params) {
  if (!Array.isArray(params)) return { valid: false, invalidIndex: 0 };
  for (let i = 0; i < params.length; i++) {
    const p = params[i];
    if (p === undefined) return { valid: false, invalidIndex: i };
    if (typeof p === 'number' && Number.isNaN(p)) return { valid: false, invalidIndex: i };
  }
  return { valid: true };
}

/**
 * Assert placeholders match params and params are valid. Throws if not.
 */
export function assertSafeParams(sql, params) {
  const expected = countPlaceholders(sql);
  const actual = Array.isArray(params) ? params.length : 0;
  if (expected !== actual) {
    throw new Error(`SAFE_QUERY_PARAM_COUNT: expected ${expected} placeholders, got ${actual} params`);
  }
  const { valid, invalidIndex } = validateParams(params);
  if (!valid) {
    throw new Error(`SAFE_QUERY_INVALID_PARAM: invalid param at index ${invalidIndex} (undefined or NaN)`);
  }
}

/**
 * Execute a prepared statement safely.
 * - Validates placeholder count and param array (no undefined/NaN).
 * - Catches DB errors and throws a controlled error (message safe for client, details logged).
 *
 * @param {string} sql - SQL with ? placeholders (must NOT include LIMIT ? or OFFSET ?)
 * @param {Array} params - Bound parameters
 * @returns {Promise<[rows, fields]>} Same as pool.execute()
 */
export async function execute(sql, params = []) {
  assertSafeParams(sql, params);
  try {
    return await pool.execute(sql, params);
  } catch (err) {
    console.error('[safeQuery.execute]', err.message || err);
    if (process.env.NODE_ENV === 'development' && err.stack) console.error(err.stack);
    const code = err.code || '';
    const msg = err.message || '';
    if (code === 'ER_WRONG_ARGUMENTS' || msg.includes('mysqld_stmt_execute')) {
      throw Object.assign(new Error('Invalid query parameters'), { statusCode: 400, code: 'INVALID_QUERY_PARAMS' });
    }
    throw Object.assign(new Error('Database error'), { statusCode: 500, code: code || 'DB_ERROR', original: err });
  }
}

/**
 * Run a raw query (no placeholders). Use for queries built with pool.escape() and safe literals (e.g. LIMIT).
 * Catches DB errors and rethrows a controlled error.
 */
export async function query(sql) {
  try {
    return await pool.query(sql);
  } catch (err) {
    console.error('[safeQuery.query]', err.message || err);
    if (process.env.NODE_ENV === 'development' && err.stack) console.error(err.stack);
    const code = err.code || '';
    const msg = err.message || '';
    if (code === 'ER_WRONG_ARGUMENTS' || msg.includes('mysqld_stmt_execute')) {
      throw Object.assign(new Error('Invalid query'), { statusCode: 400, code: 'INVALID_QUERY' });
    }
    throw Object.assign(new Error('Database error'), { statusCode: 500, code: code || 'DB_ERROR', original: err });
  }
}

export default { countPlaceholders, safeLimit, safeOffset, validateParams, assertSafeParams, execute, query };

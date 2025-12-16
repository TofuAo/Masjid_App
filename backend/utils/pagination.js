/**
 * Utility functions for safe pagination parameters
 * Prevents SQL injection by ensuring LIMIT and OFFSET are always valid integers
 */

/**
 * Safely parse and validate a limit value for SQL queries
 * @param {any} limit - The limit value to parse
 * @param {number} defaultLimit - Default limit if invalid (default: 1000)
 * @param {number} maxLimit - Maximum allowed limit (default: 10000)
 * @returns {number} A safe integer limit value
 */
export function safeLimit(limit, defaultLimit = 1000, maxLimit = 10000) {
  if (limit === null || limit === undefined || limit === '') {
    return defaultLimit;
  }
  
  const parsed = parseInt(limit, 10);
  
  // Check if parsing resulted in a valid integer
  if (!Number.isInteger(parsed) || isNaN(parsed)) {
    return defaultLimit;
  }
  
  // Ensure it's at least 1 and not exceeding max
  return Math.max(1, Math.min(parsed, maxLimit));
}

/**
 * Safely parse and validate a page number for SQL queries
 * @param {any} page - The page number to parse
 * @param {number} defaultPage - Default page if invalid (default: 1)
 * @returns {number} A safe integer page number (at least 1)
 */
export function safePage(page, defaultPage = 1) {
  if (page === null || page === undefined || page === '') {
    return defaultPage;
  }
  
  const parsed = parseInt(page, 10);
  
  // Check if parsing resulted in a valid integer
  if (!Number.isInteger(parsed) || isNaN(parsed)) {
    return defaultPage;
  }
  
  // Ensure it's at least 1
  return Math.max(1, parsed);
}

/**
 * Calculate a safe offset value from page and limit
 * @param {any} page - The page number
 * @param {any} limit - The limit value
 * @param {number} defaultPage - Default page if invalid
 * @param {number} defaultLimit - Default limit if invalid
 * @returns {number} A safe integer offset value
 */
export function safeOffset(page, limit, defaultPage = 1, defaultLimit = 1000) {
  const safePageNum = safePage(page, defaultPage);
  const safeLimitNum = safeLimit(limit, defaultLimit);
  return (safePageNum - 1) * safeLimitNum;
}

/**
 * Get safe pagination parameters as an object
 * @param {any} page - The page number
 * @param {any} limit - The limit value
 * @param {number} defaultPage - Default page if invalid
 * @param {number} defaultLimit - Default limit if invalid
 * @param {number} maxLimit - Maximum allowed limit
 * @returns {{limit: number, offset: number, page: number}} Safe pagination parameters
 */
export function getSafePagination(page, limit, defaultPage = 1, defaultLimit = 1000, maxLimit = 10000) {
  const safePageNum = safePage(page, defaultPage);
  const safeLimitNum = safeLimit(limit, defaultLimit, maxLimit);
  const safeOffsetNum = (safePageNum - 1) * safeLimitNum;
  
  return {
    page: safePageNum,
    limit: safeLimitNum,
    offset: safeOffsetNum
  };
}

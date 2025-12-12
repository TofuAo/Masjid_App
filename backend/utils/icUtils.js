/**
 * Unified IC (Malaysian Identity Card) utility functions
 * Provides consistent IC normalization, validation, and comparison across the system
 */

/**
 * Normalizes IC to digits-only format for database queries
 * Accepts: "123456-78-9012", "123456789012", "123456 78 9012"
 * Returns: "123456789012"
 */
export const normalizeICForQuery = (ic) => {
  if (!ic) return '';
  return ic.toString().replace(/[-\s]/g, '');
};

/**
 * Normalizes IC to standard format with hyphens
 * Accepts: "123456789012", "123456-78-9012", "123456 78 9012"
 * Returns: "123456-78-9012" or original if invalid
 */
export const normalizeICToStandard = (ic) => {
  if (!ic) return null;
  
  const cleaned = normalizeICForQuery(ic);
  
  // Validate it's 12 digits
  if (!/^\d{12}$/.test(cleaned)) {
    return ic; // Return original if invalid
  }
  
  // Format as 123456-78-9012
  return `${cleaned.substring(0, 6)}-${cleaned.substring(6, 8)}-${cleaned.substring(8, 12)}`;
};

/**
 * Validates IC format (with or without hyphens)
 * Returns true if valid, false otherwise
 */
export const isValidICFormat = (ic) => {
  if (!ic) return false;
  const cleaned = normalizeICForQuery(ic);
  return /^\d{12}$/.test(cleaned);
};

/**
 * Compares two ICs for equality (ignoring hyphens and spaces)
 * Returns true if they represent the same IC
 */
export const compareICs = (ic1, ic2) => {
  if (!ic1 || !ic2) return false;
  return normalizeICForQuery(ic1) === normalizeICForQuery(ic2);
};

/**
 * Formats IC with hyphens for display
 * Accepts: "123456789012"
 * Returns: "123456-78-9012"
 */
export const formatICWithHyphen = (ic) => {
  if (!ic) return ic;
  const digits = normalizeICForQuery(ic);
  if (digits.length !== 12) return ic;
  return `${digits.slice(0, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`;
};

/**
 * SQL-safe IC comparison expression
 * Use this in WHERE clauses to compare ICs ignoring format differences
 */
export const getICComparisonSQL = (columnName, paramName = '?') => {
  return `REPLACE(REPLACE(${columnName}, '-', ''), ' ', '') = REPLACE(REPLACE(${paramName}, '-', ''), ' ', '')`;
};


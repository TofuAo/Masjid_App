/**
 * Normalizes Malaysian IC number to standard format with hyphens
 * Accepts formats: 123456789012 or 123456-78-9012
 * Returns: 123456-78-9012
 * STRICT: Rejects ICs starting with non-digits (like T0-prefixed)
 */
export const normalizeIC = (ic) => {
  if (!ic) return null;
  
  // Remove all hyphens and spaces
  const cleaned = ic.toString().replace(/[-\s]/g, '');
  
  // STRICT: Must be exactly 12 digits and must start with a digit
  // Reject any IC that starts with non-digit characters (like T0, etc.)
  if (!/^\d{12}$/.test(cleaned) || !/^\d/.test(cleaned)) {
    return null; // Return null if invalid format (including T0-prefixed)
  }
  
  // Format as 123456-78-9012
  return `${cleaned.substring(0, 6)}-${cleaned.substring(6, 8)}-${cleaned.substring(8, 12)}`;
};

/**
 * Validates if IC number is in valid format (with or without hyphens)
 * Returns true if valid, false otherwise
 * STRICT: Only accepts 12 digits starting with a digit (rejects T0-prefixed, letters, etc.)
 */
export const isValidICFormat = (ic) => {
  if (!ic) return false;
  
  // Remove all hyphens and spaces
  const cleaned = ic.toString().replace(/[-\s]/g, '');
  
  // STRICT: Must be exactly 12 digits and must start with a digit (not T, not letter)
  // Reject any IC that starts with non-digit characters (like T0, etc.)
  return /^\d{12}$/.test(cleaned) && /^\d/.test(cleaned);
};


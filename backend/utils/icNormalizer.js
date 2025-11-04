/**
 * Normalizes Malaysian IC number to standard format with hyphens
 * Accepts formats: 123456789012 or 123456-78-9012
 * Returns: 123456-78-9012
 */
export const normalizeIC = (ic) => {
  if (!ic) return null;
  
  // Remove all hyphens and spaces
  const cleaned = ic.toString().replace(/[-\s]/g, '');
  
  // Check if it's 12 digits
  if (!/^\d{12}$/.test(cleaned)) {
    return ic; // Return original if invalid format
  }
  
  // Format as 123456-78-9012
  return `${cleaned.substring(0, 6)}-${cleaned.substring(6, 8)}-${cleaned.substring(8, 12)}`;
};

/**
 * Validates if IC number is in valid format (with or without hyphens)
 * Returns true if valid, false otherwise
 */
export const isValidICFormat = (ic) => {
  if (!ic) return false;
  
  // Remove all hyphens and spaces
  const cleaned = ic.toString().replace(/[-\s]/g, '');
  
  // Check if it's exactly 12 digits
  return /^\d{12}$/.test(cleaned);
};


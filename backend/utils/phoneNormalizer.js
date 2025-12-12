/**
 * Normalizes Malaysian phone number to standard format with hyphen
 * Accepts formats: 0102715677, 010-2715677, 010-271-5677, etc.
 * Returns: 010-2715677 (for 10 digits) or 012-3456789 (for 11 digits)
 */
export const normalizePhone = (phone) => {
  if (!phone) return null;
  
  // Remove all hyphens, spaces, and parentheses
  const cleaned = phone.toString().replace(/[-\s()]/g, '');
  
  // Check if it starts with 01 and has at least 9 digits (Malaysian mobile format)
  // Standard format: 01X followed by 7-8 digits (10-11 digits total)
  // But also handle 9-digit numbers that start with 01 (edge cases)
  if (!/^01\d{7,9}$/.test(cleaned)) {
    return phone; // Return original if invalid format
  }
  
  // Format: 01X-XXXXXXX (for 10 digits) or 01X-XXXXXXXX (for 11 digits)
  // Also format 9-digit numbers as 01X-XXXXXX
  if (cleaned.length >= 9 && cleaned.length <= 11 && cleaned.startsWith('01')) {
    return `${cleaned.substring(0, 3)}-${cleaned.substring(3)}`;
  }
  
  return phone;
};

/**
 * Validates if phone number is in valid Malaysian format (with or without hyphens)
 * Returns true if valid, false otherwise
 */
export const isValidPhoneFormat = (phone) => {
  if (!phone) return false;
  
  // Remove all hyphens, spaces, and parentheses
  const cleaned = phone.toString().replace(/[-\s()]/g, '');
  
  // Malaysian mobile numbers: 01X followed by 7-8 digits (total 10-11 digits)
  return /^01\d{8,9}$/.test(cleaned);
};


/**
 * Formats Malaysian phone number by removing all non-digits and optionally adding hyphen
 * @param {string} value - Phone input value
 * @param {boolean} autoFormat - Whether to auto-format with hyphen as user types
 * @returns {string} - Formatted phone number
 */
export const formatPhone = (value, autoFormat = false) => {
  if (!value) return '';
  
  // Remove all non-digit characters
  const digitsOnly = value.replace(/\D/g, '');
  
  // Limit to 11 digits (01X followed by 8 digits max)
  const limited = digitsOnly.slice(0, 11);
  
  if (!autoFormat) {
    return limited;
  }
  
  // Auto-format with hyphen: 01X-XXXXXXX or 01X-XXXXXXXX
  if (limited.length <= 3) {
    return limited;
  } else {
    return `${limited.slice(0, 3)}-${limited.slice(3)}`;
  }
};

/**
 * Formats phone number for display purposes (always formats with hyphen if valid)
 * @param {string} phone - Phone number to format (can be with or without hyphens)
 * @returns {string} - Formatted phone number with hyphen, or original if invalid/empty
 */
export const formatPhoneForDisplay = (phone) => {
  if (!phone) return phone || '';
  
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // If it's a valid Malaysian mobile format (10-11 digits starting with 01)
  if (digitsOnly.length >= 10 && digitsOnly.length <= 11 && digitsOnly.startsWith('01')) {
    // Format with hyphen: 01X-XXXXXXX or 01X-XXXXXXXX
    return `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3)}`;
  }
  
  // If already formatted or doesn't match format, return as is
  return phone;
};

/**
 * Validates if phone number is in valid Malaysian mobile format (with or without hyphens)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid
 */
export const isValidPhone = (phone) => {
  if (!phone) return false;
  const digitsOnly = phone.replace(/\D/g, '');
  // Malaysian mobile: 01X followed by 7-8 digits (total 10-11 digits)
  return /^01\d{8,9}$/.test(digitsOnly);
};


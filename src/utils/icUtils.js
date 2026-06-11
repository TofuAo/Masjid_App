/**
 * Formats IC number: XXXXXX-XX-XXXX (6-2-4)
 */
export const formatIC = (value, autoFormat = false) => {
  if (!value) return '';

  // Remove all non-digit characters
  const digitsOnly = value.toString().replace(/\D/g, '');

  if (!autoFormat) {
    return digitsOnly;
  }

  // XXXXXX
  if (digitsOnly.length <= 6) {
    return digitsOnly;
  }

  // XXXXXX-XX
  if (digitsOnly.length <= 8) {
    return `${digitsOnly.slice(0, 6)}-${digitsOnly.slice(6)}`;
  }

  // XXXXXX-XX-XXXX (max 12 digits)
  return `${digitsOnly.slice(0, 6)}-${digitsOnly.slice(6, 8)}-${digitsOnly.slice(8, 12)}`;
};

/**
 * Validates Malaysian IC: exactly 12 digits
 */
export const isValidIC = (ic) => {
  if (!ic) return false;
  const digitsOnly = ic.toString().replace(/\D/g, '');
  return digitsOnly.length === 12;
};

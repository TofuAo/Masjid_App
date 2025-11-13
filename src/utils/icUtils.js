/**
 * Formats IC number by removing all non-digits and optionally adding hyphens
 * @param {string} value - IC input value
 * @param {boolean} autoFormat - Whether to auto-format with hyphens as user types
 * @returns {string} - Formatted IC
 */
export const formatIC = (value, autoFormat = false) => {
  if (!value) return '';

  // Remove all non-digit characters
  const digitsOnly = value.replace(/\D/g, '');

  // Limit to 12 digits
  const limited = digitsOnly.slice(0, 12);

  if (!autoFormat) {
    return limited;
  }

  if (limited.length <= 6) {
    return limited;
  }

  if (limited.length <= 8) {
    return `${limited.slice(0, 6)}-${limited.slice(6)}`;
  }

  if (limited.length <= 12) {
    const first = limited.slice(0, 6);
    const middle = limited.slice(6, 8);
    const last = limited.slice(8);
    return `${first}-${middle}-${last}`;
  }

  return limited;
};

/**
 * Validates if IC number is in valid format (with or without hyphens)
 * @param {string} ic - IC number to validate
 * @returns {boolean} - True if valid
 */
export const isValidIC = (ic) => {
  if (!ic) return false;
  const digitsOnly = ic.replace(/\D/g, '');
  return digitsOnly.length === 12;
};


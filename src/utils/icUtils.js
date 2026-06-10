/**
 * Formats phone number by removing all non-digits and optionally adding separators.
 */
export const formatPhone = (value, autoFormat = false) => {
  if (!value) return '';

  // Remove all non-digit characters
  const digitsOnly = value.toString().replace(/\D/g, '');

  if (!autoFormat) {
    return digitsOnly;
  }

  if (digitsOnly.length <= 3) {
    return digitsOnly;
  }

  if (digitsOnly.length <= 7) {
    return `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3)}`;
  }

  // Format as 012-345 6789
  const first = digitsOnly.slice(0, 3);
  const middle = digitsOnly.slice(3, 7);
  const last = digitsOnly.slice(7);
  return `${first}-${middle} ${last}`;
};

/**
 * Validates if phone number is in a plausible format.
 */
export const isValidPhone = (phone) => {
  if (!phone) return false;
  const digitsOnly = phone.toString().replace(/\D/g, '');
  // Phone numbers in Malaysia are typically 10 to 11 digits
  return digitsOnly.length >= 10 && digitsOnly.length <= 15 && /^\d/.test(phone.toString().trim());
};

// Backward-compatible aliases (legacy naming in UI components)
export const formatIC = formatPhone;
export const isValidIC = isValidPhone;

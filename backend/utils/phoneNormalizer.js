// utils/phoneNormalizer.js
// Normalizes Malaysian phone numbers for consistent storage and lookup
// Stored format: 0102715677 (no dashes, no spaces, no +60 prefix)

export function normalizePhone(phone) {
  if (!phone) return null;

  // Remove all non-digit characters (dashes, spaces, brackets, dots)
  let normalized = String(phone).replace(/\D/g, '');

  // Convert +601X or 601X to 01X (Malaysian format)
  if (normalized.startsWith('601')) {
    normalized = '0' + normalized.slice(2);
  } else if (normalized.startsWith('60')) {
    normalized = '0' + normalized.slice(2);
  }

  return normalized;
}

export function isValidPhoneFormat(phone) {
  if (!phone) return false;
  const normalized = normalizePhone(phone);
  // Malaysian numbers: 010-019, 011, 012-019 = 10-11 digits starting with 01
  return /^01\d{8,9}$/.test(normalized);
}
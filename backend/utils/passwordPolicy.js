/**
 * Password Policy Utilities
 * Enforces strong password requirements
 */

/**
 * Validates password strength
 * Returns { valid: boolean, message: string, strength: 'weak'|'fair'|'good'|'strong' }
 */
export const validatePasswordStrength = (password) => {
  if (!password || typeof password !== 'string') {
    return {
      valid: false,
      message: 'Kata laluan diperlukan',
      strength: 'weak'
    };
  }

  const length = password.length;

  // Minimum length check
  if (length < 8) {
    return {
      valid: false,
      message: 'Kata laluan mestilah sekurang-kurangnya 8 aksara',
      strength: 'weak'
    };
  }

  // Maximum length check
  if (length > 128) {
    return {
      valid: false,
      message: 'Kata laluan terlalu panjang (maksimum 128 aksara)',
      strength: 'weak'
    };
  }

  // Check for common weak passwords
  const commonPasswords = [
    'password', 'password123', '123456', '12345678', '123456789',
    'qwerty', 'abc123', 'password1', '1234567', 'welcome',
    'monkey', '1234567890', 'letmein', 'trustno1', 'dragon'
  ];

  if (commonPasswords.some(weak => password.toLowerCase().includes(weak))) {
    return {
      valid: true, // Still valid but warn user
      message: 'Kata laluan ini terlalu biasa. Pertimbangkan menggunakan kata laluan yang lebih kuat.',
      strength: 'weak',
      warning: true
    };
  }

  // Calculate strength
  let strength = 0;
  let checks = [];

  // Length checks
  if (length >= 8) {
    strength++;
    checks.push('length');
  }
  if (length >= 12) strength++;

  // Character variety checks
  if (/[a-z]/.test(password)) {
    strength++;
    checks.push('lowercase');
  }
  if (/[A-Z]/.test(password)) {
    strength++;
    checks.push('uppercase');
  }
  if (/\d/.test(password)) {
    strength++;
    checks.push('number');
  }
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    strength++;
    checks.push('special');
  }

  // Repetition check (penalty)
  if (/(.)\1{2,}/.test(password)) {
    strength = Math.max(0, strength - 1);
  }

  // Sequential characters check (penalty)
  if (/012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(password)) {
    strength = Math.max(0, strength - 1);
  }

  // Determine strength level
  let strengthLevel = 'weak';
  if (strength >= 6) strengthLevel = 'strong';
  else if (strength >= 4) strengthLevel = 'good';
  else if (strength >= 2) strengthLevel = 'fair';

  // For registration/change password, require at least 'fair' strength
  // For login, just validate minimum requirements
  const isValid = strength >= 2 && length >= 8;

  return {
    valid: isValid,
    message: isValid
      ? strengthLevel === 'weak' || strengthLevel === 'fair'
        ? 'Kata laluan boleh diperkukuhkan lagi dengan menambah aksara khas dan nombor'
        : null
      : 'Kata laluan mestilah sekurang-kurangnya 8 aksara dan mengandungi huruf dan nombor',
    strength: strengthLevel,
    checks
  };
};

/**
 * Checks if password matches common patterns (optional, for warnings)
 */
export const checkCommonPatterns = (password) => {
  const patterns = [
    {
      pattern: /^[0-9]+$/,
      message: 'Kata laluan hanya mengandungi nombor'
    },
    {
      pattern: /^[a-zA-Z]+$/,
      message: 'Kata laluan hanya mengandungi huruf'
    },
    {
      pattern: /(.)\1{3,}/,
      message: 'Kata laluan mengandungi aksara berulang'
    }
  ];

  for (const { pattern, message } of patterns) {
    if (pattern.test(password)) {
      return { warning: true, message };
    }
  }

  return { warning: false };
};


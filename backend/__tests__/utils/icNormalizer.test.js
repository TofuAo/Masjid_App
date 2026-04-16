import { describe, it, expect } from '@jest/globals';
import { normalizeIC, isValidICFormat } from '../../utils/icNormalizer.js';

describe('icNormalizer', () => {
  describe('normalizeIC', () => {
    it('formats 12-digit IC with hyphens', () => {
      expect(normalizeIC('123456789012')).toBe('123456-78-9012');
    });
    it('returns null for empty input', () => {
      expect(normalizeIC('')).toBeNull();
      expect(normalizeIC(null)).toBeNull();
    });
    it('normalizes S-prefixed to uppercase', () => {
      expect(normalizeIC('s1234567')).toBe('S1234567');
    });
    it('returns null for invalid format', () => {
      expect(normalizeIC('T0123456')).toBeNull();
    });
  });

  describe('isValidICFormat', () => {
    it('accepts valid 12-digit IC', () => {
      expect(isValidICFormat('123456789012')).toBe(true);
      expect(isValidICFormat('123456-78-9012')).toBe(true);
    });
    it('accepts S-prefixed student ID', () => {
      expect(isValidICFormat('S1234567')).toBe(true);
      expect(isValidICFormat('s0102020512')).toBe(true);
    });
    it('rejects invalid formats', () => {
      expect(isValidICFormat('T0123456')).toBe(false);
      expect(isValidICFormat('abc')).toBe(false);
      expect(isValidICFormat('')).toBe(false);
    });
  });
});

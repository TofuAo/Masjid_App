import { describe, it, expect } from '@jest/globals';
import { safeLimit, safeOffset, countPlaceholders, validateParams } from '../../utils/safeQuery.js';

describe('safeQuery', () => {
  describe('safeLimit', () => {
    it('returns default for null/empty', () => {
      expect(safeLimit(null)).toBe(50);
      expect(safeLimit('')).toBe(50);
    });
    it('clamps to max 200', () => {
      expect(safeLimit(500)).toBe(200);
    });
    it('clamps to min 1', () => {
      expect(safeLimit(0)).toBe(1);
    });
    it('parses valid number', () => {
      expect(safeLimit('25')).toBe(25);
    });
  });

  describe('safeOffset', () => {
    it('returns default for null/empty', () => {
      expect(safeOffset(null)).toBe(0);
    });
    it('rejects negative', () => {
      expect(safeOffset(-5)).toBe(0);
    });
    it('clamps to max 10000', () => {
      expect(safeOffset(50000)).toBe(10000);
    });
  });

  describe('countPlaceholders', () => {
    it('counts ? placeholders', () => {
      expect(countPlaceholders('SELECT * FROM users WHERE id = ?')).toBe(1);
      expect(countPlaceholders('SELECT * FROM users WHERE id = ? AND name = ?')).toBe(2);
    });
    it('ignores ? inside quoted strings', () => {
      expect(countPlaceholders("SELECT * FROM t WHERE col = '?'")).toBe(0);
    });
  });

  describe('validateParams', () => {
    it('accepts valid params', () => {
      expect(validateParams([1, 'a', null])).toEqual({ valid: true });
    });
    it('rejects undefined in params', () => {
      const result = validateParams([1, undefined, 3]);
      expect(result.valid).toBe(false);
      expect(result.invalidIndex).toBe(1);
    });
    it('rejects NaN', () => {
      const result = validateParams([1, Number.NaN]);
      expect(result.valid).toBe(false);
      expect(result.invalidIndex).toBe(1);
    });
  });
});

import { pool } from '../config/database.js';

const DEFAULT_GRADE_RANGES = [
  { grade: 'A+', min: 95, max: 100 },
  { grade: 'A', min: 90, max: 94 },
  { grade: 'A-', min: 85, max: 89 },
  { grade: 'B+', min: 80, max: 84 },
  { grade: 'B', min: 75, max: 79 },
  { grade: 'B-', min: 70, max: 74 },
  { grade: 'C+', min: 65, max: 69 },
  { grade: 'C', min: 60, max: 64 },
  { grade: 'C-', min: 55, max: 59 },
  { grade: 'D', min: 50, max: 54 },
  { grade: 'F', min: 0, max: 49 }
];

const sanitizeRange = (range) => {
  if (!range || typeof range !== 'object') {
    return null;
  }

  const grade = (range.grade || '').toString().trim();
  const min = Number(range.min);
  const maxRaw = range.max === undefined || range.max === null || range.max === '' ? null : Number(range.max);

  if (!grade || Number.isNaN(min)) {
    return null;
  }

  const max = maxRaw === null || Number.isNaN(maxRaw) ? null : maxRaw;
  const normalizedMax = max === null ? null : Math.max(min, max);

  return {
    grade,
    min: Math.max(0, min),
    max: normalizedMax === null ? null : Math.min(100, normalizedMax)
  };
};

const normalizeRanges = (ranges) => {
  if (!Array.isArray(ranges)) {
    return [];
  }

  const sanitized = ranges
    .map(sanitizeRange)
    .filter((item, index, self) => {
      if (!item) return false;
      const duplicateIndex = self.findIndex((other) => other && other.grade === item.grade);
      return duplicateIndex === index;
    });

  if (!sanitized.length) {
    return [];
  }

  sanitized.sort((a, b) => {
    const maxA = a.max ?? 100;
    const maxB = b.max ?? 100;
    if (maxA === maxB) {
      return b.min - a.min;
    }
    return maxB - maxA;
  });

  return sanitized;
};

const detectRangeIssues = (ranges) => {
  const issues = [];
  if (!ranges.length) {
    issues.push('Sekurang-kurangnya satu julat gred diperlukan.');
    return issues;
  }

  const sorted = [...ranges].sort((a, b) => a.min - b.min);

  for (let i = 0; i < sorted.length; i += 1) {
    const current = sorted[i];
    if (current.max !== null && current.max < current.min) {
      issues.push(`Julat gred ${current.grade} mempunyai max lebih rendah daripada min.`);
    }

    if (i < sorted.length - 1) {
      const next = sorted[i + 1];
      const currentMax = current.max ?? 100;
      if (currentMax >= next.min) {
        issues.push(`Julat gred ${current.grade} bertindih dengan gred ${next.grade}.`);
      }
      if (currentMax + 1 < next.min) {
        issues.push(`Terdapat jurang antara markah ${currentMax} dan ${next.min} (gred ${current.grade} ke ${next.grade}).`);
      }
    }
  }

  if (sorted[0].min > 0) {
    issues.push('Julat gred tidak merangkumi markah bawah (0).');
  }

  const last = sorted[sorted.length - 1];
  if (last.max !== null && last.max < 100) {
    issues.push('Julat gred tidak merangkumi markah maksimum (100).');
  }

  return issues;
};

export const getGradeRangesFromSettings = async () => {
  try {
    const [rows] = await pool.execute(
      'SELECT setting_value FROM settings WHERE setting_key = ? LIMIT 1',
      ['grade_ranges']
    );

    if (rows.length && rows[0].setting_value) {
      const parsed = JSON.parse(rows[0].setting_value);
      const normalized = normalizeRanges(parsed);
      if (normalized.length) {
        return normalized;
      }
    }
  } catch (error) {
    console.error('Failed to load grade ranges from settings:', error);
  }

  return normalizeRanges(DEFAULT_GRADE_RANGES);
};

export const saveGradeRangesToSettings = async (ranges) => {
  const normalized = normalizeRanges(ranges);
  const issues = detectRangeIssues(normalized);

  if (issues.length) {
    const error = new Error('Invalid grade ranges');
    error.validationErrors = issues;
    throw error;
  }

  const serialized = JSON.stringify(normalized);

  await pool.execute(
    `INSERT INTO settings (setting_key, setting_value, setting_type, description)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value),
     setting_type = VALUES(setting_type),
     description = VALUES(description),
     updated_at = CURRENT_TIMESTAMP`,
    ['grade_ranges', serialized, 'json', 'Julat markah bagi pengiraan gred keputusan']
  );

  return normalized;
};

export const determineGradeForMark = (markah, ranges) => {
  const numericMark = Number(markah);
  if (Number.isNaN(numericMark)) {
    return '';
  }

  const effectiveRanges = normalizeRanges(ranges && ranges.length ? ranges : DEFAULT_GRADE_RANGES);

  for (let i = 0; i < effectiveRanges.length; i += 1) {
    const range = effectiveRanges[i];
    const min = Number(range.min);
    const max = range.max === null || range.max === undefined ? 100 : Number(range.max);
    if (Number.isNaN(min) || Number.isNaN(max)) {
      continue;
    }

    if (numericMark >= min && numericMark <= max) {
      return range.grade;
    }
  }

  return '';
};

export const validateGradeRangesPayload = (ranges) => {
  const normalized = normalizeRanges(ranges);
  const issues = detectRangeIssues(normalized);
  return {
    ranges: normalized,
    errors: issues
  };
};

export const DEFAULT_GRADE_RANGES_CONST = Object.freeze([...DEFAULT_GRADE_RANGES]);



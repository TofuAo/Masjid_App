export const DEFAULT_GRADE_RANGES = Object.freeze([
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
]);

export function cloneDefaultGradeRanges() {
  return DEFAULT_GRADE_RANGES.map((range) => ({
    grade: range.grade,
    min: range.min,
    max: range.max === undefined ? null : range.max
  }));
}

export function normalizeGradeRanges(ranges) {
  if (!Array.isArray(ranges) || ranges.length === 0) {
    return cloneDefaultGradeRanges();
  }

  const sanitized = ranges
    .map((range) => {
      const grade = (range?.grade || '').toString().trim();
      const minValue = Number(range?.min);
      const rawMax =
        range?.max === null || range?.max === undefined || range?.max === ''
          ? null
          : Number(range.max);

      if (!grade || Number.isNaN(minValue)) {
        return null;
      }

      const clampedMin = Math.min(100, Math.max(0, minValue));
      const max =
        rawMax === null || Number.isNaN(rawMax)
          ? null
          : Math.min(100, Math.max(clampedMin, rawMax));

      return {
        grade,
        min: clampedMin,
        max
      };
    })
    .filter(Boolean);

  if (sanitized.length === 0) {
    return cloneDefaultGradeRanges();
  }

  sanitized.sort((a, b) => {
    const maxA = a.max ?? 100;
    const maxB = b.max ?? 100;

    if (maxA === maxB) {
      return (b.min ?? 0) - (a.min ?? 0);
    }

    return maxB - maxA;
  });

  return sanitized;
}

export function extractGradeOptions(ranges) {
  if (!Array.isArray(ranges)) {
    return [];
  }

  const unique = new Set();
  const options = [];

  ranges.forEach((range) => {
    if (range?.grade && !unique.has(range.grade)) {
      unique.add(range.grade);
      options.push(range.grade);
    }
  });

  return options;
}

export function determineGradeFromRanges(mark, ranges) {
  const numericMark = Number(mark);
  if (Number.isNaN(numericMark)) {
    return '';
  }

  const effectiveRanges = normalizeGradeRanges(ranges);

  for (let i = 0; i < effectiveRanges.length; i += 1) {
    const range = effectiveRanges[i];
    const min = Number(range.min ?? 0);
    const max =
      range.max === null || range.max === undefined || range.max === ''
        ? 100
        : Number(range.max);

    if (Number.isNaN(min) || Number.isNaN(max)) {
      continue;
    }

    if (numericMark >= min && numericMark <= max) {
      return range.grade || '';
    }
  }

  return '';
}

const PASSING_GRADE_LIST = [
  'A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D'
];

export function isPassingGrade(grade) {
  return PASSING_GRADE_LIST.includes(grade);
}

export function getStatusFromGrade(grade) {
  if (!grade) {
    return 'gagal';
  }

  return isPassingGrade(grade) ? 'lulus' : 'gagal';
}


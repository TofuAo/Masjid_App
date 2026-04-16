/**
 * DTO / validation shape for Rollback (POST /api/admin/classes/rollback).
 */
export const rollbackDtoSchema = {
  student_ids: { type: 'array', minItems: 1, items: { type: 'string' } },
  class_id: { type: 'number', optional: true },
  exam_session_id: { type: 'number', optional: true }
};

/**
 * Normalize and validate rollback payload.
 * Returns { valid: boolean, errors: string[] }.
 */
export function validateRollbackDto(body) {
  const errors = [];
  if (!Array.isArray(body.student_ids) || body.student_ids.length === 0) {
    errors.push('student_ids must be a non-empty array');
  }
  return { valid: errors.length === 0, errors };
}

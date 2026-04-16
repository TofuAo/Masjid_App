/**
 * DTO / validation shape for Change Class (POST /api/admin/classes/change).
 * Use with express-validator or manual validation.
 */
export const changeClassDtoSchema = {
  student_ids: { type: 'array', minItems: 1, items: { type: 'string' } },
  from_class_id: { type: 'number', required: true },
  to_class_id: { type: 'number', required: true },
  assignment_type: { type: 'string', enum: ['permanent', 'exam'] },
  exam_session_id: { type: 'number', optional: true },
  start_date: { type: 'string', format: 'date', optional: true },
  end_date: { type: 'string', format: 'date', optional: true }
};

/**
 * Normalize and validate payload (plain object check).
 * Returns { valid: boolean, errors: string[] }.
 */
export function validateChangeClassDto(body) {
  const errors = [];
  if (!Array.isArray(body.student_ids) || body.student_ids.length === 0) {
    errors.push('student_ids must be a non-empty array');
  }
  if (body.from_class_id == null) errors.push('from_class_id is required');
  if (body.to_class_id == null) errors.push('to_class_id is required');
  const type = body.assignment_type === 'exam' ? 'exam' : 'permanent';
  if (type === 'exam' && !body.end_date) errors.push('end_date is required for exam assignment');
  return { valid: errors.length === 0, errors };
}

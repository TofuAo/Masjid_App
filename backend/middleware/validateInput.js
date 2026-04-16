/**
 * Input validation and type coercion middleware.
 * Block execution if validation fails – no request reaches DB with invalid input.
 *
 * Use for: req.query, req.body, req.params.
 * Invalid input → 400 response, no SQL execution.
 */

const MONTH_NAMES = [
  'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
  'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
];

/**
 * Coerce and validate query/body schema.
 * schema: { fieldName: { type: 'string'|'int'|'month'|'date', required?: boolean, min?: number, max?: number } }
 * source: 'query' | 'body' | 'params'
 */
export function validate(schema, source = 'query') {
  return (req, res, next) => {
    const data = source === 'query' ? req.query : source === 'body' ? req.body : req.params;
    const errors = [];
    const coerced = {};

    for (const [key, rules] of Object.entries(schema)) {
      const raw = data?.[key];
      const required = rules.required !== false && (rules.required === true || (raw !== undefined && raw !== null && raw !== ''));

      if (raw === undefined || raw === null || raw === '') {
        if (rules.required) {
          errors.push({ field: key, message: `${key} is required` });
          continue;
        }
        if (rules.default !== undefined) {
          coerced[key] = rules.default;
        }
        continue;
      }

      switch (rules.type) {
        case 'string': {
          const s = String(raw).trim();
          if (rules.maxLength && s.length > rules.maxLength) {
            errors.push({ field: key, message: `${key} must be at most ${rules.maxLength} characters` });
          } else {
            coerced[key] = s;
          }
          break;
        }
        case 'int': {
          const n = parseInt(raw, 10);
          if (!Number.isInteger(n) || Number.isNaN(n)) {
            errors.push({ field: key, message: `${key} must be a valid integer` });
            break;
          }
          if (rules.min !== undefined && n < rules.min) {
            errors.push({ field: key, message: `${key} must be at least ${rules.min}` });
            break;
          }
          if (rules.max !== undefined && n > rules.max) {
            errors.push({ field: key, message: `${key} must be at most ${rules.max}` });
            break;
          }
          coerced[key] = n;
          break;
        }
        case 'month': {
          const s = String(raw).trim();
          if (MONTH_NAMES.includes(s)) {
            coerced[key] = s;
          } else {
            errors.push({ field: key, message: `${key} must be a valid month name (e.g. Januari, Februari)` });
          }
          break;
        }
        case 'date': {
          const d = new Date(raw);
          if (Number.isNaN(d.getTime())) {
            errors.push({ field: key, message: `${key} must be a valid date` });
          } else {
            coerced[key] = raw;
          }
          break;
        }
        default:
          coerced[key] = raw;
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    req.validated = req.validated || {};
    req.validated[source] = coerced;
    next();
  };
}

/**
 * IB history query validation: bulan (optional month name), tahun (optional int), limit (optional int).
 */
export const ibHistoryQuerySchema = {
  bulan: { type: 'month', required: false },
  tahun: { type: 'int', required: false, min: 2000, max: 2100 },
  limit: { type: 'int', required: false, min: 10, max: 200, default: 50 }
};

/** Export history allows higher limit default. */
export const ibExportHistoryQuerySchema = {
  bulan: { type: 'month', required: false },
  tahun: { type: 'int', required: false, min: 2000, max: 2100 },
  limit: { type: 'int', required: false, min: 50, max: 2000, default: 500 }
};

/**
 * Middleware: validate IB history GET query (bulan, tahun, limit).
 */
export const validateIbHistoryQuery = validate(ibHistoryQuerySchema, 'query');
export const validateIbExportHistoryQuery = validate(ibExportHistoryQuerySchema, 'query');

export default { validate, ibHistoryQuerySchema, validateIbHistoryQuery, validateIbExportHistoryQuery };

/**
 * Class Management Service — core logic for admin class change / rollback.
 * Used by admin class controller (Express). Student IDs are ICs (user_ic).
 */
import { pool } from '../config/database.js';
import { getSafePagination } from '../utils/pagination.js';

export async function getClasses(params = {}) {
  const { search, level, page = 1, limit = 500 } = params;
  const defaultLimit = limit ? parseInt(limit) : 500;
  const { limit: safeLimit, offset } = getSafePagination(page, defaultLimit, 1, defaultLimit);

  let query = `
    SELECT c.id, c.nama_kelas, c.level, c.sessions, c.yuran, c.guru_ic, c.kapasiti, c.status,
           u.nama as guru_nama,
           COUNT(DISTINCT s.user_ic) as student_count
    FROM classes c
    LEFT JOIN users u ON c.guru_ic = u.ic
    LEFT JOIN students s ON c.id = s.kelas_id
    WHERE 1=1
  `;
  const queryParams = [];
  if (search) {
    query += ` AND (c.nama_kelas LIKE ? OR u.nama LIKE ?)`;
    const term = `%${search}%`;
    queryParams.push(term, term);
  }
  if (level) {
    query += ` AND c.level = ?`;
    queryParams.push(level);
  }
  query += ` GROUP BY c.id, c.nama_kelas, c.level, c.sessions, c.yuran, c.guru_ic, c.kapasiti, c.status, u.nama ORDER BY c.nama_kelas LIMIT ${safeLimit} OFFSET ${offset}`;

  const [classes] = await pool.execute(query, queryParams);

  let countQuery = 'SELECT COUNT(DISTINCT c.id) as total FROM classes c LEFT JOIN users u ON c.guru_ic = u.ic WHERE 1=1';
  const countParams = [];
  if (search) {
    countQuery += ' AND (c.nama_kelas LIKE ? OR u.nama LIKE ?)';
    countParams.push(`%${search}%`, `%${search}%`);
  }
  if (level) {
    countQuery += ' AND c.level = ?';
    countParams.push(level);
  }
  const [countResult] = await pool.execute(countQuery, countParams);
  const total = countResult[0]?.total ?? classes.length;

  return {
    data: classes,
    pagination: { page: parseInt(page) || 1, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) || 1 }
  };
}

export async function getStudentsByClass(classId) {
  const id = parseInt(classId, 10);
  if (Number.isNaN(id) || id < 1) return null;

  const [classes] = await pool.execute('SELECT id, nama_kelas, level FROM classes WHERE id = ?', [id]);
  if (classes.length === 0) return null;

  const [students] = await pool.execute(
    `SELECT u.ic as id, u.nama as name, u.status,
            s.kelas_id, s.exam_class_id, s.exam_class_end_date,
            CASE
              WHEN s.exam_class_id IS NOT NULL AND (s.exam_class_end_date IS NULL OR s.exam_class_end_date >= CURDATE()) THEN 'exam'
              ELSE 'permanent'
            END as current_assignment_type
     FROM users u
     JOIN students s ON u.ic = s.user_ic
     WHERE s.kelas_id = ?
     ORDER BY u.nama`,
    [id]
  );

  return {
    class: classes[0],
    data: students.map((s) => ({
      id: s.id,
      name: s.name,
      status: s.status,
      current_assignment_type: s.current_assignment_type,
      kelas_id: s.kelas_id,
      exam_class_id: s.exam_class_id,
      exam_class_end_date: s.exam_class_end_date
    }))
  };
}

export async function getExamSessions() {
  try {
    const [rows] = await pool.execute(
      `SELECT id, name, start_date, end_date, status FROM exam_sessions ORDER BY start_date DESC LIMIT 100`
    );
    return rows || [];
  } catch (err) {
    console.error('getExamSessions error:', err);
    return [];
  }
}

const INT_MAX = 2147483647;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function parseDate(val) {
  if (val == null || val === '') return null;
  const s = String(val).trim();
  return DATE_REGEX.test(s) ? s : null;
}

/**
 * Change class (bulk). DTO: { student_ids, from_class_id, to_class_id, assignment_type, exam_session_id?, start_date?, end_date? }
 */
export async function changeClass(dto, adminIc) {
  const {
    student_ids: studentIdsRaw,
    from_class_id: fromClassIdRaw,
    to_class_id: toClassIdRaw,
    assignment_type: assignmentType,
    exam_session_id: examSessionIdRaw,
    start_date: startDateRaw,
    end_date: endDateRaw
  } = dto;

  if (!Array.isArray(studentIdsRaw) || studentIdsRaw.length === 0) {
    throw Object.assign(new Error('student_ids must be a non-empty array'), { statusCode: 400 });
  }
  const studentIds = studentIdsRaw.filter((id) => id != null && (typeof id === 'string' || typeof id === 'number'));
  if (studentIds.length === 0) {
    throw Object.assign(new Error('student_ids must contain at least one valid identifier (IC)'), { statusCode: 400 });
  }

  const fromClassId = parseInt(fromClassIdRaw, 10);
  const toClassId = parseInt(toClassIdRaw, 10);
  if (Number.isNaN(fromClassId) || fromClassId < 1 || fromClassId > INT_MAX) {
    throw Object.assign(new Error('from_class_id must be a positive integer'), { statusCode: 400 });
  }
  if (Number.isNaN(toClassId) || toClassId < 1 || toClassId > INT_MAX) {
    throw Object.assign(new Error('to_class_id must be a positive integer'), { statusCode: 400 });
  }
  const fromId = fromClassId | 0;
  const toId = toClassId | 0;
  if (fromId !== fromClassId || toId !== toClassId) {
    throw Object.assign(new Error('from_class_id and to_class_id must be valid integers'), { statusCode: 400 });
  }

  // Ensure both classes exist before any update
  const [classCheck] = await pool.execute(
    'SELECT id FROM classes WHERE id IN (?, ?)',
    [fromId, toId]
  );
  const foundIds = new Set((classCheck || []).map((r) => r.id));
  if (!foundIds.has(fromId)) {
    throw Object.assign(new Error('Source class not found'), { statusCode: 400 });
  }
  if (!foundIds.has(toId)) {
    throw Object.assign(new Error('Target class not found'), { statusCode: 400 });
  }

  const type = assignmentType === 'exam' ? 'exam' : 'permanent';
  const normalizedIcs = studentIds.map((id) => String(id).replace(/[-\s]/g, ''));
  const inPh = normalizedIcs.map(() => '?').join(',');
  const startVal = parseDate(startDateRaw) || (type === 'exam' ? parseDate(endDateRaw) : null);
  const endVal = type === 'exam' ? parseDate(endDateRaw) : null;
  const examSessionId = examSessionIdRaw != null && examSessionIdRaw !== '' ? parseInt(examSessionIdRaw, 10) : null;
  const examSessionIdSafe = Number.isNaN(examSessionId) || examSessionId < 1 ? null : (examSessionId | 0);

  const [studentsInClass] = await pool.execute(
    `SELECT user_ic FROM students WHERE REPLACE(REPLACE(user_ic, "-", ""), " ", "") IN (${inPh}) AND kelas_id = ?`,
    [...normalizedIcs, fromId]
  );
  const foundIcs = (studentsInClass || []).map((r) => r.user_ic);
  const normalizedFound = new Set(foundIcs.map((ic) => String(ic).replace(/[-\s]/g, '')));
  const missing = studentIds.filter((id) => !normalizedFound.has(String(id).replace(/[-\s]/g, '')));
  if (missing.length > 0) {
    throw Object.assign(new Error('Some students are not in the source class'), { missing, statusCode: 400 });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let updateResult;
    if (type === 'permanent') {
      // Parameter order: SET kelas_id = ?, then IN (?,...), then AND kelas_id = ?
      updateResult = await conn.execute(
        `UPDATE students SET kelas_id = ?, exam_class_id = NULL, exam_class_end_date = NULL
         WHERE REPLACE(REPLACE(user_ic, "-", ""), " ", "") IN (${inPh}) AND kelas_id = ?`,
        [toId, ...normalizedIcs, fromId]
      );
    } else {
      updateResult = await conn.execute(
        `UPDATE students SET exam_class_id = ?, exam_class_end_date = ?
         WHERE REPLACE(REPLACE(user_ic, "-", ""), " ", "") IN (${inPh}) AND kelas_id = ?`,
        [toId, endVal, ...normalizedIcs, fromId]
      );
    }
    const affectedRows = updateResult[0]?.affectedRows ?? 0;
    if (affectedRows === 0) {
      throw new Error(`UPDATE students matched 0 rows; expected ${foundIcs.length}. Check IC format and source class.`);
    }
    if (affectedRows !== foundIcs.length) {
      console.warn(`changeClass: expected ${foundIcs.length} rows updated, got ${affectedRows}`);
    }

    for (const studentIc of foundIcs) {
      await conn.execute(
        `INSERT INTO class_assignments (student_ic, class_id, assignment_type, exam_session_id, start_date, end_date, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [studentIc, toId, type, examSessionIdSafe, startVal, endVal, 1]
      );
    }

    await conn.execute(
      `INSERT INTO class_change_log (admin_ic, student_ic, from_class_id, to_class_id, assignment_type, end_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [adminIc, foundIcs[0], fromId, toId, type, endVal]
    );

    await conn.execute(
      `INSERT INTO admin_logs (admin_ic, action, details) VALUES (?, ?, ?)`,
      [
        adminIc,
        'CLASS_CHANGE',
        JSON.stringify({
          students: foundIcs,
          from_class_id: fromId,
          to_class_id: toId,
          assignment_type: type,
          exam_session_id: examSessionIdSafe,
          start_date: startVal,
          end_date: endVal
        })
      ]
    );

    await conn.commit();
    return { updated: foundIcs.length, type };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

/**
 * Rollback exam assignment. Body: { student_ids, class_id?, exam_session_id? }
 */
export async function rollbackClass(body, adminIc) {
  const { student_ids: studentIdsRaw, class_id: targetClassIdRaw, exam_session_id: examSessionIdRaw } = body;
  if (!Array.isArray(studentIdsRaw) || studentIdsRaw.length === 0) {
    throw Object.assign(new Error('student_ids must be a non-empty array'), { statusCode: 400 });
  }
  const studentIds = studentIdsRaw.filter((id) => id != null && (typeof id === 'string' || typeof id === 'number'));
  if (studentIds.length === 0) {
    throw Object.assign(new Error('student_ids must contain at least one valid identifier (IC)'), { statusCode: 400 });
  }

  const normalizedIcs = studentIds.map((id) => String(id).replace(/[-\s]/g, ''));
  const inPh = normalizedIcs.map(() => '?').join(',');

  let targetClassId = null;
  if (targetClassIdRaw != null && targetClassIdRaw !== '') {
    const parsed = parseInt(targetClassIdRaw, 10);
    if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= INT_MAX) {
      targetClassId = parsed | 0;
    }
  }
  const examSessionId = examSessionIdRaw != null && examSessionIdRaw !== '' ? parseInt(examSessionIdRaw, 10) : null;
  const examSessionIdSafe = Number.isNaN(examSessionId) || examSessionId < 1 ? null : (examSessionId | 0);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    if (targetClassId != null) {
      await conn.execute(
        `UPDATE students SET kelas_id = ?, exam_class_id = NULL, exam_class_end_date = NULL
         WHERE REPLACE(REPLACE(user_ic, "-", ""), " ", "") IN (${inPh})`,
        [...normalizedIcs, targetClassId]
      );
    } else {
      await conn.execute(
        `UPDATE students SET exam_class_id = NULL, exam_class_end_date = NULL
         WHERE REPLACE(REPLACE(user_ic, "-", ""), " ", "") IN (${inPh})`,
        normalizedIcs
      );
    }
    let rollbackQuery = `UPDATE class_assignments SET is_active = 0 WHERE REPLACE(REPLACE(student_ic, "-", ""), " ", "") IN (${inPh}) AND is_active = 1`;
    const rollbackParams = [...normalizedIcs];
    if (examSessionIdSafe != null) {
      rollbackQuery += ' AND exam_session_id = ?';
      rollbackParams.push(examSessionIdSafe);
    }
    await conn.execute(rollbackQuery, rollbackParams);
    await conn.execute(
      `INSERT INTO admin_logs (admin_ic, action, details) VALUES (?, ?, ?)`,
      [adminIc, 'CLASS_ROLLBACK', JSON.stringify({ student_ids: studentIds, class_id: targetClassId, exam_session_id: examSessionIdSafe })]
    );
    await conn.commit();
    return { updated: studentIds.length };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

export async function getStudentHistory(studentId) {
  const normalizedIc = String(studentId || '').replace(/[-\s]/g, '');
  if (!normalizedIc) return null;

  const [logRows] = await pool.execute(
    `SELECT id, admin_ic, student_ic, from_class_id, to_class_id, assignment_type, end_date, created_at
     FROM class_change_log
     WHERE REPLACE(REPLACE(student_ic, "-", ""), " ", "") = ?
     ORDER BY created_at DESC LIMIT 100`,
    [normalizedIc]
  );

  const [assignRows] = await pool.execute(
    `SELECT ca.id, ca.student_ic, ca.class_id, ca.assignment_type, ca.exam_session_id, ca.start_date, ca.end_date, ca.is_active, ca.created_at, c.nama_kelas
     FROM class_assignments ca
     LEFT JOIN classes c ON ca.class_id = c.id
     WHERE REPLACE(REPLACE(ca.student_ic, "-", ""), " ", "") = ?
     ORDER BY ca.created_at DESC LIMIT 100`,
    [normalizedIc]
  );

  return { class_change_log: logRows, class_assignments: assignRows };
}

/**
 * List class change history for Carian Transfer tab
 */
export async function getChangeHistory(params = {}) {
  const { search, limit = 100 } = params;
  const limitVal = Math.min(parseInt(limit, 10) || 100, 500);
  let query;
  let queryParams;
  if (search && String(search).trim()) {
    const term = `%${String(search).trim()}%`;
    query = `
      SELECT ccl.id, ccl.student_ic, ccl.from_class_id, ccl.to_class_id, ccl.assignment_type, ccl.created_at,
        u.nama as student_name,
        fc.nama_kelas as from_class,
        tc.nama_kelas as to_class
      FROM class_change_log ccl
      LEFT JOIN users u ON u.ic = ccl.student_ic
      LEFT JOIN classes fc ON fc.id = ccl.from_class_id
      LEFT JOIN classes tc ON tc.id = ccl.to_class_id
      WHERE u.nama LIKE ? OR ccl.student_ic LIKE ? OR fc.nama_kelas LIKE ? OR tc.nama_kelas LIKE ?
      ORDER BY ccl.created_at DESC
      LIMIT ?
    `;
    queryParams = [term, term, term, term, limitVal];
  } else {
    query = `
      SELECT ccl.id, ccl.student_ic, ccl.from_class_id, ccl.to_class_id, ccl.assignment_type, ccl.created_at,
        u.nama as student_name,
        fc.nama_kelas as from_class,
        tc.nama_kelas as to_class
      FROM class_change_log ccl
      LEFT JOIN users u ON u.ic = ccl.student_ic
      LEFT JOIN classes fc ON fc.id = ccl.from_class_id
      LEFT JOIN classes tc ON tc.id = ccl.to_class_id
      ORDER BY ccl.created_at DESC
      LIMIT ?
    `;
    queryParams = [limitVal];
  }
  const [rows] = await pool.execute(query, queryParams);
  return rows.map((r) => ({
    id: r.id,
    student_ic: r.student_ic,
    student_name: r.student_name,
    from_class: r.from_class,
    to_class: r.to_class,
    assignment_type: r.assignment_type,
    created_at: r.created_at,
  }));
}

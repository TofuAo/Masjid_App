import { pool } from '../config/database.js';
import { validationResult } from 'express-validator';
import { studentCache } from '../utils/studentCache.js';
import {
  createStudentRecord,
  updateStudentRecord,
  deleteStudentRecord
} from '../services/studentService.js';
import { getSafePagination } from '../utils/pagination.js';
import { normalizePhone } from '../utils/phoneNormalizer.js';

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANT: In this codebase, users are identified by `telefon` (phone/IC),
// NOT by a separate `ic` column. The schema uses:
//   users.telefon  → primary identifier (also the FK in students.user_telefon)
//   attendance.student_telefon → FK to users.telefon
//   results.student_telefon    → FK to users.telefon
//   fees.student_ic            → FK to users.telefon  (misnamed column)
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// MODIFICATION 1 — GET /api/students/me
// Student fetches their own full profile.
// telefon is read from req.user.telefon (JWT payload) — never from params.
// ─────────────────────────────────────────────────────────────────────────────
export const getSelf = async (req, res) => {
  try {
    const telefon = req.user?.telefon;
    if (!telefon) {
      return res.status(401).json({ success: false, message: 'Tidak dapat mengesahkan identiti pengguna.' });
    }

    // ── 1. Base profile + class info ──────────────────────────
    const [rows] = await pool.execute(`
      SELECT
        u.telefon AS ic,
        u.nama,
        u.email,
        u.umur,
        u.alamat,
        u.status,
        u.created_at,
        s.kelas_id,
        s.tarikh_daftar,
        c.nama_kelas,
        c.level,
        c.jadual,
        c.yuran   AS yuran_kelas,
        t.nama    AS guru_nama,
        t.telefon AS guru_telefon
      FROM users u
      INNER JOIN students s ON u.telefon = s.user_telefon
      LEFT JOIN  classes  c ON s.kelas_id = c.id
      LEFT JOIN  users    t ON c.guru_telefon = t.telefon
      WHERE u.telefon = ?
        AND u.role = 'student'
    `, [telefon]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Profil pelajar tidak dijumpai.' });
    }

    const student = rows[0];

    // ── 2. Attendance summary (last 90 days) ──────────────────
    // attendance.student_telefon FK → users.telefon
    const [attendance] = await pool.execute(`
      SELECT
        status,
        COUNT(*) AS count
      FROM attendance
      WHERE student_telefon = ?
        AND tarikh >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
      GROUP BY status
    `, [telefon]);

    // ── 3. Outstanding fees ───────────────────────────────────
    // fees.student_ic FK → users.telefon  (column misnamed in schema)
    const [fees] = await pool.execute(`
      SELECT
        id,
        jumlah,
        bulan,
        tahun,
        status,
        tarikh,
        cara_bayar,
        no_resit
      FROM fees
      WHERE student_ic = ?
        AND status NOT IN ('terbayar', 'Bayar')
      ORDER BY tahun DESC, tarikh DESC
      LIMIT 10
    `, [telefon]);

    // ── 4. Latest exam results (last 5) ───────────────────────
    // results.student_telefon FK → users.telefon
    const [results] = await pool.execute(`
      SELECT
        r.id,
        e.subject,
        r.markah,
        r.gred,
        r.catatan,
        e.tarikh_exam
      FROM results r
      JOIN exams e ON e.id = r.exam_id
      WHERE r.student_telefon = ?
      ORDER BY e.tarikh_exam DESC
      LIMIT 5
    `, [telefon]);

    return res.json({
      success: true,
      data: {
        ...student,
        IC: student.ic, // uppercase alias for frontend compatibility
        nama_kelas: student.nama_kelas || 'Tiada Kelas',
        attendance_summary: attendance,
        outstanding_fees:   fees,
        recent_results:     results,
      }
    });

  } catch (error) {
    console.error('[getSelf] error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MODIFICATION 2 — GET /api/students  (updated getAllStudents)
// Added optional ?status query param:
//   • omitted / ''  → exclude 'tamat' (default — original behaviour preserved)
//   • 'tamat'        → graduated/retired students only
//   • 'all'          → all statuses
//   • any other valid status → filter to that exact status
// ─────────────────────────────────────────────────────────────────────────────
export const getAllStudents = async (req, res) => {
  try {
    const { search, kelas_id, status, page = 1, limit } = req.query;
    const defaultLimit = limit ? parseInt(limit) : 1000;

    // Include status in cache key now that it's a filter dimension
    const cacheKey = `students:${req.user?.role || 'guest'}:${search}:${kelas_id}:${status || ''}:${page}:${limit}`;

    // Skip cache for teachers (they see filtered results)
    if (!req.user || req.user.role !== 'teacher') {
      if (studentCache.has(cacheKey)) {
        console.log("Data retrieved from cache");
        return res.json(studentCache.get(cacheKey));
      }
    }

    const VALID_STATUSES = ['aktif', 'tidak_aktif', 'cuti', 'pending', 'tamat'];

    // Validate status param if provided
    if (status && status !== 'all' && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status tidak sah. Nilai yang dibenarkan: ${VALID_STATUSES.join(', ')}, all`
      });
    }

    let query = `
      SELECT
        u.telefon AS ic,
        u.nama,
        u.email,
        u.telefon,
        u.umur,
        u.alamat,
        u.status,
        s.kelas_id,
        s.tarikh_daftar,
        c.nama_kelas,
        c.level,
        t.nama    AS guru_nama,
        t.telefon AS guru_telefon
      FROM users u
      INNER JOIN students s ON u.telefon = s.user_telefon
      LEFT JOIN  classes  c ON s.kelas_id = c.id
      LEFT JOIN  users    t ON c.guru_telefon = t.telefon
      WHERE u.role = 'student'
    `;

    const queryParams = [];

    // ── MODIFICATION 2: Status filter ─────────────────────────
    if (!status || status === '') {
      // Default: hide graduated students (preserve original behaviour)
      query += ` AND u.status != 'tamat'`;
    } else if (status === 'all') {
      // No status restriction
    } else {
      // Exact status match (includes 'tamat' when explicitly requested)
      query += ` AND u.status = ?`;
      queryParams.push(status);
    }

    // Teacher restriction — only their class students
    if (req.user && req.user.role === 'teacher') {
      query += ` AND c.guru_telefon = ?`;
      queryParams.push(req.user.telefon);
    }

    if (search) {
      query += ` AND (u.nama LIKE ? OR u.telefon LIKE ?)`;
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm);
    }

    if (kelas_id) {
      query += ` AND s.kelas_id = ?`;
      queryParams.push(kelas_id);
    }

    const { limit: safeLimit, offset } = getSafePagination(page, defaultLimit, 1, defaultLimit);
    query += ` ORDER BY u.created_at DESC LIMIT ${safeLimit} OFFSET ${offset}`;

    const [students] = await pool.execute(query, queryParams);

    const formattedStudents = students.map(student => ({
      ...student,
      IC: student.telefon, // uppercase alias for frontend compatibility
      kelas_id: student.kelas_id || null,
      nama_kelas: student.nama_kelas || 'Tiada Kelas',
      umur: student.umur || null
    }));

    // Count query — mirrors the main query conditions
    let countQuery = `
      SELECT COUNT(*) AS total
      FROM users u
      INNER JOIN students s ON u.telefon = s.user_telefon
      LEFT JOIN  classes  c ON s.kelas_id = c.id
      WHERE u.role = 'student'
    `;
    const countParams = [];

    // Mirror status filter
    if (!status || status === '') {
      countQuery += ` AND u.status != 'tamat'`;
    } else if (status === 'all') {
      // No restriction
    } else {
      countQuery += ` AND u.status = ?`;
      countParams.push(status);
    }

    if (req.user && req.user.role === 'teacher') {
      countQuery += ` AND c.guru_telefon = ?`;
      countParams.push(req.user.telefon);
    }

    if (search) {
      countQuery += ` AND (u.nama LIKE ? OR u.telefon LIKE ?)`;
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm);
    }

    if (kelas_id) {
      countQuery += ` AND s.kelas_id = ?`;
      countParams.push(kelas_id);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    const response = {
      success: true,
      data: formattedStudents,
      pagination: {
        page: parseInt(page),
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit)
      }
    };

    studentCache.set(cacheKey, response);
    res.json(response);

  } catch (error) {
    console.error("Get students error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Existing functions — unchanged
// ─────────────────────────────────────────────────────────────────────────────

export const getStudentById = async (req, res) => {
  try {
    const { ic } = req.params;
    const cleanedPhone = normalizePhone(ic);
    const cacheKey = `student:${cleanedPhone}`;

    if (studentCache.has(cacheKey)) {
      studentCache.delete(cacheKey);
    }

    const [students] = await pool.execute(`
      SELECT
        u.telefon AS ic,
        u.nama,
        u.email,
        u.status,
        u.umur,
        u.alamat,
        u.telefon,
        s.kelas_id,
        s.tarikh_daftar,
        c.nama_kelas,
        c.level,
        t.nama    AS guru_nama,
        t.telefon AS guru_telefon
      FROM users u
      JOIN students s ON u.telefon = s.user_telefon
      LEFT JOIN classes c ON s.kelas_id = c.id
      LEFT JOIN users   t ON c.guru_telefon = t.telefon
      WHERE u.telefon = ? AND u.role = 'student'
    `, [cleanedPhone]);

    if (students.length === 0) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const studentData = students[0];

    const response = { success: true, data: studentData };
    studentCache.set(cacheKey, response);
    res.json(response);
  } catch (error) {
    console.error("Get student error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const createStudent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errs = errors.array();
      const first = errs[0] || {};
      const friendly = first.msg ? `${first.param ? `${first.param}: ` : ''}${first.msg}` : 'Validation failed';
      return res.status(400).json({ success: false, message: friendly, errors: errs });
    }

    try {
      const result = await createStudentRecord(req.body, { actorPhone: req.user.telefon });
      res.status(201).json({ success: true, message: 'Student created successfully', data: result.student });
    } catch (error) {
      console.error('Create student error (inner):', error);
      if (error.status === 400 || error.status === 404) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: error.message || 'Internal server error', stack: error.stack });
    }
  } catch (error) {
    console.error('Create student error (outer):', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error', stack: error.stack });
  }
};

export const updateStudent = async (req, res) => {
  try {
    if (req.body.password !== undefined && req.body.password !== null && req.body.password !== '') {
      const passwordStr = String(req.body.password).trim();
      if (passwordStr.length > 0 && passwordStr.length < 5) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: [{ type: 'field', msg: 'Password must be at least 5 chars long', path: 'password', location: 'body' }]
        });
      }
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    try {
      const result = await updateStudentRecord(req.params.telefon, req.body, { actorPhone: req.user.telefon });
      res.json({ success: true, message: 'Student updated successfully', data: result.student });
    } catch (error) {
      console.error('Update student error:', error);
      if (error.status === 400 || error.status === 404) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    try {
      const result = await deleteStudentRecord(req.params.telefon, { actorPhone: req.user.telefon });
      res.json({
        success: true,
        message: 'Student deleted successfully',
        undoToken: result.undoToken,
        undoExpiresAt: result.undoExpiresAt
      });
    } catch (error) {
      console.error('Delete student error:', error);
      if (error.status === 400 || error.status === 404) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getStudentStats = async (req, res) => {
  try {
    const cacheKey = "studentStats";
    if (studentCache.has(cacheKey)) {
      console.log("Data retrieved from cache");
      return res.json(studentCache.get(cacheKey));
    }

    const [stats] = await pool.execute(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) AS active,
        0 AS inactive,
        0 AS on_leave,
        SUM(CASE WHEN DATE(u.created_at) >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH) THEN 1 ELSE 0 END) AS new_this_month
      FROM users u
      INNER JOIN students s ON u.telefon = s.user_telefon
      WHERE u.role = 'student'
        AND u.status != 'tamat'
    `);

    const response = {
      success: true,
      data: {
        total: stats[0].total || 0,
        active: stats[0].active || 0,
        inactive: 0,
        on_leave: 0,
        new_this_month: stats[0].new_this_month || 0
      }
    };

    studentCache.set(cacheKey, response);
    res.json(response);
  } catch (error) {
    console.error('Get student stats error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

import { pool } from '../config/database.js';
import { fetchUserRoles } from '../services/userRoleService.js';
import { getSafePagination } from '../utils/pagination.js';

const VALID_ROLES = ['admin', 'teacher', 'student', 'pic', 'staff', 'ib'];

const USER_BASE_SELECT = `
  SELECT 
    u.ic,
    u.nama,
    u.email,
    u.telefon,
    u.umur,
    u.alamat,
    u.role as primary_role,
    u.status,
    u.created_at,
    u.updated_at,
    MAX(s.kelas_id) as kelas_id,
    MAX(c.nama_kelas) as nama_kelas,
    MAX(t.kepakaran) as kepakaran,
    COUNT(DISTINCT cls.id) as total_classes,
    MAX(CASE WHEN s.user_ic IS NOT NULL THEN 1 ELSE 0 END) as is_student,
    MAX(CASE WHEN t.user_ic IS NOT NULL THEN 1 ELSE 0 END) as is_teacher,
    MAX(CASE WHEN u.role = 'admin' OR EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE REPLACE(REPLACE(ur.user_ic, '-', ''), ' ', '') = REPLACE(REPLACE(u.ic, '-', ''), ' ', '') 
        AND ur.role = 'admin'
    ) THEN 1 ELSE 0 END) as is_admin,
    MAX(CASE WHEN u.role = 'pic' OR EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE REPLACE(REPLACE(ur.user_ic, '-', ''), ' ', '') = REPLACE(REPLACE(u.ic, '-', ''), ' ', '') 
        AND ur.role = 'pic'
    ) THEN 1 ELSE 0 END) as is_pic,
    MAX(CASE WHEN u.role = 'staff' OR EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE REPLACE(REPLACE(ur.user_ic, '-', ''), ' ', '') = REPLACE(REPLACE(u.ic, '-', ''), ' ', '') 
        AND ur.role = 'staff'
    ) THEN 1 ELSE 0 END) as is_staff,
    MAX(CASE WHEN u.role = 'ib' OR EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE REPLACE(REPLACE(ur.user_ic, '-', ''), ' ', '') = REPLACE(REPLACE(u.ic, '-', ''), ' ', '') 
        AND ur.role = 'ib'
    ) THEN 1 ELSE 0 END) as is_ib
  FROM (
    SELECT 
      u2.*,
      ROW_NUMBER() OVER (
        PARTITION BY REPLACE(REPLACE(u2.ic, '-', ''), ' ', '') 
        ORDER BY (CASE WHEN u2.ic LIKE '%-%' THEN 0 ELSE 1 END), u2.created_at DESC
      ) as rn
    FROM users u2
  ) u
  LEFT JOIN students s ON REPLACE(REPLACE(u.ic, '-', ''), ' ', '') = REPLACE(REPLACE(s.user_ic, '-', ''), ' ', '')
  LEFT JOIN classes c ON s.kelas_id = c.id
  LEFT JOIN teachers t ON REPLACE(REPLACE(u.ic, '-', ''), ' ', '') = REPLACE(REPLACE(t.user_ic, '-', ''), ' ', '')
  LEFT JOIN classes cls ON REPLACE(REPLACE(u.ic, '-', ''), ' ', '') = REPLACE(REPLACE(cls.guru_ic, '-', ''), ' ', '')
`;

const USER_GROUP_BY = `
  GROUP BY u.ic, u.nama, u.email, u.telefon, u.umur, u.alamat, u.role, u.status, u.created_at, u.updated_at
  ORDER BY u.nama, u.created_at DESC
`;

const normalizeIc = (value) => {
  if (!value || typeof value !== 'string') return '';
  return value.replace(/[-\s]/g, '');
};

const hyphenateIc = (normalizedIc, originalIc) => {
  if (typeof normalizedIc !== 'string' || normalizedIc.length !== 12) {
    return originalIc;
  }
  return `${normalizedIc.substring(0, 6)}-${normalizedIc.substring(6, 8)}-${normalizedIc.substring(8, 12)}`;
};

const parseKepakaran = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
    return [parsed];
  } catch {
    return [String(value)];
  }
};

const buildUserPayload = async (user) => {
  const normalizedIc = normalizeIc(user.ic);
  const hyphenatedIc = hyphenateIc(normalizedIc, user.ic);
  const candidateIcs = [user.ic, normalizedIc, hyphenatedIc].filter((value) => typeof value === 'string' && value.trim());

  let allRoles = [];
  for (const candidate of candidateIcs) {
    const roles = await fetchUserRoles(candidate, user.primary_role);
    if (roles.length > allRoles.length) {
      allRoles = roles;
    }
  }

  if (user.primary_role && !allRoles.includes(user.primary_role.toLowerCase())) {
    allRoles.push(user.primary_role.toLowerCase());
  }

  const roleList = [];
  if (user.is_admin === 1 || user.primary_role?.toLowerCase() === 'admin') {
    roleList.push('admin');
  }
  if (user.is_teacher === 1) {
    roleList.push('teacher');
  }
  if (user.is_pic === 1) {
    roleList.push('pic');
  }
  if (user.is_staff === 1) {
    roleList.push('staff');
  }
  if (user.is_student === 1) {
    roleList.push('student');
  }
  if (user.is_ib === 1) {
    roleList.push('ib');
  }

  const mergedRoles = [
    ...roleList.map((r) => (r || '').toLowerCase()).filter((r) => r),
    ...allRoles.map((r) => (r || '').toLowerCase()).filter((r) => r),
    ...(user.primary_role ? [user.primary_role.toLowerCase()] : [])
  ];
  const finalRoles = Array.from(new Set(mergedRoles)).filter((r) => r && VALID_ROLES.includes(r));

  if (finalRoles.length === 0 && user.primary_role) {
    finalRoles.push(user.primary_role.toLowerCase());
  }

  const baseUser = {
    ic: user.ic,
    IC: user.ic,
    nama: user.nama,
    email: user.email,
    telefon: user.telefon,
    umur: user.umur,
    alamat: user.alamat,
    role: user.primary_role,
    primary_role: user.primary_role,
    roles: finalRoles.length > 0 ? finalRoles : [user.primary_role?.toLowerCase()].filter((r) => r),
    status: user.status,
    created_at: user.created_at,
    updated_at: user.updated_at,
    is_student: user.is_student === 1,
    is_teacher: user.is_teacher === 1,
    is_admin: user.is_admin === 1,
    is_pic: user.is_pic === 1,
    is_staff: user.is_staff === 1,
    is_ib: user.is_ib === 1,
    kepakaran: [],
    total_classes: 0
  };

  if (user.is_student === 1) {
    baseUser.kelas_id = user.kelas_id;
    baseUser.nama_kelas = user.nama_kelas || 'Tiada Kelas';
    baseUser.tarikh_daftar = user.created_at;
  }

  if (user.is_teacher === 1 || user.is_staff === 1) {
    baseUser.kepakaran = parseKepakaran(user.kepakaran);
    baseUser.total_classes = user.total_classes || 0;
  }

  return baseUser;
};

/**
 * Get all users in the system (admin only)
 * Returns all users with all their roles (supports multiple roles per user)
 */
export const getAllUsers = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Akses dinafikan. Hanya admin boleh melihat semua pengguna.'
      });
    }

    const { search, role, status, page = 1, limit } = req.query;

    let query = `${USER_BASE_SELECT} WHERE u.rn = 1`;
    const queryParams = [];

    if (search) {
      query += ` AND (u.nama LIKE ? OR u.ic LIKE ? OR u.email LIKE ? OR u.telefon LIKE ?)`;
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (role) {
      if (role === 'student') {
        query += ` AND s.user_ic IS NOT NULL`;
      } else if (role === 'teacher') {
        query += ` AND t.user_ic IS NOT NULL`;
      } else if (role === 'admin') {
        query += ` AND (u.role = 'admin' OR EXISTS (
          SELECT 1 FROM user_roles ur 
          WHERE REPLACE(REPLACE(ur.user_ic, '-', ''), ' ', '') = REPLACE(REPLACE(u.ic, '-', ''), ' ', '') 
            AND ur.role = 'admin'
        ))`;
      } else if (role === 'pic') {
        query += ` AND (u.role = 'pic' OR EXISTS (
          SELECT 1 FROM user_roles ur 
          WHERE REPLACE(REPLACE(ur.user_ic, '-', ''), ' ', '') = REPLACE(REPLACE(u.ic, '-', ''), ' ', '') 
            AND ur.role = 'pic'
        ))`;
      } else if (role === 'staff') {
        query += ` AND (u.role = 'staff' OR EXISTS (
          SELECT 1 FROM user_roles ur 
          WHERE REPLACE(REPLACE(ur.user_ic, '-', ''), ' ', '') = REPLACE(REPLACE(u.ic, '-', ''), ' ', '') 
            AND ur.role = 'staff'
        ))`;
      } else if (role === 'ib') {
        query += ` AND (u.role = 'ib' OR EXISTS (
          SELECT 1 FROM user_roles ur 
          WHERE REPLACE(REPLACE(ur.user_ic, '-', ''), ' ', '') = REPLACE(REPLACE(u.ic, '-', ''), ' ', '') 
            AND ur.role = 'ib'
        ))`;
      } else {
        query += ` AND u.role = ?`;
        queryParams.push(role);
      }
    }

    if (status) {
      query += ` AND u.status = ?`;
      queryParams.push(status);
    }

    const { limit: safeLimit, offset } = getSafePagination(page, limit, 1, 1000);
    query += `${USER_GROUP_BY} LIMIT ${safeLimit} OFFSET ${offset}`;

    const [users] = await pool.execute(query, queryParams);
    const formattedUsers = await Promise.all(users.map(buildUserPayload));

    let countQuery = `
      SELECT COUNT(DISTINCT REPLACE(REPLACE(u.ic, '-', ''), ' ', '')) as total
      FROM (
        SELECT 
          u2.*,
          ROW_NUMBER() OVER (
            PARTITION BY REPLACE(REPLACE(u2.ic, '-', ''), ' ', '') 
            ORDER BY (CASE WHEN u2.ic LIKE '%-%' THEN 0 ELSE 1 END), u2.created_at DESC
          ) as rn
        FROM users u2
      ) u
      LEFT JOIN students s ON REPLACE(REPLACE(u.ic, '-', ''), ' ', '') = REPLACE(REPLACE(s.user_ic, '-', ''), ' ', '')
      LEFT JOIN teachers t ON REPLACE(REPLACE(u.ic, '-', ''), ' ', '') = REPLACE(REPLACE(t.user_ic, '-', ''), ' ', '')
      WHERE u.rn = 1
    `;
    const countParams = [];

    if (search) {
      countQuery += ` AND (u.nama LIKE ? OR u.ic LIKE ? OR u.email LIKE ? OR u.telefon LIKE ?)`;
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (role) {
      if (role === 'student') {
        countQuery += ` AND s.user_ic IS NOT NULL`;
      } else if (role === 'teacher') {
        countQuery += ` AND t.user_ic IS NOT NULL`;
      } else if (role === 'admin') {
        countQuery += ` AND (u.role = 'admin' OR EXISTS (
          SELECT 1 FROM user_roles ur 
          WHERE REPLACE(REPLACE(ur.user_ic, '-', ''), ' ', '') = REPLACE(REPLACE(u.ic, '-', ''), ' ', '') 
            AND ur.role = 'admin'
        ))`;
      } else if (role === 'pic') {
        countQuery += ` AND (u.role = 'pic' OR EXISTS (
          SELECT 1 FROM user_roles ur 
          WHERE REPLACE(REPLACE(ur.user_ic, '-', ''), ' ', '') = REPLACE(REPLACE(u.ic, '-', ''), ' ', '') 
            AND ur.role = 'pic'
        ))`;
      } else if (role === 'staff') {
        countQuery += ` AND (u.role = 'staff' OR EXISTS (
          SELECT 1 FROM user_roles ur 
          WHERE REPLACE(REPLACE(ur.user_ic, '-', ''), ' ', '') = REPLACE(REPLACE(u.ic, '-', ''), ' ', '') 
            AND ur.role = 'staff'
        ))`;
      } else if (role === 'ib') {
        countQuery += ` AND (u.role = 'ib' OR EXISTS (
          SELECT 1 FROM user_roles ur 
          WHERE REPLACE(REPLACE(ur.user_ic, '-', ''), ' ', '') = REPLACE(REPLACE(u.ic, '-', ''), ' ', '') 
            AND ur.role = 'ib'
        ))`;
      } else {
        countQuery += ` AND u.role = ?`;
        countParams.push(role);
      }
    }

    if (status) {
      countQuery += ` AND u.status = ?`;
      countParams.push(status);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    const roleStats = formattedUsers.reduce((acc, user) => {
      if (user.is_student) acc.student = (acc.student || 0) + 1;
      if (user.is_teacher) acc.teacher = (acc.teacher || 0) + 1;
      if (user.is_admin) acc.admin = (acc.admin || 0) + 1;
      if (user.is_pic) acc.pic = (acc.pic || 0) + 1;
      if (user.is_staff) acc.staff = (acc.staff || 0) + 1;
      if (user.is_ib) acc.ib = (acc.ib || 0) + 1;
      acc[user.primary_role] = (acc[user.primary_role] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      data: formattedUsers,
      pagination: {
        page: parseInt(page, 10),
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit)
      },
      statistics: {
        byRole: roleStats,
        total
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memuatkan senarai pengguna.',
      error: error.message
    });
  }
};

export const getUserByIc = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Akses dinafikan. Hanya admin boleh melihat pengguna ini.'
      });
    }

    const rawIc = String(req.params.ic || '');
    const normalizedSearchIc = normalizeIc(rawIc);
    if (!normalizedSearchIc) {
      return res.status(400).json({
        success: false,
        message: 'IC pengguna tidak sah.'
      });
    }

    const query = `
      ${USER_BASE_SELECT}
      WHERE u.rn = 1
        AND REPLACE(REPLACE(u.ic, '-', ''), ' ', '') = ?
      ${USER_GROUP_BY}
      LIMIT 1
    `;

    const [users] = await pool.execute(query, [normalizedSearchIc]);
    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pengguna tidak ditemui.'
      });
    }

    const user = await buildUserPayload(users[0]);
    return res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user by IC error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memuatkan maklumat pengguna.',
      error: error.message
    });
  }
};


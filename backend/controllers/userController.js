import { pool } from '../config/database.js';
import { fetchUserRoles } from '../services/userRoleService.js';
import { getSafePagination } from '../utils/pagination.js';

const VALID_ROLES = ['admin', 'teacher', 'student', 'pic', 'staff', 'ib'];

/**
 * Get all users in the system (admin only)
 * Returns all users with all their roles (supports multiple roles per user)
 */
export const getAllUsers = async (req, res) => {
  try {
    // Only admins can access this endpoint
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Akses dinafikan. Hanya admin boleh melihat semua pengguna.'
      });
    }

    const { search, role, status, page = 1, limit } = req.query;

    // Get all users with deduplication (prefer hyphenated IC format)
    // Include all role information from both users table and role-specific tables
    let query = `
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
        -- Additional info based on role (use MAX/ANY_VALUE to handle GROUP BY)
        MAX(s.kelas_id) as kelas_id,
        MAX(c.nama_kelas) as nama_kelas,
        MAX(t.kepakaran) as kepakaran,
        COUNT(DISTINCT cls.id) as total_classes,
        -- Check if user has entries in role-specific tables (use MAX to handle GROUP BY)
        MAX(CASE WHEN s.user_ic IS NOT NULL THEN 1 ELSE 0 END) as is_student,
        MAX(CASE WHEN t.user_ic IS NOT NULL THEN 1 ELSE 0 END) as is_teacher,
        MAX(CASE WHEN u.role = 'admin' OR EXISTS (SELECT 1 FROM user_roles ur WHERE REPLACE(REPLACE(ur.user_ic, '-', ''), ' ', '') = REPLACE(REPLACE(u.ic, '-', ''), ' ', '') AND ur.role = 'admin') THEN 1 ELSE 0 END) as is_admin,
        MAX(CASE WHEN u.role = 'pic' OR EXISTS (SELECT 1 FROM user_roles ur WHERE REPLACE(REPLACE(ur.user_ic, '-', ''), ' ', '') = REPLACE(REPLACE(u.ic, '-', ''), ' ', '') AND ur.role = 'pic') THEN 1 ELSE 0 END) as is_pic,
        MAX(CASE WHEN u.role = 'staff' OR EXISTS (SELECT 1 FROM user_roles ur WHERE REPLACE(REPLACE(ur.user_ic, '-', ''), ' ', '') = REPLACE(REPLACE(u.ic, '-', ''), ' ', '') AND ur.role = 'staff') THEN 1 ELSE 0 END) as is_staff,
        MAX(CASE WHEN u.role = 'ib' OR EXISTS (SELECT 1 FROM user_roles ur WHERE REPLACE(REPLACE(ur.user_ic, '-', ''), ' ', '') = REPLACE(REPLACE(u.ic, '-', ''), ' ', '') AND ur.role = 'ib') THEN 1 ELSE 0 END) as is_ib
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
      WHERE u.rn = 1
    `;

    const queryParams = [];

    if (search) {
      query += ` AND (u.nama LIKE ? OR u.ic LIKE ? OR u.email LIKE ? OR u.telefon LIKE ?)`;
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Filter by role - check both primary role and role-specific tables
    if (role) {
      if (role === 'student') {
        query += ` AND s.user_ic IS NOT NULL`;
      } else if (role === 'teacher') {
        query += ` AND t.user_ic IS NOT NULL`;
      } else if (role === 'admin') {
        query += ` AND (u.role = 'admin' OR EXISTS (SELECT 1 FROM user_roles ur WHERE REPLACE(REPLACE(ur.user_ic, '-', ''), ' ', '') = REPLACE(REPLACE(u.ic, '-', ''), ' ', '') AND ur.role = 'admin'))`;
      } else if (role === 'pic') {
        query += ` AND (u.role = 'pic' OR EXISTS (SELECT 1 FROM user_roles ur WHERE REPLACE(REPLACE(ur.user_ic, '-', ''), ' ', '') = REPLACE(REPLACE(u.ic, '-', ''), ' ', '') AND ur.role = 'pic'))`;
      } else if (role === 'staff') {
        query += ` AND (u.role = 'staff' OR EXISTS (SELECT 1 FROM user_roles ur WHERE REPLACE(REPLACE(ur.user_ic, '-', ''), ' ', '') = REPLACE(REPLACE(u.ic, '-', ''), ' ', '') AND ur.role = 'staff'))`;
      } else if (role === 'ib') {
        query += ` AND (u.role = 'ib' OR EXISTS (SELECT 1 FROM user_roles ur WHERE REPLACE(REPLACE(ur.user_ic, '-', ''), ' ', '') = REPLACE(REPLACE(u.ic, '-', ''), ' ', '') AND ur.role = 'ib'))`;
      } else {
        query += ` AND u.role = ?`;
        queryParams.push(role);
      }
    }

    if (status) {
      query += ` AND u.status = ?`;
      queryParams.push(status);
    }

    // Add pagination (using safe pagination utility to prevent SQL injection)
    const { limit: safeLimit, offset } = getSafePagination(page, limit, 1, 1000);
    query += ` GROUP BY u.ic, u.nama, u.email, u.telefon, u.umur, u.alamat, u.role, u.status, u.created_at, u.updated_at ORDER BY u.nama, u.created_at DESC LIMIT ${safeLimit} OFFSET ${offset}`;

    const [users] = await pool.execute(query, queryParams);

    // Format users data with all roles
    const formattedUsers = await Promise.all(users.map(async (user) => {
      // Fetch all roles for this user
      // Normalize IC for role fetching (try both formats)
      const normalizedIc = user.ic ? user.ic.replace(/[-\s]/g, '') : user.ic;
      const hyphenatedIc = normalizedIc && normalizedIc.length === 12 
        ? `${normalizedIc.substring(0, 6)}-${normalizedIc.substring(6, 8)}-${normalizedIc.substring(8, 12)}`
        : user.ic;
      
      // Try fetching roles with both IC formats
      let allRoles = await fetchUserRoles(user.ic, user.primary_role);
      // Also try with normalized IC (without hyphens)
      const altRoles = await fetchUserRoles(normalizedIc, user.primary_role);
      if (altRoles.length > allRoles.length) {
        allRoles = altRoles;
      }
      // Also try with hyphenated format if different
      if (hyphenatedIc !== user.ic && hyphenatedIc !== normalizedIc) {
        const hyphenRoles = await fetchUserRoles(hyphenatedIc, user.primary_role);
        if (hyphenRoles.length > allRoles.length) {
          allRoles = hyphenRoles;
        }
      }
      
      // Ensure primary role is included
      if (user.primary_role && !allRoles.includes(user.primary_role.toLowerCase())) {
        allRoles.push(user.primary_role.toLowerCase());
      }
      
      // Also check role indicators from database query and add missing roles
      // These are the authoritative source since they come from the SQL query
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
      
      // Merge role lists, ensuring no duplicates and proper lowercase
      // Combine all sources: fetchUserRoles result, role indicators, and primary role
      // Priority: role indicators (from SQL) > fetchUserRoles > primary_role
      const mergedRoles = [
        ...roleList.map(r => (r || '').toLowerCase()).filter(r => r), // Highest priority - from SQL query
        ...allRoles.map(r => (r || '').toLowerCase()).filter(r => r), // From user_roles table
        ...(user.primary_role ? [user.primary_role.toLowerCase()] : []) // Fallback to primary role
      ];
      const finalRoles = Array.from(new Set(mergedRoles)).filter(r => r && VALID_ROLES.includes(r));
      
      // If still no roles, at least include primary role (even if not in VALID_ROLES for safety)
      if (finalRoles.length === 0 && user.primary_role) {
        finalRoles.push(user.primary_role.toLowerCase());
      }
      
      // Debug logging for Amir
      if (user.nama && user.nama.toLowerCase().includes('amir')) {
        console.log(`🔍 [getAllUsers] Amir roles debug:`, {
          ic: user.ic,
          normalizedIc: normalizedIc,
          hyphenatedIc: hyphenatedIc,
          primary_role: user.primary_role,
          allRoles_from_fetch: allRoles,
          roleList_from_indicators: roleList,
          mergedRoles_before_dedup: [
            ...roleList.map(r => (r || '').toLowerCase()).filter(r => r),
            ...allRoles.map(r => (r || '').toLowerCase()).filter(r => r),
            ...(user.primary_role ? [user.primary_role.toLowerCase()] : [])
          ],
          finalRoles: finalRoles,
          is_admin: user.is_admin,
          is_teacher: user.is_teacher,
          is_pic: user.is_pic,
          is_staff: user.is_staff,
          is_student: user.is_student,
          is_ib: user.is_ib
        });
      }
      
      const baseUser = {
        ic: user.ic,
        IC: user.ic, // For frontend compatibility
        nama: user.nama,
        email: user.email,
        telefon: user.telefon,
        umur: user.umur,
        alamat: user.alamat,
        role: user.primary_role, // Primary role for backward compatibility
        primary_role: user.primary_role,
        roles: finalRoles.length > 0 ? finalRoles : [user.primary_role?.toLowerCase()].filter(r => r), // All roles as array, fallback to primary
        status: user.status,
        created_at: user.created_at,
        updated_at: user.updated_at,
        // Role indicators - ensure these are always included for frontend
        is_student: user.is_student === 1,
        is_teacher: user.is_teacher === 1,
        is_admin: user.is_admin === 1,
        is_pic: user.is_pic === 1,
        is_staff: user.is_staff === 1,
        is_ib: user.is_ib === 1
      };

      // Add role-specific fields
      if (user.is_student === 1) {
        baseUser.kelas_id = user.kelas_id;
        baseUser.nama_kelas = user.nama_kelas || 'Tiada Kelas';
        baseUser.tarikh_daftar = user.created_at;
      }
      
      if (user.is_teacher === 1 || user.is_staff === 1) {
        baseUser.kepakaran = user.kepakaran ? (typeof user.kepakaran === 'string' ? JSON.parse(user.kepakaran) : user.kepakaran) : [];
        baseUser.total_classes = user.total_classes || 0;
      }

      return baseUser;
    }));

    // Get total count - use same logic as main query
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

    // Use same role filtering logic as main query
    if (role) {
      if (role === 'student') {
        countQuery += ` AND s.user_ic IS NOT NULL`;
      } else if (role === 'teacher') {
        countQuery += ` AND t.user_ic IS NOT NULL`;
      } else if (role === 'admin') {
        countQuery += ` AND (u.role = 'admin' OR EXISTS (SELECT 1 FROM user_roles ur WHERE REPLACE(REPLACE(ur.user_ic, '-', ''), ' ', '') = REPLACE(REPLACE(u.ic, '-', ''), ' ', '') AND ur.role = 'admin'))`;
      } else if (role === 'pic') {
        countQuery += ` AND (u.role = 'pic' OR EXISTS (SELECT 1 FROM user_roles ur WHERE REPLACE(REPLACE(ur.user_ic, '-', ''), ' ', '') = REPLACE(REPLACE(u.ic, '-', ''), ' ', '') AND ur.role = 'pic'))`;
      } else if (role === 'staff') {
        countQuery += ` AND (u.role = 'staff' OR EXISTS (SELECT 1 FROM user_roles ur WHERE REPLACE(REPLACE(ur.user_ic, '-', ''), ' ', '') = REPLACE(REPLACE(u.ic, '-', ''), ' ', '') AND ur.role = 'staff'))`;
      } else if (role === 'ib') {
        countQuery += ` AND (u.role = 'ib' OR EXISTS (SELECT 1 FROM user_roles ur WHERE REPLACE(REPLACE(ur.user_ic, '-', ''), ' ', '') = REPLACE(REPLACE(u.ic, '-', ''), ' ', '') AND ur.role = 'ib'))`;
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

    // Group by role for statistics - count users in each role category
    const roleStats = formattedUsers.reduce((acc, user) => {
      // Count by all roles, not just primary role
      if (user.is_student) acc.student = (acc.student || 0) + 1;
      if (user.is_teacher) acc.teacher = (acc.teacher || 0) + 1;
      if (user.is_admin) acc.admin = (acc.admin || 0) + 1;
      if (user.is_pic) acc.pic = (acc.pic || 0) + 1;
      if (user.is_staff) acc.staff = (acc.staff || 0) + 1;
      if (user.is_ib) acc.ib = (acc.ib || 0) + 1;
      // Also count primary role for backward compatibility
      acc[user.primary_role] = (acc[user.primary_role] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      data: formattedUsers,
      pagination: {
        page: parseInt(page),
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit)
      },
      statistics: {
        byRole: roleStats,
        total: total
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


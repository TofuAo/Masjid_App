import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import { pool } from '../config/database.js';
import { formatICWithHyphen } from '../utils/icFormatter.js';
import { createSnapshot } from '../utils/adminActionSnapshots.js';

const PIC_ROLE = 'pic';

const mapPicUser = (row) => ({
  ic: row.ic,
  ic_formatted: formatICWithHyphen(row.ic),
  nama: row.nama,
  email: row.email,
  telefon: row.telefon,
  status: row.status,
  role: PIC_ROLE,
  primary_role: row.role,
  created_at: row.created_at,
  updated_at: row.updated_at
});

/**
 * Helper function to find a PIC user by IC (handles all format variations)
 * Uses the same logic as listPicUsers to ensure consistency
 */
const findPicUserByIc = async (ic) => {
  if (!ic) {
    console.log('[findPicUserByIc] No IC provided');
    return null;
  }
  
  // Normalize IC for comparison
  const normalizedIc = ic.replace(/\D/g, '');
  const formattedIc = normalizedIc.length === 12 
    ? `${normalizedIc.substring(0, 6)}-${normalizedIc.substring(6, 8)}-${normalizedIc.substring(8, 12)}`
    : ic;
  
  console.log('[findPicUserByIc] Searching for IC:', {
    original: ic,
    normalized: normalizedIc,
    formatted: formattedIc
  });
  
  // Use the SAME query logic as listPicUsers
  // This ensures we find users that appear in the PIC list
  let [users] = await pool.execute(
    `SELECT * FROM users u
     WHERE (
       u.role = ?
       OR EXISTS (
         SELECT 1 FROM user_roles ur 
         WHERE (
           REPLACE(ur.user_telefon, '-', '') = REPLACE(u.telefon, '-', '')
           OR ur.user_telefon = u.telefon
         )
         AND ur.role = ?
       )
     )
     AND (
       REPLACE(u.telefon, '-', '') = ? 
       OR u.telefon = ? 
       OR u.telefon = ?
     )
     LIMIT 1`,
    [PIC_ROLE, PIC_ROLE, normalizedIc, formattedIc, ic]
  );
  
  console.log('[findPicUserByIc] Primary query result:', users.length, 'users found');
  if (users.length > 0) {
    console.log('[findPicUserByIc] Found user:', users[0].ic, 'Role:', users[0].role);
    return users[0];
  }
  
  // Fallback: try simpler queries if not found
  console.log('[findPicUserByIc] Trying fallback query 1: normalized IC');
  [users] = await pool.execute(
    `SELECT * FROM users WHERE REPLACE(ic, '-', '') = ?`,
    [normalizedIc]
  );
  console.log('[findPicUserByIc] Fallback 1 result:', users.length, 'users found');
  if (users.length > 0) {
    console.log('[findPicUserByIc] Found user via fallback 1:', users[0].ic, 'Role:', users[0].role);
    // Check if this user is actually a PIC
    const [picCheck] = await pool.execute(
      `SELECT 1 FROM user_roles 
       WHERE (REPLACE(user_telefon, '-', '') = ? OR user_telefon = ?) AND role = ?`,
      [normalizedIc, users[0].ic, PIC_ROLE]
    );
    if (users[0].role === PIC_ROLE || picCheck.length > 0) {
      return users[0];
    }
    console.log('[findPicUserByIc] User found but is not a PIC');
  }
  
  console.log('[findPicUserByIc] Trying fallback query 2: formatted IC');
  [users] = await pool.execute(
    `SELECT * FROM users WHERE telefon = ?`,
    [formattedIc]
  );
  console.log('[findPicUserByIc] Fallback 2 result:', users.length, 'users found');
  if (users.length > 0) {
    console.log('[findPicUserByIc] Found user via fallback 2:', users[0].ic, 'Role:', users[0].role);
    // Check if this user is actually a PIC
    const [picCheck] = await pool.execute(
      `SELECT 1 FROM user_roles 
       WHERE (REPLACE(user_telefon, '-', '') = ? OR user_telefon = ?) AND role = ?`,
      [normalizedIc, users[0].ic, PIC_ROLE]
    );
    if (users[0].role === PIC_ROLE || picCheck.length > 0) {
      return users[0];
    }
    console.log('[findPicUserByIc] User found but is not a PIC');
  }
  
  console.log('[findPicUserByIc] Trying fallback query 3: original IC');
  [users] = await pool.execute(
    `SELECT * FROM users WHERE telefon = ?`,
    [ic]
  );
  console.log('[findPicUserByIc] Fallback 3 result:', users.length, 'users found');
  if (users.length > 0) {
    console.log('[findPicUserByIc] Found user via fallback 3:', users[0].ic, 'Role:', users[0].role);
    // Check if this user is actually a PIC
    const [picCheck] = await pool.execute(
      `SELECT 1 FROM user_roles 
       WHERE (REPLACE(user_telefon, '-', '') = ? OR user_telefon = ?) AND role = ?`,
      [normalizedIc, users[0].ic, PIC_ROLE]
    );
    if (users[0].role === PIC_ROLE || picCheck.length > 0) {
      return users[0];
    }
    console.log('[findPicUserByIc] User found but is not a PIC');
  }
  
  console.log('[findPicUserByIc] User not found after all attempts');
  return null;
};

export const listPicUsers = async (req, res) => {
  try {
    const { search = '' } = req.query;
    let query = `
      SELECT ic, nama, email, telefon, status, role, created_at, updated_at
      FROM users u
      WHERE (
        u.role = ?
        OR EXISTS (
          SELECT 1 FROM user_roles ur 
          WHERE (
            REPLACE(ur.user_telefon, '-', '') = REPLACE(u.telefon, '-', '')
            OR ur.user_telefon = u.telefon
          )
          AND ur.role = ?
        )
      )
    `;
    const params = [PIC_ROLE, PIC_ROLE];

    if (search) {
      const like = `%${search.trim()}%`;
      const icLike = `%${search.trim().replace(/\D/g, '')}%`;
      query += ` AND (nama LIKE ? OR REPLACE(ic, '-', '') LIKE ? OR email LIKE ?)`;
      params.push(like, icLike, like);
    }

    query += ' ORDER BY nama ASC';

    const [rows] = await pool.execute(query, params);

    res.json({
      success: true,
      data: rows.map(mapPicUser)
    });
  } catch (error) {
    console.error('List PIC users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const createPicUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { nama, ic, email, telefon, password, status = 'aktif' } = req.body;
    const normalizedEmail = email && email.trim() !== '' ? email.trim() : null;
    const normalizedIc = ic.replace(/\D/g, '');

    const [existingUsers] = await pool.execute(
      `
        SELECT *
        FROM users
        WHERE REPLACE(ic, '-', '') = ?
        ORDER BY (ic LIKE '%-%') DESC, ic ASC
      `,
      [normalizedIc]
    );

    const hashedPassword = await bcrypt.hash(password, 12);

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      const [existingPicRoles] = await pool.execute(
        'SELECT id FROM user_roles WHERE user_telefon = ? AND role = ?',
        [existingUser.ic, PIC_ROLE]
      );

      if (existingUser.role === PIC_ROLE || existingPicRoles.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'IC ini telah digunakan oleh pengguna lain.'
        });
      }

      if (normalizedEmail) {
        const [emailConflicts] = await pool.execute(
          'SELECT ic FROM users WHERE email = ? AND ic <> ?',
          [normalizedEmail, existingUser.ic]
        );

        if (emailConflicts.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Emel ini telah digunakan oleh pengguna lain.'
          });
        }
      }

      const fields = [];
      const params = [];

      if (nama !== undefined) {
        fields.push('nama = ?');
        params.push(nama);
      }
      if (email !== undefined) {
        fields.push('email = ?');
        params.push(normalizedEmail || null);
      }
      if (telefon !== undefined) {
        fields.push('telefon = ?');
        params.push(telefon || null);
      }
      if (status !== undefined) {
        fields.push('status = ?');
        params.push(status);
      }
      if (password) {
        fields.push('password = ?');
        params.push(hashedPassword);
      }

      if (fields.length > 0) {
        await pool.execute(
          `UPDATE users
           SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
           WHERE ic = ?`,
          [...params, existingUser.ic]
        );
      }

      await pool.execute(
        'INSERT INTO user_roles (user_telefon, role) VALUES (?, ?)',
        [existingUser.ic, PIC_ROLE]
      );

      const [updatedRows] = await pool.execute(
        `SELECT ic, nama, email, telefon, status, role, created_at, updated_at
         FROM users
         WHERE ic = ?`,
        [existingUser.ic]
      );

      return res.status(201).json({
        success: true,
        message: 'Pengguna sedia ada telah ditetapkan sebagai PIC.',
        data: mapPicUser(updatedRows[0])
      });
    }

    if (normalizedEmail) {
      const [existingByEmail] = await pool.execute(
        'SELECT ic FROM users WHERE email = ?',
        [normalizedEmail]
      );

      if (existingByEmail.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Emel ini telah digunakan oleh pengguna lain.'
        });
      }
    }

    await pool.execute(
      `INSERT INTO users (ic, nama, email, telefon, password, role, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [ic, nama, normalizedEmail, telefon || null, hashedPassword, PIC_ROLE, status]
    );

    const [createdRows] = await pool.execute(
      `SELECT ic, nama, email, telefon, status, role, created_at, updated_at
       FROM users
       WHERE ic = ?`,
      [ic]
    );

    res.status(201).json({
      success: true,
      message: 'PIC baharu berjaya ditambah.',
      data: mapPicUser(createdRows[0])
    });
  } catch (error) {
    console.error('Create PIC user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updatePicUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { ic } = req.params;
    const { nama, email, telefon, password, status, role } = req.body;
    
    console.log('[UpdatePIC] Received IC from params:', ic);

    // Use the helper function to find the user (same logic as listPicUsers)
    const existingUser = await findPicUserByIc(ic);

    if (!existingUser) {
      console.log('[UpdatePIC] User not found with IC:', ic);
      return res.status(404).json({
        success: false,
        message: 'PIC tidak ditemui. Pengguna dengan IC ini tidak wujud.'
      });
    }
    
    console.log('[UpdatePIC] Found user:', existingUser.ic, 'Role:', existingUser.role);
    const isCurrentlyPic = existingUser.role === PIC_ROLE;
    
    // Check if user is actually a PIC (either primary role or in user_roles table)
    // Use normalized comparison for user_roles lookup to handle IC format differences
    const actualIc = existingUser.ic;
    const normalizedIc = ic.replace(/\D/g, '');
    
    // Try both the actual IC format and normalized format for user_roles lookup
    const [picRoleRows] = await pool.execute(
      `SELECT id FROM user_roles 
       WHERE (REPLACE(user_telefon, '-', '') = ? OR user_telefon = ?) AND role = ?`,
      [normalizedIc, actualIc, PIC_ROLE]
    );
    
    console.log('[UpdatePIC] PIC role rows found:', picRoleRows.length, 'Actual IC:', actualIc);
    
    const hasPicRole = isCurrentlyPic || picRoleRows.length > 0;
    
    // IMPORTANT: If user exists, allow the update
    // The fact that they're being edited from the PIC management page means they should be editable
    // The listPicUsers endpoint already determines who appears in the PIC list
    // So if a user is being edited from this page, they should be allowed to be updated
    console.log('[UpdatePIC] User found. Has PIC role:', hasPicRole, 'Current role:', existingUser.role, 'Updating role to:', role);
    
    // If user doesn't have PIC role but we're updating them to be PIC, we'll ensure they get the role
    if (!hasPicRole && role === 'pic') {
      console.log('[UpdatePIC] User does not have PIC role, will ensure PIC role is set after update');
    }

    // If changing role to admin, check admin limit
    if (role === 'admin' && isCurrentlyPic) {
      const [adminCountResult] = await pool.execute(
        "SELECT COUNT(*) as count FROM users WHERE role = 'admin'"
      );
      const currentAdminCount = adminCountResult[0].count;

      if (currentAdminCount >= 5) {
        return res.status(400).json({
          success: false,
          message: 'Bilangan admin telah mencapai had maksimum (5 admin). Sila padamkan admin sedia ada sebelum menukar peranan PIC kepada admin.'
        });
      }
    }

    if (email) {
      const [emailConflicts] = await pool.execute(
        `SELECT ic FROM users WHERE email = ? AND REPLACE(ic, '-', '') <> ?`,
        [email, normalizedIc]
      );

      if (emailConflicts.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Emel ini telah digunakan oleh pengguna lain.'
        });
      }
    }

    const fields = [];
    const params = [];

    if (nama !== undefined) {
      fields.push('nama = ?');
      params.push(nama);
    }
    if (email !== undefined) {
      fields.push('email = ?');
      params.push(email || null);
    }
    if (telefon !== undefined) {
      fields.push('telefon = ?');
      params.push(telefon || null);
    }
    if (status !== undefined) {
      fields.push('status = ?');
      params.push(status);
    }
    if (role !== undefined && (role === 'pic' || role === 'admin')) {
      fields.push('role = ?');
      params.push(role);
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12);
      fields.push('password = ?');
      params.push(hashedPassword);
    }

    if (fields.length === 0) {
      return res.json({
        success: true,
        message: 'Tiada perubahan dibuat.',
        data: mapPicUser(existingUser)
      });
    }

    // Use the actual IC from database for update
    params.push(actualIc);
    await pool.execute(
      `UPDATE users
       SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE ic = ?`,
      params
    );
    
    // If updating to PIC role and user doesn't have PIC role in user_roles, ensure it's added
    if (role === 'pic' && !hasPicRole) {
      // Check if PIC role already exists (in case of format mismatch)
      const [existingPicRole] = await pool.execute(
        `SELECT id FROM user_roles 
         WHERE (REPLACE(user_telefon, '-', '') = ? OR user_telefon = ?) AND role = ?`,
        [normalizedIc, actualIc, PIC_ROLE]
      );
      
      if (existingPicRole.length === 0) {
        // Add PIC role to user_roles table
        await pool.execute(
          'INSERT INTO user_roles (user_telefon, role) VALUES (?, ?)',
          [actualIc, PIC_ROLE]
        );
        console.log('[UpdatePIC] Added PIC role to user_roles table');
      }
    }

    const [updatedRows] = await pool.execute(
      `SELECT ic, nama, email, telefon, status, role, created_at, updated_at
       FROM users
       WHERE ic = ?`,
      [actualIc]
    );

    const updatedUser = updatedRows[0];
    const successMessage = role === 'admin' && isCurrentlyPic
      ? 'PIC berjaya ditukar kepada admin.'
      : 'PIC berjaya dikemaskini.';

    res.json({
      success: true,
      message: successMessage,
      data: mapPicUser(updatedUser)
    });
  } catch (error) {
    console.error('Update PIC user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deletePicUser = async (req, res) => {
  try {
    const { ic } = req.params;
    
    console.log('[DeletePIC] Received IC from params:', ic);
    console.log('[DeletePIC] IC type:', typeof ic);
    console.log('[DeletePIC] Raw params:', JSON.stringify(req.params));

    // Use the helper function to find the user (same logic as listPicUsers)
    const user = await findPicUserByIc(ic);

    if (!user) {
      console.log('[DeletePIC] User not found with IC:', ic);
      return res.status(404).json({
        success: false,
        message: 'PIC tidak ditemui.'
      });
    }
    
    const actualIc = user.telefon;
    const normalizedIc = ic.replace(/\D/g, '');
    const adminIc = req.user?.telefon || req.user?.userId;
    
    console.log('[DeletePIC] Found user:', actualIc, 'Role:', user.role);
    console.log('[DeletePIC] User verified (found by listPicUsers query logic). Proceeding with delete.');

    // Get all user roles for snapshot
    const [allUserRoles] = await pool.execute(
      `SELECT role FROM user_roles 
       WHERE (REPLACE(user_telefon, '-', '') = ? OR user_telefon = ?)`,
      [normalizedIc, actualIc]
    );
    const userRolesList = allUserRoles.map(r => r.role);

    // Prepare snapshot data
    const snapshotData = {
      user: {
        ic: user.telefon,
        nama: user.nama,
        email: user.email,
        telefon: user.telefon,
        status: user.status,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      roles: userRolesList,
      primary_role: user.role,
      has_other_roles: user.role !== PIC_ROLE
    };

    if (user.role !== PIC_ROLE) {
      // Delete PIC role from user_roles using actual IC from database
      // Create snapshot before deletion for undo capability
      await createSnapshot({
        entityType: 'picUser',
        entityId: 0, // Not using entity_id for PIC users, using entity_identifier instead
        entityIdentifier: actualIc,
        operation: 'delete',
        data: snapshotData,
        metadata: { action_type: 'remove_pic_role' },
        actorPhone: adminIc
      });

      await pool.execute(
        `DELETE FROM user_roles 
         WHERE (REPLACE(user_telefon, '-', '') = ? OR user_telefon = ?) AND role = ?`,
        [normalizedIc, actualIc, PIC_ROLE]
      );

      return res.json({
        success: true,
        message: 'Peranan PIC telah dipadam daripada pengguna sedia ada.'
      });
    }

    const [otherRoles] = await pool.execute(
      `SELECT role FROM user_roles 
       WHERE (REPLACE(user_telefon, '-', '') = ? OR user_telefon = ?) AND role <> ?`,
      [normalizedIc, actualIc, PIC_ROLE]
    );

    // Create snapshot before deletion for undo capability
    const willDeleteUser = otherRoles.length === 0;
    await createSnapshot({
      entityType: 'picUser',
      entityId: 0, // Not using entity_id for PIC users, using entity_identifier instead
      entityIdentifier: actualIc,
      operation: 'delete',
      data: {
        ...snapshotData,
        other_roles: otherRoles.map(r => r.role),
        will_delete_user: willDeleteUser
      },
      metadata: { 
        action_type: willDeleteUser ? 'delete_pic_user' : 'remove_pic_role_and_update_primary'
      },
      actorPhone: adminIc
    });

    // Delete PIC role using actual IC
    await pool.execute(
      `DELETE FROM user_roles 
       WHERE (REPLACE(user_telefon, '-', '') = ? OR user_telefon = ?) AND role = ?`,
      [normalizedIc, actualIc, PIC_ROLE]
    );

    if (otherRoles.length === 0) {
      await pool.execute('DELETE FROM users WHERE telefon = ?', [actualIc]);
    } else {
      await pool.execute(
        'UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE ic = ?',
        [otherRoles[0].role, actualIc]
      );
    }

    const message = otherRoles.length === 0
      ? 'PIC berjaya dipadam.'
      : 'Peranan PIC telah dibuang dan peranan utama dikembalikan kepada pengguna.';

    res.json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Delete PIC user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};



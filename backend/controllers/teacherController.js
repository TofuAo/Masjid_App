import { pool } from '../config/database.js';
import { validationResult } from 'express-validator';
import { createSnapshot } from '../utils/adminActionSnapshots.js';
import { normalizePhone } from '../utils/phoneNormalizer.js';
import { getSafePagination } from '../utils/pagination.js';

// Helper to safely call createSnapshot without crashing main operation
const safeSnapshot = async (params) => {
  try {
    await createSnapshot(params);
  } catch (err) {
    console.error('Snapshot error (non-critical):', err.message);
  }
};

export const getAllTeachers = async (req, res) => {
  try {
    const { search, status, page = 1, limit } = req.query;
    const defaultLimit = limit ? parseInt(limit) : 1000;
    
    let query = `
      SELECT 
        u.telefon as ic, u.nama, u.email, u.telefon, u.status, 
        COALESCE(t.kepakaran, '[]') as kepakaran, 
        COUNT(DISTINCT c.id) as total_classes
      FROM (
        SELECT u2.*,
          ROW_NUMBER() OVER (
            PARTITION BY u2.telefon 
            ORDER BY (CASE WHEN u2.role = 'teacher' THEN 0 WHEN u2.role = 'staff' THEN 1 ELSE 2 END), u2.created_at DESC
          ) as rn
        FROM users u2
        WHERE u2.role IN ('teacher', 'staff', 'admin')
      ) u
      LEFT JOIN teachers t ON u.telefon = t.user_telefon
      LEFT JOIN user_roles ur ON u.telefon = ur.user_telefon AND ur.role = 'teacher'
      LEFT JOIN classes c ON u.telefon = c.guru_telefon
      WHERE u.rn = 1 
        AND (
          u.role IN ('teacher', 'staff') 
          OR (u.role = 'admin' AND t.user_telefon IS NOT NULL)
          OR (u.role = 'admin' AND ur.user_telefon IS NOT NULL)
          OR (u.role = 'admin' AND EXISTS (SELECT 1 FROM teachers t2 WHERE t2.user_telefon = u.telefon))
        )
    `;
    const queryParams = [];
    if (search) {
      query += ` AND (u.nama LIKE ? OR u.telefon LIKE ?)`;
      queryParams.push(`%${search}%`, `%${search}%`);
    }
    if (status) { query += ` AND u.status = ?`; queryParams.push(status); }
    
    const { limit: safeLimit, offset } = getSafePagination(page, defaultLimit, 1, defaultLimit);
    query += ` GROUP BY u.telefon, u.nama, u.email, u.status, t.kepakaran, u.created_at, ur.user_telefon ORDER BY u.created_at DESC LIMIT ${safeLimit} OFFSET ${offset}`;
    
    const [teachers] = await pool.execute(query, queryParams);
    
    let countQuery = `
      SELECT COUNT(DISTINCT u.telefon) as total
      FROM (
        SELECT u2.*,
          ROW_NUMBER() OVER (
            PARTITION BY u2.telefon 
            ORDER BY (CASE WHEN u2.role = 'teacher' THEN 0 WHEN u2.role = 'staff' THEN 1 ELSE 2 END), u2.created_at DESC
          ) as rn
        FROM users u2 WHERE u2.role IN ('teacher', 'staff', 'admin')
      ) u
      LEFT JOIN teachers t ON u.telefon = t.user_telefon
      LEFT JOIN user_roles ur ON u.telefon = ur.user_telefon AND ur.role = 'teacher'
      WHERE u.rn = 1 
        AND (
          u.role IN ('teacher', 'staff') 
          OR (u.role = 'admin' AND t.user_telefon IS NOT NULL)
          OR (u.role = 'admin' AND ur.user_telefon IS NOT NULL)
          OR (u.role = 'admin' AND EXISTS (SELECT 1 FROM teachers t2 WHERE t2.user_telefon = u.telefon))
        )
    `;
    const countParams = [];
    if (search) { countQuery += ` AND (u.nama LIKE ? OR u.telefon LIKE ?)`; countParams.push(`%${search}%`, `%${search}%`); }
    if (status) { countQuery += ` AND u.status = ?`; countParams.push(status); }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    const formattedTeachers = teachers.map(teacher => ({
      ...teacher,
      IC: teacher.telefon,
      ic: teacher.telefon,
      kepakaran: teacher.kepakaran ? (typeof teacher.kepakaran === 'string' ? JSON.parse(teacher.kepakaran) : teacher.kepakaran) : []
    }));

    res.json({ success: true, data: formattedTeachers, pagination: { page: parseInt(page), limit: safeLimit, total, pages: Math.ceil(total / safeLimit) } });
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getTeacherById = async (req, res) => {
  try {
    const { ic } = req.params;
    const normalizedPhone = normalizePhone(ic);
    
    const [teachers] = await pool.execute(`
      SELECT u.telefon as ic, u.nama, u.email, u.telefon, u.status, COALESCE(t.kepakaran, '[]') as kepakaran
      FROM users u
      LEFT JOIN teachers t ON u.telefon = t.user_telefon
      WHERE u.telefon = ? AND u.role IN ('teacher', 'staff', 'admin')
    `, [normalizedPhone]);
    
    if (teachers.length === 0) return res.status(404).json({ success: false, message: 'Teacher not found' });
    
    const [classes] = await pool.execute(`
      SELECT c.id, c.nama_kelas, c.level, c.sessions, c.yuran, c.guru_telefon,
        c.kapasiti, c.status, c.jadual, c.created_at, c.updated_at,
        COUNT(DISTINCT s.user_telefon) as student_count
      FROM classes c
      LEFT JOIN students s ON c.id = s.kelas_id
      WHERE c.guru_telefon = ?
      GROUP BY c.id, c.nama_kelas, c.level, c.sessions, c.yuran, c.guru_telefon, c.kapasiti, c.status, c.jadual, c.created_at, c.updated_at
      ORDER BY c.created_at DESC
    `, [normalizedPhone]);
    
    res.json({ success: true, data: {
      ...teachers[0],
      IC: teachers[0].ic,
      kepakaran: teachers[0].kepakaran ? (typeof teachers[0].kepakaran === 'string' ? JSON.parse(teachers[0].kepakaran) : teachers[0].kepakaran) : [],
      classes: classes.map(c => ({ ...c, sessions: typeof c.sessions === 'string' ? JSON.parse(c.sessions) : c.sessions }))
    }});
  } catch (error) {
    console.error('Get teacher error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createTeacher = async (req, res) => {
  try {
    console.log('Creating teacher with data:', req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { nama, ic, telefon, email, password, kepakaran } = req.body;
    const emailValue = email && email.trim() !== '' ? email.trim() : null;
    const normalizedPhone = normalizePhone(telefon || ic);

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [existingUsers] = await connection.execute(
        "SELECT * FROM users WHERE telefon = ?", [normalizedPhone]
      );

      if (existingUsers && existingUsers.length > 0) {
        const existingUser = existingUsers[0];
        const isTeacherOrStaff = existingUser.role === 'teacher' || existingUser.role === 'staff';
        const isAdmin = existingUser.role === 'admin';
        
        const [existingTeacher] = await connection.execute(
          "SELECT * FROM teachers WHERE user_telefon = ?", [normalizedPhone]
        );
        
        if (!existingTeacher || existingTeacher.length === 0) {
          if (isTeacherOrStaff || isAdmin) {
            const updateFields = [];
            const updateValues = [];
            if (nama && nama.trim() !== '') { updateFields.push('nama = ?'); updateValues.push(nama.trim()); }
            if (telefon && telefon.trim() !== '') { updateFields.push('telefon = ?'); updateValues.push(telefon.trim()); }
            if (emailValue) { updateFields.push('email = ?'); updateValues.push(emailValue); }
            if (password && password.trim() !== '') {
              const bcrypt = await import('bcryptjs');
              updateFields.push('password = ?');
              updateValues.push(await bcrypt.default.hash(password, 12));
            }
            if (!isAdmin) { updateFields.push("role = 'teacher'"); }

            const [existingTeacherRole] = await connection.execute(
              "SELECT * FROM user_roles WHERE user_telefon = ? AND role = 'teacher'", [normalizedPhone]
            );
            if (!existingTeacherRole || existingTeacherRole.length === 0) {
              await connection.execute("INSERT INTO user_roles (user_telefon, role) VALUES (?, 'teacher')", [normalizedPhone]);
            }
            if (updateFields.length > 0) {
              await connection.execute(
                `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE telefon = ?`,
                [...updateValues, normalizedPhone]
              );
            }
            await connection.execute(
              `INSERT INTO teachers (user_telefon, kepakaran) VALUES (?, ?)`,
              [normalizedPhone, JSON.stringify(kepakaran || [])]
            );
            if (req.body.kelas_ids && Array.isArray(req.body.kelas_ids)) {
              for (const kelasId of req.body.kelas_ids) {
                await connection.execute('UPDATE classes SET guru_telefon = ? WHERE id = ?', [normalizedPhone, kelasId]);
              }
            }
            await connection.commit();
            const [newTeacher] = await pool.execute(
              `SELECT u.telefon as ic, u.nama, u.email, u.status, u.telefon, t.kepakaran FROM users u JOIN teachers t ON u.telefon = t.user_telefon WHERE u.telefon = ?`,
              [normalizedPhone]
            );
            connection.release();
            return res.status(200).json({
              success: true,
              message: isAdmin ? 'Teacher account created for existing admin user' : 'Teacher record created for existing user',
              data: newTeacher[0]
            });
          } else {
            const updateFields = [];
            const updateValues = [];
            if (nama && nama.trim() !== '') { updateFields.push('nama = ?'); updateValues.push(nama.trim()); }
            if (telefon && telefon.trim() !== '') { updateFields.push('telefon = ?'); updateValues.push(telefon.trim()); }
            if (emailValue) { updateFields.push('email = ?'); updateValues.push(emailValue); }
            if (password && password.trim() !== '') {
              const bcrypt = await import('bcryptjs');
              updateFields.push('password = ?');
              updateValues.push(await bcrypt.default.hash(password, 12));
            }
            if (updateFields.length > 0) {
              await connection.execute(
                `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE telefon = ?`,
                [...updateValues, normalizedPhone]
              );
            }
            await connection.execute(`UPDATE teachers SET kepakaran = ? WHERE user_telefon = ?`, [JSON.stringify(kepakaran || []), normalizedPhone]);
            const [existingTeacherRole] = await connection.execute(
              "SELECT * FROM user_roles WHERE user_telefon = ? AND role = 'teacher'", [normalizedPhone]
            );
            if (!existingTeacherRole || existingTeacherRole.length === 0) {
              await connection.execute("INSERT INTO user_roles (user_telefon, role) VALUES (?, 'teacher')", [normalizedPhone]);
            }
            await connection.commit();
            connection.release();
            return res.status(200).json({ success: true, message: 'Teacher information updated successfully', data: { ic: normalizedPhone, nama: nama || existingUser.nama } });
          }
        } else {
          await connection.rollback();
          connection.release();
          return res.status(400).json({ success: false, message: 'Nombor IC ini sudah didaftarkan dengan peranan lain. Sila gunakan nombor IC lain.' });
        }
      }

      // New user
      if (emailValue) {
        const [existingEmails] = await connection.execute("SELECT * FROM users WHERE email = ?", [emailValue]);
        if (existingEmails && existingEmails.length > 0) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({ success: false, message: 'Emel ini sudah didaftarkan. Sila gunakan emel lain atau log masuk.' });
        }
      }

      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.default.hash(password, 12);
      const registrationStatus = req.user ? 'aktif' : 'pending';
      
      await connection.execute(
        `INSERT INTO users (telefon, nama, email, password, role, status) VALUES (?, ?, ?, ?, 'teacher', ?)`,
        [normalizedPhone, nama, emailValue, hashedPassword, registrationStatus]
      );
      await connection.execute(`INSERT INTO teachers (user_telefon, kepakaran) VALUES (?, ?)`, [normalizedPhone, JSON.stringify(kepakaran)]);
      if (req.body.kelas_ids && Array.isArray(req.body.kelas_ids)) {
        for (const kelasId of req.body.kelas_ids) {
          await connection.execute('UPDATE classes SET guru_telefon = ? WHERE id = ?', [normalizedPhone, kelasId]);
        }
      }
      await connection.commit();

      const [newTeacher] = await pool.execute(
        `SELECT u.telefon as ic, u.nama, u.email, u.status, u.telefon, t.kepakaran FROM users u JOIN teachers t ON u.telefon = t.user_telefon WHERE u.telefon = ?`,
        [normalizedPhone]
      );

      // ✅ Snapshot wrapped in safeSnapshot — won't crash on error
      if (req.user && req.user.role === 'admin') {
        const teacherData = { ...newTeacher[0], kepakaran: typeof newTeacher[0].kepakaran === 'string' ? JSON.parse(newTeacher[0].kepakaran) : newTeacher[0].kepakaran };
        await safeSnapshot({ entityType: 'teacher', entityId: 0, entityIdentifier: ic, operation: 'create', data: teacherData, metadata: { title: nama, nama, operationLabel: 'Cipta guru', redirectPath: `/guru?view=${ic}` }, actorPhone: req.user.telefon });
      }
      
      res.status(201).json({ success: true, message: 'Teacher created successfully', data: newTeacher[0] });
    } catch (error) {
      await connection.rollback();
      console.error('Create teacher error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Create teacher error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateTeacher = async (req, res) => {
  try {
    if (req.body.password !== undefined && req.body.password !== null && req.body.password !== '') {
      const passwordStr = String(req.body.password).trim();
      if (passwordStr.length > 0 && passwordStr.length < 5) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: [{ type: 'field', msg: 'Password must be at least 5 chars long', path: 'password', location: 'body' }] });
      }
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });

    const { ic } = req.params;
    const { nama, telefon, email, kepakaran, password } = req.body;
    const normalizedPhone = normalizePhone(telefon || ic);

    const [existingTeacher] = await pool.execute(
      `SELECT u.telefon as ic, u.nama, u.email, u.status, u.telefon, t.kepakaran FROM users u JOIN teachers t ON u.telefon = t.user_telefon WHERE u.telefon = ?`,
      [normalizedPhone]
    );
    if (existingTeacher.length === 0) return res.status(404).json({ success: false, message: 'Teacher not found' });

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const userUpdates = {};
      if (nama !== undefined) userUpdates.nama = nama;
      if (telefon !== undefined && telefon !== null && telefon !== '') userUpdates.telefon = normalizePhone(telefon.trim());
      if (email !== undefined && email && email.trim() !== '') userUpdates.email = email.trim();
      if (password !== undefined && password && password.trim() !== '') {
        const bcrypt = (await import('bcryptjs')).default;
        userUpdates.password = await bcrypt.hash(password, 12);
      }
      if (Object.keys(userUpdates).length > 0) {
        const setClause = Object.keys(userUpdates).map(f => `${f} = ?`).join(', ');
        await connection.execute(`UPDATE users SET ${setClause} WHERE telefon = ?`, [...Object.values(userUpdates), normalizedPhone]);
      }
      if (kepakaran !== undefined) {
        await connection.execute(`UPDATE teachers SET kepakaran = ? WHERE user_telefon = ?`, [JSON.stringify(kepakaran), normalizedPhone]);
      }
      if (req.body.kelas_ids !== undefined) {
        await connection.execute('UPDATE classes SET guru_telefon = NULL WHERE guru_telefon = ?', [normalizedPhone]);
        if (Array.isArray(req.body.kelas_ids) && req.body.kelas_ids.length > 0) {
          for (const kelasId of req.body.kelas_ids) {
            await connection.execute('UPDATE classes SET guru_telefon = ? WHERE id = ?', [normalizedPhone, kelasId]);
          }
        }
      }
      await connection.commit();

      const [updatedTeacher] = await pool.execute(
        `SELECT u.telefon as ic, u.nama, u.email, u.status, u.telefon, t.kepakaran FROM users u JOIN teachers t ON u.telefon = t.user_telefon WHERE u.telefon = ?`,
        [normalizedPhone]
      );

      // ✅ safeSnapshot
      if (req.user && req.user.role === 'admin') {
        const previousData = { ...existingTeacher[0], kepakaran: typeof existingTeacher[0].kepakaran === 'string' ? JSON.parse(existingTeacher[0].kepakaran) : existingTeacher[0].kepakaran };
        await safeSnapshot({ entityType: 'teacher', entityId: 0, entityIdentifier: ic, operation: 'update', data: previousData, metadata: { title: previousData.nama, nama: previousData.nama, operationLabel: 'Kemas kini guru', redirectPath: `/guru?view=${ic}` }, actorPhone: req.user.telefon });
      }
      
      res.json({ success: true, message: 'Teacher updated successfully', data: updatedTeacher[0] });
    } catch (error) {
      await connection.rollback();
      console.error('Update teacher error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Update teacher error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteTeacher = async (req, res) => {
  try {
    const { ic } = req.params;
    const normalizedPhone = normalizePhone(ic);
    
    const [existingTeacher] = await pool.execute(
      `SELECT u.telefon as ic, u.nama, u.email, u.status, u.telefon, t.kepakaran FROM users u JOIN teachers t ON u.telefon = t.user_telefon WHERE u.telefon = ? AND u.role IN ('teacher', 'staff')`,
      [normalizedPhone]
    );
    if (existingTeacher.length === 0) return res.status(404).json({ success: false, message: 'Teacher not found' });

    // ✅ safeSnapshot
    if (req.user && req.user.role === 'admin') {
      const teacherData = { ...existingTeacher[0], kepakaran: typeof existingTeacher[0].kepakaran === 'string' ? JSON.parse(existingTeacher[0].kepakaran) : existingTeacher[0].kepakaran };
      await safeSnapshot({ entityType: 'teacher', entityId: 0, entityIdentifier: ic, operation: 'delete', data: teacherData, metadata: { title: teacherData.nama, nama: teacherData.nama, operationLabel: 'Padam guru', redirectPath: '/guru' }, actorPhone: req.user.telefon });
    }
    
    const [result] = await pool.execute("DELETE FROM users WHERE telefon = ? AND role IN ('teacher', 'staff')", [normalizedPhone]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Teacher not found' });
    
    res.json({ success: true, message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error('Delete teacher error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getTeacherStats = async (req, res) => {
  try {
    const [stats] = await pool.execute(`
      SELECT COUNT(*) as total,
        SUM(CASE WHEN status = 'aktif' THEN 1 ELSE 0 END) as aktif,
        SUM(CASE WHEN status = 'tidak_aktif' THEN 1 ELSE 0 END) as tidak_aktif,
        SUM(CASE WHEN status = 'cuti' THEN 1 ELSE 0 END) as cuti
      FROM users WHERE role IN ('teacher', 'staff')
    `);
    res.json({ success: true, data: stats[0] });
  } catch (error) {
    console.error('Get teacher stats error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const registerTeacher = async (req, res) => {
  try {
    req.skipAuth = true;
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });

    const { nama, ic, telefon, email, password, kepakaran } = req.body;
    const emailValue = email && email.trim() !== '' ? email.trim() : null;
    const normalizedPhone = normalizePhone(telefon || ic);

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [existingUsers] = await connection.execute(
        "SELECT telefon as ic, nama, role, status FROM users WHERE telefon = ?", [normalizedPhone]
      );

      if (existingUsers && existingUsers.length > 0) {
        const existingUser = existingUsers[0];
        const [existingTeacherRoles] = await connection.execute(
          'SELECT id FROM user_roles WHERE user_telefon = ? AND role = ?', [normalizedPhone, 'teacher']
        );
        if (existingUser.role === 'teacher' || existingTeacherRoles.length > 0) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({ success: false, message: 'Nombor IC ini sudah didaftarkan sebagai guru. Sila log masuk atau hubungi pentadbir.' });
        }
      }

      if (emailValue) {
        const [existingEmails] = await connection.execute("SELECT telefon FROM users WHERE email = ?", [emailValue]);
        if (existingEmails && existingEmails.length > 0) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({ success: false, message: 'Emel ini sudah didaftarkan. Sila gunakan emel lain atau log masuk.' });
        }
      }

      if (!password || password.trim() === '') {
        await connection.rollback(); connection.release();
        return res.status(400).json({ success: false, message: 'Kata laluan diperlukan untuk pendaftaran guru.' });
      }
      if (password.length < 5) {
        await connection.rollback(); connection.release();
        return res.status(400).json({ success: false, message: 'Kata laluan mestilah sekurang-kurangnya 5 aksara.' });
      }
      if (!kepakaran || !Array.isArray(kepakaran) || kepakaran.length === 0) {
        await connection.rollback(); connection.release();
        return res.status(400).json({ success: false, message: 'Sila pilih sekurang-kurangnya satu kepakaran.' });
      }

      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.default.hash(password, 12);

      if (existingUsers && existingUsers.length > 0) {
        const updateFields = ['nama = ?', 'password = ?'];
        const updateParams = [nama.trim(), hashedPassword];
        if (emailValue) { updateFields.push('email = ?'); updateParams.push(emailValue); }
        if (telefon && telefon.trim() !== '') { updateFields.push('telefon = ?'); updateParams.push(normalizePhone(telefon.trim())); }

        await connection.execute(`UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE telefon = ?`, [...updateParams, normalizedPhone]);
        await connection.execute('INSERT IGNORE INTO user_roles (user_telefon, role) VALUES (?, ?)', [normalizedPhone, 'teacher']);

        const [existingTeacher] = await connection.execute('SELECT user_telefon FROM teachers WHERE user_telefon = ?', [normalizedPhone]);
        if (existingTeacher.length === 0) {
          await connection.execute(`INSERT INTO teachers (user_telefon, kepakaran) VALUES (?, ?)`, [normalizedPhone, JSON.stringify(kepakaran)]);
        } else {
          await connection.execute(`UPDATE teachers SET kepakaran = ? WHERE user_telefon = ?`, [JSON.stringify(kepakaran), normalizedPhone]);
        }
        await connection.commit();

        const [newTeacher] = await pool.execute(
          `SELECT u.telefon as ic, u.nama, u.email, u.status, u.telefon, t.kepakaran, u.created_at FROM users u JOIN teachers t ON u.telefon = t.user_telefon WHERE u.telefon = ?`,
          [normalizedPhone]
        );
        const teacherData = { ...newTeacher[0], kepakaran: typeof newTeacher[0].kepakaran === 'string' ? JSON.parse(newTeacher[0].kepakaran) : newTeacher[0].kepakaran };
        connection.release();
        return res.status(201).json({ success: true, message: 'Peranan guru telah ditambahkan. Permohonan anda sedang menunggu kelulusan pentadbir.', data: teacherData });
      }

      await connection.execute(
        `INSERT INTO users (telefon, nama, email, password, role, status) VALUES (?, ?, ?, ?, 'teacher', 'pending')`,
        [normalizedPhone, nama.trim(), emailValue, hashedPassword]
      );
      await connection.execute(`INSERT INTO teachers (user_telefon, kepakaran) VALUES (?, ?)`, [normalizedPhone, JSON.stringify(kepakaran)]);
      await connection.commit();

      const [newTeacher] = await pool.execute(
        `SELECT u.telefon as ic, u.nama, u.email, u.status, u.telefon, t.kepakaran, u.created_at FROM users u JOIN teachers t ON u.telefon = t.user_telefon WHERE u.telefon = ?`,
        [normalizedPhone]
      );
      const teacherData = { ...newTeacher[0], kepakaran: typeof newTeacher[0].kepakaran === 'string' ? JSON.parse(newTeacher[0].kepakaran) : newTeacher[0].kepakaran };
      connection.release();
      res.status(201).json({ success: true, message: 'Pendaftaran berjaya! Permohonan anda sedang menunggu kelulusan pentadbir.', data: teacherData });
    } catch (error) {
      await connection.rollback();
      console.error('Register teacher error:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        if (error.sqlMessage.includes('email')) return res.status(400).json({ success: false, message: 'Emel ini sudah didaftarkan.' });
        if (error.sqlMessage.includes('PRIMARY')) return res.status(400).json({ success: false, message: 'Nombor IC ini sudah didaftarkan.' });
      }
      res.status(500).json({ success: false, message: 'Ralat dalaman pelayan. Sila cuba lagi kemudian.' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Register teacher error:', error);
    res.status(500).json({ success: false, message: 'Ralat dalaman pelayan. Sila cuba lagi kemudian.' });
  }
};

export const getUnassignedStaffTeachers = async (req, res) => {
  try {
    const { search, page = 1, limit = 10000 } = req.query;
    const defaultLimit = parseInt(limit) || 10000;
    let query = `
      SELECT DISTINCT u.telefon, u.nama, u.email, u.status, u.role, u.created_at,
        CASE WHEN t.user_telefon IS NOT NULL THEN 1 ELSE 0 END as has_teacher_entry
      FROM users u
      LEFT JOIN teachers t ON REPLACE(REPLACE(u.telefon, '-', ''), ' ', '') = REPLACE(REPLACE(t.user_telefon, '-', ''), ' ', '')
      WHERE u.role IN ('teacher', 'staff', 'admin') OR t.user_telefon IS NOT NULL
    `;
    const queryParams = [];
    if (search) { query += ` AND (u.nama LIKE ? OR u.telefon LIKE ?)`; queryParams.push(`%${search}%`, `%${search}%`); }
    const { limit: safeLimit, offset } = getSafePagination(page, defaultLimit, 1, defaultLimit);
    query += ` ORDER BY u.created_at DESC LIMIT ${safeLimit} OFFSET ${offset}`;
    const [users] = await pool.execute(query, queryParams);

    let countQuery = `SELECT COUNT(DISTINCT u.telefon) as total FROM users u LEFT JOIN teachers t ON REPLACE(REPLACE(u.telefon, '-', ''), ' ', '') = REPLACE(REPLACE(t.user_telefon, '-', ''), ' ', '') WHERE u.role IN ('teacher', 'staff', 'admin') OR t.user_telefon IS NOT NULL`;
    const countParams = [];
    if (search) { countQuery += ` AND (u.nama LIKE ? OR u.telefon LIKE ?)`; countParams.push(`%${search}%`, `%${search}%`); }
    const [countResult] = await pool.execute(countQuery, countParams);

    res.json({ success: true, data: users, pagination: { page: parseInt(page), limit: safeLimit, total: countResult[0].total, pages: Math.ceil(countResult[0].total / safeLimit) } });
  } catch (error) {
    console.error('Get unassigned staff/teachers error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const convertUserToTeacher = async (req, res) => {
  try {
    const { ic, kepakaran = [] } = req.body;
    if (!ic) return res.status(400).json({ success: false, message: 'Nombor telefon diperlukan' });
    
    const normalizedIC = ic.replace(/[-\s]/g, '');
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      const [users] = await connection.execute(
        "SELECT * FROM users WHERE REPLACE(REPLACE(telefon, '-', ''), ' ', '') = ? AND role IN ('teacher', 'staff')",
        [normalizedIC]
      );
      if (users.length === 0) {
        await connection.rollback(); connection.release();
        return res.status(404).json({ success: false, message: 'User not found or does not have staff/teacher role' });
      }
      const user = users[0];

      const [existingTeacher] = await connection.execute(
        "SELECT * FROM teachers WHERE REPLACE(REPLACE(user_telefon, '-', ''), ' ', '') = ?", [normalizedIC]
      );
      if (existingTeacher && existingTeacher.length > 0) {
        await connection.rollback(); connection.release();
        return res.status(400).json({ success: false, message: 'User is already a teacher' });
      }
      if (user.role === 'staff') {
        await connection.execute("UPDATE users SET role = 'teacher', updated_at = CURRENT_TIMESTAMP WHERE telefon = ?", [user.telefon]);
      }
      await connection.execute(`INSERT INTO teachers (user_telefon, kepakaran) VALUES (?, ?)`, [user.telefon, JSON.stringify(kepakaran || [])]);
      await connection.commit();

      const [newTeacher] = await pool.execute(
        `SELECT u.telefon, u.nama, u.email, u.status, u.role, t.kepakaran FROM users u JOIN teachers t ON u.telefon = t.user_telefon WHERE REPLACE(REPLACE(u.telefon, '-', ''), ' ', '') = ?`,
        [normalizedIC]
      );
      const teacherData = { ...newTeacher[0], kepakaran: typeof newTeacher[0].kepakaran === 'string' ? JSON.parse(newTeacher[0].kepakaran) : newTeacher[0].kepakaran };

      // ✅ safeSnapshot
      if (req.user && req.user.role === 'admin') {
        await safeSnapshot({ entityType: 'teacher', entityId: 0, entityIdentifier: user.telefon, operation: 'create', data: teacherData, metadata: { title: user.nama, nama: user.nama, operationLabel: 'Tukar pengguna kepada guru', redirectPath: `/guru?view=${user.telefon}` }, actorPhone: req.user.telefon });
      }
      
      connection.release();
      res.status(200).json({ success: true, message: 'User successfully converted to teacher', data: teacherData });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Convert user to teacher error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
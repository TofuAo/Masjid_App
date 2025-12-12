import { pool, testConnection } from '../config/database.js';
import { validationResult } from 'express-validator';
import { createSnapshot, SNAPSHOT_TTL_HOURS } from '../utils/adminActionSnapshots.js';
import { normalizePhone } from '../utils/phoneNormalizer.js';

export const getAllTeachers = async (req, res) => {
  try {
    const { search, status, page = 1, limit } = req.query;
    // Default to a large limit to show all teachers, or use pagination if specified
    const defaultLimit = limit ? parseInt(limit) : 1000;
    
    // Add pagination (inline to avoid ER_WRONG_ARGUMENTS on LIMIT/OFFSET)
    const safeLimit = Math.max(1, defaultLimit);
    const offset = (Math.max(1, parseInt(page)) - 1) * safeLimit;
    
    // Use subquery to pick one user per normalized IC (prefer hyphenated format)
    // This handles duplicate user entries with same IC but different formats
    // Include users who:
    // 1. Have role 'teacher' or 'staff' in users table, OR
    // 2. Have role 'admin' AND have an entry in teachers table, OR
    // 3. Have role 'admin' AND have 'teacher' role in user_roles table
    let query = `
      SELECT 
        u.ic, u.nama, u.email, u.telefon, u.status, 
        COALESCE(t.kepakaran, '[]') as kepakaran, 
        COUNT(DISTINCT c.id) as total_classes
      FROM (
        SELECT 
          u2.*,
          ROW_NUMBER() OVER (
            PARTITION BY REPLACE(REPLACE(u2.ic, '-', ''), ' ', '') 
            ORDER BY (CASE WHEN u2.role = 'teacher' THEN 0 WHEN u2.role = 'staff' THEN 1 ELSE 2 END), (CASE WHEN u2.ic LIKE '%-%' THEN 0 ELSE 1 END), u2.created_at DESC
          ) as rn
        FROM users u2
        WHERE u2.role IN ('teacher', 'staff', 'admin')
      ) u
      LEFT JOIN teachers t ON REPLACE(REPLACE(u.ic, '-', ''), ' ', '') = REPLACE(REPLACE(t.user_ic, '-', ''), ' ', '')
      LEFT JOIN user_roles ur ON REPLACE(REPLACE(u.ic, '-', ''), ' ', '') = REPLACE(REPLACE(ur.user_ic, '-', ''), ' ', '') AND ur.role = 'teacher'
      LEFT JOIN classes c ON REPLACE(REPLACE(u.ic, '-', ''), ' ', '') = REPLACE(REPLACE(c.guru_ic, '-', ''), ' ', '')
      WHERE u.rn = 1 
        AND (
          u.role IN ('teacher', 'staff') 
          OR (u.role = 'admin' AND t.user_ic IS NOT NULL)
          OR (u.role = 'admin' AND ur.user_ic IS NOT NULL)
          OR (u.role = 'admin' AND EXISTS (
            SELECT 1 FROM teachers t2 
            WHERE REPLACE(REPLACE(t2.user_ic, '-', ''), ' ', '') = REPLACE(REPLACE(u.ic, '-', ''), ' ', '')
          ))
        )
    `;
    
    const queryParams = [];
    
    if (search) {
      query += ` AND (u.nama LIKE ? OR u.ic LIKE ?)`;
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm);
    }
    
    if (status) {
      query += ` AND u.status = ?`;
      queryParams.push(status);
    }
    
    query += ` GROUP BY REPLACE(REPLACE(u.ic, '-', ''), ' ', ''), u.ic, u.nama, u.email, u.telefon, u.status, t.kepakaran, u.created_at, ur.user_ic ORDER BY u.created_at DESC LIMIT ${safeLimit} OFFSET ${offset}`;
    
    const [teachers] = await pool.execute(query, queryParams);
    
    // Get total count for pagination (use same deduplication logic)
    let countQuery = `
      SELECT COUNT(DISTINCT REPLACE(REPLACE(u.ic, '-', ''), ' ', '')) as total
      FROM (
        SELECT 
          u2.*,
          ROW_NUMBER() OVER (
            PARTITION BY REPLACE(REPLACE(u2.ic, '-', ''), ' ', '') 
            ORDER BY (CASE WHEN u2.role = 'teacher' THEN 0 WHEN u2.role = 'staff' THEN 1 ELSE 2 END), (CASE WHEN u2.ic LIKE '%-%' THEN 0 ELSE 1 END), u2.created_at DESC
          ) as rn
        FROM users u2
        WHERE (u2.role IN ('teacher', 'staff', 'admin'))
      ) u
      LEFT JOIN teachers t ON REPLACE(REPLACE(u.ic, '-', ''), ' ', '') = REPLACE(REPLACE(t.user_ic, '-', ''), ' ', '')
      LEFT JOIN user_roles ur ON REPLACE(REPLACE(u.ic, '-', ''), ' ', '') = REPLACE(REPLACE(ur.user_ic, '-', ''), ' ', '') AND ur.role = 'teacher'
      WHERE u.rn = 1 
        AND (
          u.role IN ('teacher', 'staff') 
          OR (u.role = 'admin' AND t.user_ic IS NOT NULL)
          OR (u.role = 'admin' AND ur.user_ic IS NOT NULL)
          OR (u.role = 'admin' AND EXISTS (
            SELECT 1 FROM teachers t2 
            WHERE REPLACE(REPLACE(t2.user_ic, '-', ''), ' ', '') = REPLACE(REPLACE(u.ic, '-', ''), ' ', '')
          ))
        )
    `;
    const countParams = [];
    
    if (search) {
      countQuery += ` AND (u.nama LIKE ? OR u.ic LIKE ?)`;
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm);
    }
    
    if (status) {
      countQuery += ` AND u.status = ?`;
      countParams.push(status);
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    // Format teachers data
    const formattedTeachers = teachers.map(teacher => ({
      ...teacher,
      IC: teacher.ic || teacher.IC, // Add uppercase IC for frontend compatibility (handle both cases)
      ic: teacher.ic || teacher.IC, // Ensure lowercase ic exists
      kepakaran: teacher.kepakaran ? (typeof teacher.kepakaran === 'string' ? JSON.parse(teacher.kepakaran) : teacher.kepakaran) : []
    }));

    // Debug: Log all staff/teacher roles found
    const roleCounts = formattedTeachers.reduce((acc, t) => {
      acc[t.role] = (acc[t.role] || 0) + 1;
      return acc;
    }, {});
    console.log(`✅ [getAllTeachers] Found ${formattedTeachers.length} teachers. Role breakdown:`, roleCounts);
    
    // Debug: Check if Amir user is in results
    const amirUser = formattedTeachers.find(t => 
      t.nama && (t.nama.includes('AMIR') || t.nama.includes('Amir')) ||
      (t.ic && t.ic.includes('920312'))
    );
    if (amirUser) {
      console.log('✅ [getAllTeachers] Amir user found:', {
        ic: amirUser.ic,
        IC: amirUser.IC,
        nama: amirUser.nama,
        role: amirUser.role,
        totalClasses: amirUser.total_classes
      });
    } else {
      console.log('⚠️ [getAllTeachers] Amir user NOT found in results. Total teachers:', formattedTeachers.length);
      console.log('Sample teachers:', formattedTeachers.slice(0, 3).map(t => ({ nama: t.nama, role: t.role })));
    }

    res.json({
      success: true,
      data: formattedTeachers,
      pagination: {
        page: parseInt(page),
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit)
      }
    });
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getTeacherById = async (req, res) => {
  try {
    const { ic } = req.params;
    
    const [teachers] = await pool.execute(`
      SELECT u.ic, u.nama, u.email, u.telefon, u.status, COALESCE(t.kepakaran, '[]') as kepakaran
      FROM users u
      LEFT JOIN teachers t ON u.ic = t.user_ic
      WHERE u.ic = ? AND u.role IN ('teacher', 'staff')
    `, [ic]);
    
    if (teachers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }
    
    // Get teacher's classes
    const [classes] = await pool.execute(`
      SELECT 
        c.id, 
        c.nama_kelas, 
        c.level, 
        c.sessions, 
        c.yuran, 
        c.guru_ic, 
        c.kapasiti, 
        c.status, 
        c.jadual,
        c.created_at,
        c.updated_at,
        COUNT(DISTINCT s.user_ic) as student_count
      FROM classes c
      LEFT JOIN students s ON c.id = s.kelas_id
      WHERE c.guru_ic = ?
      GROUP BY c.id, c.nama_kelas, c.level, c.sessions, c.yuran, c.guru_ic, c.kapasiti, c.status, c.jadual, c.created_at, c.updated_at
      ORDER BY c.created_at DESC
    `, [ic]);
    
    const teacherData = {
      ...teachers[0],
      IC: teachers[0].ic,
      kepakaran: teachers[0].kepakaran ? (typeof teachers[0].kepakaran === 'string' ? JSON.parse(teachers[0].kepakaran) : teachers[0].kepakaran) : [],
      classes: classes.map(c => ({
        ...c,
        sessions: typeof c.sessions === 'string' ? JSON.parse(c.sessions) : c.sessions
      }))
    };

    res.json({
      success: true,
      data: teacherData
    });
  } catch (error) {
    console.error('Get teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const createTeacher = async (req, res) => {
  try {
    console.log('Creating teacher with data:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { nama, ic, telefon, email, password, kepakaran } = req.body;
    const emailValue = email && email.trim() !== '' ? email.trim() : null;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Normalize IC for comparison (remove hyphens and spaces)
      const normalizedIC = ic.replace(/[-\s]/g, '');
      
      // Check if user already exists (compare normalized ICs)
      const [existingUsers] = await connection.execute(
        "SELECT * FROM users WHERE REPLACE(REPLACE(ic, '-', ''), ' ', '') = ?",
        [normalizedIC]
      );

      if (existingUsers && existingUsers.length > 0) {
        const existingUser = existingUsers[0];
        
        // Check if user has teacher/staff role but no teachers table entry
        // Also allow admin users to have teacher accounts created
        const isTeacherOrStaff = existingUser.role === 'teacher' || existingUser.role === 'staff';
        const isAdmin = existingUser.role === 'admin';
        
        // Check if teachers table entry exists (compare normalized ICs)
        const [existingTeacher] = await connection.execute(
          "SELECT * FROM teachers WHERE REPLACE(REPLACE(user_ic, '-', ''), ' ', '') = ?",
          [normalizedIC]
        );
        
        // If no teachers table entry, create it and update user info
        // Allow creating teacher entry for admin users too
        if (!existingTeacher || existingTeacher.length === 0) {
          if (isTeacherOrStaff || isAdmin) {
            // Update user information if provided
            const updateFields = [];
            const updateValues = [];
            
            if (nama && nama.trim() !== '') {
              updateFields.push('nama = ?');
              updateValues.push(nama.trim());
            }
            if (telefon && telefon.trim() !== '') {
              updateFields.push('telefon = ?');
              updateValues.push(telefon.trim());
            }
            if (emailValue && emailValue.trim() !== '') {
              updateFields.push('email = ?');
              updateValues.push(emailValue.trim());
            }
            if (password && password.trim() !== '') {
              const bcrypt = await import('bcryptjs');
              const hashedPassword = await bcrypt.default.hash(password, 12);
              updateFields.push('password = ?');
              updateValues.push(hashedPassword);
            }
            // For admin users, keep admin role but ensure teacher role exists in user_roles
            // For teacher/staff, set role to 'teacher'
            if (!isAdmin) {
              updateFields.push("role = 'teacher'");
            }
            // Add teacher role to user_roles table if not exists
            const [existingTeacherRole] = await connection.execute(
              "SELECT * FROM user_roles WHERE REPLACE(REPLACE(user_ic, '-', ''), ' ', '') = ? AND role = 'teacher'",
              [normalizedIC]
            );
            if (!existingTeacherRole || existingTeacherRole.length === 0) {
              await connection.execute(
                "INSERT INTO user_roles (user_ic, role) VALUES (?, 'teacher')",
                [existingUser.ic]
              );
            }
            
            if (updateFields.length > 0) {
              // Use the existing user's IC format (with or without hyphens) for update
              const updateQuery = `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE REPLACE(REPLACE(ic, '-', ''), ' ', '') = ?`;
              await connection.execute(updateQuery, [...updateValues, normalizedIC]);
            }
            
            // Create teachers table entry using the existing user's IC format
            await connection.execute(
              `INSERT INTO teachers (user_ic, kepakaran) 
               VALUES (?, ?)`,
              [existingUser.ic, JSON.stringify(kepakaran || [])]
            );
            
            // Assign classes to teacher if provided (use existing user's IC format)
            if (req.body.kelas_ids && Array.isArray(req.body.kelas_ids) && req.body.kelas_ids.length > 0) {
              for (const kelasId of req.body.kelas_ids) {
                await connection.execute(
                  'UPDATE classes SET guru_ic = ? WHERE id = ?',
                  [existingUser.ic, kelasId]
                );
              }
            }
            
            await connection.commit();
            
            const [newTeacher] = await pool.execute(`
              SELECT u.ic, u.nama, u.email, u.status, u.telefon, t.kepakaran
              FROM users u
              JOIN teachers t ON u.ic = t.user_ic
              WHERE REPLACE(REPLACE(u.ic, '-', ''), ' ', '') = ?
            `, [normalizedIC]);
            
            res.status(200).json({
              success: true,
              message: isAdmin 
                ? 'Teacher account created successfully for existing admin user' 
                : 'Teacher record created successfully for existing user',
              data: newTeacher[0]
            });
            
            connection.release();
            return;
          } else {
            // Teacher entry already exists - update if needed
            // Update user information if provided
            const updateFields = [];
            const updateValues = [];
            
            if (nama && nama.trim() !== '') {
              updateFields.push('nama = ?');
              updateValues.push(nama.trim());
            }
            if (telefon && telefon.trim() !== '') {
              updateFields.push('telefon = ?');
              updateValues.push(telefon.trim());
            }
            if (emailValue && emailValue.trim() !== '') {
              updateFields.push('email = ?');
              updateValues.push(emailValue.trim());
            }
            if (password && password.trim() !== '') {
              const bcrypt = await import('bcryptjs');
              const hashedPassword = await bcrypt.default.hash(password, 12);
              updateFields.push('password = ?');
              updateValues.push(hashedPassword);
            }
            
            if (updateFields.length > 0) {
              const updateQuery = `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE REPLACE(REPLACE(ic, '-', ''), ' ', '') = ?`;
              await connection.execute(updateQuery, [...updateValues, normalizedIC]);
            }
            
            // Update teachers table entry
            await connection.execute(
              `UPDATE teachers SET kepakaran = ? WHERE REPLACE(REPLACE(user_ic, '-', ''), ' ', '') = ?`,
              [JSON.stringify(kepakaran || []), normalizedIC]
            );
            
            // Ensure teacher role exists in user_roles
            const [existingTeacherRole] = await connection.execute(
              "SELECT * FROM user_roles WHERE REPLACE(REPLACE(user_ic, '-', ''), ' ', '') = ? AND role = 'teacher'",
              [normalizedIC]
            );
            if (!existingTeacherRole || existingTeacherRole.length === 0) {
              await connection.execute(
                "INSERT INTO user_roles (user_ic, role) VALUES (?, 'teacher')",
                [existingUser.ic]
              );
            }
            
            await connection.commit();
            connection.release();
            
            return res.status(200).json({
              success: true,
              message: 'Teacher information updated successfully',
              data: { ic: existingUser.ic, nama: nama || existingUser.nama }
            });
          }
        } else {
          // User exists but not as teacher/staff/admin - cannot create teacher account
          await connection.rollback();
          connection.release();
          return res.status(400).json({
            success: false,
            message: 'Nombor IC ini sudah didaftarkan dengan peranan lain. Sila gunakan nombor IC lain.'
          });
        }
      }

      // Check if email already exists (if provided)
      if (email && email.trim() !== '') {
        const [existingEmails] = await connection.execute(
          "SELECT * FROM users WHERE email = ?",
          [email.trim()]
        );

        if (existingEmails && existingEmails.length > 0) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: 'Emel ini sudah didaftarkan. Sila gunakan emel lain atau log masuk.'
          });
        }
      }

      // Hash password
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.default.hash(password, 12);

      // Insert into users table (email is optional)
      // For public registration, set status to 'pending' - requires admin approval
      const emailValue = email && email.trim() !== '' ? email : null;
      // Default to 'aktif' for admin-created teachers, 'pending' for public registration
      const registrationStatus = req.user ? 'aktif' : 'pending';
      
      await connection.execute(
        `INSERT INTO users (ic, nama, telefon, email, password, role, status) 
         VALUES (?, ?, ?, ?, ?, 'teacher', ?)`,
        [ic, nama, telefon ? normalizePhone(telefon.trim()) : null, emailValue, hashedPassword, registrationStatus]
      );

      // Insert into teachers table
      await connection.execute(
        `INSERT INTO teachers (user_ic, kepakaran) 
         VALUES (?, ?)`,
        [ic, JSON.stringify(kepakaran)]
      );

      // Assign classes to teacher if provided
      if (req.body.kelas_ids && Array.isArray(req.body.kelas_ids) && req.body.kelas_ids.length > 0) {
        for (const kelasId of req.body.kelas_ids) {
          await connection.execute(
            'UPDATE classes SET guru_ic = ? WHERE id = ?',
            [ic, kelasId]
          );
        }
      }

      await connection.commit();

      const [newTeacher] = await pool.execute(`
        SELECT u.ic, u.nama, u.email, u.status, u.telefon, t.kepakaran
        FROM users u
        JOIN teachers t ON u.ic = t.user_ic
        WHERE u.ic = ?
      `, [ic]);

      // Log admin action for undo capability
      if (req.user && req.user.role === 'admin') {
        const teacherData = {
          ...newTeacher[0],
          kepakaran: typeof newTeacher[0].kepakaran === 'string' 
            ? JSON.parse(newTeacher[0].kepakaran) 
            : newTeacher[0].kepakaran
        };
        
        await createSnapshot({
          entityType: 'teacher',
          entityId: 0,
          entityIdentifier: ic,
          operation: 'create',
          data: teacherData,
          metadata: {
            title: nama,
            nama,
            operationLabel: 'Cipta guru',
            redirectPath: `/guru?view=${ic}`
          },
          actorIc: req.user.ic
        });
      }
      
      res.status(201).json({
        success: true,
        message: 'Teacher created successfully',
        data: newTeacher[0]
      });
    } catch (error) {
      await connection.rollback();
      console.error('Create teacher error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Create teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateTeacher = async (req, res) => {
  try {
    // Validate password if provided
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
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { ic } = req.params;
    const { nama, telefon, email, kepakaran, password } = req.body;

    // Fetch existing teacher data before update for snapshot
    const [existingTeacher] = await pool.execute(`
      SELECT u.ic, u.nama, u.email, u.status, u.telefon, t.kepakaran
      FROM users u
      JOIN teachers t ON u.ic = t.user_ic
      WHERE u.ic = ?
    `, [ic]);

    if (existingTeacher.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Build dynamic UPDATE query for users table - only update provided fields
      const userUpdates = {};
      if (nama !== undefined) userUpdates.nama = nama;
      if (telefon !== undefined && telefon !== null && telefon !== '') {
        userUpdates.telefon = normalizePhone(telefon.trim());
      }
      // Only update email if provided and not empty
      if (email !== undefined && email && email.trim() !== '') {
        userUpdates.email = email.trim();
      }
      if (password !== undefined && password && password.trim() !== '') {
        // Hash password if provided
        const bcrypt = (await import('bcryptjs')).default;
        userUpdates.password = await bcrypt.hash(password, 12);
      }

      if (Object.keys(userUpdates).length > 0) {
        const userFields = Object.keys(userUpdates);
        const userValues = Object.values(userUpdates);
        const userSetClause = userFields.map(field => `${field} = ?`).join(', ');
        
        await connection.execute(
          `UPDATE users SET ${userSetClause} WHERE ic = ?`,
          [...userValues, ic]
        );
      }

      // Update teachers table if kepakaran is provided
      if (kepakaran !== undefined) {
        await connection.execute(
          `UPDATE teachers SET kepakaran = ? WHERE user_ic = ?`,
          [JSON.stringify(kepakaran), ic]
        );
      }

      // Update class assignments if kelas_ids is provided
      if (req.body.kelas_ids !== undefined) {
        // First, remove teacher from all classes
        await connection.execute(
          'UPDATE classes SET guru_ic = NULL WHERE guru_ic = ?',
          [ic]
        );
        
        // Then assign teacher to selected classes
        if (Array.isArray(req.body.kelas_ids) && req.body.kelas_ids.length > 0) {
          for (const kelasId of req.body.kelas_ids) {
            await connection.execute(
              'UPDATE classes SET guru_ic = ? WHERE id = ?',
              [ic, kelasId]
            );
          }
        }
      }

      await connection.commit();

      const [updatedTeacher] = await pool.execute(`
        SELECT u.ic, u.nama, u.email, u.status, u.telefon, t.kepakaran
        FROM users u
        JOIN teachers t ON u.ic = t.user_ic
        WHERE u.ic = ?
      `, [ic]);

      // Log admin action for undo capability
      if (req.user && req.user.role === 'admin') {
        const previousData = {
          ...existingTeacher[0],
          kepakaran: typeof existingTeacher[0].kepakaran === 'string' 
            ? JSON.parse(existingTeacher[0].kepakaran) 
            : existingTeacher[0].kepakaran
        };
        
        await createSnapshot({
          entityType: 'teacher',
          entityId: 0,
          entityIdentifier: ic,
          operation: 'update',
          data: previousData,
          metadata: {
            title: previousData.nama,
            nama: previousData.nama,
            operationLabel: 'Kemas kini guru',
            redirectPath: `/guru?view=${ic}`
          },
          actorIc: req.user.ic
        });
      }
      
      res.json({
        success: true,
        message: 'Teacher updated successfully',
        data: updatedTeacher[0]
      });
    } catch (error) {
      await connection.rollback();
      console.error('Update teacher error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Update teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deleteTeacher = async (req, res) => {
  try {
    const { ic } = req.params;
    
    // Fetch teacher data before deletion for snapshot
    const [existingTeacher] = await pool.execute(`
      SELECT u.ic, u.nama, u.email, u.status, u.telefon, t.kepakaran
      FROM users u
      JOIN teachers t ON u.ic = t.user_ic
      WHERE u.ic = ? AND u.role IN ('teacher', 'staff')
    `, [ic]);

    if (existingTeacher.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Log admin action for undo capability
    if (req.user && req.user.role === 'admin') {
      const teacherData = {
        ...existingTeacher[0],
        kepakaran: typeof existingTeacher[0].kepakaran === 'string' 
          ? JSON.parse(existingTeacher[0].kepakaran) 
          : existingTeacher[0].kepakaran
      };
      
      await createSnapshot({
        entityType: 'teacher',
        entityId: 0,
        entityIdentifier: ic,
        operation: 'delete',
        data: teacherData,
        metadata: {
          title: teacherData.nama,
          nama: teacherData.nama,
          operationLabel: 'Padam guru',
          redirectPath: '/guru'
        },
        actorIc: req.user.ic
      });
    }
    
    // The ON DELETE CASCADE in the database schema will handle deleting the teacher record.
    // We just need to delete the user record.
    const [result] = await pool.execute("DELETE FROM users WHERE ic = ? AND role IN ('teacher', 'staff')", [ic]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Teacher deleted successfully'
    });
  } catch (error) {
    console.error('Delete teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getTeacherStats = async (req, res) => {
  try {
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'aktif' THEN 1 ELSE 0 END) as aktif,
        SUM(CASE WHEN status = 'tidak_aktif' THEN 1 ELSE 0 END) as tidak_aktif,
        SUM(CASE WHEN status = 'cuti' THEN 1 ELSE 0 END) as cuti
      FROM users
      WHERE role IN ('teacher', 'staff')
    `);
    
    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('Get teacher stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Public teacher registration function
 * Allows teachers to register themselves without authentication
 * Sets status to 'pending' - requires admin approval
 */
export const registerTeacher = async (req, res) => {
  try {
    // Ensure this route skips authentication (set flag if not already set)
    req.skipAuth = true;
    console.log('Teacher registration request received:', { 
      path: req.path,
      originalUrl: req.originalUrl,
      baseUrl: req.baseUrl,
      body: Object.keys(req.body || {})
    });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { nama, ic, telefon, email, password, kepakaran } = req.body;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Check if user already exists by IC
      const [existingUsers] = await connection.execute(
        "SELECT ic, nama, role, status FROM users WHERE ic = ?",
        [ic]
      );

      if (existingUsers && existingUsers.length > 0) {
        const existingUser = existingUsers[0];
        const [existingTeacherRoles] = await connection.execute(
          'SELECT id FROM user_roles WHERE user_ic = ? AND role = ?',
          [ic, 'teacher']
        );

        if (existingUser.role === 'teacher' || existingTeacherRoles.length > 0) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: 'Nombor IC ini sudah didaftarkan sebagai guru. Sila log masuk atau hubungi pentadbir jika anda memerlukan bantuan.'
          });
        }
        // Otherwise allow multi-role flow to proceed
      }

      // Check if email already exists (if provided)
      if (emailValue) {
        const [existingEmails] = await connection.execute(
          "SELECT ic, nama, role FROM users WHERE email = ?",
          [emailValue]
        );

        if (existingEmails && existingEmails.length > 0) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: 'Emel ini sudah didaftarkan. Sila gunakan emel lain atau log masuk dengan akaun yang sedia ada.'
          });
        }
      }

      // Validate password is provided and meets requirements
      if (!password || password.trim() === '') {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Kata laluan diperlukan untuk pendaftaran guru.'
        });
      }

      if (password.length < 5) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Kata laluan mestilah sekurang-kurangnya 5 aksara.'
        });
      }

      // Validate kepakaran is provided and is an array
      if (!kepakaran || !Array.isArray(kepakaran) || kepakaran.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Sila pilih sekurang-kurangnya satu kepakaran.'
        });
      }

      // Hash password
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.default.hash(password, 12);

      if (existingUsers && existingUsers.length > 0) {
        const updateFields = ['nama = ?', 'password = ?'];
        const updateParams = [nama.trim(), hashedPassword];

        if (typeof email !== 'undefined') {
          updateFields.push('email = ?');
          updateParams.push(emailValue);
        }

        if (telefon && telefon.trim() !== '') {
          updateFields.push('telefon = ?');
          updateParams.push(normalizePhone(telefon.trim()));
        }

        await connection.execute(
          `
            UPDATE users
            SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE ic = ?
          `,
          [...updateParams, ic]
        );

        await connection.execute(
          'INSERT INTO user_roles (user_ic, role) VALUES (?, ?)',
          [ic, 'teacher']
        );

        await connection.execute(
          `INSERT INTO teachers (user_ic, kepakaran) 
           VALUES (?, ?)`,
          [ic, JSON.stringify(kepakaran)]
        );

        await connection.commit();

        const [newTeacher] = await pool.execute(`
          SELECT u.ic, u.nama, u.email, u.status, u.telefon, t.kepakaran, u.created_at
          FROM users u
          JOIN teachers t ON u.ic = t.user_ic
          WHERE u.ic = ?
        `, [ic]);

        const teacherData = {
          ...newTeacher[0],
          kepakaran: typeof newTeacher[0].kepakaran === 'string' 
            ? JSON.parse(newTeacher[0].kepakaran) 
            : newTeacher[0].kepakaran
        };

        return res.status(201).json({
          success: true,
          message: 'Peranan guru telah ditambahkan kepada akaun sedia ada. Permohonan anda sedang menunggu kelulusan pentadbir.',
          data: teacherData
        });
      }

      // Insert into users table
      // Email is optional, status is always 'pending' for public registration
      
      await connection.execute(
        `INSERT INTO users (ic, nama, telefon, email, password, role, status) 
         VALUES (?, ?, ?, ?, ?, 'teacher', 'pending')`,
        [ic, nama.trim(), telefon ? normalizePhone(telefon.trim()) : null, emailValue, hashedPassword]
      );

      // Insert into teachers table
      await connection.execute(
        `INSERT INTO teachers (user_ic, kepakaran) 
         VALUES (?, ?)`,
        [ic, JSON.stringify(kepakaran)]
      );

      await connection.commit();

      // Fetch the newly created teacher (without password)
      const [newTeacher] = await pool.execute(`
        SELECT u.ic, u.nama, u.email, u.status, u.telefon, t.kepakaran, u.created_at
        FROM users u
        JOIN teachers t ON u.ic = t.user_ic
        WHERE u.ic = ?
      `, [ic]);
      
      const teacherData = {
        ...newTeacher[0],
        kepakaran: typeof newTeacher[0].kepakaran === 'string' 
          ? JSON.parse(newTeacher[0].kepakaran) 
          : newTeacher[0].kepakaran
      };

      console.log('Teacher registered successfully:', { ic, nama, status: 'pending' });

      res.status(201).json({
        success: true,
        message: 'Pendaftaran berjaya! Permohonan anda sedang menunggu kelulusan daripada pentadbir. Anda akan dimaklumkan selepas kelulusan.',
        data: teacherData
      });
    } catch (error) {
      await connection.rollback();
      console.error('Register teacher error:', error);
      
      // Handle duplicate entry errors
      if (error.code === 'ER_DUP_ENTRY') {
        if (error.sqlMessage.includes('email')) {
          return res.status(400).json({
            success: false,
            message: 'Emel ini sudah didaftarkan. Sila gunakan emel lain.'
          });
        }
        if (error.sqlMessage.includes('PRIMARY')) {
          return res.status(400).json({
            success: false,
            message: 'Nombor IC ini sudah didaftarkan. Sila log masuk atau gunakan nombor IC lain.'
          });
        }
      }
      
      res.status(500).json({
        success: false,
        message: 'Ralat dalaman pelayan. Sila cuba lagi kemudian.'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Register teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Ralat dalaman pelayan. Sila cuba lagi kemudian.'
    });
  }
};

// Get all users with staff/teacher role OR users who have teachers table entry
export const getUnassignedStaffTeachers = async (req, res) => {
  try {
    const { search, page = 1, limit = 10000 } = req.query; // Increased default limit to show all users
    const defaultLimit = parseInt(limit) || 10000;
    
    // Get all users who either:
    // 1. Have role 'teacher' or 'staff', OR
    // 2. Have an entry in the teachers table (regardless of role - e.g., admin who is also a teacher)
    let query = `
      SELECT DISTINCT u.ic, u.nama, u.email, u.telefon, u.status, u.role, u.created_at,
             CASE WHEN t.user_ic IS NOT NULL THEN 1 ELSE 0 END as has_teacher_entry
      FROM users u
      LEFT JOIN teachers t ON REPLACE(REPLACE(u.ic, '-', ''), ' ', '') = REPLACE(REPLACE(t.user_ic, '-', ''), ' ', '')
      WHERE u.role IN ('teacher', 'staff', 'admin') OR t.user_ic IS NOT NULL
    `;
    
    const queryParams = [];
    
    if (search) {
      query += ` AND (u.nama LIKE ? OR u.ic LIKE ?)`;
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm);
    }
    
    // Add pagination (but with very high limit to show all)
    const safeLimit = Math.max(1, defaultLimit);
    const offset = (Math.max(1, parseInt(page)) - 1) * safeLimit;
    query += ` ORDER BY u.created_at DESC LIMIT ${safeLimit} OFFSET ${offset}`;
    
    const [users] = await pool.execute(query, queryParams);
    
    // Get total count
    let countQuery = `
      SELECT COUNT(DISTINCT u.ic) as total
      FROM users u
      LEFT JOIN teachers t ON REPLACE(REPLACE(u.ic, '-', ''), ' ', '') = REPLACE(REPLACE(t.user_ic, '-', ''), ' ', '')
      WHERE u.role IN ('teacher', 'staff', 'admin') OR t.user_ic IS NOT NULL
    `;
    const countParams = [];
    
    if (search) {
      countQuery += ` AND (u.nama LIKE ? OR u.ic LIKE ?)`;
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm);
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit)
      }
    });
  } catch (error) {
    console.error('Get unassigned staff/teachers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Convert a user with staff/teacher role to a teacher (create teachers table entry)
export const convertUserToTeacher = async (req, res) => {
  try {
    const { ic, kepakaran = [] } = req.body;
    
    if (!ic) {
      return res.status(400).json({
        success: false,
        message: 'IC number is required'
      });
    }
    
    // Normalize IC for comparison
    const normalizedIC = ic.replace(/[-\s]/g, '');
    
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Find user by normalized IC
      const [users] = await connection.execute(
        "SELECT * FROM users WHERE REPLACE(REPLACE(ic, '-', ''), ' ', '') = ? AND role IN ('teacher', 'staff')",
        [normalizedIC]
      );
      
      if (users.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({
          success: false,
          message: 'User not found or does not have staff/teacher role'
        });
      }
      
      const user = users[0];
      
      // Check if teachers table entry already exists
      const [existingTeacher] = await connection.execute(
        "SELECT * FROM teachers WHERE REPLACE(REPLACE(user_ic, '-', ''), ' ', '') = ?",
        [normalizedIC]
      );
      
      if (existingTeacher && existingTeacher.length > 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: 'User is already a teacher'
        });
      }
      
      // Update role to 'teacher' if it's 'staff'
      if (user.role === 'staff') {
        await connection.execute(
          "UPDATE users SET role = 'teacher', updated_at = CURRENT_TIMESTAMP WHERE REPLACE(REPLACE(ic, '-', ''), ' ', '') = ?",
          [normalizedIC]
        );
      }
      
      // Create teachers table entry
      await connection.execute(
        `INSERT INTO teachers (user_ic, kepakaran) 
         VALUES (?, ?)`,
        [user.ic, JSON.stringify(kepakaran || [])]
      );
      
      await connection.commit();
      
      // Fetch the newly created teacher
      const [newTeacher] = await pool.execute(`
        SELECT u.ic, u.nama, u.email, u.status, u.telefon, u.role, t.kepakaran
        FROM users u
        JOIN teachers t ON u.ic = t.user_ic
        WHERE REPLACE(REPLACE(u.ic, '-', ''), ' ', '') = ?
      `, [normalizedIC]);
      
      const teacherData = {
        ...newTeacher[0],
        kepakaran: typeof newTeacher[0].kepakaran === 'string' 
          ? JSON.parse(newTeacher[0].kepakaran) 
          : newTeacher[0].kepakaran
      };
      
      // Log admin action for undo capability
      if (req.user && req.user.role === 'admin') {
        await createSnapshot({
          entityType: 'teacher',
          entityId: 0,
          entityIdentifier: user.ic,
          operation: 'create',
          data: teacherData,
          metadata: {
            title: user.nama,
            nama: user.nama,
            operationLabel: 'Tukar pengguna kepada guru',
            redirectPath: `/guru?view=${user.ic}`
          },
          actorIc: req.user.ic
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'User successfully converted to teacher',
        data: teacherData
      });
      
      connection.release();
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Convert user to teacher error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

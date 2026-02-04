import { pool, testConnection } from '../config/database.js';
import { validationResult } from 'express-validator';
import { safeParseJSON } from '../utils/jsonParser.js';
import { createSnapshot, SNAPSHOT_TTL_HOURS } from '../utils/adminActionSnapshots.js';
import { getSafePagination } from '../utils/pagination.js';

// Helper: filter classes by session day and/or time (sessions are array of { days: [], times: [] })
const filterClassesBySession = (classes, day, time) => {
  if (!day && !time) return classes;
  return classes.filter(kelas => {
    const sessions = Array.isArray(kelas.sessions) ? kelas.sessions : [];
    return sessions.some(session => {
      const days = Array.isArray(session?.days) ? session.days : [];
      const times = Array.isArray(session?.times) ? session.times : [];
      const matchDay = !day || days.some(d => String(d).toLowerCase() === String(day).toLowerCase());
      const matchTime = !time || times.some(t => String(t).toLowerCase().includes(String(time).toLowerCase()));
      return matchDay && matchTime;
    });
  });
};

export const getAllClasses = async (req, res) => {
  try {
    const { search, guru_id, day, time, page = 1, limit } = req.query;
    // Default to a large limit to show all classes, or use pagination if specified
    const defaultLimit = limit ? parseInt(limit) : 1000;
    
    let query = `
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
        u.nama as guru_nama,
        COUNT(DISTINCT s.user_ic) as student_count
      FROM classes c
      LEFT JOIN users u ON c.guru_ic = u.ic
      LEFT JOIN students s ON c.id = s.kelas_id
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    // Allow teachers to see all classes, but they can filter by guru_id if needed
    // Teachers can differentiate their classes visually in the frontend
    // If a teacher wants to filter to only their classes, they can use the guru_id query param
    if (req.user && req.user.role === 'teacher' && req.query.my_classes_only === 'true') {
      query += ` AND c.guru_ic = ?`;
      queryParams.push(req.user.ic);
    }
    
    if (search) {
      query += ` AND (c.nama_kelas LIKE ? OR u.nama LIKE ?)`;
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm);
    }
    
    if (guru_id) {
      query += ` AND c.guru_ic = ?`;
      queryParams.push(guru_id);
    }
    
    // Add pagination (using safe pagination utility to prevent SQL injection)
    const { limit: safeLimit, offset } = getSafePagination(page, defaultLimit, 1, defaultLimit);
    query += ` GROUP BY c.id, c.nama_kelas, c.level, c.sessions, c.yuran, c.guru_ic, c.kapasiti, c.status, u.nama ORDER BY c.created_at DESC LIMIT ${safeLimit} OFFSET ${offset}`;
    
    const [classes] = await pool.execute(query, queryParams);

    let parsedClasses = classes.map(kelas => ({
      ...kelas,
      sessions: safeParseJSON(kelas.sessions, [])
    }));

    // Filter by session day and/or time if provided
    if (day || time) {
      parsedClasses = filterClassesBySession(parsedClasses, day, time);
    }
    
    // Get total count for pagination (use filtered length when day/time filter applied)
    const totalFiltered = (day || time) ? parsedClasses.length : null;
    let countQuery = `
      SELECT COUNT(*) as total
      FROM classes c
      WHERE 1=1
    `;
    const countParams = [];
    
    // Allow teachers to see all classes count, but they can filter if needed
    if (req.user && req.user.role === 'teacher' && req.query.my_classes_only === 'true') {
      countQuery += ` AND c.guru_ic = ?`;
      countParams.push(req.user.ic);
    }
    
    if (search) {
      countQuery += ` AND (c.nama_kelas LIKE ?)`;
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm);
    }
    
    if (guru_id) {
      countQuery += ` AND c.guru_ic = ?`;
      countParams.push(guru_id);
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    let total = countResult[0].total;
    let dataToReturn = parsedClasses;

    // When day/time filter applied, total and data come from filtered list; apply in-memory pagination
    if (totalFiltered !== null) {
      total = totalFiltered;
      const pageNum = Math.max(1, parseInt(page) || 1);
      const start = (pageNum - 1) * safeLimit;
      dataToReturn = parsedClasses.slice(start, start + safeLimit);
    }

    res.json({
      success: true,
      data: dataToReturn,
      pagination: {
        page: parseInt(page) || 1,
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit) || 1
      }
    });
  } catch (error) {
    console.error('Get classes error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getClassById = async (req, res) => {
  try {
    const { id } = req.params;
    
    let query = `
      SELECT c.id, c.nama_kelas, c.level, c.sessions, c.yuran, c.guru_ic, c.kapasiti, c.status, u.nama as guru_nama, u.telefon as guru_telefon
      FROM classes c
      LEFT JOIN users u ON c.guru_ic = u.ic
      WHERE c.id = ?
    `;
    const queryParams = [id];
    
    // Allow teachers to view all classes (they can differentiate visually in frontend)
    // No need to restrict access here - teachers should be able to view any class
    
    const [classes] = await pool.execute(query, queryParams);
    
    if (classes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    const classData = {
      ...classes[0],
      sessions: safeParseJSON(classes[0].sessions, [])
    };
    
    // Get students in this class
    const [students] = await pool.execute(`
      SELECT u.ic, u.nama, u.telefon, u.status, s.tarikh_daftar
      FROM users u
      JOIN students s ON u.ic = s.user_ic
      WHERE s.kelas_id = ?
      ORDER BY u.nama
    `, [id]);
    
    res.json({
      success: true,
      data: {
        ...classData,
        students
      }
    });
  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const createClass = async (req, res) => {
  try {
    console.log('Creating class with data:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { nama_kelas, level, sessions, yuran, guru_ic, kapasiti } = req.body;
    
    // Check if teacher exists and is active
    // Include users with teacher/staff role OR admin users with teacher entry
    // Normalize IC for comparison
    const normalizedGuruIc = guru_ic ? guru_ic.replace(/[-\s]/g, '') : '';
    
    const [teachers] = await pool.execute(
      `SELECT DISTINCT u.ic FROM users u
       LEFT JOIN teachers t ON REPLACE(REPLACE(u.ic, '-', ''), ' ', '') = REPLACE(REPLACE(t.user_ic, '-', ''), ' ', '')
       LEFT JOIN user_roles ur ON REPLACE(REPLACE(u.ic, '-', ''), ' ', '') = REPLACE(REPLACE(ur.user_ic, '-', ''), ' ', '') AND ur.role = 'teacher'
       WHERE REPLACE(REPLACE(u.ic, '-', ''), ' ', '') = ?
         AND u.status = 'aktif'
         AND (
           u.role IN ('teacher', 'staff')
           OR (u.role = 'admin' AND t.user_ic IS NOT NULL)
           OR (u.role = 'admin' AND ur.user_ic IS NOT NULL)
           OR (u.role = 'admin' AND EXISTS (
             SELECT 1 FROM teachers t2 
             WHERE REPLACE(REPLACE(t2.user_ic, '-', ''), ' ', '') = ?
           ))
           OR (u.role = 'admin' AND EXISTS (
             SELECT 1 FROM user_roles ur2 
             WHERE REPLACE(REPLACE(ur2.user_ic, '-', ''), ' ', '') = ? AND ur2.role = 'teacher'
           ))
         )
       LIMIT 1`,
      [normalizedGuruIc, normalizedGuruIc, normalizedGuruIc]
    );
    
    if (teachers.length === 0) {
      console.error(`[createClass] Teacher validation failed for guru_ic: ${guru_ic} (normalized: ${normalizedGuruIc})`);
      return res.status(400).json({
        success: false,
        message: 'Teacher not found or inactive'
      });
    }
    
    // Convert sessions array to JSON string for storage
    const sessionsJson = JSON.stringify(sessions || []);
    
    const [result] = await pool.execute(`
      INSERT INTO classes (nama_kelas, level, sessions, yuran, guru_ic, kapasiti, status)
      VALUES (?, ?, ?, ?, ?, ?, 'aktif')
    `, [nama_kelas, level, sessionsJson, yuran, guru_ic, kapasiti]);
    
    const [newClass] = await pool.execute(`
      SELECT c.id, c.nama_kelas, c.level, c.sessions, c.yuran, c.guru_ic, c.kapasiti, c.status, u.nama as guru_nama
      FROM classes c
      LEFT JOIN users u ON c.guru_ic = u.ic
      WHERE c.id = ?
    `, [result.insertId]);

    const parsedNewClass = {
      ...newClass[0],
      sessions: safeParseJSON(newClass[0].sessions, [])
    };

    // Ensure sessions is always an array for snapshot
    const snapshotData = {
      ...parsedNewClass,
      sessions: Array.isArray(parsedNewClass.sessions) ? parsedNewClass.sessions : []
    };

    // Log admin action for undo capability
    if (req.user && req.user.role === 'admin') {
      await createSnapshot({
        entityType: 'class',
        entityId: result.insertId,
        entityIdentifier: String(result.insertId),
        operation: 'create',
        data: snapshotData,
        metadata: {
          title: nama_kelas,
          nama_kelas,
          operationLabel: 'Cipta kelas',
          redirectPath: `/kelas?view=${result.insertId}`
        },
        actorIc: req.user.ic
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: parsedNewClass
    });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateClass = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { nama_kelas, level, sessions, yuran, guru_ic, kapasiti } = req.body;
    
    // Fetch existing class data before update for snapshot
    const [existingClasses] = await pool.execute(`
      SELECT c.id, c.nama_kelas, c.level, c.sessions, c.yuran, c.guru_ic, c.kapasiti, c.status, u.nama as guru_nama
      FROM classes c
      LEFT JOIN users u ON c.guru_ic = u.ic
      WHERE c.id = ?
    `, [id]);
    
    if (existingClasses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }
    
    const existingClass = existingClasses[0];
    const oldYuran = parseFloat(existingClass.yuran) || 0;
    const newYuran = parseFloat(yuran) || 0;
    // Check if yuran changed (with small tolerance for floating point comparison)
    const yuranChanged = Math.abs(oldYuran - newYuran) > 0.001;
    
    // Check both role and activeRole (for role switching)
    const userRole = req.user?.activeRole || req.user?.role;
    const userIc = req.user?.ic || req.user?.userId;
    
    // Permission check: Only admin/staff can update any class, teachers can only update their own classes
    if (userRole !== 'admin' && userRole !== 'staff') {
      if (userRole === 'teacher') {
        // Teachers can only update classes where they are the assigned teacher
        if (existingClass.guru_ic !== userIc) {
          return res.status(403).json({
            success: false,
            message: 'Insufficient permissions. You can only update classes assigned to you.'
          });
        }
        // Also check if they're trying to change the teacher assignment
        if (guru_ic && guru_ic !== userIc) {
          return res.status(403).json({
            success: false,
            message: 'Insufficient permissions. Teachers cannot change class assignment.'
          });
        }
      } else {
        // Students and other roles cannot update classes
        return res.status(403).json({
          success: false,
          message: `Insufficient permissions. Only administrators, staff, and teachers can update classes. Your current role is: ${userRole || 'unknown'}. Please log in with an admin, staff, or teacher account.`
        });
      }
    }
    
    // Check if teacher exists and is active
    // Include users with teacher/staff role OR admin users with teacher entry
    // Normalize IC for comparison
    const normalizedGuruIc = guru_ic ? guru_ic.replace(/[-\s]/g, '') : '';
    
    const [teachers] = await pool.execute(
      `SELECT DISTINCT u.ic FROM users u
             LEFT JOIN teachers t ON REPLACE(REPLACE(u.ic, '-', ''), ' ', '') = REPLACE(REPLACE(t.user_ic, '-', ''), ' ', '')
       LEFT JOIN user_roles ur ON REPLACE(REPLACE(u.ic, '-', ''), ' ', '') = REPLACE(REPLACE(ur.user_ic, '-', ''), ' ', '') AND ur.role = 'teacher'
       WHERE REPLACE(REPLACE(u.ic, '-', ''), ' ', '') = ?
         AND u.status = 'aktif'
         AND (
           u.role IN ('teacher', 'staff')
           OR (u.role = 'admin' AND t.user_ic IS NOT NULL)
           OR (u.role = 'admin' AND ur.user_ic IS NOT NULL)
           OR (u.role = 'admin' AND EXISTS (
             SELECT 1 FROM teachers t2 
             WHERE REPLACE(REPLACE(t2.user_ic, '-', ''), ' ', '') = ?
           ))
           OR (u.role = 'admin' AND EXISTS (
             SELECT 1 FROM user_roles ur2 
             WHERE REPLACE(REPLACE(ur2.user_ic, '-', ''), ' ', '') = ? AND ur2.role = 'teacher'
           ))
         )
       LIMIT 1`,
      [normalizedGuruIc, normalizedGuruIc, normalizedGuruIc]
    );
    
    if (teachers.length === 0) {
      // Additional debug: Check what users exist with this IC
      const [debugUsers] = await pool.execute(
        `SELECT ic, role, status FROM users 
         WHERE REPLACE(REPLACE(ic, '-', ''), ' ', '') = ?`,
        [normalizedGuruIc]
      );
      const [debugTeachers] = await pool.execute(
        `SELECT user_ic FROM teachers 
         WHERE REPLACE(REPLACE(user_ic, '-', ''), ' ', '') = ?`,
        [normalizedGuruIc]
      );
      const [debugRoles] = await pool.execute(
        `SELECT user_ic, role FROM user_roles 
         WHERE REPLACE(REPLACE(user_ic, '-', ''), ' ', '') = ?`,
        [normalizedGuruIc]
      );
      console.error(`[updateClass] Teacher validation failed for guru_ic: ${guru_ic} (normalized: ${normalizedGuruIc})`);
      console.error(`[updateClass] Debug - Users found:`, debugUsers);
      console.error(`[updateClass] Debug - Teachers table entries:`, debugTeachers);
      console.error(`[updateClass] Debug - User roles:`, debugRoles);
      return res.status(400).json({
        success: false,
        message: 'Teacher not found or inactive'
      });
    }
    
    console.log(`[updateClass] Teacher validation passed for guru_ic: ${guru_ic}, found:`, teachers[0]);
    
    // Convert sessions array to JSON string for storage
    const sessionsJson = JSON.stringify(sessions || []);
    
    await pool.execute(`
      UPDATE classes 
      SET nama_kelas = ?, level = ?, sessions = ?, yuran = ?, guru_ic = ?, kapasiti = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [nama_kelas, level, sessionsJson, yuran, guru_ic, kapasiti, id]);
    
    // If yuran amount changed, update fees for current month and future months
    // Update fees immediately when yuran changes (for any role that can update classes)
    if (yuranChanged) {
      try {
        const now = new Date();
        const currentMonth = now.getMonth(); // 0-11
        const currentYear = now.getFullYear();
        
        // Month names in Malay (must match the order used in monthlyFeeGenerationJob.js)
        const monthNames = [
          'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
          'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
        ];
        const currentMonthName = monthNames[currentMonth];
        
        // Get all students in this class
        const [classStudents] = await pool.execute(`
          SELECT user_ic FROM students WHERE kelas_id = ?
        `, [id]);
        
        if (classStudents.length > 0) {
          const studentIcs = classStudents.map(s => s.user_ic);
          const placeholders = studentIcs.map(() => '?').join(',');
          
          let totalUpdated = 0;
          let totalCreated = 0;
          
          // Update ALL existing fees for current month (including paid ones)
          // This ensures all current month fees are in sync with the new yuran amount
          const [currentMonthUpdated] = await pool.execute(`
            UPDATE fees 
            SET jumlah = ?, updated_at = CURRENT_TIMESTAMP
            WHERE student_ic IN (${placeholders})
              AND bulan = ?
              AND tahun = ?
          `, [newYuran, ...studentIcs, currentMonthName, currentYear]);
          
          const currentMonthCount = currentMonthUpdated.affectedRows || 0;
          totalUpdated += currentMonthCount;
          
          // Check which students don't have fees for current month yet
          const [existingFees] = await pool.execute(`
            SELECT DISTINCT student_ic 
            FROM fees 
            WHERE student_ic IN (${placeholders})
              AND bulan = ?
              AND tahun = ?
          `, [...studentIcs, currentMonthName, currentYear]);
          
          const studentsWithFees = new Set(existingFees.map(f => f.student_ic));
          const studentsWithoutFees = studentIcs.filter(ic => !studentsWithFees.has(ic));
          
          // Create fees for students who don't have fees for current month yet
          if (studentsWithoutFees.length > 0) {
            const feeDate = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
            
            for (const studentIc of studentsWithoutFees) {
              try {
                await pool.execute(`
                  INSERT INTO fees (
                    student_ic, 
                    jumlah, 
                    status, 
                    tarikh, 
                    bulan, 
                    tahun,
                    tarikh_bayar,
                    cara_bayar,
                    no_resit,
                    resit_img
                  )
                  VALUES (?, ?, 'Belum Bayar', ?, ?, ?, NULL, NULL, NULL, NULL)
                `, [studentIc, newYuran, feeDate, currentMonthName, currentYear]);
                totalCreated++;
              } catch (error) {
                console.error(`[Class Update] Error creating fee for student ${studentIc}:`, error);
              }
            }
          }
          
          // Log detailed information for debugging
          if (classStudents.length > 0) {
            console.log(`[Class Update] Found ${classStudents.length} students in class ${id}:`, classStudents.map(s => s.user_ic).join(', '));
            console.log(`[Class Update] Current month: ${currentMonthName} ${currentYear}`);
            console.log(`[Class Update] New yuran amount: RM ${newYuran.toFixed(2)}`);
            console.log(`[Class Update] Updated ${currentMonthCount} existing fees (all statuses), created ${totalCreated} new fees for current month`);
          }
          
          // Update fees for future months in current year (all fees regardless of status)
          const futureMonthNames = monthNames.slice(currentMonth + 1);
          let futureCurrentYearCount = 0;
          
          if (futureMonthNames.length > 0) {
            const futurePlaceholders = futureMonthNames.map(() => '?').join(',');
            const [futureCurrentYear] = await pool.execute(`
              UPDATE fees 
              SET jumlah = ?, updated_at = CURRENT_TIMESTAMP
              WHERE student_ic IN (${placeholders})
                AND bulan IN (${futurePlaceholders})
                AND tahun = ?
            `, [newYuran, ...studentIcs, ...futureMonthNames, currentYear]);
            futureCurrentYearCount = futureCurrentYear.affectedRows || 0;
            totalUpdated += futureCurrentYearCount;
          }
          
          // Update all fees in future years (all fees regardless of status)
          const [futureYears] = await pool.execute(`
            UPDATE fees 
            SET jumlah = ?, updated_at = CURRENT_TIMESTAMP
            WHERE student_ic IN (${placeholders})
              AND tahun > ?
          `, [newYuran, ...studentIcs, currentYear]);
          const futureYearsCount = futureYears.affectedRows || 0;
          totalUpdated += futureYearsCount;
          
          console.log(`[Class Update] ✅ Yuran changed from RM ${oldYuran.toFixed(2)} to RM ${newYuran.toFixed(2)} for class ${id} (${existingClass.nama_kelas})`);
          console.log(`[Class Update] Updated fees for ${classStudents.length} students in class:`);
          console.log(`  - Current month (${currentMonthName} ${currentYear}): ${currentMonthCount} unpaid fees updated, ${totalCreated} new fees created`);
          console.log(`  - Future months in ${currentYear}: ${futureCurrentYearCount} fees updated`);
          console.log(`  - Future years: ${futureYearsCount} fees updated`);
          console.log(`  - Total: ${totalUpdated + totalCreated} fees updated/created`);
          
          // If no fees were updated or created, log a warning
          if (totalUpdated === 0 && totalCreated === 0) {
            console.warn(`[Class Update] ⚠️  No fees were updated or created. This might mean:`);
            console.warn(`  - No students are assigned to this class`);
            console.warn(`  - All fees for current month are already paid`);
          }
        }
      } catch (error) {
        console.error('[Class Update] Error updating fees after yuran change:', error);
        // Don't fail the class update if fee update fails, just log it
        // The class update was successful, fees can be updated manually if needed
      }
    }
    
    const [updatedClass] = await pool.execute(`
      SELECT c.id, c.nama_kelas, c.level, c.sessions, c.yuran, c.guru_ic, c.kapasiti, c.status, u.nama as guru_nama
      FROM classes c
      LEFT JOIN users u ON c.guru_ic = u.ic
      WHERE c.id = ?
    `, [id]);

    const parsedUpdatedClass = {
      ...updatedClass[0],
      sessions: safeParseJSON(updatedClass[0].sessions, [])
    };

    // Log admin action for undo capability
    if (req.user && req.user.role === 'admin') {
      const previousData = {
        ...existingClasses[0],
        sessions: safeParseJSON(existingClasses[0].sessions, [])
      };
      
      // Ensure sessions is always an array for snapshot
      const snapshotData = {
        ...previousData,
        sessions: Array.isArray(previousData.sessions) ? previousData.sessions : []
      };
      
      await createSnapshot({
        entityType: 'class',
        entityId: Number(id),
        entityIdentifier: String(id),
        operation: 'update',
        data: snapshotData,
        metadata: {
          title: snapshotData.nama_kelas,
          nama_kelas: snapshotData.nama_kelas,
          operationLabel: 'Kemas kini kelas',
          redirectPath: `/kelas?view=${id}`
        },
        actorIc: req.user.ic
      });
    }
    
    res.json({
      success: true,
      message: 'Class updated successfully',
      data: parsedUpdatedClass
    });
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Fetch existing class data before deletion for snapshot
    const [existingClasses] = await pool.execute(`
      SELECT c.id, c.nama_kelas, c.level, c.sessions, c.yuran, c.guru_ic, c.kapasiti, c.status, u.nama as guru_nama
      FROM classes c
      LEFT JOIN users u ON c.guru_ic = u.ic
      WHERE c.id = ?
    `, [id]);
    
    if (existingClasses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }
    
    // Check if class has active students
    const [activeStudents] = await pool.execute(
      "SELECT COUNT(s.user_ic) as count FROM students s JOIN users u ON s.user_ic = u.ic WHERE s.kelas_id = ? AND u.status = 'aktif'",
      [id]
    );
    
    if (activeStudents[0].count > 0) {
      console.warn(`Attempted to delete class ${id} but it has ${activeStudents[0].count} active students.`);
      return res.status(400).json({
        success: false,
        message: 'Cannot delete class with active students. Please deactivate or remove all students first.'
      });
    }

    // Log admin action for undo capability
    if (req.user && req.user.role === 'admin') {
      const classData = {
        ...existingClasses[0],
        sessions: safeParseJSON(existingClasses[0].sessions, [])
      };
      
      // Ensure sessions is always an array for snapshot
      const snapshotData = {
        ...classData,
        sessions: Array.isArray(classData.sessions) ? classData.sessions : []
      };
      
      await createSnapshot({
        entityType: 'class',
        entityId: Number(id),
        entityIdentifier: String(id),
        operation: 'delete',
        data: snapshotData,
        metadata: {
          title: snapshotData.nama_kelas,
          nama_kelas: snapshotData.nama_kelas,
          operationLabel: 'Padam kelas',
          redirectPath: '/kelas'
        },
        actorIc: req.user.ic
      });
    }
    
    const [deleteResult] = await pool.execute('DELETE FROM classes WHERE id = ?', [id]);
    
    if (deleteResult.affectedRows === 0) {
      console.error(`Delete class error: No rows affected for class ID ${id}. Class might not exist or another constraint prevented deletion.`);
      return res.status(404).json({
        success: false,
        message: 'Class not found or could not be deleted.'
      });
    }

    res.json({
      success: true,
      message: 'Class deleted successfully'
    });
  } catch (error) {
    console.error(`Delete class error for ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during class deletion'
    });
  }
};

export const getClassStats = async (req, res) => {
  try {
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(kapasiti), 0) as total_kapasiti,
        COALESCE(AVG(yuran), 0) as average_yuran
      FROM classes
    `);
    
    const statsData = stats[0];
    // Ensure average_yuran is a number
    statsData.average_yuran = statsData.average_yuran ? Number(statsData.average_yuran) : 0;
    statsData.total_kapasiti = statsData.total_kapasiti ? Number(statsData.total_kapasiti) : 0;
    
    res.json({
      success: true,
      data: statsData
    });
  } catch (error) {
    console.error('Get class stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Dashboard stats endpoint
export const getDashboardStats = async (req, res) => {
  try {
    // Kehadiran Hari Ini (percentage hadir)
    const [attendanceRows] = await pool.execute(`
      SELECT 
        COUNT(*) as total, 
        SUM(status = 'Hadir') as hadir
      FROM attendance
      WHERE tarikh = CURDATE()
    `);
    const attendanceTotal = attendanceRows[0]?.total || 0;
    const attendancePresent = attendanceRows[0]?.hadir || 0;
    const attendanceToday = attendanceTotal ? Math.round((attendancePresent / attendanceTotal) * 100) : 0;

    // Yuran Tertunggak (outstanding fees)
    const [feesRows] = await pool.execute(`
      SELECT COUNT(*) as count
      FROM fees
      WHERE status = 'Belum Bayar'
    `);
    const feesOutstanding = feesRows[0]?.count || 0;

    // Kelas Aktif (active classes - count all classes)
    const [classRows] = await pool.execute(`
      SELECT COUNT(*) as count
      FROM classes
    `);
    const classesActive = classRows[0]?.count || 0;

    // Pelajar Baru Bulan Ini (new students this month)
    const [studentsRows] = await pool.execute(`
      SELECT COUNT(*) as count
      FROM students
      WHERE MONTH(tarikh_daftar) = MONTH(CURDATE()) AND YEAR(tarikh_daftar) = YEAR(CURDATE())
    `);
    const newStudents = studentsRows[0]?.count || 0;

    res.json({
      success: true,
      data: {
        attendanceToday,
        feesOutstanding,
        classesActive,
        newStudents
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Error fetching dashboard stats' });
  }
};

import { pool, testConnection } from '../config/database.js';
import { validationResult } from 'express-validator';
import { getSafePagination } from '../utils/pagination.js';
import { createSnapshot, getSnapshotById, SNAPSHOT_TTL_HOURS } from '../utils/adminActionSnapshots.js';

export const getAttendance = async (req, res) => {
  try {
    const { date, start_date, end_date, kelas_id, class_id, pelajar_id, page = 1, limit = 50 } = req.query;
    
    // Log all query parameters
    console.log('=== ATTENDANCE API REQUEST ===');
    console.log('Query params:', { date, start_date, end_date, kelas_id, class_id, pelajar_id, page, limit });
    console.log('User role:', req.user?.role);

    let query = `
      SELECT a.*, u.nama as pelajar_nama, u.ic as pelajar_ic, c.nama_kelas,
             mu.nama as marked_by_name,
             a.document_confirmed, a.confirmed_by, a.confirmed_at, a.confirmation_notes
      FROM attendance a
      JOIN users u ON a.student_ic = u.ic
      JOIN classes c ON a.class_id = c.id
      LEFT JOIN users mu ON a.marked_by = mu.ic
      WHERE 1=1
    `;

    const queryParams = [];

    // If user is a student, only show their own attendance
    if (req.user && req.user.role === 'student') {
      query += ` AND a.student_ic = ?`;
      queryParams.push(req.user.ic);
    }

    // If user is a teacher, only show attendance for their classes
    if (req.user && req.user.role === 'teacher') {
      query += ` AND c.guru_ic = ?`;
      queryParams.push(req.user.ic);
    }

    // Handle date range (start_date and end_date) or single date
    if (start_date && end_date) {
      // Date range query
      query += ` AND DATE(a.tarikh) >= DATE(?) AND DATE(a.tarikh) <= DATE(?)`;
      queryParams.push(start_date, end_date);
      console.log('Date range query - start:', start_date, 'end:', end_date);
    } else if (date) {
      // Backward compatibility - single date or month
      if (date.length === 7 && date.match(/^\d{4}-\d{2}$/)) {
        // Month view - filter by month using YEAR and MONTH functions
        const [year, month] = date.split('-');
        const yearNum = parseInt(year, 10);
        const monthNum = parseInt(month, 10);
        
        if (monthNum < 1 || monthNum > 12) {
          console.error('Invalid month in date parameter:', date, 'month:', monthNum);
          return res.status(400).json({
            success: false,
            message: 'Invalid month in date parameter. Month must be between 01-12.',
          });
        }
        
        query += ` AND YEAR(a.tarikh) = ? AND MONTH(a.tarikh) = ?`;
        queryParams.push(yearNum, monthNum);
        console.log('Month view query - date parameter:', date, 'year:', yearNum, 'month:', monthNum);
      } else if (date.length === 10 && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Day view - exact date match
        query += ` AND DATE(a.tarikh) = DATE(?)`;
        queryParams.push(date);
        console.log('Day view query - date:', date);
      } else {
        console.error('Invalid date format:', date);
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Expected YYYY-MM (month view) or YYYY-MM-DD (day view).',
        });
      }
    }

    // Support both kelas_id and class_id for compatibility
    const classId = kelas_id || class_id;
    // Only filter by class if a specific class is provided (not 'semua' or undefined)
    if (classId && classId !== 'semua' && classId !== 'undefined') {
      query += ` AND a.class_id = ?`;
      queryParams.push(classId);
    }

    if (pelajar_id) {
      query += ` AND a.student_ic = ?`;
      queryParams.push(pelajar_id);
    }

    // Add pagination (using safe pagination utility to prevent SQL injection)
    const { limit: safeLimit, offset } = getSafePagination(page, limit, 1, 50);
    query += ` ORDER BY a.tarikh DESC, u.nama ASC LIMIT ${safeLimit} OFFSET ${offset}`;

    // Debug logging for month view
    if (date && date.length === 7) {
      console.log('=== MONTH VIEW DEBUG ===');
      console.log('Request date param:', date);
      console.log('Query params array:', JSON.stringify(queryParams));
    }

    // Log the full query for debugging
    if (date && date.length === 7) {
      console.log('=== MONTH VIEW QUERY DEBUG ===');
      console.log('Full SQL Query:', query);
      console.log('Query Parameters:', JSON.stringify(queryParams));
    }
    
    const [attendance] = await pool.execute(query, queryParams);
    
    // Debug logging for month view
    if (date && date.length === 7) {
      console.log('Month view - Results count:', attendance.length);
      if (attendance.length > 0) {
        console.log('Month view - First record tarikh:', attendance[0].tarikh);
        console.log('Month view - First record:', {
          id: attendance[0].id,
          tarikh: attendance[0].tarikh,
          student_ic: attendance[0].student_ic,
          class_id: attendance[0].class_id,
          pelajar_nama: attendance[0].pelajar_nama,
          nama_kelas: attendance[0].nama_kelas
        });
      } else {
        console.log('Month view - NO RESULTS FOUND');
        // Try a test query to see if data exists
        try {
          const [testQuery] = await pool.execute(
            'SELECT COUNT(*) as count, MIN(tarikh) as min_date, MAX(tarikh) as max_date FROM attendance'
          );
          console.log('Total attendance records in DB:', testQuery[0]);
          
          // Test the actual query without joins to see if data exists
          const [year, month] = date.split('-');
          const yearNum = parseInt(year, 10);
          const monthNum = parseInt(month, 10);
          const [testMonthQuery] = await pool.execute(
            'SELECT COUNT(*) as count FROM attendance WHERE YEAR(tarikh) = ? AND MONTH(tarikh) = ?',
            [yearNum, monthNum]
          );
          console.log('Records matching month query (without joins):', testMonthQuery[0]);
          
          // Test the query with joins to see if JOINs are filtering out records
          const [testJoinQuery] = await pool.execute(
            `SELECT COUNT(*) as count 
             FROM attendance a
             JOIN users u ON a.student_ic = u.ic
             JOIN classes c ON a.class_id = c.id
             WHERE YEAR(a.tarikh) = ? AND MONTH(a.tarikh) = ?`,
            [yearNum, monthNum]
          );
          console.log('Records matching month query (with joins):', testJoinQuery[0]);
          
          // Test with a sample date to see what dates exist
          const [sampleDates] = await pool.execute(
            'SELECT DISTINCT tarikh FROM attendance ORDER BY tarikh DESC LIMIT 10'
          );
          console.log('Sample dates in DB:', sampleDates.map(d => d.tarikh));
        } catch (err) {
          console.log('Test query error:', err.message);
        }
      }
      console.log('=== END MONTH VIEW DEBUG ===');
    }

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM attendance a
      WHERE 1=1
    `;
    const countParams = [];

    // If user is a student, only count their own attendance
    if (req.user && req.user.role === 'student') {
      countQuery += ` AND a.student_ic = ?`;
      countParams.push(req.user.ic);
    }

    // If user is a teacher, only count attendance for their classes
    if (req.user && req.user.role === 'teacher') {
      countQuery += ` AND EXISTS (
        SELECT 1 FROM classes c WHERE c.id = a.class_id AND c.guru_ic = ?
      )`;
      countParams.push(req.user.ic);
    }

    // Handle date range (start_date and end_date) or single date for count query
    if (start_date && end_date) {
      countQuery += ` AND DATE(a.tarikh) >= DATE(?) AND DATE(a.tarikh) <= DATE(?)`;
      countParams.push(start_date, end_date);
    } else if (date) {
      // Backward compatibility
      if (date.length === 7 && date.match(/^\d{4}-\d{2}$/)) {
        const [year, month] = date.split('-');
        const yearNum = parseInt(year, 10);
        const monthNum = parseInt(month, 10);
        
        if (monthNum < 1 || monthNum > 12) {
          return;
        }
        
        countQuery += ` AND YEAR(a.tarikh) = ? AND MONTH(a.tarikh) = ?`;
        countParams.push(yearNum, monthNum);
      } else if (date.length === 10 && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        countQuery += ` AND DATE(a.tarikh) = DATE(?)`;
        countParams.push(date);
      }
    }

    // Use the same classId variable from above
    // Only filter by class if a specific class is provided (not 'semua' or undefined)
    if (classId && classId !== 'semua' && classId !== 'undefined') {
      countQuery += ` AND a.class_id = ?`;
      countParams.push(classId);
    }

    if (pelajar_id) {
      countQuery += ` AND a.student_ic = ?`;
      countParams.push(pelajar_id);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    // Final debug log
    if (date && date.length === 7) {
      console.log('Month view - Final response:', {
        recordsReturned: attendance.length,
        totalInDB: total,
        pagination: { page: parseInt(page), limit: parseInt(limit) }
      });
    }

    res.json({
      success: true,
      data: attendance,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getStudentAttendanceHistory = async (req, res) => {
  try {
    const { student_ic } = req.params;
    const [attendance] = await pool.execute(`
      SELECT * FROM attendance WHERE student_ic = ?
    `, [student_ic]);

    res.json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error('Get student attendance history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getAttendanceStats = async (req, res) => {
  try {
    const [stats] = await pool.execute(
      `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Hadir' THEN 1 ELSE 0 END) as hadir,
        SUM(CASE WHEN status = 'Tidak Hadir' THEN 1 ELSE 0 END) as tidak_hadir,
        SUM(CASE WHEN status = 'Cuti' THEN 1 ELSE 0 END) as cuti
      FROM attendance
    `
    );

    res.json({
      success: true,
      data: stats[0],
    });
  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const markAttendance = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    // Handle PUT request (update by ID)
    if (req.method === 'PUT' && req.params.id) {
      const { status } = req.body;
      const attendanceId = parseInt(req.params.id);
      
      // Check if attendance record exists
      const [existingAttendance] = await pool.execute(
        'SELECT * FROM attendance WHERE id = ?',
        [attendanceId]
      );
      
      if (existingAttendance.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Attendance record not found',
        });
      }
      
      // Check permissions - teachers can only update their own class attendance
      if (req.user && req.user.role === 'teacher') {
        const [classCheck] = await pool.execute(
          'SELECT guru_ic FROM classes WHERE id = ?',
          [existingAttendance[0].class_id]
        );
        
        if (classCheck.length === 0 || classCheck[0].guru_ic !== req.user.ic) {
          return res.status(403).json({
            success: false,
            message: 'You do not have permission to update this attendance record',
          });
        }
      }
      
      const existingData = existingAttendance[0];
      const actorIc = req.user?.ic;
      
      // Create snapshot before update (only for admin/teacher - PIC actions go to approval, not snapshots)
      if (actorIc && (req.user?.role === 'admin' || req.user?.role === 'teacher')) {
        // Get student and class names for better metadata
        const [studentInfo] = await pool.execute(
          'SELECT nama FROM users WHERE ic = ?',
          [existingData.student_ic]
        );
        const [classInfo] = await pool.execute(
          'SELECT nama_kelas FROM classes WHERE id = ?',
          [existingData.class_id]
        );
        
        const studentName = studentInfo[0]?.nama || existingData.student_ic;
        const className = classInfo[0]?.nama_kelas || 'Kelas';
        
        await createSnapshot({
          entityType: 'attendance',
          entityId: attendanceId,
          entityIdentifier: `${existingData.student_ic}-${existingData.class_id}-${existingData.tarikh}`,
          operation: 'update',
          data: existingData,
          metadata: {
            title: studentName,
            nama: studentName,
            operationLabel: 'Kemas kini kehadiran',
            redirectPath: `/kehadiran?start_date=${existingData.tarikh}&end_date=${existingData.tarikh}&class_id=${existingData.class_id}`,
            notes: `Status kehadiran diubah: ${studentName} - ${className} - dari ${existingData.status} kepada ${status} pada ${existingData.tarikh}`
          },
          actorIc
        });
      }
      
      // Update attendance
      await pool.execute(
        'UPDATE attendance SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, attendanceId]
      );
      
      return res.json({
        success: true,
        message: 'Attendance updated successfully',
      });
    }

    const { student_ic, class_id, tarikh, status } = req.body;
    
    // Use current date if tarikh is not provided
    const attendanceDate = tarikh || new Date().toISOString().split('T')[0];

    if (!['Hadir', 'Tidak Hadir', 'Cuti'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attendance status',
      });
    }

    // Check if student exists and is in the class
    const [existingStudents] = await pool.execute(
      'SELECT user_ic FROM students WHERE user_ic = ? AND kelas_id = ?',
      [student_ic, class_id]
    );

    if (existingStudents.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Student not found in this class',
      });
    }

    // If user is a teacher, check if they are assigned to this class
    if (req.user && req.user.role === 'teacher') {
      const [classCheck] = await pool.execute(
        'SELECT guru_ic FROM classes WHERE id = ?',
        [class_id]
      );
      
      if (classCheck.length === 0 || classCheck[0].guru_ic !== req.user.ic) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to mark attendance for this class',
        });
      }
    }

    // Check if attendance already exists for this date
    const [existingAttendance] = await pool.execute(
      'SELECT id FROM attendance WHERE student_ic = ? AND class_id = ? AND tarikh = ?',
      [student_ic, class_id, attendanceDate]
    );

    if (existingAttendance.length > 0) {
      // Get existing data for snapshot
      const [existingDataFull] = await pool.execute(
        `SELECT a.*, u.nama as pelajar_nama, c.nama_kelas
         FROM attendance a
         LEFT JOIN users u ON a.student_ic = u.ic
         LEFT JOIN classes c ON a.class_id = c.id
         WHERE a.id = ?`,
        [existingAttendance[0].id]
      );
      const existingData = existingDataFull[0] || existingAttendance[0];
      
      // Log admin action for undo capability (only for admin/teacher - PIC actions go to approval, not snapshots)
      const actorIc = req.user?.ic;
      if (actorIc && (req.user?.role === 'admin' || req.user?.role === 'teacher')) {
        const studentName = existingData.pelajar_nama || existingData.student_ic;
        const className = existingData.nama_kelas || 'Kelas';
        
        await createSnapshot({
          entityType: 'attendance',
          entityId: existingData.id,
          entityIdentifier: `${existingData.student_ic}-${existingData.class_id}-${attendanceDate}`,
          operation: 'update',
          data: {
            id: existingData.id,
            student_ic: existingData.student_ic,
            class_id: existingData.class_id,
            tarikh: existingData.tarikh,
            status: existingData.status,
            proof_image: existingData.proof_image || null,
            marked_by: existingData.marked_by || null,
            document_confirmed: existingData.document_confirmed || null,
            confirmed_by: existingData.confirmed_by || null,
            created_at: existingData.created_at,
            updated_at: existingData.updated_at
          },
          metadata: {
            title: studentName,
            nama: studentName,
            operationLabel: 'Kemas kini kehadiran',
            redirectPath: `/kehadiran?start_date=${attendanceDate}&end_date=${attendanceDate}&class_id=${existingData.class_id}`,
            notes: `Status kehadiran diubah: ${studentName} - ${className} - dari ${existingData.status} kepada ${status} pada ${attendanceDate}`
          },
          actorIc
        });
      }
      
      // Update existing attendance
      await pool.execute(
        `
        UPDATE attendance 
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE student_ic = ? AND class_id = ? AND tarikh = ?
      `,
        [status, student_ic, class_id, attendanceDate]
      );

      res.json({
        success: true,
        message: 'Attendance updated successfully',
      });
    } else {
      // Create new attendance record
      const [result] = await pool.execute(
        `
        INSERT INTO attendance (student_ic, class_id, tarikh, status)
        VALUES (?, ?, ?, ?)
      `,
        [student_ic, class_id, attendanceDate, status]
      );

      // Log admin action for undo capability (only for admin/teacher - PIC actions go to approval, not snapshots)
      const actorIc = req.user?.ic;
      if (actorIc && (req.user?.role === 'admin' || req.user?.role === 'teacher')) {
        const [newAttendance] = await pool.execute(
          `SELECT a.*, u.nama as pelajar_nama, c.nama_kelas
           FROM attendance a
           LEFT JOIN users u ON a.student_ic = u.ic
           LEFT JOIN classes c ON a.class_id = c.id
           WHERE a.id = ?`,
          [result.insertId]
        );
        
        if (newAttendance.length > 0) {
          const attendanceData = newAttendance[0];
          const studentName = attendanceData.pelajar_nama || student_ic;
          const className = attendanceData.nama_kelas || 'Kelas';
          
          const attendanceDataForSnapshot = {
            id: attendanceData.id,
            student_ic: attendanceData.student_ic,
            class_id: attendanceData.class_id,
            tarikh: attendanceData.tarikh,
            status: attendanceData.status,
            proof_image: attendanceData.proof_image || null,
            marked_by: attendanceData.marked_by || null,
            document_confirmed: attendanceData.document_confirmed || null,
            confirmed_by: attendanceData.confirmed_by || null,
            created_at: attendanceData.created_at,
            updated_at: attendanceData.updated_at
          };
          
          await createSnapshot({
            entityType: 'attendance',
            entityId: result.insertId,
            entityIdentifier: `${student_ic}-${class_id}-${attendanceDate}`,
            operation: 'create',
            data: {
              id: attendanceData.id,
              student_ic: attendanceData.student_ic,
              class_id: attendanceData.class_id,
              tarikh: attendanceData.tarikh,
              status: attendanceData.status,
              proof_image: attendanceData.proof_image || null,
              marked_by: attendanceData.marked_by || null,
              document_confirmed: attendanceData.document_confirmed || null,
              confirmed_by: attendanceData.confirmed_by || null,
              created_at: attendanceData.created_at,
              updated_at: attendanceData.updated_at
            },
            metadata: {
              title: studentName,
              nama: studentName,
              operationLabel: 'Tambah kehadiran',
              redirectPath: `/kehadiran?start_date=${attendanceDate}&end_date=${attendanceDate}&class_id=${class_id}`,
              notes: `Kehadiran baru ditambah: ${studentName} - ${className} - ${status} pada ${attendanceDate}`
            },
            actorIc
          });
        }
      }

      res.status(201).json({
        success: true,
        message: 'Attendance marked successfully'
      });
    }
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const bulkMarkAttendance = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { class_id, tarikh, attendance_data } = req.body;
    
    // Use current date if tarikh is not provided
    const attendanceDate = tarikh || new Date().toISOString().split('T')[0];

    // If user is a teacher, check if they are assigned to this class
    if (req.user && req.user.role === 'teacher') {
      const [classCheck] = await pool.execute(
        'SELECT guru_ic FROM classes WHERE id = ?',
        [class_id]
      );
      
      if (classCheck.length === 0 || classCheck[0].guru_ic !== req.user.ic) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to mark attendance for this class',
        });
      }
    }

    // Get a connection from the pool for transaction
    const connection = await pool.getConnection();
    const actorIc = req.user?.ic;
    // Only create snapshots for admin/teacher - PIC actions go to approval, not snapshots
    const shouldCreateSnapshots = actorIc && (req.user?.role === 'admin' || req.user?.role === 'teacher');

    try {
      // Start transaction
      await connection.beginTransaction();

      for (const record of attendance_data) {
        const { student_ic, status } = record;

        if (!['Hadir', 'Tidak Hadir', 'Cuti'].includes(status)) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({
            success: false,
            message: 'Invalid attendance status',
          });
        }

        // Check if attendance already exists
        const [existingAttendance] = await connection.execute(
          `SELECT a.*, u.nama as pelajar_nama, c.nama_kelas
           FROM attendance a
           LEFT JOIN users u ON a.student_ic = u.ic
           LEFT JOIN classes c ON a.class_id = c.id
           WHERE a.student_ic = ? AND a.class_id = ? AND a.tarikh = ?`,
          [student_ic, class_id, attendanceDate]
        );

        if (existingAttendance.length > 0) {
          // Create snapshot before update
          const existingData = existingAttendance[0];
          if (shouldCreateSnapshots) {
            try {
              const studentName = existingData.pelajar_nama || student_ic;
              const className = existingData.nama_kelas || 'Kelas';
              
              await createSnapshot({
                entityType: 'attendance',
                entityId: existingData.id,
                entityIdentifier: `${student_ic}-${class_id}-${attendanceDate}`,
                operation: 'update',
                data: {
                  id: existingData.id,
                  student_ic: existingData.student_ic,
                  class_id: existingData.class_id,
                  tarikh: existingData.tarikh,
                  status: existingData.status,
                  proof_image: existingData.proof_image || null,
                  marked_by: existingData.marked_by || null,
                  document_confirmed: existingData.document_confirmed || null,
                  confirmed_by: existingData.confirmed_by || null,
                  created_at: existingData.created_at,
                  updated_at: existingData.updated_at
                },
                metadata: {
                  title: studentName,
                  nama: studentName,
                  operationLabel: 'Kemas kini kehadiran (bulk)',
                  redirectPath: `/kehadiran?start_date=${attendanceDate}&end_date=${attendanceDate}&class_id=${class_id}`,
                  notes: `Status kehadiran diubah (bulk): ${studentName} - ${className} - dari ${existingData.status} kepada ${status} pada ${attendanceDate}`
                },
                actorIc
              });
            } catch (snapshotError) {
              console.error('[BULK ATTENDANCE] Failed to create snapshot for update:', snapshotError);
              // Continue with update even if snapshot fails
            }
          }
          
          // Update existing
          await connection.execute(
            `
            UPDATE attendance 
            SET status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE student_ic = ? AND class_id = ? AND tarikh = ?
          `,
            [status, student_ic, class_id, attendanceDate]
          );
        } else {
          // Insert new
          const [insertResult] = await connection.execute(
            `
            INSERT INTO attendance (student_ic, class_id, tarikh, status)
            VALUES (?, ?, ?, ?)
          `,
            [student_ic, class_id, attendanceDate, status]
          );
          
          // Create snapshot after create
          if (shouldCreateSnapshots && insertResult.insertId) {
            try {
              const [newAttendance] = await connection.execute(
                `SELECT a.*, u.nama as pelajar_nama, c.nama_kelas
                 FROM attendance a
                 LEFT JOIN users u ON a.student_ic = u.ic
                 LEFT JOIN classes c ON a.class_id = c.id
                 WHERE a.id = ?`,
                [insertResult.insertId]
              );
              
              if (newAttendance.length > 0) {
                const attendanceData = newAttendance[0];
                const studentName = attendanceData.pelajar_nama || student_ic;
                const className = attendanceData.nama_kelas || 'Kelas';
                
                await createSnapshot({
                  entityType: 'attendance',
                  entityId: insertResult.insertId,
                  entityIdentifier: `${student_ic}-${class_id}-${attendanceDate}`,
                  operation: 'create',
                  data: {
                    id: attendanceData.id,
                    student_ic: attendanceData.student_ic,
                    class_id: attendanceData.class_id,
                    tarikh: attendanceData.tarikh,
                    status: attendanceData.status,
                    proof_image: attendanceData.proof_image || null,
                    marked_by: attendanceData.marked_by || null,
                    document_confirmed: attendanceData.document_confirmed || null,
                    confirmed_by: attendanceData.confirmed_by || null,
                    created_at: attendanceData.created_at,
                    updated_at: attendanceData.updated_at
                  },
                  metadata: {
                    title: studentName,
                    nama: studentName,
                    operationLabel: 'Tambah kehadiran (bulk)',
                    redirectPath: `/kehadiran?start_date=${attendanceDate}&end_date=${attendanceDate}&class_id=${class_id}`,
                    notes: `Kehadiran baru ditambah (bulk): ${studentName} - ${className} - ${status} pada ${attendanceDate}`
                  },
                  actorIc
                });
              }
            } catch (snapshotError) {
              console.error('[BULK ATTENDANCE] Failed to create snapshot for create:', snapshotError);
              // Continue even if snapshot fails
            }
          }
        }
      }

      await connection.commit();
      connection.release();

      res.json({
        success: true,
        message: 'Bulk attendance marked successfully',
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Bulk mark attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const bulkMarkAttendanceWithProof = async (req, res) => {
  try {
    const { class_id, tarikh, attendance_data } = req.body;
    
    if (!class_id || !attendance_data) {
      return res.status(400).json({
        success: false,
        message: 'class_id and attendance_data are required',
      });
    }

    // Parse attendance_data if it's a string (from FormData)
    let parsedAttendanceData;
    try {
      parsedAttendanceData = typeof attendance_data === 'string' 
        ? JSON.parse(attendance_data) 
        : attendance_data;
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attendance_data format',
      });
    }

    if (!Array.isArray(parsedAttendanceData) || parsedAttendanceData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'attendance_data must be a non-empty array',
      });
    }

    // Use current date if tarikh is not provided
    const attendanceDate = tarikh || new Date().toISOString().split('T')[0];

    // If user is a teacher, check if they are assigned to this class
    if (req.user && req.user.role === 'teacher') {
      const [classCheck] = await pool.execute(
        'SELECT guru_ic FROM classes WHERE id = ?',
        [class_id]
      );
      
      if (classCheck.length === 0 || classCheck[0].guru_ic !== req.user.ic) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to mark attendance for this class',
        });
      }
    }

    // Handle proof image
    let proofImagePath = null;
    if (req.file) {
      proofImagePath = `uploads/${req.file.filename}`;
    }

    // Get user who marked the attendance
    const markedBy = req.user?.ic || null;

    // Get a connection from the pool for transaction
    const connection = await pool.getConnection();
    const actorIc = req.user?.ic;
    // Only create snapshots for admin/teacher - PIC actions go to approval, not snapshots
    const shouldCreateSnapshots = actorIc && (req.user?.role === 'admin' || req.user?.role === 'teacher');
    
    try {
      // Start transaction
      await connection.beginTransaction();

      for (const record of parsedAttendanceData) {
        const { student_ic, status } = record;

        // Allow additional statuses: Lewat, Sakit
        if (!['Hadir', 'Tidak Hadir', 'Cuti', 'Lewat', 'Sakit'].includes(status)) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({
            success: false,
            message: `Invalid attendance status: ${status}`,
          });
        }

        // Check if attendance already exists
        const [existingAttendance] = await connection.execute(
          `SELECT a.*, u.nama as pelajar_nama, c.nama_kelas
           FROM attendance a
           LEFT JOIN users u ON a.student_ic = u.ic
           LEFT JOIN classes c ON a.class_id = c.id
           WHERE a.student_ic = ? AND a.class_id = ? AND a.tarikh = ?`,
          [student_ic, class_id, attendanceDate]
        );

        if (existingAttendance.length > 0) {
          // Create snapshot before update
          const existingData = existingAttendance[0];
          if (shouldCreateSnapshots) {
            try {
              const studentName = existingData.pelajar_nama || student_ic;
              const className = existingData.nama_kelas || 'Kelas';
              
              await createSnapshot({
                entityType: 'attendance',
                entityId: existingData.id,
                entityIdentifier: `${student_ic}-${class_id}-${attendanceDate}`,
                operation: 'update',
                data: {
                  id: existingData.id,
                  student_ic: existingData.student_ic,
                  class_id: existingData.class_id,
                  tarikh: existingData.tarikh,
                  status: existingData.status,
                  proof_image: existingData.proof_image || null,
                  marked_by: existingData.marked_by || null,
                  document_confirmed: existingData.document_confirmed || null,
                  confirmed_by: existingData.confirmed_by || null,
                  created_at: existingData.created_at,
                  updated_at: existingData.updated_at
                },
                metadata: {
                  title: studentName,
                  nama: studentName,
                  operationLabel: 'Kemas kini kehadiran (bulk dengan bukti)',
                  redirectPath: `/kehadiran?start_date=${attendanceDate}&end_date=${attendanceDate}&class_id=${class_id}`,
                  notes: `Status kehadiran diubah (bulk dengan bukti): ${studentName} - ${className} - dari ${existingData.status} kepada ${status} pada ${attendanceDate}`
                },
                actorIc
              });
            } catch (snapshotError) {
              console.error('[BULK ATTENDANCE WITH PROOF] Failed to create snapshot for update:', snapshotError);
              // Continue with update even if snapshot fails
            }
          }
          
          // Update existing - always update all fields (use NULL if not provided)
          await connection.execute(
            `
            UPDATE attendance 
            SET status = ?, 
                proof_image = ?,
                marked_by = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE student_ic = ? AND class_id = ? AND tarikh = ?
          `,
            [status, proofImagePath || null, markedBy || null, student_ic, class_id, attendanceDate]
          );
        } else {
          // Insert new - always include all fields (use NULL if not provided)
          const [insertResult] = await connection.execute(
            `
            INSERT INTO attendance (student_ic, class_id, tarikh, status, proof_image, marked_by)
            VALUES (?, ?, ?, ?, ?, ?)
          `,
            [student_ic, class_id, attendanceDate, status, proofImagePath || null, markedBy || null]
          );
          
          // Create snapshot after create
          if (shouldCreateSnapshots && insertResult.insertId) {
            try {
              const [newAttendance] = await connection.execute(
                `SELECT a.*, u.nama as pelajar_nama, c.nama_kelas
                 FROM attendance a
                 LEFT JOIN users u ON a.student_ic = u.ic
                 LEFT JOIN classes c ON a.class_id = c.id
                 WHERE a.id = ?`,
                [insertResult.insertId]
              );
              
              if (newAttendance.length > 0) {
                const attendanceData = newAttendance[0];
                const studentName = attendanceData.pelajar_nama || student_ic;
                const className = attendanceData.nama_kelas || 'Kelas';
                
                await createSnapshot({
                  entityType: 'attendance',
                  entityId: insertResult.insertId,
                  entityIdentifier: `${student_ic}-${class_id}-${attendanceDate}`,
                  operation: 'create',
                  data: {
                    id: attendanceData.id,
                    student_ic: attendanceData.student_ic,
                    class_id: attendanceData.class_id,
                    tarikh: attendanceData.tarikh,
                    status: attendanceData.status,
                    proof_image: attendanceData.proof_image || null,
                    marked_by: attendanceData.marked_by || null,
                    document_confirmed: attendanceData.document_confirmed || null,
                    confirmed_by: attendanceData.confirmed_by || null,
                    created_at: attendanceData.created_at,
                    updated_at: attendanceData.updated_at
                  },
                  metadata: {
                    title: studentName,
                    nama: studentName,
                    operationLabel: 'Tambah kehadiran (bulk dengan bukti)',
                    redirectPath: `/kehadiran?start_date=${attendanceDate}&end_date=${attendanceDate}&class_id=${class_id}`,
                    notes: `Kehadiran baru ditambah (bulk dengan bukti): ${studentName} - ${className} - ${status} pada ${attendanceDate}`
                  },
                  actorIc
                });
              }
            } catch (snapshotError) {
              console.error('[BULK ATTENDANCE WITH PROOF] Failed to create snapshot for create:', snapshotError);
              // Continue even if snapshot fails
            }
          }
        }
      }

      await connection.commit();
      connection.release();

      res.json({
        success: true,
        message: 'Bulk attendance marked successfully',
        proof_image: proofImagePath,
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Bulk mark attendance with proof error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

export const deleteAttendance = async (req, res) => {
  console.log(`\n${'🎯'.repeat(40)}`);
  console.log('[DELETE ATTENDANCE CONTROLLER] ===== CONTROLLER CALLED =====');
  console.log('[DELETE ATTENDANCE CONTROLLER] ID:', req.params.id);
  console.log('[DELETE ATTENDANCE CONTROLLER] User:', req.user?.ic, 'Role:', req.user?.role);
  console.log('[DELETE ATTENDANCE CONTROLLER] Timestamp:', new Date().toISOString());
  console.log(`${'🎯'.repeat(40)}\n`);
  
  try {
    const { id } = req.params;
    const attendanceId = parseInt(id);
    
    if (isNaN(attendanceId)) {
      console.error('[DELETE ATTENDANCE] ❌ Invalid attendance ID:', id);
      return res.status(400).json({
        success: false,
        message: 'Invalid attendance ID'
      });
    }
    
    // STEP 1: Fetch attendance data BEFORE deletion (MANDATORY for Recycle Bin)
    console.log('[DELETE ATTENDANCE] STEP 1: Fetching attendance data for ID:', attendanceId);
    const [existingAttendance] = await pool.execute(
      `SELECT a.*, u.nama as pelajar_nama, c.nama_kelas
       FROM attendance a
       LEFT JOIN users u ON a.student_ic = u.ic
       LEFT JOIN classes c ON a.class_id = c.id
       WHERE a.id = ?`,
      [attendanceId]
    );

    if (existingAttendance.length === 0) {
      console.error('[DELETE ATTENDANCE] ❌ Attendance record not found for ID:', attendanceId);
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    const attendanceData = existingAttendance[0];
    const studentName = attendanceData.pelajar_nama || attendanceData.student_ic;
    console.log('[DELETE ATTENDANCE] ✅ STEP 1: Attendance data fetched:', {
      id: attendanceData.id,
      student_ic: attendanceData.student_ic,
      class_id: attendanceData.class_id,
      tarikh: attendanceData.tarikh,
      status: attendanceData.status
    });

    // STEP 2: Create snapshot for Recycle Bin BEFORE deletion (MANDATORY)
    // This must happen BEFORE the actual deletion for recovery purposes
    if (!req.user || !req.user.ic) {
      console.error('[DELETE ATTENDANCE] ❌ No user or IC found in request');
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'pic' && req.user.role !== 'teacher') {
      console.error('[DELETE ATTENDANCE] ❌ Insufficient permissions. User role:', req.user.role);
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete attendance records.'
      });
    }

    // Prepare snapshot data - ensure all required fields are present
    const attendanceDataForSnapshot = {
      id: attendanceData.id,
      student_ic: attendanceData.student_ic,
      class_id: attendanceData.class_id,
      tarikh: attendanceData.tarikh,
      status: attendanceData.status,
      proof_image: attendanceData.proof_image || null,
      marked_by: attendanceData.marked_by || null,
      document_confirmed: attendanceData.document_confirmed || null,
      confirmed_by: attendanceData.confirmed_by || null,
      created_at: attendanceData.created_at,
      updated_at: attendanceData.updated_at
    };
    
    // Create snapshot BEFORE deletion (only for admin/teacher - PIC actions are intercepted by approval middleware)
    // NOTE: PIC users never reach this controller because requirePicApproval middleware intercepts them
    console.log('[DELETE ATTENDANCE] STEP 2: Creating snapshot for Recycle Bin (admin/teacher only)');
    console.log('[DELETE ATTENDANCE] Snapshot parameters:', {
      entityType: 'attendance',
      entityId: attendanceId,
      entityIdentifier: `${attendanceData.student_ic}-${attendanceData.class_id}-${attendanceData.tarikh}`,
      operation: 'delete',
      actorIc: req.user.ic,
      hasData: !!attendanceDataForSnapshot,
      dataKeys: Object.keys(attendanceDataForSnapshot)
    });
    
    let snapshotId;
    try {
      // Ensure entityId is a number
      const numericEntityId = Number(attendanceId);
      if (isNaN(numericEntityId)) {
        throw new Error(`Invalid entity ID: ${attendanceId}`);
      }
      
      snapshotId = await createSnapshot({
        entityType: 'attendance',
        entityId: numericEntityId,
        entityIdentifier: `${attendanceData.student_ic}-${attendanceData.class_id}-${attendanceData.tarikh}`,
        operation: 'delete',
        data: attendanceDataForSnapshot,
        metadata: {
          title: studentName,
          nama: studentName,
          operationLabel: 'Padam kehadiran',
          redirectPath: `/kehadiran?start_date=${attendanceData.tarikh}&end_date=${attendanceData.tarikh}&class_id=${attendanceData.class_id}`
        },
        actorIc: req.user.ic
      });
      
      if (!snapshotId || snapshotId <= 0) {
        throw new Error(`Snapshot creation returned invalid ID: ${snapshotId}`);
      }
      
      console.log('[DELETE ATTENDANCE] ✅ STEP 2: Snapshot created successfully with ID:', snapshotId);
    } catch (snapshotError) {
      console.error('[DELETE ATTENDANCE] ❌ CRITICAL: Failed to create snapshot:', snapshotError);
      console.error('[DELETE ATTENDANCE] ❌ Snapshot error details:', {
        message: snapshotError.message,
        stack: snapshotError.stack,
        entityId: attendanceId,
        actorIc: req.user.ic
      });
      return res.status(500).json({
        success: false,
        message: 'Failed to create Recycle Bin entry. Deletion aborted for data safety.',
        error: snapshotError.message
      });
    }
    
    // Verify snapshot exists in database (CRITICAL CHECK)
    console.log('[DELETE ATTENDANCE] Verifying snapshot exists in database...');
    let verifySnapshot;
    try {
      [verifySnapshot] = await pool.execute(
        'SELECT id, entity_type, entity_id, operation, created_at, expires_at, was_undone FROM admin_action_snapshots WHERE id = ?',
        [snapshotId]
      );
    } catch (verifyError) {
      console.error('[DELETE ATTENDANCE] ❌ CRITICAL: Failed to verify snapshot:', verifyError);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify Recycle Bin entry. Deletion aborted for data safety.',
        error: verifyError.message
      });
    }
    
    if (!verifySnapshot || verifySnapshot.length === 0) {
      console.error('[DELETE ATTENDANCE] ❌ CRITICAL: Snapshot was created but cannot be found in database!');
      console.error('[DELETE ATTENDANCE] Snapshot ID that was returned:', snapshotId);
      console.error('[DELETE ATTENDANCE] Attempting to query database directly...');
      
      // Try to find any attendance snapshots for this entity
      try {
        const [allSnapshots] = await pool.execute(
          'SELECT id, entity_type, entity_id, operation FROM admin_action_snapshots WHERE entity_type = ? AND entity_id = ? ORDER BY created_at DESC LIMIT 5',
          ['attendance', attendanceId]
        );
        console.error('[DELETE ATTENDANCE] Found snapshots for this entity:', allSnapshots);
      } catch (queryError) {
        console.error('[DELETE ATTENDANCE] Failed to query for snapshots:', queryError);
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to verify Recycle Bin entry. Deletion aborted for data safety.'
      });
    }
    
    console.log('[DELETE ATTENDANCE] ✅ Snapshot verified in database:', {
      id: verifySnapshot[0].id,
      entity_type: verifySnapshot[0].entity_type,
      entity_id: verifySnapshot[0].entity_id,
      operation: verifySnapshot[0].operation,
      created_at: verifySnapshot[0].created_at,
      expires_at: verifySnapshot[0].expires_at,
      was_undone: verifySnapshot[0].was_undone
    });
    
    // STEP 3: Delete attendance record (only after snapshot is safely created and verified)
    console.log('[DELETE ATTENDANCE] STEP 3: Deleting attendance record from database');
    const [result] = await pool.execute(
      'DELETE FROM attendance WHERE id = ?',
      [attendanceId]
    );

    if (result.affectedRows === 0) {
      console.error('[DELETE ATTENDANCE] ❌ No rows affected by DELETE query. Record may have been deleted already.');
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }
    
    console.log('[DELETE ATTENDANCE] ✅ STEP 3: Attendance record deleted successfully');
    console.log('[DELETE ATTENDANCE] ✅ COMPLETE: Deletion successful. Snapshot ID:', snapshotId);
    console.log(`${'✅'.repeat(40)}\n`);
    
    // Final verification: Query the snapshot one more time to ensure it exists
    try {
      const [finalCheck] = await pool.execute(
        'SELECT id, entity_type, entity_id, operation, created_at, expires_at FROM admin_action_snapshots WHERE id = ?',
        [snapshotId]
      );
      if (finalCheck.length > 0) {
        console.log('[DELETE ATTENDANCE] ✅✅✅ FINAL VERIFICATION: Snapshot confirmed in database:', finalCheck[0]);
      } else {
        console.error('[DELETE ATTENDANCE] ❌❌❌ FINAL VERIFICATION FAILED: Snapshot not found after deletion!');
      }
    } catch (checkError) {
      console.error('[DELETE ATTENDANCE] ❌ Error during final verification:', checkError);
    }
    
    // Set response headers to confirm this controller was called
    res.setHeader('X-Snapshot-Created', 'true');
    res.setHeader('X-Snapshot-Id', String(snapshotId));
    res.setHeader('X-Attendance-Deleted', 'true');
    
    res.json({
      success: true,
      message: 'Attendance record deleted successfully',
      snapshotId: snapshotId, // Include snapshot ID in response for debugging
      debug: {
        snapshotCreated: true,
        snapshotId: snapshotId,
        entityType: 'attendance',
        entityId: attendanceId
      }
    });
  } catch (error) {
    console.error('[DELETE ATTENDANCE] ❌ ERROR:', error);
    console.error('[DELETE ATTENDANCE] ❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const confirmAttendanceDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { confirmed, notes } = req.body;
    const confirmedBy = req.user?.ic;

    if (!confirmedBy) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Check if attendance record exists
    const [existingAttendance] = await pool.execute(
      'SELECT * FROM attendance WHERE id = ?',
      [id]
    );

    if (existingAttendance.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    const isConfirmed = confirmed === true || confirmed === 1 || confirmed === '1';

    // Create snapshot before update (only for admin/teacher - PIC actions go to approval, not snapshots)
    const actorIc = req.user?.ic;
    const userRole = req.user?.role;
    const shouldCreateSnapshot = actorIc && (userRole === 'admin' || userRole === 'teacher');
    
    if (shouldCreateSnapshot) {
      try {
        // Get full attendance data with student and class names for snapshot
        const [attendanceForSnapshot] = await pool.execute(
          `SELECT a.*, u.nama as pelajar_nama, c.nama_kelas
           FROM attendance a
           LEFT JOIN users u ON a.student_ic = u.ic
           LEFT JOIN classes c ON a.class_id = c.id
           WHERE a.id = ?`,
          [id]
        );
        
        if (attendanceForSnapshot.length > 0) {
          const attendanceData = attendanceForSnapshot[0];
          const studentName = attendanceData.pelajar_nama || attendanceData.student_ic;
          const className = attendanceData.nama_kelas || 'Kelas';
          const confirmationStatus = attendanceData.document_confirmed ? 'Disahkan' : 'Tidak disahkan';
          const newStatus = isConfirmed ? 'Disahkan' : 'Tidak disahkan';
          
          await createSnapshot({
            entityType: 'attendance',
            entityId: parseInt(id),
            entityIdentifier: `${attendanceData.student_ic}-${attendanceData.class_id}-${attendanceData.tarikh}`,
            operation: 'update',
            data: {
              id: attendanceData.id,
              student_ic: attendanceData.student_ic,
              class_id: attendanceData.class_id,
              tarikh: attendanceData.tarikh,
              status: attendanceData.status,
              proof_image: attendanceData.proof_image || null,
              marked_by: attendanceData.marked_by || null,
              document_confirmed: attendanceData.document_confirmed || null,
              confirmed_by: attendanceData.confirmed_by || null,
              confirmation_notes: attendanceData.confirmation_notes || null,
              created_at: attendanceData.created_at,
              updated_at: attendanceData.updated_at
            },
            metadata: {
              title: studentName,
              nama: studentName,
              operationLabel: 'Kemas kini pengesahan dokumen kehadiran',
              redirectPath: `/kehadiran?start_date=${attendanceData.tarikh}&end_date=${attendanceData.tarikh}&class_id=${attendanceData.class_id}`,
              notes: `Status pengesahan dokumen diubah: ${studentName} - ${className} - dari ${confirmationStatus} kepada ${newStatus} pada ${attendanceData.tarikh}`
            },
            actorIc
          });
        }
      } catch (snapshotError) {
        console.error('[CONFIRM ATTENDANCE DOCUMENT] Failed to create snapshot:', snapshotError);
        // Continue with update even if snapshot fails
      }
    }

    // Update confirmation status
    await pool.execute(
      `UPDATE attendance 
       SET document_confirmed = ?, 
           confirmed_by = ?, 
           confirmed_at = ${isConfirmed ? 'CURRENT_TIMESTAMP' : 'NULL'},
           confirmation_notes = ?
       WHERE id = ?`,
      [isConfirmed ? 1 : 0, isConfirmed ? confirmedBy : null, notes || null, id]
    );

    const [updatedAttendance] = await pool.execute(
      `SELECT a.*, u.nama as pelajar_nama, u.ic as pelajar_ic, c.nama_kelas,
              cu.nama as confirmed_by_name
       FROM attendance a
       JOIN users u ON a.student_ic = u.ic
       JOIN classes c ON a.class_id = c.id
       LEFT JOIN users cu ON a.confirmed_by = cu.ic
       WHERE a.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: isConfirmed ? 'Document confirmed successfully' : 'Document confirmation removed',
      data: updatedAttendance[0]
    });
  } catch (error) {
    console.error('Confirm attendance document error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
import { pool } from '../config/database.js';
import { registerPendingPicHandler } from '../utils/pendingPicChanges.js';
import { createSnapshot, SNAPSHOT_TTL_HOURS } from '../utils/adminActionSnapshots.js';

/**
 * Create or update attendance record
 * @param {Object} data - Attendance data
 * @param {string} data.student_ic - Student IC
 * @param {number} data.class_id - Class ID
 * @param {string} data.tarikh - Date (ISO format)
 * @param {string} data.status - Status (Hadir, Tidak Hadir, Cuti)
 * @param {Object} options - Options
 * @param {Object} options.connection - Database connection (for transactions)
 * @returns {Promise<Object>} Created/updated attendance record
 */
export const createOrUpdateAttendanceRecord = async (data, options = {}) => {
  const { student_ic, class_id, tarikh, status } = data;
  const executor = options.connection || pool;
  const attendanceDate = tarikh || new Date().toISOString().split('T')[0];

  // Check if attendance already exists
  const [existingAttendance] = await executor.execute(
    'SELECT id FROM attendance WHERE student_ic = ? AND class_id = ? AND tarikh = ?',
    [student_ic, class_id, attendanceDate]
  );

  if (existingAttendance.length > 0) {
    // Update existing attendance
    await executor.execute(
      `UPDATE attendance 
       SET status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE student_ic = ? AND class_id = ? AND tarikh = ?`,
      [status, student_ic, class_id, attendanceDate]
    );

    const [updated] = await executor.execute(
      'SELECT * FROM attendance WHERE student_ic = ? AND class_id = ? AND tarikh = ?',
      [student_ic, class_id, attendanceDate]
    );
    return { attendance: updated[0], wasCreated: false };
  } else {
    // Create new attendance record
    await executor.execute(
      `INSERT INTO attendance (student_ic, class_id, tarikh, status)
       VALUES (?, ?, ?, ?)`,
      [student_ic, class_id, attendanceDate, status]
    );

    const [created] = await executor.execute(
      'SELECT * FROM attendance WHERE student_ic = ? AND class_id = ? AND tarikh = ?',
      [student_ic, class_id, attendanceDate]
    );
    return { attendance: created[0], wasCreated: true };
  }
};

/**
 * Update attendance record by ID
 * @param {number} id - Attendance record ID
 * @param {Object} data - Update data
 * @param {string} data.status - Status (Hadir, Tidak Hadir, Cuti)
 * @param {Object} options - Options
 * @param {Object} options.connection - Database connection (for transactions)
 * @returns {Promise<Object>} Updated attendance record
 */
export const updateAttendanceRecord = async (id, data, options = {}) => {
  const { status } = data;
  const executor = options.connection || pool;
  const attendanceId = parseInt(id);

  // Check if attendance record exists
  const [existingAttendance] = await executor.execute(
    'SELECT * FROM attendance WHERE id = ?',
    [attendanceId]
  );

  if (existingAttendance.length === 0) {
    const error = new Error('Attendance record not found');
    error.status = 404;
    throw error;
  }

  // Update attendance
  await executor.execute(
    'UPDATE attendance SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [status, attendanceId]
  );

  const [updated] = await executor.execute(
    'SELECT * FROM attendance WHERE id = ?',
    [attendanceId]
  );

  return { attendance: updated[0] };
};

/**
 * Delete attendance record
 * @param {number} id - Attendance record ID
 * @param {Object} options - Options
 * @param {Object} options.connection - Database connection (for transactions)
 * @returns {Promise<Object>} Deleted attendance record info
 */
export const deleteAttendanceRecord = async (id, options = {}) => {
  const executor = options.connection || pool;
  const attendanceId = parseInt(id);

  // Check if attendance record exists
  const [existingAttendance] = await executor.execute(
    'SELECT * FROM attendance WHERE id = ?',
    [attendanceId]
  );

  if (existingAttendance.length === 0) {
    const error = new Error('Attendance record not found');
    error.status = 404;
    throw error;
  }

  const deletedRecord = existingAttendance[0];

  // Delete attendance record
  await executor.execute(
    'DELETE FROM attendance WHERE id = ?',
    [attendanceId]
  );

  return { deletedId: attendanceId, deletedRecord };
};

// Register approval handlers
registerPendingPicHandler('attendance:create', async ({ payload, actorIc, adminIc, connection }) => {
  const result = await createOrUpdateAttendanceRecord(
    payload,
    { connection }
  );
  return result.attendance;
});

registerPendingPicHandler('attendance:update', async ({ payload, entityId, actorIc, adminIc, connection }) => {
  const result = await updateAttendanceRecord(
    entityId,
    payload,
    { connection }
  );
  return result.attendance;
});

registerPendingPicHandler('attendance:delete', async ({ entityId, actorIc, adminIc, connection }) => {
  console.log('[ATTENDANCE SERVICE] ===== PIC APPROVED DELETION HANDLER =====');
  console.log('[ATTENDANCE SERVICE] Entity ID:', entityId);
  console.log('[ATTENDANCE SERVICE] Actor IC (PIC):', actorIc);
  console.log('[ATTENDANCE SERVICE] Admin IC (approver):', adminIc);
  
  // STEP 1: Get attendance data BEFORE deletion (CRITICAL for snapshot)
  const executor = connection || pool;
  console.log('[ATTENDANCE SERVICE] STEP 1: Fetching attendance data for snapshot...');
  const [existingAttendance] = await executor.execute(
    `SELECT a.*, u.nama as pelajar_nama, c.nama_kelas
     FROM attendance a
     LEFT JOIN users u ON a.student_ic = u.ic
     LEFT JOIN classes c ON a.class_id = c.id
     WHERE a.id = ?`,
    [entityId]
  );

  if (existingAttendance.length === 0) {
    const error = new Error('Attendance record not found');
    error.status = 404;
    throw error;
  }

  const attendanceData = existingAttendance[0];
  console.log('[ATTENDANCE SERVICE] Attendance data retrieved:', {
    id: attendanceData.id,
    student_ic: attendanceData.student_ic,
    student_name: attendanceData.pelajar_nama,
    class_name: attendanceData.nama_kelas
  });

  // STEP 2: Create snapshot BEFORE deletion (MUST happen first!)
  console.log('[ATTENDANCE SERVICE] STEP 2: Creating snapshot BEFORE deletion...');
  try {
    const snapshotData = {
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

    const entityIdentifier = `${attendanceData.student_ic}-${attendanceData.class_id}-${attendanceData.tarikh}`;
    
    console.log('[ATTENDANCE SERVICE] Creating snapshot with:', {
      entityType: 'attendance',
      entityId: Number(entityId),
      entityIdentifier,
      operation: 'delete',
      actorIc: adminIc || actorIc // Use admin IC if available, otherwise PIC IC
    });

    // CRITICAL: Create snapshot BEFORE deletion
    const snapshotId = await createSnapshot({
      entityType: 'attendance',
      entityId: Number(entityId),
      entityIdentifier,
      operation: 'delete',
      data: snapshotData,
      metadata: {
        title: attendanceData.pelajar_nama || attendanceData.student_ic,
        nama: attendanceData.pelajar_nama || attendanceData.student_ic,
        operationLabel: 'Padam kehadiran',
        redirectPath: `/kehadiran?start_date=${attendanceData.tarikh}&end_date=${attendanceData.tarikh}&class_id=${attendanceData.class_id}`,
        notes: `Kehadiran dipadam: ${attendanceData.pelajar_nama || attendanceData.student_ic} - ${attendanceData.nama_kelas || 'Kelas'} - ${attendanceData.status} pada ${attendanceData.tarikh} (Diluluskan oleh admin)`
      },
      actorIc: adminIc || actorIc // Use admin IC since they approved the deletion, fallback to PIC IC
    });

    console.log('[ATTENDANCE SERVICE] ✅✅✅ SNAPSHOT CREATED SUCCESSFULLY! ✅✅✅');
    console.log('[ATTENDANCE SERVICE] Snapshot ID:', snapshotId);
    console.log('[ATTENDANCE SERVICE] Snapshot created BEFORE deletion - this will appear in Recycle Bin!');
  } catch (snapshotError) {
    console.error('[ATTENDANCE SERVICE] ❌ CRITICAL: FAILED to create snapshot for approved PIC deletion:', snapshotError);
    console.error('[ATTENDANCE SERVICE] Error details:', {
      message: snapshotError.message,
      stack: snapshotError.stack
    });
    // Don't fail the deletion if snapshot creation fails, but log it prominently
  }

  // STEP 3: Delete attendance record (AFTER snapshot is created)
  console.log('[ATTENDANCE SERVICE] STEP 3: Deleting attendance record from database...');
  const result = await deleteAttendanceRecord(
    entityId,
    { connection }
  );
  console.log('[ATTENDANCE SERVICE] ✅ Attendance record deleted from database');
  
  return result;
});


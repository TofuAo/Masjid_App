import cron from 'node-cron';
import { pool } from '../config/database.js';

/**
 * Monthly Fee Generation Job
 * Automatically creates fees (yuran) for all active students at the start of each month
 * Runs on the 1st of each month at 1:00 AM
 */
export const scheduleMonthlyFeeGeneration = () => {
  // Run on the 1st of each month at 1:00 AM
  // Cron format: minute hour day month day-of-week
  // '0 1 1 * *' = At 01:00 on day-of-month 1
  cron.schedule('0 1 1 * *', async () => {
    console.log('[Monthly Fees] Starting monthly fee generation...');
    
    try {
      const now = new Date();
      const currentMonth = now.getMonth(); // 0-11
      const currentYear = now.getFullYear();
      
      // Month names in Malay
      const monthNames = [
        'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
        'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
      ];
      const bulan = monthNames[currentMonth];
      
      console.log(`[Monthly Fees] Generating fees for ${bulan} ${currentYear}`);
      
      // Get all active students with their class information
      const [students] = await pool.execute(`
        SELECT 
          u.ic as student_ic,
          u.nama as student_nama,
          s.kelas_id,
          c.yuran as class_yuran,
          c.nama_kelas
        FROM users u
        INNER JOIN students s ON u.ic = s.user_ic
        LEFT JOIN classes c ON s.kelas_id = c.id
        WHERE u.role = 'student' 
          AND u.status = 'aktif'
          AND s.kelas_id IS NOT NULL
        ORDER BY u.ic
      `);
      
      console.log(`[Monthly Fees] Found ${students.length} active students`);
      
      let createdCount = 0;
      let skippedCount = 0;
      let errorCount = 0;
      
      for (const student of students) {
        try {
          // Check if fee already exists for this month and year
          const [existingFees] = await pool.execute(`
            SELECT id FROM fees 
            WHERE student_ic = ? 
              AND bulan = ? 
              AND tahun = ?
            LIMIT 1
          `, [student.student_ic, bulan, currentYear]);
          
          if (existingFees.length > 0) {
            console.log(`[Monthly Fees] Fee already exists for ${student.student_nama} (${student.student_ic}) - ${bulan} ${currentYear}`);
            skippedCount++;
            continue;
          }
          
          // Get the fee amount from class, or use default 150.00
          const feeAmount = student.class_yuran || 150.00;
          
          // Create fee record
          const feeDate = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
          
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
          `, [
            student.student_ic,
            feeAmount,
            feeDate,
            bulan,
            currentYear
          ]);
          
          createdCount++;
          console.log(`[Monthly Fees] Created fee for ${student.student_nama} (${student.student_ic}): RM ${feeAmount} - ${bulan} ${currentYear}`);
          
        } catch (error) {
          errorCount++;
          console.error(`[Monthly Fees] Error creating fee for ${student.student_nama} (${student.student_ic}):`, error.message);
          // Continue with next student
        }
      }
      
      console.log(`[Monthly Fees] Monthly fee generation completed:`);
      console.log(`  - Created: ${createdCount} fees`);
      console.log(`  - Skipped: ${skippedCount} (already exist)`);
      console.log(`  - Errors: ${errorCount}`);
      
    } catch (error) {
      console.error('[Monthly Fees] Monthly fee generation job failed:', error);
    }
  });
  
  console.log('[Monthly Fees] Monthly fee generation job scheduled (1st of each month at 1:00 AM)');
  
  // Check and generate current month fees on startup if they don't exist
  // This handles cases where the scheduler was added mid-month
  // Run asynchronously without blocking
  checkAndGenerateCurrentMonthFees().catch(err => {
    console.error('[Monthly Fees] Error in startup fee check:', err);
  });
};

/**
 * Check if current month fees exist, and generate them if they don't
 * This runs once on server startup to catch up if scheduler was added mid-month
 */
const checkAndGenerateCurrentMonthFees = async () => {
  try {
    console.log('[Monthly Fees] Checking current month fees on startup...');
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Month names in Malay
    const monthNames = [
      'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
      'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
    ];
    const bulan = monthNames[currentMonth];
    
    console.log(`[Monthly Fees] Current date: ${now.toISOString()}, Month: ${bulan} ${currentYear}, Day: ${now.getDate()}`);
    
    // Check if any fees exist for current month
    const [existingFees] = await pool.execute(`
      SELECT COUNT(*) as count FROM fees 
      WHERE bulan = ? AND tahun = ?
    `, [bulan, currentYear]);
    
    const feeCount = existingFees[0]?.count || 0;
    console.log(`[Monthly Fees] Found ${feeCount} existing fees for ${bulan} ${currentYear}`);
    
    // If no fees exist for current month and we're past the 1st, generate them
    if (feeCount === 0 && now.getDate() > 1) {
      console.log(`[Monthly Fees] No fees found for ${bulan} ${currentYear}. Generating now...`);
      const result = await generateMonthlyFeesManually(currentMonth, currentYear);
      console.log(`[Monthly Fees] ✅ Generated ${result.created} fees for ${bulan} ${currentYear} (Skipped: ${result.skipped}, Errors: ${result.errors})`);
    } else if (feeCount > 0) {
      console.log(`[Monthly Fees] ✅ Fees already exist for ${bulan} ${currentYear} (${feeCount} records)`);
    } else {
      console.log(`[Monthly Fees] It's the 1st of the month - fees will be generated by scheduled job`);
    }
  } catch (error) {
    console.error('[Monthly Fees] ❌ Error checking current month fees:', error);
    // Don't throw - this is just a convenience check
  }
};

/**
 * Manually trigger fee generation (for testing or manual runs)
 * Can be called from an admin endpoint if needed
 */
export const generateMonthlyFeesManually = async (month = null, year = null) => {
  try {
    const now = new Date();
    const targetMonth = month !== null ? month : now.getMonth();
    const targetYear = year !== null ? year : now.getFullYear();
    
    // Month names in Malay
    const monthNames = [
      'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
      'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
    ];
    const bulan = monthNames[targetMonth];
    
    console.log(`[Monthly Fees] Manual generation for ${bulan} ${targetYear}`);
    
    // Get all active students with their class information
    const [students] = await pool.execute(`
      SELECT 
        u.ic as student_ic,
        u.nama as student_nama,
        s.kelas_id,
        c.yuran as class_yuran,
        c.nama_kelas
      FROM users u
      INNER JOIN students s ON u.ic = s.user_ic
      LEFT JOIN classes c ON s.kelas_id = c.id
      WHERE u.role = 'student' 
        AND u.status = 'aktif'
        AND s.kelas_id IS NOT NULL
      ORDER BY u.ic
    `);
    
    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const student of students) {
      try {
        // Check if fee already exists for this month and year
        const [existingFees] = await pool.execute(`
          SELECT id FROM fees 
          WHERE student_ic = ? 
            AND bulan = ? 
            AND tahun = ?
          LIMIT 1
        `, [student.student_ic, bulan, targetYear]);
        
        if (existingFees.length > 0) {
          skippedCount++;
          continue;
        }
        
        // Get the fee amount from class, or use default 150.00
        const feeAmount = student.class_yuran || 150.00;
        
        // Create fee record
        const feeDate = new Date(targetYear, targetMonth, 1).toISOString().split('T')[0];
        
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
        `, [
          student.student_ic,
          feeAmount,
          feeDate,
          bulan,
          targetYear
        ]);
        
        createdCount++;
        
      } catch (error) {
        errorCount++;
        console.error(`[Monthly Fees] Error creating fee for ${student.student_nama}:`, error.message);
      }
    }
    
    return {
      success: true,
      message: `Fee generation completed for ${bulan} ${targetYear}`,
      created: createdCount,
      skipped: skippedCount,
      errors: errorCount,
      total: students.length
    };
    
  } catch (error) {
    console.error('[Monthly Fees] Manual fee generation failed:', error);
    throw error;
  }
};

/**
 * Sync current month fees with class yuran amounts
 * Automatically adjusts all unpaid fees for the current month to match their class's current yuran amount
 * This ensures fees stay in sync when admins change class yuran amounts
 */
export const syncCurrentMonthFeesWithClassYuran = async () => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11
    const currentYear = now.getFullYear();
    
    // Month names in Malay
    const monthNames = [
      'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
      'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
    ];
    const currentMonthName = monthNames[currentMonth];
    
    console.log(`[Fee Sync] Starting sync of current month fees with class yuran amounts...`);
    console.log(`[Fee Sync] Current month: ${currentMonthName} ${currentYear}`);
    
    // Get all classes with their current yuran amounts
    const [classes] = await pool.execute(`
      SELECT id, nama_kelas, yuran 
      FROM classes 
      WHERE status = 'aktif'
    `);
    
    console.log(`[Fee Sync] Found ${classes.length} active classes`);
    
    let totalUpdated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    
    for (const classItem of classes) {
      try {
        const classId = classItem.id;
        const classYuran = parseFloat(classItem.yuran) || 0;
        const className = classItem.nama_kelas;
        
        if (classYuran <= 0) {
          console.log(`[Fee Sync] Skipping class ${className} (ID: ${classId}) - yuran is 0 or invalid`);
          continue;
        }
        
        // Get all students in this class
        const [students] = await pool.execute(`
          SELECT user_ic FROM students WHERE kelas_id = ?
        `, [classId]);
        
        if (students.length === 0) {
          console.log(`[Fee Sync] No students in class ${className} (ID: ${classId})`);
          continue;
        }
        
        const studentIcs = students.map(s => s.user_ic);
        const placeholders = studentIcs.map(() => '?').join(',');
        
        // Update all unpaid fees for current month for students in this class
        const [updateResult] = await pool.execute(`
          UPDATE fees 
          SET jumlah = ?, updated_at = CURRENT_TIMESTAMP
          WHERE student_ic IN (${placeholders})
            AND bulan = ?
            AND tahun = ?
            AND (status IS NULL OR status NOT IN ('terbayar', 'Bayar', 'paid', 'Terbayar'))
            AND jumlah != ?
        `, [classYuran, ...studentIcs, currentMonthName, currentYear, classYuran]);
        
        const updatedCount = updateResult.affectedRows || 0;
        totalUpdated += updatedCount;
        
        if (updatedCount > 0) {
          console.log(`[Fee Sync] ✅ Updated ${updatedCount} fees for class ${className} (ID: ${classId}) to RM ${classYuran.toFixed(2)}`);
        } else {
          totalSkipped += students.length;
        }
        
      } catch (error) {
        totalErrors++;
        console.error(`[Fee Sync] ❌ Error syncing fees for class ${classItem.nama_kelas} (ID: ${classItem.id}):`, error.message);
      }
    }
    
    console.log(`[Fee Sync] ✅ Sync completed:`);
    console.log(`  - Updated: ${totalUpdated} fees`);
    console.log(`  - Skipped: ${totalSkipped} fees (already correct or paid)`);
    console.log(`  - Errors: ${totalErrors} classes`);
    
    return {
      success: true,
      updated: totalUpdated,
      skipped: totalSkipped,
      errors: totalErrors,
      totalClasses: classes.length
    };
    
  } catch (error) {
    console.error('[Fee Sync] ❌ Fee sync failed:', error);
    throw error;
  }
};

/**
 * Schedule daily fee sync job
 * Runs every day at 2:00 AM to sync current month fees with class yuran amounts
 */
export const scheduleFeeSyncJob = () => {
  // Run daily at 2:00 AM
  // Cron format: minute hour day month day-of-week
  // '0 2 * * *' = At 02:00 every day
  cron.schedule('0 2 * * *', async () => {
    console.log('[Fee Sync] Starting scheduled fee sync job...');
    try {
      const result = await syncCurrentMonthFeesWithClassYuran();
      console.log(`[Fee Sync] Scheduled sync completed: ${result.updated} fees updated`);
    } catch (error) {
      console.error('[Fee Sync] Scheduled fee sync job failed:', error);
    }
  });
  
  console.log('[Fee Sync] Daily fee sync job scheduled (every day at 2:00 AM)');
  
  // Also run once on startup to catch any immediate changes
  syncCurrentMonthFeesWithClassYuran().catch(err => {
    console.error('[Fee Sync] Error in startup fee sync:', err);
  });
};


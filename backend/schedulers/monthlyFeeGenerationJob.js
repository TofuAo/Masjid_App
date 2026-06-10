// schedulers/monthlyFeeGenerationJob.js
import { pool } from '../config/database.js';

export async function generateMonthlyFeesManually() {
  console.log('[monthlyFeeGenerationJob] generateMonthlyFeesManually called');
  try {
    const now = new Date();
    const bulanNames = ['Januari','Februari','Mac','April','Mei','Jun','Julai','Ogos','September','Oktober','November','Disember'];
    const bulan = bulanNames[now.getMonth()];
    const tahun = now.getFullYear();

    // Get all active students with a class that has yuran > 0
    const [students] = await pool.execute(`
      SELECT u.ic as student_ic, k.yuran
      FROM users u
      JOIN kelas k ON u.kelas_id = k.id
      WHERE u.role = 'student' AND u.status = 'aktif' AND k.yuran > 0
    `);

    let created = 0;
    for (const student of students) {
      // Check if fee already exists for this month/year
      const [existing] = await pool.execute(
        'SELECT id FROM fees WHERE student_ic = ? AND bulan = ? AND tahun = ?',
        [student.student_ic, bulan, tahun]
      );
      if (existing.length === 0) {
        await pool.execute(
          'INSERT INTO fees (student_ic, jumlah, bulan, tahun, status, tarikh) VALUES (?, ?, ?, ?, ?, ?)',
          [student.student_ic, student.yuran, bulan, tahun, 'Belum Bayar', now]
        );
        created++;
      }
    }

    console.log(`[monthlyFeeGenerationJob] Created ${created} fee records for ${bulan} ${tahun}`);
    return { success: true, created, bulan, tahun };
  } catch (error) {
    console.error('[monthlyFeeGenerationJob] generateMonthlyFeesManually error:', error.message);
    throw error;
  }
}

export async function syncCurrentMonthFeesWithClassYuran() {
  console.log('[monthlyFeeGenerationJob] syncCurrentMonthFeesWithClassYuran called');
  try {
    const now = new Date();
    const bulanNames = ['Januari','Februari','Mac','April','Mei','Jun','Julai','Ogos','September','Oktober','November','Disember'];
    const bulan = bulanNames[now.getMonth()];
    const tahun = now.getFullYear();

    const [result] = await pool.execute(`
      UPDATE fees f
      JOIN users u ON f.student_ic = u.ic
      JOIN kelas k ON u.kelas_id = k.id
      SET f.jumlah = k.yuran
      WHERE f.bulan = ? AND f.tahun = ? AND f.status = 'Belum Bayar'
    `, [bulan, tahun]);

    console.log(`[monthlyFeeGenerationJob] Synced ${result.affectedRows} fee records`);
    return { success: true, updated: result.affectedRows };
  } catch (error) {
    console.error('[monthlyFeeGenerationJob] syncCurrentMonthFeesWithClassYuran error:', error.message);
    throw error;
  }
}

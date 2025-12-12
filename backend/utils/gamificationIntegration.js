import { pool } from '../config/database.js';
import { 
  addPoints, 
  updateStreak, 
  checkAchievements
} from '../services/gamificationService.js';

/**
 * Award points and check achievements when student attends class
 */
export const handleAttendanceGamification = async (studentIc, attendanceStatus, classId = null) => {
  try {
    let pointsAwarded = 0;
    const unlockedAchievements = [];

    // Award points based on attendance status
    if (attendanceStatus === 'Hadir' || attendanceStatus === 'hadir') {
      pointsAwarded = 10; // Base points for attendance
      
      // Add points
      const pointsResult = await addPoints(
        studentIc,
        pointsAwarded,
        'Hadir ke kelas',
        'attendance',
        classId
      );

      // Update attendance streak
      const streakResult = await updateStreak(studentIc, 'attendance');
      
      // Check attendance-based achievements
      const [attendanceCount] = await pool.execute(
        `SELECT COUNT(*) as count 
         FROM attendance 
         WHERE student_ic = ? AND status IN ('Hadir', 'hadir')`,
        [studentIc]
      );

      const count = attendanceCount[0]?.count || 0;
      
      // Check count-based achievements
      const countAchievements = await checkAchievements(
        studentIc,
        'attendance_count',
        count,
        { classId }
      );
      unlockedAchievements.push(...countAchievements);

      // Check streak-based achievements
      if (streakResult.currentStreak > 0) {
        const streakAchievements = await checkAchievements(
          studentIc,
          'attendance_streak',
          streakResult.currentStreak,
          { classId }
        );
        unlockedAchievements.push(...streakAchievements);
      }

      return {
        pointsAwarded,
        leveledUp: pointsResult.leveledUp,
        newLevel: pointsResult.newLevel,
        streak: streakResult.currentStreak,
        unlockedAchievements
      };
    }

    return { pointsAwarded: 0, unlockedAchievements: [] };
  } catch (error) {
    console.error('Attendance gamification error:', error);
    return { pointsAwarded: 0, unlockedAchievements: [] };
  }
};

/**
 * Award points when exam result is entered
 */
export const handleExamResultGamification = async (studentIc, markah, examId) => {
  try {
    let pointsAwarded = 0;
    const unlockedAchievements = [];

    // Award points based on marks
    if (markah >= 90) {
      pointsAwarded = 50; // Excellent score
    } else if (markah >= 80) {
      pointsAwarded = 30; // Good score
    } else if (markah >= 70) {
      pointsAwarded = 20; // Average score
    } else {
      pointsAwarded = 10; // Participated
    }

    // Add points
    const pointsResult = await addPoints(
      studentIc,
      pointsAwarded,
      `Mendapat ${markah} markah dalam peperiksaan`,
      'exam',
      examId
    );

    // Check exam-based achievements
    const examAchievements = await checkAchievements(
      studentIc,
      'exam_score',
      markah,
      { examId }
    );
    unlockedAchievements.push(...examAchievements);

    // Check exam count
    const [examCount] = await pool.execute(
      `SELECT COUNT(*) as count 
       FROM results 
       WHERE student_ic = ?`,
      [studentIc]
    );

    const countAchievements = await checkAchievements(
      studentIc,
      'exam_count',
      examCount[0]?.count || 0,
      { examId }
    );
    unlockedAchievements.push(...countAchievements);

    return {
      pointsAwarded,
      leveledUp: pointsResult.leveledUp,
      newLevel: pointsResult.newLevel,
      unlockedAchievements
    };
  } catch (error) {
    console.error('Exam result gamification error:', error);
    return { pointsAwarded: 0, unlockedAchievements: [] };
  }
};

/**
 * Award points when fee is paid
 */
export const handlePaymentGamification = async (studentIc, paymentAmount, feeId) => {
  try {
    let pointsAwarded = 20; // Base points for payment

    // Add points
    const pointsResult = await addPoints(
      studentIc,
      pointsAwarded,
      'Membayar yuran',
      'payment',
      feeId
    );

    // Update payment streak
    const streakResult = await updateStreak(studentIc, 'fee_payment');

    // Check payment achievements
    const [paymentCount] = await pool.execute(
      `SELECT COUNT(*) as count 
       FROM fees 
       WHERE student_ic = ? AND status IN ('terbayar', 'Bayar')`,
      [studentIc]
    );

    const countAchievements = await checkAchievements(
      studentIc,
      'payment_count',
      paymentCount[0]?.count || 0,
      { feeId }
    );

    return {
      pointsAwarded,
      leveledUp: pointsResult.leveledUp,
      newLevel: pointsResult.newLevel,
      unlockedAchievements: countAchievements
    };
  } catch (error) {
    console.error('Payment gamification error:', error);
    return { pointsAwarded: 0, unlockedAchievements: [] };
  }
};

/**
 * Award points for login streak
 */
export const handleLoginGamification = async (userIc) => {
  try {
    const streakResult = await updateStreak(userIc, 'login');

    // Check login streak achievements
    if (streakResult.currentStreak > 0) {
      const loginAchievements = await checkAchievements(
        userIc,
        'login_streak',
        streakResult.currentStreak
      );

      return {
        streak: streakResult.currentStreak,
        unlockedAchievements: loginAchievements
      };
    }

    return { streak: 0, unlockedAchievements: [] };
  } catch (error) {
    console.error('Login gamification error:', error);
    return { streak: 0, unlockedAchievements: [] };
  }
};


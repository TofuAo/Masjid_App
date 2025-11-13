import { pool } from '../config/database.js';
import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';

const DEFAULT_HISTORY_MONTHS = 3;
const isStaffRole = (role) => role === 'teacher' || role === 'admin' || role === 'pic';

function formatDateOnly(date) {
  if (!date) return null;
  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDefaultHistoryStartDate() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setMonth(start.getMonth() - DEFAULT_HISTORY_MONTHS);
  return formatDateOnly(start);
}

// Helper function to calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Get masjid location from settings
// Coordinates are static and cannot be changed
async function getMasjidLocation() {
  try {
    // Only fetch radius from settings (coordinates are static)
    const [settings] = await pool.execute(
      `SELECT setting_key, setting_value FROM settings WHERE setting_key = 'masjid_checkin_radius'`
    );

    // Static coordinates - cannot be changed
    const location = {
      latitude: 3.807829297637092, // Static
      longitude: 103.32799643765418, // Static
      radius: 100 // Default
    };

    // Only update radius from settings
    settings.forEach(setting => {
      if (setting.setting_key === 'masjid_checkin_radius') {
        location.radius = parseFloat(setting.setting_value) || 100;
      }
    });

    return location;
  } catch (error) {
    console.error('Error getting masjid location:', error);
    // Return static coordinates on error
    return { latitude: 3.807829297637092, longitude: 103.32799643765418, radius: 100 };
  }
}

// Check if user is within radius
async function isWithinRadius(userLat, userLon) {
  const masjidLocation = await getMasjidLocation();
  
  if (!masjidLocation.latitude || !masjidLocation.longitude) {
    return { within: false, distance: null, message: 'Masjid location not configured' };
  }

  const distance = calculateDistance(
    masjidLocation.latitude,
    masjidLocation.longitude,
    userLat,
    userLon
  );

  const roundedDistance = Math.round(distance);
  const roundedRadius = Math.round(masjidLocation.radius);
  
  return {
    within: distance <= masjidLocation.radius,
    distance: distance,
    message: distance <= masjidLocation.radius 
      ? `Check-in success! You are ${roundedDistance}m away from the masjid.` 
      : `You are too far. You are ${roundedDistance}m away. You must be within ${roundedRadius}m to check in.`
  };
}

// Staff Check-In
export const checkIn = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const staffIc = req.user.ic;

    // Validate geolocation
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Location coordinates are required'
      });
    }

    // Check if user is staff or admin
    if (!isStaffRole(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only staff members can check in'
      });
    }

    // Check if within radius
    const locationCheck = await isWithinRadius(latitude, longitude);
    if (!locationCheck.within) {
      return res.status(400).json({
        success: false,
        message: locationCheck.message,
        distance: locationCheck.distance
      });
    }

    // Check if already checked in today without checking out
    const [existingCheckIn] = await pool.execute(
      `SELECT id, check_in_time, status FROM staff_checkin 
       WHERE staff_ic = ? 
       AND DATE(check_in_time) = CURDATE() 
       AND status = 'checked_in'`,
      [staffIc]
    );

    if (existingCheckIn.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have already checked in today. Please check out first.'
      });
    }

    // Create check-in record
    const [result] = await pool.execute(
      `INSERT INTO staff_checkin 
       (staff_ic, check_in_time, check_in_latitude, check_in_longitude, status, distance_from_masjid) 
       VALUES (?, NOW(), ?, ?, 'checked_in', ?)`,
      [staffIc, latitude, longitude, locationCheck.distance]
    );

    const [checkInRecord] = await pool.execute(
      `SELECT sc.*, u.nama 
       FROM staff_checkin sc 
       JOIN users u ON sc.staff_ic = u.ic 
       WHERE sc.id = ?`,
      [result.insertId]
    );

    res.json({
      success: true,
      message: 'Check-in successful',
      data: checkInRecord[0],
      distance: locationCheck.distance
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Staff Check-Out
export const checkOut = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const staffIc = req.user.ic;

    // Validate geolocation
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Location coordinates are required'
      });
    }

    // Check if user is staff or admin
    if (!isStaffRole(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only staff members can check out'
      });
    }

    // Check if within radius
    const locationCheck = await isWithinRadius(latitude, longitude);
    if (!locationCheck.within) {
      return res.status(400).json({
        success: false,
        message: locationCheck.message,
        distance: locationCheck.distance
      });
    }

    // Find today's check-in record
    const [existingCheckIn] = await pool.execute(
      `SELECT id, check_in_time FROM staff_checkin 
       WHERE staff_ic = ? 
       AND DATE(check_in_time) = CURDATE() 
       AND status = 'checked_in'`,
      [staffIc]
    );

    if (existingCheckIn.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No check-in record found for today. Please check in first.'
      });
    }

    // Update check-out record
    await pool.execute(
      `UPDATE staff_checkin 
       SET check_out_time = NOW(), 
           check_out_latitude = ?, 
           check_out_longitude = ?, 
           status = 'checked_out',
           distance_from_masjid = ? 
       WHERE id = ?`,
      [latitude, longitude, locationCheck.distance, existingCheckIn[0].id]
    );

    const [checkOutRecord] = await pool.execute(
      `SELECT sc.*, u.nama 
       FROM staff_checkin sc 
       JOIN users u ON sc.staff_ic = u.ic 
       WHERE sc.id = ?`,
      [existingCheckIn[0].id]
    );

    res.json({
      success: true,
      message: 'Check-out successful',
      data: checkOutRecord[0],
      distance: locationCheck.distance
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get staff check-in history (for the logged-in staff or admin can see all)
export const getCheckInHistory = async (req, res) => {
  try {
    const staffIc = req.user.ic;
    const { startDate, endDate, staff_ic } = req.query;

    const defaultStartDate = getDefaultHistoryStartDate();
    const todayDate = formatDateOnly(new Date());

    let query = `
      SELECT sc.*, u.nama 
      FROM staff_checkin sc 
      JOIN users u ON sc.staff_ic = u.ic 
      WHERE 1=1
    `;
    const params = [];

    // Admin can see all, staff can only see their own
    if (req.user.role === 'admin') {
      if (staff_ic) {
        query += ' AND sc.staff_ic = ?';
        params.push(staff_ic);
      }
    } else {
      query += ' AND sc.staff_ic = ?';
      params.push(staffIc);
    }

    // Date filtering
    const effectiveStartDate = (startDate ? formatDateOnly(startDate) : null) || defaultStartDate;
    const effectiveEndDate = (endDate ? formatDateOnly(endDate) : null) || todayDate;

    if (effectiveStartDate) {
      query += ' AND DATE(sc.check_in_time) >= ?';
      params.push(effectiveStartDate);
    }
    if (effectiveEndDate) {
      query += ' AND DATE(sc.check_in_time) <= ?';
      params.push(effectiveEndDate);
    }

    const limitParam = parseInt(req.query.limit, 10);
    if (!Number.isNaN(limitParam) && limitParam > 0) {
      const safeLimit = Math.min(limitParam, 5000);
      query += ` ORDER BY sc.check_in_time DESC LIMIT ${safeLimit}`;
    } else {
      query += ' ORDER BY sc.check_in_time DESC LIMIT 100';
    }

    const [records] = await pool.execute(query, params);

    res.json({
      success: true,
      data: records,
      metadata: {
        startDate: effectiveStartDate,
        endDate: effectiveEndDate
      }
    });
  } catch (error) {
    console.error('Get check-in history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getStaffList = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can view staff list'
      });
    }

    const [staff] = await pool.execute(
      `SELECT ic, nama, role 
       FROM users 
       WHERE role IN ('teacher', 'admin', 'pic') 
         AND status = 'aktif'
       ORDER BY nama ASC`
    );

    res.json({
      success: true,
      data: staff
    });
  } catch (error) {
    console.error('Get staff list error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get today's check-in status
export const getTodayStatus = async (req, res) => {
  try {
    const staffIc = req.user.ic;

    // Check if user is staff or admin
    if (!isStaffRole(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only staff members can check status'
      });
    }

    const [todayRecord] = await pool.execute(
      `SELECT sc.*, u.nama 
       FROM staff_checkin sc 
       JOIN users u ON sc.staff_ic = u.ic 
       WHERE sc.staff_ic = ? 
       AND DATE(sc.check_in_time) = CURDATE() 
       ORDER BY sc.check_in_time DESC 
       LIMIT 1`,
      [staffIc]
    );

    if (todayRecord.length === 0) {
      return res.json({
        success: true,
        data: null,
        status: 'not_checked_in'
      });
    }

    res.json({
      success: true,
      data: todayRecord[0],
      status: todayRecord[0].status
    });
  } catch (error) {
    console.error('Get today status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Quick Check-In (with IC and password, no JWT required)
export const quickCheckIn = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { icNumber, password, latitude, longitude } = req.body;

    // Validate inputs
    if (!icNumber || !password) {
      return res.status(400).json({
        success: false,
        message: 'IC Number and password are required'
      });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Location coordinates are required'
      });
    }

    // Verify user credentials
    const [users] = await pool.execute(
      "SELECT * FROM users WHERE ic = ?",
      [icNumber]
    );

    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'IC Number atau kata laluan salah'
      });
    }

    const user = users[0];

    // Check if user is staff or admin (not student)
    if (!isStaffRole(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Hanya kakitangan boleh check in. Pelajar tidak dibenarkan.'
      });
    }

    // Verify password
    const isPasswordValid = password === user.password || await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'IC Number atau kata laluan salah'
      });
    }

    // Check if within radius
    const locationCheck = await isWithinRadius(latitude, longitude);
    if (!locationCheck.within) {
      return res.status(400).json({
        success: false,
        message: locationCheck.message,
        distance: locationCheck.distance
      });
    }

    // Check if already checked in today without checking out (normal type)
    const [existingCheckIn] = await pool.execute(
      `SELECT id, check_in_time, status FROM staff_checkin 
       WHERE staff_ic = ? 
       AND DATE(check_in_time) = CURDATE() 
       AND status = 'checked_in'
       AND (shift_type = 'normal' OR shift_type IS NULL)`,
      [icNumber]
    );

    if (existingCheckIn.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Anda telah check in hari ini. Sila check out terlebih dahulu.'
      });
    }

    // Create check-in record (normal type)
    const [result] = await pool.execute(
      `INSERT INTO staff_checkin 
       (staff_ic, check_in_time, check_in_latitude, check_in_longitude, status, distance_from_masjid, shift_type) 
       VALUES (?, NOW(), ?, ?, 'checked_in', ?, 'normal')`,
      [icNumber, latitude, longitude, locationCheck.distance]
    );

    const [checkInRecord] = await pool.execute(
      `SELECT sc.*, u.nama 
       FROM staff_checkin sc 
       JOIN users u ON sc.staff_ic = u.ic 
       WHERE sc.id = ?`,
      [result.insertId]
    );

    res.json({
      success: true,
      message: 'Check-in berjaya!',
      data: {
        ...checkInRecord[0],
        nama: user.nama
      },
      distance: locationCheck.distance
    });
  } catch (error) {
    console.error('Quick check-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const quickGetLastAction = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { icNumber, password } = req.body;

    if (!icNumber || !password) {
      return res.status(400).json({
        success: false,
        message: 'IC Number and password are required'
      });
    }

    const [users] = await pool.execute(
      'SELECT * FROM users WHERE ic = ?',
      [icNumber]
    );

    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'IC Number atau kata laluan salah'
      });
    }

    const user = users[0];

    if (!isStaffRole(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Hanya kakitangan boleh melihat rekod check in/out.'
      });
    }

    const isPasswordValid = password === user.password || await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'IC Number atau kata laluan salah'
      });
    }

    const [records] = await pool.execute(
      `SELECT sc.*, u.nama 
       FROM staff_checkin sc 
       JOIN users u ON sc.staff_ic = u.ic 
       WHERE sc.staff_ic = ? 
       ORDER BY sc.check_in_time DESC 
       LIMIT 1`,
      [icNumber]
    );

    if (!records || records.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'Tiada rekod check in/out sebelum ini.'
      });
    }

    const record = records[0];
    let action = 'check_in';
    let actionTime = record.check_in_time;

    if (record.check_out_time) {
      action = 'check_out';
      actionTime = record.check_out_time;
    } else if (record.status === 'checked_out') {
      action = 'check_out';
      actionTime = record.check_out_time || record.updated_at || record.check_in_time;
    }

    return res.json({
      success: true,
      data: {
        record,
        action,
        actionTime
      },
      message: 'Rekod terakhir ditemui.'
    });
  } catch (error) {
    console.error('Quick get last action error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Quick Check-In Shift (with IC and password, no JWT required)
export const quickCheckInShift = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { icNumber, password, latitude, longitude } = req.body;

    // Validate inputs
    if (!icNumber || !password) {
      return res.status(400).json({
        success: false,
        message: 'IC Number and password are required'
      });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Location coordinates are required'
      });
    }

    // Verify user credentials
    const [users] = await pool.execute(
      "SELECT * FROM users WHERE ic = ?",
      [icNumber]
    );

    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'IC Number atau kata laluan salah'
      });
    }

    const user = users[0];

    // Check if user is staff or admin (not student)
    if (!isStaffRole(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Hanya kakitangan boleh check in. Pelajar tidak dibenarkan.'
      });
    }

    // Verify password
    const isPasswordValid = password === user.password || await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'IC Number atau kata laluan salah'
      });
    }

    // Check if within radius
    const locationCheck = await isWithinRadius(latitude, longitude);
    if (!locationCheck.within) {
      return res.status(400).json({
        success: false,
        message: locationCheck.message,
        distance: locationCheck.distance
      });
    }

    // Check if already checked in today without checking out (for shift)
    const [existingCheckIn] = await pool.execute(
      `SELECT id, check_in_time, status FROM staff_checkin 
       WHERE staff_ic = ? 
       AND DATE(check_in_time) = CURDATE() 
       AND status = 'checked_in'
       AND shift_type = 'shift'`,
      [icNumber]
    );

    if (existingCheckIn.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Anda telah check in shift hari ini. Sila check out terlebih dahulu.'
      });
    }

    // Create check-in record with shift type
    const [result] = await pool.execute(
      `INSERT INTO staff_checkin 
       (staff_ic, check_in_time, check_in_latitude, check_in_longitude, status, distance_from_masjid, shift_type) 
       VALUES (?, NOW(), ?, ?, 'checked_in', ?, 'shift')`,
      [icNumber, latitude, longitude, locationCheck.distance]
    );

    const [checkInRecord] = await pool.execute(
      `SELECT sc.*, u.nama 
       FROM staff_checkin sc 
       JOIN users u ON sc.staff_ic = u.ic 
       WHERE sc.id = ?`,
      [result.insertId]
    );

    res.json({
      success: true,
      message: 'Check-in shift berjaya!',
      data: {
        ...checkInRecord[0],
        nama: user.nama
      },
      distance: locationCheck.distance
    });
  } catch (error) {
    console.error('Quick check-in shift error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Quick Check-Out Shift (with IC and password, no JWT required)
export const quickCheckOutShift = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { icNumber, password, latitude, longitude } = req.body;

    // Validate inputs
    if (!icNumber || !password) {
      return res.status(400).json({
        success: false,
        message: 'IC Number and password are required'
      });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Location coordinates are required'
      });
    }

    // Verify user credentials
    const [users] = await pool.execute(
      "SELECT * FROM users WHERE ic = ?",
      [icNumber]
    );

    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'IC Number atau kata laluan salah'
      });
    }

    const user = users[0];

    // Check if user is staff or admin (not student)
    if (!isStaffRole(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Hanya kakitangan boleh check out. Pelajar tidak dibenarkan.'
      });
    }

    // Verify password
    const isPasswordValid = password === user.password || await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'IC Number atau kata laluan salah'
      });
    }

    // Check if within radius
    const locationCheck = await isWithinRadius(latitude, longitude);
    if (!locationCheck.within) {
      return res.status(400).json({
        success: false,
        message: locationCheck.message,
        distance: locationCheck.distance
      });
    }

    // Find today's shift check-in record
    const [existingCheckIn] = await pool.execute(
      `SELECT id, check_in_time FROM staff_checkin 
       WHERE staff_ic = ? 
       AND DATE(check_in_time) = CURDATE() 
       AND status = 'checked_in'
       AND shift_type = 'shift'`,
      [icNumber]
    );

    if (existingCheckIn.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tiada rekod check in shift untuk hari ini. Sila check in terlebih dahulu.'
      });
    }

    // Update check-out record
    await pool.execute(
      `UPDATE staff_checkin 
       SET check_out_time = NOW(), 
           check_out_latitude = ?, 
           check_out_longitude = ?, 
           status = 'checked_out',
           distance_from_masjid = ? 
       WHERE id = ?`,
      [latitude, longitude, locationCheck.distance, existingCheckIn[0].id]
    );

    const [checkOutRecord] = await pool.execute(
      `SELECT sc.*, u.nama 
       FROM staff_checkin sc 
       JOIN users u ON sc.staff_ic = u.ic 
       WHERE sc.id = ?`,
      [existingCheckIn[0].id]
    );

    res.json({
      success: true,
      message: 'Check-out shift berjaya!',
      data: {
        ...checkOutRecord[0],
        nama: user.nama
      },
      distance: locationCheck.distance
    });
  } catch (error) {
    console.error('Quick check-out shift error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Quick Check-Out (with IC and password, no JWT required)
export const quickCheckOut = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { icNumber, password, latitude, longitude } = req.body;

    // Validate inputs
    if (!icNumber || !password) {
      return res.status(400).json({
        success: false,
        message: 'IC Number and password are required'
      });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Location coordinates are required'
      });
    }

    // Verify user credentials
    const [users] = await pool.execute(
      "SELECT * FROM users WHERE ic = ?",
      [icNumber]
    );

    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'IC Number atau kata laluan salah'
      });
    }

    const user = users[0];

    // Check if user is staff or admin (not student)
    if (!isStaffRole(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Hanya kakitangan boleh check out. Pelajar tidak dibenarkan.'
      });
    }

    // Verify password
    const isPasswordValid = password === user.password || await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'IC Number atau kata laluan salah'
      });
    }

    // Check if within radius
    const locationCheck = await isWithinRadius(latitude, longitude);
    if (!locationCheck.within) {
      return res.status(400).json({
        success: false,
        message: locationCheck.message,
        distance: locationCheck.distance
      });
    }

    // Find today's check-in record (normal type)
    const [existingCheckIn] = await pool.execute(
      `SELECT id, check_in_time FROM staff_checkin 
       WHERE staff_ic = ? 
       AND DATE(check_in_time) = CURDATE() 
       AND status = 'checked_in'
       AND (shift_type = 'normal' OR shift_type IS NULL)`,
      [icNumber]
    );

    if (existingCheckIn.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tiada rekod check in untuk hari ini. Sila check in terlebih dahulu.'
      });
    }

    // Update check-out record
    await pool.execute(
      `UPDATE staff_checkin 
       SET check_out_time = NOW(), 
           check_out_latitude = ?, 
           check_out_longitude = ?, 
           status = 'checked_out',
           distance_from_masjid = ? 
       WHERE id = ?`,
      [latitude, longitude, locationCheck.distance, existingCheckIn[0].id]
    );

    const [checkOutRecord] = await pool.execute(
      `SELECT sc.*, u.nama 
       FROM staff_checkin sc 
       JOIN users u ON sc.staff_ic = u.ic 
       WHERE sc.id = ?`,
      [existingCheckIn[0].id]
    );

    res.json({
      success: true,
      message: 'Check-out berjaya!',
      data: {
        ...checkOutRecord[0],
        nama: user.nama
      },
      distance: locationCheck.distance
    });
  } catch (error) {
    console.error('Quick check-out error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

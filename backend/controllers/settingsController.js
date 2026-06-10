import { pool } from '../config/database.js';
import { validationResult } from 'express-validator';
import {
  fetchMasjidLocationFromSettings,
  DEFAULT_MASJID_LATITUDE,
  DEFAULT_MASJID_LONGITUDE,
  DEFAULT_MASJID_RADIUS
} from '../utils/masjidLocation.js';
import { createSnapshot, SNAPSHOT_TTL_HOURS } from '../utils/adminActionSnapshots.js';

const MASJID_SETTING_LIMITS = {
  masjid_latitude: { min: -90, max: 90, fixed: 6 },
  masjid_longitude: { min: -180, max: 180, fixed: 6 },
  masjid_checkin_radius: { min: 1, max: 10000 }
};
import {
  getGradeRangesFromSettings,
  saveGradeRangesToSettings,
  validateGradeRangesPayload
} from '../utils/grading.js';

// Get all settings or specific setting
export const getSettings = async (req, res) => {
  try {
    const { key } = req.query;

    if (key) {
      // Get specific setting
      const [settings] = await pool.execute(
        'SELECT * FROM settings WHERE setting_key = ?',
        [key]
      );

      if (settings.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Setting not found'
        });
      }

      res.json({
        success: true,
        data: settings[0]
      });
    } else {
      // Get all settings
      const [settings] = await pool.execute(
        'SELECT * FROM settings ORDER BY setting_key'
      );

      res.json({
        success: true,
        data: settings
      });
    }
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update setting (admin only)
export const updateSetting = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can update settings'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { key } = req.params;
    let { value, type, description } = req.body;

    // Normalize masjid location settings
    if (MASJID_SETTING_LIMITS[key]) {
      const limit = MASJID_SETTING_LIMITS[key];
      const numericValue = parseFloat(value);

      if (Number.isNaN(numericValue)) {
        return res.status(400).json({
          success: false,
          message: `Nilai ${key.replace(/_/g, ' ')} mesti nombor sah.`
        });
      }

      if (numericValue < limit.min || numericValue > limit.max) {
        return res.status(400).json({
          success: false,
          message: `Nilai ${key.replace(/_/g, ' ')} mesti di antara ${limit.min} dan ${limit.max}.`
        });
      }

      if (key === 'masjid_checkin_radius') {
        value = numericValue.toString();
      } else {
        const decimals = typeof limit.fixed === 'number' ? limit.fixed : 6;
        value = numericValue.toFixed(decimals);
      }
    }

    // Convert empty string to null for database
    if (value === '' || value === undefined) {
      value = null;
    }
    if (description === '' || description === undefined) {
      description = null;
    }

    // Check if setting exists
    const [existing] = await pool.execute(
      'SELECT * FROM settings WHERE setting_key = ?',
      [key]
    );

    // Log admin action before update
    if (existing.length > 0 && req.user && req.user.role === 'admin') {
      await createSnapshot({
        entityType: 'settings',
        entityId: existing[0].id,
        entityIdentifier: key,
        operation: 'update',
        data: existing[0],
        metadata: {
          title: key,
          operationLabel: 'Kemas kini tetapan',
          redirectPath: '/settings'
        },
        actorPhone: req.user.telefon
      });
    }

    if (existing.length > 0) {
      // Update existing setting
      await pool.execute(
        'UPDATE settings SET setting_value = ?, setting_type = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?',
        [value, type || 'text', description, key]
      );
    } else {
      // Create new setting
      const [insertResult] = await pool.execute(
        'INSERT INTO settings (setting_key, setting_value, setting_type, description) VALUES (?, ?, ?, ?)',
        [key, value, type || 'text', description]
      );
      
      // Log admin action for new setting
      if (req.user && req.user.role === 'admin') {
        await createSnapshot({
          entityType: 'settings',
          entityId: insertResult.insertId,
          entityIdentifier: key,
          operation: 'create',
          data: { setting_key: key, setting_value: value, setting_type: type || 'text', description },
          metadata: {
            title: key,
            operationLabel: 'Cipta tetapan',
            redirectPath: '/settings'
          },
          actorPhone: req.user.telefon
        });
      }
    }

    // Return updated setting
    const [updated] = await pool.execute(
      'SELECT * FROM settings WHERE setting_key = ?',
      [key]
    );

    res.json({
      success: true,
      message: 'Setting updated successfully',
      data: updated[0]
    });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get QR code settings specifically
export const getQRCodeSettings = async (req, res) => {
  try {
    const [settings] = await pool.execute(
      `SELECT setting_key, setting_value, setting_type 
       FROM settings 
       WHERE setting_key IN ('qr_code_image', 'qr_code_link', 'qr_code_enabled', 'payment_account_number')`
    );

    const qrSettings = {
      qr_code_image: null,
      qr_code_link: null,
      qr_code_enabled: '1',
      payment_account_number: null
    };

    settings.forEach(setting => {
      qrSettings[setting.setting_key] = setting.setting_value;
    });

    res.json({
      success: true,
      data: qrSettings
    });
  } catch (error) {
    console.error('Get QR code settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getGradeRanges = async (req, res) => {
  try {
    const ranges = await getGradeRangesFromSettings();
    res.json({
      success: true,
      data: ranges
    });
  } catch (error) {
    console.error('Get grade ranges error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateGradeRanges = async (req, res) => {
  try {
    const { ranges } = req.body;
    const { ranges: normalizedRanges, errors } = validateGradeRangesPayload(ranges);

    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    const savedRanges = await saveGradeRangesToSettings(normalizedRanges);

    res.json({
      success: true,
      message: 'Grade ranges updated successfully',
      data: savedRanges
    });
  } catch (error) {
    console.error('Update grade ranges error:', error);
    if (error.validationErrors) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.validationErrors
      });
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getMasjidLocationSettings = async (req, res) => {
  try {
    const locationSettings = await fetchMasjidLocationFromSettings();
    res.json({
      success: true,
      data: locationSettings
    });
  } catch (error) {
    console.error('Get masjid location settings error:', error);
    res.json({
      success: true,
      data: {
        latitude: DEFAULT_MASJID_LATITUDE,
        longitude: DEFAULT_MASJID_LONGITUDE,
        radius: DEFAULT_MASJID_RADIUS
      }
    });
  }
};


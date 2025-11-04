import { pool } from '../config/database.js';
import { validationResult } from 'express-validator';

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
    const { value, type, description } = req.body;

    // Check if setting exists
    const [existing] = await pool.execute(
      'SELECT id FROM settings WHERE setting_key = ?',
      [key]
    );

    if (existing.length > 0) {
      // Update existing setting
      await pool.execute(
        'UPDATE settings SET setting_value = ?, setting_type = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?',
        [value || null, type || 'text', description || null, key]
      );
    } else {
      // Create new setting
      await pool.execute(
        'INSERT INTO settings (setting_key, setting_value, setting_type, description) VALUES (?, ?, ?, ?)',
        [key, value || null, type || 'text', description || null]
      );
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
       WHERE setting_key IN ('qr_code_image', 'qr_code_link', 'qr_code_enabled')`
    );

    const qrSettings = {
      qr_code_image: null,
      qr_code_link: null,
      qr_code_enabled: '1'
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


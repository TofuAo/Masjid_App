import { pool } from '../config/database.js';
import { validationResult } from 'express-validator';

/**
 * Get all payment method settings
 * GET /api/payment-methods
 */
export const getPaymentMethods = async (req, res) => {
  try {
    const [methods] = await pool.execute(
      'SELECT * FROM payment_method_settings ORDER BY display_order ASC, method_name ASC'
    );

    res.json({
      success: true,
      data: methods.map(m => {
        let config = {};
        if (m.config) {
          try {
            // Handle both JSON string and already parsed object
            if (typeof m.config === 'string') {
              config = JSON.parse(m.config);
            } else {
              config = m.config;
            }
          } catch (e) {
            console.error('Error parsing config for method:', m.method_code, e);
            config = {};
          }
        }
        return {
          ...m,
          enabled: Boolean(m.enabled),
          config,
          display_order: m.display_order || 0
        };
      })
    });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get enabled payment methods only (for public use)
 * GET /api/payment-methods/enabled
 */
export const getEnabledPaymentMethods = async (req, res) => {
  try {
    const [methods] = await pool.execute(
      'SELECT * FROM payment_method_settings WHERE enabled = TRUE ORDER BY display_order ASC, method_name ASC'
    );

    res.json({
      success: true,
      data: methods.map(m => {
        let config = {};
        if (m.config) {
          try {
            // Handle both JSON string and already parsed object
            if (typeof m.config === 'string') {
              config = JSON.parse(m.config);
            } else {
              config = m.config;
            }
          } catch (e) {
            console.error('Error parsing config for method:', m.method_code, e);
            config = {};
          }
        }
        return {
          ...m,
          enabled: Boolean(m.enabled),
          config,
          display_order: m.display_order || 0
        };
      })
    });
  } catch (error) {
    console.error('Get enabled payment methods error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update payment method setting
 * PUT /api/payment-methods/:methodCode
 */
export const updatePaymentMethod = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can update payment method settings'
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

    const { methodCode } = req.params;
    const { 
      enabled, 
      provider, 
      display_order, 
      description, 
      config,
      merchant_account_name,
      merchant_account_number,
      merchant_bank_name,
      merchant_account_type,
      gateway_merchant_id,
      gateway_api_key,
      gateway_secret_key,
      is_test_mode
    } = req.body;

    // Check if method exists
    const [existing] = await pool.execute(
      'SELECT * FROM payment_method_settings WHERE method_code = ?',
      [methodCode]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    // Build update query
    const updates = [];
    const values = [];

    if (enabled !== undefined) {
      updates.push('enabled = ?');
      values.push(Boolean(enabled));
    }

    if (provider !== undefined) {
      updates.push('provider = ?');
      values.push(provider);
    }

    if (display_order !== undefined) {
      updates.push('display_order = ?');
      values.push(parseInt(display_order) || 0);
    }

    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }

    if (config !== undefined) {
      updates.push('config = ?');
      values.push(JSON.stringify(config));
    }

    if (merchant_account_name !== undefined) {
      updates.push('merchant_account_name = ?');
      values.push(merchant_account_name);
    }

    if (merchant_account_number !== undefined) {
      updates.push('merchant_account_number = ?');
      values.push(merchant_account_number);
    }

    if (merchant_bank_name !== undefined) {
      updates.push('merchant_bank_name = ?');
      values.push(merchant_bank_name);
    }

    if (merchant_account_type !== undefined) {
      updates.push('merchant_account_type = ?');
      values.push(merchant_account_type);
    }

    if (gateway_merchant_id !== undefined) {
      updates.push('gateway_merchant_id = ?');
      values.push(gateway_merchant_id);
    }

    if (gateway_api_key !== undefined) {
      updates.push('gateway_api_key = ?');
      values.push(gateway_api_key);
    }

    if (gateway_secret_key !== undefined) {
      updates.push('gateway_secret_key = ?');
      values.push(gateway_secret_key);
    }

    if (is_test_mode !== undefined) {
      updates.push('is_test_mode = ?');
      values.push(Boolean(is_test_mode));
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(methodCode);

    await pool.execute(
      `UPDATE payment_method_settings SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE method_code = ?`,
      values
    );

    // Get updated method
    const [updated] = await pool.execute(
      'SELECT * FROM payment_method_settings WHERE method_code = ?',
      [methodCode]
    );

    res.json({
      success: true,
      message: 'Payment method updated successfully',
      data: {
        ...updated[0],
        enabled: Boolean(updated[0].enabled),
        config: (() => {
          const cfg = updated[0].config;
          if (!cfg) return {};
          if (typeof cfg === 'string') {
            try {
              return JSON.parse(cfg);
            } catch (e) {
              return {};
            }
          }
          return cfg;
        })()
      }
    });
  } catch (error) {
    console.error('Update payment method error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Bulk update payment methods
 * PUT /api/payment-methods/bulk
 */
export const bulkUpdatePaymentMethods = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can update payment method settings'
      });
    }

    const { methods } = req.body;

    if (!Array.isArray(methods)) {
      return res.status(400).json({
        success: false,
        message: 'Methods must be an array'
      });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      for (const method of methods) {
        const { 
          method_code, 
          enabled, 
          provider, 
          display_order, 
          description, 
          config,
          merchant_account_name,
          merchant_account_number,
          merchant_bank_name,
          merchant_account_type,
          gateway_merchant_id,
          gateway_api_key,
          gateway_secret_key,
          is_test_mode
        } = method;

        if (!method_code) continue;

        const updates = [];
        const values = [];

        if (enabled !== undefined) {
          updates.push('enabled = ?');
          values.push(Boolean(enabled));
        }

        if (provider !== undefined) {
          updates.push('provider = ?');
          values.push(provider);
        }

        if (display_order !== undefined) {
          updates.push('display_order = ?');
          values.push(parseInt(display_order) || 0);
        }

        if (description !== undefined) {
          updates.push('description = ?');
          values.push(description);
        }

        if (config !== undefined) {
          updates.push('config = ?');
          values.push(JSON.stringify(config));
        }

        if (merchant_account_name !== undefined) {
          updates.push('merchant_account_name = ?');
          values.push(merchant_account_name);
        }

        if (merchant_account_number !== undefined) {
          updates.push('merchant_account_number = ?');
          values.push(merchant_account_number);
        }

        if (merchant_bank_name !== undefined) {
          updates.push('merchant_bank_name = ?');
          values.push(merchant_bank_name);
        }

        if (merchant_account_type !== undefined) {
          updates.push('merchant_account_type = ?');
          values.push(merchant_account_type);
        }

        if (gateway_merchant_id !== undefined) {
          updates.push('gateway_merchant_id = ?');
          values.push(gateway_merchant_id);
        }

        if (gateway_api_key !== undefined) {
          updates.push('gateway_api_key = ?');
          values.push(gateway_api_key);
        }

        if (gateway_secret_key !== undefined) {
          updates.push('gateway_secret_key = ?');
          values.push(gateway_secret_key);
        }

        if (is_test_mode !== undefined) {
          updates.push('is_test_mode = ?');
          values.push(Boolean(is_test_mode));
        }

        if (updates.length > 0) {
          values.push(method_code);
          await connection.execute(
            `UPDATE payment_method_settings SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE method_code = ?`,
            values
          );
        }
      }

      await connection.commit();

      // Get all updated methods
      const [updatedMethods] = await connection.execute(
        'SELECT * FROM payment_method_settings ORDER BY display_order ASC, method_name ASC'
      );

      res.json({
        success: true,
        message: 'Payment methods updated successfully',
        data: updatedMethods.map(m => {
          let config = {};
          if (m.config) {
            if (typeof m.config === 'string') {
              try {
                config = JSON.parse(m.config);
              } catch (e) {
                config = {};
              }
            } else {
              config = m.config;
            }
          }
          return {
            ...m,
            enabled: Boolean(m.enabled),
            config,
            display_order: m.display_order || 0
          };
        })
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Bulk update payment methods error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};


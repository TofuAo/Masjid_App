import { pool } from '../config/database.js';
import { validationResult } from 'express-validator';

/**
 * Get all payment gateway settings
 * GET /api/payment-gateways
 */
export const getPaymentGateways = async (req, res) => {
  try {
    const [gateways] = await pool.execute(
      'SELECT * FROM payment_gateway_settings ORDER BY gateway_name ASC'
    );

    res.json({
      success: true,
      data: gateways.map(g => {
        let credentials = {};
        let enabledMethods = [];
        let redirectUrls = {};

        if (g.credentials) {
          try {
            credentials = typeof g.credentials === 'string' ? JSON.parse(g.credentials) : g.credentials;
          } catch (e) {
            credentials = {};
          }
        }

        if (g.enabled_methods) {
          try {
            enabledMethods = typeof g.enabled_methods === 'string' ? JSON.parse(g.enabled_methods) : g.enabled_methods;
          } catch (e) {
            enabledMethods = [];
          }
        }

        if (g.redirect_urls) {
          try {
            redirectUrls = typeof g.redirect_urls === 'string' ? JSON.parse(g.redirect_urls) : g.redirect_urls;
          } catch (e) {
            redirectUrls = {};
          }
        }

        return {
          ...g,
          enabled: Boolean(g.enabled),
          is_test_mode: Boolean(g.is_test_mode),
          credentials,
          enabled_methods: Array.isArray(enabledMethods) ? enabledMethods : [],
          redirect_urls: redirectUrls
        };
      })
    });
  } catch (error) {
    console.error('Get payment gateways error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get enabled payment gateway
 * GET /api/payment-gateways/active
 */
export const getActivePaymentGateway = async (req, res) => {
  try {
    const [gateways] = await pool.execute(
      'SELECT * FROM payment_gateway_settings WHERE enabled = TRUE LIMIT 1'
    );

    if (gateways.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active payment gateway found'
      });
    }

    const g = gateways[0];
    let credentials = {};
    let enabledMethods = [];
    let redirectUrls = {};

    if (g.credentials) {
      try {
        credentials = typeof g.credentials === 'string' ? JSON.parse(g.credentials) : g.credentials;
      } catch (e) {
        credentials = {};
      }
    }

    if (g.enabled_methods) {
      try {
        enabledMethods = typeof g.enabled_methods === 'string' ? JSON.parse(g.enabled_methods) : g.enabled_methods;
      } catch (e) {
        enabledMethods = [];
      }
    }

    if (g.redirect_urls) {
      try {
        redirectUrls = typeof g.redirect_urls === 'string' ? JSON.parse(g.redirect_urls) : g.redirect_urls;
      } catch (e) {
        redirectUrls = {};
      }
    }

    res.json({
      success: true,
      data: {
        ...g,
        enabled: Boolean(g.enabled),
        is_test_mode: Boolean(g.is_test_mode),
        credentials,
        enabled_methods: Array.isArray(enabledMethods) ? enabledMethods : [],
        redirect_urls: redirectUrls
      }
    });
  } catch (error) {
    console.error('Get active payment gateway error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update payment gateway setting
 * PUT /api/payment-gateways/:gatewayName
 */
export const updatePaymentGateway = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can update payment gateway settings'
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

    const { gatewayName } = req.params;
    const { enabled, is_test_mode, credentials, enabled_methods, redirect_urls, webhook_url, callback_url, notes } = req.body;

    // Check if gateway exists, create if it doesn't
    const [existing] = await pool.execute(
      'SELECT * FROM payment_gateway_settings WHERE gateway_name = ?',
      [gatewayName]
    );

    if (existing.length === 0) {
      // Create the gateway if it doesn't exist
      await pool.execute(
        `INSERT INTO payment_gateway_settings 
         (gateway_name, enabled, is_test_mode, credentials, created_at, updated_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          gatewayName,
          enabled !== undefined ? Boolean(enabled) : false,
          is_test_mode !== undefined ? Boolean(is_test_mode) : true,
          credentials ? JSON.stringify(credentials) : '{}'
        ]
      );
    }

    // If enabling this gateway, disable all others
    if (enabled === true) {
      await pool.execute(
        'UPDATE payment_gateway_settings SET enabled = FALSE WHERE gateway_name != ?',
        [gatewayName]
      );
    }

    // Build update query
    const updates = [];
    const values = [];

    if (enabled !== undefined) {
      updates.push('enabled = ?');
      values.push(Boolean(enabled));
    }

    if (is_test_mode !== undefined) {
      updates.push('is_test_mode = ?');
      values.push(Boolean(is_test_mode));
    }

    if (credentials !== undefined) {
      updates.push('credentials = ?');
      values.push(JSON.stringify(credentials));
    }

    if (enabled_methods !== undefined) {
      updates.push('enabled_methods = ?');
      values.push(JSON.stringify(Array.isArray(enabled_methods) ? enabled_methods : []));
    }

    if (redirect_urls !== undefined) {
      updates.push('redirect_urls = ?');
      values.push(JSON.stringify(redirect_urls));
    }

    if (webhook_url !== undefined) {
      updates.push('webhook_url = ?');
      values.push(webhook_url);
    }

    if (callback_url !== undefined) {
      updates.push('callback_url = ?');
      values.push(callback_url);
    }

    if (notes !== undefined) {
      updates.push('notes = ?');
      values.push(notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(gatewayName);

    await pool.execute(
      `UPDATE payment_gateway_settings SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE gateway_name = ?`,
      values
    );

    // Get updated gateway
    const [updated] = await pool.execute(
      'SELECT * FROM payment_gateway_settings WHERE gateway_name = ?',
      [gatewayName]
    );

    const g = updated[0];
    let credentialsObj = {};
    let enabledMethods = [];
    let redirectUrls = {};

    if (g.credentials) {
      try {
        credentialsObj = typeof g.credentials === 'string' ? JSON.parse(g.credentials) : g.credentials;
      } catch (e) {
        credentialsObj = {};
      }
    }

    if (g.enabled_methods) {
      try {
        enabledMethods = typeof g.enabled_methods === 'string' ? JSON.parse(g.enabled_methods) : g.enabled_methods;
      } catch (e) {
        enabledMethods = [];
      }
    }

    if (g.redirect_urls) {
      try {
        redirectUrls = typeof g.redirect_urls === 'string' ? JSON.parse(g.redirect_urls) : g.redirect_urls;
      } catch (e) {
        redirectUrls = {};
      }
    }

    res.json({
      success: true,
      message: 'Payment gateway updated successfully',
      data: {
        ...g,
        enabled: Boolean(g.enabled),
        is_test_mode: Boolean(g.is_test_mode),
        credentials: credentialsObj,
        enabled_methods: Array.isArray(enabledMethods) ? enabledMethods : [],
        redirect_urls: redirectUrls
      }
    });
  } catch (error) {
    console.error('Update payment gateway error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};


import { getReceipt, generateFeeReceipt, generatePaymentReceipt } from '../utils/receiptService.js';
import { pool } from '../config/database.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get receipt by receipt number
 * GET /api/receipts/:receiptNumber
 */
export const getReceiptByNumber = async (req, res) => {
  try {
    const { receiptNumber } = req.params;
    const userIc = req.user?.ic || req.user?.userId;
    const userRole = req.user?.role;

    if (!receiptNumber) {
      return res.status(400).json({
        success: false,
        message: 'Receipt number is required'
      });
    }

    let receipt = await getReceipt(receiptNumber);

    // If receipt not found, try to find by fee ID or payment ID
    if (!receipt) {
      // Try to find fee with this receipt number
      const [fees] = await pool.execute(
        'SELECT id FROM fees WHERE no_resit = ? AND status = ?',
        [receiptNumber, 'terbayar']
      );
      
      if (fees.length > 0) {
        try {
          const { generateFeeReceipt } = await import('../utils/receiptService.js');
          await generateFeeReceipt(fees[0].id);
          receipt = await getReceipt(receiptNumber);
        } catch (error) {
          console.error('Error generating receipt:', error);
        }
      }

      // Try to find payment with this receipt number
      if (!receipt) {
        const [payments] = await pool.execute(
          'SELECT id FROM payments WHERE metadata LIKE ? AND status = ?',
          [`%${receiptNumber}%`, 'completed']
        );
        
        for (const payment of payments) {
          const metadata = payment.metadata ? JSON.parse(payment.metadata) : {};
          if (metadata.receiptNumber === receiptNumber) {
            try {
              const { generatePaymentReceipt } = await import('../utils/receiptService.js');
              await generatePaymentReceipt(payment.id);
              receipt = await getReceipt(receiptNumber);
              if (receipt) break;
            } catch (error) {
              console.error('Error generating payment receipt:', error);
            }
          }
        }
      }
    }

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: `Receipt ${receiptNumber} not found`
      });
    }

    // Check access permissions
    if (userRole !== 'admin') {
      if (receipt.type === 'fee') {
        const [fees] = await pool.execute(
          'SELECT student_ic FROM fees WHERE id = ?',
          [receipt.feeId]
        );
        if (fees.length > 0 && fees[0].student_ic !== userIc) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
      } else if (receipt.type === 'payment') {
        const [payments] = await pool.execute(
          'SELECT user_ic FROM payments WHERE id = ?',
          [receipt.paymentId]
        );
        if (payments.length > 0 && payments[0].user_ic !== userIc) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
      }
    }

    // Return receipt HTML
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(receipt.html);
  } catch (error) {
    console.error('Get receipt error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get receipt for a fee
 * GET /api/receipts/fee/:feeId
 */
export const getFeeReceipt = async (req, res) => {
  try {
    const { feeId } = req.params;
    const userIc = req.user?.ic || req.user?.userId;
    const userRole = req.user?.role;

    // Check fee exists and user has access
    const [fees] = await pool.execute(`
      SELECT f.*, u.nama as pelajar_nama, c.nama_kelas
      FROM fees f
      JOIN users u ON f.student_ic = u.ic
      LEFT JOIN students s ON u.ic = s.user_ic
      LEFT JOIN classes c ON s.kelas_id = c.id
      WHERE f.id = ?
    `, [feeId]);

    if (fees.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Fee not found'
      });
    }

    const fee = fees[0];

    // Check access
    if (userRole !== 'admin' && fee.student_ic !== userIc) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Generate receipt if it doesn't exist
    if (!fee.resit_img || !fee.no_resit) {
      try {
        const receipt = await generateFeeReceipt(feeId);
        fee.resit_img = receipt.receiptPath;
        fee.no_resit = receipt.receiptNumber;
      } catch (error) {
        console.error('Error generating receipt:', error);
        return res.status(500).json({
          success: false,
          message: 'Error generating receipt'
        });
      }
    }

    // Get receipt HTML
    const receipt = await getReceipt(fee.no_resit);
    
    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Receipt file not found'
      });
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(receipt.html);
  } catch (error) {
    console.error('Get fee receipt error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get receipt for a payment
 * GET /api/receipts/payment/:paymentId
 */
export const getPaymentReceipt = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userIc = req.user?.ic || req.user?.userId;
    const userRole = req.user?.role;

    // Check payment exists and user has access
    const [payments] = await pool.execute(
      'SELECT * FROM payments WHERE id = ?',
      [paymentId]
    );

    if (payments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const payment = payments[0];

    // Check access
    if (userRole !== 'admin' && payment.user_ic !== userIc) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Generate receipt if it doesn't exist
    const metadata = payment.metadata ? JSON.parse(payment.metadata) : {};
    if (!metadata.receiptPath || !metadata.receiptNumber) {
      try {
        const receipt = await generatePaymentReceipt(paymentId);
        metadata.receiptPath = receipt.receiptPath;
        metadata.receiptNumber = receipt.receiptNumber;
      } catch (error) {
        console.error('Error generating receipt:', error);
        return res.status(500).json({
          success: false,
          message: 'Error generating receipt'
        });
      }
    }

    // Get receipt HTML
    const receipt = await getReceipt(metadata.receiptNumber);
    
    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Receipt file not found'
      });
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(receipt.html);
  } catch (error) {
    console.error('Get payment receipt error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get all receipts for a user
 * GET /api/receipts/user/:userId
 */
export const getUserReceipts = async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserIc = req.user?.ic || req.user?.userId;
    const userRole = req.user?.role;

    // Check access
    if (userRole !== 'admin' && userId !== requestingUserIc) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get all fees with receipts
    const [fees] = await pool.execute(`
      SELECT 
        f.id as fee_id,
        f.no_resit,
        f.resit_img,
        f.jumlah,
        f.tarikh_bayar,
        f.bulan,
        f.tahun,
        f.cara_bayar,
        'fee' as receipt_type
      FROM fees f
      WHERE f.student_ic = ? 
        AND f.status = 'terbayar'
        AND f.no_resit IS NOT NULL
        AND f.resit_img IS NOT NULL
      ORDER BY f.tarikh_bayar DESC
    `, [userId]);

    // Get all payments with receipts
    const [payments] = await pool.execute(
      `SELECT 
        id as payment_id,
        amount as jumlah,
        updated_at as tarikh_bayar,
        method as cara_bayar,
        metadata,
        'payment' as receipt_type
      FROM payments
      WHERE user_ic = ?
        AND status = 'completed'
        AND metadata LIKE '%receiptNumber%'
      ORDER BY updated_at DESC`,
      [userId]
    );

    // Parse payment metadata to extract receipt info
    const paymentReceipts = payments.map(p => {
      const metadata = p.metadata ? JSON.parse(p.metadata) : {};
      return {
        payment_id: p.payment_id,
        no_resit: metadata.receiptNumber || null,
        resit_img: metadata.receiptPath || null,
        jumlah: p.jumlah,
        tarikh_bayar: p.tarikh_bayar,
        cara_bayar: p.cara_bayar || 'Online',
        receipt_type: 'payment'
      };
    }).filter(p => p.no_resit && p.resit_img);

    const allReceipts = [
      ...fees.map(f => ({
        ...f,
        receipt_url: `/api/receipts/${f.no_resit}`
      })),
      ...paymentReceipts.map(p => ({
        ...p,
        receipt_url: `/api/receipts/${p.no_resit}`
      }))
    ].sort((a, b) => new Date(b.tarikh_bayar) - new Date(a.tarikh_bayar));

    res.json({
      success: true,
      data: allReceipts,
      total: allReceipts.length
    });
  } catch (error) {
    console.error('Get user receipts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};


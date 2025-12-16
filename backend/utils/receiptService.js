import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Receipt Service
 * Generates and stores online receipts for payments
 */

// Ensure receipts directory exists
const ensureReceiptsDirectory = () => {
  const receiptsDir = path.join(__dirname, '../uploads/receipts');
  if (!fs.existsSync(receiptsDir)) {
    fs.mkdirSync(receiptsDir, { recursive: true });
  }
  return receiptsDir;
};

/**
 * Generate unique receipt number (format: OR + 7 digits)
 * Checks database to ensure uniqueness
 */
export const generateUniqueReceiptNumber = async (feeId = null) => {
  const { pool } = await import('../config/database.js');
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    // Generate receipt number: OR + timestamp last 6 digits + random 1 digit
    const timestamp = Date.now();
    const timePart = timestamp.toString().slice(-6);
    const randomPart = Math.floor(Math.random() * 10).toString();
    const receiptNumber = `OR${timePart}${randomPart}`;
    
    // Check if receipt number already exists in fees table
    const [existingFees] = await pool.execute(
      'SELECT id FROM fees WHERE no_resit = ?',
      [receiptNumber]
    );
    
    // Check if receipt number exists in payments metadata
    const [existingPayments] = await pool.execute(
      'SELECT id FROM payments WHERE metadata LIKE ?',
      [`%"receiptNumber":"${receiptNumber}"%`]
    );
    
    if (existingFees.length === 0 && existingPayments.length === 0) {
      return receiptNumber;
    }
    
    attempts++;
    // Add small delay to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  // Fallback: use feeId + timestamp if uniqueness check fails
  const fallbackNumber = feeId 
    ? `OR${feeId.toString().padStart(6, '0')}${Date.now().toString().slice(-1)}`
    : `OR${Date.now().toString().slice(-7)}`;
  
  console.warn(`⚠️ Could not generate unique receipt number after ${maxAttempts} attempts, using fallback: ${fallbackNumber}`);
  return fallbackNumber;
};

/**
 * Generate receipt number (legacy function for backward compatibility)
 */
export const generateReceiptNumber = (feeId, paymentId = null) => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  if (paymentId) {
    return `RCP-${paymentId.substring(0, 8).toUpperCase()}-${random}`;
  }
  return `RCP-${feeId.toString().padStart(6, '0')}-${random}`;
};

/**
 * Generate HTML receipt - English version matching the image design
 */
export const generateReceiptHTML = async (receiptData) => {
  const {
    receiptNumber,
    studentName,
    studentIc,
    amount,
    paymentDate,
    paymentMethod,
    bulan,
    tahun,
    kelasNama,
    invoiceNumber,
    billId,
    masjidName = 'e-Sistem Kelas Pengajian Al-quran',
    masjidAddress = '',
    masjidPhone = '',
    logoPath = '/logomnsa1.jpeg'
  } = receiptData;

  // Format date as DD-MM-YYYY
  const formattedDate = new Date(paymentDate).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).split('/').join('-');

  // Get logo URL - use public path
  const logoUrl = logoPath.startsWith('http') ? logoPath : `${process.env.FRONTEND_URL || 'http://localhost:3000'}${logoPath}`;

  // Format payment method
  const formattedPaymentMethod = paymentMethod ? paymentMethod.toUpperCase() : 'ONLINE PAYMENT';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt - ${receiptNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            padding: 40px 20px;
            background-color: #ffffff;
        }
        .receipt-container {
            max-width: 700px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border: 1px solid #e0e0e0;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
        }
        .logo-section {
            flex: 0 0 auto;
        }
        .logo {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            object-fit: cover;
            background-color: #ff9800;
            padding: 10px;
        }
        .title-section {
            flex: 1;
            text-align: right;
        }
        .receipt-title {
            font-size: 36px;
            font-weight: bold;
            color: #424242;
            margin-bottom: 10px;
        }
        .receipt-number {
            font-size: 14px;
            color: #616161;
            margin-bottom: 5px;
        }
        .receipt-date {
            font-size: 14px;
            color: #616161;
        }
        .content-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }
        .issuer-info {
            flex: 1;
        }
        .issuer-name {
            font-size: 16px;
            font-weight: bold;
            color: #212121;
            margin-bottom: 10px;
        }
        .issuer-address {
            font-size: 14px;
            color: #616161;
            line-height: 1.6;
        }
        .payer-info {
            flex: 1;
            text-align: right;
        }
        .payer-label {
            font-size: 14px;
            color: #616161;
            margin-bottom: 5px;
        }
        .payer-name {
            font-size: 16px;
            font-weight: bold;
            color: #212121;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .items-table thead {
            background-color: #f5f5f5;
        }
        .items-table th {
            padding: 12px;
            text-align: left;
            font-size: 14px;
            font-weight: bold;
            color: #424242;
            border-bottom: 1px solid #e0e0e0;
        }
        .items-table td {
            padding: 12px;
            font-size: 14px;
            color: #212121;
            border-bottom: 1px solid #f0f0f0;
        }
        .items-table th:last-child,
        .items-table td:last-child {
            text-align: right;
        }
        .payment-summary {
            margin-bottom: 30px;
        }
        .summary-row {
            margin-bottom: 10px;
        }
        .summary-label {
            font-size: 14px;
            color: #616161;
            display: inline-block;
            min-width: 200px;
        }
        .summary-value {
            font-size: 14px;
            font-weight: bold;
            color: #212121;
        }
        .total-amount {
            font-size: 18px;
            font-weight: bold;
            color: #212121;
            margin-top: 10px;
        }
        .issued-by {
            border: 2px solid #f44336;
            padding: 10px;
            margin-top: 20px;
            display: inline-block;
        }
        .issued-by-label {
            font-size: 14px;
            font-weight: bold;
            color: #f44336;
        }
        .issued-by-value {
            font-size: 14px;
            color: #212121;
            margin-top: 5px;
        }
        .transaction-section {
            margin-top: 30px;
        }
        .transaction-title {
            font-size: 16px;
            font-weight: bold;
            color: #212121;
            margin-bottom: 15px;
        }
        .transaction-table {
            width: 100%;
            border-collapse: collapse;
        }
        .transaction-table thead {
            background-color: #f5f5f5;
        }
        .transaction-table th {
            padding: 12px;
            text-align: left;
            font-size: 14px;
            font-weight: bold;
            color: #424242;
            border-bottom: 1px solid #e0e0e0;
        }
        .transaction-table td {
            padding: 12px;
            font-size: 14px;
            color: #212121;
            border-bottom: 1px solid #f0f0f0;
        }
        .transaction-table th:last-child,
        .transaction-table td:last-child {
            text-align: right;
        }
        .note-section {
            margin-top: 20px;
            font-size: 14px;
            color: #616161;
        }
        @media print {
            body {
                padding: 0;
            }
            .receipt-container {
                border: none;
            }
        }
    </style>
</head>
<body>
    <div class="receipt-container">
        <div class="header">
            <div class="logo-section">
                <img src="${logoUrl}" alt="Logo" class="logo" onerror="this.style.display='none'">
            </div>
            <div class="title-section">
                <div class="receipt-title">RECEIPT</div>
                <div class="receipt-number">Receipt No.: ${receiptNumber}</div>
                <div class="receipt-date">Receipt Date: ${formattedDate}</div>
            </div>
        </div>
        
        <div class="content-section">
            <div class="issuer-info">
                <div class="issuer-name">${masjidName}</div>
                ${masjidAddress ? `<div class="issuer-address">${masjidAddress.split(',').join('<br>')}</div>` : ''}
            </div>
            <div class="payer-info">
                <div class="payer-label">Received From:</div>
                <div class="payer-name">${studentName}</div>
            </div>
        </div>
        
        <table class="items-table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Amount (RM)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${bulan ? `Fee ${bulan} ${tahun}` : 'Payment'}</td>
                    <td>${parseFloat(amount).toFixed(2)}</td>
                </tr>
            </tbody>
        </table>
        
        <div class="payment-summary">
            <div class="summary-row">
                <span class="summary-label">TOTAL AMOUNT RECEIVED:</span>
                <span class="summary-value total-amount">${parseFloat(amount).toFixed(2)}</span>
            </div>
            <div class="summary-row">
                <span class="summary-label">Payment Method:</span>
                <span class="summary-value">${formattedPaymentMethod}</span>
            </div>
            <div class="summary-row">
                <span class="summary-label">Payment Date:</span>
                <span class="summary-value">${formattedDate}</span>
            </div>
            <div class="issued-by">
                <div class="issued-by-label">Issued By:</div>
                <div class="issued-by-value">${masjidName}</div>
            </div>
            ${billId ? `
            <div class="note-section">
                <strong>Note:</strong> Bill ID = ${billId}
            </div>
            ` : ''}
        </div>
        
        ${invoiceNumber ? `
        <div class="transaction-section">
            <div class="transaction-title">Transaction</div>
            <table class="transaction-table">
                <thead>
                    <tr>
                        <th>Invoice No.</th>
                        <th>Date</th>
                        <th>Amount (RM)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>${invoiceNumber}</td>
                        <td>${formattedDate}</td>
                        <td>${parseFloat(amount).toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        ` : ''}
    </div>
</body>
</html>
  `.trim();
};

/**
 * Save receipt HTML to file
 */
export const saveReceiptFile = async (receiptHTML, receiptNumber) => {
  try {
    const receiptsDir = ensureReceiptsDirectory();
    const fileName = `receipt_${receiptNumber}_${Date.now()}.html`;
    const filePath = path.join(receiptsDir, fileName);
    
    fs.writeFileSync(filePath, receiptHTML, 'utf8');
    
    // Return relative path from uploads directory
    return `receipts/${fileName}`;
  } catch (error) {
    console.error('Error saving receipt file:', error);
    throw error;
  }
};

/**
 * Generate and save receipt for fee payment
 */
export const generateFeeReceipt = async (feeId, paymentData = {}) => {
  try {
    // Get fee details with student and class info
    const [fees] = await pool.execute(`
      SELECT 
        f.*,
        u.nama as student_name,
        u.ic as student_ic,
        u.email as student_email,
        c.nama_kelas as kelas_nama
      FROM fees f
      JOIN users u ON f.student_ic = u.ic
      LEFT JOIN students s ON u.ic = s.user_ic
      LEFT JOIN classes c ON s.kelas_id = c.id
      WHERE f.id = ?
    `, [feeId]);

    if (fees.length === 0) {
      throw new Error('Fee not found');
    }

    const fee = fees[0];
    
    // Generate unique receipt number if not provided
    let receiptNumber = paymentData.receiptNumber || fee.no_resit;
    if (!receiptNumber) {
      receiptNumber = await generateUniqueReceiptNumber(feeId);
    }
    
    // Generate invoice number
    const invoiceNumber = paymentData.invoiceNumber || `IV${feeId.toString().padStart(7, '0')}`;
    
    // Generate bill ID if from payment
    const billId = paymentData.billId || paymentData.provider_reference || null;
    
    // Get masjid info from settings or use defaults
    const masjidName = paymentData.masjidName || process.env.MASJID_NAME || 'e-Sistem Kelas Pengajian Al-quran';
    const masjidAddress = paymentData.masjidAddress || process.env.MASJID_ADDRESS || '';
    const logoPath = paymentData.logoPath || '/logomnsa1.jpeg';
    
    // Prepare receipt data
    const receiptData = {
      receiptNumber,
      studentName: fee.student_name,
      studentIc: fee.student_ic,
      amount: fee.jumlah,
      paymentDate: fee.tarikh_bayar || fee.tarikh || new Date(),
      paymentMethod: fee.cara_bayar || paymentData.paymentMethod || 'ONLINE PAYMENT',
      bulan: fee.bulan,
      tahun: fee.tahun,
      kelasNama: fee.kelas_nama,
      invoiceNumber,
      billId,
      masjidName,
      masjidAddress,
      logoPath,
      ...paymentData
    };

    // Generate HTML receipt
    const receiptHTML = await generateReceiptHTML(receiptData);
    
    // Save receipt file
    const receiptPath = await saveReceiptFile(receiptHTML, receiptNumber);
    
    // Update fee record with receipt path
    await pool.execute(
      `UPDATE fees 
       SET no_resit = ?, resit_img = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [receiptNumber, receiptPath, feeId]
    );

    return {
      receiptNumber,
      receiptPath,
      receiptHTML,
      receiptData
    };
  } catch (error) {
    console.error('Error generating fee receipt:', error);
    throw error;
  }
};

/**
 * Generate and save receipt for payment
 */
export const generatePaymentReceipt = async (paymentId, feeId = null) => {
  try {
    // Get payment details
    const [payments] = await pool.execute(`
      SELECT p.*, u.nama as user_name, u.ic as user_ic, u.email as user_email
      FROM payments p
      JOIN users u ON p.user_ic = u.ic
      WHERE p.id = ?
    `, [paymentId]);

    if (payments.length === 0) {
      throw new Error('Payment not found');
    }

    const payment = payments[0];
    
    // If payment is linked to a fee, use fee details
    if (feeId) {
      const metadata = payment.metadata ? JSON.parse(payment.metadata) : {};
      const receiptNumber = await generateUniqueReceiptNumber(feeId);
      return await generateFeeReceipt(feeId, {
        receiptNumber,
        paymentMethod: payment.method || 'ONLINE PAYMENT',
        paymentId: payment.id,
        billId: payment.provider_reference || metadata.billId,
        invoiceNumber: `IV${feeId.toString().padStart(7, '0')}`
      });
    }

    // Otherwise generate standalone payment receipt
    const receiptNumber = await generateUniqueReceiptNumber();
    const invoiceNumber = `IV${paymentId.substring(0, 7).padStart(7, '0')}`;
    const metadata = payment.metadata ? JSON.parse(payment.metadata) : {};
    
    // Get masjid info from settings or use defaults
    const masjidName = process.env.MASJID_NAME || 'e-Sistem Kelas Pengajian Al-quran';
    const masjidAddress = process.env.MASJID_ADDRESS || '';
    const logoPath = '/logomnsa1.jpeg';
    
    const receiptData = {
      receiptNumber,
      studentName: payment.user_name,
      studentIc: payment.user_ic,
      amount: payment.amount,
      paymentDate: payment.updated_at || payment.created_at,
      paymentMethod: payment.method || 'ONLINE PAYMENT',
      bulan: new Date().toLocaleString('en-US', { month: 'long' }),
      tahun: new Date().getFullYear(),
      kelasNama: null,
      invoiceNumber,
      billId: payment.provider_reference || metadata.billId,
      masjidName,
      masjidAddress,
      logoPath,
      paymentId: payment.id
    };

    const receiptHTML = await generateReceiptHTML(receiptData);
    const receiptPath = await saveReceiptFile(receiptHTML, receiptNumber);
    
    // Store receipt path in payment metadata
    metadata.receiptPath = receiptPath;
    metadata.receiptNumber = receiptNumber;
    metadata.invoiceNumber = invoiceNumber;
    
    await pool.execute(
      `UPDATE payments 
       SET metadata = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [JSON.stringify(metadata), paymentId]
    );

    return {
      receiptNumber,
      receiptPath,
      receiptHTML,
      receiptData
    };
  } catch (error) {
    console.error('Error generating payment receipt:', error);
    throw error;
  }
};

/**
 * Get receipt by receipt number
 */
export const getReceipt = async (receiptNumber) => {
  try {
    if (!receiptNumber) {
      return null;
    }

    // Try to find in fees table
    const [fees] = await pool.execute(
      'SELECT * FROM fees WHERE no_resit = ?',
      [receiptNumber]
    );

    if (fees.length > 0) {
      const fee = fees[0];
      
      // Try multiple path resolutions
      const possiblePaths = [
        path.join(__dirname, '../uploads', fee.resit_img),
        path.join(__dirname, '../../uploads', fee.resit_img),
        path.join(process.cwd(), 'uploads', fee.resit_img),
        fee.resit_img.startsWith('/') ? fee.resit_img : path.join(__dirname, '../uploads', fee.resit_img)
      ];

      for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
          return {
            type: 'fee',
            receiptNumber: fee.no_resit,
            receiptPath: fee.resit_img,
            feeId: fee.id,
            html: fs.readFileSync(filePath, 'utf8')
          };
        }
      }

      // If file doesn't exist but fee has receipt number, regenerate receipt
      if (fee.no_resit && fee.status === 'terbayar') {
        console.log(`Receipt file not found for ${receiptNumber}, regenerating...`);
        try {
          const receipt = await generateFeeReceipt(fee.id);
          const receiptsDir = ensureReceiptsDirectory();
          const newFilePath = path.join(receiptsDir, path.basename(receipt.receiptPath));
          
          if (fs.existsSync(newFilePath)) {
            return {
              type: 'fee',
              receiptNumber: fee.no_resit,
              receiptPath: receipt.receiptPath,
              feeId: fee.id,
              html: fs.readFileSync(newFilePath, 'utf8')
            };
          }
        } catch (regenerateError) {
          console.error('Error regenerating receipt:', regenerateError);
        }
      }
    }

    // Try to find in payments table
    const [payments] = await pool.execute(
      'SELECT * FROM payments WHERE metadata LIKE ?',
      [`%${receiptNumber}%`]
    );

    for (const payment of payments) {
      const metadata = payment.metadata ? JSON.parse(payment.metadata) : {};
      if (metadata.receiptNumber === receiptNumber && metadata.receiptPath) {
        const possiblePaths = [
          path.join(__dirname, '../uploads', metadata.receiptPath),
          path.join(__dirname, '../../uploads', metadata.receiptPath),
          path.join(process.cwd(), 'uploads', metadata.receiptPath),
          metadata.receiptPath.startsWith('/') ? metadata.receiptPath : path.join(__dirname, '../uploads', metadata.receiptPath)
        ];

        for (const filePath of possiblePaths) {
          if (fs.existsSync(filePath)) {
            return {
              type: 'payment',
              receiptNumber: metadata.receiptNumber,
              receiptPath: metadata.receiptPath,
              paymentId: payment.id,
              html: fs.readFileSync(filePath, 'utf8')
            };
          }
        }

        // If file doesn't exist but payment has receipt number, regenerate receipt
        if (metadata.receiptNumber && payment.status === 'completed') {
          console.log(`Receipt file not found for payment ${payment.id}, regenerating...`);
          try {
            const receipt = await generatePaymentReceipt(payment.id);
            const receiptsDir = ensureReceiptsDirectory();
            const newFilePath = path.join(receiptsDir, path.basename(receipt.receiptPath));
            
            if (fs.existsSync(newFilePath)) {
              return {
                type: 'payment',
                receiptNumber: metadata.receiptNumber,
                receiptPath: receipt.receiptPath,
                paymentId: payment.id,
                html: fs.readFileSync(newFilePath, 'utf8')
              };
            }
          } catch (regenerateError) {
            console.error('Error regenerating payment receipt:', regenerateError);
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting receipt:', error);
    throw error;
  }
};


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
    studentPhone,
    studentEmail,
    amount,
    paymentDate,
    paymentMethod,
    bulan,
    tahun,
    kelasNama,
    peringkat = 'N/A',
    teacherName = 'N/A',
    invoiceNumber,
    billId,
    orderId,
    masjidName = 'e-Sistem Kelas Pengajian Al-quran',
    masjidAddress = '',
    masjidPhone = '',
    logoPath = '/logomnsa1.jpeg',
    discountAmount = 0,
    discountType = null
  } = receiptData;

  // Format date as Month Day, Year (e.g., "August 24, 2025")
  const formattedDate = new Date(paymentDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Format date for order date (same format)
  const orderDate = formattedDate;

  // Get logo URL - use public path
  const logoUrl = logoPath.startsWith('http') ? logoPath : `${process.env.FRONTEND_URL || 'http://localhost:3000'}${logoPath}`;

  // Format payment method
  const formattedPaymentMethod = paymentMethod ? paymentMethod.toUpperCase() : 'ONLINE PAYMENT';

  // Generate Order ID if not provided
  const finalOrderId = orderId || billId || invoiceNumber || receiptNumber;

  // Calculate totals
  const subtotal = parseFloat(amount || 0);
  const discount = parseFloat(discountAmount || 0);
  const total = subtotal - discount;

  // Description for the item
  const itemDescription = bulan && tahun ? `Fee ${bulan} ${tahun}` : 'Payment';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice - ${receiptNumber}</title>
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
            color: #333333;
        }
        .receipt-container {
            max-width: 700px;
            margin: 0 auto;
            background: white;
            padding: 40px;
        }
        .logo-container {
            text-align: center;
            margin-bottom: 20px;
        }
        .logo-container img {
            max-width: 150px;
            height: auto;
        }
        .greeting {
            font-size: 18px;
            color: #333333;
            margin-bottom: 10px;
        }
        .thank-you {
            font-size: 16px;
            color: #666666;
            margin-bottom: 30px;
        }
        .invoice-id {
            font-size: 32px;
            font-weight: bold;
            color: #000000;
            margin-bottom: 40px;
            letter-spacing: 1px;
        }
        .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #333333;
            margin-bottom: 15px;
            margin-top: 30px;
        }
        .order-info {
            margin-bottom: 30px;
        }
        .info-row {
            margin-bottom: 8px;
            font-size: 14px;
            color: #333333;
        }
        .info-label {
            font-weight: bold;
            display: inline-block;
            min-width: 120px;
        }
        .info-value {
            color: #333333;
        }
        .info-value a {
            color: #0066cc;
            text-decoration: none;
        }
        .info-value a:hover {
            text-decoration: underline;
        }
        .items-section {
            margin-bottom: 30px;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        .items-table thead {
            background-color: #f5f5f5;
        }
        .items-table th {
            padding: 12px;
            text-align: left;
            font-size: 14px;
            font-weight: bold;
            color: #333333;
            border-bottom: 1px solid #e0e0e0;
        }
        .items-table td {
            padding: 12px;
            font-size: 14px;
            color: #333333;
            border-bottom: 1px solid #f0f0f0;
        }
        .items-table th:last-child,
        .items-table td:last-child {
            text-align: right;
        }
        .discounts-section {
            margin-bottom: 30px;
        }
        .discounts-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        .discounts-table thead {
            background-color: #f5f5f5;
        }
        .discounts-table th {
            padding: 12px;
            text-align: left;
            font-size: 14px;
            font-weight: bold;
            color: #333333;
            border-bottom: 1px solid #e0e0e0;
        }
        .discounts-table td {
            padding: 12px;
            font-size: 14px;
            color: #333333;
            border-bottom: 1px solid #f0f0f0;
        }
        .discounts-table th:last-child,
        .discounts-table td:last-child {
            text-align: right;
        }
        .total-section {
            margin-top: 30px;
            margin-bottom: 30px;
        }
        .total-amount {
            font-size: 20px;
            font-weight: bold;
            color: #000000;
        }
        .footer {
            margin-top: 40px;
            font-size: 14px;
            color: #666666;
            text-align: center;
        }
        .student-info-section {
            margin-top: 30px;
            padding: 20px;
            background-color: #f9f9f9;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
        }
        .student-info-title {
            font-size: 16px;
            font-weight: bold;
            color: #333333;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e0e0e0;
        }
        .student-info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-top: 15px;
        }
        .student-info-item {
            background-color: white;
            padding: 12px;
            border-radius: 5px;
            border: 1px solid #e0e0e0;
        }
        .student-info-label {
            font-size: 12px;
            color: #666666;
            margin-bottom: 5px;
            text-transform: uppercase;
            font-weight: 600;
        }
        .student-info-value {
            font-size: 14px;
            color: #333333;
            font-weight: bold;
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
            color: #333333;
            margin-top: 5px;
        }
        @media print {
            body {
                padding: 0;
            }
            .receipt-container {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="receipt-container">
        <div class="logo-container">
            <img src="${logoUrl}" alt="Masjid Logo" />
        </div>
        <div class="greeting">Hi ${studentName || 'Customer'}!</div>
        <div class="thank-you">Thank you for your payment</div>
        <div class="invoice-id">INVOICE ID: ${receiptNumber}</div>
        
        <div class="order-info">
            <div class="section-title">YOUR ORDER INFORMATION</div>
            <div class="info-row">
                <span class="info-label">Order ID:</span>
                <span class="info-value">${finalOrderId}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Order Date:</span>
                <span class="info-value">${orderDate}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Bill To:</span>
                <span class="info-value">
                    ${studentEmail ? `<a href="mailto:${studentEmail}">${studentEmail}</a>` : (studentPhone || 'N/A')}
                </span>
            </div>
            <div class="info-row">
                <span class="info-label">Source:</span>
                <span class="info-value">${masjidName}</span>
            </div>
        </div>
        
        <div class="items-section">
            <div class="section-title">HERE'S WHAT YOU ORDERED</div>
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Publisher</th>
                        <th>Price</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>${itemDescription}</td>
                        <td>${kelasNama || 'N/A'}</td>
                        <td>RM${subtotal.toFixed(2)} MYR</td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        ${discount > 0 ? `
        <div class="discounts-section">
            <div class="section-title">Discounts</div>
            <table class="discounts-table">
                <thead>
                    <tr>
                        <th>Discount Type</th>
                        <th>Discount Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>${discountType || 'Discount'}</td>
                        <td>- RM${discount.toFixed(2)} MYR</td>
                    </tr>
                </tbody>
            </table>
        </div>
        ` : ''}
        
        <div class="total-section">
            <div class="section-title">TOTAL</div>
            <div class="total-amount">RM${total.toFixed(2)} MYR</div>
        </div>
        
        <div class="student-info-section">
            <div class="student-info-title">STUDENT INFORMATION</div>
            <div class="student-info-grid">
                <div class="student-info-item">
                    <div class="student-info-label">Full Name</div>
                    <div class="student-info-value">${studentName || 'N/A'}</div>
                </div>
                <div class="student-info-item">
                    <div class="student-info-label">IC Number</div>
                    <div class="student-info-value">${studentPhone || 'N/A'}</div>
                </div>
                <div class="student-info-item">
                    <div class="student-info-label">Class (Kelas)</div>
                    <div class="student-info-value">${kelasNama || 'N/A'}</div>
                </div>
                <div class="student-info-item">
                    <div class="student-info-label">Level (Peringkat)</div>
                    <div class="student-info-value">${peringkat || 'N/A'}</div>
                </div>
                <div class="student-info-item">
                    <div class="student-info-label">Teacher Name</div>
                    <div class="student-info-value">${teacherName || 'N/A'}</div>
                </div>
                <div class="student-info-item">
                    <div class="student-info-label">Payment Method</div>
                    <div class="student-info-value">${formattedPaymentMethod}</div>
                </div>
            </div>
        </div>
        
        ${invoiceNumber ? `
        <div class="order-info" style="margin-top: 30px;">
            <div class="info-row">
                <span class="info-label">Invoice Number:</span>
                <span class="info-value">${invoiceNumber}</span>
            </div>
        </div>
        ` : ''}
        
        ${billId ? `
        <div class="order-info" style="margin-top: 15px;">
            <div class="info-row">
                <span class="info-label">Bill ID:</span>
                <span class="info-value">${billId}</span>
            </div>
        </div>
        ` : ''}
        
        <div class="issued-by">
            <div class="issued-by-label">Issued By:</div>
            <div class="issued-by-value">${masjidName}</div>
        </div>
        
        <div class="footer">
            Please keep a copy of this receipt for your records.
        </div>
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
    // Get fee details with student, class, and teacher info
    const [fees] = await pool.execute(`
      SELECT 
        f.*,
        u.nama as student_name,
        u.telefon as student_telefon,
        u.email as student_email,
        c.nama_kelas as kelas_nama,
        c.level as peringkat,
        t.nama as teacher_name
      FROM fees f
      JOIN users u ON f.student_telefon = u.telefon
      LEFT JOIN students s ON u.telefon = s.user_telefon
      LEFT JOIN classes c ON s.kelas_id = c.id
      LEFT JOIN users t ON c.guru_telefon = t.ic
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
    // Log for debugging
    console.log('Receipt Data:', {
      studentName: fee.student_name,
      peringkat: fee.peringkat,
      teacherName: fee.teacher_name,
      amount: fee.jumlah
    });
    
    const receiptData = {
      receiptNumber,
      studentName: fee.student_name || 'N/A',
      studentPhone: fee.student_telefon,
      studentEmail: fee.student_email || null,
      amount: fee.jumlah,
      paymentDate: fee.tarikh_bayar || fee.tarikh || new Date(),
      paymentMethod: fee.cara_bayar || paymentData.paymentMethod || 'ONLINE PAYMENT',
      bulan: fee.bulan,
      tahun: fee.tahun,
      kelasNama: fee.kelas_nama,
      peringkat: fee.peringkat || fee.level || 'N/A',
      teacherName: fee.teacher_name || fee.guru_nama || 'N/A',
      invoiceNumber,
      billId,
      orderId: billId || invoiceNumber || receiptNumber,
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
    // Get payment details with student, class, and teacher info
    const [payments] = await pool.execute(`
      SELECT 
        p.*, 
        u.nama as user_name, 
        u.telefon as user_telefon, 
        u.email as user_email,
        c.nama_kelas as kelas_nama,
        c.level as peringkat,
        t.nama as teacher_name
      FROM payments p
      JOIN users u ON p.user_telefon = u.telefon
      LEFT JOIN students s ON u.telefon = s.user_telefon
      LEFT JOIN classes c ON s.kelas_id = c.id
      LEFT JOIN users t ON c.guru_telefon = t.ic
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

    // Otherwise generate standalone payment receipt with class and teacher info
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
      studentPhone: payment.user_telefon,
      studentEmail: payment.user_email || null,
      amount: payment.amount,
      paymentDate: payment.updated_at || payment.created_at,
      paymentMethod: payment.method || 'ONLINE PAYMENT',
      bulan: new Date().toLocaleString('en-US', { month: 'long' }),
      tahun: new Date().getFullYear(),
      kelasNama: payment.kelas_nama || 'N/A',
      peringkat: payment.peringkat || 'N/A',
      teacherName: payment.teacher_name || 'N/A',
      invoiceNumber,
      billId: payment.provider_reference || metadata.billId,
      orderId: payment.provider_reference || metadata.billId || invoiceNumber || receiptNumber,
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
          const html = fs.readFileSync(filePath, 'utf8');
          
          // Check if receipt has STUDENT INFORMATION section and logo (new format)
          // If not, regenerate it with updated template
          const hasNewFormat = html.includes('STUDENT INFORMATION') && html.includes('logo-container');
          if (!hasNewFormat && fee.status === 'terbayar') {
            const missingParts = [];
            if (!html.includes('STUDENT INFORMATION')) missingParts.push('STUDENT INFORMATION');
            if (!html.includes('logo-container')) missingParts.push('logo');
            console.log(`Receipt ${receiptNumber} missing ${missingParts.join(' and ')}, regenerating...`);
            try {
              const receipt = await generateFeeReceipt(fee.id);
              const receiptsDir = ensureReceiptsDirectory();
              const newFilePath = path.join(receiptsDir, path.basename(receipt.receiptPath));
              
              if (fs.existsSync(newFilePath)) {
                const newHtml = fs.readFileSync(newFilePath, 'utf8');
                console.log(`Receipt ${receiptNumber} successfully regenerated with new format`);
                return {
                  type: 'fee',
                  receiptNumber: fee.no_resit,
                  receiptPath: receipt.receiptPath,
                  feeId: fee.id,
                  html: newHtml
                };
              }
            } catch (regenerateError) {
              console.error('Error regenerating receipt:', regenerateError);
              // Fall through to return old receipt if regeneration fails
            }
          }
          
          return {
            type: 'fee',
            receiptNumber: fee.no_resit,
            receiptPath: fee.resit_img,
            feeId: fee.id,
            html: html
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
            const html = fs.readFileSync(filePath, 'utf8');
            
            // Check if receipt has STUDENT INFORMATION section and logo (new format)
            // If not, regenerate it with updated template
            const hasNewFormat = html.includes('STUDENT INFORMATION') && html.includes('logo-container');
            if (!hasNewFormat && payment.status === 'completed') {
              const missingParts = [];
              if (!html.includes('STUDENT INFORMATION')) missingParts.push('STUDENT INFORMATION');
              if (!html.includes('logo-container')) missingParts.push('logo');
              console.log(`Receipt ${receiptNumber} missing ${missingParts.join(' and ')}, regenerating...`);
              try {
                const receipt = await generatePaymentReceipt(payment.id);
                const receiptsDir = ensureReceiptsDirectory();
                const newFilePath = path.join(receiptsDir, path.basename(receipt.receiptPath));
                
                if (fs.existsSync(newFilePath)) {
                  const newHtml = fs.readFileSync(newFilePath, 'utf8');
                  console.log(`Receipt ${receiptNumber} successfully regenerated with new format`);
                  return {
                    type: 'payment',
                    receiptNumber: metadata.receiptNumber,
                    receiptPath: receipt.receiptPath,
                    paymentId: payment.id,
                    html: newHtml
                  };
                }
              } catch (regenerateError) {
                console.error('Error regenerating payment receipt:', regenerateError);
                // Fall through to return old receipt if regeneration fails
              }
            }
            
            return {
              type: 'payment',
              receiptNumber: metadata.receiptNumber,
              receiptPath: metadata.receiptPath,
              paymentId: payment.id,
              html: html
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


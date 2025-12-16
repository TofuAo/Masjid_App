# Online Receipt Feature

## Overview
The system now automatically generates and stores online receipts when users make payments. Receipts are stored as HTML files in the user's data and can be accessed anytime.

## Features

### 1. Automatic Receipt Generation
- **Fee Payments**: When a fee is marked as paid, a receipt is automatically generated
- **Online Payments**: When a payment is completed through payment gateways (ToyyibPay, etc.), a receipt is automatically generated
- **Webhook Payments**: When payment webhooks confirm payment completion, receipts are generated

### 2. Receipt Storage
- Receipts are stored as HTML files in `backend/uploads/receipts/`
- Receipt paths are stored in the database:
  - Fees: `fees.resit_img` field
  - Payments: `payments.metadata.receiptPath` field
- Receipt numbers are stored:
  - Fees: `fees.no_resit` field
  - Payments: `payments.metadata.receiptNumber` field

### 3. Receipt Content
Each receipt includes:
- Masjid/Organization name and details
- Receipt number
- Student name and IC
- Class name (if applicable)
- Payment amount
- Payment date and time
- Payment method
- Month/Year of payment
- Professional formatting with print-friendly styling

### 4. API Endpoints

#### Get Receipt by Receipt Number
```
GET /api/receipts/:receiptNumber
```
Returns the HTML receipt for viewing/printing.

#### Get Receipt for Fee
```
GET /api/receipts/fee/:feeId
```
Generates receipt if it doesn't exist, then returns it.

#### Get Receipt for Payment
```
GET /api/receipts/payment/:paymentId
```
Generates receipt if it doesn't exist, then returns it.

#### Get All User Receipts
```
GET /api/receipts/user/:userId
```
Returns list of all receipts for a user (both fees and payments).

### 5. Access Control
- Users can only access their own receipts
- Admins can access all receipts
- Receipts are protected by authentication middleware

### 6. Receipt Format
Receipts are generated as HTML files with:
- Professional design
- Print-friendly styling
- Responsive layout
- All payment details clearly displayed
- Malay language support

## Usage Examples

### When Fee is Marked as Paid
```javascript
// Automatically generates receipt
PUT /api/fees/:id/mark-paid
{
  "cara_bayar": "Online",
  "no_resit": "RCP-001234-567" // Optional, auto-generated if not provided
}
```

### When Payment is Completed
The receipt is automatically generated when:
- Payment webhook confirms completion
- Payment status is updated to 'completed'
- Fee is linked to payment via metadata

### View Receipt
```javascript
// Get receipt HTML
GET /api/receipts/RCP-001234-567

// Or via fee ID
GET /api/receipts/fee/123

// Or via payment ID
GET /api/receipts/payment/abc-123-def
```

### Get All User Receipts
```javascript
GET /api/receipts/user/123456789012
```

## File Structure
```
backend/
├── uploads/
│   └── receipts/
│       ├── receipt_RCP-001234-567_1234567890.html
│       ├── receipt_RCP-001235-568_1234567891.html
│       └── ...
├── utils/
│   └── receiptService.js  # Receipt generation service
└── controllers/
    └── receiptController.js  # Receipt API endpoints
```

## Database Fields

### Fees Table
- `no_resit`: Receipt number (e.g., "RCP-001234-567")
- `resit_img`: Receipt file path (e.g., "receipts/receipt_RCP-001234-567_1234567890.html")

### Payments Table
- `metadata`: JSON field containing:
  - `receiptNumber`: Receipt number
  - `receiptPath`: Receipt file path
  - `fee_id`: Linked fee ID (if applicable)

## Integration Points

1. **Fee Controller** (`markAsPaid`): Generates receipt when fee is marked as paid
2. **Payment Service** (`updatePaymentStatus`): Generates receipt when payment status becomes 'completed'
3. **Webhook Controller**: Generates receipt when webhook confirms payment completion
4. **ToyyibPay Service**: Generates receipt when ToyyibPay payment completes and updates fee

## Benefits

1. **Automatic**: No manual receipt creation needed
2. **Persistent**: Receipts are stored permanently in user's data
3. **Accessible**: Users can view/download receipts anytime
4. **Professional**: Well-formatted, print-ready receipts
5. **Traceable**: Receipt numbers for easy reference
6. **Secure**: Access-controlled, users can only see their own receipts

## Future Enhancements

- PDF generation option
- Email receipt delivery
- Receipt download functionality
- Receipt search and filtering
- Receipt templates customization


# IB Role Implementation - Complete Guide

## ✅ What Has Been Implemented

### 1. **Database Changes**
- ✅ Added 'ib' role to users table ENUM
- ✅ Created `payment_confirmations` table for monthly report confirmations
- ✅ Migration script: `database/migration_add_ib_role.sql`

### 2. **Backend Implementation**
- ✅ IB Controller: `backend/controllers/ibController.js`
  - `getMonthlyPaymentReport()` - Get detailed monthly payment report
  - `confirmMonthlyPayment()` - Confirm/reject monthly payment report
  - `getAvailableMonthlyReports()` - List all monthly reports available for confirmation

- ✅ IB Routes: `backend/routes/ib.js`
  - `GET /api/ib/reports` - Get available monthly reports
  - `GET /api/ib/report?bulan=November&tahun=2025` - Get detailed report
  - `POST /api/ib/confirm` - Confirm monthly payment report

- ✅ IB Role Initialization: `backend/utils/ensureIbRole.js`
  - Automatically creates IB role and payment_confirmations table on startup

- ✅ Single IB User Enforcement: `backend/middleware/ensureSingleIb.js`
  - Ensures only one user can have IB role at a time

### 3. **Frontend Implementation**
- ✅ IB Dashboard: `src/pages/IbDashboard.jsx`
  - View all monthly payment reports
  - Filter by status (all, can confirm, pending, confirmed)
  - View detailed monthly report with all payments
  - Confirm or reject monthly reports
  - Add notes when confirming

- ✅ Login Integration: Updated `src/components/auth/Login.jsx`
  - Added IB role option in login dropdown
  - IB users redirected to `/ib-dashboard` after login

- ✅ API Service: Updated `src/services/api.js`
  - Added `ibAPI` with all IB-related functions

- ✅ Routing: Updated `src/App.jsx`
  - Added route `/ib-dashboard` for IB dashboard

## 📋 How It Works

### Monthly Payment Confirmation Workflow

1. **Payment Period**: Payments are recorded throughout the month (e.g., November 2025)

2. **Confirmation Period**: 
   - Starts: 5th of next month (e.g., December 5, 2025)
   - Ends: 10th of next month (e.g., December 10, 2025)
   - Example: November report can be confirmed from December 5-10

3. **IB Confirmation Process**:
   - IB user logs in and goes to IB Dashboard
   - Sees list of monthly reports
   - Reports in confirmation period are highlighted
   - IB clicks on a report to view details
   - Reviews all payments for that month
   - Confirms or rejects the report
   - Can add notes/remarks

4. **Confirmation Status**:
   - `pending` - Not yet confirmed
   - `confirmed` - IB has confirmed the report
   - `rejected` - IB has rejected the report (requires review)

## 🔐 IB Role Management

### Creating an IB User

Only one user can have the IB role at a time. To assign IB role:

1. **Via Database** (Direct):
```sql
-- Remove IB role from current IB user (if any)
UPDATE users SET role = 'staff' WHERE role = 'ib';

-- Assign IB role to new user
UPDATE users SET role = 'ib' WHERE ic = 'USER_IC_HERE';
```

2. **Via Admin Panel** (Recommended):
- Admin can assign IB role through user management
- System automatically removes IB role from previous user

### IB User Requirements
- Must be an active user (`status = 'aktif'`)
- Only one IB user exists at any time
- IB user can also have other roles (e.g., admin, staff) but IB role takes precedence for payment confirmation

## 📊 Payment Confirmation Table Structure

```sql
payment_confirmations
- id (INT, PRIMARY KEY)
- bulan (VARCHAR) - Month name (e.g., 'November')
- tahun (INT) - Year (e.g., 2025)
- confirmed_by_ic (VARCHAR) - IB user IC
- confirmed_at (TIMESTAMP) - When confirmed
- confirmation_period_start (DATE) - Start of confirmation period
- confirmation_period_end (DATE) - End of confirmation period
- status (ENUM) - 'pending', 'confirmed', 'rejected'
- notes (TEXT) - Optional notes from IB
- total_payments (INT) - Total number of payments
- total_amount (DECIMAL) - Total amount collected
- verified_payments (INT) - Number of payments verified
```

## 🚀 Usage Instructions

### For IB User:

1. **Login**:
   - Use IC and password
   - Select role: "IB (Pengesah Pembayaran)"
   - Click Login

2. **View Reports**:
   - Dashboard shows all monthly reports
   - Reports in confirmation period are highlighted
   - Click on any report to view details

3. **Confirm Report**:
   - Click on report in confirmation period
   - Review all payments
   - Click "Sahkan Laporan" to confirm
   - Or "Tolak Laporan" to reject
   - Add notes if needed

### For Admin:

1. **Assign IB Role**:
   - Go to Admin panel
   - Find user to assign IB role
   - Change role to 'ib'
   - System automatically removes IB role from previous user

2. **View Confirmation History**:
   - Can access IB dashboard (admin has access)
   - View all confirmed/rejected reports

## 📝 API Endpoints

### Get Available Monthly Reports
```
GET /api/ib/reports
Headers: Authorization: Bearer <token>
Response: {
  success: true,
  data: [
    {
      bulan: "November",
      tahun: 2025,
      total_payments: 150,
      total_amount: 22500.00,
      paid_count: 120,
      confirmation_status: "pending",
      isInConfirmationPeriod: true,
      canConfirm: true,
      confirmation_period_start: "2025-12-05",
      confirmation_period_end: "2025-12-10"
    }
  ]
}
```

### Get Monthly Payment Report
```
GET /api/ib/report?bulan=November&tahun=2025
Headers: Authorization: Bearer <token>
Response: {
  success: true,
  data: {
    bulan: "November",
    tahun: 2025,
    payments: [...],
    summary: {
      totalPayments: 150,
      totalAmount: 22500.00,
      paidCount: 120,
      pendingCount: 30
    },
    confirmation: {...}
  }
}
```

### Confirm Monthly Payment
```
POST /api/ib/confirm
Headers: Authorization: Bearer <token>
Body: {
  bulan: "November",
  tahun: 2025,
  status: "confirmed", // or "rejected" or "pending"
  notes: "Optional notes here"
}
Response: {
  success: true,
  message: "Laporan pembayaran November 2025 telah disahkan",
  data: {...}
}
```

## 🔧 Configuration

### Confirmation Period
Currently set to: **5th to 10th of next month**

To change, modify in `backend/controllers/ibController.js`:
```javascript
const periodStart = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 5);
const periodEnd = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 10);
```

## ✅ Testing

1. **Create IB User**:
```sql
UPDATE users SET role = 'ib' WHERE ic = 'YOUR_IC_HERE';
```

2. **Login as IB**:
- Use IC and password
- Select "IB (Pengesah Pembayaran)" role
- Should redirect to `/ib-dashboard`

3. **Test Confirmation**:
- View available reports
- Click on a report in confirmation period
- Review payments
- Confirm or reject

## 📋 Files Created/Modified

### Created:
1. `database/migration_add_ib_role.sql` - Database migration
2. `backend/utils/ensureIbRole.js` - IB role initialization
3. `backend/controllers/ibController.js` - IB controller
4. `backend/routes/ib.js` - IB routes
5. `backend/middleware/ensureSingleIb.js` - Single IB enforcement
6. `src/pages/IbDashboard.jsx` - IB dashboard page
7. `IB_ROLE_IMPLEMENTATION.md` - This documentation

### Modified:
1. `backend/server.js` - Added ensureIbRole() call
2. `backend/routes/index.js` - Added IB routes
3. `src/services/api.js` - Added ibAPI
4. `src/components/auth/Login.jsx` - Added IB role option
5. `src/App.jsx` - Added IB dashboard route

## 🎯 Next Steps

1. Run database migration:
```bash
docker-compose exec mysql mysql -umasjid_user -pmasjid_password masjid_app < database/migration_add_ib_role.sql
```

2. Restart backend:
```bash
docker-compose restart backend
```

3. Assign IB role to a user (via admin panel or database)

4. Test the complete workflow

## 📞 Support

If you encounter any issues:
1. Check backend logs: `docker-compose logs backend`
2. Verify IB role exists: `SELECT * FROM users WHERE role='ib';`
3. Check payment_confirmations table: `SELECT * FROM payment_confirmations;`


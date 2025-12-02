# IB Role Setup Guide - Quick Start

## 🚀 Quick Setup (3 Steps)

### Step 1: Run Database Migration
```bash
cd C:\MyMasjidApp
docker-compose exec -T mysql mysql -umasjid_user -pmasjid_password masjid_app < database/migration_add_ib_role.sql
```

### Step 2: Restart Backend
```bash
docker-compose restart backend
```

### Step 3: Assign IB Role to a User

**Option A: Via Database (Quick)**
```sql
-- Remove IB from current user (if any)
UPDATE users SET role = 'staff' WHERE role = 'ib';

-- Assign IB role to new user
UPDATE users SET role = 'ib' WHERE ic = 'YOUR_USER_IC_HERE';
```

**Option B: Via Admin Panel**
1. Login as admin
2. Go to Admins page
3. Find the user you want to assign IB role
4. Edit user and change role to 'ib'
5. System automatically removes IB role from previous user

## ✅ Verify Setup

1. **Check IB role exists:**
```sql
SELECT * FROM users WHERE role = 'ib';
```

2. **Check payment_confirmations table:**
```sql
SHOW TABLES LIKE 'payment_confirmations';
```

3. **Login as IB:**
- Use IC and password
- Select role: "IB (Pengesah Pembayaran)"
- Should redirect to `/ib-dashboard`

## 📋 How Monthly Confirmation Works

### Example: November 2025 Report

1. **Payment Period**: November 1-30, 2025
   - All payments recorded during this month

2. **Confirmation Period**: December 5-10, 2025
   - IB can confirm November report from Dec 5-10
   - After Dec 10, confirmation period ends

3. **IB Actions**:
   - View November payment report
   - Review all payments
   - Confirm or reject the report
   - Add notes if needed

## 🎯 Features

✅ **Single IB User**: Only one person can have IB role at a time
✅ **Monthly Reports**: Automatic generation of monthly payment reports
✅ **Confirmation Period**: 5th-10th of next month for confirmation
✅ **Detailed View**: See all payments, amounts, receipts for each month
✅ **Status Tracking**: Track confirmed, pending, or rejected reports
✅ **Notes**: Add notes when confirming/rejecting reports

## 📊 Dashboard Features

- **Filter Reports**: By status (all, can confirm, pending, confirmed)
- **View Details**: Click any report to see all payments
- **Confirm/Reject**: One-click confirmation or rejection
- **Summary Stats**: Total payments, amounts, paid/pending counts
- **Confirmation History**: See who confirmed and when

## 🔧 Configuration

Confirmation period is set to **5th-10th of next month**.

To change, edit `backend/controllers/ibController.js`:
```javascript
const periodStart = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 5);
const periodEnd = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 10);
```

## 📝 API Endpoints

- `GET /api/ib/reports` - List all monthly reports
- `GET /api/ib/report?bulan=November&tahun=2025` - Get detailed report
- `POST /api/ib/confirm` - Confirm/reject monthly report

## ✅ Testing Checklist

- [ ] Database migration successful
- [ ] Backend restarted
- [ ] IB role assigned to user
- [ ] Can login as IB
- [ ] IB dashboard loads
- [ ] Can view monthly reports
- [ ] Can confirm a report
- [ ] Confirmation saved to database

## 🐛 Troubleshooting

**IB role not showing in login:**
- Check database: `SELECT * FROM users WHERE role='ib';`
- Verify role ENUM includes 'ib': `SHOW COLUMNS FROM users LIKE 'role';`

**Cannot access IB dashboard:**
- Check user has IB role
- Check backend logs: `docker-compose logs backend`
- Verify route exists: Check `src/App.jsx` has `/ib-dashboard` route

**No reports showing:**
- Check if payments exist: `SELECT * FROM fees WHERE bulan='November' AND tahun=2025;`
- Verify payment_confirmations table exists

## 📞 Support

For issues, check:
1. Backend logs: `docker-compose logs backend --tail 50`
2. Database: `docker-compose exec mysql mysql -umasjid_user -pmasjid_password masjid_app`
3. Frontend console: Check browser developer tools


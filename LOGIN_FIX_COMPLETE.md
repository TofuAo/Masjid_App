# Login 401 Error - Fix Applied

## Issue
Getting `401 Unauthorized` error with message "IC Number atau kata laluan salah" when trying to login.

## Root Cause
Admin accounts may not exist in the database or have incorrect passwords/status.

## Fix Applied

### 1. Created Admin Account Fix Script
- **File**: `backend/scripts/fixAdminAccounts.js`
- **Purpose**: Ensures all admin accounts exist with correct passwords and status

### 2. Admin Accounts Configured
The following admin accounts are now ensured:

1. **USTAZ AMIR HASIF BIN HATA**
   - IC: `920312-06-5113` or `920312065113`
   - Password: `Amir920313`
   - Role: `admin`
   - Status: `aktif`

2. **USTAZ MUHAMAD KHAIRUL MUSTAKIM BIN CHE AZIZ**
   - IC: `951220-06-5759` or `951220065759`
   - Password: `Khai951259`
   - Role: `admin`
   - Status: `aktif`

3. **USTAZ MUHAMMAD SYAIFUL IZZHAR BIN ZULKIFLI**
   - IC: `941218-07-5641` or `941218075641`
   - Password: `Izz941241`
   - Role: `admin`
   - Status: `aktif`

## How to Use

### Option 1: Automatic (Recommended)
The admin accounts are automatically created/updated when the backend starts via `ensureAdminAccounts()` function in `backend/server.js`.

### Option 2: Manual Fix
If login still fails, run the fix script manually:

```bash
docker-compose exec backend node backend/scripts/fixAdminAccounts.js
```

This will:
- Check if admin accounts exist
- Verify passwords are correct
- Update passwords, roles, and status if needed
- Create accounts if they don't exist

## Testing Login

1. **Access Frontend**: `http://localhost:3000`
2. **Enter IC Number**: `920312-06-5113` or `920312065113`
3. **Enter Password**: `Amir920313`
4. **Select Role**: Choose from dropdown:
   - IB (Pengesah Pembayaran)
   - Pentadbir (Admin)
   - PIC Masjid
   - Staff / Guru
5. **Click Login**

## Troubleshooting

### If login still fails:

1. **Check Backend Logs**:
   ```bash
   docker-compose logs backend --tail=50
   ```
   Look for "🔐 Checking admin accounts..." messages

2. **Manually Run Fix Script**:
   ```bash
   docker-compose exec backend node backend/scripts/fixAdminAccounts.js
   ```

3. **Verify Database**:
   ```bash
   docker-compose exec -T mysql mysql -umasjid_user -pmasjid_password masjid_app -e "SELECT ic, nama, role, status FROM users WHERE role = 'admin';"
   ```

4. **Check IC Format**:
   - Try with hyphens: `920312-06-5113`
   - Try without hyphens: `920312065113`
   - Both should work

5. **Clear Browser Cache**:
   - Press `Ctrl+Shift+R` for hard refresh
   - Or clear browser cache completely

## Verification

After running the fix script, you should see:
```
✅ Admin accounts verified
✅ All admin accounts fixed!
```

## Notes

- IC numbers can be entered with or without hyphens
- Passwords are case-sensitive
- Admin accounts are automatically maintained on backend startup
- The system normalizes IC numbers for database lookups

---

**Status**: ✅ **FIX APPLIED - Ready for Testing**


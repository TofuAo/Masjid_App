# 🔧 IMMEDIATE FIX FOR LOGIN ERROR

## Quick Fix Steps

### Step 1: Run Admin Account Creation Script

Open PowerShell and run:

```powershell
cd C:\MyMasjidApp
docker-compose exec backend node scripts/fix_admin_accounts.js
```

### Step 2: Verify Admin Account Exists

```powershell
docker-compose exec mysql mysql -umasjid_user -pmasjid_password masjid_app -e "SELECT ic, nama, role, status FROM users WHERE REPLACE(ic, '-', '') = '920312065113';"
```

### Step 3: Restart Backend

```powershell
docker-compose restart backend
```

### Step 4: Test Login

Try logging in with:
- **IC**: `920312065113` or `920312-06-5113`
- **Password**: `Amir920313`
- **Role**: Select "Pentadbir" or "Staff / Guru"

## Alternative: Direct SQL Fix

If the script doesn't work, run this SQL directly:

```powershell
docker-compose exec mysql mysql -umasjid_user -pmasjid_password masjid_app -e "DELETE FROM users WHERE REPLACE(ic, '-', '') = '920312065113'; INSERT INTO users (ic, nama, password, role, status) VALUES ('920312065113', 'USTAZ AMIR HASIF BIN HATA', '\$2a\$12\$0RdYCA0Exxyh4GyVEL1Uyu90H3N69DdqdM1PDj.3JXvGh9CJW9Jpu', 'admin', 'aktif');"
```

## What Was Fixed

1. ✅ Created `backend/utils/ensureAdminAccounts.js` - Auto-creates admin accounts on startup
2. ✅ Updated `backend/server.js` - Calls ensureAdminAccounts on startup
3. ✅ Created `database/create_admin_accounts.sql` - Direct SQL script
4. ✅ Created `backend/scripts/fix_admin_accounts.js` - Node.js script to fix accounts

## Verification

After running the fix, check backend logs:

```powershell
docker-compose logs backend | findstr "admin"
```

You should see:
```
✅ Created admin: USTAZ AMIR HASIF BIN HATA
✅ Admin accounts verified
```

## Still Not Working?

1. Check backend is running: `docker-compose ps`
2. Check backend logs: `docker-compose logs backend --tail 50`
3. Check database connection: `docker-compose exec mysql mysql -umasjid_user -pmasjid_password masjid_app -e "SELECT COUNT(*) FROM users;"`
4. Rebuild backend: `docker-compose build backend && docker-compose up -d backend`


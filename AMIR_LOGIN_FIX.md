# Amir Login Fix - Complete Solution

## Problem
Getting 401 Unauthorized error: "IC Number atau kata laluan salah"

## Solution Applied

### 1. Account Verification
- Checked database for account with IC: `920312065113`
- Verified account exists with correct role and status

### 2. Password Fix
- Ensured password is properly hashed with bcrypt
- Tested password matching
- Fixed password if mismatch detected

### 3. Account Creation/Update
- Created account if it doesn't exist
- Updated account if password/role/status is incorrect
- Set role to `admin` and status to `aktif`

## Login Credentials

- **IC Number**: `920312065113` (or `920312-06-5113` with hyphens)
- **Password**: `Amir920313` (case-sensitive)
- **Role**: Select **"Pentadbir" (Admin)** from dropdown

## Verification Commands

### Check if account exists:
```bash
docker exec masjid_mysql mysql -u masjid_user -pmasjid_password masjid_app -e "SELECT ic, nama, role, status FROM users WHERE REPLACE(REPLACE(ic, '-', ''), ' ', '') = '920312065113';"
```

### Check backend logs:
```bash
docker-compose logs backend --tail 50 | grep -i "login\|920312\|amir"
```

### Run fix script manually:
```bash
docker exec masjid_backend node backend/scripts/fixAmirNow.js
```

## Troubleshooting

If login still fails:

1. **Check backend logs** for detailed error messages
2. **Verify account exists** using the SQL query above
3. **Ensure you're selecting "Pentadbir" (Admin)** role from dropdown
4. **Check password** - must be exactly `Amir920313` (case-sensitive)
5. **Try IC with and without hyphens**: `920312065113` or `920312-06-5113`

## Automatic Fix

The `ensureAdminAccounts()` function runs automatically on backend startup and will:
- Check if Amir's account exists
- Create/update the account with correct credentials
- Set proper password hash
- Verify account is ready

Just restart the backend:
```bash
docker-compose restart backend
```


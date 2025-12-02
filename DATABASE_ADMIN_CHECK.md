# Database Admin Accounts Check

## Admin Accounts in Database

Based on the code in `backend/utils/ensureAdminAccounts.js`, the following admin accounts should exist:

### 1. USTAZ AMIR HASIF BIN HATA
- **IC Number**: `920312065113` (can also be `920312-06-5113`)
- **Password**: `Amir920313`
- **Role**: `admin`
- **Status**: `aktif`

### 2. USTAZ MUHAMAD KHAIRUL MUSTAKIM BIN CHE AZIZ
- **IC Number**: `951220065759` (can also be `951220-06-5759`)
- **Password**: `Khai951259`
- **Role**: `admin`
- **Status**: `aktif`

### 3. USTAZ MUHAMMAD SYAIFUL IZZHAR BIN ZULKIFLI
- **IC Number**: `941218075641` (can also be `941218-07-5641`)
- **Password**: `Izz941241`
- **Role**: `admin`
- **Status**: `aktif`

## How to Check Database

### Quick Check Script
Run this script to see all admin accounts and verify their status:

```bash
docker-compose exec backend node backend/scripts/checkAdminAccounts.js
```

### SQL Queries

**Check all admin accounts:**
```sql
SELECT ic, nama, role, status FROM users WHERE role = 'admin' ORDER BY nama;
```

**Check specific admin by IC:**
```sql
SELECT ic, nama, role, status FROM users WHERE REPLACE(ic, '-', '') = '920312065113';
```

**Check password status (hashed or not):**
```sql
SELECT ic, nama, 
       CASE WHEN password LIKE '$2%' THEN 'HASHED' ELSE 'NOT_HASHED' END as password_status,
       LENGTH(password) as password_length
FROM users WHERE role = 'admin';
```

**Check all three expected admins:**
```sql
SELECT ic, nama, role, status 
FROM users 
WHERE REPLACE(ic, '-', '') IN ('920312065113', '951220065759', '941218075641')
ORDER BY ic;
```

## Running SQL Queries

### Method 1: Direct MySQL Command
```bash
docker-compose exec -T mysql mysql -umasjid_user -pmasjid_password masjid_app -e "SELECT ic, nama, role, status FROM users WHERE role = 'admin';"
```

### Method 2: Interactive MySQL
```bash
docker-compose exec mysql mysql -umasjid_user -pmasjid_password masjid_app
```
Then run SQL queries directly.

## Fix Admin Accounts

If admin accounts are missing or incorrect, run:

```bash
docker-compose exec backend node backend/scripts/fixAdminAccounts.js
```

Or restart the backend (admin accounts are auto-created on startup):

```bash
docker-compose restart backend
```

## Password Information

- **Storage**: Passwords are stored as bcrypt hashes (starting with `$2a$`, `$2b$`, or `$2y$`)
- **Length**: Hashed passwords are approximately 60 characters long
- **Case Sensitive**: Yes, passwords are case-sensitive
- **IC Format**: IC numbers can be entered with or without hyphens (system normalizes them)

## Expected Database State

After running `ensureAdminAccounts()`, you should have:

1. **3 admin accounts** in the `users` table
2. All with `role = 'admin'`
3. All with `status = 'aktif'`
4. All with properly hashed passwords (bcrypt)
5. IC numbers stored without hyphens (normalized format)

## Verification Checklist

- [ ] At least 3 admin accounts exist
- [ ] All admin accounts have `role = 'admin'`
- [ ] All admin accounts have `status = 'aktif'`
- [ ] All passwords are hashed (start with `$2`)
- [ ] IC numbers match expected values
- [ ] Names match expected values

## Troubleshooting

### No Admin Accounts Found
Run the fix script:
```bash
docker-compose exec backend node backend/scripts/fixAdminAccounts.js
```

### Wrong Password
The fix script will update passwords automatically. Or manually:
```bash
docker-compose restart backend
```

### Wrong Role or Status
The fix script will correct roles and status automatically.

---

**Last Updated**: Based on `backend/utils/ensureAdminAccounts.js`


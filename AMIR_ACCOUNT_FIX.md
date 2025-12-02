# Amir Account Fix

## Account Details
- **IC**: `920312065113`
- **Name**: `USTAZ AMIR HASIF BIN HATA`
- **Password**: `Amir920313`
- **Role**: `admin`
- **Status**: `aktif`

## How to Verify

### 1. Check if account exists:
```sql
SELECT ic, nama, role, status 
FROM users 
WHERE REPLACE(REPLACE(ic, '-', ''), ' ', '') = '920312065113';
```

### 2. Manual Fix (if needed):
```sql
-- Update existing account
UPDATE users 
SET nama = 'USTAZ AMIR HASIF BIN HATA',
    role = 'admin',
    status = 'aktif',
    updated_at = NOW()
WHERE REPLACE(REPLACE(ic, '-', ''), ' ', '') = '920312065113';

-- Or create new account (password will be set by ensureAdminAccounts on next restart)
INSERT INTO users (ic, nama, password, role, status, created_at, updated_at) 
VALUES ('920312065113', 'USTAZ AMIR HASIF BIN HATA', '$2a$12$TEMP', 'admin', 'aktif', NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  nama = 'USTAZ AMIR HASIF BIN HATA',
  role = 'admin',
  status = 'aktif',
  updated_at = NOW();
```

### 3. Restart Backend
The `ensureAdminAccounts()` function runs on backend startup and will:
- Check if Amir's account exists
- Verify the password is correct
- Update the account if needed
- Create the account if it doesn't exist

## Login Credentials
- **IC Number**: `920312065113` (or `920312-06-5113` with hyphens)
- **Password**: `Amir920313`
- **Role**: Select "Pentadbir" (Admin) from dropdown

## Troubleshooting

If login still fails:
1. Check backend logs: `docker-compose logs backend | Select-String "Amir"`
2. Verify account exists: Run the SQL query above
3. Check password hash: The password should be hashed with bcrypt
4. Restart backend: `docker-compose restart backend`


# Admin Accounts Database Information

## Expected Admin Accounts

### 1. USTAZ AMIR HASIF BIN HATA
- **IC Number**: `920312-06-5113` or `920312065113`
- **Password**: `Amir920313`
- **Role**: `admin`
- **Status**: `aktif`

### 2. USTAZ MUHAMAD KHAIRUL MUSTAKIM BIN CHE AZIZ
- **IC Number**: `951220-06-5759` or `951220065759`
- **Password**: `Khai951259`
- **Role**: `admin`
- **Status**: `aktif`

### 3. USTAZ MUHAMMAD SYAIFUL IZZHAR BIN ZULKIFLI
- **IC Number**: `941218-07-5641` or `941218075641`
- **Password**: `Izz941241`
- **Role**: `admin`
- **Status**: `aktif`

## How to Check Database

### Method 1: Using Check Script (Recommended)
```bash
docker-compose exec backend node backend/scripts/checkAdminAccounts.js
```

This script will:
- List all admin accounts in the database
- Show IC numbers, names, roles, and status
- Verify passwords are hashed
- Test password matching
- Check if all expected admins are present

### Method 2: Direct SQL Query
```bash
docker-compose exec -T mysql mysql -umasjid_user -pmasjid_password masjid_app -e "SELECT ic, nama, role, status FROM users WHERE role = 'admin' ORDER BY nama;"
```

### Method 3: Check Specific Admin
```bash
docker-compose exec -T mysql mysql -umasjid_user -pmasjid_password masjid_app -e "SELECT ic, nama, role, status FROM users WHERE REPLACE(ic, '-', '') = '920312065113';"
```

## Password Information

- All passwords are stored as **bcrypt hashes** (starting with `$2a$`, `$2b$`, or `$2y$`)
- Password length should be approximately **60 characters** when hashed
- Passwords are **case-sensitive**
- IC numbers can be entered **with or without hyphens**

## Fixing Admin Accounts

If admin accounts are missing or passwords are incorrect, run:

```bash
docker-compose exec backend node backend/scripts/fixAdminAccounts.js
```

This will:
- Create missing admin accounts
- Update incorrect passwords
- Set correct roles and status
- Verify all accounts are correct

## Login Credentials Summary

| Name | IC (with hyphens) | IC (without hyphens) | Password |
|------|-------------------|----------------------|----------|
| USTAZ AMIR HASIF BIN HATA | 920312-06-5113 | 920312065113 | Amir920313 |
| USTAZ MUHAMAD KHAIRUL MUSTAKIM BIN CHE AZIZ | 951220-06-5759 | 951220065759 | Khai951259 |
| USTAZ MUHAMMAD SYAIFUL IZZHAR BIN ZULKIFLI | 941218-07-5641 | 941218075641 | Izz941241 |

## Notes

- Admin accounts are automatically created/updated on backend startup
- The `ensureAdminAccounts()` function runs in `backend/server.js`
- IC numbers are normalized (hyphens removed) for database lookups
- All admin accounts should have `role = 'admin'` and `status = 'aktif'`


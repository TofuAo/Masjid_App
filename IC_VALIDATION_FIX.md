# IC Validation Fix - Strict Format Enforcement

## Summary
Updated the system to **strictly enforce** the IC format `XXXXXX-XX-XXXX` (12 digits with hyphens) and reject all invalid formats, especially T0-prefixed ICs.

## Changes Made

### 1. Updated Validation Functions

#### Backend (`backend/utils/icNormalizer.js`)
- **`isValidICFormat()`**: Now explicitly rejects ICs starting with non-digits (like T0-prefixed)
- **`normalizeIC()`**: Returns `null` for invalid ICs instead of returning the original invalid value

#### Frontend (`src/utils/icUtils.js`)
- **`isValidIC()`**: Now explicitly rejects ICs starting with non-digits

### 2. Updated API Validation

#### `backend/routes/auth.js`
- Registration validation now explicitly rejects T0-prefixed ICs
- Clear error message: "Invalid IC format. IC must be 12 digits (format: XXXXXX-XX-XXXX)"

### 3. Cleanup Scripts

#### SQL Scripts
- **`database/remove_all_t0_ics.sql`**: Comprehensive cleanup script
- **`database/remove_invalid_ics_simple.sql`**: Simplified version

Both scripts remove:
- T0-prefixed ICs (e.g., T0139000168, T0199884408, T0199750534, etc.)
- ICs starting with any non-digit character
- ICs that don't match the XXXXXX-XX-XXXX format

#### JavaScript Script
- **`backend/scripts/remove_invalid_t0_ics.js`**: Automated cleanup script with detailed logging

### 4. Helper Scripts
- **`remove_t0_ics.bat`**: Windows batch script to run cleanup
- **`remove_t0_ics.sh`**: Linux/Mac shell script to run cleanup

## How to Run Cleanup

### Option 1: SQL Script (Recommended)
```bash
# Via Docker
docker-compose exec mysql mysql -u masjid_user -pmasjid_password masjid_app < database/remove_invalid_ics_simple.sql

# Or directly in MySQL client
mysql -u masjid_user -p masjid_app < database/remove_invalid_ics_simple.sql
```

### Option 2: JavaScript Script
```bash
cd backend
node scripts/remove_invalid_t0_ics.js
```

### Option 3: Helper Scripts
```bash
# Windows
remove_t0_ics.bat

# Linux/Mac
chmod +x remove_t0_ics.sh
./remove_t0_ics.sh
```

## Invalid ICs That Will Be Removed

The following types of ICs will be removed:
- ✅ T0-prefixed: `T0139000168`, `T0199884408`, `T0199750534`, `T0197278384`, `T0192902007`
- ✅ Starting with any letter: `A123456789012`, `X123456789012`
- ✅ Wrong format: Any IC that doesn't match `XXXXXX-XX-XXXX` or 12 digits

## Valid IC Format

**ONLY** the following format is accepted:
- `XXXXXX-XX-XXXX` (with hyphens): `691222-06-5287`
- `XXXXXXXXXXXX` (12 digits without hyphens): `691222065287`

Both will be normalized to: `691222-06-5287`

## Prevention

The updated validation will now:
1. **Reject** any IC starting with non-digits during registration
2. **Reject** any IC that doesn't match the 12-digit format
3. **Normalize** valid ICs to the standard format `XXXXXX-XX-XXXX`

## Verification

After running the cleanup, verify with:
```sql
SELECT ic, nama, role FROM users 
WHERE ic LIKE 'T0%' 
   OR ic REGEXP '^[^0-9]'
   OR (ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' AND LENGTH(REPLACE(ic, '-', '')) != 12);
```

This query should return **0 rows** after cleanup.

## Notes

- The cleanup scripts handle foreign key constraints properly
- Classes with invalid `guru_ic` will have the field set to `NULL` (not deleted)
- All related records in child tables are cleaned up automatically


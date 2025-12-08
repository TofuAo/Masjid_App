# Instructions for Updating Staff IC Numbers

## Overview
This script updates IC numbers for staff members based on the correct data from the official staff list.

## How to Run

### Option 1: Run directly (if database is accessible)
```bash
cd backend
node scripts/update_staff_ic_numbers.js
```

### Option 2: Run via Docker
```bash
docker-compose exec backend node scripts/update_staff_ic_numbers.js
```

## What the Script Does

1. **Searches for users** by name in the database
2. **Compares current IC** with the correct IC from the staff list
3. **Updates IC numbers** if they don't match
4. **Updates related tables** that reference the user's IC:
   - students
   - teachers
   - user_roles
   - attendance
   - results
   - fees
   - payments
   - classes (guru_ic)

## Staff Members to Update

The script will process these 10 staff members:

1. TUAN HAJI MOHD RIZZAL BIN MOHD ALI NAFIAH → 731014-06-5251
2. MUHAMMAD 'IZZAN BIN IDRIS → 950717-06-5661
3. ZANAL ABIDIN BIN ISMAIL → 660322-06-5653
4. MOHD NOOR BIN DIN → 710515-06-5193
5. KHAIRUL AZZURA BINTI ISMAIL → 701108-06-5175
6. SYAHIRAH AISYAH BINTI SUFIAN → 740101-06-5000
7. MUHAMMAD IHSAN BIN MHD ZAHARI → 720323-06-5059
8. PUTRI ANATI BINTI AZAHAR → 930929-06-5390
9. NURUL SYAZWANI AISYAH BINTI RUSLI → 911210-06-5097
10. MOHAMAD SADIQ UMAIR BIN NAHAR → 900102-06-6005

## Output

The script will show:
- ✅ **Updated**: Users whose IC was successfully updated
- ❌ **Not Found**: Users not found in the database
- ⚠️ **Skipped**: Users that were skipped (already correct, multiple matches, etc.)
- ❌ **Errors**: Any errors encountered during the update

## Safety Features

- **Transaction-based**: All updates are done in a transaction (rolls back on error)
- **Duplicate check**: Checks if new IC already exists before updating
- **Validation**: Only updates if current IC doesn't match correct IC
- **Related data**: Automatically updates all related tables

## Notes

- The script uses fuzzy name matching to find users
- IC numbers are normalized (hyphens removed) for comparison
- The script will skip users if their IC is already correct
- If multiple users match a name, the script will skip to avoid errors


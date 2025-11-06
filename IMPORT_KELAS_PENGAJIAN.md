# 📚 Import Kelas Pengajian 2025 Data

This guide explains how to import the Kelas Pengajian 2025 data into your existing masjid_app database.

## 📋 Overview

The migration script will:
1. ✅ Create teacher user accounts (if they don't exist)
2. ✅ Create teacher profiles
3. ✅ Create all classes with proper mapping

## 🔧 Data Mapping

The provided data is mapped to the existing schema as follows:

| Source Data | Database Field | Description |
|------------|---------------|-------------|
| `peringkat` | `level` | Class level (ASAS, PERTENGAHAN, etc.) |
| `tenaga_pengajar` | `nama` (in users table) | Teacher name |
| `no_telefon` | `telefon` (in users table) | Teacher phone |
| `jadual_hari + jadual_waktu` | `jadual` | Full schedule string |
| `jadual_hari` | `sessions` (JSON) | Array of session days |
| `lokasi_kod + lokasi_nama` | `nama_kelas` | Class name with location |
| `bil_pelajar` | `kapasiti` | Class capacity (set to 20, can be updated) |

## 🚀 How to Run

### Method 1: Using Node.js Script (Recommended)

```bash
cd C:\MyMasjidApp\backend
node scripts/insert_kelas_pengajian_2025.js
```

This script will:
- Read the SQL file
- Execute each statement
- Handle duplicate entries gracefully
- Show progress and summary

### Method 2: Direct SQL Execution

If you have MySQL command line access:

```bash
mysql -u root -p masjid_app < database/migration_insert_kelas_pengajian_2025.sql
```

Or using MySQL Workbench:
1. Open MySQL Workbench
2. Connect to your database
3. Open `database/migration_insert_kelas_pengajian_2025.sql`
4. Execute the script

### Method 3: Using Docker (if MySQL is in Docker)

```bash
docker-compose exec mysql mysql -u root -p masjid_app < database/migration_insert_kelas_pengajian_2025.sql
```

## 📊 What Gets Created

### Teachers (Users)
- **32 unique teachers** will be created
- IC format: `T[phone_number]` (e.g., `T0139000168`)
- Role: `teacher`
- Status: `aktif`

### Classes
- **47 classes** will be created
- Organized by level:
  - ASAS: 5 classes
  - TAHSIN ASAS: 2 classes
  - PERTENGAHAN: 5 classes
  - LANJUTAN: 3 classes
  - TAHSIN LANJUTAN: 1 class
  - TALAQQI: 31 classes

### Default Values
- **Yuran**: RM 150.00 (default)
- **Kapasiti**: 20 students (default)
- **Status**: `aktif`

## ⚠️ Important Notes

1. **Teacher ICs**: The script uses a placeholder format (`T[phone]`) for teacher ICs. In production, you should:
   - Update teacher ICs with actual IC numbers
   - Or keep the placeholder format if acceptable

2. **Duplicate Handling**: 
   - If a teacher already exists (by IC), their info will be updated
   - If a class with the same name/schedule exists, it may create duplicates

3. **Capacity**: All classes are set to capacity 20. You can update this based on `bil_pelajar` from the original data:
   ```sql
   UPDATE classes SET kapasiti = [bil_pelajar] WHERE nama_kelas = '[class_name]';
   ```

4. **Location Info**: Location codes and names are included in the class name. If you want separate location fields, you'll need to:
   - Add a `lokasi` column to the classes table
   - Update the migration script

## 🔍 Verification

After running the migration, verify the data:

```sql
-- Check teacher count
SELECT COUNT(*) as teacher_count FROM users WHERE role = 'teacher';

-- Check class count
SELECT COUNT(*) as class_count FROM classes;

-- Check classes by level
SELECT level, COUNT(*) as count FROM classes GROUP BY level;

-- Check teachers and their classes
SELECT u.nama, COUNT(c.id) as class_count 
FROM users u 
LEFT JOIN classes c ON u.ic = c.guru_ic 
WHERE u.role = 'teacher' 
GROUP BY u.ic, u.nama;
```

## 🐛 Troubleshooting

### Error: Duplicate entry
- **Cause**: Teacher or class already exists
- **Solution**: The script handles this gracefully with `ON DUPLICATE KEY UPDATE`

### Error: Foreign key constraint
- **Cause**: Referenced teacher doesn't exist
- **Solution**: Make sure teachers are inserted before classes (the script does this)

### Error: Database connection
- **Cause**: Wrong database credentials or database doesn't exist
- **Solution**: Check your `.env` file or database configuration

## 📝 Next Steps

After importing:
1. ✅ Review the imported data
2. ✅ Update teacher ICs with real IC numbers (if needed)
3. ✅ Adjust class capacities based on actual student numbers
4. ✅ Update yuran (fees) if different from default
5. ✅ Assign students to classes

## 📞 Support

If you encounter issues:
1. Check the console output for error messages
2. Verify database connection settings
3. Ensure all required tables exist (users, teachers, classes)
4. Check MySQL error logs


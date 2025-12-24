# Student Cleanup Script for Demo/Testing

## Overview

This script (`cleanupStudentsForDemo.js`) is designed to clean up the student database for demo or testing purposes. It keeps only **40 students** distributed across **2 classes** while preserving **all class data**.

## What It Does

1. **Keeps 40 students** - Selects 40 students to keep in the database
2. **Distributes across 2 classes** - Evenly distributes students across the first 2 classes (20 per class)
3. **Preserves all classes** - All class records remain intact
4. **Deletes related data** - Removes attendance, results, and fees for deleted students
5. **Cleans up users** - Removes user records for deleted students

## Important Notes

⚠️ **WARNING**: This script **permanently deletes** student data. Make sure to:
- Backup your database before running this script
- Test on a development/staging environment first
- Only run this when you're ready to clean up the database

## Prerequisites

- Node.js installed
- Database connection configured in `.env`
- Access to the `masjid_app` database

## Usage

### Option 1: Run from project root

```bash
node backend/scripts/cleanupStudentsForDemo.js
```

### Option 2: Run from backend directory

```bash
cd backend
node scripts/cleanupStudentsForDemo.js
```

### Option 3: Run via Docker

```bash
docker-compose exec backend node scripts/cleanupStudentsForDemo.js
```

## Configuration

You can modify these constants at the top of the script:

```javascript
const STUDENTS_TO_KEEP = 40;      // Number of students to keep
const CLASSES_TO_USE = 2;         // Number of classes to use
```

## What Gets Deleted

- Students not in the keep list
- Attendance records for deleted students
- Results/exam records for deleted students
- Fee records for deleted students
- User accounts for deleted students

## What Gets Preserved

- ✅ All classes (all class records remain)
- ✅ All teachers
- ✅ All admins
- ✅ Selected 40 students
- ✅ System settings

## Output

The script provides detailed console output showing:
- Classes being used
- Student distribution
- Number of records deleted
- Final student count per class

## Example Output

```
🔄 Starting student cleanup for demo...
✅ Found 2 class(es) to use:
   1. Kelas Al-Quran Asas (ID: 1, Level: Asas)
   2. Kelas Tajwid (ID: 2, Level: Pertengahan)

📊 Found 45 students total (40 in selected classes)

📋 Student distribution:
   Kelas Al-Quran Asas: 20 students
   Kelas Tajwid: 20 students

🔄 Updating student class assignments...
   ✅ Updated 40 student class assignments

🗑️  Deleting related data...
   ✅ Deleted 150 attendance records
   ✅ Deleted 80 result records
   ✅ Deleted 200 fee records
   ✅ Deleted 250 student records
   ✅ Deleted 250 user records

✅ Cleanup complete!
📊 Final student count: 40
📚 All classes preserved: 2 classes

📋 Final student distribution:
   Kelas Al-Quran Asas: 20 students
   Kelas Tajwid: 20 students
```

## Troubleshooting

### Error: "No classes found"
- Ensure you have at least 2 classes in the database
- The script uses the first 2 classes by ID

### Error: "Not enough students"
- The script will use all available students if there are fewer than 40
- Students will be distributed across available classes

### Database Connection Error
- Check your `.env` file has correct database credentials
- Ensure the database server is running
- Verify network connectivity if using Docker

## Reverting Changes

If you need to restore deleted data:
1. Restore from your database backup
2. Or re-import student data using your seed/migration scripts

## Support

For issues or questions, check:
- Database logs: `docker-compose logs mysql`
- Backend logs: `docker-compose logs backend`


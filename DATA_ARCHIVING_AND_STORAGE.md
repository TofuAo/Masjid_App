# Data Archiving and Storage System

## Overview

The MyMasjidApp system implements a comprehensive data archiving and storage strategy to preserve historical data while maintaining performance and organization.

## 1. Current Database Structure

### Single Active Database
Currently, the system uses a single active database (`masjid_app`) that stores all data. The system is designed to support yearly databases but currently operates with one database for simplicity.

### Future Yearly Database System (As Designed)

According to the system design, each year would have its own database:

```
masjid_app_2024  (Archived)
masjid_app_2025  (Active)
masjid_app_2026  (Future)
```

**Master Database:** `masjid_master`
- Tracks all active years
- Controls which database is currently in use
- Manages year transitions

## 2. Student Archiving System

### Archived Students Table

The system maintains an `archived_students` table to archive inactive students while preserving their historical data.

**Table Structure:**
- `user_ic` - Student IC number
- `nama` - Student name
- `umur`, `alamat`, `telefon`, `email` - Student details
- `kelas_id` - Last class assignment
- `tarikh_daftar` - Original registration date
- `tarikh_arkib` - Archive timestamp
- `alasan_arkib` - Archive reason
- `archived_by` - Admin IC who performed archiving
- `original_data` - JSON snapshot of complete student record

### Archive Process

1. **Archive Student** (`POST /api/archive/students/:ic`)
   - Moves student from `students` table to `archived_students` table
   - Preserves all student data in JSON format
   - Keeps user account in `users` table for historical reference
   - Removes student from active `students` table

2. **Unarchive Student** (`POST /api/archive/students/:ic/unarchive`)
   - Restores student from `archived_students` back to `students` table
   - Preserves archive record for history

3. **View Archived Students** (`GET /api/archive/students`)
   - Retrieves all archived students with search and pagination
   - Shows original class information

## 3. Yearly Data Archive System

### Automated Yearly Archive

The system can create comprehensive yearly archives of all data:

**Archive Creation** (`POST /api/export/archive-year`)

**Archive Contents:**
1. **Archive Info File** (`archive_info.json`)
   - Archive type, year, date range
   - Creation timestamp
   - Description

2. **CSV Files** - One per table:
   - Filtered by date range (1 year)
   - Includes: fees, attendance, results, exams, payments, etc.
   - Excludes: users, classes, students (carried forward data)

3. **Database Backup**
   - Full SQL dump of filtered data
   - Compressed in ZIP format

**Archive Storage:**
- Local storage: `backups/` directory
- Google Drive: Optional upload to configured folder
- Backup logs: Stored in `backup_logs` table

### Yearly Archive Process

1. **Calculate Date Range**
   - End Date: Current date
   - Start Date: 1 year ago

2. **Filter Data**
   - Include transactional data within date range:
     * Fees and payments
     * Attendance records
     * Exam results
     * Announcements
   - Exclude structural data (carried forward):
     * Users
     * Classes
     * Teachers
     * Students

3. **Create Archive**
   - Generate CSV files for each table
   - Create SQL dump
   - Compress into ZIP file
   - Generate checksum for integrity verification

4. **Store Archive**
   - Save locally in `backups/` directory
   - Optionally upload to Google Drive
   - Log archive details in `backup_logs` table

## 4. Data Storage Strategy

### Active Data (Current Year)
- Stored in main database tables
- Fast access for current operations
- Includes all active users, classes, and transactions

### Archived Data (Past Years)
- **Students**: Stored in `archived_students` table
- **Yearly Archives**: ZIP files with CSV and SQL dumps
- **Backup Logs**: Metadata about all archives created

### Data Retention
- Active students remain in `students` table
- Archived students moved to `archived_students` table
- Historical transactions preserved in yearly archives
- Users table retains all historical user accounts

## 5. Backup and Recovery

### Automated Backups
- Database backups can be scheduled
- Full database dumps created
- Compressed and stored locally or in cloud

### Manual Archives
- Admins can trigger yearly archive creation
- Archives can be downloaded or stored in Google Drive
- Integrity verification via checksums

### Recovery Process
1. Locate archive by year/date
2. Verify archive integrity (checksum)
3. Extract ZIP file
4. Import CSV or SQL data as needed
5. Restore specific records if required

## 6. Implementation Files

### Backend Services
- `backend/services/archiveService.js` - Student archiving
- `backend/services/databaseBackupService.js` - Yearly archive creation
- `backend/scripts/create_archived_students_table.js` - Archive table setup

### Backend Routes
- `backend/routes/archive.js` - Archive endpoints
- `backend/routes/export.js` - Export and archive endpoints

### Database Tables
- `archived_students` - Archived student records
- `backup_logs` - Archive and backup metadata

## 7. Future Enhancements

### Planned Features
1. **Automatic Year Transition**
   - Automated creation of new year database
   - Data migration scripts
   - Archive old year data

2. **Master Database Integration**
   - Track active year
   - Manage database switching
   - Coordinate multi-database operations

3. **Enhanced Archive Queries**
   - Query across multiple year databases
   - Unified reporting across years
   - Historical analytics

## 8. Best Practices

### For Admins
1. **Regular Archives**: Create yearly archives at year-end
2. **Student Archiving**: Archive students who have left/graduated
3. **Backup Verification**: Verify archive integrity after creation
4. **Storage Management**: Monitor backup storage space
5. **Documentation**: Keep track of archive locations and dates

### For Developers
1. **Date Filtering**: Always filter transactional data by date when archiving
2. **Data Integrity**: Preserve relationships when archiving
3. **Recovery Testing**: Periodically test archive recovery
4. **Performance**: Consider indexing archived data for queries
5. **Privacy**: Ensure archived data is properly secured

## 9. API Endpoints Summary

### Archive Endpoints
- `GET /api/archive/students` - List archived students
- `POST /api/archive/students/:ic` - Archive a student
- `POST /api/archive/students/:ic/unarchive` - Restore a student

### Export/Archive Endpoints
- `POST /api/export/archive-year` - Create yearly archive
- `GET /api/export/download/:fileName` - Download archive file
- `GET /api/export/backup-logs` - View backup history

## 10. Current Status

**Active System:**
- ✅ Student archiving (working)
- ✅ Yearly archive creation (working)
- ✅ Backup logging (working)
- ✅ Google Drive integration (optional)

**Planned System:**
- ⏳ Multi-database yearly system (designed, not implemented)
- ⏳ Master database coordination (designed, not implemented)
- ⏳ Automated year transition (designed, not implemented)

---

**Last Updated:** 2025-12-09
**System Version:** Current Production


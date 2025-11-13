# MyMasjidApp - Complete Module Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Backend Modules](#backend-modules)
3. [Frontend Modules](#frontend-modules)
4. [Database Structure](#database-structure)
5. [Suggested Additional Modules](#suggested-additional-modules)

---

## System Overview

**MyMasjidApp** is a comprehensive full-stack masjid/madrasah management system built with:
- **Frontend**: React 19, Vite, TailwindCSS, React Router
- **Backend**: Node.js, Express.js, MySQL 8.0
- **Authentication**: JWT with role-based access control
- **Deployment**: Docker, Docker Compose, Nginx

### Key Features
- Student Management
- Teacher Management
- Class Management
- Attendance Tracking
- Exam & Results Management
- Fee Management
- Announcements System
- Staff Check-In/Out
- User Registration & Approval
- PIC (Person In Charge) Management
- Admin Action Tracking
- Database Backup & Export
- Google Forms Integration

---

## Backend Modules

### 1. Controllers (`backend/controllers/`)

#### 1.1 Authentication Controller (`authController.js`)
**Purpose**: Handles user authentication, registration, password management, and profile operations.

**Key Functions**:
- `register()` - Register new users (students) with pending status
- `selfRegister()` - Self-registration for existing users
- `login()` - User authentication with JWT token generation
- `getProfile()` - Get user profile information
- `updateProfile()` - Update user profile
- `checkProfileComplete()` - Check if user profile is complete
- `changePassword()` - Change user password
- `adminChangePassword()` - Admin password change
- `forgotPassword()` - Initiate password reset
- `resetPassword()` - Reset password with token
- `getPendingRegistrations()` - Get pending user registrations (admin/teacher)
- `approveRegistration()` - Approve pending registration
- `rejectRegistration()` - Reject pending registration
- `getPreferences()` - Get user preferences
- `updatePreferences()` - Update user preferences

**Dependencies**: bcryptjs, jsonwebtoken, nodemailer, express-validator

---

#### 1.2 Student Controller (`studentController.js`)
**Purpose**: Manages student CRUD operations and statistics.

**Key Functions**:
- `getAllStudents()` - Get all students with filtering and pagination
- `getStudentById()` - Get student by ID
- `createStudent()` - Create new student
- `updateStudent()` - Update student information
- `deleteStudent()` - Delete student
- `getStudentStats()` - Get student statistics
- `importStudents()` - Import students from CSV/Excel

**Features**:
- Supports filtering by class, status, search term
- Pagination support
- Bulk import from Excel/CSV
- Student statistics aggregation

---

#### 1.3 Teacher Controller (`teacherController.js`)
**Purpose**: Manages teacher CRUD operations and statistics.

**Key Functions**:
- `getAllTeachers()` - Get all teachers
- `getTeacherById()` - Get teacher by ID
- `createTeacher()` - Create new teacher
- `updateTeacher()` - Update teacher information
- `deleteTeacher()` - Delete teacher
- `getTeacherStats()` - Get teacher statistics

**Features**:
- Teacher expertise management (JSON field)
- Class assignment tracking
- Statistics aggregation

---

#### 1.4 Class Controller (`classController.js`)
**Purpose**: Manages class CRUD operations and scheduling.

**Key Functions**:
- `getAllClasses()` - Get all classes
- `getClassById()` - Get class by ID
- `createClass()` - Create new class
- `updateClass()` - Update class information
- `deleteClass()` - Delete class
- `getClassStats()` - Get class statistics

**Features**:
- Session scheduling (JSON field)
- Capacity management
- Fee management per class
- Teacher assignment

---

#### 1.5 Attendance Controller (`attendanceController.js`)
**Purpose**: Manages student attendance tracking.

**Key Functions**:
- `getAllAttendance()` - Get all attendance records
- `markAttendance()` - Mark single attendance
- `bulkMarkAttendance()` - Bulk mark attendance
- `getAttendanceStats()` - Get attendance statistics
- `getStudentHistory()` - Get student attendance history

**Features**:
- Status tracking (Hadir, Tidak Hadir, Cuti)
- Notes/remarks support
- Date-based filtering
- Statistics by class/student

---

#### 1.6 Exam Controller (`examController.js`)
**Purpose**: Manages exam creation and scheduling.

**Key Functions**:
- `getAllExams()` - Get all exams
- `getExamById()` - Get exam by ID
- `createExam()` - Create new exam
- `updateExam()` - Update exam information
- `deleteExam()` - Delete exam

**Features**:
- Class-based exam organization
- Date scheduling
- Subject management

---

#### 1.7 Result Controller (`resultController.js`)
**Purpose**: Manages exam results and grading.

**Key Functions**:
- `getAllResults()` - Get all results
- `getResultById()` - Get result by ID
- `createResult()` - Create new result
- `updateResult()` - Update result
- `deleteResult()` - Delete result
- `getResultStats()` - Get result statistics
- `getTopPerformers()` - Get top performing students

**Features**:
- Grade calculation (A, B, C, D, E, F)
- Image upload for result slips
- Notes/comments support
- Performance analytics

---

#### 1.8 Fee Controller (`feeController.js`)
**Purpose**: Manages student fee collection and tracking.

**Key Functions**:
- `getAllFees()` - Get all fee records
- `getFeeById()` - Get fee by ID
- `createFee()` - Create new fee record
- `updateFee()` - Update fee record
- `markAsPaid()` - Mark fee as paid
- `deleteFee()` - Delete fee record
- `getFeeStats()` - Get fee statistics

**Features**:
- Payment status tracking (Bayar, Belum Bayar, terbayar, tunggak, pending)
- Receipt image upload
- Payment method tracking
- Monthly/yearly filtering
- Receipt number management

---

#### 1.9 Settings Controller (`settingsController.js`)
**Purpose**: Manages system-wide settings and configurations.

**Key Functions**:
- `getAllSettings()` - Get all settings
- `getSettingByKey()` - Get setting by key
- `updateSetting()` - Update setting
- `getQRCode()` - Get QR code for masjid location
- `getGradeRanges()` - Get grade range settings
- `updateGradeRanges()` - Update grade ranges

**Features**:
- Masjid location (latitude/longitude)
- QR code generation
- Grade range configuration
- System preferences

---

#### 1.10 Announcement Controller (`announcementController.js`)
**Purpose**: Manages system announcements.

**Key Functions**:
- `getAllAnnouncements()` - Get all announcements
- `getAnnouncementById()` - Get announcement by ID
- `createAnnouncement()` - Create new announcement
- `updateAnnouncement()` - Update announcement
- `deleteAnnouncement()` - Delete announcement

**Features**:
- Expiry date management
- Priority levels
- Auto-cleanup of expired announcements

---

#### 1.11 Google Form Controller (`googleFormController.js`)
**Purpose**: Integrates with Google Forms for attendance submission.

**Key Functions**:
- `getClassFormUrl()` - Get Google Form URL for class
- `setClassFormUrl()` - Set Google Form URL for class
- `submitWebhook()` - Handle webhook submissions from Google Forms

**Features**:
- Google Forms integration
- Webhook processing
- Attendance auto-marking from forms

---

#### 1.12 Staff Check-In Controller (`staffCheckInController.js`)
**Purpose**: Manages staff check-in/out tracking with location verification.

**Key Functions**:
- `checkIn()` - Staff check-in
- `checkOut()` - Staff check-out
- `getTodayStatus()` - Get today's check-in status
- `getHistory()` - Get check-in history
- `getStaffList()` - Get list of staff
- `quickCheckIn()` - Quick check-in (public endpoint)
- `quickCheckOut()` - Quick check-out (public endpoint)
- `quickGetLastAction()` - Get last action (public endpoint)

**Features**:
- GPS location verification
- Distance calculation from masjid
- Shift type management (normal/shift)
- Status tracking (checked_in/checked_out)

---

#### 1.13 Export Controller (`exportController.js`)
**Purpose**: Handles database backup and export operations.

**Key Functions**:
- `triggerDatabaseBackup()` - Trigger database backup
- `getHistory()` - Get backup history
- `download()` - Download backup file

**Features**:
- Automated database backups
- Backup history tracking
- File download management

---

#### 1.14 Admin Action Controller (`adminActionController.js`)
**Purpose**: Tracks admin actions for audit and undo functionality.

**Key Functions**:
- `list()` - List admin actions
- `undo()` - Undo an admin action

**Features**:
- Action snapshot system
- Undo functionality
- Audit trail

---

#### 1.15 PIC User Controller (`picUserController.js`)
**Purpose**: Manages PIC (Person In Charge) users.

**Key Functions**:
- `getAll()` - Get all PIC users
- `create()` - Create PIC user
- `update()` - Update PIC user
- `delete()` - Delete PIC user

**Features**:
- PIC role management
- Approval workflow

---

#### 1.16 Pending PIC Change Controller (`pendingPicChangeController.js`)
**Purpose**: Manages pending PIC change requests.

**Key Functions**:
- `list()` - List pending changes
- `getById()` - Get change request by ID
- `approve()` - Approve change request
- `reject()` - Reject change request

**Features**:
- Change request workflow
- Approval system

---

### 2. Routes (`backend/routes/`)

All routes are organized by feature and use the corresponding controllers:

- `auth.js` - Authentication routes (`/api/auth/*`)
- `students.js` - Student routes (`/api/students/*`)
- `teachers.js` - Teacher routes (`/api/teachers/*`)
- `classes.js` - Class routes (`/api/classes/*`)
- `attendance.js` - Attendance routes (`/api/attendance/*`)
- `exams.js` - Exam routes (`/api/exams/*`)
- `fees.js` - Fee routes (`/api/fees/*`)
- `results.js` - Result routes (`/api/results/*`)
- `settings.js` - Settings routes (`/api/settings/*`)
- `announcements.js` - Announcement routes (`/api/announcements/*`)
- `googleForm.js` - Google Form routes (`/api/google-form/*`)
- `staffCheckIn.js` - Staff check-in routes (`/api/staff-checkin/*`)
- `export.js` - Export routes (`/api/export/*`)
- `adminActions.js` - Admin action routes (`/api/admin-actions/*`)
- `pendingPicChanges.js` - Pending PIC change routes (`/api/pending-pic-changes/*`)
- `picUsers.js` - PIC user routes (`/api/pic-users/*`)
- `migration.js` - Migration routes (`/api/migration/*`)
- `index.js` - Main router that combines all routes

---

### 3. Middleware (`backend/middleware/`)

#### 3.1 Authentication Middleware (`auth.js`)
**Purpose**: JWT token verification and user authentication.

**Functions**:
- `authenticateToken()` - Verify JWT token and attach user to request
- `requireRole(roles)` - Role-based access control

**Features**:
- Token validation
- User status verification
- Role-based authorization
- Public endpoint support (masjid location)

---

#### 3.2 Security Middleware (`security.js`)
**Purpose**: Security-related middleware including rate limiting.

**Features**:
- Auth-specific rate limiting
- Login attempt tracking
- Security headers

---

#### 3.3 Security Logger (`securityLogger.js`)
**Purpose**: Logs security events and suspicious activities.

**Functions**:
- `logFailedAuthAttempt()` - Log failed login attempts
- `logUnauthorizedAccess()` - Log unauthorized access attempts
- `logSuspiciousActivity()` - Log suspicious activities

---

#### 3.4 Input Sanitization (`sanitize.js`)
**Purpose**: Sanitizes user input to prevent XSS attacks.

**Function**:
- `sanitizeInput()` - Sanitize request body, query, and params

---

#### 3.5 IC Normalization (`normalizeIC.js`)
**Purpose**: Normalizes IC numbers to consistent format.

**Function**:
- `normalizeIC()` - Normalize IC number format

---

#### 3.6 Phone Normalization (`normalizePhone.js`)
**Purpose**: Normalizes phone numbers to consistent format.

**Function**:
- `normalizePhone()` - Normalize phone number format

---

#### 3.7 PIC Approval (`picApproval.js`)
**Purpose**: Middleware for PIC approval workflow.

**Function**:
- `requirePicApproval()` - Check PIC approval status

---

### 4. Services (`backend/services/`)

#### 4.1 Announcement Service (`announcementService.js`)
**Purpose**: Business logic for announcement management.

**Features**:
- Expiry date handling
- Auto-cleanup logic

---

#### 4.2 Database Backup Service (`databaseBackupService.js`)
**Purpose**: Handles database backup operations.

**Features**:
- MySQL dump generation
- File compression
- Backup storage management

---

#### 4.3 Student Service (`studentService.js`)
**Purpose**: Business logic for student operations.

**Features**:
- Student validation
- Class assignment logic

---

### 5. Utilities (`backend/utils/`)

#### 5.1 Email Service (`emailService.js`)
**Purpose**: Email sending functionality.

**Functions**:
- `sendPasswordResetEmail()` - Send password reset email
- `sendWelcomeEmail()` - Send welcome email

**Features**:
- Nodemailer integration
- HTML email templates
- Gmail SMTP support

---

#### 5.2 IC Formatter (`icFormatter.js`)
**Purpose**: Formats IC numbers for display.

**Functions**:
- `formatICWithHyphen()` - Format IC with hyphens (e.g., 051003-06-0229)

---

#### 5.3 IC Normalizer (`icNormalizer.js`)
**Purpose**: Normalizes IC numbers to database format.

**Functions**:
- `normalizeIC()` - Remove hyphens and normalize

---

#### 5.4 Phone Normalizer (`phoneNormalizer.js`)
**Purpose**: Normalizes phone numbers.

**Functions**:
- `normalizePhone()` - Standardize phone format

---

#### 5.5 Grading Utilities (`grading.js`)
**Purpose**: Grade calculation logic.

**Functions**:
- `calculateGrade()` - Calculate grade from marks
- `getGradeRanges()` - Get grade range configuration

---

#### 5.6 Student Cache (`studentCache.js`)
**Purpose**: Caching for student data.

**Features**:
- Node-cache integration
- Cache invalidation

---

#### 5.7 JSON Parser (`jsonParser.js`)
**Purpose**: Safe JSON parsing utilities.

**Functions**:
- `safeParseJSON()` - Parse JSON safely

---

#### 5.8 Google Drive Client (`googleDriveClient.js`)
**Purpose**: Google Drive API integration.

**Features**:
- Google APIs integration
- File upload/download

---

#### 5.9 Admin Action Snapshots (`adminActionSnapshots.js`)
**Purpose**: Snapshot system for admin actions.

**Features**:
- Action state capture
- Undo functionality

---

#### 5.10 Database Utilities
- `ensureCheckInTable.js` - Ensures staff_checkin table exists
- `ensurePendingStatus.js` - Ensures pending status exists in users table
- `ensurePendingPicTable.js` - Ensures pending_pic_changes table exists
- `ensurePicRole.js` - Ensures PIC role exists in users table

---

### 6. Schedulers (`backend/schedulers/`)

#### 6.1 Annual Backup Job (`annualBackupJob.js`)
**Purpose**: Scheduled annual database backup.

**Features**:
- Cron-based scheduling
- Configurable via environment variables
- Automatic backup generation

---

#### 6.2 Announcement Cleanup Job (`announcementCleanupJob.js`)
**Purpose**: Scheduled cleanup of expired announcements.

**Features**:
- Cron-based scheduling
- Auto-delete expired announcements
- Configurable cleanup schedule

---

### 7. Configuration (`backend/config/`)

#### 7.1 Database Configuration (`database.js`)
**Purpose**: MySQL connection pool configuration.

**Features**:
- Connection pooling
- Environment-based configuration
- Connection testing

---

### 8. Scripts (`backend/scripts/`)

- `migrateDatabase.js` - Database migration runner
- `createNewYearDatabase.js` - Create new year database
- `transferYearData.js` - Transfer data between year databases
- `migrate_settings.js` - Settings migration
- `run_migration.js` - Migration execution script
- `insert_kelas_pengajian_2025.js` - Class data insertion
- `add_timestamp_columns.sql` - SQL migration script

---

## Frontend Modules

### 1. Pages (`src/pages/`)

#### 1.1 Authentication Pages
- `Login.jsx` - User login page
- `Register.jsx` - User registration page
- `ForgotPassword.jsx` - Password reset request page
- `ResetPassword.jsx` - Password reset page
- `CompleteProfile.jsx` - Profile completion page

#### 1.2 Main Application Pages
- `Dashboard.jsx` - Main dashboard with statistics
- `Pelajar.jsx` - Student management page
- `Guru.jsx` - Teacher management page
- `Kelas.jsx` - Class management page
- `Kehadiran.jsx` - Attendance tracking page
- `Yuran.jsx` - Fee management page
- `PayYuran.jsx` - Fee payment page
- `Keputusan.jsx` - Results management page
- `Laporan.jsx` - Reports page

#### 1.3 Administrative Pages
- `Settings.jsx` - System settings page
- `PersonalSettings.jsx` - Personal preferences page
- `Announcements.jsx` - Announcements management page
- `AdminActions.jsx` - Admin action history page
- `PendingRegistrations.jsx` - Pending registration approvals page
- `PicApprovals.jsx` - PIC approval requests page
- `PicUsers.jsx` - PIC user management page

#### 1.4 Staff Pages
- `StaffCheckIn.jsx` - Staff check-in/out page
- `QuickStaffCheckIn.jsx` - Quick check-in page (public)

---

### 2. Components (`src/components/`)

#### 2.1 Authentication Components (`auth/`)
- `Login.jsx` - Login form component
- `Register.jsx` - Registration form component
- `ProtectedRoute.jsx` - Route protection component

#### 2.2 Student Components (`pelajar/`)
- `PelajarList.jsx` - Student list component
- `PelajarForm.jsx` - Student form component
- `PelajarDetail.jsx` - Student detail view
- `PelajarImport.jsx` - Student import component

#### 2.3 Teacher Components (`guru/`)
- `GuruList.jsx` - Teacher list component
- `GuruForm.jsx` - Teacher form component

#### 2.4 Class Components (`kelas/`)
- `KelasList.jsx` - Class list component
- `KelasForm.jsx` - Class form component

#### 2.5 Attendance Components (`kehadiran/`)
- `GoogleFormModal.jsx` - Google Form integration modal

#### 2.6 Results Components (`keputusan/`)
- `ResultFormModal.jsx` - Result form modal
- `GradeSettingsModal.jsx` - Grade settings modal

#### 2.7 Announcement Components (`announcements/`)
- `AnnouncementList.jsx` - Announcement list component
- `AnnouncementForm.jsx` - Announcement form component

#### 2.8 PIC Components (`pic/`)
- `PicUserList.jsx` - PIC user list component
- `PicUserForm.jsx` - PIC user form component

#### 2.9 Dashboard Components (`dashboard/`)
- `QuickStats.jsx` - Quick statistics component
- `RecentActivity.jsx` - Recent activity component
- `StatCard.jsx` - Statistics card component

#### 2.10 UI Components (`ui/`)
- `Button.jsx` - Reusable button component
- `Card.jsx` - Card container component
- `Badge.jsx` - Badge component
- `BackButton.jsx` - Back navigation button
- `ErrorBoundary.jsx` - Error boundary component
- `GoogleMapPicker.jsx` - Google Maps location picker
- `SidebarProvider.jsx` - Sidebar context provider
- `StatCard.jsx` - Statistics card component

#### 2.11 Seasonal Components (`seasonal/`)
- `SeasonalElements.jsx` - Seasonal decorative elements

---

### 3. Contexts (`src/contexts/`)

#### 3.1 Preferences Context (`PreferencesContext.jsx`)
**Purpose**: Manages user preferences (theme, color scheme, language, font).

**Features**:
- Theme management (light/dark/auto)
- Color scheme (spring/summer/fall/winter)
- Language preferences
- Font family and size
- Preview mode
- Persistence to backend and localStorage

**Functions**:
- `usePreferences()` - Hook to access preferences
- `updatePreferences()` - Update and save preferences
- `applyPreferences()` - Apply preview preferences
- `clearPreview()` - Clear preview and revert

---

#### 3.2 Language Context (`LanguageContext.jsx`)
**Purpose**: Manages application language and translations.

**Features**:
- Multi-language support
- Language switching
- Translation management

---

### 4. Hooks (`src/hooks/`)

#### 4.1 useCrud (`useCrud.js`)
**Purpose**: Generic CRUD operations hook.

**Features**:
- Create, Read, Update, Delete operations
- Loading states
- Error handling
- Optimistic updates

---

#### 4.2 usePreferences (`usePreferences.js`)
**Purpose**: Hook for accessing user preferences.

**Features**:
- Preference access
- Update functions
- Preview support

---

#### 4.3 useMasjidLocation (`useMasjidLocation.js`)
**Purpose**: Hook for masjid location management.

**Features**:
- Location fetching
- Distance calculation
- Location updates

---

### 5. Services (`src/services/`)

#### 5.1 API Service (`api.js`)
**Purpose**: Centralized API client with axios.

**Features**:
- Axios instance configuration
- Request/response interceptors
- Token management
- Error handling
- API endpoints for all modules:
  - `authAPI` - Authentication endpoints
  - `studentsAPI` - Student endpoints
  - `teachersAPI` - Teacher endpoints
  - `classesAPI` - Class endpoints
  - `attendanceAPI` - Attendance endpoints
  - `feesAPI` - Fee endpoints
  - `resultsAPI` - Result endpoints
  - `examsAPI` - Exam endpoints
  - `settingsAPI` - Settings endpoints
  - `announcementsAPI` - Announcement endpoints
  - `adminActionsAPI` - Admin action endpoints
  - `picUsersAPI` - PIC user endpoints
  - `pendingPicChangesAPI` - Pending PIC change endpoints
  - `googleFormAPI` - Google Form endpoints
  - `staffCheckInAPI` - Staff check-in endpoints
  - `exportAPI` - Export endpoints

---

### 6. Utils (`src/utils/`)

#### 6.1 API Base URL (`apiBaseUrl.js`)
**Purpose**: Resolves API base URL based on environment.

**Features**:
- Environment detection
- URL resolution

---

#### 6.2 Distance Utils (`distanceUtils.js`)
**Purpose**: Distance calculation utilities.

**Features**:
- Haversine formula for distance calculation
- Distance formatting

---

#### 6.3 Grade Utils (`grades.js`)
**Purpose**: Grade calculation utilities.

**Features**:
- Grade calculation from marks
- Grade range management

---

#### 6.4 IC Utils (`icUtils.js`)
**Purpose**: IC number utilities.

**Features**:
- IC validation
- IC formatting

---

#### 6.5 Phone Utils (`phoneUtils.js`)
**Purpose**: Phone number utilities.

**Features**:
- Phone validation
- Phone formatting

---

### 7. Configuration (`src/config/`)

#### 7.1 Seasonal Schemes (`seasonalSchemes.js`)
**Purpose**: Color scheme configuration for seasons.

**Features**:
- Spring, Summer, Fall, Winter color schemes
- Theme color management

---

### 8. Main Application Files

#### 8.1 App.jsx
**Purpose**: Main application component with routing.

**Features**:
- Route configuration
- Authentication state management
- Profile completion check
- Protected routes

---

#### 8.2 Layout.jsx
**Purpose**: Main layout component with sidebar and header.

**Features**:
- Responsive sidebar
- User menu
- Navigation menu
- Role-based menu items
- Seasonal theming

---

## Database Structure

### Core Tables

#### 1. users
**Primary Key**: `ic` (VARCHAR(20))
**Purpose**: Master table for all users (students, teachers, admins, PIC)

**Columns**:
- `ic` - Identity Card number (PK)
- `nama` - Name
- `umur` - Age
- `alamat` - Address
- `telefon` - Phone
- `email` - Email (UNIQUE)
- `password` - Hashed password
- `role` - ENUM('student','teacher','admin','pic')
- `status` - ENUM('aktif','tidak_aktif','cuti','pending')
- `created_at`, `updated_at` - Timestamps

---

#### 2. students
**Primary Key**: `user_ic` (VARCHAR(20))
**Foreign Keys**: `user_ic` → users(ic), `kelas_id` → classes(id)

**Columns**:
- `user_ic` - Reference to users table (PK)
- `kelas_id` - Reference to classes table
- `tarikh_daftar` - Registration date

---

#### 3. teachers
**Primary Key**: `user_ic` (VARCHAR(20))
**Foreign Keys**: `user_ic` → users(ic)

**Columns**:
- `user_ic` - Reference to users table (PK)
- `kepakaran` - Expertise (JSON array)

---

#### 4. classes
**Primary Key**: `id` (INT AUTO_INCREMENT)
**Foreign Keys**: `guru_ic` → users(ic)

**Columns**:
- `id` - Primary key
- `nama_kelas` - Class name
- `level` - Class level (Asas, Pertengahan, etc.)
- `jadual` - Schedule description
- `sessions` - Session days (JSON array)
- `yuran` - Class fee
- `guru_ic` - Teacher IC
- `kapasiti` - Capacity
- `status` - ENUM('aktif','tidak_aktif','penuh')
- `created_at`, `updated_at` - Timestamps

---

#### 5. attendance
**Primary Key**: `id` (INT AUTO_INCREMENT)
**Foreign Keys**: `student_ic` → users(ic), `class_id` → classes(id)

**Columns**:
- `id` - Primary key
- `student_ic` - Student IC
- `class_id` - Class ID
- `tarikh` - Date
- `status` - ENUM('Hadir','Tidak Hadir','Cuti')
- `catatan` - Notes
- `created_at`, `updated_at` - Timestamps

---

#### 6. exams
**Primary Key**: `id` (INT AUTO_INCREMENT)
**Foreign Keys**: `class_id` → classes(id)

**Columns**:
- `id` - Primary key
- `class_id` - Class ID
- `subject` - Subject name
- `tarikh_exam` - Exam date
- `created_at`, `updated_at` - Timestamps

---

#### 7. results
**Primary Key**: `id` (INT AUTO_INCREMENT)
**Foreign Keys**: `student_ic` → users(ic), `exam_id` → exams(id)

**Columns**:
- `id` - Primary key
- `student_ic` - Student IC
- `exam_id` - Exam ID
- `markah` - Marks
- `gred` - Grade (A, B, C, D, E, F)
- `slip_img` - Result slip image path
- `catatan` - Notes
- `created_at`, `updated_at` - Timestamps

---

#### 8. fees
**Primary Key**: `id` (INT AUTO_INCREMENT)
**Foreign Keys**: `student_ic` → users(ic)

**Columns**:
- `id` - Primary key
- `student_ic` - Student IC
- `jumlah` - Amount
- `status` - ENUM('Bayar','Belum Bayar','terbayar','tunggak','pending')
- `tarikh` - Fee date
- `tarikh_bayar` - Payment date
- `bulan` - Month name
- `tahun` - Year
- `cara_bayar` - Payment method
- `no_resit` - Receipt number
- `resit_img` - Receipt image path
- `created_at`, `updated_at` - Timestamps

---

### Additional Tables

#### 9. settings
**Purpose**: System-wide settings

**Columns**:
- `key` - Setting key (PK)
- `value` - Setting value (JSON/TEXT)
- `description` - Setting description
- `updated_at` - Last update timestamp

---

#### 10. announcements
**Purpose**: System announcements

**Columns**:
- `id` - Primary key
- `title` - Announcement title
- `content` - Announcement content
- `priority` - Priority level
- `expiry_date` - Expiry date
- `created_at`, `updated_at` - Timestamps

---

#### 11. staff_checkin
**Purpose**: Staff check-in/out tracking

**Columns**:
- `id` - Primary key
- `staff_ic` - Staff IC (FK → users(ic))
- `check_in_time` - Check-in timestamp
- `check_out_time` - Check-out timestamp
- `check_in_latitude` - Check-in latitude
- `check_in_longitude` - Check-in longitude
- `check_out_latitude` - Check-out latitude
- `check_out_longitude` - Check-out longitude
- `status` - ENUM('checked_in','checked_out')
- `distance_from_masjid` - Distance in meters
- `shift_type` - ENUM('normal','shift')
- `created_at`, `updated_at` - Timestamps

---

#### 12. admin_action_snapshots
**Purpose**: Admin action tracking for undo functionality

**Columns**:
- `id` - Primary key
- `action_type` - Action type
- `table_name` - Affected table
- `record_id` - Record ID
- `snapshot_data` - JSON snapshot
- `admin_ic` - Admin IC
- `created_at` - Timestamp

---

#### 13. pending_pic_changes
**Purpose**: Pending PIC change requests

**Columns**:
- `id` - Primary key
- `user_ic` - User IC
- `requested_role` - Requested role
- `status` - Request status
- `created_at`, `updated_at` - Timestamps

---

#### 14. password_reset_tokens
**Purpose**: Password reset token management

**Columns**:
- `id` - Primary key
- `user_ic` - User IC
- `token` - Reset token
- `expires_at` - Expiry timestamp
- `used` - Boolean flag
- `created_at` - Timestamp

---

### Database Architecture

**Yearly Database System**:
- Each year uses its own database: `masjid_app_2024`, `masjid_app_2025`, etc.
- Master database: `masjid_master` tracks active years
- Workflow:
  1. Admin creates new year database
  2. Selected data (students, teachers, classes) copied over
  3. Transactional data (fees, attendance, results) reset
  4. New year set as active

---

## Suggested Additional Modules

### 1. **Notification System**
**Purpose**: Real-time notifications for users

**Features**:
- Push notifications
- Email notifications
- In-app notification center
- Notification preferences
- Notification history

**Implementation**:
- Backend: WebSocket server or polling endpoint
- Frontend: Notification component, notification bell
- Database: `notifications` table

---

### 2. **Messaging/Chat Module**
**Purpose**: Communication between users

**Features**:
- Direct messaging
- Group chats (by class)
- File sharing
- Message history
- Read receipts

**Implementation**:
- Backend: WebSocket server, message controller
- Frontend: Chat component, message list
- Database: `messages`, `conversations` tables

---

### 3. **Event Management**
**Purpose**: Manage masjid events and activities

**Features**:
- Event creation and management
- Event registration
- Event calendar
- Event reminders
- Attendance tracking for events

**Implementation**:
- Backend: Event controller, routes
- Frontend: Event pages, calendar component
- Database: `events`, `event_registrations` tables

---

### 4. **Library/Resource Management**
**Purpose**: Manage books, resources, and library

**Features**:
- Book catalog
- Book borrowing/returning
- Resource management
- Digital resources
- Due date tracking

**Implementation**:
- Backend: Library controller, borrowing controller
- Frontend: Library pages, catalog component
- Database: `books`, `borrowings` tables

---

### 5. **Financial Management**
**Purpose**: Comprehensive financial tracking

**Features**:
- Income/expense tracking
- Budget management
- Financial reports
- Receipt management
- Payment gateway integration

**Implementation**:
- Backend: Financial controller, report generator
- Frontend: Financial pages, charts
- Database: `transactions`, `budgets` tables

---

### 6. **Inventory Management**
**Purpose**: Track masjid inventory and assets

**Features**:
- Asset tracking
- Inventory management
- Maintenance scheduling
- Asset assignment
- Depreciation tracking

**Implementation**:
- Backend: Inventory controller, asset controller
- Frontend: Inventory pages, asset list
- Database: `assets`, `inventory_items` tables

---

### 7. **Volunteer Management**
**Purpose**: Manage volunteers and their activities

**Features**:
- Volunteer registration
- Activity assignment
- Hours tracking
- Volunteer recognition
- Skills management

**Implementation**:
- Backend: Volunteer controller, activity controller
- Frontend: Volunteer pages, activity calendar
- Database: `volunteers`, `volunteer_activities` tables

---

### 8. **Document Management**
**Purpose**: Centralized document storage and management

**Features**:
- Document upload/download
- Document categories
- Version control
- Access control
- Document search

**Implementation**:
- Backend: Document controller, file storage
- Frontend: Document pages, file browser
- Database: `documents` table

---

### 9. **Reporting & Analytics**
**Purpose**: Advanced reporting and analytics

**Features**:
- Custom report builder
- Data visualization
- Export to PDF/Excel
- Scheduled reports
- Dashboard widgets

**Implementation**:
- Backend: Report generator, analytics service
- Frontend: Report builder, chart components
- Database: `reports`, `report_templates` tables

---

### 10. **Mobile App API**
**Purpose**: RESTful API for mobile applications

**Features**:
- Mobile-optimized endpoints
- Push notification support
- Offline sync capability
- Mobile authentication
- API versioning

**Implementation**:
- Backend: Mobile API routes, mobile auth
- Documentation: API documentation

---

### 11. **Multi-language Support**
**Purpose**: Full internationalization

**Features**:
- Multiple language support
- Translation management
- RTL support
- Language switching
- Translation files

**Implementation**:
- Backend: Language controller, translation API
- Frontend: i18n library, translation components
- Database: `translations` table

---

### 12. **Backup & Recovery**
**Purpose**: Enhanced backup and recovery system

**Features**:
- Automated backups
- Incremental backups
- Backup scheduling
- Recovery tools
- Backup verification

**Implementation**:
- Backend: Enhanced backup service, recovery tools
- Frontend: Backup management page
- Storage: Cloud storage integration

---

### 13. **Audit Logging**
**Purpose**: Comprehensive audit trail

**Features**:
- All actions logged
- User activity tracking
- System event logging
- Audit report generation
- Log retention policies

**Implementation**:
- Backend: Audit logger middleware, audit service
- Frontend: Audit log viewer
- Database: `audit_logs` table

---

### 14. **Integration Module**
**Purpose**: Third-party integrations

**Features**:
- Payment gateway integration (Stripe, PayPal, etc.)
- SMS gateway integration
- Social media integration
- Calendar integration (Google Calendar)
- Email service integration

**Implementation**:
- Backend: Integration services, webhook handlers
- Frontend: Integration settings
- Configuration: API keys management

---

### 15. **QR Code Management**
**Purpose**: Enhanced QR code functionality

**Features**:
- Multiple QR code types
- QR code generation for various purposes
- QR code scanning
- QR code analytics
- Custom QR codes

**Implementation**:
- Backend: QR code service, generation endpoints
- Frontend: QR code components, scanner
- Library: QR code generation library

---

## Conclusion

This documentation provides a comprehensive overview of all modules in the MyMasjidApp system. The suggested additional modules can enhance the system's functionality and provide a more complete solution for masjid/madrasah management.

For implementation details of specific modules, refer to the source code files mentioned in each section.


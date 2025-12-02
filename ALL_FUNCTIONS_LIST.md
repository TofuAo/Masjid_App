# Complete List of All Website Functions

## 🔐 Authentication Functions

### Frontend (`src/components/auth/Login.jsx`)
- `handleLogin()` - Regular login for admin/staff/teacher
- `handleStudentLogin()` - Student login (IC only, no password)
- `handleQuickCheckIn()` - Quick check-in for staff
- `handleQuickCheckOut()` - Quick check-out for staff
- `getCurrentLocation()` - Get user's GPS location
- `formatDateTime()` - Format date/time display
- `handleRoleSelect()` - Select user role
- `showMessage()` - Display success/error messages

### Backend (`backend/controllers/authController.js`)
- `login()` - Authenticate user and return JWT token
- `studentLogin()` - Authenticate student (IC only)
- `register()` - Register new user
- `registerExistingUser()` - Register existing user with password
- `getProfile()` - Get current user profile
- `updateProfile()` - Update user profile
- `changePassword()` - Change user password
- `adminChangePassword()` - Admin changes another user's password
- `forgotPassword()` - Initiate password reset
- `checkResetOptions()` - Check available reset methods
- `requestPasswordResetEmail()` - Request password reset via email
- `requestPasswordResetPhone()` - Request password reset via SMS
- `resetPassword()` - Reset password with token/code
- `checkProfileComplete()` - Check if profile is complete
- `getPendingRegistrations()` - Get pending user registrations
- `approveRegistration()` - Approve pending registration
- `rejectRegistration()` - Reject pending registration
- `getPreferences()` - Get user preferences
- `updatePreferences()` - Update user preferences

### Backend Utilities (`backend/utils/ensureAdminAccounts.js`)
- `ensureAdminAccounts()` - Create/update admin accounts on startup

### Backend Middleware (`backend/middleware/auth.js`)
- `authenticateToken()` - Verify JWT token and attach user to request
- `optionalAuth()` - Optional authentication (doesn't fail if no token)
- `requireRole()` - Require specific role(s) to access endpoint

## 👥 Student Functions

### Frontend API (`src/services/api.js` - `studentsAPI`)
- `getAll()` - Get all students with pagination/filtering
- `getById()` - Get student by IC
- `create()` - Create new student
- `update()` - Update student
- `delete()` - Delete student
- `getStats()` - Get student statistics
- `importFromCSV()` - Import students from CSV

### Backend Routes (`backend/routes/students.js`)
- `GET /api/students` - List all students
- `GET /api/students/:ic` - Get student by IC
- `POST /api/students` - Create student
- `PUT /api/students/:ic` - Update student
- `DELETE /api/students/:ic` - Delete student
- `GET /api/students/stats` - Get statistics

## 👨‍🏫 Teacher Functions

### Frontend API (`src/services/api.js` - `teachersAPI`)
- `getAll()` - Get all teachers
- `getById()` - Get teacher by IC
- `create()` - Create new teacher
- `register()` - Public teacher registration
- `update()` - Update teacher
- `delete()` - Delete teacher
- `getStats()` - Get teacher statistics

### Backend Routes (`backend/routes/teachers.js`)
- `GET /api/teachers` - List all teachers
- `GET /api/teachers/:ic` - Get teacher by IC
- `POST /api/teachers` - Create teacher (admin only)
- `POST /api/teachers/register` - Public teacher registration
- `PUT /api/teachers/:ic` - Update teacher
- `DELETE /api/teachers/:ic` - Delete teacher
- `GET /api/teachers/stats` - Get statistics

## 📚 Class Functions

### Frontend API (`src/services/api.js` - `classesAPI`)
- `getAll()` - Get all classes
- `getById()` - Get class by ID
- `create()` - Create new class
- `update()` - Update class
- `delete()` - Delete class
- `getStats()` - Get class statistics

### Backend Routes (`backend/routes/classes.js`)
- `GET /api/classes` - List all classes
- `GET /api/classes/:id` - Get class by ID
- `POST /api/classes` - Create class
- `PUT /api/classes/:id` - Update class
- `DELETE /api/classes/:id` - Delete class
- `GET /api/classes/stats` - Get statistics

## ✅ Attendance Functions

### Frontend API (`src/services/api.js` - `attendanceAPI`)
- `getAll()` - Get all attendance records
- `mark()` - Mark single attendance
- `bulkMark()` - Bulk mark attendance
- `bulkMarkWithProof()` - Bulk mark with proof image
- `update()` - Update attendance record
- `delete()` - Delete attendance record
- `getStats()` - Get attendance statistics
- `getStudentHistory()` - Get student attendance history

### Backend Routes (`backend/routes/attendance.js`)
- `GET /api/attendance` - List attendance records
- `POST /api/attendance` - Mark attendance
- `POST /api/attendance/bulk` - Bulk mark attendance
- `POST /api/attendance/bulk-with-proof` - Bulk mark with proof
- `PUT /api/attendance/:id` - Update attendance
- `DELETE /api/attendance/:id` - Delete attendance
- `GET /api/attendance/stats` - Get statistics
- `GET /api/attendance/student/:ic` - Get student history

## 💰 Fee Functions

### Frontend API (`src/services/api.js` - `feesAPI`)
- `getAll()` - Get all fees
- `getById()` - Get fee by ID
- `create()` - Create new fee
- `update()` - Update fee
- `markAsPaid()` - Mark fee as paid
- `delete()` - Delete fee
- `getStats()` - Get fee statistics

### Backend Routes (`backend/routes/fees.js`)
- `GET /api/fees` - List all fees
- `GET /api/fees/:id` - Get fee by ID
- `POST /api/fees` - Create fee
- `PUT /api/fees/:id` - Update fee
- `PUT /api/fees/:id/mark-paid` - Mark as paid
- `DELETE /api/fees/:id` - Delete fee
- `GET /api/fees/stats` - Get statistics

## 📊 Result Functions

### Frontend API (`src/services/api.js` - `resultsAPI`)
- `getAll()` - Get all results
- `getById()` - Get result by ID
- `create()` - Create new result
- `update()` - Update result
- `delete()` - Delete result
- `getStats()` - Get result statistics
- `getTopPerformers()` - Get top performing students

### Backend Routes (`backend/routes/results.js`)
- `GET /api/results` - List all results
- `GET /api/results/:id` - Get result by ID
- `POST /api/results` - Create result
- `PUT /api/results/:id` - Update result
- `DELETE /api/results/:id` - Delete result
- `GET /api/results/stats` - Get statistics
- `GET /api/results/top-performers` - Get top performers

## 📝 Exam Functions

### Frontend API (`src/services/api.js` - `examsAPI`)
- `getAll()` - Get all exams
- `getById()` - Get exam by ID
- `create()` - Create new exam
- `update()` - Update exam
- `delete()` - Delete exam

### Backend Routes (`backend/routes/exams.js`)
- `GET /api/exams` - List all exams
- `GET /api/exams/:id` - Get exam by ID
- `POST /api/exams` - Create exam
- `PUT /api/exams/:id` - Update exam
- `DELETE /api/exams/:id` - Delete exam

## ⚙️ Settings Functions

### Frontend API (`src/services/api.js` - `settingsAPI`)
- `getAll()` - Get all settings
- `getByKey()` - Get setting by key
- `getMasjidLocation()` - Get masjid GPS location
- `getQRCode()` - Get QR code settings
- `getGradeRanges()` - Get grade range settings
- `updateGradeRanges()` - Update grade ranges
- `update()` - Update setting

### Backend Routes (`backend/routes/settings.js`)
- `GET /api/settings` - Get all settings
- `GET /api/settings/masjid-location` - Get masjid location (public)
- `GET /api/settings/qr-code` - Get QR code
- `GET /api/settings/grade-ranges` - Get grade ranges
- `PUT /api/settings/:key` - Update setting
- `PUT /api/settings/grade-ranges` - Update grade ranges

## 📢 Announcement Functions

### Frontend API (`src/services/api.js` - `announcementsAPI`)
- `getAll()` - Get all announcements
- `getById()` - Get announcement by ID
- `create()` - Create announcement
- `update()` - Update announcement
- `delete()` - Delete announcement

### Backend Routes (`backend/routes/announcements.js`)
- `GET /api/announcements` - List announcements
- `GET /api/announcements/:id` - Get announcement
- `POST /api/announcements` - Create announcement
- `PUT /api/announcements/:id` - Update announcement
- `DELETE /api/announcements/:id` - Delete announcement

## 👨‍💼 Admin Functions

### Frontend API (`src/services/api.js` - `adminsAPI`)
- `getAll()` - Get all admins
- `getWithLimit()` - Get admins with limit info
- `getById()` - Get admin by IC
- `create()` - Create admin
- `update()` - Update admin
- `delete()` - Delete admin

### Backend Routes (`backend/routes/admins.js`)
- `GET /api/admins` - List admins
- `GET /api/admins/:ic` - Get admin by IC
- `POST /api/admins` - Create admin
- `PUT /api/admins/:ic` - Update admin
- `DELETE /api/admins/:ic` - Delete admin

## 🕐 Staff Check-In Functions

### Frontend API (`src/services/api.js` - `staffCheckInAPI`)
- `checkIn()` - Check in staff member
- `checkOut()` - Check out staff member
- `getTodayStatus()` - Get today's check-in status
- `getHistory()` - Get check-in history
- `getStaffList()` - Get list of staff
- `quickCheckIn()` - Quick check-in (public)
- `quickCheckOut()` - Quick check-out (public)
- `quickGetLastAction()` - Get last action (public)

### Backend Routes (`backend/routes/staffCheckIn.js`)
- `POST /api/staff-checkin/check-in` - Check in
- `POST /api/staff-checkin/check-out` - Check out
- `GET /api/staff-checkin/today-status` - Today's status
- `GET /api/staff-checkin/history` - History
- `GET /api/staff-checkin/staff` - Staff list
- `POST /api/staff-checkin/quick-check-in` - Quick check-in
- `POST /api/staff-checkin/quick-check-out` - Quick check-out
- `POST /api/staff-checkin/quick-last-action` - Last action

## 📤 Export Functions

### Frontend API (`src/services/api.js` - `exportAPI`)
- `triggerDatabaseBackup()` - Trigger database backup
- `archiveYearData()` - Archive year data
- `getHistory()` - Get export history
- `download()` - Download export file

### Backend Routes (`backend/routes/export.js`)
- `POST /api/export/database` - Backup database
- `POST /api/export/archive-year` - Archive year
- `GET /api/export/history` - Export history
- `GET /api/export/download/:fileName` - Download file

## 💳 Payment Functions

### Frontend API (`src/services/api.js`)
- `paymentMethodSettingsAPI` - Payment method settings
- `paymentGatewaySettingsAPI` - Payment gateway settings

### Backend Routes
- `/api/payments` - Payment processing
- `/api/payment-methods` - Payment method management
- `/api/payment-gateways` - Gateway management
- `/api/toyyibpay` - ToyyibPay integration

## 🔄 Other Functions

### Admin Actions (`adminActionsAPI`)
- `list()` - List admin actions
- `undo()` - Undo admin action

### PIC Users (`picUsersAPI`)
- `getAll()` - Get all PIC users
- `create()` - Create PIC user
- `update()` - Update PIC user
- `delete()` - Delete PIC user

### Pending PIC Changes (`pendingPicChangesAPI`)
- `list()` - List pending changes
- `getById()` - Get pending change
- `approve()` - Approve change
- `reject()` - Reject change

### Google Form (`googleFormAPI`)
- `getClassFormUrl()` - Get form URL for class
- `setClassFormUrl()` - Set form URL
- `submitWebhook()` - Handle form submission

### Contact (`contactAPI`)
- `submit()` - Submit contact form
- `getSubmissions()` - Get submissions

## 🔧 Utility Functions

### Frontend (`src/services/api.js`)
- `setAuthToken()` - Store auth token
- `getAuthToken()` - Get auth token
- `clearAuth()` - Clear auth data
- `isTokenExpired()` - Check if token expired

### Backend (`backend/utils/`)
- `normalizeIC()` - Normalize IC numbers
- `formatIC()` - Format IC with hyphens
- `ensureAdminAccounts()` - Ensure admin accounts exist
- `ensureCheckInTable()` - Ensure check-in table exists
- `ensurePendingStatus()` - Ensure pending status exists
- `ensurePicRole()` - Ensure PIC role exists

## 📊 Database Functions

### Connection (`backend/config/database.js`)
- `testConnection()` - Test database connection
- `pool` - MySQL connection pool

### Queries
- All controllers use the `pool` to execute SQL queries
- Transactions supported for complex operations
- Prepared statements for security

## 🌐 Network Functions

### Frontend (`src/utils/apiBaseUrl.js`)
- `resolveApiBaseUrl()` - Resolve API base URL
  - Checks `VITE_API_BASE_URL` env variable
  - Falls back to `http://localhost:5000/api` for localhost
  - Uses current domain + `/api` for production

### Backend (`backend/server.js`)
- CORS configuration
- Rate limiting
- Security headers (Helmet)
- Static file serving
- Error handling

## 📝 Summary

**Total API Endpoints:** 50+
**Total Frontend Functions:** 100+
**Total Backend Functions:** 150+

All functions are connected through:
1. Frontend React components → API service layer
2. API service layer → Backend routes
3. Backend routes → Controllers
4. Controllers → Database queries
5. Database → MySQL database

All connections are verified and working correctly.


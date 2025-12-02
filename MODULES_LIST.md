# 📚 Complete List of Modules in MyMasjidApp

## 🔐 Authentication & User Management

### Frontend Pages
- **Login** (`/login`) - User login page
- **Student Registration** (`/student-register`) - Public student registration
- **Teacher Registration** (`/teacher-register`) - Public teacher registration
- **Forgot Password** (`/forgot-password`) - Password reset initiation
- **Choose Reset Method** (`/choose-reset-method`) - Select email/phone for reset
- **Reset Password** (`/reset-password`) - Reset password via email link
- **Reset Password Code** (`/reset-password-code`) - Reset password via SMS code
- **Complete Profile** (`/complete-profile`) - Complete user profile setup
- **Personal Settings** (`/personal-settings`) - User personal settings (password, email, phone)

### Backend Controllers
- `authController.js` - Authentication, registration, password reset, profile management

### Backend Routes
- `/api/auth/*` - Authentication endpoints

---

## 👥 User Management

### Frontend Pages
- **Pelajar (Students)** (`/pelajar/*`) - Student management
- **Guru (Teachers)** (`/guru/*`) - Teacher management
- **Pending Registrations** (`/pending-registrations`) - Approve/reject new registrations
- **PIC Users** (`/pic-users`) - PIC (Person in Charge) user management
- **Pic Approvals** (`/pic-approvals`) - Approve PIC change requests

### Backend Controllers
- `studentController.js` - Student CRUD operations
- `teacherController.js` - Teacher CRUD operations
- `adminController.js` - Admin user management
- `picUserController.js` - PIC user management
- `pendingPicChangeController.js` - Handle PIC change requests

### Backend Routes
- `/api/students/*` - Student endpoints
- `/api/teachers/*` - Teacher endpoints
- `/api/admins/*` - Admin endpoints
- `/api/pic-users/*` - PIC user endpoints
- `/api/pending-pic-changes/*` - PIC change request endpoints

---

## 📚 Class Management

### Frontend Pages
- **Kelas (Classes)** (`/kelas/*`) - Class management

### Backend Controllers
- `classController.js` - Class CRUD operations

### Backend Routes
- `/api/classes/*` - Class endpoints

---

## 📅 Attendance Management

### Frontend Pages
- **Kehadiran (Attendance)** (`/kehadiran`) - Attendance tracking

### Backend Controllers
- `attendanceController.js` - Attendance operations

### Backend Routes
- `/api/attendance/*` - Attendance endpoints

---

## 💰 Fee Management

### Frontend Pages
- **Yuran (Fees)** (`/yuran`) - Fee management
- **Pay Yuran** (`/pay-yuran/:id`) - Payment processing

### Backend Controllers
- `feeController.js` - Fee operations

### Backend Routes
- `/api/fees/*` - Fee endpoints

---

## 📊 Results & Exams

### Frontend Pages
- **Keputusan (Results)** (`/keputusan`) - Exam results management

### Backend Controllers
- `resultController.js` - Result operations
- `examController.js` - Exam operations

### Backend Routes
- `/api/results/*` - Result endpoints
- `/api/exams/*` - Exam endpoints

---

## 📋 Reports

### Frontend Pages
- **Laporan (Reports)** (`/laporan`) - System reports

### Backend Controllers
- `exportController.js` - Data export functionality

### Backend Routes
- `/api/export/*` - Export endpoints

---

## 📢 Announcements

### Frontend Pages
- **Announcements** (`/announcements`) - System announcements

### Backend Controllers
- `announcementController.js` - Announcement operations

### Backend Routes
- `/api/announcements/*` - Announcement endpoints

---

## ⏰ Timetable

### Frontend Pages
- **Timetable** (`/timetable`) - Class schedule/timetable

### Backend Controllers
- `timetableController.js` - Timetable operations

### Backend Routes
- `/api/timetable/*` - Timetable endpoints

---

## ⚙️ Settings

### Frontend Pages
- **Settings** (`/settings`) - System settings (admin only)
- **Personal Settings** (`/personal-settings`) - User personal settings

### Backend Controllers
- `settingsController.js` - System settings

### Backend Routes
- `/api/settings/*` - Settings endpoints

---

## 👨‍💼 Staff Management

### Frontend Pages
- **Staff Check-In** (`/staff-checkin`) - Staff check-in/check-out
- **Quick Staff Check-In** (`/quick-checkin`) - Quick check-in (public, no auth)

### Backend Controllers
- `staffCheckInController.js` - Staff check-in operations

### Backend Routes
- `/api/staff-checkin/*` - Staff check-in endpoints

---

## 🔧 Admin Actions

### Frontend Pages
- **Admin Actions** (`/admin-actions`) - Admin action history/logs

### Backend Controllers
- `adminActionController.js` - Admin action tracking

### Backend Routes
- `/api/admin-actions/*` - Admin action endpoints

---

## 📊 Dashboard

### Frontend Pages
- **Dashboard** (`/`) - Main dashboard (role-based)

---

## 🔗 Google Forms Integration

### Backend Controllers
- `googleFormController.js` - Google Forms integration

### Backend Routes
- `/api/google-form/*` - Google Forms endpoints

---

## 📦 Archive

### Backend Routes
- `/api/archive/*` - Archive endpoints

---

## 🔄 Migration

### Backend Routes
- `/api/migration/*` - Migration endpoints

---

## 🎨 UI Components & Utilities

### Frontend Components
- Layout components (Sidebar, Header, Navigation)
- UI components (Card, Button, etc.)
- Seasonal theme components
- Form components

### Utilities
- IC number formatting (`icUtils.js`, `icFormatter.js`)
- Phone number formatting (`phoneUtils.js`, `phoneNormalizer.js`)
- Email service (`emailService.js`)
- SMS service (`smsService.js`)

---

## 📊 Module Summary by Role

### Admin Access
- ✅ Dashboard
- ✅ Pengumuman (Announcements)
- ✅ Check In / Out
- ✅ Kelulusan Pendaftaran (Pending Registrations)
- ✅ Kelulusan PIC (PIC Approvals)
- ✅ Pengguna PIC (PIC Users)
- ✅ Tindakan Admin (Admin Actions)
- ✅ Pelajar (Students)
- ✅ Guru (Teachers)
- ✅ Kelas (Classes)
- ✅ Jadual Waktu (Timetable)
- ✅ Kehadiran (Attendance)
- ✅ Yuran (Fees)
- ✅ Keputusan (Results)
- ✅ Laporan (Reports)
- ✅ Tetapan (Settings)

### PIC (Person in Charge) Access
- ✅ Dashboard
- ✅ Pengumuman (Announcements)
- ✅ Check In / Out
- ✅ Pelajar (Students)
- ✅ Guru (Teachers)
- ✅ Kelas (Classes)
- ✅ Jadual Waktu (Timetable)
- ✅ Kehadiran (Attendance)
- ✅ Yuran (Fees)
- ✅ Keputusan (Results)
- ✅ Laporan (Reports)

### Teacher Access
- ✅ Dashboard
- ✅ Pengumuman (Announcements)
- ✅ Check In / Out
- ✅ Pelajar (Students)
- ✅ Kelas (Classes)
- ✅ Jadual Waktu (Timetable)
- ✅ Kehadiran (Attendance)
- ✅ Keputusan (Results)
- ✅ Tetapan (Personal Settings)

### Student Access
- ✅ Dashboard
- ✅ Pengumuman (Announcements)
- ✅ Jadual Waktu (Timetable)
- ✅ Kehadiran (Attendance)
- ✅ Keputusan (Results)
- ✅ Yuran (Fees)
- ✅ Tetapan (Personal Settings)

---

## 📝 Total Module Count

- **Frontend Pages:** 25+
- **Backend Controllers:** 17
- **Backend Routes:** 17
- **Total Modules:** 40+

---

## 🔄 Public Routes (No Authentication Required)

- `/login` - Login page
- `/student-register` - Student registration
- `/teacher-register` - Teacher registration
- `/forgot-password` - Password reset
- `/choose-reset-method` - Reset method selection
- `/reset-password` - Password reset via email
- `/reset-password-code` - Password reset via SMS
- `/quick-checkin` - Quick staff check-in

---

*Last Updated: Based on current codebase analysis*


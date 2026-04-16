# Roles and Access — MyMasjidApp

Complete reference of all roles and what each can view and access.

---

## Role Overview

| Role | Label | Level | Default Dashboard |
|------|-------|-------|-------------------|
| **ib** | IB (Pengesah Pembayaran) | 1 (highest) | `/ib-dashboard` |
| **admin** | Admin Sistem (Pentadbir) | 2 | `/` |
| **pic** | PIC Masjid | 3 | `/` |
| **staff** | Staff / Guru | 4 | `/` |
| **teacher** | Guru | 5 | `/` |
| **student** | Pelajar | 6 | `/account` |

---

## 1. IB (Pengesah Pembayaran)

**Description:** Highest level. Payment approver with full access to verify payments and control the system.

### Permissions

- Approve all payments
- Full access to all modules (when also admin)
- Control system settings
- View all reports
- Manage users (when also admin)

### Pages & menu access

| Page | Route | Access |
|------|-------|--------|
| IB Account | `/ib-account` | ✓ |
| IB Dashboard | `/ib-dashboard` | ✓ |
| Reports | `/laporan` | ✓ |
| Settings | `/account` | ✓ |
| Dashboard | `/` | ✓ (shared) |
| Weather | `/weather` | ✓ |
| Waktu Solat | `/azan-timer` | ✓ |

### Backend API access

- `GET/POST /api/ib/*` — reports, confirmations, documents
- `POST /api/ib/confirm` — confirm monthly payment (IB only)
- `GET /api/ib/reports`, `report`, `class-documents` — IB, admin
- Document confirmation for fees and attendance

### Notifications

- Monthly reports ready
- Overdue confirmations
- Unverified documents

---

## 2. Admin (Pentadbir)

**Description:** System administrator with full access for masjid management.

### Permissions

- Manage users (Admin, PIC, Staff, Guru, Pelajar)
- Manage classes and schedules
- Manage fees and payments
- Manage exam results
- View and manage reports
- Manage announcements
- System settings
- Approve new registrations
- Manage PIC approvals

### Pages & menu access

| Page | Route | Access |
|------|-------|--------|
| Dashboard | `/` | ✓ |
| Admin Management | `/admins` | ✓ |
| All Users | `/all-users` | ✓ |
| PIC Users | `/pic-users` | ✓ |
| Pending Registrations | `/pending-registrations` | ✓ |
| PIC Approvals | `/pic-approvals` | ✓ |
| Notification Center | `/notifications` | ✓ |
| Pelajar (Students) | `/pelajar` | ✓ |
| Guru (Teachers) | `/guru` | ✓ |
| Kelas (Classes) | `/kelas` | ✓ |
| Change Classes | `/change-classes` | ✓ |
| Staff Check-in | `/staff-checkin` | ✓ |
| Kehadiran (Attendance) | `/kehadiran` | ✓ |
| Yuran (Fees) | `/yuran` | ✓ |
| ToyyibPay Settings | `/toyyibpay-settings` | ✓ |
| Keputusan (Results) | `/keputusan` | ✓ |
| Laporan (Reports) | `/laporan` | ✓ |
| Hierarchy | `/hierarchy` | ✓ |
| Permission Matrix | `/permission-matrix` | ✓ |
| System Health | `/system-health` | ✓ |
| Audit Logs | `/audit-logs` | ✓ |
| Settings | `/settings` | ✓ |
| Weather | `/weather` | ✓ |
| Waktu Solat | `/azan-timer` | ✓ |

### Backend API access

- Users, admins, students, teachers, classes, attendance, fees, results, settings, maintenance, announcements, IB reports, etc.
- All routes that use `requireRole(['admin'])` or `requireRole(['admin', ...])`

### Notifications

- Pending registrations
- Failed payments
- Results ready
- Unverified documents
- PIC approvals

---

## 3. PIC (Person In Charge)

**Description:** Person responsible for daily masjid operations.

### Permissions

- Manage students and teachers
- Manage classes
- Record attendance
- Manage fees
- Manage results
- View reports
- Manage announcements
- Staff check-in/out

### Pages & menu access

| Page | Route | Access |
|------|-------|--------|
| Dashboard | `/` | ✓ |
| Pelajar | `/pelajar` | ✓ |
| Guru | `/guru` | ✓ |
| Kelas | `/kelas` | ✓ |
| Staff Check-in | `/staff-checkin` | ✓ |
| Kehadiran | `/kehadiran` | ✓ |
| Yuran | `/yuran` | ✓ |
| Keputusan | `/keputusan` | ✓ |
| Laporan | `/laporan` | ✓ |
| Hierarchy | `/hierarchy` | ✓ |
| Weather | `/weather` | ✓ |
| Waktu Solat | `/azan-timer` | ✓ |

### Backend API access

- Students, teachers, classes, attendance, fees, results, announcements
- Document confirmation for fees/attendance
- No: Admin management, ToyyibPay settings, system health, audit logs, maintenance

### Notifications

- Pending registrations
- Failed payments
- Results ready
- Unverified documents

---

## 4. Staff

**Description:** Staff/teacher assisting in daily operations.

### Permissions

- View student list
- Record attendance
- Manage assigned classes
- Manage exam results
- View announcements
- Staff check-in/out

### Pages & menu access

Staff has no dedicated menu group in Layout. Access is enforced by backend; pages may be reachable via direct URL or shared routes.

| Page | Route | Access |
|------|-------|--------|
| Dashboard | `/` | ✓ |
| Staff Check-in | `/staff-checkin` | ✓ |
| Pelajar (read-focused) | `/pelajar` | ✓ (backend) |
| Kelas | `/kelas` | ✓ (backend) |
| Kehadiran | `/kehadiran` | ✓ |
| Keputusan | `/keputusan` | ✓ |
| Weather | `/weather` | ✓ |
| Waktu Solat | `/azan-timer` | ✓ |

### Backend API access

- `requireRole(['admin', 'staff', 'teacher', 'pic'])` — attendance
- `requireRole(['admin', 'staff', 'pic'])` — students
- `requireRole(['admin', 'staff'])` — fees, classes, results

---

## 5. Teacher (Guru)

**Description:** Teacher for masjid classes.

### Permissions

- View students in own classes
- Record attendance
- Manage exam results
- View announcements
- Staff check-in/out

### Pages & menu access

| Page | Route | Access |
|------|-------|--------|
| Dashboard | `/` | ✓ |
| Pelajar | `/pelajar` | ✓ |
| Kelas | `/kelas` | ✓ |
| Staff Check-in | `/staff-checkin` | ✓ |
| Kehadiran | `/kehadiran` | ✓ |
| Keputusan | `/keputusan` | ✓ |
| Hierarchy | `/hierarchy` | ✓ |
| Account/Settings | `/account` | ✓ |
| Weather | `/weather` | ✓ |
| Waktu Solat | `/azan-timer` | ✓ |

### Backend API access

- Attendance: `requireRole(['admin', 'staff', 'teacher', 'pic'])`
- `GET /api/attendance/my-classes-today` — teacher only
- Teachers create/update: `requireRole(['admin', 'teacher'])`
- Results: `requireRole(['admin', 'staff'])` (teacher via staff-like logic in UI)

### Notifications

- Results ready

---

## 6. Student (Pelajar)

**Description:** Student enrolled in masjid classes.

### Permissions

- View own profile
- View own attendance
- View own results
- View own fees
- View announcements
- Pay fees

### Pages & menu access

| Page | Route | Access |
|------|-------|--------|
| Account (My Account) | `/account` | ✓ |
| Kehadiran (own) | `/kehadiran` | ✓ |
| Yuran (own) | `/yuran` | ✓ |
| Keputusan (own) | `/keputusan` | ✓ |
| Resit / Ulangan | `/resit` | ✓ |
| Weather | `/weather` | ✓ |
| Waktu Solat | `/azan-timer` | ✓ |

### Backend API access

- `requireRole(['student'])` — fees next-due, resit
- Data limited to own records (student_ic = user.ic)

### Notifications

- Grade updates (own)
- Payment alerts (own)
- Document verification (own)

---

## Backend Role Requirements (Summary)

| Feature | Roles |
|---------|-------|
| Admin management | admin |
| All users | admin |
| Pending registrations | admin |
| Pending PIC approvals | admin |
| Students CRUD | admin, staff, pic |
| Teachers CRUD | admin, teacher |
| Classes CRUD | admin, staff |
| Change class | admin, staff |
| Attendance | admin, staff, teacher, pic |
| Attendance today overview | admin, pic |
| My classes today | teacher |
| Fees create/update | admin, staff |
| Fees delete | admin |
| Fee document confirm | admin, pic, ib |
| Results create/update | admin, staff |
| Results delete | admin |
| Resit (student) | student |
| ToyyibPay settings | admin |
| Announcements | admin, pic |
| IB reports | ib, admin |
| IB confirm | ib |
| Maintenance | admin |
| Settings | admin |
| Grade ranges | admin |

---

## Role Hierarchy (Visual)

```
IB (Pengesah Pembayaran)     — Level 1 — Payment verification, full system when also admin
    ↓
Admin (Pentadbir)            — Level 2 — Full management
    ↓
PIC (Person In Charge)       — Level 3 — Daily operations
    ↓
Staff                        — Level 4 — Support, limited management
    ↓
Teacher (Guru)               — Level 5 — Teaching, own classes
    ↓
Student (Pelajar)             — Level 6 — Own data only
```

---

*Based on `Layout.jsx`, `Hierarchy.jsx`, backend `requireRole` middleware, and `notificationService.js`.*

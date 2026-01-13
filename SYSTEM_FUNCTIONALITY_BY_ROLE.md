# System Functionality by Role - Complete Documentation

**Last Updated:** 2025-01-12  
**System:** MyMasjidApp (e-Quran Management System)

## Table of Contents
1. [System Roles Overview](#system-roles-overview)
2. [Admin Role Functions](#admin-role-functions)
3. [PIC (Person in Charge) Role Functions](#pic-person-in-charge-role-functions)
4. [Teacher Role Functions](#teacher-role-functions)
5. [Student Role Functions](#student-role-functions)
6. [IB (Ibu Bapa/Payment Approver) Role Functions](#ib-ibu-bapapayment-approver-role-functions)
7. [Staff Role Functions](#staff-role-functions)
8. [Public/Unauthenticated Functions](#publicunauthenticated-functions)
9. [Cross-Role Functions](#cross-role-functions)

---

## System Roles Overview

The system supports the following roles:

1. **Admin** - Full system administrator with complete access
2. **PIC (Person in Charge)** - Limited administrator with approval workflow
3. **Teacher** - Teaching staff with class management capabilities
4. **Student** - Student users with limited access to their own data
5. **IB (Ibu Bapa)** - Payment approver role for financial confirmations
6. **Staff** - General staff members (can be assigned teacher role)

**Note:** Users can have multiple roles simultaneously and switch between them.

---

## Admin Role Functions

### User Management
- ✅ **View All Users** (`/all-users`)
  - View all users in the system with role information
  - Filter by role (admin, teacher, student, pic, staff, ib)
  - Search users by name, IC, email
  - Export user data

- ✅ **Admin Management** (`/admins`)
  - Create new admin accounts
  - Update admin information
  - Delete admin accounts (requires master admin)
  - View all admins
  - View admin details by IC

- ✅ **PIC User Management** (`/pic-users`)
  - Create PIC users
  - Update PIC user information
  - Delete PIC users
  - List all PIC users
  - View PIC user details

- ✅ **Pending Registrations** (`/pending-registrations`)
  - View all pending student/teacher registrations
  - Approve registrations
  - Reject registrations
  - View registration details

- ✅ **PIC Approval Management** (`/pic-approvals`)
  - View all pending PIC change requests
  - Approve PIC change requests
  - Reject PIC change requests
  - View change request details

- ✅ **Admin Actions & Recycle Bin** (`/admin-actions`)
  - View all undoable admin actions
  - Undo admin actions (with snapshot support)
  - View action history
  - Debug snapshots (attendance, fees, etc.)

### Student Management
- ✅ **Student CRUD Operations** (`/pelajar`)
  - Create students (direct, no approval needed)
  - Update student information (direct)
  - Delete students (direct)
  - View all students
  - View student details by IC
  - View student statistics
  - Search and filter students

### Teacher Management
- ✅ **Teacher CRUD Operations** (`/guru`)
  - Create teachers
  - Update teacher information
  - Delete teachers
  - View all teachers
  - View teacher details by IC
  - View teacher statistics
  - Convert staff to teacher
  - View unassigned staff/teachers

### Class Management
- ✅ **Class CRUD Operations** (`/kelas`)
  - Create classes (direct, no approval needed)
  - Update class information (direct)
  - Delete classes
  - View all classes
  - View class details by ID
  - View class statistics
  - Assign teachers to classes
  - Set class capacity and schedule

### Attendance Management
- ✅ **Attendance Operations** (`/kehadiran`)
  - Mark attendance (direct, no approval needed)
  - Bulk mark attendance (direct)
  - Bulk mark attendance with proof (direct)
  - Update attendance records (direct)
  - Delete attendance records (direct)
  - View all attendance records
  - View attendance statistics
  - View student attendance history
  - Confirm attendance documents (with IB)

### Fee Management
- ✅ **Fee Operations** (`/yuran`)
  - Create fees (direct, no approval needed)
  - Update fees (direct)
  - Delete fees (direct)
  - Mark fees as paid (direct)
  - View all fees
  - View fee statistics
  - Generate monthly fees for all students
  - Sync current month fees
  - Confirm fee documents (with IB)
  - View fee details by ID

### Exam & Results Management
- ✅ **Exam Operations** (`/exams`)
  - Create exams
  - Update exams
  - Delete exams
  - View all exams
  - View exam details by ID

- ✅ **Results Operations** (`/keputusan`)
  - Create results (direct, no approval needed)
  - Update results (direct)
  - Delete results (direct)
  - View all results
  - View result statistics
  - View top performers
  - View result details by ID

### Financial Management
- ✅ **Payment Processing** (`/payments`)
  - View all payments
  - View payment history
  - Process payments
  - Approve payments by date
  - View payment statistics
  - Reconcile payments
  - View payment details

- ✅ **Payment Gateway Settings** (`/toyyibpay-settings`)
  - Configure ToyyibPay gateway
  - View active payment gateway
  - Update payment gateway settings
  - Test payment gateway

- ✅ **Receipt Management** (`/receipts`)
  - Generate receipts
  - View receipts by number
  - View fee receipts
  - View payment receipts
  - View user receipts

### Reports & Analytics
- ✅ **Reports** (`/laporan`)
  - Generate various reports
  - View attendance reports
  - View fee reports
  - View student reports
  - View class reports
  - Export reports

- ✅ **Dashboard** (`/`)
  - View system-wide statistics
  - View class statistics
  - View student statistics
  - View teacher statistics
  - View attendance statistics
  - View fee statistics

### System Configuration
- ✅ **System Settings** (`/settings`)
  - Update system settings
  - Configure masjid location (public endpoint)
  - Set grade ranges
  - Configure QR code settings
  - View all settings

- ✅ **System Hierarchy** (`/hierarchy`)
  - View organization hierarchy
  - Manage hierarchy structure

- ✅ **Permission Matrix** (`/permission-matrix`)
  - View role permissions
  - Understand access control

- ✅ **System Health** (`/system-health`)
  - View system status
  - Monitor system health
  - View database status

- ✅ **Audit Logs** (`/audit-logs`)
  - View all audit logs
  - Track system changes
  - Monitor user activities

- ✅ **Maintenance Control** (`/maintenance`)
  - Enable/disable maintenance mode
  - View maintenance status
  - Configure maintenance settings

### Communication
- ✅ **Announcements** (`/announcements`)
  - Create announcements (direct, no approval needed)
  - Update announcements (direct)
  - Delete announcements (direct)
  - View all announcements
  - View announcement details
  - Filter announcements by audience

- ✅ **Contact Management** (`/contact`)
  - View contact form submissions
  - Respond to contacts

- ✅ **Notification Center** (`/notifications`)
  - View all notifications
  - Manage notifications

### Data Management
- ✅ **Export & Archive** (`/export`)
  - Export student data
  - Export attendance data
  - Export fee data
  - Create yearly archives
  - Download archives

- ✅ **Student Archiving** (`/archive`)
  - Archive students
  - View archived students
  - Restore archived students

- ✅ **Activity Timeline** (`/activity-timeline`)
  - View system activity timeline
  - Track all changes

### Staff Management
- ✅ **Staff Check-In** (`/staff-checkin`)
  - View staff check-in records
  - View check-in history
  - View today's check-in status
  - View staff list

### Special Features
- ✅ **Weather** (`/weather`)
  - View current weather
  - Clear weather cache

- ✅ **Azan Timer** (`/azan-timer`)
  - View prayer times
  - Set prayer notifications

- ✅ **Quran Quote** (`/quran-quote`)
  - View daily Quran quote
  - Clear quote cache

- ✅ **vLLM Integration** (`/vllm`)
  - Generate text using language models
  - Batch text generation
  - Check vLLM health

### Account Management
- ✅ **Personal Settings** (`/personal-settings`)
  - Update profile
  - Change password
  - Update preferences
  - Configure account settings

- ✅ **Account** (`/account`)
  - View account details
  - Update account information

---

## PIC (Person in Charge) Role Functions

### User Management
- ✅ **View Students** (`/pelajar`)
  - View all students
  - View student details by IC
  - View student statistics
  - Search and filter students

- ✅ **View Teachers** (`/guru`)
  - View all teachers
  - View teacher details by IC
  - View teacher statistics

- ✅ **View Classes** (`/kelas`)
  - View all classes
  - View class details by ID
  - View class statistics

### Student Management (With Approval Workflow)
- ✅ **Create Students** (`/pelajar`)
  - Create students (requires admin approval)
  - Request is sent to admin for approval
  - Can view pending requests

- ✅ **Update Students** (`/pelajar`)
  - Update student information (requires admin approval)
  - Request is sent to admin for approval

- ✅ **Delete Students** (`/pelajar`)
  - Delete students (requires admin approval)
  - Request is sent to admin for approval

### Attendance Management (With Approval Workflow)
- ✅ **Mark Attendance** (`/kehadiran`)
  - Mark attendance (requires admin approval)
  - Bulk mark attendance (requires admin approval)
  - Bulk mark attendance with proof (requires admin approval)
  - View all attendance records
  - View attendance statistics
  - View student attendance history

- ✅ **Update Attendance** (`/kehadiran`)
  - Update attendance records (requires admin approval)

- ✅ **Delete Attendance** (`/kehadiran`)
  - Delete attendance records (requires admin approval)

- ✅ **Confirm Attendance Documents** (`/kehadiran`)
  - Confirm attendance documents (with IB role)

### Fee Management
- ✅ **View Fees** (`/yuran`)
  - View all fees
  - View fee statistics
  - View fee details by ID

- ✅ **Confirm Fee Documents** (`/yuran`)
  - Confirm fee documents (with IB role)

### Announcements (With Approval Workflow)
- ✅ **Create Announcements** (`/announcements`)
  - Create announcements (requires admin approval)

- ✅ **Update Announcements** (`/announcements`)
  - Update announcements (requires admin approval)

- ✅ **Delete Announcements** (`/announcements`)
  - Delete announcements (requires admin approval)

- ✅ **View Announcements** (`/announcements`)
  - View all announcements
  - View announcement details

### PIC-Specific Features
- ✅ **PIC Recycle Bin** (`/pic-recycle-bin`)
  - View PIC actions that can be undone
  - Undo PIC actions
  - Cancel pending PIC requests
  - View PIC action history

- ✅ **Activity Timeline** (`/activity-timeline`)
  - View activity timeline

### Reports & Analytics
- ✅ **Reports** (`/laporan`)
  - View reports
  - Generate reports

- ✅ **Results** (`/keputusan`)
  - View all results
  - View result statistics
  - View top performers

### Staff Management
- ✅ **Staff Check-In** (`/staff-checkin`)
  - Check in/out
  - View check-in history
  - View today's check-in status

### System Features
- ✅ **System Hierarchy** (`/hierarchy`)
  - View organization hierarchy

- ✅ **Dashboard** (`/`)
  - View dashboard statistics

### Account Management
- ✅ **Personal Settings** (`/personal-settings`)
  - Update profile
  - Change password
  - Update preferences

---

## Teacher Role Functions

### Student Management
- ✅ **View Students** (`/pelajar`)
  - View all students
  - View student details by IC
  - Search and filter students
  - View students in their classes

### Class Management
- ✅ **View Classes** (`/kelas`)
  - View all classes
  - View their assigned classes only (with `my_classes_only=true`)
  - View class details by ID
  - View class statistics

- ✅ **Update Classes** (`/kelas`)
  - Update their assigned classes
  - Cannot create or delete classes

### Attendance Management
- ✅ **Mark Attendance** (`/kehadiran`)
  - Mark attendance (direct, no approval needed)
  - Bulk mark attendance (direct)
  - Bulk mark attendance with proof (direct)
  - View all attendance records
  - View attendance statistics
  - View student attendance history for their classes

- ✅ **Delete Attendance** (`/kehadiran`)
  - Delete attendance records (direct, no approval needed)

### Exam & Results Management
- ✅ **View Exams** (`/exams`)
  - View all exams
  - View exam details by ID

- ✅ **View Results** (`/keputusan`)
  - View all results
  - View result statistics
  - View top performers
  - View result details by ID

### Fee Management
- ✅ **View Fees** (`/yuran`)
  - View all fees
  - View fees for students in their classes
  - View fee statistics
  - View fee details by ID

### Reports
- ✅ **Reports** (`/laporan`)
  - View reports for their classes
  - Generate class reports

### Staff Management
- ✅ **Staff Check-In** (`/staff-checkin`)
  - Check in/out
  - View check-in history
  - View today's check-in status

### Communication
- ✅ **Announcements** (`/announcements`)
  - View all announcements
  - View announcement details
  - Filter by target audience

### System Features
- ✅ **System Hierarchy** (`/hierarchy`)
  - View organization hierarchy

- ✅ **Dashboard** (`/`)
  - View dashboard statistics
  - View their class statistics

### Account Management
- ✅ **Personal Settings** (`/personal-settings`)
  - Update profile
  - Change password
  - Update preferences

- ✅ **Account** (`/account`)
  - View account details
  - Update account information

---

## Student Role Functions

### Personal Information
- ✅ **View Own Profile** (`/account`)
  - View own student details
  - View own class information
  - View registration date

### Attendance
- ✅ **View Own Attendance** (`/kehadiran`)
  - View own attendance history
  - View attendance statistics
  - View attendance by class

### Fees
- ✅ **View Own Fees** (`/yuran`)
  - View own fees
  - View fee payment history
  - View fee details
  - Pay fees online (`/pay-yuran/:id`)
  - View payment history (`/payment-history`)

### Results
- ✅ **View Own Results** (`/keputusan`)
  - View own exam results
  - View result statistics
  - View top performers (for comparison)

### Communication
- ✅ **Announcements** (`/announcements`)
  - View announcements targeted to students
  - View all public announcements

### Dashboard
- ✅ **Dashboard** (`/`)
  - View personal dashboard
  - View own statistics
  - View class information

### Account Management
- ✅ **Personal Settings** (`/personal-settings`)
  - Update profile
  - Change password
  - Update preferences

- ✅ **Account** (`/account`)
  - View account details
  - Update account information

---

## IB (Ibu Bapa/Payment Approver) Role Functions

### Payment Approval
- ✅ **IB Dashboard** (`/ib-dashboard`)
  - View pending payment confirmations
  - View monthly payment reports
  - Approve monthly payments
  - View payment statistics

### Document Confirmation
- ✅ **Confirm Fee Documents** (`/yuran`)
  - Confirm fee payment documents
  - View fee documents requiring confirmation

- ✅ **Confirm Attendance Documents** (`/kehadiran`)
  - Confirm attendance documents
  - View attendance documents requiring confirmation

- ✅ **Confirm Class Documents** (`/ib`)
  - Confirm class-related documents
  - View class documents requiring confirmation

### Reports
- ✅ **Monthly Reports** (`/ib`)
  - View available monthly reports
  - Generate monthly payment reports
  - View payment summaries

### Account Management
- ✅ **IB Account** (`/ib-account`)
  - View IB account details
  - Update IB account information

- ✅ **Personal Settings** (`/personal-settings`)
  - Update profile
  - Change password
  - Update preferences

### Dashboard
- ✅ **Dashboard** (`/`)
  - View IB dashboard
  - View payment statistics

---

## Staff Role Functions

### Class Management
- ✅ **Create Classes** (`/kelas`)
  - Create classes (with admin/staff role)
  - Update classes (with admin/staff role)

### Student Management
- ✅ **Create Students** (`/pelajar`)
  - Create students (with admin/staff/pic role)

### Fee Management
- ✅ **Create Fees** (`/yuran`)
  - Create fees (with admin/staff role)
  - Update fees (with admin/staff role)
  - Mark fees as paid (with admin/staff role)

### Results Management
- ✅ **Create Results** (`/keputusan`)
  - Create results (with admin/staff role)
  - Update results (with admin/staff role)

### Staff Check-In
- ✅ **Staff Check-In** (`/staff-checkin`)
  - Check in/out
  - View check-in history
  - View today's check-in status

### Account Management
- ✅ **Personal Settings** (`/personal-settings`)
  - Update profile
  - Change password
  - Update preferences

**Note:** Staff role is typically combined with other roles (teacher, admin). Pure staff role has limited functionality.

---

## Public/Unauthenticated Functions

### Authentication
- ✅ **Login** (`/login`)
  - Login with IC and password
  - Location-based login (within masjid radius)
  - Role selection on login

- ✅ **Student Registration** (`/student-register`)
  - Public student registration
  - No authentication required

- ✅ **Teacher Registration** (`/teacher-register`)
  - Public teacher registration
  - No authentication required
  - Requires document upload

- ✅ **Password Reset** (`/forgot-password`)
  - Request password reset
  - Choose reset method (email/phone)
  - Reset password with code
  - Reset password with token

### Quick Check-In
- ✅ **Quick Staff Check-In** (`/quick-checkin`)
  - Public quick check-in (IC + password)
  - No JWT token required
  - Location-based verification

### Public Information
- ✅ **Masjid Location** (`/api/settings/masjid-location`)
  - Get masjid location (public endpoint)
  - No authentication required

### Contact
- ✅ **Contact Form** (`/contact`)
  - Submit contact form (public)
  - No authentication required

---

## Cross-Role Functions

### Common Functions (All Authenticated Users)

#### Dashboard
- ✅ **Dashboard** (`/`)
  - Role-specific dashboard views
  - Statistics based on role

#### Communication
- ✅ **Announcements** (`/announcements`)
  - View announcements (filtered by target audience)
  - All roles can view

- ✅ **Contact** (`/contact`)
  - Submit contact form
  - All roles can contact

- ✅ **Help Center** (`/help`)
  - View help documentation
  - All roles can access

#### Account Management
- ✅ **Profile Management**
  - View own profile
  - Update own profile
  - Change password
  - Update preferences

- ✅ **Complete Profile** (`/complete-profile`)
  - Complete profile wizard
  - Required for all roles

#### System Features
- ✅ **Weather** (`/weather`)
  - View current weather
  - All authenticated users

- ✅ **Azan Timer** (`/azan-timer`)
  - View prayer times
  - All authenticated users

- ✅ **System Hierarchy** (`/hierarchy`)
  - View organization hierarchy
  - All authenticated users

---

## Permission Summary Matrix

| Function | Admin | PIC | Teacher | Student | IB | Staff |
|----------|-------|-----|---------|---------|----|----|
| **User Management** |
| View All Users | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Create/Update/Delete Admins | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Create/Update/Delete PIC | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Approve Registrations | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Approve PIC Changes | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Student Management** |
| Create Students | ✅ Direct | ✅ Approval | ❌ | ❌ | ❌ | ✅ |
| Update Students | ✅ Direct | ✅ Approval | ❌ | ❌ | ❌ | ✅ |
| Delete Students | ✅ Direct | ✅ Approval | ❌ | ❌ | ❌ | ❌ |
| View Students | ✅ | ✅ | ✅ | Own Only | ❌ | ✅ |
| **Teacher Management** |
| Create/Update/Delete Teachers | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View Teachers | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Class Management** |
| Create Classes | ✅ Direct | ❌ | ❌ | ❌ | ❌ | ✅ |
| Update Classes | ✅ Direct | ❌ | ✅ Own | ❌ | ❌ | ✅ |
| Delete Classes | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View Classes | ✅ | ✅ | ✅ | Own Only | ❌ | ✅ |
| **Attendance Management** |
| Mark Attendance | ✅ Direct | ✅ Approval | ✅ Direct | ❌ | ❌ | ❌ |
| Update Attendance | ✅ Direct | ✅ Approval | ❌ | ❌ | ❌ | ❌ |
| Delete Attendance | ✅ Direct | ✅ Approval | ✅ Direct | ❌ | ❌ | ❌ |
| View Attendance | ✅ | ✅ | ✅ | Own Only | ❌ | ✅ |
| Confirm Documents | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Fee Management** |
| Create Fees | ✅ Direct | ❌ | ❌ | ❌ | ❌ | ✅ |
| Update Fees | ✅ Direct | ❌ | ❌ | ❌ | ❌ | ✅ |
| Delete Fees | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Mark Paid | ✅ Direct | ❌ | ❌ | ❌ | ❌ | ✅ |
| View Fees | ✅ | ✅ | ✅ | Own Only | ❌ | ✅ |
| Confirm Documents | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Generate Monthly | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Exam & Results** |
| Create/Update/Delete Exams | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View Exams | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Create/Update/Delete Results | ✅ Direct | ❌ | ❌ | ❌ | ❌ | ✅ |
| View Results | ✅ | ✅ | ✅ | Own Only | ❌ | ✅ |
| **Announcements** |
| Create | ✅ Direct | ✅ Approval | ❌ | ❌ | ❌ | ❌ |
| Update | ✅ Direct | ✅ Approval | ❌ | ❌ | ❌ | ❌ |
| Delete | ✅ Direct | ✅ Approval | ❌ | ❌ | ❌ | ❌ |
| View | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Payment Processing** |
| Process Payments | ✅ | ❌ | ❌ | ✅ Own | ✅ | ❌ |
| Approve Payments | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| View Payments | ✅ | ❌ | ❌ | Own Only | ✅ | ❌ |
| **System Configuration** |
| System Settings | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Payment Gateway | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Maintenance Mode | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Reports & Analytics** |
| Generate Reports | ✅ | ✅ | ✅ Limited | ❌ | ✅ | ✅ |
| View Statistics | ✅ | ✅ | ✅ Limited | Own Only | ✅ | ✅ |
| **Staff Check-In** |
| Check In/Out | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| View History | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Admin Actions** |
| View Recycle Bin | ✅ | ✅ Own | ❌ | ❌ | ❌ | ❌ |
| Undo Actions | ✅ | ✅ Own | ❌ | ❌ | ❌ | ❌ |

---

## Notes

### Approval Workflow
- **PIC Role**: Most create/update/delete operations require admin approval
- **Admin Role**: All operations are direct (no approval needed)
- **Teacher Role**: Attendance operations are direct, class updates are direct for own classes
- **Pending Requests**: PIC users can view and cancel their own pending requests in the recycle bin

### Multi-Role Support
- Users can have multiple roles (e.g., admin + teacher, pic + ib)
- Users can switch between roles using the role selector
- Permissions are based on the active role

### Location-Based Features
- Login requires location verification (within masjid radius)
- Staff check-in requires location verification
- Quick check-in requires location verification

### Document Confirmation
- IB role can confirm fee and attendance documents
- Admin and PIC can also confirm documents
- Confirmation is required for certain payment and attendance records

---

## Testing Checklist

### Admin Role Testing
- [ ] Create/Update/Delete students
- [ ] Create/Update/Delete teachers
- [ ] Create/Update/Delete classes
- [ ] Mark/Update/Delete attendance
- [ ] Create/Update/Delete fees
- [ ] Generate monthly fees
- [ ] Approve registrations
- [ ] Approve PIC changes
- [ ] View all reports
- [ ] System configuration
- [ ] Admin actions undo

### PIC Role Testing
- [ ] Create student (verify approval workflow)
- [ ] Update student (verify approval workflow)
- [ ] Delete student (verify approval workflow)
- [ ] Mark attendance (verify approval workflow)
- [ ] Create announcement (verify approval workflow)
- [ ] View PIC recycle bin
- [ ] Undo PIC actions
- [ ] Cancel pending requests

### Teacher Role Testing
- [ ] View students
- [ ] View own classes
- [ ] Mark attendance (direct)
- [ ] Delete attendance (direct)
- [ ] View results
- [ ] View fees
- [ ] Staff check-in

### Student Role Testing
- [ ] View own profile
- [ ] View own attendance
- [ ] View own fees
- [ ] Pay fees online
- [ ] View own results
- [ ] View announcements

### IB Role Testing
- [ ] View IB dashboard
- [ ] Confirm fee documents
- [ ] Confirm attendance documents
- [ ] Approve monthly payments
- [ ] View monthly reports

---

**Document Status:** ✅ Complete  
**Last Review:** 2025-01-12

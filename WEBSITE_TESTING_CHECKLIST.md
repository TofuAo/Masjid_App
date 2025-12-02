# Website Testing Checklist - MyMasjidApp

**Version:** Current Production  
**Last Updated:** 2025-11-18  
**Purpose:** Comprehensive testing checklist to ensure all pages and features run smoothly

---

## 🔐 1. Authentication & Authorization

### Login & Registration
- [ ] **Login Page (`/login`)**
  - [ ] Admin login works correctly
  - [ ] Teacher login works correctly
  - [ ] Student login works correctly
  - [ ] PIC login works correctly
  - [ ] Invalid credentials show error message
  - [ ] "Forgot Password" link works
  - [ ] "Daftar Sebagai Pelajar" link works
  - [ ] "First Time Login" link works
  - [ ] Token is stored correctly in localStorage
  - [ ] Token expiry is handled correctly

- [ ] **Student Registration (`/student-register`)**
  - [ ] Form fields are all present (nama, IC, email, telefon, umur, alamat, password, confirmPassword)
  - [ ] Client-side validation works
  - [ ] Registration creates user with 'pending' status
  - [ ] Success message displays
  - [ ] Redirects to login after 3 seconds
  - [ ] Duplicate IC/email shows error

- [ ] **Register Page (`/register`)**
  - [ ] Admin/staff registration works
  - [ ] All required fields validated
  - [ ] Success redirect works

- [ ] **Forgot Password (`/forgot-password`)**
  - [ ] Email input accepts valid email
  - [ ] Submit sends reset email
  - [ ] Success message displays

- [ ] **Reset Password (`/reset-password`)**
  - [ ] Token validation works
  - [ ] Password reset form works
  - [ ] Password confirmation matches
  - [ ] Success redirect to login

### Profile Completion
- [ ] **Complete Profile (`/complete-profile`)**
  - [ ] Redirects incomplete profiles correctly
  - [ ] Form fields load correctly
  - [ ] Students cannot select class or registration date
  - [ ] "Simpan Profil" saves correctly
  - [ ] Profile completion persists after reload
  - [ ] "Pergi ke Laman Log Masuk" button works
  - [ ] Redirects to dashboard after completion

### Role-Based Access Control
- [ ] **Admin Access**
  - [ ] Can access all pages
  - [ ] Can create/edit/delete all entities
  - [ ] Can approve pending registrations
  - [ ] Can manage PIC users

- [ ] **Teacher Access**
  - [ ] Can only see their own classes
  - [ ] Cannot access admin-only pages
  - [ ] Can view/edit their own information
  - [ ] Can mark attendance for their classes

- [ ] **Student Access**
  - [ ] Cannot access admin/teacher pages
  - [ ] Can view their own results
  - [ ] Can view their own fees
  - [ ] Can view their own attendance
  - [ ] Redirected from restricted pages

- [ ] **PIC Access**
  - [ ] Can access PIC-specific pages
  - [ ] Can approve/reject changes
  - [ ] Cannot access admin-only features

---

## 📊 2. Dashboard (`/`)

- [ ] **Page Loads**
  - [ ] Statistics cards display correctly
  - [ ] Data loads without errors
  - [ ] Loading state shows while fetching

- [ ] **Statistics Display**
  - [ ] Kehadiran Hari Ini percentage correct
  - [ ] Yuran Tertunggak count correct
  - [ ] Kelas Aktif count correct (all classes, not filtered by status)
  - [ ] Pelajar Baru Bulan Ini count correct

- [ ] **Quick Actions**
  - [ ] All action buttons work
  - [ ] Navigation to respective pages works

- [ ] **Recent Activity**
  - [ ] Recent items display correctly
  - [ ] Links to detail pages work

---

## 👥 3. Pelajar (Students) Page (`/pelajar`)

### List View
- [ ] **Page Loads**
  - [ ] Student list displays correctly
  - [ ] Search functionality works
  - [ ] Filter options work (if any)
  - [ ] Pagination works (if implemented)

- [ ] **Student List Display**
  - [ ] All student information displays
  - [ ] Class names show correctly
  - [ ] Student count matches database
  - [ ] No duplicate entries

### CRUD Operations
- [ ] **Create Student**
  - [ ] "Tambah Pelajar" button works
  - [ ] Form opens correctly
  - [ ] All required fields validated
  - [ ] IC format validation works
  - [ ] Class selection works
  - [ ] Submit creates student successfully
  - [ ] List refreshes after creation
  - [ ] Success message displays

- [ ] **View Student Details**
  - [ ] Click on student name opens details
  - [ ] All student information displays
  - [ ] Class information shows correctly
  - [ ] Related data (attendance, fees, results) shows

- [ ] **Edit Student**
  - [ ] Edit button works
  - [ ] Form pre-fills with existing data
  - [ ] Updates save correctly
  - [ ] List refreshes after update
  - [ ] Success message displays

- [ ] **Delete Student**
  - [ ] Delete button works
  - [ ] Confirmation dialog shows
  - [ ] Deletion works correctly
  - [ ] List refreshes after deletion
  - [ ] Success message displays

### Import Functionality
- [ ] **Import Students**
  - [ ] Import button works
  - [ ] File upload works
  - [ ] Excel/CSV parsing works
  - [ ] Validation errors display
  - [ ] Import summary shows
  - [ ] List refreshes after import

### Data Synchronization
- [ ] **After Create/Update/Delete**
  - [ ] Data syncs across all pages
  - [ ] Class student count updates
  - [ ] Related records remain intact

---

## 👨‍🏫 4. Guru (Teachers) Page (`/guru`)

### List View
- [ ] **Page Loads**
  - [ ] Teacher list displays correctly
  - [ ] Search functionality works
  - [ ] Teacher names are clickable

### CRUD Operations
- [ ] **Create Teacher**
  - [ ] Form opens correctly
  - [ ] All required fields validated
  - [ ] IC format validation works
  - [ ] Kepakaran (expertise) selection works
  - [ ] Submit creates teacher successfully
  - [ ] List refreshes after creation

- [ ] **View Teacher Details**
  - [ ] Click on teacher name opens details
  - [ ] All teacher information displays
  - [ ] "Kelas yang Diampu" section shows (admin/PIC only)
  - [ ] Class list shows unique classes only
  - [ ] Student count per class displays correctly
  - [ ] No duplicate classes in list

- [ ] **Edit Teacher**
  - [ ] Edit button works
  - [ ] Form pre-fills with existing data
  - [ ] Updates save correctly
  - [ ] List refreshes after update

- [ ] **Delete Teacher**
  - [ ] Delete button works
  - [ ] Confirmation dialog shows
  - [ ] Deletion works correctly
  - [ ] List refreshes after deletion

### Data Synchronization
- [ ] **After Create/Update/Delete**
  - [ ] Data syncs across all pages
  - [ ] Class teacher assignments update
  - [ ] Related records remain intact

---

## 📚 5. Kelas (Classes) Page (`/kelas`)

### List View
- [ ] **Page Loads**
  - [ ] Class list displays correctly
  - [ ] Search functionality works
  - [ ] Statistics cards display (Total, Kapasiti, Yuran Purata)

### CRUD Operations
- [ ] **Create Class**
  - [ ] "Tambah Kelas" button works
  - [ ] Form opens correctly
  - [ ] All required fields validated:
    - [ ] Nama Kelas
    - [ ] Yuran (RM)
    - [ ] Kapasiti
    - [ ] Guru selection
    - [ ] Level selection
  - [ ] **Status field is NOT present** (removed)
  - [ ] Session management works:
    - [ ] Add session button works
    - [ ] Remove session button works
    - [ ] Day checkboxes work
    - [ ] Time checkboxes work
    - [ ] At least one session required
  - [ ] Submit creates class successfully
  - [ ] Status defaults to 'aktif' in database
  - [ ] List refreshes after creation

- [ ] **View Class Details**
  - [ ] View button works
  - [ ] All class information displays
  - [ ] Teacher name shows correctly
  - [ ] Sessions display correctly
  - [ ] Student list shows correctly
  - [ ] Statistics display correctly

- [ ] **Edit Class**
  - [ ] Edit button works
  - [ ] Form pre-fills with existing data
  - [ ] **Status field is NOT present** (removed)
  - [ ] Updates save correctly
  - [ ] List refreshes after update

- [ ] **Delete Class**
  - [ ] Delete button works
  - [ ] Confirmation dialog shows
  - [ ] Cannot delete class with active students (error message)
  - [ ] Deletion works for empty classes
  - [ ] List refreshes after deletion

### Data Synchronization
- [ ] **After Create/Update/Delete**
  - [ ] Data syncs across all pages
  - [ ] Teacher class assignments update
  - [ ] Student class assignments remain intact
  - [ ] Dashboard statistics update

---

## ✅ 6. Kehadiran (Attendance) Page (`/kehadiran`)

### List View
- [ ] **Page Loads**
  - [ ] Attendance list displays correctly
  - [ ] Date range filter works
  - [ ] Class filter works
  - [ ] Search functionality works

### CRUD Operations
- [ ] **Create Attendance**
  - [ ] "Tambah Kehadiran" button works
  - [ ] Form opens correctly
  - [ ] Date selection works
  - [ ] Class selection works
  - [ ] Student list loads for selected class
  - [ ] Status selection works (Hadir, Tidak Hadir, Cuti, etc.)
  - [ ] Bulk status update works
  - [ ] Submit creates attendance successfully
  - [ ] List refreshes after creation

- [ ] **View Attendance**
  - [ ] Attendance records display correctly
  - [ ] Student names show correctly
  - [ ] Status displays correctly
  - [ ] Date displays correctly

- [ ] **Edit Attendance**
  - [ ] Edit button works
  - [ ] Form pre-fills with existing data
  - [ ] Updates save correctly
  - [ ] List refreshes after update

- [ ] **Delete Attendance**
  - [ ] Delete button works
  - [ ] Confirmation dialog shows
  - [ ] Deletion works correctly
  - [ ] List refreshes after deletion

### Data Synchronization
- [ ] **After Create/Update/Delete**
  - [ ] Data syncs across all pages
  - [ ] Dashboard statistics update
  - [ ] Reports update

---

## 💰 7. Yuran (Fees) Page (`/yuran`)

### List View
- [ ] **Page Loads**
  - [ ] Fee list displays correctly
  - [ ] Date range filter works
  - [ ] Status filter works (Bayar, Belum Bayar, etc.)
  - [ ] Search functionality works

### CRUD Operations
- [ ] **Create Fee**
  - [ ] "Tambah Yuran" button works
  - [ ] Form opens correctly
  - [ ] All required fields validated
  - [ ] Student selection works
  - [ ] Amount input works
  - [ ] Date selection works
  - [ ] Submit creates fee successfully
  - [ ] List refreshes after creation

- [ ] **View Fee**
  - [ ] Fee records display correctly
  - [ ] Student names show correctly
  - [ ] Amount displays correctly
  - [ ] Status displays correctly

- [ ] **Edit Fee**
  - [ ] Edit button works
  - [ ] Form pre-fills with existing data
  - [ ] Updates save correctly
  - [ ] List refreshes after update

- [ ] **Mark as Paid**
  - [ ] "Mark as Paid" button works
  - [ ] Status updates correctly
  - [ ] Payment date sets automatically
  - [ ] List refreshes after update

- [ ] **Delete Fee**
  - [ ] Delete button works
  - [ ] Confirmation dialog shows
  - [ ] Deletion works correctly
  - [ ] List refreshes after deletion

### Pay Yuran Page (`/pay-yuran/:id`)
- [ ] **Page Loads**
  - [ ] Student information displays
  - [ ] Fee details display
  - [ ] Payment form works
  - [ ] Payment method selection works
  - [ ] Receipt number input works
  - [ ] Submit payment works
  - [ ] Success message displays
  - [ ] Redirects correctly

### Data Synchronization
- [ ] **After Create/Update/Delete**
  - [ ] Data syncs across all pages
  - [ ] Dashboard statistics update
  - [ ] Reports update

---

## 📝 8. Keputusan (Results) Page (`/keputusan`)

### List View
- [ ] **Page Loads**
  - [ ] Results list displays correctly
  - [ ] Exam filter works (shows unique exam subjects only)
  - [ ] Date range filter works
  - [ ] Class filter works
  - [ ] Search functionality works

### Table Display
- [ ] **Table Columns**
  - [ ] Pelajar (Student) column shows
  - [ ] Kelas (Class) column shows class name correctly
  - [ ] **Peperiksaan (Exam) column is NOT present** (removed)
  - [ ] Markah columns show
  - [ ] Gred column shows
  - [ ] Actions column shows

### CRUD Operations
- [ ] **Create Result**
  - [ ] "Tambah Keputusan" button works
  - [ ] Form opens correctly
  - [ ] All required fields validated
  - [ ] Student selection works
  - [ ] Exam selection works
  - [ ] Mark input works (lisan and bertulis)
  - [ ] Grade calculation works
  - [ ] Submit creates result successfully
  - [ ] List refreshes after creation

- [ ] **View Result Details**
  - [ ] Click on table row opens modal
  - [ ] Student name displays
  - [ ] Class name displays
  - [ ] Separate sections for "Bertulis" and "Lisan" exams
  - [ ] Marks display correctly
  - [ ] Grades display correctly
  - [ ] Status displays correctly
  - [ ] Notes display correctly
  - [ ] Summary section shows average marks

- [ ] **Edit Result**
  - [ ] Edit button works (stops row click)
  - [ ] Form pre-fills with existing data
  - [ ] Updates save correctly
  - [ ] List refreshes after update

- [ ] **Delete Result**
  - [ ] Delete button works (stops row click)
  - [ ] Confirmation dialog shows
  - [ ] Deletion works correctly
  - [ ] List refreshes after deletion

### Data Synchronization
- [ ] **After Create/Update/Delete**
  - [ ] Data syncs across all pages
  - [ ] Reports update
  - [ ] Student detail pages update

---

## 📅 9. Timetable Page (`/timetable`)

- [ ] **Page Loads**
  - [ ] Timetable displays correctly
  - [ ] Class schedules show correctly
  - [ ] Time slots display correctly
  - [ ] Day columns display correctly

- [ ] **Functionality**
  - [ ] Filter by class works
  - [ ] Filter by teacher works
  - [ ] View options work (if any)
  - [ ] Print/export works (if implemented)

---

## 📊 10. Laporan (Reports) Page (`/laporan`)

- [ ] **Page Loads**
  - [ ] Report options display
  - [ ] Date range selection works
  - [ ] Class selection works

- [ ] **Report Types**
  - [ ] Attendance reports generate correctly
  - [ ] Fee reports generate correctly
  - [ ] Result reports generate correctly
  - [ ] Student reports generate correctly
  - [ ] Export to Excel/PDF works (if implemented)

- [ ] **Data Accuracy**
  - [ ] All calculations are correct
  - [ ] Data matches source pages
  - [ ] No missing records

---

## ⚙️ 11. Settings Page (`/settings`)

- [ ] **Page Loads**
  - [ ] All settings sections display
  - [ ] Current settings load correctly

- [ ] **Settings Categories**
  - [ ] General settings save correctly
  - [ ] User management works
  - [ ] System configuration works
  - [ ] Backup/restore works (if implemented)

---

## 👤 12. Personal Settings Page (`/personal-settings`)

- [ ] **Page Loads**
  - [ ] User information displays
  - [ ] Form fields load correctly

- [ ] **Update Profile**
  - [ ] Edit information works
  - [ ] Password change works
  - [ ] Preferences save correctly
  - [ ] Changes persist after reload

---

## 📢 13. Announcements Page (`/announcements`)

- [ ] **Page Loads**
  - [ ] Announcements list displays
  - [ ] Search functionality works
  - [ ] Filter options work

- [ ] **CRUD Operations**
  - [ ] Create announcement works
  - [ ] Edit announcement works
  - [ ] Delete announcement works
  - [ ] View announcement details works

---

## 🔧 14. Admin Actions Page (`/admin-actions`)

- [ ] **Page Loads**
  - [ ] Admin actions list displays
  - [ ] Action history shows correctly

- [ ] **Functionality**
  - [ ] All admin actions work
  - [ ] Audit trail displays correctly
  - [ ] Export functionality works (if implemented)

---

## 👥 15. PIC Users Page (`/pic-users`)

- [ ] **Page Loads**
  - [ ] PIC users list displays
  - [ ] User information shows correctly

- [ ] **CRUD Operations**
  - [ ] Create PIC user works
  - [ ] Edit PIC user works
  - [ ] Delete PIC user works
  - [ ] View PIC user details works

---

## ✅ 16. PIC Approvals Page (`/pic-approvals`)

- [ ] **Page Loads**
  - [ ] Pending approvals list displays
  - [ ] Approval details show correctly

- [ ] **Functionality**
  - [ ] Approve action works
  - [ ] Reject action works
  - [ ] Comments save correctly
  - [ ] List refreshes after action

---

## 📝 17. Pending Registrations Page (`/pending-registrations`)

- [ ] **Page Loads**
  - [ ] Pending registrations list displays
  - [ ] Student information shows correctly

- [ ] **Functionality**
  - [ ] Approve registration works
  - [ ] Reject registration works
  - [ ] View details works
  - [ ] List refreshes after action

---

## 🕐 18. Staff Check-In Page (`/staff-checkin`)

- [ ] **Page Loads**
  - [ ] Check-in form displays
  - [ ] Staff list shows correctly

- [ ] **Functionality**
  - [ ] Check-in works
  - [ ] Check-out works
  - [ ] History displays correctly
  - [ ] Reports generate correctly

---

## 🚀 19. Quick Staff Check-In (`/quick-checkin`)

- [ ] **Page Loads**
  - [ ] Quick check-in form displays
  - [ ] Works without authentication

- [ ] **Functionality**
  - [ ] Check-in works
  - [ ] Success message displays
  - [ ] Redirects correctly

---

## 🔄 20. Data Synchronization Across Pages

- [ ] **Student Changes**
  - [ ] Create student → appears in class list
  - [ ] Update student → updates in all related pages
  - [ ] Delete student → removes from all related pages

- [ ] **Class Changes**
  - [ ] Create class → appears in teacher's class list
  - [ ] Update class → updates in all related pages
  - [ ] Delete class → handles student reassignment

- [ ] **Teacher Changes**
  - [ ] Create teacher → appears in class assignment
  - [ ] Update teacher → updates in all related pages
  - [ ] Delete teacher → handles class reassignment

- [ ] **Attendance Changes**
  - [ ] Create attendance → updates dashboard stats
  - [ ] Update attendance → syncs across pages
  - [ ] Delete attendance → updates statistics

- [ ] **Fee Changes**
  - [ ] Create fee → updates dashboard stats
  - [ ] Mark as paid → updates statistics
  - [ ] Delete fee → updates statistics

- [ ] **Result Changes**
  - [ ] Create result → appears in student detail
  - [ ] Update result → syncs across pages
  - [ ] Delete result → removes from all pages

---

## 🎨 21. UI/UX Elements

### Navigation
- [ ] **Sidebar Navigation**
  - [ ] All menu items display correctly
  - [ ] Active page highlighted
  - [ ] Animated forest background displays (fallen leaves)
  - [ ] Navigation works on all pages
  - [ ] Responsive on mobile devices

- [ ] **Top Header**
  - [ ] User name displays
  - [ ] Avatar displays
  - [ ] Logout button works
  - [ ] Hamburger menu works (mobile)

### Forms
- [ ] **Form Validation**
  - [ ] Required fields show errors
  - [ ] Invalid formats show errors
  - [ ] Error messages are clear
  - [ ] Success messages display

- [ ] **Form Behavior**
  - [ ] Auto-save works (if implemented)
  - [ ] Cancel button works
  - [ ] Submit button disabled during submission
  - [ ] Loading states display

### Modals
- [ ] **Modal Functionality**
  - [ ] Modals open correctly
  - [ ] Modals close correctly
  - [ ] Backdrop click closes modal
  - [ ] Escape key closes modal
  - [ ] Form submission closes modal
  - [ ] Data refreshes after modal close

### Tables
- [ ] **Table Functionality**
  - [ ] Sorting works (if implemented)
  - [ ] Pagination works
  - [ ] Search works
  - [ ] Filters work
  - [ ] Responsive on mobile

### Notifications
- [ ] **Toast Notifications**
  - [ ] Success messages display
  - [ ] Error messages display
  - [ ] Warning messages display
  - [ ] Messages auto-dismiss
  - [ ] Multiple messages stack correctly

---

## 🔒 22. Security & Error Handling

- [ ] **Authentication**
  - [ ] Expired tokens redirect to login
  - [ ] Invalid tokens show error
  - [ ] Unauthorized access redirects

- [ ] **Error Handling**
  - [ ] Network errors show user-friendly messages
  - [ ] 404 errors handled correctly
  - [ ] 500 errors handled correctly
  - [ ] Validation errors display clearly
  - [ ] Console errors are minimal

- [ ] **Data Validation**
  - [ ] SQL injection prevention works
  - [ ] XSS prevention works
  - [ ] Input sanitization works
  - [ ] File upload validation works

---

## 📱 23. Responsive Design

- [ ] **Mobile Devices**
  - [ ] All pages responsive
  - [ ] Forms work on mobile
  - [ ] Tables scroll horizontally
  - [ ] Navigation menu works
  - [ ] Touch interactions work

- [ ] **Tablet Devices**
  - [ ] Layout adapts correctly
  - [ ] All features accessible
  - [ ] Forms work correctly

- [ ] **Desktop Devices**
  - [ ] Full layout displays
  - [ ] All features accessible
  - [ ] Hover states work

---

## 🌐 24. Browser Compatibility

- [ ] **Chrome**
  - [ ] All features work
  - [ ] No console errors
  - [ ] Performance is good

- [ ] **Firefox**
  - [ ] All features work
  - [ ] No console errors
  - [ ] Performance is good

- [ ] **Safari**
  - [ ] All features work
  - [ ] No console errors
  - [ ] Performance is good

- [ ] **Edge**
  - [ ] All features work
  - [ ] No console errors
  - [ ] Performance is good

---

## ⚡ 25. Performance

- [ ] **Page Load Times**
  - [ ] Dashboard loads < 3 seconds
  - [ ] List pages load < 2 seconds
  - [ ] Forms load < 1 second
  - [ ] Images load correctly

- [ ] **API Response Times**
  - [ ] GET requests < 1 second
  - [ ] POST requests < 2 seconds
  - [ ] PUT requests < 2 seconds
  - [ ] DELETE requests < 1 second

- [ ] **Data Refresh**
  - [ ] Lists refresh after CRUD operations
  - [ ] Statistics update correctly
  - [ ] No unnecessary API calls

---

## 🧪 26. Edge Cases

- [ ] **Empty States**
  - [ ] Empty lists show appropriate message
  - [ ] Empty search results show message
  - [ ] No data states handled gracefully

- [ ] **Large Datasets**
  - [ ] Pagination works with many records
  - [ ] Search works with many records
  - [ ] Performance remains good

- [ ] **Concurrent Operations**
  - [ ] Multiple users can work simultaneously
  - [ ] Data conflicts handled correctly
  - [ ] Last update wins (or appropriate strategy)

- [ ] **Special Characters**
  - [ ] Names with special characters work
  - [ ] Search with special characters works
  - [ ] Export handles special characters

---

## 📋 27. Specific Feature Tests

### Status Field Removal (Classes)
- [ ] **Status field is NOT in form**
  - [ ] Create class form has no status field
  - [ ] Edit class form has no status field
  - [ ] Status defaults to 'aktif' in database

- [ ] **Status not used in queries**
  - [ ] Class list doesn't filter by status
  - [ ] Statistics don't use status
  - [ ] Dashboard counts all classes

### Animated Background
- [ ] **Fallen Leaves Animation**
  - [ ] Leaves fall continuously
  - [ ] Animation is smooth
  - [ ] Performance is good
  - [ ] Doesn't interfere with navigation
  - [ ] Responsive on all screen sizes

### Student Registration Flow
- [ ] **Registration to Approval**
  - [ ] Student registers with pending status
  - [ ] Admin sees in pending registrations
  - [ ] Admin can approve/reject
  - [ ] Approved students can login
  - [ ] Rejected students cannot login

---

## ✅ 28. Final Verification

- [ ] **All Pages Load**
  - [ ] No 404 errors
  - [ ] No 500 errors
  - [ ] No console errors
  - [ ] All routes work

- [ ] **All CRUD Operations Work**
  - [ ] Create works on all pages
  - [ ] Read works on all pages
  - [ ] Update works on all pages
  - [ ] Delete works on all pages

- [ ] **Data Consistency**
  - [ ] No orphaned records
  - [ ] Foreign keys maintained
  - [ ] Related data updates correctly

- [ ] **User Experience**
  - [ ] Navigation is intuitive
  - [ ] Error messages are clear
  - [ ] Success messages are clear
  - [ ] Loading states are visible
  - [ ] Forms are user-friendly

---

## 📝 Notes

- **Status Field Removal:** The status field has been completely removed from the class management system. All new classes default to 'aktif' status in the database, but the field is not visible or editable in the UI.

- **Animated Background:** The sidebar now features an animated fallen leaves background with parallax layers. The animation is lightweight and doesn't affect performance.

- **Student Registration:** New students register with 'pending' status and must be approved by an administrator before they can access the system.

- **Profile Completion:** Students cannot select their class or registration date - these are assigned by administrators.

---

## 🔄 Testing Workflow

1. **Start with Authentication** - Ensure login/logout works
2. **Test Each Page** - Go through each page systematically
3. **Test CRUD Operations** - Create, read, update, delete on each entity
4. **Test Data Synchronization** - Verify changes reflect across pages
5. **Test Role-Based Access** - Verify permissions for each role
6. **Test Edge Cases** - Empty states, large datasets, special characters
7. **Test Responsive Design** - Check on mobile, tablet, desktop
8. **Test Performance** - Verify load times and API response times
9. **Final Verification** - Run through all pages one more time

---

**Last Tested By:** _______________  
**Date:** _______________  
**Status:** ☐ Passed  ☐ Failed  ☐ Partial  
**Notes:** _______________


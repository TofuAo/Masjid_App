# Screenshot Links for MyMasjidApp User Manual

This document lists all pages that need screenshots for the User Manual, organized by manual section.

**Base URL:** Replace `http://localhost:3000` with your actual domain (e.g., `https://yourmasjid.com`)

---

## Section 1: Introduction
No screenshots required (text-only section)

---

## Section 2: System Requirements

### Demo Image: System requirements checklist
**URL:** N/A (conceptual diagram - can create or skip)

---

## Section 3: Installation and Setup

### Demo Image: System installation screen
**Page:** Login Page (before installation)
**URL:** `http://localhost:3000/login`
**Route:** `/login`
**Description:** Shows the login page where users first access the system

---

## Section 4: Application Overview

### Demo Image: Application dashboard showing main interface elements
**Page:** Dashboard (Main)
**URL:** `http://localhost:3000/`
**Route:** `/`
**Description:** Main dashboard showing navigation menu, header, content area, and footer
**Note:** Take screenshot while logged in as any role (admin recommended for full view)

---

## Section 5: Getting Started

### Demo Image: First-time user dashboard with welcome message
**Page:** Dashboard (First Login)
**URL:** `http://localhost:3000/`
**Route:** `/`
**Description:** Dashboard view showing welcome message and quick start guide (if available)

---

## Section 6: Core Features

### Demo Image: Core features overview showing attendance, fees, results, and class management

#### Student Management
**Page:** Students List
**URL:** `http://localhost:3000/pelajar`
**Route:** `/pelajar`
**Description:** List of all students with search and filter options

#### Teacher Management
**Page:** Teachers List
**URL:** `http://localhost:3000/guru`
**Route:** `/guru`
**Description:** List of all teachers with search and filter options

#### Class Management
**Page:** Classes List
**URL:** `http://localhost:3000/kelas`
**Route:** `/kelas`
**Description:** List of all classes with search and filter options

#### Attendance Management
**Page:** Attendance Page
**URL:** `http://localhost:3000/kehadiran`
**Route:** `/kehadiran`
**Description:** Attendance records with filters and marking interface

#### Fee Management
**Page:** Fees Page
**URL:** `http://localhost:3000/yuran`
**Route:** `/yuran`
**Description:** Fee records with payment status and filters

#### Exam and Results Management
**Page:** Results Page
**URL:** `http://localhost:3000/keputusan`
**Route:** `/keputusan`
**Description:** Exam results with marks and grades

---

## Section 7: Advanced Features

### Demo Image: Advanced features showing reports, analytics, exports, and system configuration

#### Reports and Analytics
**Page:** Reports Page
**URL:** `http://localhost:3000/laporan`
**Route:** `/laporan`
**Description:** Reports and analytics with various report types

#### System Settings
**Page:** System Settings (Admin Only)
**URL:** `http://localhost:3000/settings`
**Route:** `/settings`
**Description:** System configuration page with various setting tabs
**Note:** Requires admin login

---

## Section 8: User Roles and Permissions

### Demo Image: User roles and permissions matrix showing different access levels
**Page:** User Management (Admin Only)
**URL:** `http://localhost:3000/all-users`
**Route:** `/all-users`
**Description:** List of all users showing roles and permissions
**Note:** Requires admin login

---

## Section 9: Settings and Customization

### Demo Image: Settings page showing personal and system configuration options

#### Personal Settings
**Page:** Personal Settings
**URL:** `http://localhost:3000/personal-settings`
**Route:** `/personal-settings`
**Description:** Personal settings page with profile, password, language, and theme options

#### System Settings
**Page:** System Settings (Admin Only)
**URL:** `http://localhost:3000/settings`
**Route:** `/settings`
**Description:** System configuration page
**Note:** Requires admin login

---

## Section 10: Data Management

### Demo Image: Data management interface showing create, edit, delete, and export options

#### Student List with Actions
**Page:** Students List
**URL:** `http://localhost:3000/pelajar`
**Route:** `/pelajar`
**Description:** Students list showing Add, Edit, Delete, and Export buttons

#### Export Options
**Page:** Any list page (Students, Teachers, Classes, etc.)
**URL:** Various (e.g., `http://localhost:3000/pelajar`)
**Route:** Various
**Description:** Export dropdown showing Excel, CSV, PDF options

---

## Section 11: Security and Privacy

### Demo Image: Security settings and privacy controls interface
**Page:** Personal Settings - Password Tab
**URL:** `http://localhost:3000/personal-settings`
**Route:** `/personal-settings` (Password tab)
**Description:** Password change interface with security options

---

## Section 12: Troubleshooting Guide

### Demo Image: Troubleshooting guide showing common error messages and solutions

#### Login Error
**Page:** Login Page (with error)
**URL:** `http://localhost:3000/login`
**Route:** `/login`
**Description:** Login page showing error message (can simulate with wrong password)

#### Password Reset
**Page:** Forgot Password Page
**URL:** `http://localhost:3000/forgot-password`
**Route:** `/forgot-password`
**Description:** Password recovery page

---

## Section 13: Frequently Asked Questions
No screenshots required (text-only section)

---

## Section 14: Tips and Best Practices
No screenshots required (text-only section)

---

## Section 15: Updates and Version Changes

### Demo Image: System update notification screen
**Page:** Dashboard (with announcement)
**URL:** `http://localhost:3000/`
**Route:** `/`
**Description:** Dashboard showing update announcements (if available)

---

## Section 16: Support and Contact Information

### Demo Image: Support and contact information page
**Page:** Contact Page (if available)
**URL:** `http://localhost:3000/contact`
**Route:** `/contact`
**Description:** Contact information and support options

**Alternative:** Help Center
**URL:** `http://localhost:3000/help`
**Route:** `/help`
**Description:** Help center with documentation and support

---

## Section 17: Glossary
No screenshots required (text-only section)

---

## Section 18: Appendix
No screenshots required (text-only section)

---

## Additional Important Pages for Screenshots

### Login and Authentication

**Login Page:**
- **URL:** `http://localhost:3000/login`
- **Route:** `/login`
- **Description:** Main login interface with IC number and password fields

**Registration Page:**
- **URL:** `http://localhost:3000/register`
- **Route:** `/register`
- **Description:** User registration form

**Forgot Password Page:**
- **URL:** `http://localhost:3000/forgot-password`
- **Route:** `/forgot-password`
- **Description:** Password recovery initiation page

**Choose Reset Method:**
- **URL:** `http://localhost:3000/choose-reset-method?ic=XXXXXXXXXXXX`
- **Route:** `/choose-reset-method`
- **Description:** Page to choose email or SMS reset method

**Reset Password Page:**
- **URL:** `http://localhost:3000/reset-password?token=XXXXX`
- **Route:** `/reset-password`
- **Description:** Password reset form with token

### Student-Specific Pages

**Student Dashboard:**
- **URL:** `http://localhost:3000/` (as student)
- **Route:** `/`
- **Description:** Dashboard view for students showing attendance, fees, and results

**Student Attendance View:**
- **URL:** `http://localhost:3000/kehadiran` (as student)
- **Route:** `/kehadiran`
- **Description:** Student's personal attendance records

**Student Fees View:**
- **URL:** `http://localhost:3000/yuran` (as student)
- **Route:** `/yuran`
- **Description:** Student's fee records with payment options

**Student Results View:**
- **URL:** `http://localhost:3000/keputusan` (as student)
- **Route:** `/keputusan`
- **Description:** Student's exam results

**Pay Fee Page:**
- **URL:** `http://localhost:3000/pay-yuran/:id`
- **Route:** `/pay-yuran/:id`
- **Description:** Online payment interface for fees

**Payment History:**
- **URL:** `http://localhost:3000/payment-history`
- **Route:** `/payment-history`
- **Description:** Payment history and receipts

### Teacher-Specific Pages

**Teacher Dashboard:**
- **URL:** `http://localhost:3000/` (as teacher)
- **Route:** `/`
- **Description:** Dashboard view for teachers

**Mark Attendance:**
- **URL:** `http://localhost:3000/kehadiran` (as teacher)
- **Route:** `/kehadiran`
- **Description:** Attendance marking interface for teachers

**Enter Exam Results:**
- **URL:** `http://localhost:3000/keputusan` (as teacher)
- **Route:** `/keputusan`
- **Description:** Exam result entry interface

**Teacher Classes:**
- **URL:** `http://localhost:3000/kelas` (as teacher)
- **Route:** `/kelas`
- **Description:** Classes assigned to teacher

### Administrator Pages

**Admin Dashboard:**
- **URL:** `http://localhost:3000/` (as admin)
- **Route:** `/`
- **Description:** Full admin dashboard with all statistics

**All Users:**
- **URL:** `http://localhost:3000/all-users`
- **Route:** `/all-users`
- **Description:** User management page

**Pending Registrations:**
- **URL:** `http://localhost:3000/pending-registrations`
- **Route:** `/pending-registrations`
- **Description:** Registration approval queue

**Admin Actions (Recycle Bin):**
- **URL:** `http://localhost:3000/admin-actions`
- **Route:** `/admin-actions`
- **Description:** Admin action history and undo functionality

**Announcements:**
- **URL:** `http://localhost:3000/announcements`
- **Route:** `/announcements`
- **Description:** Announcement management page

**System Settings:**
- **URL:** `http://localhost:3000/settings`
- **Route:** `/settings`
- **Description:** System configuration page

### IB (Payment Approver) Pages

**IB Dashboard:**
- **URL:** `http://localhost:3000/ib-dashboard`
- **Route:** `/ib-dashboard`
- **Description:** Payment approver dashboard

### PIC (Person in Charge) Pages

**PIC Users:**
- **URL:** `http://localhost:3000/pic-users`
- **Route:** `/pic-users`
- **Description:** PIC user management

**PIC Approvals:**
- **URL:** `http://localhost:3000/pic-approvals`
- **Route:** `/pic-approvals`
- **Description:** PIC approval queue

**PIC Recycle Bin:**
- **URL:** `http://localhost:3000/pic-recycle-bin`
- **Route:** `/pic-recycle-bin`
- **Description:** PIC action history

### Staff Pages

**Staff Check-in:**
- **URL:** `http://localhost:3000/staff-checkin`
- **Route:** `/staff-checkin`
- **Description:** Staff check-in/check-out interface

### Other Important Pages

**Complete Profile:**
- **URL:** `http://localhost:3000/complete-profile`
- **Route:** `/complete-profile`
- **Description:** Profile completion form for new users

**Account Page:**
- **URL:** `http://localhost:3000/account`
- **Route:** `/account`
- **Description:** Account information page

**Personal Settings:**
- **URL:** `http://localhost:3000/personal-settings`
- **Route:** `/personal-settings`
- **Description:** Personal settings with multiple tabs

**Activity Timeline:**
- **URL:** `http://localhost:3000/activity-timeline`
- **Route:** `/activity-timeline`
- **Description:** System activity timeline

**Notification Center:**
- **URL:** `http://localhost:3000/notifications`
- **Route:** `/notifications`
- **Description:** Notification center

---

## Screenshot Checklist

Use this checklist to track which screenshots you've taken:

### Essential Screenshots (Recommended for Manual)

- [ ] Login Page (`/login`)
- [ ] Dashboard - Admin View (`/` as admin)
- [ ] Dashboard - Student View (`/` as student)
- [ ] Dashboard - Teacher View (`/` as teacher)
- [ ] Students List (`/pelajar`)
- [ ] Teachers List (`/guru`)
- [ ] Classes List (`/kelas`)
- [ ] Attendance Page (`/kehadiran`)
- [ ] Fees Page (`/yuran`)
- [ ] Results Page (`/keputusan`)
- [ ] Reports Page (`/laporan`)
- [ ] Personal Settings (`/personal-settings`)
- [ ] System Settings (`/settings` - admin only)
- [ ] Registration Page (`/register`)
- [ ] Forgot Password (`/forgot-password`)
- [ ] All Users (`/all-users` - admin only)

### Optional Screenshots (For Enhanced Documentation)

- [ ] Payment Page (`/pay-yuran/:id`)
- [ ] Payment History (`/payment-history`)
- [ ] Pending Registrations (`/pending-registrations`)
- [ ] Admin Actions (`/admin-actions`)
- [ ] Announcements (`/announcements`)
- [ ] IB Dashboard (`/ib-dashboard`)
- [ ] Staff Check-in (`/staff-checkin`)
- [ ] Activity Timeline (`/activity-timeline`)
- [ ] Notification Center (`/notifications`)
- [ ] Help Center (`/help`)
- [ ] Contact Page (`/contact`)

---

## Notes for Screenshot Taking

- **Use Consistent Browser:** Take all screenshots using the same browser (Chrome recommended)

- **Resolution:** Use 1920x1080 or higher resolution for best quality

- **Window Size:** Use browser at full screen or consistent window size

- **Data:** Ensure the pages have sample data for better demonstration

- **Personal Information:** Blur or remove any real personal information before sharing

- **Multiple Roles:** You'll need to log in as different roles (student, teacher, admin) to capture role-specific views

- **Browser Console:** Close browser console before taking screenshots

- **Time:** Consider the time/date display if visible in screenshots

- **URL Bar:** Hide browser URL bar if you want cleaner screenshots

- **File Naming:** Name files descriptively, e.g., `01-login-page.png`, `02-dashboard-admin.png`

---

## Quick Access URLs

Copy and paste these URLs into your browser (replace localhost:3000 with your domain):

```
# Authentication
http://localhost:3000/login
http://localhost:3000/register
http://localhost:3000/forgot-password

# Dashboard (login required)
http://localhost:3000/

# Core Features
http://localhost:3000/pelajar
http://localhost:3000/guru
http://localhost:3000/kelas
http://localhost:3000/kehadiran
http://localhost:3000/yuran
http://localhost:3000/keputusan
http://localhost:3000/laporan

# Settings
http://localhost:3000/personal-settings
http://localhost:3000/settings

# Admin Pages (admin login required)
http://localhost:3000/all-users
http://localhost:3000/pending-registrations
http://localhost:3000/admin-actions
http://localhost:3000/announcements

# Other Pages
http://localhost:3000/payment-history
http://localhost:3000/help
http://localhost:3000/contact
http://localhost:3000/notifications
http://localhost:3000/activity-timeline
```

---

**Last Updated:** January 2025
**Manual Version:** 1.0

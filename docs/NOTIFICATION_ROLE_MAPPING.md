# Role-Based Notification Mapping

Notifications are **role-filtered at the backend**. Each role only receives notifications relevant to them. No role receives data meant for another role.

---

## Mapping Table

| Role | Trigger (Automatic) | Priority | Icon |
|------|--------------------|----------|------|
| **IB** | Successful ToyyibPay verification, large report generated, monthly reports ready, overdue confirmations, unverified documents | Info (🔵) | CheckCircle, FileCheck, AlertCircle |
| **Admin** | New user registered, system maintenance alerts, setting changes, PIC approvals, failed payments, unverified documents | High (🔴) | UserCheck, Wrench, ShieldCheck, XCircle, FileText |
| **PIC** | New student registration, teacher/class assignment, fee deadline passed, failed payments, results released | Medium (🟡) | UserCheck, BookOpen, CreditCard, XCircle, FileText |
| **Staff** | New attendance record created, results released for their area | Low (🔵) | CalendarCheck, Award |
| **Teacher** | Student submitted resit request, missing attendance for their class, results released | High (🔴) | RotateCcw, Clock, FileText |
| **Student** | Results published, fee reminder, resit application approved, document pending verification | Medium (🟡) | Award, CreditCard, CheckCircle, FileText |

---

## Backend Implementation

- **File:** `backend/services/notificationService.js`
- **Pattern:** `switch (role)` — each role has its own case block
- **Queries:** Only queries tables/rows relevant to that role
- **Action URLs:** Dynamic per role (e.g. Admin → `/pending-registrations`, Student → `/yuran`)

## Frontend

- **Icon mapping:** Backend returns `icon` (Lucide name). Frontend maps to component via `ICON_MAP`.
- **Category filter:** `ROLE_TO_CATEGORIES` limits which category buttons are shown per role.

## Security

- Staff does **not** receive IB notifications
- Students do **not** receive admin/PIC notifications
- All filtering is done server-side; `authenticateToken` and `requireRole` guard the API

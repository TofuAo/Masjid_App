# MyMasjidApp — Figma Design Specification

This document specifies all Figma pages, frames, and flows needed to document the MyMasjidApp project. Use it as a blueprint when creating your Figma file.

---

## Figma File Structure (Recommended)

Create a Figma file with the following **Pages** (top-level):

| Page Name | Purpose |
|-----------|---------|
| **1. Auth & Onboarding** | Login, register, forgot password, complete profile |
| **2. Role Dashboards** | Dashboard per role (Admin, PIC, Teacher, IB, Student) |
| **3. Students & Classes** | Pelajar, Kelas, Change Classes |
| **4. Attendance & Check-in** | Kehadiran, Staff Check-in, Quick Check-in |
| **5. Fees & Payments** | Yuran, Pay Yuran, Payment History, Resit |
| **6. Results & Reports** | Keputusan, Laporan |
| **7. Administration** | Admin-only pages (Users, Settings, etc.) |
| **8. IB & Payment Confirmation** | IB Dashboard, payment approval flows |
| **9. User Flows (Process)** | Flowcharts and user journey diagrams |
| **10. Components & States** | Reusable UI components, loading, error states |

---

## Page 1: Auth & Onboarding

### Frames to Create

| Frame Name | Route | Description |
|------------|-------|-------------|
| Login — Log Masuk Tab | `/login` | IC + password form, "Log Masuk" button |
| Login — Student Login Tab | `/login` | IC only form, "Student Login" tab |
| Login — Error State | — | Error message: "IC atau kata laluan salah" |
| Register (Self-Register) | `/register` | Link existing account: name, IC, password |
| Student Registration | `/student-register` | Full form: name, IC, email, phone, age, password |
| Teacher Registration | `/teacher-register` | Teacher sign-up form |
| Forgot Password | `/forgot-password` | Enter IC, choose reset method |
| Choose Reset Method | `/choose-reset-method` | Email or phone option |
| Reset Password | `/reset-password` | New password form |
| Reset Password Code | `/reset-password-code` | Enter code from email/phone |
| Complete Profile | `/complete-profile` | Required fields to complete profile |
| Pending Teacher Dashboard | `/pending-teacher` | Limited view for pending teachers |
| Pending Teacher Documents | `/pending-teacher/documents` | Upload documents for approval |
| Quick Staff Check-in (Public) | `/quick-checkin` | IC-only check-in without login |

### Flow Diagram (Reference for Figma)

```
[Login] → [Credentials Valid?] → No → [Error] → [Login]
                ↓ Yes
         [Profile Complete?] → No → [Complete Profile]
                ↓ Yes
         [Pending Teacher?] → Yes → [Pending Teacher Dashboard]
                ↓ No
         [Role-based Home]
```

---

## Page 2: Role Dashboards

### Frames to Create

| Frame Name | Route | Role | Description |
|------------|-------|------|-------------|
| Dashboard — Admin | `/` | admin | Stats, quick actions, admin widgets |
| Dashboard — PIC | `/` | pic | Stats, Pelajar, Kehadiran, Yuran quick links |
| Dashboard — Teacher | `/` | teacher | My classes, attendance, results |
| Dashboard — Staff | `/` | staff | Minimal: Dashboard + Communication |
| Dashboard — IB | `/ib-dashboard` | ib | Payment confirmation, reports |
| Dashboard — Student | `/account` | student | Account overview, fees, results |
| Welcome Modal | — | all | Onboarding modal (first login) |

### Sidebar Variants (per role)

- **Admin:** Full menu (Administration, Users, Pelajar, Kelas, Kehadiran, Yuran, Keputusan, Laporan, System, etc.)
- **PIC:** Pelajar, Guru, Kelas, Staff Check-in, Kehadiran, Yuran, Keputusan, Laporan
- **Teacher:** Pelajar, Kelas, Staff Check-in, Kehadiran, Keputusan
- **IB:** IB Account, IB Dashboard, Laporan
- **Student:** Account, Kehadiran, Yuran, Keputusan, Resit

---

## Page 3: Students & Classes

### Frames to Create

| Frame Name | Route | Description |
|------------|-------|-------------|
| Pelajar — List | `/pelajar` | Student list with search, filters |
| Pelajar — Add/Edit Form | `/pelajar` | Modal or form: name, IC, kelas, etc. |
| Pelajar — Detail | `/pelajar/:id` | Student profile, fees, attendance |
| Kelas — List | `/kelas` | Class list |
| Kelas — Add/Edit Form | `/kelas` | Class form |
| Kelas — Detail (Students in class) | `/kelas/:id` | Students in class |
| Change Classes | `/change-classes` | Admin: select student, new class, submit |

---

## Page 4: Attendance & Check-in

### Frames to Create

| Frame Name | Route | Description |
|------------|-------|-------------|
| Kehadiran — Main | `/attendance` | Class + date selector, attendance list |
| Kehadiran — Take Attendance | `/attendance/take` | Mark attendance for a class |
| Kehadiran — Class Date View | `/attendance/:classId/:date` | Per-class, per-date attendance |
| Kehadiran — Bulk Mark | — | Bulk status (Hadir/Tidak Hadir/Cuti) |
| Kehadiran — Proof Upload | — | Upload proof image (PIC approval) |
| Staff Check-in | `/staff-checkin` | GPS check-in, manual check-in |
| Staff Check-in — Success | — | "Check-in berjaya! Anda Xm dari masjid." |
| Staff Check-in — Outside | — | "Anda di luar kawasan. Jarak Xm." |
| Quick Check-in (Public) | `/quick-checkin` | IC input, no login |

---

## Page 5: Fees & Payments

### Frames to Create

| Frame Name | Route | Description |
|------------|-------|-------------|
| Yuran — List | `/yuran` | Fee list (by student/class/month) |
| Yuran — Add/Edit | `/yuran` | Fee form |
| Pay Yuran | `/pay-yuran/:id` | Payment options: ToyyibPay, QR |
| Pay Yuran — ToyyibPay Redirect | — | Redirect to payment gateway |
| Payment Return | `/payment/return` | Success/failure after payment |
| Payment History | `/payment-history` | List of payments |
| Resit (Receipts) | `/resit` | Receipt list, view/download |
| Receipt Viewer Modal | — | Receipt HTML/PDF preview |

---

## Page 6: Results & Reports

### Frames to Create

| Frame Name | Route | Description |
|------------|-------|-------------|
| Keputusan — Main | `/keputusan` | Exam session selector, results list |
| Keputusan — Grade Settings | — | Grade range modal |
| Keputusan — Result Form | — | Enter/edit marks |
| Keputusan — Student Detail | — | Student result detail modal |
| Laporan | `/laporan` | Report type, date range, export |

---

## Page 7: Administration (Admin Only)

### Frames to Create

| Frame Name | Route | Description |
|------------|-------|-------------|
| Pending Registrations | `/pending-registrations` | Approve/reject teacher registrations |
| PIC Approvals | `/pic-approvals` | PIC change approvals |
| Admins | `/admins` | Admin user list |
| All Users | `/all-users` | All users list |
| All User Detail | `/all-users/:ic` | User profile edit |
| PIC Users | `/pic-users` | PIC user management |
| Notification Center | `/notifications` | System notifications |
| Hierarchy | `/hierarchy` | Org structure |
| Permission Matrix | `/permission-matrix` | Role permissions |
| System Health | `/system-health` | System status |
| Audit Logs | `/audit-logs` | Audit trail |
| Settings | `/settings` | Masjid location, maintenance, QR |
| ToyyibPay Settings | `/toyyibpay-settings` | Payment gateway config |

---

## Page 8: IB & Payment Confirmation

### Frames to Create

| Frame Name | Route | Description |
|------------|-------|-------------|
| IB Dashboard | `/ib-dashboard` | Payment list, approve/flag actions |
| IB Dashboard — By Date | — | Approve payments by date |
| IB Account | `/ib-account` | IB profile/settings |
| Payment Approval Flow | — | Select payment → Approve or Flag with reason |

---

## Page 9: User Flows (Process Diagrams)

Create **Figma frames** that visualize these flows. You can use Figma's connector lines or embed Mermaid exports.

### Flow 1: Login (Staff/Admin/Teacher/PIC/IB)

```
MULA → Buka app → Log Masuk tab → IC + password → Submit
  → Valid? No → Error → Retry
  → Valid? Yes → Profile complete? No → Complete Profile
  → Profile complete? Yes → Pending teacher? Yes → Pending Dashboard
  → Pending teacher? No → Role-based home (/, /ib-dashboard, /account)
  → TAMAT
```

### Flow 2: Student Login

```
MULA → Student Login tab → IC only → Submit
  → IC registered & active? No → Error → Retry
  → Yes → /account → TAMAT
```

### Flow 3: Pay Yuran (Payment)

```
Yuran list → Select fee → Bayar → ToyyibPay
  → Redirect to gateway → User pays
  → Webhook → Backend updates status
  → Redirect to /payment/return → Receipt generated if completed
  → Payment History / Resit
```

### Flow 4: Attendance

```
Kehadiran → Select class + date → View list
  → Mark status (Hadir/Tidak Hadir/Cuti) → Save
  → Optional: Upload proof → PIC approves
```

### Flow 5: Teacher Registration → Approval

```
Teacher Register → Submit → Status: pending
  → Login → Pending Teacher Dashboard only
  → Upload documents → Admin approves
  → Status: active → Full Teacher access
```

### Flow 6: Staff Check-in (GPS)

```
Staff Check-in page → Allow GPS → Click Check-in
  → Within radius? Yes → Success toast
  → Within radius? No → "Outside location" warning
  → Timeout? → "Location unavailable" warning
```

---

## Page 10: Components & States

### Reusable Components to Document

| Component | States |
|-----------|--------|
| Button | Default, Hover, Loading, Disabled |
| Input (IC, Password) | Empty, Filled, Error, Disabled |
| Sidebar Item | Default, Active, Hover |
| Card (Stat) | Default, Loading skeleton |
| Modal | Open, Close |
| Toast | Success, Error, Warning, Info |
| Table | Empty, Loading, With data |
| Role Switcher | Dropdown, Selected role |

### Error States

- 401: Session expired, redirect to login
- 403: Unauthorized page
- 404: Not found
- Validation errors: Inline field errors
- Network error: Toast message

---

## Role-to-Screen Mapping (Quick Reference)

| Role | Key Screens |
|------|-------------|
| **Admin** | Dashboard, Pelajar, Guru, Kelas, Change Classes, Kehadiran, Yuran, Keputusan, Laporan, Pending Regs, PIC Approvals, Admins, All Users, Settings, System Health, Audit Logs |
| **PIC** | Dashboard, Pelajar, Guru, Kelas, Staff Check-in, Kehadiran, Yuran, Keputusan, Laporan, Pending Regs |
| **Teacher** | Dashboard, Pelajar, Kelas, Staff Check-in, Kehadiran, Keputusan |
| **Staff** | Dashboard, Staff Check-in, Communication |
| **IB** | IB Dashboard, IB Account, Laporan |
| **Student** | Account, Kehadiran, Yuran, Pay Yuran, Payment History, Keputusan, Resit |
| **Pending Teacher** | Pending Teacher Dashboard, Documents |

---

## Design Tokens (for Figma)

Use these from `src/index.css` / Tailwind for consistency:

- **Primary:** `mosque-primary-500`, `mosque-primary-600`
- **Background:** `mosque-gradient-light`, `islamic-pattern-bg`
- **Text:** `mosque-neutral-600`, `mosque-neutral-700`
- **Success:** green-500/600
- **Error:** red-500/600
- **Warning:** amber-500/600

---

## Export & Handoff Notes

1. **Frames:** Use 1440×900 or 375×812 for mobile variants.
2. **Prototyping:** Link frames per flow (e.g. Login → Dashboard).
3. **Annotations:** Add notes for API endpoints, validation rules.
4. **Variants:** Use Figma variants for role-based sidebar states.
5. **Mermaid:** Export diagrams from [mermaid.live](https://mermaid.live) as PNG/SVG and place in Figma.

---

## Related Documentation

- [USER_LOGIN_WORKFLOW.md](./USER_LOGIN_WORKFLOW.md) — Login flow detail
- [WORKFLOWS_BY_USER_TYPE.md](./WORKFLOWS_BY_USER_TYPE.md) — Per-role workflows
- [SYSTEM_WORKFLOWS_COMPLETE.md](./SYSTEM_WORKFLOWS_COMPLETE.md) — All workflows
- [ROLES_AND_ACCESS.md](./ROLES_AND_ACCESS.md) — Role permissions
- [SYSTEM_WORKFLOW_FLOWCHART.md](./SYSTEM_WORKFLOW_FLOWCHART.md) — End-to-end system flow

---

*Use this specification to create a complete Figma design file that documents all MyMasjidApp processes and screens.*

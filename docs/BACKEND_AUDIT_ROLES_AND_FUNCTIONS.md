# Backend Audit: Roles & Functions — MyMasjidApp

**Date:** 2026-02-12  
**Scope:** All backend routes, controllers, middleware, and role-based access control.

---

## 1. Roles Overview

| Role | Description | Primary Use |
|------|-------------|-------------|
| **admin** | System administrator | Full control, settings, user management |
| **pic** | Person in Charge | Daily operations with approval workflow for sensitive actions |
| **staff** | Staff member | Students, classes, attendance, fees (limited) |
| **teacher** | Teacher (Guru) | Own classes, attendance, students in classes |
| **student** | Student (Pelajar) | Own fees, results, resit, profile |
| **ib** | Informasi Bilangan (IB) | Payment confirmation, reports, document approval |

---

## 2. Route-by-Role Matrix

### Auth (`/api/auth`)
| Route | Roles | Notes |
|-------|-------|-------|
| POST /login | Public | |
| POST /student-login | Public | |
| POST /register | Public | |
| POST /self-register | Public | |
| GET /profile | All auth | |
| GET /profile/complete | All auth | |
| PUT /profile | All auth | |
| PUT /change-password | All auth | |
| PUT /admin/change-password | **admin** | |
| GET /pending-registrations | **admin** | |
| POST /approve-registration | **admin** | |
| POST /reject-registration | **admin** | |
| GET/PUT /preferences | All auth | |

### Students (`/api/students`)
| Route | Roles | Notes |
|-------|-------|-------|
| GET / | All auth | Filtered: teacher → own class students only |
| GET /stats | All auth | No role filter (global stats) |
| GET /:ic | All auth | **GAP:** Teacher can view any student |
| POST / | admin, staff, pic | PIC requires approval |
| PUT /:ic | admin, staff, pic | PIC requires approval |
| DELETE /:ic | admin, pic | PIC requires approval |

### Teachers (`/api/teachers`)
| Route | Roles | Notes |
|-------|-------|-------|
| POST /register | Public | No auth |
| GET / | All auth | |
| GET /stats | All auth | |
| GET /unassigned | **admin** | |
| POST /convert | **admin** | |
| GET /:ic | All auth | |
| POST / | admin, teacher | |
| PUT /:ic | admin, teacher | |
| DELETE /:ic | **admin** | |

### Classes (`/api/classes`)
| Route | Roles | Notes |
|-------|-------|-------|
| GET /dashboard/stats | **Public** | No auth — intentional? |
| GET / | All auth | Teacher can filter my_classes_only |
| GET /stats | All auth | |
| POST /change-class | admin, staff | |
| GET /:id | All auth | |
| POST / | admin, staff | |
| PUT /:id | admin, staff, teacher | Controller enforces: teacher only own classes |
| DELETE /:id | **admin** | |

### Attendance (`/api/attendance`)
| Route | Roles | Notes |
|-------|-------|-------|
| GET / | All auth | Filtered: student → own, teacher → own classes |
| GET /stats | All auth | No role filter |
| GET /today-overview | admin, pic | |
| GET /my-classes-today | **teacher** | |
| GET /student/:student_ic | All auth | **GAP:** No restriction for teacher/student |
| POST / | admin, staff, teacher, pic | PIC requires approval |
| POST /bulk | admin, staff, teacher, pic | PIC requires approval |
| POST /bulk-with-proof | admin, staff, teacher, pic | PIC requires approval |
| PUT /:id | admin, pic | PIC requires approval |
| DELETE /:id | admin, pic, teacher | PIC requires approval |
| POST /:id/confirm-document | admin, pic, ib | |

### Fees (`/api/fees`)
| Route | Roles | Notes |
|-------|-------|-------|
| GET / | All auth | Filtered: student → own, teacher → class students |
| GET /next-due | **student** | |
| GET /stats | All auth | **GAP:** Students see global stats |
| POST /generate-monthly | **admin** | |
| POST /sync-current-month | **admin** | |
| GET /:id | All auth | Controller checks: student/teacher access |
| POST / | admin, staff | |
| PUT /:id | admin, staff | |
| PUT /:id/mark-paid | admin, staff | |
| DELETE /:id | **admin** | |
| POST /:id/confirm-document | admin, pic, ib | |

### Results (`/api/results`)
| Route | Roles | Notes |
|-------|-------|-------|
| GET / | All auth | Filtered: student → own only |
| GET /stats | All auth | No role filter |
| GET /top-performers | All auth | No role filter |
| GET /:id | All auth | **GAP:** Student can view any result by ID |
| POST / | admin, staff | |
| PUT /:id | admin, staff | |
| DELETE /:id | **admin** | |

### IB (`/api/ib`)
| Route | Roles | Notes |
|-------|-------|-------|
| GET /reports | ib, admin | |
| GET /report | ib, admin | |
| GET /pending-confirmations-count | ib, admin | |
| POST /confirm | **ib** | |
| GET /class-documents | ib, admin | |
| POST /confirm-class-attendance | **ib** | |
| POST /confirm-class-fees | **ib** | |
| POST /approve-payments-by-date | **ib** | |
| GET /history | ib, admin | |
| GET /flagged-payments | ib, admin | |
| POST /flag-payment | **ib** | |
| GET /export/summary | ib, admin | |
| GET /export/history | ib, admin | |

### Admin API (`/api/admin`)
| Route | Roles | Notes |
|-------|-------|-------|
| GET /pending-approvals-summary | **admin** | |
| GET /students/:id/history | class.view permission | |
| /classes/* | Permission-based | class.view, class.change, class.rollback |

### Admins (`/api/admins`)
| Route | Roles | Notes |
|-------|-------|-------|
| GET / | **admin** | |
| GET /:ic | **admin** | |
| POST / | **admin** + Master | requireMasterAdmin |
| PUT /:ic | **admin** + Master | requireMasterAdmin |
| DELETE /:ic | **admin** + Master | requireMasterAdmin |

### PIC Users (`/api/pic-users`)
| Route | Roles | Notes |
|-------|-------|-------|
| GET / | **admin** | |
| POST / | **admin** | |
| PUT /:ic | **admin** | |
| DELETE /:ic | **admin** | |

### Users (`/api/users`)
| Route | Roles | Notes |
|-------|-------|-------|
| GET / | **admin** | |
| GET /:ic | **admin** | |

### Archive (`/api/archive`)
| Route | Roles | Notes |
|-------|-------|-------|
| GET /students | admin, staff | **BUG:** Missing `authenticateToken` |
| POST /students/:ic | admin, staff | **BUG:** Missing `authenticateToken` |
| POST /students/:ic/unarchive | admin, staff | **BUG:** Missing `authenticateToken` |

### Staff Check-in (`/api/staff-checkin`)
| Route | Roles | Notes |
|-------|-------|-------|
| POST /quick-check-in | Public | IC + password |
| POST /quick-check-out | Public | IC + password |
| POST /quick-check-in-shift | Public | IC + password |
| POST /quick-check-out-shift | Public | IC + password |
| POST /quick-last-action | Public | IC + password |
| GET /staff | **admin** | |
| POST /check-in | All auth | |
| POST /check-out | All auth | |
| GET /today-status | All auth | |
| POST /auto | All auth | |
| GET /history | All auth | **GAP:** Should limit to own or admin? |

### Resit (`/api/resit`)
| Route | Roles | Notes |
|-------|-------|-------|
| GET / | **student** | |
| POST /apply | **student** | |

### Exams (`/api/exams`)
| Route | Roles | Notes |
|-------|-------|-------|
| GET / | All auth | |
| POST / | **admin** | |
| GET /:id | All auth | |
| PUT /:id | **admin** | |
| DELETE /:id | **admin** | |

### Settings (`/api/settings`)
| Route | Roles | Notes |
|-------|-------|-------|
| GET /masjid-location | Public | |
| GET / | All auth | |
| GET /grade-ranges | All auth | |
| PUT /grade-ranges | **admin** | |
| GET /qr-code | All auth | |
| PUT /:key | **admin** | |

### Maintenance (`/api/maintenance`)
| Route | Roles | Notes |
|-------|-------|-------|
| GET /status | Public | |
| GET /types | Public | |
| POST /admin/activate | **admin** | |
| POST /admin/deactivate | **admin** | |
| POST /admin/emergency | **admin** | |
| POST /admin/schedule | **admin** | |
| GET /admin/history | **admin** | |

### Pending PIC Changes (`/api/pending-pic-changes`)
| Route | Roles | Notes |
|-------|-------|-------|
| GET / | **admin** | |
| GET /:id | **admin** | |
| POST /:id/approve | **admin** | |
| POST /:id/reject | **admin** | |

### Other Routes
- **Payments, Receipts, Notifications, Export, etc.** — Follow similar patterns; most admin-only where needed.

---

## 3. Issues Identified

### Critical (Security)

1. **Archive routes missing `authenticateToken`**
   - All archive routes use `requireRole(['admin', 'staff'])` but **never run `authenticateToken`**.
   - `req.user` is never set, so `requireRole` always returns 401.
   - **Effect:** Archive features are effectively broken for all users.

2. **`getResultById` — Student can view any result**
   - Route: `GET /api/results/:id`
   - No check that a student is viewing their own result.
   - **Effect:** Students can enumerate result IDs and view other students’ grades.

3. **`getStudentById` — Teacher can view any student**
   - Route: `GET /api/students/:ic`
   - No check that a teacher is viewing a student in their class.
   - **Effect:** Teachers can view any student’s full profile.

4. **`getStudentAttendanceHistory` — No role restriction**
   - Route: `GET /api/attendance/student/:student_ic`
   - Any authenticated user can view any student’s attendance history.
   - **Effect:** Privacy leak; teachers/students could view others’ attendance.

### Medium (Completeness / Consistency)

5. **`getFeeStats` — No role filter**
   - Students see global fee stats (total terbayar, tunggak, etc.).
   - Consider restricting to admins/staff or aggregating per-student for students.

6. **`getResultStats` / `getTopPerformers` — No role filter**
   - Any authenticated user can get global result stats and top performers.
   - May be acceptable for teachers; consider restricting for students.

7. **Result validation — IC format**
   - `student_ic` uses `.matches(/^\d{6}-\d{2}-\d{4}$/)` (strict hyphen format).
   - May break for S-prefixed student IDs or ICs without hyphens.

8. **`classes/dashboard/stats` — Public**
   - No authentication. Confirm if this is intentional for a public dashboard.

9. **Staff check-in `history` and `today-status`**
   - Any authenticated user can access. Consider limiting to staff roles or to own records.

### Minor (Enhancement)

10. **PIC role for fee operations**
    - Fees route allows `admin`, `pic`, `ib` for `confirm-document`, but `getAllFees` does not explicitly restrict PIC/IB.
    - Controller filters by student/teacher; PIC/IB see all. Confirm that this is intended.

11. **`role_permissions` table**
    - Used for `class.view`, `class.change`, `class.rollback`.
    - Ensure migrations populate it; `ensureClassAssignmentsDesign.js` creates and seeds it.

12. **Excessive logging in attendance router**
    - Debug logs on every request (e.g. `🔴🔴🔴 REQUEST REACHED ATTENDANCE ROUTER`) — consider removing or gating behind env.

---

## 4. Recommendations

### Immediate Fixes

1. **Archive routes — add `authenticateToken`**
   ```javascript
   router.use(authenticateToken);
   router.get('/students', requireRole(['admin', 'staff']), ...);
   ```

2. **`getResultById` — restrict students to own results**
   ```javascript
   if (req.user?.role === 'student' && results[0].student_ic !== req.user.ic) {
     return res.status(403).json({ success: false, message: 'Access denied' });
   }
   ```

3. **`getStudentById` — restrict teachers to own class students**
   ```javascript
   if (req.user?.role === 'teacher') {
     const [inClass] = await pool.execute(
       'SELECT 1 FROM students s JOIN classes c ON s.kelas_id = c.id WHERE s.user_ic = ? AND c.guru_ic = ?',
       [studentIc, req.user.ic]
     );
     if (inClass.length === 0) return res.status(403).json({ ... });
   }
   ```

4. **`getStudentAttendanceHistory` — add role-based filtering**
   - Students: only own IC.
   - Teachers: only students in their classes.
   - Others: admin, pic, staff, ib as appropriate.

### Enhancements to Consider

5. **Fee stats for students**
   - Return only own/summary stats for students instead of global aggregates.

6. **Result validation**
   - Relax or extend IC validation to support S-prefixed IDs and formats without hyphens.

7. **Staff check-in**
   - Restrict `history` and `today-status` to staff-related roles or to own records.

8. **Audit log**
   - Add an audit endpoint for sensitive actions (e.g. fee/result changes, class changes).

9. **Bulk operations**
   - Consider rate limiting or batch size limits for bulk attendance/fee operations.

10. **API documentation**
    - Add OpenAPI/Swagger for all endpoints and role requirements.

---

## 5. Role Permission Summary

| Role | Create | Read | Update | Delete | Special |
|------|--------|------|--------|--------|---------|
| **admin** | All* | All | All* | All* | Master admin for admins, maintenance, export |
| **pic** | Students, attendance (with approval) | All (filtered) | Students, attendance (with approval) | Students, attendance (with approval) | PIC approval workflow |
| **staff** | Students, classes, attendance, fees | All (filtered) | Students, classes, attendance, fees | — | Archive students |
| **teacher** | Attendance, teachers | Own classes/students | Own classes, attendance | Attendance | My classes today |
| **student** | — | Own fees, results, profile | Profile | — | Resit, next due fee |
| **ib** | — | Reports, documents | Confirm payments, documents | — | IB Dashboard, payment confirmation |

---

## 6. Frontend vs Backend Alignment

- `routeAccess.js` defines frontend route access; backend uses `requireRole` and controller checks.
- Some backend endpoints (e.g. `getAllFees`, `getAllResults`) use controller-level filtering instead of route-level `requireRole`.
- Frontend `ROUTE_ACCESS` does not cover all backend paths; consider syncing or deriving from a shared config.

---

*Document generated from backend codebase audit.*

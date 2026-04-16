# Three-Click UX Audit & Redesign

**Goal:** Make every core task completable in **≤ 3 clicks** for all user roles.

---

## Step 1 – User Roles and Key Tasks

| Role | Primary goals | Critical tasks |
|------|----------------|-----------------|
| **Admin** | Manage users, fees, approvals, system | Approve registrations, manage students/teachers/classes, record or oversee attendance, manage fees, view reports, settings |
| **PIC** | Masjid-level operations | Approve registrations, manage students/teachers/classes, record attendance, manage fees, view reports |
| **Teacher** | Teaching & attendance | Record attendance, enter results, view my classes & students |
| **Staff** | Daily operations | Staff check-in, record attendance |
| **IB** | Payment confirmation | Confirm payments (IB Dashboard), view reports |
| **Student** | Learning & fees | View attendance, pay fees, view results, view receipts, profile |

---

## Step 2 – Click Path Audit (Before)

### Student
| Task | Current path | Clicks | Issue? |
|------|--------------|--------|--------|
| Pay fee | Dashboard → Sidebar Finance → Yuran → Bayar Yuran (row) | 4 | Over 3 |
| Pay fee (Quick Action) | Dashboard → Bayar Yuran (quick) → Yuran → Bayar (row) | 3 | OK if Quick Actions work |
| View attendance | Dashboard → Kehadiran (or quick) | 1–2 | OK |
| View results | Dashboard → Keputusan | 2 | OK |
| My profile | Header menu → Profile → /settings | 2 | Students expect Account, not Settings |

### Admin / PIC
| Task | Current path | Clicks | Issue? |
|------|--------------|--------|--------|
| Approve registration | Dashboard → Administration → Kelulusan Pendaftaran → Approve | 3 | OK |
| Add student | Sidebar → Pelajar → Tambah Pelajar | 2 | OK |
| Record attendance | Dashboard → Kehadiran → (class/date) → Rekod | 3–4 | OK if default date/class |
| View reports | Quick Action "Laporan" → /reports | 1 | **Broken** – route is /laporan |

### Teacher / Staff
| Task | Current path | Clicks | Issue? |
|------|--------------|--------|--------|
| Quick Actions | Dashboard passes `user`, QuickActions expects `role` | - | **Broken** – staff/teacher may get no actions |
| Record attendance | Dashboard → Kehadiran (or quick) | 1–2 | OK when Quick Actions fixed |
| Staff check-in | Dashboard → Staff Check-in (widget link) | 1–2 | OK |

### IB
| Task | Current path | Clicks | Issue? |
|------|--------------|--------|--------|
| Confirm payments | Dashboard → IB Dashboard (widget or sidebar) | 1–2 | OK |
| Profile | Header → Profile → /settings | 2 | IB may expect /ib-account |

---

## Step 3 – Three-Click Redesign (Summary)

1. **QuickActions:** Derive `role` from `user` (fix broken role-based actions); fix report links `/reports` → `/laporan`; add `staff` to same actions as teacher.
2. **Student pay:** When next-due fee has `feeId`, link "Bayar Yuran" directly to `/pay-yuran/:id` so **Pay** = 2 clicks (Dashboard → Bayar Sekarang).
3. **Profile link (header):** Role-aware: Student → `/account`, IB → `/ib-account`, others → `/settings`.
4. **No role sees features they cannot use:** Already enforced by Layout sidebar and route guards.

---

## Step 4 – Code Updates

### 4.1 QuickActions.jsx
- **Change:** Accept `user` and derive `role` with `getEffectiveRole(user)` so Dashboard can keep passing `user`.
- **Change:** All links to `/reports` → `/laporan` (admin, teacher, PIC).
- **Change:** Add `case 'staff':` to return same actions as teacher (check-in, attendance, pelajar, kelas, laporan, notifications).

### 4.2 RoleFeatureWidgets.jsx (Student)
- **Change:** When `data.nextDue` has `feeId`, link "Bayar Yuran" to `/pay-yuran/${next.feeId}` instead of `/yuran`. Label can stay "Bayar Yuran" or "Bayar Sekarang" for clarity.

### 4.3 Layout.jsx (User dropdown)
- **Change:** Profile link: `to={effectiveRole === 'student' ? '/account' : effectiveRole === 'ib' ? '/ib-account' : '/settings'}`.

---

## Step 5 – Validation (After)

### Student
| Task | New path | Clicks |
|------|----------|--------|
| Pay fee (next due) | Dashboard → "Bayar Yuran" (widget → pay page) | **2** |
| Pay fee (other) | Dashboard → Yuran (quick or sidebar) → Bayar (row) | **3** |
| Profile | Header → Profile → /account | **2** |

### Admin / PIC / Teacher / Staff
| Task | New path | Clicks |
|------|----------|--------|
| Quick Actions | Role derived from user; staff get teacher-style actions | **1** (any quick action) |
| Reports | Quick Action "Laporan" → /laporan | **2** |
| Approve registration | Quick Access or Sidebar → Pending Reg → Approve | **2–3** |

### IB
| Task | New path | Clicks |
|------|----------|--------|
| Profile | Header → Profile → /ib-account | **2** |

---

## Assumptions and Trade-offs

- **Assumption:** "Click" = one intentional navigation (sidebar, quick action, or in-page button). Filling a form or selecting date/class counts as the same "task" once the right page is open.
- **Trade-off:** Student dashboard widget links to pay page only when next-due has a single fee id; otherwise we keep "Bayar Yuran" → Yuran list (still 3 clicks to pay).
- **Trade-off:** Staff and teacher share the same Quick Actions set; no separate "Staff-only" shortcuts beyond the existing check-in widget.
- **Accessibility:** All links remain keyboard- and screen-reader accessible; no removal of existing routes or functionality.

---

---

## Before / After Click Paths (Summary)

| Role | Task | Before | After |
|------|------|--------|--------|
| **Student** | Pay next fee | Dashboard → Sidebar Yuran → Row "Bayar" (3–4) | Dashboard → Widget "Bayar Sekarang" (2) |
| **Student** | Open profile | Header → Profile → Settings (wrong page) | Header → Profile → Account (2) |
| **Admin/PIC/Teacher** | Open reports | Quick Action → /reports (404) | Quick Action → /laporan (2) |
| **Teacher/Staff** | Quick Actions | Broken (role undefined) | Role from user; staff get teacher-style actions (1) |
| **IB** | Open profile | Header → Profile → Settings | Header → Profile → IB Account (2) |

*Last updated: 2026-02-11*

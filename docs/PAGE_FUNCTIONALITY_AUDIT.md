# Page Functionality Audit – MyMasjidApp

**Date:** 2026-02-19  
**Scope:** All pages routed in `App.jsx` (accessible after login)

---

## Summary

| Page | Route | Status | Notes |
|------|-------|--------|-------|
| Portal | `/`, `/portal` | ✅ Full | Stats, announcements, notifications; PIC gets 403 on pending count |
| Inbox | `/portal/inbox` | ✅ Full | Campus life approvals; admin only (PIC gets 403) |
| Squad | `/squad` | ⚠️ Stub | Static hub, all links → Carian |
| Club | `/club` | ⚠️ Stub | Static hub, links → CampusLife / Carian |
| FMPedia | `/fmpedia` | ✅ Partial | Tabbed wrapper for Carian + HelpCenter |
| CampusLife | `/campus-life` | ✅ Full | List, create, filter; API fixed (LIMIT/OFFSET) |
| Carian | `/carian` | ✅ Full | Search Pelajar/Staf/Arkib; role restrictions |
| HelpCenter | `/help` | ✅ Full | Static help content |
| Settings | `/settings` | ⚠️ Partial | Read-only profile; no update/password |
| NotificationCenter | `/notifications` | ✅ Full | List, mark read |

---

## 1. Portal (`/`, `/portal`)

**Status:** ✅ Full functionality

**API calls:**
- `studentsAPI.getStats()` → `/students/stats`
- `classesAPI.getStats()` → `/classes/stats`
- `announcementsAPI.getAll()` → `/announcements`
- `notificationAPI.getNotifications({})` → `/notifications`
- `adminAPI.getPendingApprovalsSummary()` → `/admin/pending-approvals-summary` (admin only)

**Backend:** All endpoints exist and work.

**Gap:** `getPendingApprovalsSummary` is restricted to `admin` role. Portal treats PIC as admin and calls it; PIC users receive 403. Pending count shows 0 for PIC.

---

## 2. Inbox (`/portal/inbox`)

**Status:** ✅ Full functionality (admin only)

**API calls:**
- `campusLifeAPI.list({ status: 'pending' })` → `GET /campus-life?status=pending`
- `campusLifeAPI.approve(id, { notes })` → `POST /campus-life/:id/approve`
- `campusLifeAPI.reject(id, { notes })` → `POST /campus-life/:id/reject`

**Backend:** All endpoints exist. Approve/reject are admin-only; PIC gets 403.

**Gap:** `routeAccess.js` lists `/executive-approvals` for admin + PIC, but Inbox uses campus-life approve/reject which is admin-only. If PIC should approve campus life items, backend must allow `pic` role.

---

## 3. Squad (`/squad`)

**Status:** ⚠️ Stub

**API calls:** None

**Functionality:** Static hub with 3 links (Overview, Medical, Pelajar/Profil), all pointing to `/carian`. No Squad-specific logic or data.

---

## 4. Club (`/club`)

**Status:** ⚠️ Stub

**API calls:** None

**Functionality:** Static hub with 3 links:
- Finances → `/campus-life`
- Staff → `/carian`
- Kehidupan Kampus → `/campus-life`

No Club-specific logic or data.

---

## 5. FMPedia (`/fmpedia`)

**Status:** ✅ Partial

**API calls:** None (delegates to Carian and HelpCenter)

**Functionality:** Tabbed wrapper. Shows Carian when `?q=` is present, otherwise HelpCenter. No FMPedia-specific APIs.

---

## 6. CampusLife (`/campus-life`)

**Status:** ✅ Full functionality

**API calls:**
- `campusLifeAPI.list({})` / `list({ status })` → `GET /campus-life`, `GET /campus-life?status=...`
- `campusLifeAPI.create(formData)` → `POST /campus-life`

**Backend:** All endpoints exist. Recent fix: LIMIT/OFFSET no longer use prepared-statement placeholders (resolved `Incorrect arguments to mysqld_stmt_execute`).

**Functionality:** List, create, filter by status (Semua, Menunggu, Diluluskan, Ditolak), status tiles, empty state. Non-admins see only their own items. No update/delete in UI.

---

## 7. Carian (`/carian`)

**Status:** ✅ Full functionality

**API calls:**
- `api.get('/students', { params })` → `GET /students`
- `usersAPI.getAll({ page, limit })` → `GET /users`
- `archiveAPI.getArchivedStudents({ search, page, limit })` → `GET /archive/students`

**Backend:** All endpoints exist.

**Role restrictions:**
- Pelajar: `/students` – generally available
- Staf: `/users` – admin only; others get 403
- Arkib: `/archive/students` – admin or staff; others get 403

---

## 8. HelpCenter (`/help`)

**Status:** ✅ Full functionality (static)

**API calls:** None

**Functionality:** Static help content with local search. No backend integration.

---

## 9. Settings (`/settings`)

**Status:** ⚠️ Partial (read-only)

**API calls:** None

**Functionality:** Displays profile from `user` prop / `localStorage` (nama, email, IC, peranan). No profile update, password change, or preferences. Read-only.

**Gap:** Backend has `/auth/profile`, `/auth/change-password`, `/auth/preferences` but Settings does not use them.

---

## 10. NotificationCenter (`/notifications`)

**Status:** ✅ Full functionality

**API calls:**
- `notificationAPI.getNotifications({})` → `GET /notifications`
- `notificationAPI.markNotificationRead(id)` → `POST /notifications/:id/read`

**Backend:** Both endpoints exist. Response handling supports `data?.notifications` and `data?.data`.

---

## Pages Not in App.jsx Routes

Many pages exist in `src/pages/` but are **not** routed in `App.jsx`. They redirect to `/portal` via the catch-all route:

- Dashboard, Kehadiran, Keputusan, Yuran, Pelajar, Kelas, Guru, etc.
- IbDashboard, PicApprovals, ExecutiveApprovals, etc.

These are only reachable if their routes are added to `App.jsx`.

---

## Recommendations

1. **Settings:** Add profile update, password change, and preferences using existing auth APIs.
2. **Portal / Inbox:** Decide if PIC should see pending count and approve campus life items; if yes, update backend to allow `pic` role.
3. **Squad / Club:** Either add real functionality (e.g. Squad = academic overview, Club = finances) or keep as navigation hubs.
4. **Carian:** Consider relaxing role restrictions for Staf/Arkib search if non-admin roles need access.

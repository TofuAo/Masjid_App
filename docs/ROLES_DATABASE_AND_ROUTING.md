# Roles, Shared Database, and Routing

All roles and all pages use the **same database** and the **same API**. Routing is consistent so the backend works correctly for every user type.

---

## 1. Single database (all roles, all pages)

- **Backend:** One MySQL connection pool in `backend/config/database.js`.
  - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (default `masjid_app`) from environment.
  - Every controller, service, and route that touches the DB imports `pool` from this file. There is no second pool or alternate DB for any role or feature.
- **Startup:** `server.js` calls `testConnection()` once; if it fails, the process exits. No role-specific or route-specific DB config.
- **Verification:** `GET /api/health` returns `database: "connected"` and `databaseName: "<DB_NAME>"`. All API requests use this same DB.

---

## 2. Single API base (frontend)

- **Frontend:** One axios instance in `src/services/api.js` with `baseURL: resolveApiBaseUrl()`.
  - `resolveApiBaseUrl()` (in `src/utils/apiBaseUrl.js`) returns either:
    - `VITE_API_BASE_URL` (if set, normalized to end with `/api`), or
    - On localhost: `http://localhost:5000/api`, or
    - Same origin + `/api` in production.
  - All pages (Dashboard, Pelajar, Guru, Kelas, Yuran, IB, etc.) use this same `api` instance or build URLs from `resolveApiBaseUrl()` (e.g. Yuran, IbAccount, ReceiptViewer, MaintenanceControl, MaintenanceModeBanner). No page uses a different API host or env (e.g. `REACT_APP_*`) for the backend.
- **Auth:** Token is sent via `Authorization: Bearer <token>` on every request (interceptor uses `authToken`). Backend resolves the user and roles from the same DB.

---

## 3. Backend routing (all under `/api`)

- **Mount:** In `server.js`, `app.use('/api', routes)` mounts all API routes under `/api`.
- **Index:** `backend/routes/index.js` mounts:
  - `/auth`, `/students`, `/teachers`, `/admins`, `/classes`, `/attendance`, `/exams`, `/fees`, `/results`, `/resit`, `/migration`, `/settings`, `/announcements`, `/google-form`, `/staff-checkin`, `/export`, `/pending-pic-changes`, `/pic-users`, `/archive`, `/payments`, `/payment-gateways`, `/toyyibpay`, `/contact`, `/ib`, `/users`, `/receipts`, `/maintenance`, `/weather`, `/quran-quote`, `/vllm`, `/notifications`, `/admin`
- So full paths are e.g. `/api/auth/login`, `/api/ib/reports`, `/api/fees`, `/api/students`, etc. No routes are mounted outside `/api` for app traffic (only `/health`, `/api/health`, `/uploads`, `/api/webhook/payment` are special).
- **404:** Any unmatched `/api/*` request is handled by the 404 handler and then the global error handler.

---

## 4. Role-based access (same DB, same API)

- **Auth:** `authenticateToken` in `backend/middleware/auth.js` loads the user from `users` (same pool), then attaches roles via `fetchUserRoles` (same DB). `req.user` is set for all protected routes.
- **Role checks:** `requireRole(['admin'])`, `requireRole(['ib', 'admin'])`, etc. use `req.user.activeRole` and `req.user.roles` (from the same DB). No role uses a different database or a different API mount.
- **Frontend:** `Layout.jsx` builds the menu from `getEffectiveRole(user)` and shows/hides links by role. Routes in `App.jsx` are the same for all authenticated users; access to data is enforced by the backend via `requireRole` and controller logic.

---

## 5. Quick verification

1. **Same DB:** Call `GET /api/health` and confirm `databaseName` is the expected DB (e.g. `masjid_app`). All roles hit this same backend and thus same DB.
2. **Same API:** In the browser, all XHR/fetch requests should go to the same origin + `/api/...` (or the configured `VITE_API_BASE_URL`). No page should call a different host or path prefix.
3. **Backend routing:** Log in as admin, teacher, student, IB, PIC and use the app; all actions (fees, attendance, reports, etc.) go through `/api/*` and the same pool.

---

## 6. Summary

| Item              | Detail                                                                 |
|-------------------|------------------------------------------------------------------------|
| Database          | Single MySQL DB; one pool in `backend/config/database.js`             |
| API base (frontend) | Single base URL via `resolveApiBaseUrl()`; one axios instance        |
| Backend routes    | All under `app.use('/api', routes)`                                   |
| Roles             | Same DB and same API; permissions enforced by `requireRole` and logic |
| Health            | `GET /api/health` returns `database`, `databaseName`, `status`       |

If all of the above hold, every role and every page share the same database and are routed correctly through one backend.

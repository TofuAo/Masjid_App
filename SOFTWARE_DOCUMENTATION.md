# MyMasjidApp — Software Documentation

---

## 1. Introduction

### 1.1 Purpose of This Document

This document provides comprehensive, professional software documentation for MyMasjidApp, a full-stack masjid/madrasah management system. It is intended to support long-term maintenance, onboarding of new developers, and consistent operation of the application.

### 1.2 Target Audience

- Developers — Moderate to advanced; comfortable with Node.js, React, MySQL, and Docker.
- System administrators — Responsible for deployment, configuration, and monitoring.
- Technical stakeholders — Requiring an overview of architecture, APIs, and security.

Readers are assumed to have basic familiarity with web applications, REST APIs, and relational databases.

### 1.3 High-Level Overview

MyMasjidApp is a web application that helps masjids and madrasahs manage:

- Students (Pelajar) — Registration, class assignment, attendance, fees, and exam results.
- Teachers (Guru) — Profiles, class assignment, and approval workflows.
- Classes (Kelas) — Schedules, capacity, fees, and student/teacher assignment.
- Attendance (Kehadiran) — Marking and reporting.
- Fees (Yuran) — Fee generation, payment tracking, and integration with ToyyibPay.
- Results (Keputusan) — Exams and grades; resit (resit) support.
- Administration — Roles (Admin, PIC, IB), permissions, audit logs, maintenance mode, and system health.

The system uses a yearly database model: each academic year can use a dedicated database (e.g. `masjid_app_2025`) for clean separation and easier backup/restore.

---

## 2. Installation and Setup

### 2.1 System Requirements

| Component    | Requirement |
|-------------|-------------|
| OS      | Windows 10+, Linux, or macOS (Docker-supported). |
| Node.js | v18+ (backend and tooling). |
| MySQL   | 8.0 (via Docker or standalone). |
| Docker  | Docker Engine 20+ and Docker Compose 2+ (recommended). |
| Browser | Modern browser (Chrome, Firefox, Edge, Safari). |

### 2.2 Prerequisites and Dependencies

- Backend: Node.js 18+, npm. Key packages: `express`, `mysql2`, `jsonwebtoken`, `bcryptjs`, `dotenv`, `helmet`, `cors`, `express-rate-limit`, `multer`, `nodemailer`, etc. (see `backend/package.json`).
- Frontend: Node.js 18+, npm. Key packages: `react`, `react-router-dom`, `axios`, `tailwindcss`, `lucide-react`, `react-toastify`, etc. (see `package.json`).
- Database: MySQL 8.0; schema and migrations under `database/`.

### 2.3 Step-by-Step Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd MyMasjidApp
   ```

2. Backend environment
   ```bash
   cd backend
   cp env.example .env
   # Edit .env: DB_*, JWT_SECRET, FRONTEND_URL, optional EMAIL_*, TOYYIBPAY_*, etc.
   npm install
   ```

3. Frontend
   ```bash
   cd ..   # project root
   npm install
   ```

4. Run with Docker (recommended)
   ```bash
   docker-compose up -d
   ```
   This starts MySQL, backend, frontend, optional vLLM, and Nginx. Frontend is typically at `http://localhost:3000`, backend at `http://localhost:5000` (or via Nginx).

5. Run without Docker (development)   - Start MySQL 8.0 and create the database; run `database/masjid_app_schema.sql` and any migrations.
   - Backend: `cd backend && npm run dev` (uses `nodemon`).
   - Frontend: `npm run dev` (Vite, usually port 5173).
   - Set `FRONTEND_URL` and ensure CORS/allowed origins include the frontend URL.

### 2.4 Configuration Options and Initial Setup

- Required: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`, `FRONTEND_URL`.
- Optional: `EMAIL_*`, `TWILIO_*`, ToyyibPay (`TOYYIBPAY_*`), `VLLM_API_URL`, `AWS_*` for S3, etc. See `backend/env.example`.
- Initial setup: Create a master admin (e.g. via `backend/scripts/createMasterAdmin.js`). Use the app to create further admins and configure roles (Admin, PIC, IB).

---

## 3. Getting Started

### 3.1 High-Level Architecture

```
[Browser] → [Nginx] → [Frontend (React/Vite)] → [Backend (Express)] → [MySQL]
                ↓              ↓                        ↓
           Static assets   API calls (/api/*)    Pooled connections
```

- Frontend: Single-page application (React 19, Vite). Uses Axios to call the backend; JWT stored in `localStorage` and sent as `Authorization: Bearer <token>`.
- Backend: Express REST API; JWT authentication; role- and permission-based access (admin, pic, ib, teacher, student).
- Database: MySQL with yearly DB support; `masjid_master` tracks active year and DB name.

### 3.2 Main Features and Functionality

- Authentication: Login, registration (student/teacher), password reset (email/SMS), profile completion.
- Student/Teacher/Class CRUD: Full lifecycle; class assignment and change-class workflow.
- Attendance: Mark by class/date; bulk mark; optional proof image and document confirmation.
- Fees: Create, mark paid, link to payments; ToyyibPay integration for online payments.
- Results/Resit: Exam sessions, grades, resit handling.
- Admin: Admins, PIC users, hierarchy, permission matrix, audit logs, system health, maintenance mode, settings, receipts.

### 3.3 Basic Usage Example

1. Log in as admin (or create master admin and log in).
2. Create a class (e.g. Kelas → Tambah Kelas).
3. Add students and assign them to the class.
4. Mark attendance (Kehadiran) and manage fees (Yuran).
5. Record exam results (Keputusan). Use Pay Yuran and ToyyibPay for payments.

### 3.4 Important Concepts and Terminology

| Term        | Meaning |
|------------|----------|
| IC     | Malaysian identity number; primary user identifier in many tables. |
| Kelas  | Class (teaching group). |
| Yuran  | Fee. |
| Kehadiran | Attendance. |
| Keputusan | Exam result. |
| Resit  | Resit / repeat exam. |
| Admin  | Full system administrator. |
| PIC    | Person in charge; restricted admin role. |
| IB     | Imam/Bilal or similar role; restricted dashboard. |

---

## 4. Code Structure

### 4.1 Directory and File Structure

```
MyMasjidApp/
├── backend/                 # Express API
│   ├── config/              # database.js, env.js
│   ├── controllers/        # Request handlers (auth, students, classes, etc.)
│   ├── guards/              # admin.guard.js
│   ├── middleware/         # auth.js, errorHandler.js, sanitize.js, upload.js, etc.
│   ├── routes/              # Route definitions (auth.js, students.js, admin.js, etc.)
│   ├── services/            # Business logic (paymentService, attendanceService, etc.)
│   ├── utils/               # Helpers (encryption, icUtils, pagination, etc.)
│   ├── schedulers/          # Cron jobs (backup, fee generation, reconciliation)
│   ├── scripts/             # DB and one-off scripts
│   ├── dto/                 # Data transfer objects
│   └── server.js            # Entry point
├── src/                     # React frontend
│   ├── components/          # Reusable UI and feature components
│   ├── pages/               # Route-level pages
│   ├── services/            # api.js, paymentAPI.js
│   ├── utils/               # apiBaseUrl, userRoles, grades, etc.
│   ├── contexts/            # PreferencesContext, LanguageContext
│   ├── hooks/               # useCrud, useErrorHandler, etc.
│   ├── config/              # seasonalSchemes.js
│   ├── App.jsx, Layout.jsx, main.jsx
│   └── index.css, App.css
├── database/                # SQL schema and migrations
├── docs/                    # Additional docs (e.g. Postman)
├── nginx/                   # Nginx configuration
├── docker-compose.yml
├── Dockerfile               # Frontend build
└── package.json             # Frontend root
```

### 4.2 Purpose of Major Modules

- backend/server.js: Loads env, validates config, mounts security middleware (Helmet, CORS, rate limit), routes, webhooks, error handler, and starts the HTTP server.
- backend/routes/index.js: Aggregates all API route modules (`/auth`, `/students`, `/classes`, `/admin`, etc.).
- backend/middleware/auth.js: JWT verification, role/permission checks (`requireRole`, `requirePermission`), and attachment of user/roles to `req`.
- backend/controllers: Handle HTTP request/response and call services where applicable.
- backend/services: Core logic (payments, attendance, fees, backups, notifications, etc.).
- src/services/api.js: Axios instance, interceptors (token, errors), and exported API functions for each domain.
- src/Layout.jsx: Sidebar navigation and role-based menu groups.
- src/App.jsx: Routes, lazy-loaded pages, auth/profile checks, and global UI (e.g. toast).

### 4.3 Interdependencies

- Frontend depends on backend API base URL (from `src/utils/apiBaseUrl.js`) and consistent API contract.
- Backend depends on MySQL (connection in `config/database.js`) and env (validated in `config/env.js`).
- Auth flow: Login returns JWT and user; frontend stores both; every protected API call sends the token; backend validates and enforces roles/permissions.
- Admin-only features use `requireRole(['admin'])` or `requirePermission(...)`; PIC/IB see reduced menus and endpoints.

---

## 5. API Documentation

### 5.1 Overview

All APIs are under `/api` (when using the default Nginx setup). Authentication uses a JWT in the header:

```http
Authorization: Bearer <token>
```

Responses are typically JSON with `success`, `data`, and optional `message` or `pagination`.

### 5.2 Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/api/auth/login` | Body: `{ emailOrIc, password }`. Returns token and user. |
| POST   | `/api/auth/register` | Student registration. |
| POST   | `/api/auth/forgot-password` | Initiate password reset. |
| GET    | `/api/auth/profile` | Current user profile (authenticated). |
| PUT    | `/api/auth/profile` | Update profile (authenticated). |

Sample request (login):
```json
POST /api/auth/login
Content-Type: application/json

{ "emailOrIc": "admin@example.com", "password": "secret" }
```

Sample response:
```json
{ "success": true, "token": "eyJ...", "user": { "ic": "...", "nama": "...", "role": "admin", ... } }
```

### 5.3 Students

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/students` | List students (query: page, limit, search, kelas_id). |
| GET    | `/api/students/:id` | Get one student. |
| POST   | `/api/students` | Create student. |
| PUT    | `/api/students/:id` | Update student. |
| DELETE | `/api/students/:id` | Delete student. |
| GET    | `/api/students/stats` | Aggregate stats. |
| POST   | `/api/students/import` | CSV import. |

### 5.4 Classes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/classes` | List classes (pagination, filters). |
| GET    | `/api/classes/:id` | Get one class. |
| POST   | `/api/classes` | Create class. |
| PUT    | `/api/classes/:id` | Update class. |
| DELETE | `/api/classes/:id` | Delete class. |
| POST   | `/api/classes/change-class` | Request class change (workflow). |

### 5.5 Attendance

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/attendance` | List attendance (params: class_id, date, etc.). |
| POST   | `/api/attendance` | Mark attendance. |
| POST   | `/api/attendance/bulk` | Bulk mark. |
| PUT    | `/api/attendance/:id` | Update record. |
| DELETE | `/api/attendance/:id` | Delete record. |
| GET    | `/api/attendance/stats` | Stats. |

### 5.6 Fees and Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/fees` | List fees. |
| POST   | `/api/fees` | Create fee. |
| PUT    | `/api/fees/:id/mark-paid` | Mark as paid. |
| GET    | `/api/payments` | List payments. |
| POST   | `/api/toyyibpay/create-bill` | Create ToyyibPay bill (body: amount, student ref, etc.). |

### 5.7 Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/admin/classes` | Admin class list. |
| GET    | `/api/admin/classes/:classId/students` | Students in class. |
| POST   | `/api/admin/classes/change` | Apply class change. |
| POST   | `/api/admin/classes/rollback` | Rollback change. |
| GET    | `/api/admin/students/:id/history` | Student history (permission: class.view). |

Other routes: admins, settings, export, audit logs, maintenance, notifications, receipts, etc. Access is controlled by `requireRole` or `requirePermission`.

---

## 6. Configuration and Customisation

### 6.1 Configuration Files and Environment Variables

- Backend: `backend/.env` (from `backend/env.example`). Variables include:
  - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
  - `JWT_SECRET`, `JWT_EXPIRES_IN`
  - `PORT`, `FRONTEND_URL`, `BACKEND_URL`
  - `EMAIL_*`, `TWILIO_*`, ToyyibPay (`TOYYIBPAY_*`), `VLLM_API_URL`, `AWS_*`, etc.
- Frontend: Build-time base URL often derived from env or `src/utils/apiBaseUrl.js` (e.g. relative `/api` or full `BACKEND_URL`).
- Docker: `docker-compose.yml` and optional `docker-compose.prod.yml`; env can be set in file or host environment.

### 6.2 Customisation for Different Use Cases

- Multiple years: Use yearly DBs and point backend to the active DB name (handled via master DB or env).
- Payment gateway: Configure ToyyibPay (or other gateway) in env and in Settings; callback/return URLs must match deployment.
- Email/SMS: Set `EMAIL_*` and/or `TWILIO_*` for notifications and password reset.
- Themes/UI: Frontend uses Tailwind and config in `src/config/seasonalSchemes.js`; adjust components and CSS as needed.

### 6.3 Best Practices and Recommended Configurations

- Use a strong, unique `JWT_SECRET` in production.
- Set `NODE_ENV=production` and restrict `FRONTEND_URL`/CORS to known origins.
- Enable HTTPS in production (Nginx/Let’s Encrypt).
- Run DB backups via the built-in schedulers and retain copies off-server.
- Restrict admin and PIC creation to trusted users; review audit logs periodically.

---

## 7. Troubleshooting and FAQs

### 7.1 Common Issues and Solutions

| Issue | Possible cause | Solution |
|-------|----------------|----------|
| 401 Unauthorized | Missing or expired JWT | Re-login; check token expiry and storage. |
| 403 Forbidden | Role or permission insufficient | Verify user role and permission matrix. |
| DB connection failed | Wrong host/port/credentials or MySQL not running | Check `DB_*` in `.env` and MySQL process. |
| CORS errors | Frontend origin not allowed | Add frontend URL to `FRONTEND_URL` / CORS config. |
| Payments not updating | Callback URL wrong or gateway misconfigured | Verify ToyyibPay callback URL and env. |
| Upload fails | Multer path or permissions | Ensure upload directory exists and is writable. |

### 7.2 Error Messages

- "Sesi anda telah tamat tempoh" — Token expired; user must log in again.
- "Insufficient permissions" — User role does not have the required permission for the action.
- "Failed to load documentation" — Removed in current version; ignore if you see legacy references.
- "Environment validation failed" — Required env vars missing; check `backend/config/env.js` and `.env`.

### 7.3 FAQs

Q: How do I create the first admin?
A: Run the master admin script (e.g. `node backend/scripts/createMasterAdmin.js`) and then log in; create further admins from the Admins page.

Q: How do I change the active year database?
A: Update the master database or configuration that points the backend to the correct DB name for the active year; restart backend if needed.

Q: Can I run without Docker?
A: Yes. Install Node and MySQL, set `.env`, run migrations, then start backend and frontend dev servers separately.

Q: Where are uploads stored?
A: By default in `backend/uploads` (or path configured for Multer); in Docker this is often mounted from host (e.g. `./uploads:/app/uploads`).

---

## 8. Performance Optimization

### 8.1 Techniques for Improving Performance

- Database: Use indexes on frequently queried columns (e.g. `student_ic`, `class_id`, `tarikh`). Paginate large lists (students, attendance, fees).
- Backend: Reuse connection pool; avoid N+1 queries; cache heavy reads (e.g. settings) with in-memory cache where appropriate.
- Frontend: Lazy-load route components (already used in `App.jsx`); minimize large re-renders; use list virtualization for very long tables if needed.
- Static assets: Serve frontend build via Nginx with caching headers; use production build for deployment.

### 8.2 Resource Management

- Limit upload size in Multer and Nginx to avoid oversized requests.
- Use rate limiting (already in place) to protect against abuse.
- Schedule heavy jobs (backup, fee generation) during off-peak times.
- Monitor MySQL connections and tune pool size if necessary.

### 8.3 Profiling and Benchmarking

- Use Node.js built-in or external profilers for backend CPU/memory.
- Use browser DevTools (Network, Performance) for frontend.
- MySQL: slow query log and `EXPLAIN` for heavy queries.
- Optional: APM tools (e.g. New Relic, Datadog) for production.

---

## 9. Security Considerations

### 9.1 Potential Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Weak JWT secret | Use a long, random `JWT_SECRET`; rotate periodically. |
| SQL injection | Parameterized queries (mysql2); avoid raw concatenation. |
| XSS | Sanitization middleware; React escaping; CSP headers (Helmet). |
| Unauthorized access | JWT validation on every protected route; role/permission checks. |
| Brute force | Rate limiting on login and sensitive endpoints. |
| Sensitive data in logs | Avoid logging passwords, tokens, or full ICs. |

### 9.2 Secure Coding Practices

- Validate and sanitize input (express-validator, sanitize middleware).
- Hash passwords with bcrypt (or equivalent).
- Prefer HTTPS in production; set secure cookie flags if using cookies.
- Keep dependencies updated; run `npm audit` and fix critical issues.
- Principle of least privilege: grant minimum roles/permissions needed.

### 9.3 Authentication and Authorization

- Authentication: Login returns a JWT; frontend stores it and sends it on each request. Backend verifies signature and expiry in `authenticateToken`.
- Authorization: After authentication, `requireRole(['admin'])` or `requirePermission('permission.code')` restrict access. Roles (admin, pic, ib, teacher, student) and optional permission matrix define what each role can do; PIC and IB have restricted menus and API access.

---

## 10. Limitations and Future Enhancements

### 10.1 Known Limitations

- Documentation: The in-app documentation page and .docx generation have been removed; all official documentation is this markdown and the README.
- vLLM: Optional; requires GPU for heavy use; may be disabled in Docker if not needed.
- Yearly DB: Switching the active year may require config/DB change and restart.
- Mobile: UI is responsive but not a dedicated native app; PWA/offline support is limited.
- Localisation: Primary language is Malay with some English; full i18n may require additional work.

### 10.2 Areas for Improvement

- Automated tests (unit and integration) for backend and frontend.
- OpenAPI/Swagger spec for the API.
- Stronger audit trail for sensitive actions (e.g. role changes, bulk deletes).
- Optional two-factor authentication.
- Export/reporting in more formats (PDF, Excel) where not already present.
- Improved accessibility (ARIA, keyboard navigation).

### 10.3 Future Roadmap

- Expand payment gateways and reconciliation tooling.
- Richer reporting and dashboards.
- Mobile-friendly PWA or native app.
- Optional multi-tenancy for multiple masjids.
- API versioning for backward compatibility.

---

## 11. References

### 11.1 External Resources and Tools

- [Express.js](https://expressjs.com/)
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [MySQL 8.0](https://dev.mysql.com/doc/)
- [Docker](https://docs.docker.com/)
- [JWT](https://jwt.io/)
- [ToyyibPay](https://toyyibpay.com/) (payment gateway)
- [Nodemailer](https://nodemailer.com/) (email)
- [Twilio](https://www.twilio.com/docs) (SMS, optional)

### 11.2 Libraries and Frameworks (Summary)

- Backend: express, mysql2, jsonwebtoken, bcryptjs, helmet, cors, express-rate-limit, multer, nodemailer, dotenv, express-validator, node-cron, xlsx, archiver, googleapis, twilio, uuid.
- Frontend: react, react-dom, react-router-dom, axios, tailwindcss, lucide-react, react-toastify, xlsx, qrcode.react, html2pdf.js, file-saver.

---

## 12. Appendix

### 12.1 Sample Code Snippets

Calling the API from the frontend (after login):
```javascript
import { studentsAPI } from './services/api';

// List students with pagination
const data = await studentsAPI.getAll({ page: 1, limit: 20, search: 'Ahmad' });

// Create student
await studentsAPI.create({ nama: 'Ahmad', ic: '...', kelas_id: 1, ... });
```

Protected route (backend):
```javascript
import { authenticateToken, requireRole } from '../middleware/auth.js';

router.get('/admin-only', authenticateToken, requireRole(['admin']), (req, res) => {
  res.json({ message: 'Admin only' });
});
```

### 12.2 Glossary of Terms

| Term | Definition |
|------|------------|
| IC | Malaysian National Registration Identity Card number. |
| JWT | JSON Web Token; used for session authentication. |
| PIC | Person in Charge; limited admin role. |
| IB | Imam/Bilal; role with restricted dashboard. |
| Yuran | Fee (e.g. monthly class fee). |
| Kelas | Class (teaching group). |
| Kehadiran | Attendance. |
| Keputusan | Exam result. |
| Resit | Resit / repeat examination. |
| ToyyibPay | Malaysian payment gateway integrated for fee payments. |

### 12.3 Additional Resources

- README.md — Quick start and project overview.
- backend/env.example — List of environment variables and comments.
- database/ — Schema and migrations for reference.
- docs/ — e.g. Postman collection for API testing.

---

*Document version: 1.0. Last updated: February 2025.*

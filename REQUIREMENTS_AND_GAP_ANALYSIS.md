# MyMasjidApp - Requirements & Gap Analysis

## Document Purpose
This document maps the current system state to the defined requirements and identifies implementation gaps.

---

## 1️⃣ Roles Defined in the System

### Requirements
- Admin
- Big Boss / Approver
- PIC
- Teacher
- Student
- Pending Teacher (Pre-Approval State)

### Current State
✅ **Implemented:**
- Admin (`role = 'admin'`)
- PIC (`role = 'pic'`)
- Teacher (`role = 'teacher'`)
- Student (`role = 'student'`)
- IB (Payment Approver) - exists but not mentioned in requirements

❌ **Missing:**
- Big Boss / Approver - Not implemented as separate role
- Pending Teacher - Currently handled via `status = 'pending'` but not as a distinct role/state with specific UI

### Gap Analysis
- **Big Boss/Approver**: Need to define if this is:
  - A separate role in database
  - A permission flag on admin/PIC users
  - A role alias (e.g., admin with approval permissions)
- **Pending Teacher**: Need to implement:
  - Specific UI/UX for pending teachers
  - Limited access dashboard
  - Profile completion flow
  - Document upload capability

---

## 2️⃣ Admin Pages & Their Functions

### Core & Communication

| Page | Status | Notes |
|------|--------|-------|
| Dashboard | ✅ Implemented | System overview exists |
| Bantuan (Help) | ✅ Implemented | `/help` route exists |
| Hubungi Kami (Contact) | ✅ Implemented | `/contact` route exists |
| Pengumuman (Announcements) | ✅ Implemented | `/announcements` route exists |

### Operations

| Page | Status | Notes |
|------|--------|-------|
| Check In / Out | ✅ Implemented | `/staff-checkin` route exists |
| Kehadiran (Attendance) | ✅ Implemented | `/kehadiran` route exists |
| Kelas (Classes) | ✅ Implemented | `/kelas` route exists |

### Approvals & Governance

| Page | Status | Notes |
|------|--------|-------|
| Kelulusan Pendaftaran | ✅ Implemented | `/pending-registrations` route exists |
| Kelulusan PIC | ✅ Implemented | `/pic-approvals` route exists |
| Tong Sampah (Recycle Bin) | ✅ Implemented | `/admin-actions` route exists |

### User & Role Management

| Page | Status | Notes |
|------|--------|-------|
| Pengguna PIC | ✅ Implemented | `/pic-users` route exists |
| Pengurusan Admin | ✅ Implemented | `/admins` route exists |
| Semua Pengguna | ✅ Implemented | `/all-users` route exists |
| Hierarki Sistem | ✅ Implemented | `/hierarchy` route exists |

### Academic & Finance

| Page | Status | Notes |
|------|--------|-------|
| Pelajar (Students) | ✅ Implemented | `/pelajar` route exists |
| Guru (Teachers) | ✅ Implemented | `/guru` route exists |
| Yuran (Fees) | ✅ Implemented | `/yuran` route exists |
| Keputusan (Results) | ✅ Implemented | `/keputusan` route exists |
| Laporan (Reports) | ✅ Implemented | `/laporan` route exists |
| Tetapan (Settings) | ✅ Implemented | `/settings` route exists |
| Tetapan ToyyibPay | ✅ Implemented | `/toyyibpay-settings` route exists |

### Summary
✅ **All admin pages are implemented** - No gaps identified

---

## 3️⃣ Admin Feature Improvements / Add-ons

### High Priority

| Feature | Status | Notes |
|---------|--------|-------|
| Audit logs | ⚠️ Partial | Admin actions tracked, but no dedicated audit log page |
| Notification center | ❌ Missing | No notification system for pending approvals/failures |
| Bulk actions | ⚠️ Partial | Some bulk operations exist, but not comprehensive |
| Role & permission matrix | ⚠️ Partial | Permission matrix page exists but may need enhancement |
| System health/status page | ❌ Missing | No dedicated system health page |

### Medium Priority

| Feature | Status | Notes |
|---------|--------|-------|
| Approval notes | ❌ Missing | No notes/reason field for approve/reject actions |
| Data import/export (Excel) | ⚠️ Partial | Some export exists, import may be limited |
| Global search | ❌ Missing | No global search functionality |

### Advanced / Optional

| Feature | Status | Notes |
|---------|--------|-------|
| Automation rules | ❌ Missing | Not implemented |
| Analytics & insights | ⚠️ Partial | Basic reports exist, advanced analytics missing |
| Backup & restore | ❌ Missing | Not implemented |
| Templates | ❌ Missing | No templates for announcements/emails |

---

## 4️⃣ Teacher Pages & Improvements

### Teacher Pages

| Page | Status | Notes |
|------|--------|-------|
| Dashboard | ✅ Implemented | Role-based dashboard exists |
| Bantuan | ✅ Implemented | `/help` route accessible |
| Hubungi Kami | ✅ Implemented | `/contact` route accessible |
| Pengumuman | ✅ Implemented | `/announcements` route accessible |
| Check In / Out | ✅ Implemented | `/staff-checkin` route exists |
| Hierarki Sistem | ✅ Implemented | View-only access |
| Pelajar | ✅ Implemented | Filtered to assigned classes only |
| Kelas | ✅ Implemented | Shows assigned classes |
| Kehadiran | ✅ Implemented | Filtered to assigned classes |
| Keputusan | ✅ Implemented | `/keputusan` route exists |
| Tetapan | ✅ Implemented | `/personal-settings` route exists |

### Teacher Improvements

| Feature | Status | Notes |
|---------|--------|-------|
| Today-focused dashboard | ⚠️ Partial | Dashboard exists but may not be optimized for "today" |
| Quick actions | ❌ Missing | No quick action buttons for attendance/results |
| Task / to-do list | ❌ Missing | No task management |
| Student progress tracker | ❌ Missing | No progress tracking view |
| Class journal / teaching log | ❌ Missing | No journal/log feature |
| Teaching materials upload | ❌ Missing | No materials management |
| Mobile-first UX | ⚠️ Partial | Responsive but not optimized for mobile-first |

---

## 5️⃣ Pending Teacher (Pre-Approval) Design

### Allowed for Pending Teacher

| Feature | Status | Notes |
|---------|--------|-------|
| Login access | ⚠️ Partial | Can login but may be blocked by status check |
| Pending approval dashboard | ❌ Missing | No specific dashboard for pending teachers |
| Complete profile & upload documents | ❌ Missing | No profile completion flow |
| View system guide (read-only) | ✅ Implemented | `/help` accessible |
| Contact admin/support | ✅ Implemented | `/contact` accessible |
| Change password | ✅ Implemented | Password change exists |

### Not Allowed

| Feature | Status | Notes |
|---------|--------|-------|
| Access students | ✅ Blocked | Role-based access control works |
| Access classes | ✅ Blocked | Role-based access control works |
| Take attendance | ✅ Blocked | Role-based access control works |
| Enter results | ✅ Blocked | Role-based access control works |
| Send announcements | ✅ Blocked | Role-based access control works |
| View other teachers | ✅ Blocked | Role-based access control works |

### Status Flow

| Flow | Status | Notes |
|------|--------|-------|
| Pending → Approved → Full access | ⚠️ Partial | Approval exists but may need status transition logic |
| Pending → Rejected → Limited access / reapply | ❌ Missing | No rejection flow with reapply option |

### Gap Analysis
**Critical Gap**: Pending Teacher experience needs complete implementation:
1. Create pending teacher dashboard component
2. Implement profile completion flow
3. Add document upload capability
4. Create status transition UI
5. Add rejection/reapply flow

---

## 6️⃣ Student Features (My Account)

### Student Can View

| Feature | Status | Notes |
|---------|--------|-------|
| Attendance summary & history | ✅ Implemented | `/account` page has attendance tab |
| Attendance percentage | ⚠️ Partial | May need calculation/display enhancement |
| Fees summary (total, paid, outstanding) | ✅ Implemented | Fees tab exists with payment history |
| Payment history | ✅ Implemented | Payment receipts visible |

### Student Restrictions

| Restriction | Status | Notes |
|-------------|--------|-------|
| Read-only | ✅ Enforced | Students have read-only access |
| Only own data | ✅ Enforced | API filters by student IC |
| No access to other students | ✅ Enforced | Role-based access control |

### Gap Analysis
**Minor Gap**: Attendance percentage calculation/display may need enhancement

---

## 7️⃣ API & Architecture Notes

### Recommended API Design

| Endpoint | Status | Notes |
|----------|--------|-------|
| GET /api/student/attendance | ✅ Implemented | Exists in attendance API |
| GET /api/student/fees | ✅ Implemented | Exists in fees API |

### Security Rules

| Rule | Status | Notes |
|------|--------|-------|
| Student ID derived from auth token | ✅ Implemented | Middleware extracts user from token |
| No student_id in query params | ⚠️ Partial | Some endpoints may still accept student_id |
| Role-based API access | ✅ Implemented | `requireRole` middleware exists |

### Common API Issues Identified

| Issue | Status | Notes |
|-------|--------|-------|
| student_id not passed correctly | ⚠️ Needs Review | Should verify all endpoints use auth token |
| wrong DB relationships | ⚠️ Needs Review | Database schema should be audited |
| role-based middleware blocking data | ✅ Working | Middleware correctly enforces access |
| frontend field mismatch | ⚠️ Needs Review | Should audit frontend/backend field alignment |

---

## 8️⃣ Security Features (Complete List)

### Authentication & Access

| Feature | Status | Notes |
|---------|--------|-------|
| Login authentication | ✅ Implemented | JWT-based auth exists |
| Strong password policy | ✅ Implemented | Password validation exists |
| Multi-factor authentication (MFA) | ❌ Missing | Not implemented |
| Session timeout | ✅ Implemented | JWT expiration configured |
| Single-session/device control | ❌ Missing | Not implemented |

### Authorization

| Feature | Status | Notes |
|---------|--------|-------|
| Role-based access control (RBAC) | ✅ Implemented | `requireRole` middleware exists |
| Permission matrix (CRUD) | ⚠️ Partial | Permission matrix page exists |
| Read-only mode | ✅ Implemented | Role-based read-only enforced |

### Approval & Governance

| Feature | Status | Notes |
|---------|--------|-------|
| Multi-level approvals | ⚠️ Partial | Approval system exists but may need multi-level |
| Approval notes | ❌ Missing | No notes/reason field |
| Approval locking | ❌ Missing | No locking mechanism |

### Audit & Monitoring

| Feature | Status | Notes |
|---------|--------|-------|
| Audit logs | ⚠️ Partial | Admin actions tracked, but no dedicated page |
| User activity history | ⚠️ Partial | Some activity tracking exists |
| Admin action alerts | ❌ Missing | No alert system |

### Data Protection

| Feature | Status | Notes |
|---------|--------|-------|
| Encryption at rest | ❌ Missing | Database encryption not configured |
| Encryption in transit (HTTPS) | ⚠️ Partial | Depends on deployment |
| Sensitive data masking | ⚠️ Partial | Some masking exists, may need enhancement |

### Deletion & Recovery

| Feature | Status | Notes |
|---------|--------|-------|
| Soft delete (Recycle Bin) | ✅ Implemented | `/admin-actions` and `/pic-recycle-bin` exist |
| Restricted permanent deletion | ✅ Implemented | Admin-only permanent deletion |

### System Protection

| Feature | Status | Notes |
|---------|--------|-------|
| Rate limiting | ✅ Implemented | Rate limiting middleware exists |
| CAPTCHA | ❌ Missing | Not implemented |
| IP whitelisting (optional) | ❌ Missing | Not implemented |

### Payment Security

| Feature | Status | Notes |
|---------|--------|-------|
| Secure gateway (ToyyibPay) | ✅ Implemented | ToyyibPay integration exists |
| Webhook verification | ⚠️ Needs Review | Should verify webhook security |
| Payment reconciliation logs | ⚠️ Partial | Payment history exists, reconciliation may need enhancement |

### Backup & Compliance

| Feature | Status | Notes |
|---------|--------|-------|
| Automated backups | ❌ Missing | Not implemented |
| Disaster recovery | ❌ Missing | Not implemented |
| Data access logs | ⚠️ Partial | Some logging exists |
| Privacy controls | ⚠️ Partial | Role-based access provides some privacy |

---

## 9️⃣ Hosting & Deployment (Free Stack)

### Allowed Costs
✅ Domain only (from Shinjiru) - Allowed

### Free Hosting Stack

| Service | Status | Notes |
|---------|--------|-------|
| Frontend: Vercel / Netlify | ⚠️ Not Configured | Currently using Docker, needs migration |
| Backend: Render (Free tier) | ⚠️ Not Configured | Currently using Docker, needs migration |
| Database: Supabase / Firebase / MongoDB Atlas | ⚠️ Not Configured | Currently using MySQL in Docker |
| Payments: ToyyibPay | ✅ Implemented | ToyyibPay integration exists |

### Limitations
- Sleeping servers
- Limited resources
- No SLA
- Not ideal for large production use

### Gap Analysis
**Migration Required**: System is currently Docker-based, needs migration to free hosting stack:
1. Frontend → Vercel/Netlify
2. Backend → Render
3. Database → Supabase/Firebase/MongoDB Atlas

---

## 🔟 Render Backend Setup Summary

### Steps

| Step | Status | Notes |
|------|--------|-------|
| Push backend to GitHub | ✅ Ready | Backend code is in repo |
| Create Render Web Service | ❌ Pending | Not done |
| Set build & start commands | ❌ Pending | Not configured |
| Bind app to process.env.PORT | ⚠️ Needs Review | Should verify port binding |
| Add environment variables | ❌ Pending | Not configured on Render |
| Deploy & test Render URL | ❌ Pending | Not deployed |
| Add custom domain: api.kelaspengajianmnsa1.asia | ❌ Pending | Not configured |
| Configure DNS (CNAME) in Shinjiru | ❌ Pending | Not done |
| Enable HTTPS (automatic) | ⚠️ Pending | Render provides automatic HTTPS |

### Best Practice

| Practice | Status | Notes |
|----------|--------|-------|
| Use subdomain for backend (api.) | ✅ Planned | Domain specified |
| Do not hardcode ports | ⚠️ Needs Review | Should audit for hardcoded ports |
| Disable debug mode in production | ⚠️ Needs Review | Should verify debug mode is disabled |

---

## 1️⃣1️⃣ Design Principles Agreed

| Principle | Status | Notes |
|-----------|--------|-------|
| Least privilege access | ✅ Implemented | Role-based access control enforces this |
| Pending users get limited access, not blocked | ⚠️ Partial | Pending teachers need specific UI |
| Teachers optimized for speed (≤3 clicks) | ⚠️ Partial | May need UX optimization |
| Admin focused on control & accountability | ✅ Implemented | Admin features support this |
| Students are read-only viewers | ✅ Implemented | Students have read-only access |
| Start free → validate → scale later | ✅ Aligned | Free hosting stack planned |

---

## Implementation Priority

### Critical (Must Have)
1. **Pending Teacher Experience** - Complete implementation of pending teacher dashboard and profile completion
2. **Approval Notes** - Add notes/reason field for approve/reject actions
3. **Notification Center** - System for pending approvals and failures

### High Priority
4. **Audit Logs Page** - Dedicated page for viewing audit logs
5. **System Health Page** - Monitor system status
6. **Teacher Quick Actions** - Speed up common teacher tasks
7. **Big Boss/Approver Role** - Define and implement if needed

### Medium Priority
8. **Global Search** - Search across all entities
9. **Bulk Actions Enhancement** - Comprehensive bulk operations
10. **Data Import/Export** - Complete Excel import/export
11. **Mobile-First UX** - Optimize for mobile devices

### Low Priority / Future
12. **MFA** - Multi-factor authentication
13. **Automation Rules** - Workflow automation
14. **Analytics & Insights** - Advanced analytics
15. **Backup & Restore** - Automated backup system
16. **Templates** - Announcement/email templates

### Infrastructure
17. **Free Hosting Migration** - Migrate to Vercel/Render/Supabase
18. **Render Backend Setup** - Complete Render deployment
19. **Domain Configuration** - Set up custom domain

---

## Notes

- Most core features are implemented
- Main gaps are in:
  - Pending Teacher experience
  - Notification system
  - Audit logging UI
  - Free hosting migration
- Security features are mostly implemented, with some enhancements needed
- API architecture is solid but may need field alignment review

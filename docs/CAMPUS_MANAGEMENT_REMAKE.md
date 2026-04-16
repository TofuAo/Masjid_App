# Campus Management Remake — Future Stack Spec

This document describes the **target architecture** for a modernized campus/school management system. The current MyMasjidApp implements a **hybrid** version using the existing stack (React/Vite, Express, MySQL). This spec serves as a roadmap for a future full migration.

---

## 1. Target Technical Stack

| Layer | Technology | Reason |
|-------|------------|--------|
| Frontend | Next.js 15+ (App Router) | Best-in-class performance and routing |
| Styling | Tailwind CSS + Shadcn/ui | Rapid UI development with professional components |
| State/Auth | Clerk or NextAuth.js | Handles complex Roles (Admin vs Executive) securely |
| Database | PostgreSQL (via Supabase) | Relational data for Roles and Student Records |
| ORM | Prisma | Synchronizes database with TypeScript code |
| Backend API | Server Actions | Simplified backend without separate Express server |

---

## 2. Target Layout (SaaS Dashboard)

### Navigation (Remade)

- **Sidebar (Left):** Persistent, collapsible menu
  - Top: Brand Logo + Campus Selector (multi-campus)
  - Main Links: Dashboard, Management (sub-menus), Campus Life, Schedule
  - Bottom: User Profile (settings/logout)

- **Topbar:**
  - Search bar (Carian)
  - Notification Bell (Inbox/Approvals)
  - Breadcrumbs (e.g., Management > Executive Settings)

### Workspace (Right)

- **Header:** Dynamic title + "Quick Action" button (e.g., "+ Add Record")
- **Grid:** 12-column responsive grid
  - Main Content (8 cols): Form or list view
  - Side Panel (4 cols): Calendar or Recent Activity timeline

---

## 3. Target Schema (Prisma)

```prisma
model User {
  id        String   @id @default(cuid())
  name      String
  role      Role     @default(TEACHER) // ADMIN, EXECUTIVE, TEACHER
  approvals Approval[]
}

model CampusLifeItem {
  id          String   @id @default(cuid())
  title       String
  details     String
  date        DateTime
  status      Status   @default(PENDING)
}

enum Role { ADMIN; EXECUTIVE; TEACHER; STUDENT }
enum Status { PENDING; APPROVED; REJECTED }
```

---

## 4. Executive Approval Workflow (Target)

1. **Teacher Input:** Teacher fills form → Item created with `Status.PENDING`
2. **Executive View:** Inbox queries items where `status == PENDING`
3. **Action:** "Ya/Tidak" buttons trigger Server Action → update to `APPROVED` or `REJECTED`
4. **Real-time:** Optimistic UI (`useOptimistic`) so item disappears immediately on click

---

## 5. Current Implementation (Hybrid)

The **current MyMasjidApp** implements:

- **Layout:** Sidebar + topbar with search, breadcrumbs, 12-column grid
- **Campus Life:** `campus_life_items` table, API, form, and Executive Approval Inbox
- **Approval Flow:** PENDING → Inbox → Ya/Tidak → APPROVED/REJECTED with optimistic UI
- **Stack:** React/Vite, Express, MySQL (unchanged)

See:

- `database/migration_campus_life.sql` — Schema
- `backend/routes/campusLife.js` — API routes
- `backend/controllers/campusLifeController.js` — Controller
- `src/pages/CampusLife.jsx` — Form + List
- `src/pages/ExecutiveApprovals.jsx` — Inbox with optimistic approval

---

## 6. Migration Path (Future)

1. **Phase 1:** Keep hybrid implementation, validate UX
2. **Phase 2:** Migrate DB to PostgreSQL (Supabase), add Prisma
3. **Phase 3:** Migrate frontend to Next.js App Router
4. **Phase 4:** Replace custom auth with Clerk/NextAuth
5. **Phase 5:** Replace Express API with Server Actions

---

*Last updated: 2025-02*

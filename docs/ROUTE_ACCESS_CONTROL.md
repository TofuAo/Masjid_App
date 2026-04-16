# Route Access Control (RBAC)

## Frontend

### ProtectedRoute

- **File:** `src/components/ProtectedRoute.jsx`
- **Behavior:**
  - Not logged in → redirect to `/login`
  - Logged in but role not in `allowedRoles` → redirect to `/unauthorized`

### RouteGuard

- **File:** `src/components/RouteGuard.jsx`
- **Behavior:** Wraps `Routes` and checks the current path against `routeAccess.js`
- Paths with role restrictions are wrapped in `ProtectedRoute`

### Route Access Mapping

| Route / Feature        | Allowed Roles                         |
|------------------------|---------------------------------------|
| IB Dashboard / Account | `ib`                                  |
| System Settings        | `admin`                               |
| Fee Management (Yuran) | `ib`, `admin`, `pic`, `staff`, `student` |
| Attendance Entry       | `admin`, `pic`, `staff`, `teacher`    |
| Own Results / Resits   | `student`                             |

### Unauthorized Page

- **Path:** `/unauthorized`
- **File:** `src/pages/Unauthorized.jsx`
- Provides "Kembali" and "Ke Dashboard" actions

### Loading State

- `loading` and `checkingProfile` control the auth spinner
- Spinner is shown while checking token and profile
- Reduces flash of login page on refresh

---

## Backend

### authorizeRoles

- **File:** `backend/middleware/auth.js`
- **Usage:** `router.get('/ib-stats', authenticateToken, authorizeRoles('ib'), getIBStats)`
- Variadic: `authorizeRoles('admin', 'ib')` allows either role
- Alias for `requireRole([...])`

### requireRole

- Same behaviour as `authorizeRoles` but takes an array
- Uses `req.user.activeRole` and `req.user.roles`

---

## Sidebar Visibility

- `Layout.jsx` builds the menu from `getEffectiveRole(user)`
- Menu items are hidden based on role (e.g. Teacher does not see "IB Dashboard")
- Role-based visibility is handled in `buildGroupedMenu()`

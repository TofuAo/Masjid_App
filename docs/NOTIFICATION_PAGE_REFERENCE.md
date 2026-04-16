# Notification Center – Functions, Backend & Routing Reference

This document describes all functions, backend logic, and routing for the Notification Center page (`/notifications`).

---

## 1. Frontend Page: `src/pages/NotificationCenter.jsx`

### Route
- **Path:** `/notifications`
- **Component:** `NotificationCenter` (lazy-loaded in `App.jsx`)

### State
| State | Type | Description |
|-------|------|-------------|
| `notifications` | `Array` | List of notification objects |
| `loading` | `boolean` | Loading state while fetching |
| `filter` | `string` | `'all'` \| `'unread'` \| `'pending'` \| `'errors'` |

### Functions

| Function | Description |
|----------|-------------|
| `fetchNotifications()` | Fetches notifications from `GET /notifications` with optional `filter` param. Called on mount and every 30 seconds. |
| `navigateToActionUrl(url)` | Navigates to `action_url` (internal path or external URL). Uses `navigate()` for internal, `window.location.href` for external. |
| `markAsRead(id)` | Marks a single notification as read via `POST /notifications/:id/read`, updates local state. |
| `markAllAsRead()` | Marks all notifications as read via `POST /notifications/mark-all-read`, shows toast. |
| `getNotificationIcon(type)` | Returns React icon for `pending_approval`/`pending_pic` (Clock), `error` (XCircle), `success` (CheckCircle), default (AlertCircle). |
| `getPriorityBadge(priority)` | Returns `<Badge>` with variant: `urgent`→danger, `high`→warning, `normal`→default, `low`→secondary. |
| `formatTime(timestamp)` | Returns relative time string: "Baru sahaja", "X minit lalu", "X jam lalu", "X hari lalu". |

### Filter Logic
```javascript
// filteredNotifications
filter === 'unread'  → n.read === false
filter === 'pending' → n.type.includes('pending')
filter === 'errors'  → n.type === 'error'
filter === 'all'     → all notifications
```

### Notification Object Shape
```typescript
{
  id: string;
  type: string;           // pending_approval | pending_pic | error | ib_ready | ib_missing_docs | ib_activity | ib_overdue
  title: string;
  message: string;
  priority: string;      // urgent | high | normal | low
  action_url: string | null;
  read: boolean;
  timestamp: string;     // ISO date
}
```

---

## 2. API Client: `src/services/api.js`

```javascript
export const notificationAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markNotificationRead: (id) => api.post(`/notifications/${id}/read`),
  markAllNotificationsRead: () => api.post('/notifications/mark-all-read'),
};
```

| Method | HTTP | Endpoint | Params |
|--------|------|----------|--------|
| `getNotifications(params)` | GET | `/notifications` | `params.filter` (optional) |
| `markNotificationRead(id)` | POST | `/notifications/:id/read` | `id` (notification id) |
| `markAllNotificationsRead()` | POST | `/notifications/mark-all-read` | — |

---

## 3. Backend Routes: `backend/routes/notifications.js`

**Base path:** `/notifications` (mounted in `backend/routes/index.js`)

**Middleware:** `authenticateToken` (applied to all routes)

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| GET | `/` | `getNotifications` | Fetch all dashboard notifications |
| POST | `/:id/read` | `markNotificationRead` | Mark single notification as read |
| POST | `/mark-all-read` | `markAllNotificationsRead` | Mark all notifications as read |

**Route order:** `mark-all-read` is a static path, so it does not conflict with `/:id/read` (which expects `/:id/read`).

---

## 4. Controller: `backend/controllers/notificationController.js`

### `getNotifications(req, res)`
- Calls `fetchDashboardNotifications()` (notification service).
- Returns `{ success: true, data: notifications }`.
- Error: 500, `{ success: false, message: 'Gagal memuatkan notifikasi' }`.

### `markNotificationRead(req, res)`
- Expects `id` in `req.params`.
- Does not persist read state (handled client-side).
- Returns `{ success: true, message: '...', data: { id } }`.
- Error: 400 if no `id`; 500 on other errors.

### `markAllNotificationsRead(req, res)`
- Acknowledges request only; no persisted state.
- Returns `{ success: true, message: 'Semua notifikasi ditandakan sebagai dibaca' }`.
- Error: 500 on errors.

---

## 5. Service: `backend/services/notificationService.js`

### `createNotification({ id, type, title, message, priority, action_url, timestamp })`
Helper to build a notification object with `read: false` and ISO timestamp.

### `fetchDashboardNotifications()`
Builds notifications from database queries:

| Source | Query | Notification |
|--------|-------|--------------|
| Pending registrations | `users` where `status = 'pending'` | `pending_approval` → `/pending-registrations` |
| Pending PIC approvals | `pending_pic_changes` where `status = 'pending'` | `pending_pic` → `/pic-approvals` |
| Failed payments (24h) | `payments` where `status = 'failed'` | `error` → `/toyyibpay-settings` |
| IB ready reports | `payment_confirmations` in current period | `ib_ready` → `/ib-dashboard` |
| IB missing docs | `fees` with missing `resit_img`/`document_confirmed` | `ib_missing_docs` → `/ib-dashboard` |
| IB recent approvals | `ib_action_logs` last 24h | `ib_activity` → `/notifications` |
| IB overdue confirmations | `payment_confirmations` past period | `ib_overdue` → `/ib-dashboard` |

Uses `pool.execute()` from `backend/config/database.js` and `ensurePendingPicTable()` from `backend/utils/pendingPicChanges.js`.

---

## 6. Database Schema (Migration)

**File:** `database/migration_add_notifications.sql`

### `notifications` (not used by current implementation)
- `id`, `user_ic`, `title`, `message`, `type`, `priority`, `is_read`, `link`, `related_type`, `related_id`, `created_at`, `read_at`

### `notification_preferences` (not used by current implementation)
- `user_ic`, `email_notifications`, `push_notifications`, `in_app_notifications`, etc.

**Note:** The current implementation does not use these tables. Notifications are built dynamically from other tables (users, pending_pic_changes, payments, payment_confirmations, fees, ib_action_logs).

---

## 7. Flow Summary

```
User visits /notifications
    → NotificationCenter mounts
    → fetchNotifications() → GET /api/notifications
    → Backend: getNotifications → fetchDashboardNotifications()
    → Service runs DB queries and builds notification list
    → Response { success, data }
    → Frontend stores notifications in state
    → Polling every 30s

User clicks notification
    → markAsRead(id) → POST /api/notifications/:id/read
    → navigateToActionUrl(action_url)

User clicks "Tandakan Semua Dibaca"
    → markAllAsRead() → POST /api/notifications/mark-all-read
```

---

## 8. Entry Points

- **Sidebar:** Bell icon → "Pusat Notifikasi" → `/notifications` (`Layout.jsx`)
- **Quick Actions:** "Notifikasi" button → `/notifications` (`QuickActions.jsx`)
- **App route:** `<Route path="/notifications" element={<NotificationCenter />} />` (`App.jsx`)

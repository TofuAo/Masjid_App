# Drag-and-Drop Design for MyMasjidApp

This document outlines drag-and-drop implementations integrated into existing MyMasjidApp UI and workflows. The goal is to improve usability, efficiency, and user experience while preserving accessibility and fallback controls.

**Stack alignment:** The project already includes `@dnd-kit/core`, `@dnd-kit/sortable`, and `@dnd-kit/utilities`. Use these for in-app drag (widgets, workflow columns, organizing). Use **native HTML5 Drag and Drop** for **file uploads** (files from the OS), since dnd-kit is for sorting/dragging DOM elements, not OS file drops.

---

## 1. File Uploads (Drag-and-Drop into Upload Areas)

### Where It Fits in MyMasjidApp

| Location | Purpose | Current UX |
|----------|---------|------------|
| **Settings → QR Code** | Upload QR code image | `<input type="file">` only |
| **Yuran (Fees)** | Upload receipt/QR image | Hidden file input + label |
| **AttendanceFormModal** | Proof image for bulk attendance | File input + preview |
| **MobileAttendanceForm** | Proof image | File input |
| **PendingTeacherDocuments** | Sijil, IC, resume, etc. | File input per document type |

### UX Behavior

- **Drop zone:** A clearly bordered area (e.g. dashed border, subtle background) that:
  - Shows a default state: “Drag files here or click to browse”
  - On **dragenter**: highlight (e.g. solid border, background tint) and optional “Drop to upload” text
  - On **dragover**: prevent default so drop is allowed; keep highlight
  - On **dragleave**: restore default (ensure leave fires for the zone, not children)
  - On **drop**: prevent default, validate files, add to queue or start upload
- **Multiple files:** Where the backend supports it (e.g. teacher documents), allow multiple files in one drop; show a small list of “pending” files with remove (×) and then “Upload all” or per-file upload.
- **Visual feedback:**
  - **Idle:** “Drag files here or click to browse” + optional icon
  - **Drag over:** “Drop to upload” + stronger visual (e.g. `ring-2 ring-emerald-500`)
  - **Uploading:** Per-file or global progress bar (and/or spinner) and “Uploading…” text
  - **Success:** Brief checkmark or toast; clear or replace preview
  - **Error:** Inline message under drop zone or per file (e.g. “File too large”, “Invalid type”)
- **Click fallback:** Keep existing `<input type="file">`; trigger it when the drop zone is clicked (label or `ref` + `click()`). No drag-only actions.
- **Accept and limits:** Same as today (e.g. `image/*` or specific types, max 5MB). Reject invalid files with clear messages.

### Edge Cases

- **Drag leave firing on children:** Use a counter for `dragenter`/`dragleave` on the drop zone so the highlight only clears when the pointer actually leaves the zone.
- **Dropping 20+ files:** Cap how many are accepted per drop (e.g. 10); toast “Only first 10 files were added” and optionally offer “Add more” that opens file picker.
- **Very large file:** Validate size before upload; show error immediately and do not start upload.
- **Wrong type:** Validate `file.type` (and optionally extension); show error and do not add to list.
- **Upload failure:** Show per-file or global error; keep file in “failed” state with “Retry” and “Remove”.
- **Touch devices:** No native “drag file” from OS. Keep drop zone visible but primary CTA = “Tap to choose file(s)”.

### Technical Notes

- Use **native HTML5 DnD** on a `<div>` (or `<label>`): `onDragEnter`, `onDragOver` (preventDefault), `onDragLeave`, `onDrop` (preventDefault, read `event.dataTransfer.files`).
- Use a single shared **FileDropZone** component that accepts: `onFiles(files: FileList | File[])`, `accept`, `maxSize`, `maxCount`, `multiple`, `disabled`, and optionally `children` for custom content.
- Progress: use `axios` (or existing API client) with `onUploadProgress` when uploading via `FormData`; store progress in state and show a progress bar.
- **Accessibility:** Ensure the drop zone is focusable (`tabIndex={0}`), has `role="button"` and `aria-label="Upload file, drag and drop or click to browse"`, and that Enter/Space trigger the file input. Announce errors with `aria-live` or existing toast/snackbar.

---

## 2. Dashboard Customization (Drag Widgets/Panels)

### Where It Fits in MyMasjidApp

- **Dashboard.jsx** currently renders a fixed sequence: DailyQuranQuote → QuickActions → QuickStats (for non-students) → FeaturedClasses → RecentActivity → Notis Penting (alerts).
- **RoleSpecificWidgets.jsx** defines role-based widget sets but is not used in the current Dashboard layout; Dashboard composes sections directly.

### UX Behavior

- **Draggable:** Each logical “widget” (Daily Quran Quote, Quick Actions, Quick Stats, Featured Classes, Recent Activity, Notis Penting) is a draggable card/panel with a visible “handle” (e.g. grip icon) to avoid accidental drags when scrolling or clicking content.
- **Drop targets:** The dashboard is a single grid or column of “slots”. Dragging a widget shows a placeholder (e.g. horizontal bar or empty slot) where it will land; other widgets shift. No nested “drop into widget”—only reorder.
- **Persistence:** Prefer **auto-save** after a short debounce (e.g. 500ms after drop) so the layout is saved without an extra click. Optional: small toast “Layout saved”. If you prefer explicit save, show a “Save layout” button that appears when the order has changed and is dirty.
- **Reset:** “Reset to default layout” in dashboard or settings restores a default order (by role if needed).
- **Non-drag alternative:** “Customize layout” mode that shows an “Move up” / “Move down” (or “Move to position”) control for each widget so order can be changed without drag.

### Edge Cases

- **Only one widget:** No need to show drag handles or reorder UI.
- **Concurrent edit:** If you add multi-device later, last-write-wins or version field is enough for v1.
- **New widget added by code:** Default layout config includes it at a defined position (e.g. end); user’s saved order is a list of widget IDs, and any new ID is appended.
- **Removing a widget:** Not in scope for first version; only reorder.

### Technical Notes

- Use **@dnd-kit/core** (and **@dnd-kit/sortable**) with a vertical `SortableContext` for the list of widget IDs. Each widget is a sortable item with a drag handle sensor.
- Store layout in **user preferences** (e.g. existing PreferencesContext or backend `/users/me/preferences`). Shape: `{ dashboardWidgetOrder: ['daily-quran', 'quick-actions', 'quick-stats', ...] }`.
- **Collision detection:** `closestCenter` or `rectIntersection`. **Modifiers:** `restrictToVerticalAxis` so widgets only move up/down.
- **Accessibility:** Drag handle has `aria-label="Move widget"`. In “Customize layout” mode, each widget has “Move up” / “Move down” buttons (and optionally a select “Position: 1, 2, 3…”).
- **Responsive:** Same order on mobile; widgets stack in one column. Consider hiding drag handle on very small screens and relying on “Move up/down” only.

---

## 3. Workflow or Status Management (Drag Between Columns)

### Where It Fits in MyMasjidApp

- **PicApprovals.jsx:** Items have statuses `pending` | `approved` | `rejected`. Currently filtered by status and approved/rejected via buttons. Good candidate for a **kanban**: columns “Menunggu Kelulusan” | “Diluluskan” | “Ditolak”; dragging to a column updates status (with confirmation for approve/reject if you want to keep notes).
- **Payment / Yuran:** If fees or payments have statuses (e.g. unpaid → pending → paid), a small pipeline view could use drag-between-columns later.
- **Pending registrations / teacher approvals:** “Pending” → “Approved” / “Rejected” as columns.

### UX Behavior

- **Columns:** Predefined status columns (e.g. 3 columns for PIC approvals). Each column has a header (name + count) and a list of cards.
- **Cards:** Each item is a compact card (e.g. title, subtitle, badge). Card is draggable; only the card body or a handle is the drag source.
- **Drop:** Dropping a card in another column updates status to that column’s status. Optional: **confirm** when the new status is “terminal” (e.g. “Diluluskan” / “Ditolak”) with a small modal for notes, then confirm.
- **Visual:** During drag, origin slot can show a placeholder; target column highlights (e.g. border or background). Cursor or card ghost indicates “moving”.
- **Non-drag alternative:** On each card, a “Change status” dropdown or “Approve” / “Reject” buttons (as today); dropdown can list all statuses so users never need to drag.

### Edge Cases

- **Empty column:** Column still exists and is a valid drop target (e.g. “Drop here to reject”).
- **Permissions:** Only users who can change status see draggable cards or the relevant columns; others see read-only.
- **Optimistic update:** On drop, move card in UI immediately; call API; on failure, revert and toast error.
- **Concurrent update:** If another user already changed the item, API may return 409; revert and toast “Item was updated by someone else”.
- **Single status:** If an item can only be in one column, dropping it in another column is the only way to change status; no duplicate cards.

### Technical Notes

- Use **@dnd-kit/core** with **droppable** columns and **draggable** cards. Each column has a `useDroppable` with `id: status`; each card `useDraggable` with `id: itemId` and `data: { status, item }`. On `onDragEnd`, if `over` is a column, call API to update status and update local state.
- **Accessibility:** Each card has a “Status” dropdown (or approve/reject buttons); keyboard users change status without drag. Optionally add “Move to [column]” buttons.
- **Responsive:** On narrow screens, columns can stack vertically or become a list with status filter; drag can be disabled and only dropdown/buttons used.

---

## 4. Content or Form Building (Drag Components into Containers)

### Where It Fits in MyMasjidApp

- **KelasForm.jsx:** Has dynamic “sessions” (days + times). Today: “Add session” and delete. Could support **reordering sessions** via drag (session = block). No need for a “palette” of generic blocks; only reorder existing blocks.
- **AnnouncementForm / custom forms:** If you add a “content block” or “form field” builder later, the same pattern applies: a **palette** of block types (e.g. text, image, divider) and a **container** (e.g. “Content blocks” list); drag from palette into container or reorder inside container.

### UX Behavior (Reorder-Only, e.g. KelasForm Sessions)

- **Source:** Existing list of sessions (or form sections). Each item has a drag handle; reordering is in-place (no separate “palette”).
- **Feedback:** Placeholder between items or at end; other items shift. Same as dashboard: vertical list, restrict to vertical axis.
- **Persistence:** Form state only; “Save” submits the new order. No auto-save for form content.

### UX Behavior (Future: Block/Field Builder)

- **Palette:** Sidebar or top bar with “Text”, “Image”, “Divider”, “Short text”, “Dropdown”, etc. Each is draggable.
- **Container:** Main area with “Drop blocks here” or existing blocks. Dropping from palette **adds** a new block; dragging within container **reorders**. Optional: drag from container to “trash” to remove.
- **Non-drag:** “Add block” dropdown in container that inserts at end or at selected index; “Move up” / “Move down” per block.

### Edge Cases

- **Empty container:** Show “Drop here to add” or “Add first block” CTA.
- **Invalid drop:** e.g. “Image” not allowed in “Header only” zone; reject drop and show brief message.
- **Nested:** If you ever have sections containing blocks, only one level of “container” is enough for v1; avoid deep nesting for accessibility and performance.

### Technical Notes

- Reorder-only (e.g. KelasForm): **@dnd-kit/sortable** with `SortableContext` and `restrictToVerticalAxis`.
- Builder with palette: **@dnd-kit/core** with two areas—palette (draggable templates) and container (droppable + sortable). Clone from palette on drop (add new block with default props); container uses sortable for reorder. Use `data` to distinguish “template” vs “instance” (e.g. `{ type: 'template', blockType: 'text' }` vs `{ type: 'instance', id }`).
- **Accessibility:** “Move up” / “Move down” (and “Remove”) for each block; “Add block” dropdown or list of buttons.

---

## 5. Organizing Items into Groups (Drag Between Categories/Folders/Teams/Tags)

### Where It Fits in MyMasjidApp

- **ChangeClasses.jsx:** Move students **from one class to another**. Current UX: select source class → select students (checkboxes) → select target class → submit. **Drag enhancement:** Allow dragging a student (or multiple via multi-select then drag one) from the student list and dropping on a “target class” chip or list, or a second panel “Target classes” with droppable class cards.
- **Pelajar (Students):** Assign student to class (e.g. from “Unassigned” or “Class A” to “Class B”) in a list or card view.
- **Kelas (Classes):** Assign teacher to class; could be “drag teacher onto class card” in a future view.
- **Tags or categories:** If you introduce tags/categories for students or classes, “drag item onto tag” to assign.

### UX Behavior (Change Classes)

- **Source:** Student list (left or top) remains; each student row/card is draggable (or a handle). Multi-select: drag one selected student and all selected move together (or show “Move N students” on drop).
- **Target:** “Target class” area: either a dropdown (as now) or a list of **droppable** class cards/chips. Dropping a student onto a class card sets “target class” and optionally opens the confirmation modal (same as “Move” with assignment type and exam session if needed). Or: drop = immediate move with a small “Undo” toast.
- **Feedback:** When dragging over a valid class card, highlight that card. When no class is targeted, show “Drop on a class to move” or keep current target dropdown visible.
- **Non-drag alternative:** Keep current flow: select class → select students → choose target from dropdown → Confirm → Submit. No change required for accessibility.

### Edge Cases

- **Capacity:** Target class may have a capacity; if moving N students would exceed it, show warning on hover or on drop (“Class full”) and optionally prevent drop or allow with warning.
- **Exam vs permanent:** If your flow distinguishes “exam session” vs “permanent” move, drop could open the existing ConfirmModal with target class pre-filled; user still chooses type and exam session.
- **Multiple students:** Dragging one student from a multi-selection: either move only that one, or move all selected (document behavior and show “Moving 5 students to …”).
- **Same class:** Dropping on current class: no-op or toast “Already in this class”.

### Technical Notes

- Use **@dnd-kit/core**: students (or their wrapper) are `useDraggable`; each class in “target” area is `useDroppable`. On `onDragEnd`, if `over` is a class id, set target class and either open ConfirmModal or call API (with undo toast). If you support multi-move, pass `data: { studentIds: [...], singleId }`.
- **Accessibility:** Keep full flow without drag: source class → checkboxes → target dropdown → Confirm. Optional: “Move to class” dropdown on each row.
- **Responsive:** On small screens, keep dropdown-based flow; drag can be disabled and “Move to class” button/dropdown used.

---

## Cross-Cutting: UX, Accessibility, and Technical Summary

### Visual Cues

- **Draggable:** Cursor `grab` / `grabbing` on handle or card; optional subtle border or shadow on hover. Use a **grip icon** (e.g. Lucide `GripVertical`) on reorderable items so users know where to drag.
- **Drop zones:** Dashed border and “Drop here” (or equivalent) when idle; solid border or ring when `isOver` (for dnd-kit) or `dragActive` (for file drop).
- **During drag:** Ghost or clone of the dragged item; origin can show a placeholder (same size) so layout doesn’t jump.

### Non-Drag Alternatives (Accessibility)

- **File upload:** Click/tap to open file picker; same validation and progress.
- **Dashboard:** “Customize layout” with Move up / Move down (and optional “Reset layout”).
- **Workflow:** Per-card “Status” dropdown or Approve/Reject buttons.
- **Form/Content:** “Move up” / “Move down” and “Add block” / “Remove block” buttons.
- **Organize:** “Move to class” dropdown or existing checkbox + target dropdown flow.

Ensure all actions are reachable by keyboard and that focus management is sane (e.g. after drop, focus stays on a logical element; modals trap focus).

### Preventing Accidents and Undo

- **Drag handle:** Use a dedicated handle for reorder and workflow so casual clicks don’t start a drag.
- **Confirmation:** For destructive or final actions (e.g. “Reject” in workflow), keep a confirm step or a short “Undo” toast after drop.
- **Undo:** Where possible (dashboard order, move student, status change), after applying the change show “Undo” in a toast for a few seconds and revert on click if feasible (and API supports revert).

### Responsive and Layout

- **Desktop:** Full drag-and-drop everywhere it’s implemented.
- **Tablet:** Same; ensure touch doesn’t scroll when dragging (dnd-kit touch sensor).
- **Mobile:** Prefer disabling drag for small breakpoints and relying on buttons/dropdowns; or keep drag with touch sensor but make targets large enough.

### Technical Stack Summary

| Use case | Recommended approach |
|----------|------------------------|
| File uploads | Native HTML5 DnD on a drop zone + existing file input |
| Dashboard layout | @dnd-kit/sortable, vertical list, persist in user preferences |
| Workflow (PIC, etc.) | @dnd-kit droppable columns + draggable cards, API on drop |
| Form/Content reorder | @dnd-kit/sortable in KelasForm; optional builder with palette later |
| Organize (e.g. Change Classes) | @dnd-kit draggable students, droppable class targets; keep dropdown flow |

### Implementation Order Suggestion

1. **File upload drop zones** – Reusable `FileDropZone`; integrate in Settings (QR), AttendanceFormModal, PendingTeacherDocuments, Yuran.
2. **Dashboard widget order** – Sortable widgets + preferences; add “Customize layout” with Move up/down.
3. **PIC Approvals kanban** – Columns + draggable cards; keep approve/reject buttons and add “Status” dropdown.
4. **Change Classes** – Droppable target classes + draggable students; keep existing checkbox + dropdown flow.
5. **KelasForm session reorder** – Sortable sessions with handle; optional “Move up/down” per session.

This keeps the existing architecture, reuses your current UI and APIs, and adds drag-and-drop where it clearly improves efficiency without replacing existing workflows.

# Modal / Popup UX/UI Recommendations (MyMasjidApp)

This document summarizes design and implementation guidelines for data-view and image-preview modals so they are clear, readable, and usable across devices.

---

## 1. Layout and structure

### Recommended structure (header → body → optional footer)

- **Header (fixed):** Title + primary actions (e.g. Download) + close. Keeps context visible and actions always reachable.
- **Body (scrollable):** Main content only. Use `flex-1 min-h-0 overflow-y-auto` so the modal doesn’t grow past the viewport and only the body scrolls.
- **Footer (optional):** Secondary actions or hints. Use only when needed to avoid clutter.

### Why it helps

- Clear visual hierarchy: users know where the title is, where to close, and where content lives.
- Predictable behavior: scrolling happens in one place; header/footer stay fixed.
- Better for small screens: modal stays within viewport; no overlapping or double scrollbars.

---

## 2. Image placement and sizing

### Do

- **Constrain the image container:** Use a wrapper with `max-w-full`, `max-h-[…]` (e.g. `calc(90vh - 8rem)`) and `flex items-center justify-center` so the image is centered and never overflows.
- **Preserve aspect ratio:** Use `object-contain` on the `<img>`; avoid fixed `width`/`height` that force distortion.
- **Use semantic alt text:** e.g. `alt="Dokumen bukti"` so screen readers get useful context.
- **Optional actions in header:** e.g. “Muat turun” next to close so the image area stays uncluttered.

### Avoid

- Large fixed `width`/`height` on the image (e.g. 800×600) that ignore container size.
- Putting the image in a tiny or unbounded box so it overlaps text or feels misaligned.
- Putting critical actions only at the bottom so they disappear when the body scrolls.

---

## 3. Readability (spacing, font, contrast)

- **Spacing:** Use consistent padding (e.g. `px-4 py-3` / `sm:px-5 sm:py-4` in header; `p-4 sm:p-6` in body). Add margin between sections (e.g. `mb-5`, `mb-6`).
- **Typography:** Title in header: `text-base sm:text-lg` or `text-lg sm:text-xl`, `font-semibold`, `text-gray-900`. Subtitle/secondary text: `text-sm text-gray-600`.
- **Contrast:** Keep text on white/light gray backgrounds; ensure focus rings (e.g. `focus:ring-2 focus:ring-emerald-500`) are visible.
- **Touch targets:** Buttons and close control at least 44×44 px (e.g. `p-2` on a 24px icon).

---

## 4. Responsive behavior

- **Modal width:** `max-w-4xl` or `max-w-6xl` with `w-full` and horizontal padding (e.g. `p-4` or `mx-4`) so it doesn’t touch screen edges on mobile.
- **Max height:** `max-h-[90vh]` so the modal never exceeds the viewport; combine with `flex flex-col` and `min-h-0` on the body so only the body scrolls.
- **Text and controls:** Use `truncate` or `break-words` for long names/IDs; stack or wrap filters (e.g. month picker) with `flex-wrap` and `gap-3`.

---

## 5. Visual hierarchy and attention

- **Primary action:** Use a solid or outline primary button (e.g. Muat turun) in the header.
- **Close:** Clearly visible (icon + optional “Tutup” label), with hover/focus state; avoid hiding it in a corner with low contrast.
- **Backdrop:** Use a consistent overlay (e.g. `bg-black/70`) so the modal stands out and focus is on the content.

---

## 6. Accessibility

- **Semantics:** Use `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` pointing to the modal title.
- **Focus:** Move focus to the close button (or first focusable element) when the modal opens; restore focus on close when possible.
- **Keyboard:** Close on Escape; ensure Tab order stays inside the modal (focus trap is optional but recommended for complex modals).
- **Labels:** Use `aria-label="Tutup"` on the close button; associate labels with inputs (e.g. `htmlFor` / `id` on month picker).

---

## 7. Implementation reference

- **Image preview:** `src/components/ui/ImagePreviewModal.jsx` — reusable modal with header (title + optional download + close), body (centered image with correct sizing), and optional footer. Used in IB Account for document proof preview.
- **Data modals:** Same pattern applied in `IbAccount.jsx` Student Detail Modal: fixed header (title + close), scrollable body (month picker + table), with consistent padding and responsive classes.

Applying this structure across all data-view and image popups will keep behavior and readability consistent and make future changes easier.

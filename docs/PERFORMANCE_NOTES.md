# Performance Notes

Quick reference for keeping the app responsive and avoiding main-thread jank, layout thrashing, and memory leaks.

## 1. Main thread

- **Heavy re-renders:** Avoid state that forces the whole page to re-render. Use `React.memo` for list items where only filters change; debounce search/filter inputs so API or heavy filtering doesn’t run on every keystroke.
- **Images:** Prefer sized images (width/height or `aspect-ratio`) and `loading="lazy"` where appropriate so the browser isn’t resizing large images on the main thread.
- **Long lists:** For very long lists (e.g. Keputusan), use skeleton loaders during load and consider virtualization if the list grows to hundreds of rows.

## 2. Layout thrashing

- **Batch reads and writes:** Read layout values (e.g. `offsetHeight`, `getBoundingClientRect`) first, then apply style/DOM changes. Avoid read → write → read → write in the same frame.
- **Animations:** Prefer `transform: translate()` (and similar) over animating `top`/`left` so the GPU handles the work.

## 3. Memory leaks

- **Event listeners:** Remove in `useEffect` cleanup: `return () => { target.removeEventListener(...); };`
- **Timers:** Clear `setInterval`/`setTimeout` in `useEffect` cleanup: `return () => clearInterval(id);` or `clearTimeout(id)`.
- **Subscriptions:** Unsubscribe in cleanup (e.g. WebSocket, observables).

## 4. Implemented quick wins

- **Debounced search:** `useDebounce(value, delayMs)` and `useDebouncedCallback` in `src/hooks/useDebounce.js`. Used in:
  - **Keputusan:** `debouncedSearchTerm` for `fetchResults` (avoids API call on every keystroke).
  - **Yuran:** `debouncedSearchTerm` for `fetchFees` and confirm-document refetch.
  - **IbAccount:** `debouncedSearchTerm` for client-side filtering of attendance/fees.
- **Skeleton loaders:** Keputusan list shows `<LoadingSkeleton type="card" count={5} />` instead of plain “Memuatkan keputusan...” to keep layout stable.

## 5. Diagnosing in the browser

- **Performance tab (Chrome DevTools):** Record a few seconds of interaction; look for long red “Long Task” bars.
- **Lighthouse:** Check Total Blocking Time and Cumulative Layout Shift (CLS).
- **Memory:** Take heap snapshots before/after opening and closing modals or heavy pages to spot leaks.

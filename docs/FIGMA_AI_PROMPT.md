# Figma AI Prompt — Frontend Pages Only (Exact Copy of MyMasjidApp)

Copy and paste the prompt below into Figma AI to generate an exact visual replica of all MyMasjidApp **frontend pages** only. No backend. Include all pages and notification/toast message UI.

---

## Master Prompt (Copy This)

```
Create a pixel-accurate Figma design that replicates ALL frontend pages of MyMasjidApp (e-Quran). Frontend only—no backend. Include every page and all notification/toast message variants.

## BRAND & IDENTITY
- App name: "e-Quran"
- Subtitle: "Masjid Negeri Sultan Ahmad 1"
- Logo: Placeholder for mosque logo image (80×80px, rounded-2xl container)

## COLOR PALETTE (Use Exactly)
- Primary Emerald: #059669 (main), #047857 (hover), #065f46 (dark text), #10b981 (light)
- Primary tints: #ecfdf5 (50), #d1fae5 (100), #a7f3d0 (200), #6ee7b7 (300)
- Accent Gold: #eab308 (500), #facc15 (400), #ca8a04 (600)
- Accent tints: #fefce8 (50), #fef9c3 (100), #fef08a (200)
- Neutral grays: #f9fafb (50), #f3f4f6 (100), #e5e7eb (200), #d1d5db (300), #9ca3af (400), #6b7280 (500), #4b5563 (600), #374151 (700), #1f2937 (800), #111827 (900)
- White: #ffffff
- Error: #dc2626, #b91c1c
- Success: #059669, #047857

## TYPOGRAPHY
- Display/Headings: Poppins, 600–800 weight
- Body: Inter, 400–600 weight
- Arabic (if needed): Amiri
- Base size: 16px
- Headings: 2xl (24px) for page titles, xl (20px) for section titles, sm (14px) for labels

## LAYOUT STRUCTURE
- Sidebar: Fixed left, ~256px width when expanded, emerald-700 (#047857) background
- Main content: Right of sidebar, max-width 1280px (max-w-7xl), padding 16px 24px 32px
- Cards: White background, 1px border #a7f3d0, border-radius 12px (rounded-xl), box-shadow 0 4px 20px rgba(5,150,105,0.15)
- Section spacing: 12px–16px between elements, 24px–32px between sections

## COMPONENT SPECS

### Sidebar
- Background: #047857 (emerald-700)
- Collapsible with hamburger icon
- Menu groups: Dashboard, Administration, Users & Academics, Attendance & Activities, Finance, Reports & Results, System & Configuration, Communication, Account
- Each item: 16px padding, 12px gap to icon, rounded-xl, white/light text
- Active item: bg-emerald-50 (#ecfdf5), text #065f46, border #a7f3d0
- Inactive: text white/90%, hover: bg-white/10%
- Icons: Lucide-style, 20×20px, white or emerald-50

### Login Page
- Full viewport, centered content max-width 448px
- Background: gradient from #ecfdf5 to #ffffff with subtle Islamic geometric pattern (green #059669 at 5% opacity, 60×60px repeat)
- Top: 3 tab buttons in a row: "Login" | "Check In / Out" | "Student Login"
  - Active Login/Check-in: bg #059669, white text, shadow
  - Active Student Login: bg #eab308, text #422006
  - Inactive: white bg, border 2px #a7f3d0, text #374151
- Logo area: 80×80px in white/80 container, rounded-2xl
- Main card: white, rounded-2xl, p-6 to p-8, shadow-mosque
- Inputs: border 2px #a7f3d0, rounded-lg, pl-10 (icon), pr-24 for IC (@masjid.com suffix), py-2.5
- Primary button: bg #059669, white text, font-semibold, py-3, rounded-xl, full width
- Role dropdown: border #a7f3d0, rounded-xl, with ChevronDown
- Links: text #059669, hover #065f46
- Error box: bg #fef2f2, border-l 4px #dc2626, text #991b1b

### Cards (mosque-card)
- bg white, border 1px #a7f3d0, rounded-xl
- Shadow: 0 4px 20px rgba(5,150,105,0.15)
- Hover: translateY(-2px), shadow 0 10px 40px rgba(5,150,105,0.2)
- Padding: 24px (p-6)

### Stat Cards (Dashboard)
- Same as mosque-card
- Layout: flex, space-between
- Left: title (text-sm, #4b5563), value (text-3xl, bold, #065f46)
- Right: icon in circle (56×56px, bg #d1fae5, rounded-full, icon #059669)

### Buttons
- Primary: bg #059669, hover #047857, white text, font-semibold, px-6 py-3, rounded-lg
- Secondary: white bg, border 2px #059669, text #047857, hover bg #ecfdf5
- Accent (gold): bg #eab308, hover #ca8a04, text #422006, shadow gold

### Inputs
- Border 2px #a7f3d0
- Focus: border #059669, ring 2px #a7f3d0
- Rounded-lg, px-4 py-2.5
- Placeholder: #6b7280

### Top Bar / Header
- Height ~64px
- Right side: Bell icon (notifications, with unread badge), User avatar + dropdown (role switcher, logout)
- Left: Menu toggle (mobile), breadcrumb or page title

## NOTIFICATION & TOAST MESSAGES (Include All Variants)

### Toast (top-right, position="top-right", autoClose 4000ms)
Create 4 toast variants with progress bar and close button:

1. **Success** — Gradient #059669 to #047857, white text, rounded-xl, shadow rgba(5,150,105,0.25)
   - Example: "Check-in berjaya! Anda 50m dari masjid."
   - Example: "Kehadiran berjaya direkodkan!"
   - Example: "Pembayaran berjaya!"
   - Example: "Profil berjaya dikemaskini."

2. **Error** — Gradient #dc2626 to #b91c1c, white text, rounded-xl, shadow rgba(220,38,38,0.25)
   - Example: "IC Number atau kata laluan salah."
   - Example: "Gagal memuatkan data."
   - Example: "Gagal menyimpan data kehadiran"

3. **Warning** — Gradient #eab308 to #ca8a04, text #422006, rounded-xl
   - Example: "Anda di luar kawasan. Jarak 150m. Check-in tidak berjaya."
   - Example: "Lokasi tidak tersedia. Check-in tidak direkodkan."
   - Example: "Sila pilih kelas terlebih dahulu"

4. **Info** — Gradient #059669 to #065f46, white text, rounded-xl
   - Example: "Anda telah check-in hari ini."
   - Example: "Pilih sekurang-kurangnya satu pembayaran"
   - Example: "ToyyibPay tidak tersedia dalam mod ujian."

### Notification Center Page (/notifications)
- Filter tabs: Semua | Belum Dibaca | Kelulusan | Ralat Sistem | Status Sistem (role-based visibility)
- Notification list: each item has icon (by category), title, message, timestamp ("Baru sahaja", "5 minit lalu", "2 jam lalu")
- Categories with colors: Alerts (red), Tugas (amber), Kemaskini (blue), Sistem (gray)
- "Tandakan semua sebagai dibaca" button
- Empty state when no notifications

## ALL FRONTEND PAGES TO CREATE (Complete List)

### Public (No Login)
1. **Login** — 3 tabs, IC + password, role dropdown, links (Lupa kata laluan, Daftar Guru)
2. **Login — Student Login tab** — IC only, gold "Student Login" button, "Daftar Sebagai Pelajar"
3. **Login — Check In/Out tab** — Location status, IC + password, Check In / Check Out buttons
4. **Register** — Self-register form (link existing account)
5. **Student Registration** — Full form: nama, IC, email, phone, age, password
6. **Teacher Registration** — Teacher sign-up form
7. **Forgot Password** — Enter IC, choose reset method
8. **Choose Reset Method** — Email or phone option
9. **Reset Password** — New password form
10. **Reset Password Code** — Enter code from email/phone
11. **Quick Staff Check-in** — Public check-in (IC + password, no full login)

### Onboarding & Profile
12. **Complete Profile** — Required fields to complete profile
13. **Welcome Modal** — Onboarding modal (first login, can dismiss)
14. **Pending Teacher Dashboard** — Limited view for pending teachers
15. **Pending Teacher Documents** — Upload documents for approval

### Main App (With Sidebar)
16. **Dashboard** — 4 stat cards, Quick Stats, Featured Classes, Recent Activity, Quick Actions
17. **Pelajar (Students)** — List/table, search, Add, columns: Nama, IC, Kelas, Status, detail view
18. **Guru (Teachers)** — List, Add/Edit, teacher detail
19. **Kelas (Classes)** — List, Add class, students in class
20. **Change Classes** — Admin: select student, source class, destination class, Move/Rollback
21. **Kehadiran (Attendance)** — Class + date picker, student list, status (Hadir/Tidak Hadir/Cuti), bulk mark
22. **Attendance Take** — Mark attendance for a class
23. **Attendance Class Date** — Per-class, per-date view with status toggles
24. **Staff Check-in** — GPS check-in, manual check-in, status display
25. **Yuran (Fees)** — Fee list, filter, Bayar button, mark paid
26. **Pay Yuran** — Payment options, ToyyibPay, QR code, amount
27. **Payment History** — List of payments, receipt link
28. **Payment Return** — Success/failure after payment gateway redirect
29. **Resit (Receipts)** — Receipt list, view/download
30. **Receipt Viewer Modal** — Receipt preview (HTML/PDF style)
31. **Keputusan (Results)** — Exam session selector, grade settings, result form, student detail
32. **Laporan (Reports)** — Report type, date range, export
33. **Announcements** — Announcement list
34. **Account** — Profile, personal settings
35. **Ib Account** — IB profile, class document confirmation
36. **Ib Dashboard** — Payment list, Approve/Flag by date, export
37. **Weather** — Weather widget
38. **Azan Timer (Waktu Solat)** — Prayer times
39. **Help Center** — Help content
40. **Contact** — Contact form

### Administration (Admin)
41. **Pending Registrations** — Approve/reject teacher registrations
42. **Pic Approvals** — PIC change approvals
43. **Admins** — Admin user list
44. **All Users** — All users list
45. **All User Detail** — User profile edit
46. **Pic Users** — PIC user management
47. **Notification Center** — Filter tabs, notification list, mark all read
48. **Hierarchy** — Org structure
49. **Permission Matrix** — Role permissions table
50. **Audit Logs** — Audit trail list
51. **System Health** — System status
52. **Settings** — Masjid location, maintenance, QR, contact, database export
53. **ToyyibPay Settings** — Payment gateway config

### Other
54. **Unauthorized** — 403 page (no access message)
55. **Loading State** — Spinner with "Memuatkan..." text

## ADDITIONAL REQUIREMENTS
- Use 8px grid for alignment
- Border radius: sm 6px, md 8px, lg 12px (rounded-xl)
- All text on light backgrounds must be dark (#111827 to #4b5563)
- Islamic pattern: subtle geometric SVG, green at 5% opacity
- Scrollbar: thin, thumb gradient #10b981 to #059669
- Include toast overlay on at least one page (e.g. Dashboard with success toast visible)
```

---

## Alternative: Shorter Prompt (If Character Limit)

```
Replicate ALL MyMasjidApp (e-Quran) frontend pages. No backend. Colors: Primary #059669 emerald, Accent #eab308 gold, white cards with #a7f3d0 border. Fonts: Poppins headings, Inter body. Layout: Left sidebar #047857, main content right. Include all 55+ pages: Login, Register, Student/Teacher Reg, Forgot/Reset Password, Complete Profile, Dashboard, Pelajar, Guru, Kelas, Change Classes, Kehadiran, Staff Check-in, Yuran, Pay Yuran, Payment History, Resit, Keputusan, Laporan, IB Dashboard, Admin pages (Pending Regs, PIC Approvals, Admins, All Users, Notification Center, Settings, etc.), Account, Weather, Azan Timer, Help, Contact, Unauthorized. Include notification toast variants: Success (emerald), Error (red), Warning (gold), Info (emerald-dark). Notification Center: filter tabs, list with icons. Toast: top-right, rounded-xl, progress bar.
```

---

## Page-by-Page Prompts (Use for Individual Frames)

### Login Page
```
Create the MyMasjidApp login screen: full-height gradient background (#ecfdf5 to white) with subtle Islamic geometric pattern. Centered max-w-md card: logo 80×80, title "e-Quran", subtitle "Masjid Negeri Sultan Ahmad 1". Three tab buttons: Login (emerald), Check In/Out (emerald), Student Login (gold when active). Main form: IC input with User icon left, "@masjid.com" right; Password with Lock icon and eye toggle; Role dropdown "Staff / Guru"; full-width emerald "Login" button. Links: Lupa kata laluan, Daftar Guru. Footer: © 2025 e-Quran.
```

### Dashboard (with Toast)
```
Create MyMasjidApp dashboard: Left sidebar 256px, emerald-700 (#047857), collapsible. Menu groups: Dashboard (Home, Cuaca, Waktu Solat), Administration, Users & Academics, Finance, etc. Main area: page title "Papan Pemuka", 4 stat cards in 2×2 grid (white, rounded-xl, emerald border, icon circle). Below: Quick Stats row, Featured Classes card, Recent Activity list. Use mosque-card style: white, #a7f3d0 border, shadow rgba(5,150,105,0.15). Include a success toast in top-right corner: "Kehadiran berjaya direkodkan!" with emerald gradient, rounded-xl, progress bar.
```

### Notification Center
```
MyMasjidApp Notification Center: Page title "Pusat Notifikasi". Filter tabs: Semua | Belum Dibaca | Kelulusan | Ralat Sistem | Status Sistem. "Tandakan semua sebagai dibaca" button. Notification list: each item has icon (CheckCircle/XCircle/ClipboardList/Info by category), title, message, timestamp ("5 minit lalu"). Categories: Alerts (red bg), Tugas (amber), Kemaskini (blue), Sistem (gray). Empty state: "Tiada notifikasi."
```

### Toast Variants (4 frames)
```
1. Success toast: "Check-in berjaya! Anda 50m dari masjid." — Gradient #059669 to #047857, white text, rounded-xl, top-right, progress bar.
2. Error toast: "IC Number atau kata laluan salah." — Gradient #dc2626 to #b91c1c, white text, rounded-xl.
3. Warning toast: "Anda di luar kawasan. Jarak 150m." — Gradient #eab308 to #ca8a04, text #422006, rounded-xl.
4. Info toast: "Anda telah check-in hari ini." — Gradient #059669 to #065f46, white text, rounded-xl.
```

### Sidebar Component
```
MyMasjidApp sidebar: 256px width, bg #047857. Logo at top. Collapsible groups with ChevronRight: Dashboard, Administration, Users & Academics, Attendance, Finance, Reports, System, Communication. Each item: 16px padding, 20px icon, white text. Active: #ecfdf5 bg, #065f46 text. Icons: Home, Users, BookOpen, Calendar, CreditCard, etc. (Lucide style). Bell icon in header with unread badge.
```

---

## Design Token Export (For Figma Variables)

| Token | Value |
|-------|-------|
| mosque-primary-50 | #ecfdf5 |
| mosque-primary-100 | #d1fae5 |
| mosque-primary-200 | #a7f3d0 |
| mosque-primary-500 | #10b981 |
| mosque-primary-600 | #059669 |
| mosque-primary-700 | #047857 |
| mosque-primary-800 | #065f46 |
| mosque-accent-500 | #eab308 |
| mosque-neutral-600 | #4b5563 |
| mosque-neutral-700 | #374151 |
| radius-lg | 12px |
| shadow-mosque | 0 4px 20px rgba(5,150,105,0.15) |

---

*Use these prompts with Figma AI, Figma's generative design, or paste into ChatGPT/Claude to generate Figma-ready descriptions. Frontend only—no backend. For best results, provide a screenshot of the live site alongside the prompt.*

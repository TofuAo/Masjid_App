# MyMasjidApp — Complete System Workflows (All Roles, All Functions)

This document describes **every workflow** in the current project: auth, registration, students, teachers, classes, attendance, fees, payments, results, reports, and administration. Each flow is based on actual routes, pages, and API usage in the codebase.

---

## Role–Access Summary

| Role | Login | Landing | Main functions |
|------|--------|---------|----------------|
| **Admin** | IC + password | `/` | Full: Admins, All Users, PIC Users, Pending Regs, PIC Approvals, Notifications, Pelajar, Guru, Kelas, Tukar Kelas, Staff Check-in, Kehadiran, Yuran, ToyyibPay Settings, Keputusan, Laporan, Hierarchy, Permission Matrix, System Health, Audit Logs, Settings. |
| **Teacher** | IC + password | `/` or `/guru` | Pelajar, Kelas, Staff Check-in, Kehadiran, Keputusan, Hierarchy, Account. |
| **Staff** | IC + password | `/` | Dashboard, Communication (minimal menu in Layout). |
| **PIC** | IC + password | `/staff-checkin` | Pelajar, Guru, Kelas, Staff Check-in, Kehadiran, Yuran, Keputusan, Laporan, Hierarchy, Pending Registrations. |
| **IB** | IC + password | `/ib-dashboard` | IB Account, IB Dashboard (payment confirmation), Laporan, Settings. |
| **Student** | IC only (Student Login) or IC + password | `/account` | Account, Kehadiran, Yuran, Pay Yuran, Payment History, Keputusan, Resit. |
| **Pending Teacher** | IC + password | `/pending-teacher` | Pending Teacher dashboard, Documents only until approved. |

All roles also have: Dashboard (home, cuaca, waktu solat), Announcements, Help, Contact.

---

## 1. Auth & Access Workflows

### 1.1 Log in (Staff / Admin / Teacher / PIC / IB)

- **Route:** `/login` → tab “Log Masuk”.
- **Steps:** Buka app → Log Masuk → Masukkan IC dan kata laluan → Tekan Log Masuk.
- **Decision:** IC dan kata laluan betul? **Tidak** → Papar ralat (akaun dikunci / pending / tidak aktif / guna Student Login) → Cuba lagi. **Ya** → Muatkan profil → **Decision:** Profil lengkap? **Tidak** → Lengkapkan Profil. **Ya** → **Decision:** Guru pending? **Ya** → Pending Teacher dashboard. **Tidak** → Masuk papan pemuka mengikut peranan (Admin/Staff/Teacher/PIC → `/` atau `/guru` atau `/staff-checkin`, IB → `/ib-dashboard`).
- **Backend:** `POST /api/auth/login`, `authController.login`, JWT + user returned.

### 1.2 Student Login

- **Route:** `/login` → tab “Student Login”.
- **Steps:** Buka app → Student Login → Masukkan IC sahaja → Tekan Log Masuk.
- **Decision:** IC berdaftar dan akaun aktif? **Tidak** → Papar ralat → Cuba lagi. **Ya** → Masuk `/account` (Yuran, Kehadiran, Keputusan, Resit).
- **Backend:** `POST /api/auth/student-login`.

### 1.3 Student Registration

- **Route:** `/student-register`.
- **Steps:** Isi nama, IC (12 digit), email/telefon/umur (pilihan), kata laluan (pilihan) → Hantar.
- **Decision:** Valid dan IC belum wujud? **Tidak** → Papar ralat (validation / duplicate) → Isi semula. **Ya** → Rekod pelajar + user dicipta → Berjaya (boleh log masuk).
- **Backend:** `POST /api/auth/register`.

### 1.4 Teacher Registration

- **Route:** `/teacher-register`.
- **Steps:** Isi maklumat guru → Hantar.
- **Decision:** Berjaya? **Ya** → User status `pending` → Hanya akses Pending Teacher dashboard sehingga admin lulus. **Tidak** → Papar ralat → Isi semula.
- **Backend:** `POST /api/teachers/register`.

### 1.5 Self-Register (Existing User)

- **Route:** `/register` (link akaun sedia ada).
- **Steps:** Isi nama, IC, kata laluan → Hantar.
- **Decision:** IC + nama match rekod sedia ada? **Ya** → Akaun dihubungkan, boleh log masuk. **Tidak** → Papar ralat.
- **Backend:** `POST /api/auth/self-register`.

### 1.6 Forgot Password

- **Route:** `/forgot-password` → pilih kaedah (email/phone) → `/reset-password` atau `/reset-password-code`.
- **Steps:** Masukkan IC → Pilih kaedah reset → Terima pautan atau kod → Set kata laluan baharu.
- **Decision:** Token/kod sah? **Ya** → Kata laluan dikemas kini → Kembali ke Log masuk. **Tidak** → Papar ralat.
- **Backend:** `POST /api/auth/request-reset-email` / `request-reset-phone`, `POST /api/auth/reset-password`.

### 1.7 Complete Profile

- **Route:** `/complete-profile` (redirect jika backend kata profil tidak lengkap).
- **Steps:** Isi/kemas kini maklumat yang diperlukan → Hantar.
- **Decision:** Lengkap? **Ya** → Akses penuh app. **Tidak** → Kekal di halaman lengkapkan profil.
- **Backend:** `GET /api/auth/profile/complete`, `PUT /api/auth/profile`.

### 1.8 Pending Teacher (Documents & Approval)

- **Route:** `/pending-teacher`, `/pending-teacher/documents`.
- **Steps:** Guru pending log masuk → Hanya akses dashboard pending + dokumen → Lengkapkan dokumen / tunggu.
- **Decision:** Admin lulus? **Ya** → Status aktif → Log masuk semula → Akses penuh Guru. **Tidak** → Kekal terhad.
- **Backend:** Admin: `POST /api/auth/approve-registration` / `reject-registration`.

---

## 2. Pelajar (Students) Workflow

- **Routes:** `/pelajar`, `/pelajar/*`. **API:** `/api/students` (CRUD).
- **Who:** Admin, PIC, Teacher (menu Pelajar).
- **Steps:** Pilih Pelajar dari menu → Senarai pelajar. **Tambah:** Isi form (nama, IC, kelas, dll.) → Hantar. **Edit:** Kemas kini maklumat → Simpan. **Padam:** Sahkan → Padam. **Lihat:** Klik pelajar → Detail (maklumat, yuran, kehadiran).
- **Decisions:** Valid? Duplicate IC? Kelas wujud? **Tidak** → Papar ralat. **Ya** → Simpan / Kemas kini.
- **Backend:** `GET/POST/PUT/DELETE /api/students`, role checks.

---

## 3. Guru (Teachers) Workflow

- **Routes:** `/guru`, `/guru/*`. **API:** `/api/teachers` (CRUD).
- **Who:** Admin, PIC (menu Guru); Teacher sees own context.
- **Steps:** Senarai guru → Tambah / Edit / Lihat. Tambah: Isi maklumat guru → Hantar. Edit: Kemas kini → Simpan.
- **Decisions:** Valid? **Ya** → Rekod dikemas kini. **Tidak** → Papar ralat.
- **Backend:** `GET/POST/PUT/DELETE /api/teachers`.

---

## 4. Kelas (Classes) Workflow

- **Routes:** `/kelas`, `/kelas/*`. **API:** `/api/classes` (CRUD).
- **Who:** Admin, PIC, Teacher.
- **Steps:** Senarai kelas → Tambah kelas (nama, dll.) → Simpan. Edit / Padam kelas. Lihat pelajar dalam kelas.
- **Decisions:** Nama unik? Rujukan sah? **Ya** → Simpan. **Tidak** → Ralat.
- **Backend:** `GET/POST/PUT/DELETE /api/classes`.

---

## 5. Tukar Kelas (Change Class) Workflow

- **Route:** `/change-classes`. **API:** `/api/admin/classes/change`, `rollback`.
- **Who:** Admin only.
- **Steps:** Pilih pelajar / kelas → Pilih kelas baharu → Hantar permintaan tukar kelas.
- **Decision:** Sah dan dibenarkan? **Ya** → Rekod tukar kelas. **Tidak** → Ralat. Boleh rollback jika disokong.
- **Backend:** `POST /api/admin/classes/change`, `POST /api/admin/classes/rollback`.

---

## 6. Kehadiran (Attendance) Workflow

- **Route:** `/kehadiran`. **API:** `/api/attendance` (get, mark, bulk, bulk with proof).
- **Who:** Admin, PIC, Teacher (mark); Student (view own).
- **Steps:** Pilih kelas, tarikh → Lihat rekod kehadiran. **Rekod:** Pilih pelajar, status (Hadir / Tidak Hadir / Cuti) → Simpan. **Bulk:** Isi status untuk banyak pelajar sekaligus → Simpan. **Proof:** Muat naik bukti (gambar) jika diperlukan; PIC boleh sahkan dokumen.
- **Decisions:** Kelas dan tarikh sah? Pelajar dalam kelas? **Ya** → Rekod disimpan. **Tidak** → Ralat.
- **Backend:** `GET/POST /api/attendance`, bulk endpoints, `confirmAttendanceDocument` (PIC).

---

## 7. Staff Check-in Workflow

- **Routes:** `/staff-checkin`, `/quick-checkin` (tanpa log masuk).
- **API:** `/api/staff-checkin` (check-in, auto check-in dengan GPS).
- **Who:** Admin, PIC, Teacher, Staff (check-in); sesiapa boleh quick-checkin dengan IC.
- **Steps (logged in):** Buka Staff Check-in → (Pilihan) Benarkan GPS → Tekan Check-in. **Decision:** Dalam radius masjid? **Ya** → Check-in berjaya. **Tidak** / timeout → Mesej (luar kawasan / sudah check-in / lokasi tidak tersedia).
- **Steps (quick-checkin):** Masukkan IC (dan PIN jika ada) → Check-in direkod → Boleh set `autoCheckInPending` untuk bila log masuk nanti.
- **Backend:** `POST /api/staff-checkin/checkin`, `autoCheckIn`; settings masjid location for radius.

---

## 8. Yuran (Fees) Workflow

- **Route:** `/yuran`. **API:** `/api/fees` (list, get, create, update, mark paid).
- **Who:** Admin, PIC (manage); Student (view own, pay).
- **Steps:** Senarai yuran (ikut pelajar/kelas/bulan). **Urus (Admin/PIC):** Tambah/kemas kini yuran, tandakan bayar secara manual jika perlu. **Pelajar:** Lihat yuran sendiri → Klik Bayar → ke Pay Yuran.
- **Decisions:** Rekod sah? Duplicate? **Ya** → Simpan. **Tidak** → Ralat.
- **Backend:** `GET/POST/PUT /api/fees`, `markAsPaid`.

---

## 9. Pay Yuran (Payment) Workflow

- **Routes:** `/pay-yuran/:id`, `/payment/return`, `/payment-history`. **API:** `/api/toyyibpay/initiate`, `/api/webhook/payment`, `/api/receipts`, `/api/payments`.
- **Who:** Student (or fee owner) pays; IB confirms.
- **Steps:** Dari Yuran → Pilih yuran → Bayar → Pilih ToyyibPay (atau QR manual). **ToyyibPay:** Klik Bayar → Backend create bill → Redirect ke ToyyibPay → User bayar di gateway → Redirect ke `/payment/return`. Gateway panggil **webhook** → Backend kemas kini status bayaran → Jika berjaya, resit dijana. User boleh lihat Payment History dan buka resit.
- **Decisions:** Fee wujud? Amount match? Webhook signature sah? **Ya** → Status dikemas kini, resit jika completed. **Tidak** → Ralat / 200 dengan success:false untuk webhook.
- **Backend:** `POST /api/toyyibpay/initiate`, `POST /api/webhook/payment`, `receiptService.generatePaymentReceipt`, `GET /api/receipts/payment/:id`.

---

## 10. IB (Payment Confirmation) Workflow

- **Routes:** `/ib-dashboard`, `/ib-account`. **API:** `/api/ib` (approve, flag, reports).
- **Who:** IB only.
- **Steps:** Buka IB Dashboard → Lihat laporan bayaran / bayaran mengikut tarikh → Pilih bayaran → Sahkan (approve) atau Tandakan (flag) dengan sebab. Boleh approve by date atau pilih senarai.
- **Decisions:** Sah untuk disahkan? **Ya** → Bayaran disahkan (document_confirmed). **Tidak** → Flag dengan sebab.
- **Backend:** `POST /api/ib/approve-payments-by-date`, `flagPayment`, `getFlaggedPayments`, dll.

---

## 11. Keputusan (Results) Workflow

- **Route:** `/keputusan`. **API:** `/api/results`, `/api/exams`.
- **Who:** Admin, PIC, Teacher (manage); Student (view own).
- **Steps:** Pilih peperiksaan/sesi → Lihat atau masukkan keputusan pelajar (markah). Simpan / kemas kini.
- **Decisions:** Exam dan pelajar sah? **Ya** → Simpan. **Tidak** → Ralat.
- **Backend:** `GET/POST/PUT /api/results`, `GET/POST /api/exams`.

---

## 12. Resit (Receipts / Ulangan) Workflow

- **Route:** `/resit`. **API:** `/api/resit`, `/api/receipts`.
- **Who:** Student (view own resit); Admin/others if exposed.
- **Steps:** Buka Resit → Senarai resit / pembayaran → Klik untuk lihat atau muat turun resit (HTML/PDF).
- **Backend:** `GET /api/receipts/payment/:id`, resit routes.

---

## 13. Laporan (Reports) Workflow

- **Route:** `/laporan`. **API:** Export/report endpoints.
- **Who:** Admin, PIC, Teacher (laporan penuh); IB (laporan bayaran).
- **Steps:** Pilih jenis laporan, tempoh, filter → Jana / export (PDF/Excel jika ada).
- **Backend:** Report and export logic per role.

---

## 14. Administration Workflows (Admin Only)

- **Pending Registrations:** `/pending-registrations` → Senarai pendaftaran menunggu → Lulus / Tolak (`POST /api/auth/approve-registration`, `reject-registration`).
- **PIC Approvals:** `/pic-approvals` → Kelulusan perubahan PIC.
- **Admins:** `/admins` → CRUD pentadbir. **API:** `/api/admins`.
- **All Users:** `/all-users`, `/all-users/:ic` → Lihat/edit semua pengguna. **API:** `/api/users`.
- **PIC Users:** `/pic-users` → Urus pengguna PIC.
- **Notifications:** `/notifications` → Pusat notifikasi sistem.
- **Hierarchy:** `/hierarchy` → Struktur organisasi.
- **Permission Matrix:** `/permission-matrix` → Matriks kebenaran.
- **System Health:** `/system-health` → Status sistem.
- **Audit Logs:** `/audit-logs` → Log audit.
- **Settings:** `/settings` → Tetapan sistem (masjid location, QR, maintenance, dll.).
- **ToyyibPay Settings:** `/toyyibpay-settings` → Konfigurasi pembayaran.

---

## 15. Common Elements

- **Dashboard:** `/` — Ringkasan statistik, pautan pantas (ikut peranan).
- **Cuaca:** `/weather` — API cuaca.
- **Waktu Solat:** `/azan-timer` — Waktu solat.
- **Announcements:** `/announcements` — Pengumuman.
- **Help:** `/help` — Pusat bantuan.
- **Contact:** `/contact` — Hubungi.
- **Account:** `/account` (student/personal), `/ib-account` (IB) — Profil, tetapan peribadi.

---

## 16. Public / Unauthenticated

- **Routes:** `/login`, `/student-register`, `/teacher-register`, `/register`, `/forgot-password`, `/choose-reset-method`, `/reset-password`, `/reset-password-code`, `/quick-checkin`.
- **Webhook:** `POST /api/webhook/payment` (no auth; verified by signature).

---

*Semua aliran di atas berdasarkan kod semasa: `src/App.jsx`, `src/Layout.jsx`, `backend/routes/index.js`, dan controller berkaitan.*

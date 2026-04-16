# MyMasjidApp — Workflows by User Type

Workflows for each user type, based on `Layout.jsx`, `App.jsx`, `Login.jsx`, and backend auth/role logic.

**Master template:** All flows follow the standard workflow guide: **Open app → Log in → Have account already? → (Yes) Enter credentials → Correct? → Enter homepage**, or **(No) Enter registration information → Registered?**, or **Forgot password → Reset password**. See **[WORKFLOW_GUIDE.md](./WORKFLOW_GUIDE.md)** and **workflow-guide.html** for the visual template.

---

## User Types (Roles)

| Role | Login method | Default landing | Description |
|------|--------------|----------------|-------------|
| **Admin** | IC + password (Log Masuk tab) | `/` (Dashboard) | Full system access: users, classes, attendance, fees, settings, audit. |
| **Teacher** | IC + password | `/` or `/guru` | Pelajar, Kelas, Check-in, Kehadiran, Keputusan. Pending teachers land on `/pending-teacher` until approved. |
| **Staff** | IC + password | `/` (Dashboard) | Dashboard + Communication (staff has minimal sidebar in current Layout). |
| **PIC** | IC + password | `/staff-checkin` | Pelajar, Guru, Kelas, Check-in, Kehadiran, Yuran, Keputusan, Laporan, Pending Registrations. |
| **IB** | IC + password | `/ib-dashboard` | IB Account, IB Dashboard (payment confirmation), Laporan, Settings. |
| **Student** | IC only (Student Login tab) or IC + password | `/account` | Account, Kehadiran, Yuran, Keputusan, Resit. |
| **Pending Teacher** | IC + password | `/pending-teacher` | Only Pending Teacher dashboard and Documents until admin approves. |

---

## 1. Admin Workflow

**Entry:** Log in with IC + password on “Log Masuk” tab.

**Flow:**
1. MULA → Buka aplikasi → Halaman log masuk.
2. Masukkan IC dan kata laluan → Tekan Log Masuk.
3. **Keputusan:** IC dan kata laluan betul? **Tidak** → Papar mesej ralat → Kembali masukkan maklumat. **Ya** → Lanjut.
4. Muatkan profil; jika tidak lengkap → Lengkapkan Profil.
5. Masuk ke Dashboard `/` (admin home).
6. Sidebar: Dashboard, Administration (Admins, All Users, PIC Users, Pending Registrations, PIC Approvals, Notifications), Users & Academics (Pelajar, Guru, Kelas, Tukar Kelas), Attendance (Staff Check-in, Kehadiran), Finance (Yuran, ToyyibPay Settings), Reports (Keputusan, Laporan), System (Hierarchy, Permission Matrix, System Health, Audit Logs, Settings), Communication.
7. TAMAT — Admin boleh urus pengguna, kelas, yuran, tetapan sistem.

```mermaid
flowchart TB
  A1([MULA]) --> A2[Log Masuk: IC + kata laluan]
  A2 --> A3{Terkebenar?}
  A3 -->|Tidak| A4[Papar ralat, cuba lagi]
  A4 --> A2
  A3 -->|Ya| A5[Muatkan profil]
  A5 --> A6[Dashboard /]
  A6 --> A7[Menu: Pentadbiran, Pelajar, Kelas, Kehadiran, Yuran, Tetapan]
  A7 --> A8([TAMAT])
```

---

## 2. Teacher Workflow

**Entry:** Log in with IC + password; select Staff/Guru role if multiple.

**Flow:**
1. MULA → Buka aplikasi → Log Masuk (IC + kata laluan).
2. **Keputusan:** IC dan kata laluan betul? **Tidak** → Ralat, cuba lagi. **Ya** → Lanjut.
3. **Keputusan:** Status guru = pending? **Ya** → Hanya akses Pending Teacher dashboard (`/pending-teacher`, `/pending-teacher/documents`) sehingga diluluskan admin → TAMAT (terhad). **Tidak** → Lanjut.
4. Muatkan profil (lengkapkan jika perlu).
5. Masuk ke Dashboard `/` atau `/guru`.
6. Menu: Dashboard, Pelajar, Kelas, Staff Check-in, Kehadiran, Keputusan, Hierarchy, Settings.
7. TAMAT — Guru boleh urus kelas, rekod kehadiran, keputusan.

```mermaid
flowchart TB
  T1([MULA]) --> T2[Log Masuk: IC + kata laluan]
  T2 --> T3{Terkebenar?}
  T3 -->|Tidak| T4[Papar ralat]
  T4 --> T2
  T3 -->|Ya| T5{Guru pending?}
  T5 -->|Ya| T6[Hanya Pending Teacher dashboard]
  T6 --> T7([TAMAT - terhad])
  T5 -->|Tidak| T8[Dashboard / Guru]
  T8 --> T9[Pelajar, Kelas, Check-in, Kehadiran, Keputusan]
  T9 --> T10([TAMAT])
```

---

## 3. Staff Workflow

**Entry:** Log in with IC + password (Staff/Teacher option on login).

**Flow:**
1. MULA → Buka aplikasi → Log Masuk (IC + kata laluan).
2. **Keputusan:** Terkebenar? **Tidak** → Ralat, cuba lagi. **Ya** → Lanjut.
3. Muatkan profil.
4. Masuk ke Dashboard `/` (logoDestination staff = '/').
5. Sidebar (semasa): Dashboard group + Communication (Staff tiada group khas dalam Layout; akses melalui Dashboard).
6. TAMAT — Staff dalam aplikasi.

```mermaid
flowchart TB
  S1([MULA]) --> S2[Log Masuk: IC + kata laluan]
  S2 --> S3{Terkebenar?}
  S3 -->|Tidak| S4[Papar ralat]
  S4 --> S2
  S3 -->|Ya| S5[Dashboard /]
  S5 --> S6[Menu: Dashboard, Komunikasi]
  S6 --> S7([TAMAT])
```

---

## 4. PIC Workflow

**Entry:** Log in with IC + password; pilih peranan PIC jika berbilang.

**Flow:**
1. MULA → Buka aplikasi → Log Masuk (IC + kata laluan).
2. **Keputusan:** Terkebenar? **Tidak** → Ralat, cuba lagi. **Ya** → Lanjut.
3. Muatkan profil.
4. Masuk ke `/staff-checkin` (PIC default).
5. Menu: Dashboard, Pelajar, Guru, Kelas, Staff Check-in, Kehadiran, Yuran, Keputusan, Laporan, Hierarchy; Pending Registrations (quick access).
6. TAMAT — PIC boleh urus pengguna akademik, kehadiran, yuran, kelulusan pendaftaran.

```mermaid
flowchart TB
  P1([MULA]) --> P2[Log Masuk: IC + kata laluan]
  P2 --> P3{Terkebenar?}
  P3 -->|Tidak| P4[Papar ralat]
  P4 --> P2
  P3 -->|Ya| P5[Staff Check-in /]
  P5 --> P6[Pelajar, Guru, Kelas, Kehadiran, Yuran, Laporan]
  P6 --> P7([TAMAT])
```

---

## 5. IB (Pengesah Pembayaran) Workflow

**Entry:** Log in with IC + password; pilih peranan IB.

**Flow:**
1. MULA → Buka aplikasi → Log Masuk (IC + kata laluan).
2. **Keputusan:** Terkebenar? **Tidak** → Ralat, cuba lagi. **Ya** → Lanjut.
3. Muatkan profil.
4. Masuk ke `/ib-dashboard` (IB default).
5. Menu: IB Account, IB Dashboard (pengesahan pembayaran / laporan bayaran), Laporan, Settings; plus Dashboard (rumah, cuaca, waktu solat).
6. TAMAT — IB boleh sahkan pembayaran, lihat laporan, tetapan akaun IB.

```mermaid
flowchart TB
  I1([MULA]) --> I2[Log Masuk: IC + kata laluan]
  I2 --> I3{Terkebenar?}
  I3 -->|Tidak| I4[Papar ralat]
  I4 --> I2
  I3 -->|Ya| I5[IB Dashboard]
  I5 --> I6[Pengesahan bayaran, Laporan, Tetapan]
  I6 --> I7([TAMAT])
```

---

## 6. Student Workflow

**Entry:** Log in via “Student Login” (IC sahaja) atau “Log Masuk” (IC + kata laluan). Backend hanya benarkan pelajar guna Student Login untuk tab student-login; jika pelajar guna Log Masuk biasa, mesej “Pelajar mesti menggunakan Student Login” dan tab beralih ke Student Login.

**Flow:**
1. MULA → Buka aplikasi → Pilih tab **Student Login**.
2. Masukkan nombor IC sahaja (tiada kata laluan) → Tekan Log Masuk.
3. **Keputusan:** IC didaftar dan akaun aktif? **Tidak** → Papar mesej (IC tidak ditemui / pending / tidak aktif) → Cuba lagi. **Ya** → Lanjut.
4. Muatkan profil (jika perlu).
5. Masuk ke `/account` (student default).
6. Menu: Account, Kehadiran, Yuran, Keputusan, Resit; plus Dashboard (rumah, cuaca, waktu solat).
7. TAMAT — Pelajar boleh lihat akaun, yuran, bayar yuran, keputusan, resit.

```mermaid
flowchart TB
  ST1([MULA]) --> ST2[Student Login: masukkan IC sahaja]
  ST2 --> ST3[Tekan Log Masuk]
  ST3 --> ST4{IC sah & akaun aktif?}
  ST4 -->|Tidak| ST5[Papar ralat: IC tidak ditemui / pending]
  ST5 --> ST2
  ST4 -->|Ya| ST6[Akaun /]
  ST6 --> ST7[Yuran, Kehadiran, Keputusan, Resit]
  ST7 --> ST8([TAMAT])
```

---

## 7. Pending Teacher Workflow

**Entry:** Guru yang baru berdaftar; status = `pending`. Log in dengan IC + kata laluan.

**Flow:**
1. MULA → Log Masuk (IC + kata laluan).
2. **Keputusan:** Terkebenar? **Tidak** → Ralat. **Ya** → Lanjut.
3. Backend benarkan guru pending log masuk (authController).
4. Frontend: jika `user.status === 'pending'` dan role teacher → **hanya** route: `/pending-teacher`, `/pending-teacher/documents`, `/complete-profile`, `/help`, `/contact`; semua path lain redirect ke `/pending-teacher`.
5. Guru lengkapkan dokumen / tunggu kelulusan admin.
6. **Keputusan:** Admin meluluskan? **Ya** → Status jadi aktif → Log masuk semula → Aliran Guru penuh (Dashboard, Pelajar, Kelas, dll.). **Tidak** → Kekal di Pending Teacher dashboard.
7. TAMAT — Sama ada terhad (pending) atau penuh (selepas lulus).

```mermaid
flowchart TB
  PT1([MULA]) --> PT2[Log Masuk: IC + kata laluan]
  PT2 --> PT3{Terkebenar?}
  PT3 -->|Tidak| PT4[Papar ralat]
  PT4 --> PT2
  PT3 -->|Ya| PT5[Pending Teacher dashboard sahaja]
  PT5 --> PT6[Lengkapkan dokumen / tunggu kelulusan]
  PT6 --> PT7{Diluluskan admin?}
  PT7 -->|Belum| PT5
  PT7 -->|Ya| PT8[Akses penuh Guru]
  PT8 --> PT9([TAMAT])
```

---

## Summary Table

| User type | Login | Decision(s) | Error path | Success / completion |
|-----------|--------|-------------|------------|------------------------|
| Admin | IC + password | Credentials valid? | Show error → retry | Dashboard, full menu |
| Teacher | IC + password | Valid? Pending? | Error; or limited to pending-teacher | Dashboard/Guru, Pelajar, Kelas, Kehadiran, Keputusan |
| Staff | IC + password | Valid? | Error → retry | Dashboard, Communication |
| PIC | IC + password | Valid? | Error → retry | Staff Check-in, Pelajar, Kehadiran, Yuran, Laporan |
| IB | IC + password | Valid? | Error → retry | IB Dashboard, pengesahan bayaran, Laporan |
| Student | IC only (Student Login) | IC registered & active? | Error → retry | Account, Yuran, Kehadiran, Keputusan, Resit |
| Pending Teacher | IC + password | Valid? Approved? | Error; or stay on pending | Pending dashboard → (after approval) full Teacher |

---

*Berdasarkan: `src/App.jsx`, `src/Layout.jsx`, `src/components/auth/Login.jsx`, `src/utils/userRoles.js`, `backend/controllers/authController.js`.*

# Workflow Guide — Standard Template for All User Flows

This document defines the **standard workflow template** used as the guide for all login, registration, and access flows in MyMasjidApp. Every user-type workflow follows this structure.

---

## 1. Standard Workflow Template (Master Guide)

Use this flow as the reference when designing or documenting any workflow:

```
[START] Open app
    ↓
  Log in
    ↓
  Have account already?  ──No──→  Enter registration information
    │                                    ↓
   Yes                          Registered?
    ↓                              │     │
  Enter account name and password  No    Yes
    ↓                              │     │
  Correct?                         │     └──→ (back to) Log in
    │   │                          │
   Yes  No                         └──→ (back to) Enter registration information
    │    │
    │    ├──→ (retry) Enter account name and password
    │    └──→ Forgot password
    │              ↓
    │         Reset password
    │              ↓
    │         (then) Log in
    ↓
[END] Enter homepage
```

### Nodes

| Symbol | Name | Description |
|--------|------|-------------|
| Oval | **Open app** | Start: user opens the application. |
| Rectangle | **Log in** | User intends to sign in (may then choose login or register). |
| Diamond | **Have account already?** | Decision: existing user (Yes) vs new user (No). |
| Rectangle | **Enter account name and password** | User submits credentials (e.g. IC + password). |
| Rectangle | **Enter registration information** | User fills registration form. |
| Diamond | **Registered?** | Decision: registration successful (Yes) or not (No). |
| Diamond | **Correct?** | Decision: credentials valid (Yes) or not (No). |
| Rectangle | **Forgot password** | User chooses password recovery. |
| Rectangle | **Reset password** | User completes reset (then returns to Log in). |
| Oval | **Enter homepage** | End: user reaches their home/dashboard. |

### Paths

- **Existing user, success:** Open app → Log in → Have account? **Yes** → Enter credentials → Correct? **Yes** → Enter homepage.
- **New user:** Open app → Log in → Have account? **No** → Enter registration information → Registered? **Yes** → Log in → (then existing-user path).
- **Registration retry:** Enter registration information → Registered? **No** → back to Enter registration information.
- **Login retry:** Enter credentials → Correct? **No** → back to Enter account name and password.
- **Forgot password:** Enter credentials → Correct? **No** → Forgot password → Reset password → Log in.

---

## 2. How MyMasjidApp Workflows Follow This Guide

Each user type maps onto the same template; only the labels and destinations change.

### 2.1 All roles (except Student Login only)

| Template step | MyMasjidApp equivalent |
|---------------|------------------------|
| Open app | Buka aplikasi MyMasjidApp (React). |
| Log in | Halaman log masuk; pilih tab **Log Masuk** (bukan Student Login). |
| Have account already? | **Yes** → masukkan IC dan kata laluan. **No** → Daftar (Student / Teacher / Self-register). |
| Enter account name and password | Masukkan nombor IC dan kata laluan → Tekan Log Masuk. |
| Enter registration information | `/student-register`, `/teacher-register`, atau `/register` (self-register). |
| Registered? | **Yes** → kembali ke Log masuk (atau auto-login). **No** → semak semula maklumat pendaftaran. |
| Correct? | Backend sahkan IC + kata laluan. **Yes** → muatkan profil → Enter homepage (role-specific). **No** → papar ralat atau Lupa kata laluan. |
| Forgot password | `/forgot-password` → pilih kaedah reset → Reset password. |
| Reset password | Reset selesai → kembali ke Log masuk. |
| Enter homepage | **Admin/Staff/Teacher/PIC** → `/` atau `/guru` atau `/staff-checkin`. **IB** → `/ib-dashboard`. **Student** (jika guna Log Masuk) → `/account`. |

### 2.2 Student (Student Login path)

| Template step | MyMasjidApp equivalent |
|---------------|------------------------|
| Open app | Buka aplikasi. |
| Log in | Pilih tab **Student Login**. |
| Have account already? | **Yes** → masukkan **IC sahaja** (tiada kata laluan). **No** → Student registration. |
| Enter account name and password | Masukkan IC sahaja → Tekan Log Masuk. |
| Correct? | IC berdaftar dan akaun aktif? **Yes** → Enter homepage (`/account`). **No** → papar ralat, cuba lagi. |
| Enter homepage | Halaman Akaun; akses Yuran, Kehadiran, Keputusan, Resit. |

### 2.3 Pending Teacher (special branch)

After **Correct? Yes**, one extra decision:

- **Guru pending kelulusan?**  
  - **Yes** → Enter homepage = **Pending Teacher dashboard** sahaja (terhad) → lengkapkan dokumen / tunggu kelulusan.  
  - **No** → Enter homepage = Dashboard/Guru penuh.

---

## 3. Quick Reference: One Table Per Path

| Path | Steps in MyMasjidApp |
|------|----------------------|
| **Success (existing user)** | Buka app → Log Masuk → IC + kata laluan → Betul? Ya → Profil → Papan pemuka (mengikut peranan). |
| **New user (register)** | Buka app → Log Masuk → Tiada akaun? → Daftar (pelajar/guru/self) → Berjaya? Ya → Log masuk. |
| **Register fail** | Daftar → Berjaya? Tidak → Isi semula maklumat pendaftaran. |
| **Login fail** | IC + kata laluan → Betul? Tidak → Papar ralat → Cuba lagi atau Lupa kata laluan. |
| **Forgot password** | Betul? Tidak → Lupa kata laluan → Set semula kata laluan → Log masuk. |

---

## 4. Where This Is Implemented

- **Frontend:** `src/App.jsx` (routes for login, register, forgot-password, complete-profile, pending-teacher).  
- **Login/Register UI:** `src/components/auth/Login.jsx`, `Register.jsx`; `src/pages/StudentRegistration.jsx`, `TeacherRegistration.jsx`.  
- **Password reset:** `src/pages/ForgotPassword.jsx`, `ChooseResetMethod.jsx`, `ResetPassword.jsx`, `ResetPasswordCode.jsx`.  
- **Backend auth:** `backend/routes/auth.js`, `backend/controllers/authController.js`.

---

## 5. Visual Reference

A visual version of this guide flowchart is in **`workflow-guide.html`** (Open app → Log in → Have account? → Registration / Login → Correct? → Enter homepage or Forgot password → Reset password). Use it as the single reference when designing or reviewing any workflow.

---

*This guide is the standard for all workflows in MyMasjidApp. New features (e.g. new roles or login methods) should be mapped onto this template and documented in WORKFLOWS_BY_USER_TYPE.md.*

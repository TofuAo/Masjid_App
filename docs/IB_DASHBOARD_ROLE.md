# IB Dashboard Role

This document describes how the **IB (Pengesah Pembayaran)** role works in MyMasjidApp: where IB users land, what they see, and what they can do.

---

## 1. What is the IB role?

- **Label:** IB (Payment Approver) / IB (Pengesah Pembayaran)
- **Purpose:** Fees management and payment approval. The IB function has full authority over fee-related matters; no external approval is required. **Any action by IB is always first priority.** See [IB_FEES_MANAGEMENT_AUTHORITY.md](./IB_FEES_MANAGEMENT_AUTHORITY.md) for the official policy.

---

## 2. Where does IB land after login?

- **Default route:** `/ib-dashboard`
- When an IB user logs in, they are taken directly to **IB Dashboard** (monthly payment confirmation), not the general Dashboard (`/`).
- The app logo in the sidebar links to `/ib-dashboard` for IB users.

---

## 3. IB menu (sidebar)

| Group | Items |
|-------|--------|
| **Account** | IB Account, IB Dashboard |
| **Reports & Results** | Laporan |
| **System & Configuration** | Settings (via Account) |
| **Communication & Support** | Announcements, Help, Contact |

IB does **not** see admin-only items (e.g. Pelajar, Guru, Kelas, Yuran, Kehadiran, Admins, Pending Registrations, PIC Approvals) unless the same user also has the **admin** role and has switched to admin mode.

---

## 4. Main Dashboard (`/`) for IB

If an IB user opens the main Dashboard (`/`), they see:

- **Role widget:** “Pengesahan Pembayaran” – count of monthly reports waiting for confirmation, with a link **Pergi ke IB Dashboard →** to `/ib-dashboard`.
- Other dashboard widgets (quick stats, featured classes, recent activity, alerts) as applicable.
- **Quick actions** (when shown for IB): Sahkan Pembayaran, Pending Pengesahan, Laporan Yuran, Statistik Kutipan, Dokumen Kelas – all linking to `/ib-dashboard`.

---

## 5. IB Dashboard (`/ib-dashboard`) – capabilities

The IB Dashboard is the main screen for payment confirmation and fees oversight.

| Capability | Description |
|------------|-------------|
| **Monthly reports** | List of available monthly reports (by month/year). Select one to view details. |
| **Confirm / Reject monthly report** | Confirm, reject, or mark a month’s report as pending. Optional notes. |
| **Quick approve month** | One-click approval of all payments for a selected month. |
| **Approve by date range** | Approve all payments for a month, or for a selected start/end date within that month. Option to exclude specific payment IDs. |
| **Selective approval** | Select individual payments from the list and approve only those (with optional notes). |
| **Bulk reject** | Reject multiple selected payments at once (with reason and optional “send back” behaviour). |
| **Flagged payments** | View and manage payments that need clarification (e.g. document issues). Flag or resolve. |
| **Approval history** | View audit trail of approvals for the selected month. |
| **Export** | Export monthly summary and approval history (e.g. Excel/PDF). |
| **Executive summary** | Optional summary/trend view for the selected report. |

Data is loaded via the IB API (e.g. `ibAPI.getAvailableReports`, `ibAPI.getMonthlyReport`, `ibAPI.approvePaymentsByDate`, `ibAPI.getFlaggedPayments`, etc.). All actions are permission-checked on the backend with the IB role.

---

## 6. IB Account (`/ib-account`)

- **IB Account** in the menu goes to `/ib-account`.
- Used for higher-level oversight: e.g. class documents, confirming class attendance and class fees in bulk.
- Complements the IB Dashboard, which focuses on monthly payment confirmation and audit.

---

## 7. Summary

| Item | Detail |
|------|--------|
| **Role** | IB (Pengesah Pembayaran) |
| **Default after login** | `/ib-dashboard` |
| **Priority** | Any action by IB is always first priority. |
| **Primary function** | Fees management and payment approval (full authority, no external approval required) |
| **Main pages** | IB Dashboard (`/ib-dashboard`), IB Account (`/ib-account`) |
| **Main Dashboard** | Shows pending confirmation count and quick link to IB Dashboard |
| **Backend** | Routes under `/api/ib/*`; access controlled by IB (and admin) role |

For the meaning of “recordings” and counts on the IB Dashboard (e.g. Jumlah Pembayaran vs Telah Dibayar), see [IB_DASHBOARD_RECORDINGS_EXPLAINED.md](./IB_DASHBOARD_RECORDINGS_EXPLAINED.md).

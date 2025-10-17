# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## 📅 Yearly Database System

Each year uses its own database:

`masjid_app_2024`
`masjid_app_2025`

Master database: `masjid_master`
Tracks all active years and controls which DB is currently in use.

Workflow:

1. Admin creates a new year's database.
2. Selected data (students, teachers, classes) is copied over.
3. Old transactional data (fees, attendance, results) is reset.
4. New year is set active.

Year | Database | Status
-----|----------|--------
2024 | `masjid_app_2024` | Archived
2025 | `masjid_app_2025` | Active

Benefits:

* Clean yearly separation
* Easy backup & restore
* Preserves historical data
* Improves performance
# Masjid_App

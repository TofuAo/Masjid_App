# MyMasjidApp - Masjid Management System

A comprehensive full-stack application for managing masjid/madrasah operations including student management, attendance tracking, fee management, exam results, and more.

## 🚀 Quick Start

**For Development:**
```bash
git clone <repo-url>
cd MyMasjidApp
./setup-env.sh    # or setup-env.bat on Windows
./deploy.sh       # or deploy.bat on Windows
```

**For Production Deployment:**
See [QUICK_START.md](./QUICK_START.md) for step-by-step instructions.

## 📚 Documentation

### For End Users:
- **[USER_GUIDE.md](./USER_GUIDE.md)** - 📖 Complete user guide for all roles (Pelajar, Guru, Pentadbir, IB)
- **Help Center** - Access in-app help center at `/help` route

### For Developers:
- **[QUICK_START.md](./QUICK_START.md)** - Get started in 5 minutes
- **[DEPLOYMENT_README.md](./DEPLOYMENT_README.md)** - Complete deployment guide
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Deployment checklist
- **[SECURITY_GUIDE.md](./SECURITY_GUIDE.md)** - Security best practices
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Original deployment guide

## 🛠️ Tech Stack

**Frontend:**
- React 19
- Vite
- TailwindCSS
- React Router
- Axios

**Backend:**
- Node.js
- Express.js
- MySQL 8.0
- JWT Authentication
- Bcrypt for password hashing

**DevOps:**
- Docker & Docker Compose
- Nginx reverse proxy
- SSL/TLS with Let's Encrypt

## 📋 Features

- Student Management
- Teacher Management
- Class Management
- Attendance Tracking
- Exam Management
- Results Management
- Fee Management
- User Authentication & Authorization
- Yearly Database System

## 🏗️ Project Structure

```
MyMasjidApp/
├── backend/              # Express.js API
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Auth middleware
│   ├── routes/          # API routes
│   ├── scripts/        # Database scripts
│   └── server.js        # Entry point
├── src/                 # React frontend
├── database/           # SQL schema files
├── nginx/              # Nginx configuration
├── scripts/            # Deployment scripts
└── docker-compose.yml  # Docker orchestration
```

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

# Current Version Snapshot - MyMasjidApp

**Date:** 2025-11-18  
**Version:** Production  
**Purpose:** Document current codebase state and key configurations

---

## 🎯 Key Changes in Current Version

### 1. Status Field Removal (Classes)
- **Status:** ✅ Completed
- **Impact:** Status field completely removed from class management UI
- **Database:** Status column still exists, defaults to 'aktif'
- **Files Modified:**
  - `backend/routes/classes.js` - Removed status validation
  - `backend/controllers/classController.js` - Removed status from create/update, removed status filtering
  - `src/components/kelas/KelasForm.jsx` - No status field (already removed)
  - `src/components/kelas/KelasList.jsx` - No status display (already removed)

### 2. Animated Forest Background → Fallen Leaves
- **Status:** ✅ Completed
- **Component:** `src/components/seasonal/AnimatedForestBackground.jsx`
- **Features:**
  - 3 parallax layers of falling leaves
  - Autumn leaf colors (browns, oranges, golds)
  - Rotation and drift animations
  - Outlines and shading for visibility
  - Lightweight and performant

### 3. Student Self-Registration
- **Status:** ✅ Completed
- **Flow:** Student registers → Pending status → Admin approval → Access granted
- **Files:**
  - `src/pages/StudentRegistration.jsx` - Registration form
  - `src/pages/PendingRegistrations.jsx` - Admin approval page
  - `backend/controllers/authController.js` - Registration with pending status

### 4. Profile Completion Fix
- **Status:** ✅ Completed
- **Changes:**
  - Students cannot select class or registration date
  - Profile completion persists correctly
  - Navigation after completion works
  - Backend no longer checks for kelas_id/tarikh_daftar for students

---

## 📁 Project Structure

```
MyMasjidApp/
├── src/
│   ├── components/
│   │   ├── auth/          # Authentication components
│   │   ├── kelas/         # Class management components
│   │   ├── pelajar/       # Student management components
│   │   ├── guru/          # Teacher management components
│   │   ├── kehadiran/     # Attendance components
│   │   ├── keputusan/     # Results components
│   │   ├── yuran/         # Fees components
│   │   ├── seasonal/      # AnimatedForestBackground.jsx
│   │   └── ui/            # Reusable UI components
│   ├── pages/             # All page components
│   ├── services/          # API services
│   ├── hooks/             # Custom React hooks
│   ├── contexts/          # React contexts (Language, Preferences)
│   ├── utils/             # Utility functions
│   ├── App.jsx            # Main app component with routing
│   └── Layout.jsx         # Main layout with sidebar
├── backend/
│   ├── controllers/       # Business logic controllers
│   ├── routes/            # API route definitions
│   ├── middleware/        # Express middleware
│   ├── config/            # Configuration files
│   └── utils/              # Backend utilities
├── database/              # SQL migration files
└── docker-compose.yml     # Docker configuration
```

---

## 🔑 Key Configuration Files

### Frontend Configuration

**`src/App.jsx`** - Main routing and authentication
- Handles user authentication state
- Manages profile completion flow
- Defines all application routes
- Role-based route protection

**`src/Layout.jsx`** - Main layout component
- Sidebar navigation with animated background
- Top header with user info
- Responsive design

**`src/services/api.js`** - API service layer
- Centralized API calls
- Authentication token management
- Error handling
- Response normalization

### Backend Configuration

**`backend/server.js`** - Express server setup
- Middleware configuration
- Route registration
- Error handling
- Database connection

**`backend/config/database.js`** - Database configuration
- MySQL connection pool
- Connection management
- Error handling

**`backend/routes/index.js`** - Route registration
- All API routes registered here
- Authentication middleware applied

---

## 🗄️ Database Schema (Key Tables)

### Users Table
```sql
- ic (VARCHAR, PRIMARY KEY)
- nama (VARCHAR)
- email (VARCHAR, UNIQUE)
- password (VARCHAR)
- role (ENUM: 'student', 'teacher', 'admin', 'pic')
- status (ENUM: 'aktif', 'tidak_aktif', 'cuti', 'pending')
```

### Classes Table
```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- nama_kelas (VARCHAR)
- level (VARCHAR)
- sessions (JSON)
- yuran (DECIMAL)
- guru_ic (VARCHAR, FOREIGN KEY)
- kapasiti (INT)
- status (ENUM: 'aktif', 'tidak_aktif', 'penuh') DEFAULT 'aktif'
- created_at, updated_at (TIMESTAMP)
```

**Note:** Status field exists in database but is NOT used in application logic.

### Students Table
```sql
- user_ic (VARCHAR, PRIMARY KEY, FOREIGN KEY)
- kelas_id (INT, FOREIGN KEY)
- tarikh_daftar (DATE)
```

### Teachers Table
```sql
- user_ic (VARCHAR, PRIMARY KEY, FOREIGN KEY)
- kepakaran (JSON)
```

### Other Key Tables
- `attendance` - Attendance records
- `fees` - Fee records
- `results` - Exam results
- `exams` - Exam information
- `announcements` - System announcements

---

## 🔐 Authentication Flow

1. **Login** (`/login`)
   - User enters credentials
   - Backend validates and returns token
   - Token stored in localStorage
   - User data stored in localStorage

2. **Profile Check**
   - App checks if profile is complete
   - If incomplete → redirect to `/complete-profile`
   - If complete → show main app

3. **Profile Completion** (`/complete-profile`)
   - User fills required fields
   - Students cannot select class/registration date
   - Submit updates profile
   - Redirects to dashboard

4. **Token Management**
   - Token expiry checked on app load
   - Expired tokens trigger logout
   - Token included in API requests

---

## 🎨 UI Components

### Animated Forest Background
**File:** `src/components/seasonal/AnimatedForestBackground.jsx`

**Configuration:**
```javascript
CONFIG = {
  LEAF_DENSITY: { LAYER_1: 8, LAYER_2: 10, LAYER_3: 12 },
  FALL_SPEED: { LAYER_1: 15, LAYER_2: 12, LAYER_3: 8 },
  ROTATION_SPEED: { MIN: 3, MAX: 6 },
  DRIFT_AMOUNT: { MIN: 20, MAX: 50 },
  OPACITY: { LAYER_1: 0.15, LAYER_2: 0.25, LAYER_3: 0.35 },
  LEAF_SIZE: { 
    LAYER_1: { MIN: 8, MAX: 12 },
    LAYER_2: { MIN: 12, MAX: 18 },
    LAYER_3: { MIN: 18, MAX: 28 }
  }
}
```

**Features:**
- 3 parallax layers
- Continuous falling animation
- Rotation and horizontal drift
- Autumn leaf colors
- Outlines and shading for visibility

---

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/student-register` - Student self-registration
- `GET /api/auth/profile-complete` - Check profile completion
- `POST /api/auth/complete-profile` - Complete user profile

### Students
- `GET /api/students` - Get all students
- `GET /api/students/:ic` - Get student by IC
- `POST /api/students` - Create student
- `PUT /api/students/:ic` - Update student
- `DELETE /api/students/:ic` - Delete student

### Teachers
- `GET /api/teachers` - Get all teachers
- `GET /api/teachers/:ic` - Get teacher by IC
- `POST /api/teachers` - Create teacher
- `PUT /api/teachers/:ic` - Update teacher
- `DELETE /api/teachers/:ic` - Delete teacher

### Classes
- `GET /api/classes` - Get all classes
- `GET /api/classes/:id` - Get class by ID
- `POST /api/classes` - Create class (status defaults to 'aktif')
- `PUT /api/classes/:id` - Update class (status not updated)
- `DELETE /api/classes/:id` - Delete class
- `GET /api/classes/stats` - Get class statistics

**Note:** Status field is NOT in request/response for create/update operations.

### Attendance
- `GET /api/attendance` - Get all attendance records
- `POST /api/attendance` - Create attendance
- `PUT /api/attendance/:id` - Update attendance
- `DELETE /api/attendance/:id` - Delete attendance

### Fees
- `GET /api/fees` - Get all fees
- `POST /api/fees` - Create fee
- `PUT /api/fees/:id` - Update fee
- `POST /api/fees/:id/mark-paid` - Mark fee as paid
- `DELETE /api/fees/:id` - Delete fee

### Results
- `GET /api/results` - Get all results
- `GET /api/results/:id` - Get result by ID
- `POST /api/results` - Create result
- `PUT /api/results/:id` - Update result
- `DELETE /api/results/:id` - Delete result

---

## 🛠️ Key Utilities

### Frontend Hooks
- `useCrud` - Generic CRUD operations hook
- `useMasjidLocation` - Location management hook

### Backend Utilities
- `jsonParser.js` - Safe JSON parsing
- `icNormalizer.js` - IC format normalization
- `emailService.js` - Email sending service

---

## 🐳 Docker Configuration

**Services:**
- `frontend` - Nginx serving React build
- `backend` - Node.js Express API
- `mysql` - MySQL database

**Ports:**
- Frontend: 80
- Backend: 3000
- MySQL: 3306

---

## 🔄 Data Flow

### Create Class Flow
1. User fills form (no status field)
2. Frontend validates required fields
3. POST to `/api/classes`
4. Backend validates and inserts (status = 'aktif')
5. Response returns new class
6. Frontend refreshes list

### Student Registration Flow
1. Student fills registration form
2. POST to `/api/auth/student-register`
3. Backend creates user with status='pending'
4. Admin sees in pending registrations
5. Admin approves/rejects
6. Approved students can login

### Profile Completion Flow
1. User logs in
2. App checks profile completion
3. If incomplete → redirect to `/complete-profile`
4. User fills required fields
5. Students cannot select class/registration date
6. Submit updates profile
7. Backend checks completion (ignores kelas_id/tarikh_daftar for students)
8. Redirects to dashboard

---

## ⚠️ Important Notes

1. **Status Field (Classes):**
   - Removed from UI completely
   - Still exists in database (defaults to 'aktif')
   - Not used in queries or filtering
   - Not required in create/update operations

2. **Student Registration:**
   - Creates user with 'pending' status
   - Requires admin approval
   - Cannot login until approved

3. **Profile Completion:**
   - Students don't need kelas_id or tarikh_daftar
   - These are admin-assigned fields
   - Backend ignores these for students in completion check

4. **Animated Background:**
   - Lightweight SVG animations
   - Doesn't affect performance
   - Responsive on all screen sizes
   - Configurable via CONFIG object

---

## 📝 Deployment Checklist

- [ ] Frontend build successful (`npm run build`)
- [ ] Backend dependencies installed
- [ ] Database migrations run
- [ ] Environment variables set
- [ ] Docker containers running
- [ ] All services healthy
- [ ] API endpoints accessible
- [ ] Frontend accessible

---

## 🔍 Testing Status

See `WEBSITE_TESTING_CHECKLIST.md` for comprehensive testing checklist.

**Current Status:**
- ✅ Status field removal - Tested
- ✅ Animated background - Tested
- ✅ Student registration - Tested
- ✅ Profile completion - Tested
- ⏳ Full system test - Pending

---

## 📞 Support Information

**Key Files to Review:**
- `WEBSITE_TESTING_CHECKLIST.md` - Complete testing guide
- `README.md` - Setup instructions
- `docker-compose.yml` - Docker configuration
- `backend/.env.example` - Environment variables template

**Common Issues:**
1. Token expiry - Check localStorage expiry
2. Profile completion loop - Check backend validation
3. Status field errors - Verify status not in requests
4. Data sync issues - Check API response handling

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-18  
**Maintained By:** Development Team


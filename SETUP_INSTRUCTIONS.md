# Masjid App - Setup Instructions

## Prerequisites

1. **XAMPP** - Download and install from https://www.apachefriends.org/
2. **Node.js** - Download and install from https://nodejs.org/ (version 16 or higher)
3. **Git** - For version control (optional)

## Database Setup (XAMPP)

### 1. Start XAMPP Services
- Open XAMPP Control Panel
- Start **Apache** and **MySQL** services
- Open phpMyAdmin by clicking "Admin" next to MySQL

### 2. Create Database
- In phpMyAdmin, click "New" to create a new database
- Name it: `masjid_app`
- Click "Create"

### 3. Import Database Schema
- Select the `masjid_app` database
- Click "Import" tab
- Choose the file: `database/masjid_app_schema.sql`
- Click "Go" to import

### 4. Verify Database
- Check that all tables are created:
  - users
  - teachers
  - classes
  - students
  - attendance
  - fees
  - exams
  - results

## Backend Setup

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
- Copy `env.example` to `.env`
- Update the following values in `.env`:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=          # Leave empty if no password set in XAMPP
DB_NAME=masjid_app

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_this
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

### 4. Start Backend Server
```bash
npm run dev
```

The backend will start on `http://localhost:5000`

## Frontend Setup

### 1. Navigate to Root Directory
```bash
cd ..  # (if you're in backend directory)
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Frontend Development Server
```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

## Default Login Credentials

- **Username:** admin
- **Password:** password

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/change-password` - Change password

### Students
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student by ID
- `POST /api/students` - Create new student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `GET /api/students/stats` - Get student statistics

### Teachers
- `GET /api/teachers` - Get all teachers
- `GET /api/teachers/:id` - Get teacher by ID
- `POST /api/teachers` - Create new teacher
- `PUT /api/teachers/:id` - Update teacher
- `DELETE /api/teachers/:id` - Delete teacher
- `GET /api/teachers/stats` - Get teacher statistics

### Classes
- `GET /api/classes` - Get all classes
- `GET /api/classes/:id` - Get class by ID
- `POST /api/classes` - Create new class
- `PUT /api/classes/:id` - Update class
- `DELETE /api/classes/:id` - Delete class
- `GET /api/classes/stats` - Get class statistics

### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance` - Mark attendance
- `POST /api/attendance/bulk` - Bulk mark attendance
- `GET /api/attendance/stats` - Get attendance statistics
- `GET /api/attendance/student/:id` - Get student attendance history

### Fees
- `GET /api/fees` - Get all fees
- `GET /api/fees/:id` - Get fee by ID
- `POST /api/fees` - Create new fee record
- `PUT /api/fees/:id` - Update fee record
- `PUT /api/fees/:id/mark-paid` - Mark fee as paid
- `DELETE /api/fees/:id` - Delete fee record
- `GET /api/fees/stats` - Get fee statistics

### Results
- `GET /api/results` - Get all results
- `GET /api/results/:id` - Get result by ID
- `POST /api/results` - Create new result
- `PUT /api/results/:id` - Update result
- `DELETE /api/results/:id` - Delete result
- `GET /api/results/stats` - Get result statistics
- `GET /api/results/top-performers` - Get top performers

## Features

### ✅ Completed Features
- **Authentication System** - Login/logout with JWT tokens
- **Student Management** - Full CRUD operations
- **Teacher Management** - Full CRUD operations with expertise tracking
- **Class Management** - Full CRUD operations with scheduling
- **Attendance Tracking** - Mark and track student attendance
- **Fee Management** - Track payments and outstanding fees
- **Results Management** - Record and manage exam results
- **Reports System** - Generate various reports and statistics
- **Responsive Design** - Works on desktop and mobile
- **Real-time Data** - All data is stored in MySQL database

### 🎨 Design Features
- **Islamic Theme** - Emerald/teal color scheme
- **Glass-morphism UI** - Modern backdrop-blur effects
- **Responsive Layout** - Collapsible sidebar
- **Professional Icons** - Lucide React icons throughout
- **Smooth Animations** - Hover effects and transitions

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure XAMPP MySQL is running
   - Check database credentials in `.env` file
   - Verify database `masjid_app` exists

2. **Port Already in Use**
   - Backend: Change PORT in `.env` file
   - Frontend: Vite will automatically find next available port

3. **CORS Errors**
   - Ensure FRONTEND_URL in `.env` matches your frontend URL
   - Check that both servers are running

4. **Authentication Issues**
   - Clear browser localStorage
   - Check JWT_SECRET in `.env` file
   - Verify user exists in database

### Support

For issues or questions:
1. Check the console for error messages
2. Verify all services are running (XAMPP, Backend, Frontend)
3. Check database connection and data integrity

## Production Deployment

For production deployment:
1. Set `NODE_ENV=production` in backend `.env`
2. Use a production database (not XAMPP)
3. Set strong JWT_SECRET
4. Configure proper CORS settings
5. Use a reverse proxy (nginx) for the frontend
6. Set up SSL certificates

---

**Masjid App v1.0.0** - Complete Mosque Class Management System

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

To set up the yearly database system:

1. Create the `masjid_master` database.
2. Create the `active_years` table with the following schema:

```sql
CREATE TABLE active_years (
  id INT PRIMARY KEY AUTO_INCREMENT,
  year INT NOT NULL,
  db_name VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE
);
```

3.  Update the backend `.env` file with the database connection details for `masjid_master`.
4.  Run the `backend/scripts/createNewYearDatabase.js` script to create a new year's database.
5.  Run the `backend/scripts/transferYearData.js` script to copy selected data from the previous year's database to the new year's database.
6.  Update the `active_years` table in `masjid_master` to mark the new year as active.

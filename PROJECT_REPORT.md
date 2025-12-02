# PROJECT REPORT
## Masjid Management System (MyMasjidApp)

**Project Period:** September 17, 2025 - December 1, 2025  
**Total Duration:** 11 weeks  
**Total Working Days:** 50 days

---

## 1. EXECUTIVE SUMMARY

The Masjid Management System is a comprehensive full-stack web application designed to streamline and digitize the management operations of masjid and madrasah institutions. The system provides a complete solution for managing students, teachers, classes, attendance, fees, exams, results, and administrative tasks.

### 1.1 Project Objectives
- Digitize masjid/madrasah management operations
- Provide efficient student and teacher management
- Automate attendance tracking and fee collection
- Enable online payment processing
- Generate comprehensive reports and analytics
- Support multiple user roles with appropriate access control

### 1.2 Key Achievements
- ✅ Complete full-stack application development
- ✅ 13 major modules implemented
- ✅ Multi-gateway payment system integration
- ✅ Role-based access control (Admin, Teacher, Student, IB)
- ✅ Comprehensive reporting system
- ✅ Docker-based deployment setup
- ✅ Production-ready documentation

---

## 2. PROJECT OVERVIEW

### 2.1 System Architecture

**Frontend:**
- React 19 with Vite
- TailwindCSS for styling
- React Router for navigation
- Axios for API communication
- Responsive design for mobile and desktop

**Backend:**
- Node.js with Express.js
- MySQL 8.0 database
- JWT authentication
- RESTful API architecture
- Middleware-based security

**DevOps:**
- Docker and Docker Compose
- Nginx reverse proxy
- SSL/TLS encryption
- Automated deployment scripts

### 2.2 Technology Stack

| Category | Technology |
|----------|-----------|
| Frontend Framework | React 19 |
| Build Tool | Vite |
| Styling | TailwindCSS |
| Backend Framework | Express.js |
| Database | MySQL 8.0 |
| Authentication | JWT, bcrypt |
| Payment Gateways | iPay88, eGHL, PayNet Direct |
| Deployment | Docker, Nginx |
| Version Control | Git |

---

## 3. MODULES IMPLEMENTED

### 3.1 Student Management Module
**Features:**
- Student registration and profile management
- Student search and filtering
- Batch import via CSV
- IC number validation (Malaysian format)
- Student-class assignment
- Student status tracking (active/inactive)

**Key Files:**
- `src/pages/Pelajar.jsx`
- `src/components/pelajar/PelajarForm.jsx`
- `src/components/pelajar/PelajarList.jsx`
- `backend/controllers/studentController.js`
- `backend/routes/students.js`

**Database Tables:**
- `pelajars` - Main student table
- `pelajar_kelas` - Student-class relationships

---

### 3.2 Teacher Management Module
**Features:**
- Teacher registration and profile management
- Teacher expertise tracking
- Teacher-class assignment
- Teacher search and filtering
- Teacher availability management

**Key Files:**
- `src/pages/Guru.jsx`
- `src/components/guru/GuruForm.jsx`
- `src/components/guru/GuruList.jsx`
- `backend/controllers/teacherController.js`
- `backend/routes/teachers.js`

**Database Tables:**
- `gurus` - Main teacher table
- `guru_kelas` - Teacher-class relationships

---

### 3.3 Class Management Module
**Features:**
- Class creation and management
- Class level categorization (ASAS, PERTENGAHAN, LANJUTAN, TALAQQI)
- Schedule management (ISNIN & RABU, SELASA & KHAMIS)
- Class capacity management
- Class fee configuration
- Student enrollment tracking

**Key Files:**
- `src/pages/Kelas.jsx`
- `src/components/kelas/KelasForm.jsx`
- `src/components/kelas/KelasList.jsx`
- `backend/controllers/classController.js`
- `backend/routes/classes.js`

**Database Tables:**
- `kelas` - Main class table
- `kelas_pengajian` - Class categorization

---

### 3.4 Attendance Management Module
**Features:**
- Daily attendance tracking per class
- Attendance status (hadir, lewat, tidak hadir)
- Google Forms integration for attendance input
- Attendance history and statistics
- Attendance reporting and analytics

**Key Files:**
- `src/pages/Kehadiran.jsx`
- `backend/controllers/attendanceController.js`
- `backend/controllers/googleFormController.js`
- `backend/routes/attendance.js`

**Database Tables:**
- `kehadiran` - Attendance records
- `attendance_logs` - Attendance history

---

### 3.5 Fee Management Module
**Features:**
- Fee collection and tracking
- Payment status management (terbayar, tunggak)
- Outstanding balance calculation
- Fee reporting and analytics
- Payment history tracking

**Key Files:**
- `src/pages/Yuran.jsx`
- `src/pages/PayYuran.jsx`
- `backend/controllers/feeController.js`
- `backend/routes/fees.js`

**Database Tables:**
- `yuran` - Fee records
- `fee_payments` - Payment history

---

### 3.6 Payment System Module
**Features:**
- Multi-gateway payment integration (iPay88, eGHL, PayNet Direct)
- Multiple payment methods (FPX, DuitNow QR, DuitNow Request, E-Wallets)
- Payment reconciliation system
- Webhook handling with signature verification
- Payment proof upload
- Payment status tracking and requery

**Key Files:**
- `src/pages/PaymentCheckout.jsx`
- `src/pages/PaymentReturn.jsx`
- `backend/controllers/paymentController.js`
- `backend/controllers/webhookController.js`
- `backend/services/paymentService.js`
- `backend/services/paymentGatewayService.js`

**Database Tables:**
- `payments` - Payment records
- `payment_logs` - Payment audit trail
- `payment_reconciliation` - Reconciliation records
- `idempotency_keys` - Idempotency management

---

### 3.7 Exam Management Module
**Features:**
- Exam creation and scheduling
- Exam assignment to classes
- Exam date management
- Exam validation and error handling

**Key Files:**
- `backend/controllers/examController.js`
- `backend/routes/exams.js`

**Database Tables:**
- `exams` - Exam records
- `exam_classes` - Exam-class relationships

---

### 3.8 Results Management Module
**Features:**
- Results entry interface for teachers
- Grade calculation functionality
- Results viewing interface for students
- Results validation and error handling
- Results reporting and analytics

**Key Files:**
- `src/pages/Keputusan.jsx`
- `src/components/keputusan/ResultFormModal.jsx`
- `backend/controllers/resultController.js`
- `backend/routes/results.js`

**Database Tables:**
- `results` - Result records
- `result_details` - Detailed result data

---

### 3.9 IB (Imam Bilal) Role Module
**Features:**
- IB role authentication and authorization
- IB-specific dashboard
- IB user management
- Role-based permissions

**Key Files:**
- `src/pages/IbDashboard.jsx`
- `backend/controllers/ibController.js`
- `backend/routes/ib.js`

---

### 3.10 Staff Check-in Module
**Features:**
- Staff check-in interface
- Quick check-in functionality
- Staff attendance tracking
- Check-in reports

**Key Files:**
- `src/pages/StaffCheckIn.jsx`
- `src/pages/QuickStaffCheckIn.jsx`
- `backend/controllers/staffCheckInController.js`
- `backend/routes/staffCheckIn.js`

**Database Tables:**
- `staff_checkins` - Staff check-in records

---

### 3.11 Announcement Module
**Features:**
- Announcement creation and management
- Role-based announcement targeting
- Announcement display on dashboard
- Announcement priority and expiration

**Key Files:**
- `src/pages/Announcements.jsx`
- `backend/controllers/announcementController.js`
- `backend/routes/announcements.js`

**Database Tables:**
- `announcements` - Announcement records

---

### 3.12 Reporting Module
**Features:**
- Overview statistics dashboard
- Student reports
- Fee reports
- Attendance reports
- Results reports
- Export functionality (Excel, Word, CSV, JSON)

**Key Files:**
- `src/pages/Laporan.jsx`
- `backend/controllers/exportController.js`
- `backend/routes/export.js`

---

### 3.13 Authentication & Authorization Module
**Features:**
- JWT-based authentication
- Role-based access control (Admin, Teacher, Student, IB)
- Password reset functionality
- Session management
- Protected routes

**Key Files:**
- `src/components/auth/Login.jsx`
- `src/components/auth/Register.jsx`
- `src/components/auth/ProtectedRoute.jsx`
- `backend/controllers/authController.js`
- `backend/middleware/auth.js`
- `backend/routes/auth.js`

---

## 4. DATABASE DESIGN

### 4.1 Database Architecture
- **Yearly Database System:** Each year uses its own database
  - `masjid_app_2024` - 2024 data
  - `masjid_app_2025` - 2025 data (active)
- **Master Database:** `masjid_master` - Tracks active years

### 4.2 Key Database Tables

| Table Name | Purpose |
|-----------|---------|
| `pelajars` | Student information |
| `gurus` | Teacher information |
| `kelas` | Class information |
| `kehadiran` | Attendance records |
| `yuran` | Fee records |
| `payments` | Payment transactions |
| `exams` | Exam information |
| `results` | Exam results |
| `announcements` | System announcements |
| `staff_checkins` | Staff attendance |
| `users` | User accounts |

### 4.3 Database Features
- Foreign key constraints for data integrity
- Indexes on frequently queried fields
- Transaction support for complex operations
- Yearly data separation for performance

---

## 5. API DOCUMENTATION

### 5.1 Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user

### 5.2 Student Endpoints
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student by ID
- `POST /api/students` - Create student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `POST /api/students/import` - Import students from CSV

### 5.3 Teacher Endpoints
- `GET /api/teachers` - Get all teachers
- `GET /api/teachers/:id` - Get teacher by ID
- `POST /api/teachers` - Create teacher
- `PUT /api/teachers/:id` - Update teacher
- `DELETE /api/teachers/:id` - Delete teacher

### 5.4 Class Endpoints
- `GET /api/classes` - Get all classes
- `GET /api/classes/:id` - Get class by ID
- `POST /api/classes` - Create class
- `PUT /api/classes/:id` - Update class
- `DELETE /api/classes/:id` - Delete class

### 5.5 Attendance Endpoints
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance` - Mark attendance
- `PUT /api/attendance/:id` - Update attendance
- `GET /api/attendance/stats` - Get attendance statistics

### 5.6 Fee Endpoints
- `GET /api/fees` - Get all fees
- `POST /api/fees` - Create fee record
- `PUT /api/fees/:id` - Update fee record
- `PATCH /api/fees/:id/mark-paid` - Mark fee as paid

### 5.7 Payment Endpoints
- `POST /api/payments/create` - Create payment intent
- `GET /api/payments/:id` - Get payment details
- `POST /api/payments/:id/initialize` - Initialize payment
- `POST /api/webhook/payment` - Payment webhook

### 5.8 Report Endpoints
- `GET /api/reports/overview` - Get overview statistics
- `GET /api/reports/students` - Get student report
- `GET /api/reports/fees` - Get fee report
- `GET /api/reports/attendance` - Get attendance report

---

## 6. SECURITY IMPLEMENTATION

### 6.1 Authentication Security
- JWT tokens with expiration
- Password hashing using bcrypt
- Secure token storage
- Session management

### 6.2 Authorization Security
- Role-based access control (RBAC)
- Route protection middleware
- Permission-based feature access
- API endpoint protection

### 6.3 Data Security
- SQL injection prevention (parameterized queries)
- XSS protection
- CSRF protection
- Input validation and sanitization
- Secure payment processing

### 6.4 Infrastructure Security
- SSL/TLS encryption
- Environment variable protection
- Secure API keys management
- Docker container security

---

## 7. DEPLOYMENT

### 7.1 Deployment Architecture
- **Frontend:** Docker container with Nginx
- **Backend:** Docker container with Node.js
- **Database:** MySQL Docker container
- **Reverse Proxy:** Nginx with SSL

### 7.2 Deployment Process
1. Build frontend for production
2. Create Docker images
3. Configure environment variables
4. Set up SSL certificates
5. Deploy using Docker Compose
6. Verify deployment

### 7.3 Deployment Files
- `docker-compose.yml` - Docker orchestration
- `Dockerfile` - Frontend container
- `nginx/nginx.conf` - Nginx configuration
- `deploy.sh` / `deploy.bat` - Deployment scripts

---

## 8. TESTING

### 8.1 Testing Approach
- Manual testing of all modules
- API endpoint testing
- Integration testing
- User acceptance testing

### 8.2 Test Coverage
- ✅ Authentication flow
- ✅ CRUD operations for all modules
- ✅ Payment gateway integration
- ✅ Report generation
- ✅ Role-based access control
- ✅ Error handling

---

## 9. CHALLENGES AND SOLUTIONS

### 9.1 Technical Challenges

**Challenge 1: Payment Gateway Integration**
- **Problem:** Integrating multiple payment gateways with different APIs
- **Solution:** Created abstraction layer for payment gateways, implemented unified interface

**Challenge 2: Yearly Database System**
- **Problem:** Managing data separation across years
- **Solution:** Implemented yearly database system with master database for year management

**Challenge 3: Real-time Payment Status**
- **Problem:** Handling asynchronous payment notifications
- **Solution:** Implemented webhook system with polling fallback

**Challenge 4: Role-based Access Control**
- **Problem:** Managing complex permission system
- **Solution:** Created middleware-based RBAC with role-specific routes

### 9.2 Business Challenges

**Challenge 1: User Requirements**
- **Problem:** Understanding masjid/madrasah operations
- **Solution:** Regular consultation with supervisor, iterative requirement gathering

**Challenge 2: Data Migration**
- **Problem:** Migrating existing data to new system
- **Solution:** Created migration scripts and data import tools

---

## 10. FUTURE ENHANCEMENTS

### 10.1 Planned Features
- [ ] Mobile application (iOS/Android)
- [ ] Real-time notifications
- [ ] Advanced analytics dashboard
- [ ] Multi-language support (Malay/English/Arabic)
- [ ] SMS integration for notifications
- [ ] Email automation
- [ ] Backup and recovery system
- [ ] Audit logging system
- [ ] Advanced reporting features
- [ ] Parent portal

### 10.2 Technical Improvements
- [ ] Unit test coverage
- [ ] Integration test suite
- [ ] Performance optimization
- [ ] Caching implementation
- [ ] API rate limiting
- [ ] Advanced security features

---

## 11. LESSONS LEARNED

### 11.1 Technical Skills
- Full-stack web development
- Payment gateway integration
- Docker containerization
- Database design and optimization
- API development and documentation
- Security best practices

### 11.2 Soft Skills
- Project management
- Requirement gathering
- Problem-solving
- Documentation writing
- Code organization
- Testing methodologies

---

## 12. CONCLUSION

The Masjid Management System project has been successfully completed, delivering a comprehensive solution for masjid and madrasah management. The system includes 13 major modules covering all aspects of institutional management, from student registration to payment processing.

The project demonstrates proficiency in full-stack development, payment integration, database design, and deployment. The system is production-ready and can be deployed to serve masjid and madrasah institutions.

---

## APPENDICES

### Appendix A: Project Structure
```
MyMasjidApp/
├── backend/              # Express.js API
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Auth middleware
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── scripts/         # Database scripts
│   └── server.js        # Entry point
├── src/                 # React frontend
│   ├── components/      # React components
│   ├── pages/           # Page components
│   ├── services/        # API services
│   ├── hooks/           # Custom hooks
│   └── utils/           # Utility functions
├── database/            # SQL schema files
├── nginx/               # Nginx configuration
├── scripts/             # Deployment scripts
└── docker-compose.yml   # Docker orchestration
```

### Appendix B: Key Dependencies

**Frontend:**
- react: ^19.0.0
- react-router-dom: ^6.x
- axios: ^1.x
- tailwindcss: ^3.x
- react-toastify: ^9.x

**Backend:**
- express: ^4.x
- mysql2: ^3.x
- jsonwebtoken: ^9.x
- bcrypt: ^5.x
- dotenv: ^16.x

---

**Report Prepared By:** [Your Name]  
**Date:** December 1, 2025  
**Supervisor:** [Supervisor Name]

---

## IMAGE SUGGESTIONS FOR CODE SECTIONS

### Code Architecture Images
1. **System Architecture Diagram** - Show frontend, backend, database layers
2. **Database ER Diagram** - Entity relationship diagram of all tables
3. **API Flow Diagram** - Request/response flow through the system
4. **Payment Gateway Flow** - Payment processing workflow
5. **Authentication Flow** - JWT authentication process

### Code Screenshots
1. **Frontend Component Structure** - React component hierarchy
2. **Backend Controller Example** - Sample controller code
3. **Database Schema** - Key database tables structure
4. **API Endpoint Example** - Sample API route implementation
5. **Payment Service Code** - Payment gateway integration code

---

## IMAGE SUGGESTIONS FOR DOCUMENTATION PAGES

### Overview Page
- System architecture diagram
- Technology stack visualization
- Module relationship diagram

### Module Documentation Pages
- Module workflow diagrams
- Database schema for each module
- API endpoint documentation screenshots
- UI screenshots of each module

### Setup/Installation Pages
- Docker container diagram
- Deployment architecture
- Environment setup screenshots

### User Guide Pages
- Step-by-step screenshots for each feature
- Dashboard screenshots
- Form submission examples
- Report generation examples


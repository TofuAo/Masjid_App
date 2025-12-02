# PROJECT OVERVIEW
## Masjid Management System (MyMasjidApp)

**Version:** 1.0.0  
**Last Updated:** December 1, 2025  
**Status:** Production Ready

---

## 1. INTRODUCTION

The Masjid Management System is a comprehensive web-based application designed to digitize and streamline the management operations of masjid and madrasah institutions in Malaysia. The system provides a complete solution for managing students, teachers, classes, attendance, fees, payments, exams, and administrative tasks.

---

## 2. SYSTEM PURPOSE

### 2.1 Primary Objectives
- **Digitize Operations:** Replace manual record-keeping with digital system
- **Improve Efficiency:** Automate repetitive tasks and reduce administrative workload
- **Enhance Communication:** Facilitate communication between administrators, teachers, students, and parents
- **Financial Management:** Streamline fee collection and payment processing
- **Data Analytics:** Provide insights through comprehensive reporting

### 2.2 Target Users
- **Administrators:** Full system access for management
- **Teachers:** Class and student management, attendance, results entry
- **Students:** View attendance, results, and fee status
- **Imam Bilal (IB):** Specialized role with specific permissions
- **Staff:** Check-in and attendance tracking

---

## 3. SYSTEM ARCHITECTURE

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT BROWSER                        │
│              (React 19 + TailwindCSS)                    │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  NGINX REVERSE PROXY                     │
│              (SSL/TLS + Load Balancing)                  │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   FRONTEND      │    │    BACKEND      │
│   (Docker)      │    │   (Docker)      │
│   React + Vite  │    │  Node.js +      │
│                 │    │  Express.js     │
└─────────────────┘    └────────┬────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │    DATABASE    │
                        │  MySQL 8.0     │
                        │   (Docker)     │
                        └─────────────────┘
```

### 3.2 Technology Stack

#### Frontend Technologies
- **React 19:** Modern UI library
- **Vite:** Fast build tool and dev server
- **TailwindCSS:** Utility-first CSS framework
- **React Router:** Client-side routing
- **Axios:** HTTP client for API calls
- **React Toastify:** Notification system

#### Backend Technologies
- **Node.js:** JavaScript runtime
- **Express.js:** Web application framework
- **MySQL 8.0:** Relational database
- **JWT:** Authentication tokens
- **Bcrypt:** Password hashing
- **Docker:** Containerization

#### DevOps & Infrastructure
- **Docker & Docker Compose:** Container orchestration
- **Nginx:** Reverse proxy and web server
- **SSL/TLS:** Secure connections
- **Git:** Version control

---

## 4. CORE MODULES

### 4.1 Student Management
**Purpose:** Manage student information and enrollment

**Key Features:**
- Student registration with Malaysian IC validation
- Student profile management
- Batch import via CSV
- Student-class assignment
- Student search and filtering
- Status tracking (active/inactive)

**User Roles:**
- Admin: Full access
- Teacher: View assigned students
- Student: View own profile

---

### 4.2 Teacher Management
**Purpose:** Manage teacher information and assignments

**Key Features:**
- Teacher registration
- Profile management
- Expertise tracking
- Teacher-class assignment
- Availability management

**User Roles:**
- Admin: Full access
- Teacher: View own profile

---

### 4.3 Class Management
**Purpose:** Organize classes and schedules

**Key Features:**
- Class creation and management
- Level categorization (ASAS, PERTENGAHAN, LANJUTAN, TALAQQI)
- Schedule management (ISNIN & RABU, SELASA & KHAMIS)
- Capacity management
- Fee configuration
- Enrollment tracking

**User Roles:**
- Admin: Full access
- Teacher: View assigned classes
- Student: View enrolled classes

---

### 4.4 Attendance Management
**Purpose:** Track student attendance

**Key Features:**
- Daily attendance marking
- Status tracking (hadir, lewat, tidak hadir)
- Google Forms integration
- Attendance history
- Statistics and analytics
- Export functionality

**User Roles:**
- Admin: Full access
- Teacher: Mark attendance for assigned classes
- Student: View own attendance

---

### 4.5 Fee Management
**Purpose:** Manage fee collection and tracking

**Key Features:**
- Fee record creation
- Payment status tracking (terbayar, tunggak)
- Outstanding balance calculation
- Payment history
- Fee reporting

**User Roles:**
- Admin: Full access
- Teacher: View class fees
- Student: View own fees

---

### 4.6 Payment System
**Purpose:** Process online payments

**Key Features:**
- Multi-gateway integration (iPay88, eGHL, PayNet Direct)
- Multiple payment methods (FPX, DuitNow QR, DuitNow Request, E-Wallets)
- Payment reconciliation
- Webhook handling
- Payment proof upload
- Status tracking

**User Roles:**
- Admin: Full access, reconciliation
- Student: Make payments

---

### 4.7 Exam Management
**Purpose:** Manage exams and schedules

**Key Features:**
- Exam creation
- Scheduling
- Class assignment
- Date management

**User Roles:**
- Admin: Full access
- Teacher: View assigned exams

---

### 4.8 Results Management
**Purpose:** Record and manage exam results

**Key Features:**
- Results entry
- Grade calculation
- Results viewing
- Statistics and analytics

**User Roles:**
- Admin: Full access
- Teacher: Enter results for assigned classes
- Student: View own results

---

### 4.9 IB (Imam Bilal) Role
**Purpose:** Specialized role for masjid leadership

**Key Features:**
- IB-specific dashboard
- Specialized permissions
- IB user management

**User Roles:**
- IB: Access to IB-specific features

---

### 4.10 Staff Check-in
**Purpose:** Track staff attendance

**Key Features:**
- Quick check-in
- Attendance tracking
- Check-in reports

**User Roles:**
- Admin: Full access
- Staff: Check in/out

---

### 4.11 Announcements
**Purpose:** System-wide communication

**Key Features:**
- Announcement creation
- Role-based targeting
- Priority management
- Expiration dates

**User Roles:**
- Admin: Full access
- All users: View announcements

---

### 4.12 Reporting System
**Purpose:** Generate comprehensive reports

**Key Features:**
- Overview statistics
- Student reports
- Fee reports
- Attendance reports
- Results reports
- Export (Excel, Word, CSV, JSON)

**User Roles:**
- Admin: Full access
- Teacher: View class reports
- Student: View own reports

---

### 4.13 Authentication & Authorization
**Purpose:** Secure access control

**Key Features:**
- JWT-based authentication
- Role-based access control
- Password reset
- Session management
- Protected routes

**User Roles:**
- All users: Login/logout
- Admin: User management

---

## 5. DATABASE STRUCTURE

### 5.1 Yearly Database System
The system uses a yearly database architecture:
- Each year has its own database (e.g., `masjid_app_2025`)
- Master database (`masjid_master`) tracks active years
- Historical data is preserved in archived databases
- New year setup copies relevant data to new database

### 5.2 Key Database Tables

| Table | Purpose |
|-------|---------|
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

### 5.3 Database Features
- Foreign key constraints for data integrity
- Indexes for performance optimization
- Transaction support for complex operations
- Yearly data separation

---

## 6. SECURITY FEATURES

### 6.1 Authentication Security
- JWT tokens with expiration
- Password hashing (bcrypt)
- Secure token storage
- Session management

### 6.2 Authorization Security
- Role-based access control (RBAC)
- Route protection middleware
- Permission-based feature access
- API endpoint protection

### 6.3 Data Security
- SQL injection prevention
- XSS protection
- CSRF protection
- Input validation
- Secure payment processing

### 6.4 Infrastructure Security
- SSL/TLS encryption
- Environment variable protection
- Secure API key management
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

### 7.3 Environment Configuration
- Development: Local Docker setup
- Production: VPS/Cloud deployment
- Staging: Test environment

---

## 8. USER INTERFACE

### 8.1 Design Principles
- **Islamic Theme:** Emerald/teal color scheme
- **Modern UI:** Glass-morphism effects
- **Responsive Design:** Mobile and desktop support
- **Accessibility:** User-friendly interface
- **Professional:** Clean and organized layout

### 8.2 Key UI Components
- Dashboard with statistics
- Data tables with search/filter
- Forms with validation
- Modals for actions
- Toast notifications
- Loading states

---

## 9. API ARCHITECTURE

### 9.1 RESTful API Design
- Standard HTTP methods (GET, POST, PUT, DELETE, PATCH)
- Resource-based URLs
- JSON request/response format
- Consistent error handling
- Status code standards

### 9.2 API Endpoints Structure
```
/api/auth/*          - Authentication
/api/students/*      - Student management
/api/teachers/*      - Teacher management
/api/classes/*       - Class management
/api/attendance/*     - Attendance tracking
/api/fees/*          - Fee management
/api/payments/*      - Payment processing
/api/exams/*         - Exam management
/api/results/*       - Results management
/api/reports/*       - Reporting
/api/announcements/* - Announcements
```

---

## 10. INTEGRATION FEATURES

### 10.1 Payment Gateway Integration
- **iPay88:** Payment processing
- **eGHL:** Payment gateway
- **PayNet Direct:** Direct payment integration
- **Webhook Support:** Payment status updates

### 10.2 Google Forms Integration
- Attendance input via Google Forms
- Automatic data synchronization
- Webhook handling

---

## 11. REPORTING AND ANALYTICS

### 11.1 Available Reports
- **Overview Report:** System-wide statistics
- **Student Report:** Student information and statistics
- **Fee Report:** Fee collection and outstanding
- **Attendance Report:** Attendance statistics
- **Results Report:** Exam results and performance

### 11.2 Export Formats
- Excel (XLSX)
- Word (DOCX)
- CSV
- JSON

---

## 12. SYSTEM REQUIREMENTS

### 12.1 Server Requirements
- **CPU:** 2+ cores
- **RAM:** 4GB+ recommended
- **Storage:** 20GB+ available
- **OS:** Linux (Ubuntu 20.04+ recommended)
- **Docker:** Version 20.10+

### 12.2 Client Requirements
- **Browser:** Chrome, Firefox, Safari, Edge (latest versions)
- **JavaScript:** Enabled
- **Internet:** Required for online features

---

## 13. MAINTENANCE AND SUPPORT

### 13.1 Regular Maintenance
- Database backups
- Security updates
- Performance monitoring
- Bug fixes
- Feature updates

### 13.2 Support Channels
- Documentation
- User guides
- Technical support
- Issue tracking

---

## 14. FUTURE ROADMAP

### 14.1 Planned Features
- Mobile application (iOS/Android)
- Real-time notifications
- Advanced analytics
- Multi-language support
- SMS integration
- Email automation
- Parent portal

### 14.2 Technical Improvements
- Unit test coverage
- Integration tests
- Performance optimization
- Caching implementation
- API rate limiting

---

## 15. CONCLUSION

The Masjid Management System provides a comprehensive solution for digitizing masjid and madrasah operations. With 13 major modules covering all aspects of institutional management, the system is production-ready and can significantly improve operational efficiency.

The system's modern architecture, secure design, and user-friendly interface make it an ideal solution for masjid and madrasah institutions looking to modernize their management processes.

---

## IMAGE SUGGESTIONS FOR OVERVIEW DOCUMENTATION

### System Architecture Images
1. **High-Level Architecture Diagram** - Overall system structure
2. **Technology Stack Visualization** - Tech stack breakdown
3. **Database Architecture Diagram** - Database structure and relationships
4. **Deployment Architecture** - Docker and infrastructure setup
5. **User Role Hierarchy** - Role-based access structure

### Module Overview Images
1. **Module Relationship Diagram** - How modules interact
2. **Data Flow Diagram** - Data flow through the system
3. **API Architecture Diagram** - API endpoint structure
4. **Payment Flow Diagram** - Payment processing workflow
5. **Authentication Flow** - Login and authorization process

### UI/UX Images
1. **Dashboard Screenshot** - Main dashboard view
2. **Module Navigation** - Sidebar and navigation structure
3. **Form Examples** - Student/Teacher registration forms
4. **Report Examples** - Sample generated reports
5. **Mobile Responsive Views** - Mobile interface examples

### Technical Documentation Images
1. **Database ER Diagram** - Complete entity relationship diagram
2. **Component Structure** - React component hierarchy
3. **API Endpoint Map** - All API endpoints visualization
4. **Security Architecture** - Security layers and measures
5. **Deployment Flow** - Step-by-step deployment process

---

**Document Version:** 1.0  
**Last Updated:** December 1, 2025  
**Maintained By:** Development Team


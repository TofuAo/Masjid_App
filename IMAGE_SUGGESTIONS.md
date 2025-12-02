# IMAGE SUGGESTIONS FOR DOCUMENTATION
## Masjid Management System

This document provides comprehensive image suggestions for code sections and documentation pages.

---

## 1. CODE SECTION IMAGES

### 1.1 System Architecture Code

**Suggested Image:** System Architecture Diagram
- **Location:** PROJECT_REPORT.md - Section 2.1
- **Content:** 
  - Frontend (React) layer
  - Backend (Node.js/Express) layer
  - Database (MySQL) layer
  - Docker containers
  - Nginx reverse proxy
- **Format:** Flowchart or block diagram
- **Tools:** Draw.io, Lucidchart, or similar

**Code Example to Show:**
```javascript
// System Architecture
Frontend (React) → Nginx → Backend (Express) → MySQL
```

---

### 1.2 Database Schema Code

**Suggested Image:** Database ER Diagram
- **Location:** PROJECT_REPORT.md - Section 4, PROJECT_OVERVIEW.md - Section 5
- **Content:**
  - All database tables
  - Relationships between tables
  - Primary keys and foreign keys
  - Key fields highlighted
- **Format:** Entity Relationship Diagram
- **Tools:** MySQL Workbench, dbdiagram.io, or similar

**Key Tables to Include:**
- pelajars, gurus, kelas, kehadiran, yuran, payments, exams, results, announcements, users

---

### 1.3 API Architecture Code

**Suggested Image:** API Endpoint Structure Diagram
- **Location:** PROJECT_REPORT.md - Section 5
- **Content:**
  - API endpoint categories
  - Request/response flow
  - Authentication flow
  - Error handling flow
- **Format:** Flowchart or sequence diagram
- **Tools:** Draw.io, Mermaid, or similar

**Code Structure to Show:**
```
/api/auth/*          - Authentication endpoints
/api/students/*      - Student management
/api/teachers/*      - Teacher management
/api/classes/*       - Class management
/api/attendance/*    - Attendance tracking
/api/fees/*          - Fee management
/api/payments/*      - Payment processing
```

---

### 1.4 Payment Gateway Integration Code

**Suggested Image:** Payment Flow Diagram
- **Location:** PROJECT_REPORT.md - Section 3.6
- **Content:**
  - Payment initiation
  - Gateway selection
  - Payment processing
  - Webhook handling
  - Reconciliation
- **Format:** Sequence diagram or flowchart
- **Tools:** Draw.io, PlantUML, or similar

**Flow to Show:**
```
User → Create Payment → Select Gateway → Initialize Payment
→ Process Payment → Webhook Notification → Update Status → Reconciliation
```

---

### 1.5 Authentication Flow Code

**Suggested Image:** JWT Authentication Flow
- **Location:** PROJECT_REPORT.md - Section 3.13
- **Content:**
  - Login process
  - Token generation
  - Token validation
  - Protected route access
- **Format:** Sequence diagram
- **Tools:** Draw.io, Mermaid, or similar

---

### 1.6 Component Structure Code

**Suggested Image:** React Component Hierarchy
- **Location:** PROJECT_REPORT.md - Appendix A
- **Content:**
  - Main App component
  - Page components
  - Reusable UI components
  - Component relationships
- **Format:** Tree diagram
- **Tools:** React DevTools screenshot or diagram

---

## 2. DOCUMENTATION PAGE IMAGES

### 2.1 Project Overview Page

**Suggested Images:**

1. **System Architecture Overview**
   - High-level system diagram
   - Technology stack visualization
   - Deployment architecture

2. **Module Relationship Diagram**
   - How modules interact
   - Data flow between modules
   - User role access to modules

3. **Technology Stack Visualization**
   - Frontend technologies
   - Backend technologies
   - Database and infrastructure
   - Visual representation with logos

---

### 2.2 Module Documentation Pages

#### Student Management Module
**Suggested Images:**
1. **Student Registration Form Screenshot**
   - Form fields
   - Validation messages
   - Submit button

2. **Student List View Screenshot**
   - Table with student data
   - Search and filter options
   - Action buttons

3. **Student Detail View Screenshot**
   - Student profile information
   - Class assignments
   - Attendance history
   - Fee status

4. **Database Schema for Students**
   - pelajars table structure
   - Relationships with other tables

---

#### Teacher Management Module
**Suggested Images:**
1. **Teacher Registration Form**
   - Form with teacher details
   - Expertise selection
   - Class assignment

2. **Teacher List View**
   - Teacher table
   - Search functionality
   - Filter options

3. **Teacher-Class Assignment Diagram**
   - Teacher to class relationships
   - Assignment workflow

---

#### Class Management Module
**Suggested Images:**
1. **Class Creation Form**
   - Class details form
   - Level selection
   - Schedule configuration
   - Capacity settings

2. **Class List View**
   - Classes table
   - Status indicators
   - Enrollment numbers

3. **Class Schedule Visualization**
   - Weekly schedule view
   - Class timing
   - Day assignments (ISNIN & RABU, SELASA & KHAMIS)

4. **Class Level Hierarchy**
   - ASAS → PERTENGAHAN → LANJUTAN → TALAQQI
   - Visual progression

---

#### Attendance Management Module
**Suggested Images:**
1. **Attendance Marking Interface**
   - Class selection
   - Student list with checkboxes
   - Status selection (hadir, lewat, tidak hadir)
   - Date picker

2. **Attendance Statistics Dashboard**
   - Charts and graphs
   - Attendance rates
   - Trends over time

3. **Google Forms Integration Flow**
   - Google Form → Webhook → Database
   - Integration diagram

4. **Attendance History View**
   - Historical attendance records
   - Filter by date/class

---

#### Fee Management Module
**Suggested Images:**
1. **Fee Record Form**
   - Fee creation form
   - Amount input
   - Payment status
   - Date selection

2. **Fee List View**
   - Fees table
   - Status indicators (terbayar, tunggak)
   - Outstanding amounts

3. **Fee Payment Interface**
   - Payment form
   - Payment method selection
   - Amount display

4. **Fee Statistics Dashboard**
   - Total collected
   - Outstanding amounts
   - Payment trends

---

#### Payment System Module
**Suggested Images:**
1. **Payment Checkout Page**
   - Payment method selection
   - Gateway selection
   - Amount display
   - Payment initialization

2. **QR Code Display**
   - DuitNow QR code
   - Payment instructions
   - Status polling

3. **Payment Flow Diagram**
   - Complete payment process
   - Gateway integration
   - Webhook handling

4. **Payment Reconciliation Dashboard**
   - Reconciliation status
   - Payment logs
   - Reconciliation reports

5. **Admin Payment Management**
   - Payment list
   - Filters and search
   - Status updates
   - Payment details modal

---

#### Exam Management Module
**Suggested Images:**
1. **Exam Creation Form**
   - Exam details
   - Date and time
   - Class assignment

2. **Exam List View**
   - Exams table
   - Schedule display
   - Status indicators

3. **Exam Schedule Calendar**
   - Calendar view
   - Exam dates highlighted

---

#### Results Management Module
**Suggested Images:**
1. **Results Entry Form**
   - Student selection
   - Marks input
   - Grade calculation
   - Notes field

2. **Results View**
   - Student results table
   - Grade display
   - Statistics

3. **Results Statistics**
   - Pass/fail rates
   - Average marks
   - Top performers

---

#### IB Role Module
**Suggested Images:**
1. **IB Dashboard**
   - IB-specific statistics
   - Quick actions
   - Relevant information

2. **IB Role Permissions Diagram**
   - IB access levels
   - Feature access

---

#### Staff Check-in Module
**Suggested Images:**
1. **Staff Check-in Interface**
   - Quick check-in button
   - Check-in form
   - Time display

2. **Staff Attendance Report**
   - Attendance records
   - Statistics
   - Trends

---

#### Announcement Module
**Suggested Images:**
1. **Announcement Creation Form**
   - Title and content
   - Target audience selection
   - Priority and expiration

2. **Announcement Display**
   - Dashboard announcements
   - Announcement list
   - Priority indicators

---

#### Reporting Module
**Suggested Images:**
1. **Overview Dashboard**
   - Key statistics
   - Charts and graphs
   - Quick metrics

2. **Report Generation Interface**
   - Report type selection
   - Date range picker
   - Export options

3. **Sample Generated Reports**
   - Excel report
   - Word report
   - PDF report

4. **Report Statistics Charts**
   - Bar charts
   - Pie charts
   - Line graphs

---

### 2.3 Setup and Installation Pages

**Suggested Images:**

1. **Docker Architecture Diagram**
   - Container structure
   - Network connections
   - Volume mounts

2. **Installation Flow Diagram**
   - Step-by-step installation
   - Prerequisites
   - Configuration steps

3. **Environment Setup Screenshot**
   - .env file example
   - Configuration values
   - Required variables

4. **Deployment Architecture**
   - Production setup
   - Server configuration
   - SSL setup

---

### 2.4 User Guide Pages

**Suggested Images:**

1. **Login Page Screenshot**
   - Login form
   - Forgot password link
   - Registration link

2. **Dashboard Screenshot**
   - Main dashboard view
   - Statistics cards
   - Quick actions
   - Navigation sidebar

3. **Navigation Structure**
   - Sidebar menu
   - Menu items
   - Role-based menu

4. **Form Submission Examples**
   - Before submission
   - Validation errors
   - Success message

5. **Search and Filter Examples**
   - Search interface
   - Filter options
   - Results display

---

### 2.5 API Documentation Pages

**Suggested Images:**

1. **API Endpoint Map**
   - All endpoints visualized
   - Endpoint categories
   - HTTP methods

2. **Request/Response Examples**
   - Sample API requests
   - Sample responses
   - Error responses

3. **Authentication Flow Diagram**
   - Login flow
   - Token usage
   - Protected endpoints

4. **API Testing Screenshot**
   - Postman collection
   - API testing interface
   - Response examples

---

### 2.6 Security Documentation Pages

**Suggested Images:**

1. **Security Architecture Diagram**
   - Security layers
   - Authentication flow
   - Authorization levels

2. **JWT Token Structure**
   - Token components
   - Token validation
   - Token expiration

3. **Role-Based Access Control Diagram**
   - Role hierarchy
   - Permission matrix
   - Access levels

---

## 3. IMAGE SPECIFICATIONS

### 3.1 Image Formats
- **Screenshots:** PNG or JPG format
- **Diagrams:** SVG (preferred) or PNG
- **Charts:** PNG or SVG
- **Flowcharts:** PNG or SVG

### 3.2 Image Dimensions
- **Screenshots:** 1920x1080 or 1280x720
- **Diagrams:** 1200x800 or scalable SVG
- **Charts:** 800x600 or scalable SVG
- **Icons:** 64x64 or 128x128

### 3.3 Image Quality
- **Resolution:** Minimum 72 DPI for web, 300 DPI for print
- **File Size:** Optimized for web (under 500KB when possible)
- **Format:** PNG for screenshots, SVG for diagrams

---

## 4. IMAGE CREATION TOOLS

### 4.1 Diagram Tools
- **Draw.io (diagrams.net):** Free, web-based
- **Lucidchart:** Professional diagrams
- **dbdiagram.io:** Database diagrams
- **PlantUML:** Code-based diagrams
- **Mermaid:** Markdown-based diagrams

### 4.2 Screenshot Tools
- **Snipping Tool:** Windows built-in
- **Greenshot:** Free screenshot tool
- **ShareX:** Advanced screenshot tool
- **Browser DevTools:** For web screenshots

### 4.3 Chart Tools
- **Chart.js:** JavaScript charts
- **Recharts:** React charts
- **Google Charts:** Web-based charts
- **Excel/Google Sheets:** For data visualization

---

## 5. IMAGE PLACEMENT GUIDE

### 5.1 Code Sections
- Place architecture diagrams at the beginning of relevant sections
- Include code structure diagrams near code examples
- Add flow diagrams to explain processes

### 5.2 Documentation Pages
- Place overview diagrams at the top
- Include screenshots for each feature
- Add workflow diagrams for complex processes
- Include examples for user guides

### 5.3 Best Practices
- **Caption:** Always include descriptive captions
- **Alt Text:** Provide alt text for accessibility
- **Context:** Place images near relevant text
- **Size:** Optimize image size for web
- **Quality:** Ensure images are clear and readable

---

## 6. SPECIFIC IMAGE RECOMMENDATIONS BY PAGE

### PROJECT_REPORT.md Images
1. **Section 2.1:** System Architecture Diagram
2. **Section 3 (each module):** Module workflow diagram
3. **Section 4:** Database ER Diagram
4. **Section 5:** API Endpoint Map
5. **Section 6:** Security Architecture Diagram
7. **Section 7:** Deployment Architecture Diagram
8. **Section 9:** Challenge-Solution Flow Diagrams

### PROJECT_OVERVIEW.md Images
1. **Section 3.1:** High-Level Architecture Diagram
2. **Section 3.2:** Technology Stack Visualization
3. **Section 4 (each module):** Module feature diagram
4. **Section 5.2:** Database Table Relationships
5. **Section 6:** Security Layers Diagram
6. **Section 7.1:** Deployment Architecture
7. **Section 8.1:** UI Design Examples
8. **Section 9.1:** API Structure Diagram

### LOG_BOOK_FULL.md Images
1. **Weekly Summaries:** Progress charts
2. **Module Implementation:** Code structure diagrams
3. **Challenges Section:** Problem-solution diagrams

---

## 7. IMAGE NAMING CONVENTION

### 7.1 Naming Format
```
[document]-[section]-[description]-[number].png
```

### 7.2 Examples
- `project-report-system-architecture-01.png`
- `project-overview-database-schema-01.png`
- `module-student-registration-form-01.png`
- `api-authentication-flow-01.png`

---

## 8. IMAGE CHECKLIST

Before including images in documentation:

- [ ] Image is relevant to the content
- [ ] Image has descriptive caption
- [ ] Image has alt text for accessibility
- [ ] Image is optimized for web
- [ ] Image is clear and readable
- [ ] Image follows naming convention
- [ ] Image is properly sized
- [ ] Image is in correct format
- [ ] Image is placed near relevant text
- [ ] Image enhances understanding

---

## 9. SAMPLE IMAGE DESCRIPTIONS

### Sample 1: System Architecture
**Description:** "System Architecture Diagram showing the three-tier architecture with React frontend, Express.js backend, and MySQL database, all containerized with Docker and served through Nginx reverse proxy."

**Use Case:** PROJECT_REPORT.md Section 2.1, PROJECT_OVERVIEW.md Section 3.1

---

### Sample 2: Database ER Diagram
**Description:** "Entity Relationship Diagram showing all database tables and their relationships, including primary keys, foreign keys, and cardinality between tables."

**Use Case:** PROJECT_REPORT.md Section 4, PROJECT_OVERVIEW.md Section 5.2

---

### Sample 3: Payment Flow
**Description:** "Payment processing flow diagram showing the complete payment lifecycle from user initiation through gateway processing, webhook notification, and reconciliation."

**Use Case:** PROJECT_REPORT.md Section 3.6, Payment System documentation

---

### Sample 4: Dashboard Screenshot
**Description:** "Screenshot of the main dashboard showing statistics cards, quick actions, navigation sidebar, and recent activity feed."

**Use Case:** User Guide, PROJECT_OVERVIEW.md Section 8.1

---

## 10. CONCLUSION

These image suggestions are designed to enhance the documentation by providing visual context for code sections and documentation pages. Images should be created using appropriate tools and follow the specifications outlined in this document.

**Remember:**
- Images should complement, not replace, text content
- Always include captions and alt text
- Optimize images for web performance
- Ensure images are clear and professional
- Update images when content changes

---

**Document Version:** 1.0  
**Last Updated:** December 1, 2025


# MyMasjidApp - Technology Stack

## Programming Languages

### Frontend
- **JavaScript (ES6+)** - Modern JavaScript with ES modules
- **JSX** - JavaScript XML for React component syntax

### Backend
- **JavaScript (ES6+)** - Node.js with ES modules (`type: "module"`)

---

## Frontend Technologies

### Core Framework
- **React 19.1.1** - UI library for building user interfaces
- **React DOM 19.1.1** - React renderer for the web

### Routing
- **React Router DOM 7.9.1** - Client-side routing for React applications

### Build Tool & Development
- **Vite 7.1.7** - Fast build tool and development server
- **@vitejs/plugin-react 5.0.3** - Vite plugin for React support

### Styling
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **@tailwindcss/forms 0.5.10** - Tailwind plugin for form styling
- **tailwindcss-animate 1.0.7** - Animation utilities for Tailwind
- **PostCSS 8.5.6** - CSS post-processor
- **Autoprefixer 10.4.21** - CSS vendor prefixer

### UI Components & Icons
- **Lucide React 0.544.0** - Icon library for React

### HTTP Client
- **Axios 1.12.2** - Promise-based HTTP client

### Notifications
- **React Toastify 11.0.5** - Toast notification library

### Animations
- **GSAP 3.13.0** - Animation library

### Document Generation
- **docx 9.5.1** - Generate Word documents (.docx)
- **PDFKit 0.17.2** - Generate PDF documents
- **xlsx 0.18.5** - Excel file generation and parsing
- **file-saver 2.0.5** - Save files from the browser

### QR Code
- **qrcode.react 4.2.0** - QR code generation component

### Caching
- **node-cache 5.1.2** - In-memory caching

### Development Tools
- **ESLint 9.36.0** - JavaScript linter
- **@eslint/js 9.36.0** - ESLint JavaScript plugin
- **eslint-plugin-react-hooks 5.2.0** - React Hooks linting rules
- **eslint-plugin-react-refresh 0.4.20** - React refresh linting
- **globals 16.4.0** - Global variables for ESLint

---

## Backend Technologies

### Core Framework
- **Express.js 4.18.2** - Web application framework for Node.js

### Security
- **Helmet 8.1.0** - Security headers middleware
- **CORS 2.8.5** - Cross-Origin Resource Sharing middleware
- **express-rate-limit 8.1.0** - Rate limiting middleware
- **express-validator 7.0.1** - Input validation middleware
- **bcryptjs 2.4.3** - Password hashing
- **jsonwebtoken 9.0.2** - JWT authentication

### Database
- **MySQL 8.0** - Relational database management system
- **mysql2 3.9.2** - MySQL client for Node.js with Promise support

### File Upload
- **Multer 1.4.5-lts.1** - File upload middleware

### Environment & Configuration
- **dotenv 16.4.5** - Environment variable management

### HTTP Client
- **Axios 1.7.9** - Promise-based HTTP client

### Scheduling & Cron Jobs
- **node-cron 4.2.1** - Task scheduler for Node.js

### Email Service
- **Nodemailer 7.0.10** - Email sending library

### SMS Service
- **Twilio 5.10.5** - SMS and communication API

### Payment Gateway
- **ToyyibPay** - Malaysian payment gateway (FPX, Credit/Debit Cards, DuitNow QR, E-Wallets)

### Google Services
- **googleapis 165.0.0** - Google APIs client library

### Database Backup
- **mysqldump 3.2.0** - MySQL database backup utility
- **archiver 7.0.1** - File archiving (ZIP, TAR)

### Utilities
- **uuid 10.0.0** - UUID generation
- **xlsx 0.18.5** - Excel file processing
- **node-cache 5.1.2** - In-memory caching

### Development Tools
- **Nodemon 3.1.1** - Development server with auto-restart

---

## Database

### Database System
- **MySQL 8.0** - Primary relational database

### Database Features Used
- Connection pooling
- Transactions
- Stored procedures (if any)
- Foreign key constraints
- Indexes for performance

---

## DevOps & Deployment

### Containerization
- **Docker** - Container platform
- **Docker Compose 3.8** - Multi-container Docker application orchestration

### Web Server / Reverse Proxy
- **Nginx Alpine** - Web server and reverse proxy

### Container Services
1. **MySQL Container** - Database service
2. **Backend Container** - Node.js API server
3. **Frontend Container** - React production build served via Nginx
4. **Nginx Container** - Reverse proxy and load balancer

---

## Architecture Pattern

### Application Type
- **Full-Stack Web Application** - React frontend + Node.js/Express backend

### Architecture Style
- **RESTful API** - Backend exposes REST endpoints
- **Client-Server Architecture** - Separation of frontend and backend
- **Microservices-ready** - Containerized services

---

## Development Environment

### Package Management
- **npm** - Node Package Manager

### Module System
- **ES Modules (ESM)** - `type: "module"` in package.json

### Code Quality
- **ESLint** - Linting and code quality
- **Source Maps** - For debugging

---

## Third-Party Services & APIs

### Payment Processing
- **ToyyibPay** - Payment gateway for Malaysian market
  - Supports: FPX, Credit/Debit Cards, DuitNow QR, E-Wallets (TNG, Boost, GrabPay)

### Communication
- **Twilio** - SMS notifications
- **Nodemailer** - Email notifications

### Cloud Services
- **Google APIs** - Integration with Google services

---

## Security Features

- **Helmet.js** - Security headers (CSP, HSTS, XSS protection)
- **CORS** - Cross-origin request handling
- **Rate Limiting** - API protection against abuse
- **Input Sanitization** - XSS prevention
- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcryptjs for password security
- **Express Validator** - Input validation

---

## File Structure

```
MyMasjidApp/
├── src/              # Frontend React application
├── backend/          # Backend Express.js API
├── database/         # Database schemas and migrations
├── nginx/            # Nginx configuration
├── uploads/          # File uploads storage
├── docker-compose.yml # Docker orchestration
└── Dockerfile        # Frontend container definition
```

---

## Key Features Implemented

- User authentication and authorization
- Payment processing with ToyyibPay
- Fee management system
- Receipt generation (HTML, PDF, Word)
- Database backup automation
- Email notifications
- SMS notifications (via Twilio)
- File upload handling
- Scheduled tasks (cron jobs)
- QR code generation
- Excel export/import
- Document generation (Word, PDF)

---

## Version Information

- **Node.js**: (Check with `node --version`)
- **React**: 19.1.1
- **Express**: 4.18.2
- **MySQL**: 8.0
- **Vite**: 7.1.7
- **Tailwind CSS**: 3.4.17

---

*Last Updated: Generated automatically from project analysis*

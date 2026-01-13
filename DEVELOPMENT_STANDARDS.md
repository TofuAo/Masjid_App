# MyMasjidApp - Development Standards Manual

Version 1.0  
Date: January 2025

---

## 1. Introduction / Overview

### Purpose of the Manual

This development standards manual establishes the technical guidelines, processes, and best practices for developing and maintaining the MyMasjidApp system. It ensures consistency, quality, and maintainability across the development lifecycle.

### Scope

This manual applies to:
- All software development activities for MyMasjidApp
- Frontend development (React)
- Backend development (Node.js/Express)
- Database design and management (MySQL)
- DevOps and deployment processes
- Quality assurance and testing
- Documentation requirements

### Audience

This manual is intended for:
- Software developers working on the MyMasjidApp codebase
- Quality assurance engineers and testers
- DevOps engineers and system administrators
- Project managers and technical leads
- New team members joining the project

### Definitions / Glossary

**API**: Application Programming Interface - the interface between frontend and backend

**CI/CD**: Continuous Integration / Continuous Deployment - automated build and deployment processes

**Docker**: Containerization platform used for deployment

**JWT**: JSON Web Token - authentication mechanism

**MVC**: Model-View-Controller - architectural pattern

**SDLC**: Software Development Lifecycle

**VPS**: Virtual Private Server - hosting environment

**ORM**: Object-Relational Mapping - database abstraction layer

---

## 2. Software Development Lifecycle (SDLC)

### Methodology

MyMasjidApp follows a **Hybrid Agile/DevOps** approach combining:

- **Agile principles**: Iterative development, user feedback, flexible planning
- **DevOps practices**: Continuous integration, automated deployment, infrastructure as code
- **Incremental delivery**: Regular releases with new features and improvements

### SDLC Stages

#### Requirements Gathering

**Activities:**
- Collect user requirements through stakeholder meetings
- Document functional and non-functional requirements
- Define acceptance criteria for each feature
- Prioritize features using backlog management
- Update requirements based on feedback

**Deliverables:**
- Feature specification documents
- User stories with acceptance criteria
- Requirements traceability matrix

#### Design

**Activities:**
- Create system architecture diagrams
- Design database schema and relationships
- Plan API endpoints and data models
- Design user interface mockups (if applicable)
- Define security and authentication flows
- Document integration points

**Deliverables:**
- Architecture documentation
- Database schema design
- API specification
- UI/UX designs (if applicable)

#### Implementation / Coding

**Activities:**
- Write code following coding standards (see Section 3)
- Implement features according to specifications
- Write inline documentation and comments
- Follow version control guidelines (see Section 4)
- Conduct peer code reviews
- Update documentation as code evolves

**Deliverables:**
- Source code
- Code documentation
- Unit tests
- Updated API documentation

#### Testing / QA

**Activities:**
- Write and execute unit tests
- Perform integration testing
- Conduct system testing
- Execute user acceptance testing
- Perform security testing
- Report and track bugs

**Deliverables:**
- Test cases and test results
- Bug reports
- Test coverage reports
- Quality metrics

#### Deployment

**Activities:**
- Build application for production
- Run deployment scripts
- Verify deployment success
- Monitor application health
- Perform smoke tests in production
- Document deployment process

**Deliverables:**
- Deployed application
- Deployment logs
- Deployment documentation
- Monitoring setup

#### Maintenance / Support

**Activities:**
- Monitor application performance
- Fix bugs and issues
- Apply security patches
- Update dependencies
- Add new features
- Optimize performance
- Maintain documentation

**Deliverables:**
- Bug fixes
- Performance improvements
- Updated documentation
- Release notes

---

## 3. Coding Standards and Guidelines

### Programming Languages and Versions

**Frontend:**
- JavaScript (ES6+)
- React 19.1.1
- JSX syntax

**Backend:**
- JavaScript (ES6+)
- Node.js (LTS version)
- Express.js

**Database:**
- MySQL 8.0
- SQL syntax

### Naming Conventions

Naming conventions ensure code readability and consistency across the project. Well-named variables, functions, and files make code self-documenting and easier to maintain.

#### Variables

- Use **camelCase** for variables - This convention is standard in JavaScript and makes variables easy to read
- Use descriptive names that indicate purpose - Clear names reduce the need for comments and make code self-explanatory
- Boolean variables should start with `is`, `has`, `should`, or `can` - This makes boolean checks read like natural language (e.g., `if (isActive)` reads better than `if (active)`)
- Constants should use **UPPER_SNAKE_CASE** - Uppercase letters make constants stand out, indicating they should not be changed

**Examples from MyMasjidApp:**
```javascript
// Good - from backend/controllers/authController.js
const SESSION_DURATION_SECONDS = 24 * 60 * 60; // 24 hours
const REFRESH_TOKEN_DURATION_SECONDS = 7 * 24 * 60 * 60; // 7 days
const normalizedIC = normalizeICForQuery(ic_number);
const hasStudentRole = existingUser.role === userRole;
const isTokenExpired = () => {
  const expiry = getStoredExpiry();
  return typeof expiry === 'number' && !Number.isNaN(expiry) && Date.now() > expiry;
};

// Bad
const u = 'John';
const active = true;
const x = 3;
```

#### Functions / Methods

- Use **camelCase** for function names - Consistent with JavaScript conventions
- Use verb-noun pattern for function names - The verb describes the action (get, create, update, delete), and the noun describes what is being acted upon (e.g., `getUserById`, `createStudent`)
- Use descriptive names that indicate what the function does - Function names should clearly communicate their purpose without needing to read the implementation

**Why this matters:** Clear function names make code self-documenting. When a developer sees `getStudentById(id)`, they immediately understand what the function does without reading its implementation.

**Examples from MyMasjidApp:**
```javascript
// Good - from backend/controllers/authController.js
export const register = async (req, res) => { }
export const login = async (req, res) => { }
async function attachRoleMetadata(user) { }
const isTokenExpired = () => { }
const normalizeICForQuery = (ic) => { }
const isValidICFormat = (ic) => { }

// Good - from src/services/api.js
export const authAPI = {
  login: async (data) => { },
  register: async (data) => { },
  getProfile: async () => { }
};

// Bad
function get() { }
function calc() { }
function check() { }
```

#### Classes / Modules

- Use **PascalCase** for class names
- Use **camelCase** for module/file names (React components use PascalCase)
- Use descriptive names that indicate purpose

**Examples from MyMasjidApp:**
```javascript
// Good - React components use PascalCase
// src/pages/Pelajar.jsx
const Pelajar = ({ user }) => { }

// src/components/auth/Login.jsx
const Login = () => { }

// Backend controllers - camelCase file names, exported functions
// backend/controllers/authController.js
export const register = async (req, res) => { }
export const login = async (req, res) => { }

// backend/controllers/studentController.js
export const getAllStudents = async (req, res) => { }
export const createStudent = async (req, res) => { }

// Bad
class service { }
class ctrl { }
```

#### Files and Folders

- Use **kebab-case** for file and folder names (or camelCase for JS files) - kebab-case works well across all operating systems and is URL-friendly
- React component files use **PascalCase** - This convention matches React component naming and makes it easy to distinguish component files from utility files
- Keep file names concise but descriptive - File names should be long enough to be clear but short enough to be manageable

**Explanation:** File naming conventions help developers quickly locate files. When you see `authController.js`, you know it's an authentication controller. When you see `Login.jsx`, you know it's a React component for login functionality.

**Examples from MyMasjidApp:**
```
// Good - Backend files (camelCase/kebab-case)
backend/routes/auth.js
backend/routes/students.js
backend/routes/teachers.js
backend/controllers/authController.js
backend/controllers/studentController.js
backend/middleware/auth.js
backend/utils/icUtils.js
backend/config/database.js

// Good - Frontend React components (PascalCase)
src/pages/Pelajar.jsx
src/pages/Guru.jsx
src/pages/Kelas.jsx
src/components/auth/Login.jsx
src/components/auth/Register.jsx
src/components/pelajar/PelajarList.jsx
src/services/api.js
src/utils/icUtils.js

// Bad
file1.js
temp.js
user.js
```

### Code Formatting Rules

#### Indentation

- Use **2 spaces** for indentation (no tabs) - Two spaces provide good readability without excessive horizontal scrolling. Tabs can display differently on different systems
- Configure editor to show whitespace - This helps catch inconsistent indentation and trailing spaces
- Maintain consistent indentation levels - Consistent indentation makes code structure visually clear

**Why this matters:** Consistent indentation is crucial for readability. It helps developers understand code structure at a glance and makes debugging easier.

#### Line Length

- Maximum line length: **100 characters** - This length fits comfortably on most screens and allows side-by-side code review without horizontal scrolling
- Break long lines for readability - Long lines are harder to read and understand
- Align continuation lines appropriately - Continuation lines should be indented to show they are part of the same statement

**Explanation:** Enforcing a maximum line length improves code readability, especially during code reviews or when viewing code on smaller screens.

#### Commenting / Documentation Style

**Inline Comments:**
- Use comments to explain "why", not "what" - The code itself shows "what" it does. Comments should explain the reasoning, edge cases, or non-obvious behavior
- Write comments in clear, concise English - Comments should be as readable as the code itself
- Update comments when code changes - Outdated comments are misleading and worse than no comments
- Remove commented-out code before committing - Version control (Git) keeps history, so commented code is unnecessary

**Why this matters:** Good comments explain the reasoning behind code decisions, making it easier for other developers (or yourself in the future) to understand why something was done a certain way.

**Function Documentation:**
- Document all public functions and methods
- Use JSDoc format for JavaScript functions
- Include parameter descriptions and return types

**Examples from MyMasjidApp:**
```javascript
// backend/controllers/authController.js
/**
 * Authenticates a user and returns a JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const login = async (req, res) => {
  try {
    const { icNumber, password } = req.body;
    // Implementation...
  } catch (error) {
    // Error handling...
  }
};

/**
 * Normalizes IC number for database queries (removes hyphens and spaces)
 * @param {string} ic - IC number with or without hyphens
 * @returns {string} Normalized IC number (12 digits)
 */
const normalizeICForQuery = (ic) => {
  return typeof ic === 'string' ? ic.replace(/[-\s]/g, '') : ic;
};
```

### Best Practices

#### DRY (Don't Repeat Yourself)

- Extract common functionality into reusable functions - If the same logic appears in multiple places, extract it into a function
- Create utility modules for shared code - Shared utilities (like IC normalization, phone formatting) should be in utility modules
- Avoid duplicating code across files - Code duplication makes maintenance harder because bugs must be fixed in multiple places

**Explanation:** DRY principle reduces code duplication, making the codebase smaller, easier to maintain, and less error-prone. When logic needs to change, it only needs to be updated in one place. In MyMasjidApp, IC normalization is centralized in `backend/utils/icUtils.js`, so if the format changes, it only needs to be updated once.

#### SOLID Principles

- **Single Responsibility**: Each function/class should have one purpose - A function that does too many things is harder to understand, test, and maintain
- **Open/Closed**: Open for extension, closed for modification - Code should be extensible without modifying existing functionality
- **Liskov Substitution**: Derived classes must be substitutable - Subclasses should be usable wherever their parent class is expected
- **Interface Segregation**: Many specific interfaces are better than one general - Interfaces should be focused and not force implementations of unused methods
- **Dependency Inversion**: Depend on abstractions, not concretions - High-level modules should not depend on low-level modules; both should depend on abstractions

**Explanation:** SOLID principles help create maintainable, flexible, and testable code. For example, in MyMasjidApp, authentication logic is separated from business logic (controllers depend on middleware for authentication), making it easy to change authentication methods without affecting business logic.

#### Error Handling

- Always handle errors explicitly - Never ignore errors. Always handle them appropriately (log, return error response, or rethrow)
- Use try-catch blocks for async operations - Async operations can fail, and try-catch blocks prevent unhandled promise rejections
- Provide meaningful error messages - Error messages should help users understand what went wrong and how to fix it
- Log errors appropriately - Log errors with context (user ID, request details) for debugging, but don't log sensitive information
- Don't expose sensitive information in error messages - Error messages sent to users should not reveal database structure, internal paths, or other sensitive details

**Why this matters:** Proper error handling improves user experience and makes debugging easier. In MyMasjidApp, controllers catch errors and return user-friendly messages in Malay, while logging detailed error information for developers.

**Example from MyMasjidApp (backend/controllers/authController.js):**
```javascript
export const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const firstError = errors.array()[0];
      return res.status(400).json({
        success: false,
        message: firstError.msg || 'Validation failed',
        errors: errors.array()
      });
    }

    const { nama, ic_number, email, password, telefon, umur } = req.body;
    
    // Validate and normalize IC number
    if (!isValidICFormat(ic_number)) {
      return res.status(400).json({
        success: false,
        message: 'Format IC tidak sah. Sila masukkan 12 digit nombor IC.'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user...
    return res.status(201).json({
      success: true,
      message: 'Registration successful'
    });
  } catch (error) {
    console.error('[REGISTER] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Ralat sistem. Sila cuba lagi.'
    });
  }
};
```

#### Logging

- Use appropriate log levels (info, warn, error, debug)
- Include context in log messages
- Don't log sensitive information (passwords, tokens)
- Use structured logging when possible

**Example from MyMasjidApp:**
```javascript
// backend/middleware/securityLogger.js
import { logFailedAuthAttempt, logSuspiciousActivity } from '../middleware/securityLogger.js';

// In authController.js
console.error('[REGISTER] Password hashing error:', error);
console.warn(`[REGISTER] Weak password used for IC: ${normalizedIC}`);
console.error('[REGISTER] Error checking for existing users:', error);

// Structured logging example
logger.info('User login attempt', { 
  icNumber: user.ic, 
  timestamp: new Date(),
  ip: req.ip 
});
logger.error('Database connection failed', { 
  error: error.message,
  stack: error.stack 
});
```

---

## 4. Version Control Guidelines

### Tools

- **Git** - Primary version control system
- **GitHub/GitLab/Bitbucket** - Remote repository hosting (as configured)

### Branching Strategy

MyMasjidApp uses a **simplified Git Flow** approach:

#### Main Branches

- **main** (or **master**): Production-ready code
  - Protected branch (requires pull request)
  - Only stable, tested code
  - Each commit should be tagged with version number

- **develop**: Integration branch for development
  - Main development branch
  - All feature branches merge here
  - Should always be in a deployable state

#### Supporting Branches

- **feature/[feature-name]**: New features
  - Branch from: `develop`
  - Merge to: `develop`
  - Naming: `feature/user-authentication`, `feature/payment-gateway`

- **bugfix/[bug-description]**: Bug fixes
  - Branch from: `develop` or `main` (depending on severity)
  - Merge to: `develop` or `main`
  - Naming: `bugfix/login-error`, `bugfix/database-connection`

- **hotfix/[issue-description]**: Critical production fixes
  - Branch from: `main`
  - Merge to: `main` and `develop`
  - Naming: `hotfix/security-patch`, `hotfix/critical-bug`

### Commit Message Conventions

Use **Conventional Commits** format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes

**Examples:**
```
feat(auth): add JWT token refresh mechanism

Implement automatic token refresh when token expires.
Token refresh happens in the background without user intervention.

Closes #123
```

```
fix(payment): resolve fee calculation error for partial payments

Fixed incorrect fee calculation when student pays partial amount.
Updated validation logic to handle edge cases.

Fixes #456
```

```
docs(api): update API documentation for user endpoints

Added examples and error responses to user API documentation.
```

### Pull Request / Code Review Process

#### Pull Request Requirements

1. **Branch**: Create branch from appropriate base branch
2. **Commits**: Ensure commits follow commit message conventions
3. **Tests**: All tests must pass
4. **Documentation**: Update documentation if needed
5. **Description**: Provide clear PR description with:
   - What changes were made
   - Why the changes were needed
   - How to test the changes
   - Screenshots (for UI changes)

#### Code Review Guidelines

**Reviewers should check:**
- Code follows coding standards
- Logic is correct and efficient
- Error handling is appropriate
- Tests are adequate
- Documentation is updated
- No security vulnerabilities
- Performance implications considered

**Review Process:**
1. Author creates pull request
2. At least one reviewer assigned
3. Reviewer reviews code and provides feedback
4. Author addresses feedback
5. Reviewer approves when satisfied
6. PR is merged (squash and merge preferred)

**Review Checklist:**
- [ ] Code follows naming conventions
- [ ] Code is properly formatted
- [ ] Functions have appropriate documentation
- [ ] Error handling is implemented
- [ ] Tests are included and passing
- [ ] No security issues
- [ ] Performance is acceptable
- [ ] Documentation is updated

---

## 5. Software Architecture and Design Principles

### Architectural Patterns

MyMasjidApp uses a **Layered Architecture** with **MVC pattern**:

#### Frontend (React)
- **View Layer**: React components (presentation)
- **Service Layer**: API service modules (business logic)
- **State Management**: React Context API / Hooks
- **Routing**: React Router (navigation)

#### Backend (Node.js/Express)
- **Routes Layer**: API route definitions - Routes in `backend/routes/` define URL patterns and map them to controllers. They also apply middleware (authentication, validation)
- **Controller Layer**: Request handlers (business logic) - Controllers in `backend/controllers/` handle HTTP requests, validate input, call services, and format responses
- **Service Layer**: Business logic and data processing - Services in `backend/services/` contain reusable business logic that can be called by multiple controllers
- **Model Layer**: Database interactions and data models - Database queries are executed using the connection pool from `backend/config/database.js`

**Explanation:** This layered approach makes it easy to change database schemas without affecting controllers, or change business logic without affecting routes. Each layer has a clear responsibility.

#### Database (MySQL)
- **Relational Database**: MySQL 8.0
- **Yearly Database System**: Separate database per year (masjid_app_2024, masjid_app_2025)
- **Master Database**: masjid_master (tracks active years)
- **Schema Design**: Normalized database structure

**Main Tables:**
- `users` - Main user table (IC as primary key)
- `students` - Student-specific data (references users.ic)
- `teachers` - Teacher-specific data (references users.ic)
- `classes` - Class information
- `attendance` - Attendance records
- `exams` - Exam information
- `results` - Exam results
- `fees` - Fee records and payments
- `user_roles` - User role assignments (supports multiple roles)

**Example Schema:**
```sql
CREATE TABLE users (
    ic VARCHAR(20) PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    umur INT,
    alamat VARCHAR(255),
    telefon VARCHAR(20),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    role ENUM('student','teacher','admin') NOT NULL,
    status ENUM('aktif','tidak_aktif','cuti') DEFAULT 'aktif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE students (
    user_ic VARCHAR(20) PRIMARY KEY,
    kelas_id INT,
    tarikh_daftar DATE,
    FOREIGN KEY (user_ic) REFERENCES users(ic) ON DELETE CASCADE,
    FOREIGN KEY (kelas_id) REFERENCES classes(id) ON DELETE SET NULL
);
```

### Design Patterns

**Recommended Patterns:**
- **Module Pattern**: Organize code into modules
- **Service Pattern**: Separate business logic into services
- **Repository Pattern**: Abstract database access (if applicable)
- **Middleware Pattern**: Express middleware for cross-cutting concerns
- **Factory Pattern**: Create objects with flexible creation logic
- **Singleton Pattern**: Database connections, configuration

**Example from MyMasjidApp:**

**Service Pattern (backend/services/):**
```javascript
// backend/services/userRoleService.js
export const fetchUserRoles = async (userIc, primaryRole) => {
  // Fetch all roles for a user from user_roles table
  // Return array of role strings
};

// backend/services/studentService.js
export const fetchStudentByIc = async (ic) => {
  // Fetch student data by IC number
  // Return student object
};
```

**Controller Pattern (backend/controllers/):**
```javascript
// backend/controllers/studentController.js
export const getAllStudents = async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    // Fetch students with pagination and search
    // Return formatted response
  } catch (error) {
    // Error handling
  }
};
```

**Route Pattern (backend/routes/):**
```javascript
// backend/routes/students.js
import { getAllStudents, createStudent } from '../controllers/studentController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

router.route('/')
  .get(authenticateToken, getAllStudents)
  .post(authenticateToken, requireRole(['admin']), createStudent);
```

### Guidelines for Modularity, Scalability, and Maintainability

#### Modularity

- Organize code into logical modules
- Keep modules focused and cohesive
- Minimize coupling between modules
- Use clear module interfaces

#### Scalability

- Design for horizontal scaling
- Use stateless design where possible
- Implement caching strategies
- Optimize database queries
- Consider microservices for large features

#### Maintainability

- Write self-documenting code
- Keep functions small and focused
- Use meaningful names
- Document complex logic
- Follow consistent patterns

---

## 6. Testing and Quality Assurance

### Types of Tests Required

#### Unit Tests

- Test individual functions and methods in isolation
- Mock external dependencies
- Aim for high code coverage (target: 80%+)
- Run quickly and frequently

**Tools/Frameworks:**
- Jest (JavaScript testing framework)
- React Testing Library (for React components)

#### Integration Tests

- Test interactions between components - Integration tests verify that different parts of the application work together correctly
- Test API endpoints with database - Tests make real API calls and interact with a test database, ensuring the full request-response cycle works
- Test service layer integrations - Services are tested together with their dependencies (like database queries)
- Verify data flow through system - Integration tests ensure data flows correctly through layers (route → controller → service → database)

**Explanation:** While unit tests verify individual functions work, integration tests verify that different parts work together. For example, an integration test might create a student via the API and verify the student appears in the database.

**Tools/Frameworks:**
- Jest with Supertest (for API testing)
- Test database setup

#### System Tests

- Test complete user workflows
- Test end-to-end scenarios
- Test system under realistic conditions
- Verify system meets requirements

**Tools/Frameworks:**
- Manual testing procedures
- Automated E2E testing (if implemented)

#### Acceptance Tests

- Verify features meet acceptance criteria
- Test from user perspective
- Validate business requirements
- User acceptance testing (UAT)

### Testing Tools / Frameworks

**Primary Tools:**
- **Jest**: JavaScript testing framework
- **React Testing Library**: React component testing
- **Supertest**: HTTP assertion library for API testing

**Test Structure (Recommended):**
```
tests/
  ├── unit/
  │   ├── services/
  │   │   ├── userRoleService.test.js
  │   │   └── studentService.test.js
  │   ├── utils/
  │   │   ├── icUtils.test.js
  │   │   └── passwordPolicy.test.js
  │   └── components/
  │       ├── Login.test.jsx
  │       └── Pelajar.test.jsx
  ├── integration/
  │   ├── api/
  │   │   ├── auth.test.js
  │   │   └── students.test.js
  │   └── database/
  │       └── queries.test.js
  └── e2e/
      └── user-flow.test.js
```

**Note:** Currently, MyMasjidApp uses manual testing procedures. Automated testing frameworks can be added as the project grows.

### Bug Reporting and Tracking

**Bug Report Template:**
- **Title**: Clear, concise description
- **Severity**: Critical, High, Medium, Low
- **Priority**: P1, P2, P3, P4
- **Environment**: Browser, OS, version
- **Steps to Reproduce**: Detailed steps
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Screenshots/Logs**: Visual evidence
- **Additional Context**: Any other relevant information

**Bug Workflow:**
1. Bug reported with template
2. Bug triaged and assigned priority
3. Bug assigned to developer
4. Developer fixes bug
5. Fix verified through testing
6. Bug marked as resolved
7. Bug closed after verification

### Code Coverage / Quality Metrics

**Target Metrics:**
- Code Coverage: Minimum 70%, Target 80%+
- Code Quality: Maintain A rating (if using tools like SonarQube)
- Test Coverage: All critical paths covered
- Performance: Response time < 500ms for API calls

**Tools:**
- Jest coverage reports
- ESLint for code quality
- Code review process

---

## 7. Documentation Standards

### Required Documentation

#### Code Documentation

**Inline Comments:**
- Explain complex logic
- Document non-obvious behavior
- Include TODO/FIXME notes with context
- Reference related issues/tickets

**Function Documentation:**
- Use JSDoc format
- Document parameters and return types
- Include examples for complex functions
- Document exceptions/thrown errors

#### Design Documentation

**Architecture Documentation:**
- System architecture diagrams
- Database schema diagrams
- API endpoint documentation
- Data flow diagrams

**Design Decisions:**
- Document major design decisions
- Explain trade-offs considered
- Record alternatives evaluated

#### User Manuals / Technical Guides

**User Documentation:**
- User Manual (see USER_GUIDE.md)
- Feature-specific guides
- Troubleshooting guides

**Technical Documentation:**
- API documentation
- Deployment guides
- Development setup guides
- Configuration guides

### Tools or Formats Used

- **Markdown (.md)**: Primary documentation format
- **JSDoc**: Code documentation
- **README.md**: Project overview and quick start
- **Word Documents (.docx)**: User manuals (generated from Markdown)
- **Diagrams**: Mermaid syntax in Markdown files

**Documentation Structure (MyMasjidApp):**
```
MyMasjidApp/
  ├── README.md                    # Project overview
  ├── USER_GUIDE.md                # End-user guide
  ├── DEVELOPMENT_STANDARDS.md     # This file
  ├── DEPLOYMENT_GUIDE.md          # Deployment instructions
  ├── SECURITY_ARCHITECTURE.md     # Security documentation
  ├── SYSTEM_WORKFLOWS.md          # Workflow documentation
  ├── TECH_STACK.md                # Technology stack details
  ├── SCREENSHOT_LINKS.md          # Screenshot references
  ├── database/
  │   └── masjid_app_schema.sql    # Database schema
  └── .cursor/
      └── rules/
          └── auto-deploy.mdc      # Deployment automation rules
```

**Word Documents (Generated):**
- `MyMasjidApp_User_Manual_[timestamp].docx` - User manual
- `MyMasjidApp_Admin_Manual_[timestamp].docx` - Admin manual
- `MyMasjidApp_Development_Standards_[timestamp].docx` - Development standards

---

## 8. Deployment / Release Management

### Build Processes

**Frontend Build:**
```bash
npm run build
```
- Production build with Vite
- Optimized and minified assets
- Environment variables injected

**Backend Build:**
- Docker container build
- No separate build step (Node.js runtime)

**Automated Builds:**
- Manual builds currently (CI/CD can be added)
- Docker Compose for local testing
- Production builds on deployment server

### Deployment Procedures and Environments

#### Environments

**Development:**
- Local development on developer machines - Developers run the application on their own computers
- Uses Docker Compose - Docker Compose runs all services (database, backend, frontend) together for local development
- Hot reload enabled - Code changes are automatically reflected without restarting the server, speeding up development
- Debug mode enabled - Detailed error messages and logging help developers debug issues

**Why separate environments:** Development environments allow developers to test changes without affecting production users.

**Staging:**
- Production-like environment for testing - Staging mirrors production but uses test data
- Uses production-like configuration - Testing in a production-like environment catches issues that don't appear in development
- Testing of new features before production - Features are tested in staging before being released to users
- Optional environment - Staging is recommended but not required for smaller projects

**Explanation:** Staging environments reduce the risk of production bugs by catching issues before they reach users.

**Production:**
- Live application environment - This is where real users access the application
- Uses production configuration - Production settings prioritize security and performance
- SSL/TLS enabled - HTTPS encrypts data in transit, protecting user information
- Monitoring and logging enabled - Production monitoring helps detect and fix issues quickly

**Why this matters:** Production environments require careful configuration to ensure security, reliability, and performance for real users.

#### Deployment Process

1. **Code Review**: Ensure code is reviewed and approved
2. **Build**: Build frontend and backend containers
3. **Test**: Run tests in staging (if available)
4. **Backup**: Backup production database
5. **Deploy**: Deploy using Docker Compose
6. **Verify**: Verify deployment success
7. **Monitor**: Monitor application health
8. **Rollback**: Prepare rollback plan if needed

**Deployment Commands (MyMasjidApp):**
```bash
# Frontend deployment
npm run build
docker-compose build frontend
docker-compose up -d frontend

# Backend deployment
docker-compose build backend
docker-compose up -d backend

# Full deployment (as per auto-deploy.mdc rule)
npm run build && docker-compose build frontend && docker-compose build backend && docker-compose up -d frontend && docker-compose up -d backend

# Verify deployment
docker-compose ps
docker-compose logs backend --tail=50
docker-compose logs frontend --tail=50

# Database migration (if needed)
docker-compose exec backend npm run migrate
```

**Auto-Deployment Rule:**
- After ANY code changes, deployment is MANDATORY
- Frontend changes require: `npm run build` → `docker-compose build frontend` → `docker-compose up -d frontend`
- Backend changes require: `docker-compose build backend` → `docker-compose up -d backend`
- Always rebuild Docker images (don't just restart) to load new code

### Versioning Policy

**Semantic Versioning (SemVer):**
- Format: `MAJOR.MINOR.PATCH`
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

**Examples:**
- `1.0.0`: Initial release
- `1.1.0`: Added new feature
- `1.1.1`: Fixed bug
- `2.0.0`: Breaking changes

**Release Numbering:**
- Tag releases in Git: `v1.0.0`
- Document release notes
- Update version in package.json

### Rollback Strategies

**Rollback Procedures:**
1. Identify issue in production
2. Assess severity and impact
3. Revert code changes (Git revert)
4. Rebuild and redeploy previous version
5. Restore database backup if needed
6. Verify rollback success
7. Document incident

**Prevention:**
- Test thoroughly before deployment
- Use staging environment
- Gradual rollout when possible
- Monitor after deployment
- Keep backups available

---

## 9. Security Guidelines

### Authentication / Authorization Standards

**Authentication:**
- JWT tokens for session management
- Password hashing using bcrypt (minimum 10 rounds)
- Token expiration and refresh mechanisms
- Secure password requirements (minimum 6 characters, complexity recommended)

**Authorization:**
- Role-based access control (RBAC) - Users have roles (student, teacher, admin) that determine what actions they can perform
- Permission checks on API endpoints - Backend routes use middleware (like `requireRole(['admin'])`) to verify users have the necessary permissions
- Frontend route protection - React Router's `ProtectedRoute` component prevents unauthorized users from accessing certain pages
- Middleware for authorization checks - Middleware functions check user permissions before allowing requests to reach controllers

**Explanation:** Authorization ensures users can only access resources and perform actions they are allowed to. For example, only admins can create students, and students can only view their own data. This multi-layer approach (frontend and backend) provides defense in depth.

**Best Practices:**
- Never store passwords in plain text
- Use HTTPS for all communications
- Implement token refresh mechanism
- Log authentication attempts
- Implement account lockout after failed attempts

### Data Protection and Encryption

**Data at Rest:**
- Database encryption (MySQL encryption)
- File system encryption for sensitive files
- Backup encryption

**Data in Transit:**
- HTTPS/TLS for all communications
- SSL certificates (Let's Encrypt)
- Secure API endpoints

**Sensitive Data:**
- Encrypt sensitive user data
- Hash passwords with bcrypt
- Secure API keys and secrets
- Use environment variables for configuration

### Handling Sensitive Information

**Do NOT:**
- Commit secrets, passwords, or API keys to Git
- Log sensitive information
- Expose sensitive data in error messages
- Store credentials in code

**Do:**
- Use environment variables for secrets
- Use .env files (not committed to Git)
- Rotate keys regularly
- Use secure password storage (bcrypt hashing)
- Encrypt sensitive data (IC numbers, phone numbers, addresses)

**Environment Variables (backend/env.example):**
```bash
# Database
DB_HOST=mysql
DB_PORT=3306
DB_USER=root
DB_PASSWORD=masjid_password
DB_NAME=masjid_app

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=24h

# Server
PORT=5000
NODE_ENV=production
FRONTEND_URL=http://localhost:3000

# Email
EMAIL_USER=your_email@example.com
EMAIL_PASSWORD=your_app_password

# SMS (Twilio - optional)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Payment Gateway (ToyyibPay)
TOYYIBPAY_SECRET_KEY=your_secret_key
TOYYIBPAY_CATEGORY_CODE=your_category_code
```

**Note:** Never commit `.env` files. Use `env.example` as a template.

### Secure Coding Practices

**OWASP Top 10 Considerations:**
1. **Injection**: Use parameterized queries, input validation
2. **Broken Authentication**: Secure authentication mechanisms
3. **Sensitive Data Exposure**: Encrypt sensitive data
4. **XML External Entities (XXE)**: Not applicable (no XML processing)
5. **Broken Access Control**: Implement proper authorization
6. **Security Misconfiguration**: Secure default configurations
7. **XSS (Cross-Site Scripting)**: Sanitize user input, use React's built-in protection
8. **Insecure Deserialization**: Validate and sanitize input
9. **Using Components with Known Vulnerabilities**: Keep dependencies updated
10. **Insufficient Logging & Monitoring**: Implement proper logging

**Input Validation:**
- Validate all user input
- Sanitize input before processing
- Use whitelist validation where possible
- Validate data types and formats

**SQL Injection Prevention:**
- Use parameterized queries (mysql2 prepared statements)
- Never concatenate user input into SQL
- Always use `pool.execute()` with parameter placeholders

**Example from MyMasjidApp (backend/controllers/authController.js):**
```javascript
// ✅ SAFE - Uses prepared statement
const [users] = await pool.execute(
  "SELECT * FROM users WHERE REPLACE(REPLACE(ic, '-', ''), ' ', '') = ?",
  [normalizedIC]
);

// ✅ SAFE - Parameterized query
await pool.execute(
  'INSERT INTO users (ic, nama, email, password, role) VALUES (?, ?, ?, ?, ?)',
  [ic, nama, email, hashedPassword, role]
);

// ❌ UNSAFE - SQL injection risk
await pool.execute(`SELECT * FROM users WHERE ic = '${userIc}'`);
```

**XSS Prevention:**
- React escapes content by default
- Sanitize user-generated content
- Use Content Security Policy (CSP)

---

## 10. Maintenance and Support

### Bug Tracking and Prioritization

**Bug Severity Levels:**
- **Critical**: System down, data loss, security breach
- **High**: Major feature broken, significant impact
- **Medium**: Feature partially working, workaround available
- **Low**: Minor issue, cosmetic problem

**Bug Priority:**
- **P1**: Fix immediately (Critical)
- **P2**: Fix within 24 hours (High)
- **P3**: Fix within 1 week (Medium)
- **P4**: Fix when time permits (Low)

**Bug Lifecycle:**
1. Reported
2. Triaged
3. Assigned
4. In Progress
5. Testing
6. Resolved
7. Closed

### Patch Management

**Security Patches:**
- Apply security patches immediately
- Test patches in staging first
- Monitor after deployment
- Document patch application

**Dependency Updates:**
- Review dependency updates regularly
- Update minor/patch versions monthly
- Major version updates require testing
- Keep changelog of updates

**Version Management:**
- Maintain changelog
- Document patches and updates
- Version tagging in Git
- Release notes for users

### End-of-Life Policies for Software

**Deprecation Process:**
1. Announce deprecation (30-90 days notice)
2. Document migration path
3. Provide support during transition
4. Set end-of-life date
5. Remove deprecated features

**Support Levels:**
- **Active Support**: Full support and updates
- **Maintenance Support**: Security patches only
- **End of Life**: No support

---

## 11. Tools and Environment

### Development IDEs, Libraries, and Frameworks

**Recommended IDEs:**
- **VS Code**: Recommended editor with extensions
- **WebStorm**: Alternative IDE option
- **Cursor**: AI-assisted coding (as used in project)

**Required Extensions/Tools:**
- ESLint extension
- Prettier extension
- Git integration
- Docker extension
- MySQL client tools

**Libraries and Frameworks:**
- React 19.1.1
- Express.js
- MySQL 8.0
- Docker & Docker Compose
- Vite
- TailwindCSS
- Axios

### Testing Tools

- **Jest**: JavaScript testing framework
- **React Testing Library**: Component testing
- **Supertest**: API testing
- **Postman/Insomnia**: API testing tools (optional)

### Communication / Project Management Tools

**Communication:**
- Email for formal communications
- Project repository issues for tracking
- Documentation in Markdown files

**Project Management:**
- Git issues for task tracking
- GitHub/GitLab projects (if using)
- Documentation for requirements

**Development Tools:**
- Git for version control
- Docker for containerization
- npm for package management
- MySQL Workbench / DBeaver for database

---

## 12. Roles and Responsibilities

### Development Team Roles

**Software Developer:**
- Write code following standards
- Write unit tests
- Participate in code reviews
- Update documentation
- Fix bugs and issues

**Senior Developer / Technical Lead:**
- Review code and provide guidance
- Make architectural decisions
- Mentor junior developers
- Ensure code quality
- Coordinate technical work

**Quality Assurance Engineer:**
- Write and execute test cases
- Report bugs
- Verify bug fixes
- Test new features
- Maintain test documentation

**DevOps Engineer:**
- Manage deployment infrastructure
- Configure CI/CD pipelines
- Monitor system health
- Manage server environments
- Handle deployment processes

**Project Manager:**
- Coordinate development activities
- Manage requirements and backlog
- Track progress
- Facilitate communication
- Plan releases

### Expectations for Team Members

**All Team Members:**
- Follow coding standards
- Participate in code reviews
- Update documentation
- Communicate issues and blockers
- Test their own work

**Developers:**
- Write clean, maintainable code
- Write tests for new features
- Fix bugs in a timely manner
- Seek help when needed
- Share knowledge with team

---

## 13. Compliance and Legal Considerations

### Licensing Rules for Third-Party Libraries

**License Types:**
- Review licenses of all dependencies
- Prefer MIT, Apache 2.0, BSD licenses
- Avoid GPL unless appropriate
- Document licenses in project

**License Compliance:**
- Include license files
- Document third-party licenses
- Comply with license requirements
- Review licenses before adding dependencies

**Current Licenses:**
- Most dependencies use MIT/Apache licenses
- Review package.json for license information
- Check LICENSE files in dependencies

### Data Privacy Regulations

**General Data Protection:**
- Follow data protection best practices
- Implement user data privacy controls
- Provide data access and deletion capabilities
- Secure user data storage

**Regulations to Consider:**
- **GDPR** (if serving EU users): Right to access, deletion, portability
- **PDPA** (Malaysia): Personal Data Protection Act
- Local data protection laws

**Data Handling:**
- Collect only necessary data
- Inform users about data collection
- Secure data storage and transmission
- Provide data deletion options
- Document data processing activities

### Intellectual Property Rules

**Code Ownership:**
- Project code belongs to the organization
- Developers contribute code under project ownership
- Third-party code must be properly licensed

**Open Source Contributions:**
- Review before contributing to open source
- Follow organization policies
- Ensure no conflicts with project code

**Documentation:**
- Document IP considerations
- Maintain license information
- Track third-party code usage

---

## 14. Appendices

### Sample Templates

This section provides complete, ready-to-use templates for common development tasks. Copy these templates and customize them as needed for your specific use case.

#### Code Review Checklist

**Use this checklist when reviewing code changes to ensure quality and consistency:**

- [ ] **Code follows naming conventions**
  - Variables use camelCase (e.g., `userName`, `isActive`)
  - Functions use camelCase with verb-noun pattern (e.g., `getUserById`, `createStudent`)
  - Constants use UPPER_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`, `SESSION_DURATION_SECONDS`)
  - React components use PascalCase (e.g., `Login`, `PelajarList`)
  - File names follow conventions (camelCase for JS, PascalCase for React components)

- [ ] **Code is properly formatted**
  - Uses 2 spaces for indentation (no tabs)
  - Lines are within 100 character limit
  - Consistent formatting throughout the file
  - Proper spacing and alignment

- [ ] **Functions have documentation**
  - Public functions have JSDoc comments
  - Parameters and return types are documented
  - Complex functions have usage examples
  - Comments explain "why", not "what"

- [ ] **Error handling is implemented**
  - Try-catch blocks for async operations
  - Meaningful error messages (user-friendly in Malay for MyMasjidApp)
  - Errors are logged appropriately
  - No sensitive information in error messages
  - Graceful error handling (no unhandled promise rejections)

- [ ] **Tests are included and passing**
  - Unit tests for new functions
  - Integration tests for API endpoints (if applicable)
  - All tests pass
  - Test coverage is adequate

- [ ] **No security vulnerabilities**
  - Uses parameterized queries (no SQL injection)
  - Input validation and sanitization
  - No hardcoded secrets or passwords
  - Authentication/authorization checks present
  - No XSS vulnerabilities (React escapes by default)

- [ ] **Performance is acceptable**
  - Database queries are optimized (no N+1 queries)
  - No unnecessary re-renders (React optimization)
  - Efficient algorithms and data structures
  - Caching used where appropriate
  - No blocking operations in main thread

- [ ] **Documentation is updated**
  - README updated if needed
  - API documentation updated
  - Code comments are clear and current
  - User-facing documentation updated (if applicable)

- [ ] **No console.log statements in production code**
  - Console.log removed or replaced with proper logging
  - Debug statements removed
  - Only necessary logging remains (errors, important events)

- [ ] **No commented-out code**
  - Dead code removed
  - Commented code removed (Git history preserves it)
  - Only active, working code remains

#### Testing Checklist

**Use this checklist before submitting code to ensure thorough testing:**

- [ ] **Unit tests written for new functions**
  - Each new function has corresponding unit tests
  - Tests cover normal operation (happy path)
  - Tests are isolated and can run independently
  - External dependencies are mocked

- [ ] **Integration tests for API endpoints**
  - API endpoints are tested with real database connection (test database)
  - Request/response cycle is verified
  - Authentication and authorization are tested
  - Error responses are verified

- [ ] **Manual testing completed**
  - Feature works as expected in the UI
  - All user interactions work correctly
  - Navigation and routing work properly
  - Forms validate and submit correctly

- [ ] **Edge cases tested**
  - Empty inputs handled correctly
  - Null/undefined values handled
  - Boundary values tested (min/max limits)
  - Invalid data formats rejected properly

- [ ] **Error scenarios tested**
  - Network errors handled gracefully
  - Server errors display appropriate messages
  - Validation errors show correctly
  - Authentication errors redirect properly

- [ ] **Performance tested**
  - Page load times are acceptable (< 3 seconds)
  - API responses are fast (< 500ms)
  - No memory leaks (check with browser DevTools)
  - Database queries are optimized

- [ ] **Security tested**
  - Authentication required for protected routes
  - Authorization checks prevent unauthorized access
  - Input validation prevents injection attacks
  - Sensitive data is not exposed in responses
  - CSRF protection verified (if applicable)

- [ ] **Browser compatibility tested**
  - Works in Chrome (latest version)
  - Works in Firefox (latest version)
  - Works in Safari (latest version)
  - Works in Edge (latest version)
  - Fallbacks for unsupported features

- [ ] **Mobile responsiveness tested (if applicable)**
  - Layout adapts to mobile screen sizes
  - Touch interactions work correctly
  - Forms are usable on mobile
  - Navigation is accessible on small screens

#### Bug Report Template

**Use this template when reporting bugs to ensure all necessary information is included:**

**Title:** [Clear, concise description of the bug]
- Example: "Login fails with 'Invalid credentials' error for valid users"
- Keep it short but descriptive (one sentence)

**Severity:** [Critical/High/Medium/Low]
- **Critical**: System down, data loss, security breach - Fix immediately
- **High**: Major feature broken, significant impact - Fix within 24 hours
- **Medium**: Feature partially working, workaround available - Fix within 1 week
- **Low**: Minor issue, cosmetic problem - Fix when time permits

**Priority:** [P1/P2/P3/P4]
- **P1**: Fix immediately (Critical severity)
- **P2**: Fix within 24 hours (High severity)
- **P3**: Fix within 1 week (Medium severity)
- **P4**: Fix when time permits (Low severity)

**Environment:**
- **Browser**: [Browser name and version] (e.g., Chrome 120.0.6099.129, Firefox 121.0)
- **OS**: [Operating system] (e.g., Windows 11, macOS 14.2, Ubuntu 22.04)
- **Device**: [Desktop/Mobile/Tablet] (e.g., Desktop, iPhone 14, iPad Pro)
- **User Role**: [Student/Teacher/Admin/IB/PIC] (if applicable)
- **URL/Route**: [Specific page or API endpoint where bug occurs]

**Steps to Reproduce:**
1. [Step 1 - What was the first action taken?]
2. [Step 2 - What happened next?]
3. [Step 3 - What was the last action before the bug appeared?]
4. [Continue with additional steps if needed]

**Example:**
1. Navigate to `/login` page
2. Enter valid IC number: `051003060229`
3. Enter valid password: `123456`
4. Click "Log Masuk" button
5. Error message appears: "Invalid credentials"

**Expected Behavior:**
[What should happen when following the steps]
- Example: "User should be successfully logged in and redirected to dashboard"

**Actual Behavior:**
[What actually happens]
- Example: "Error message 'Invalid credentials' appears, user remains on login page"

**Screenshots/Logs:**
[Attach screenshots or error logs]
- Screenshot of the error (if visual bug)
- Browser console errors (F12 → Console)
- Network tab errors (F12 → Network)
- Backend logs (if available)
- Error message text (copy exact text)

**Additional Context:**
[Any other relevant information]
- Does this happen consistently or intermittently?
- When did this first occur?
- Did it work before? If so, what changed?
- Any error codes or IDs?
- Related issues or pull requests?
- Workaround (if any)

---

#### Pull Request Template

**Use this template when creating pull requests to ensure all necessary information is included:**

**Title:** [Type(Scope)]: Brief description
- Example: `feat(auth): add password reset functionality`
- Example: `fix(students): resolve IC validation error`
- Example: `docs(api): update authentication endpoints documentation`

**Description:**
- **What**: [What changes were made? Describe the changes clearly]
- **Why**: [Why were these changes needed? What problem do they solve?]
- **How**: [How do these changes work? Briefly explain the implementation]
- **Impact**: [What is the impact of these changes? Who is affected?]

**Type of Change:**
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Code refactoring (no functional changes)
- [ ] Performance improvement
- [ ] Security fix

**Related Issues:**
- Closes #[issue-number]
- Fixes #[issue-number]
- Related to #[issue-number]

**Changes Made:**
- [List of changes made]
- Example:
  - Added password reset API endpoint (`POST /api/auth/password-reset`)
  - Added email service integration for sending reset codes
  - Added password reset form component
  - Updated authentication controller to handle reset requests

**Testing:**
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed
- [ ] Tested in development environment
- [ ] Tested in staging environment (if applicable)

**How to Test:**
1. [Step 1 - How to test the changes]
2. [Step 2 - What to verify]
3. [Step 3 - Expected results]

**Example:**
1. Navigate to `/login` page
2. Click "Lupa Kata Laluan?" link
3. Enter IC number and email
4. Verify reset code is received via email
5. Enter reset code and new password
6. Verify password is changed and user can login

**Screenshots (if applicable):**
[Attach screenshots of UI changes, before/after comparisons, etc.]

**Checklist:**
- [ ] Code follows project coding standards
- [ ] Code is properly formatted
- [ ] Functions have documentation (JSDoc comments)
- [ ] Error handling is implemented
- [ ] Tests are included and passing
- [ ] No security vulnerabilities
- [ ] Performance is acceptable
- [ ] Documentation is updated (README, API docs, etc.)
- [ ] No console.log statements in production code
- [ ] No commented-out code
- [ ] Reviewed my own code before submitting

---

#### Commit Message Template

**Use this template for commit messages following Conventional Commits format:**

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code refactoring (no functional changes)
- `test`: Test additions/changes
- `chore`: Maintenance tasks (dependencies, build, etc.)
- `perf`: Performance improvements
- `ci`: CI/CD changes
- `build`: Build system changes

**Scopes:**
- `auth`: Authentication/authorization
- `students`: Student management
- `teachers`: Teacher management
- `classes`: Class management
- `attendance`: Attendance tracking
- `fees`: Fee management
- `exams`: Exam management
- `results`: Results management
- `api`: API changes
- `ui`: UI/components
- `db`: Database changes
- `config`: Configuration changes
- `security`: Security changes

**Examples:**

**Feature:**
```
feat(auth): add password reset functionality

Implement password reset flow with email verification.
Users can request password reset via IC number and email.
Reset codes are sent via email service.
Password can be reset using reset code.

Closes #123
```

**Bug Fix:**
```
fix(students): resolve IC validation error for hyphens

Fixed IC validation to accept formats with and without hyphens.
Normalization function now handles both formats correctly.
Updated validation middleware to use normalized format.

Fixes #456
```

**Documentation:**
```
docs(api): update authentication endpoints documentation

Added examples for login, register, and password reset endpoints.
Included request/response formats and error codes.
Updated API documentation with new endpoints.

Related to #789
```

**Refactoring:**
```
refactor(students): extract IC normalization to utility function

Moved IC normalization logic from controller to utility function.
Created normalizeICForQuery function in utils/icUtils.js.
Updated all controllers to use new utility function.

Improves code reusability and maintainability.
```

---

#### Feature Request Template

**Use this template when requesting new features:**

**Feature Title:** [Clear, concise feature name]
- Example: "Monthly Fee Auto-Generation"
- Example: "Student Attendance SMS Notifications"

**Description:**
[Detailed description of the feature. What should it do? What problem does it solve?]

**Example:**
The system should automatically generate monthly fees for all active students on the first day of each month. This will eliminate the need for manual fee entry and ensure all students are billed correctly.

**Use Case:**
[Who will use this feature? What scenario will it support?]
- Example: Admin users will use this feature to automatically generate fees for all students each month, reducing manual work and ensuring consistency.

**User Story:**
As a [user type], I want to [action] so that [benefit].
- Example: As an admin, I want the system to automatically generate monthly fees so that I don't have to manually create fees for each student.

**Requirements:**
- [Requirement 1]
- [Requirement 2]
- [Requirement 3]

**Example:**
- System should generate fees on the 1st of each month
- Fees should be generated for all active students
- Admin should be able to configure fee amounts per class
- Admin should be notified when fees are generated
- Admin should be able to manually trigger fee generation if needed

**Acceptance Criteria:**
- [ ] [Criterion 1 - What must be true for this feature to be considered complete?]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

**Example:**
- [ ] Fees are automatically generated on the 1st of each month at 12:00 AM
- [ ] All active students receive fee records
- [ ] Admin receives email notification with generation summary
- [ ] Admin can view generated fees in the fee management page
- [ ] Admin can manually trigger fee generation from admin dashboard

**Mockups/Wireframes (if applicable):**
[Attach mockups, wireframes, or screenshots showing the expected UI]

**Priority:**
- [ ] Critical - Blocks other work
- [ ] High - Important feature, should be implemented soon
- [ ] Medium - Nice to have, can wait
- [ ] Low - Future consideration

**Related Issues:**
- Related to #[issue-number]
- Depends on #[issue-number]
- Blocks #[issue-number]

**Additional Notes:**
[Any other relevant information, constraints, dependencies, etc.]

---

#### Change Request Template

**Use this template when requesting changes to existing functionality:**

**Change Title:** [Clear, concise change name]
- Example: "Modify Fee Payment Flow to Support Partial Payments"
- Example: "Update Student Registration to Require Email"

**Description:**
[What needs to be changed? What is the current behavior? What should the new behavior be?]

**Current Behavior:**
[How does the system currently work?]
- Example: Currently, students can only pay fees in full. If a student wants to pay RM 50 of a RM 150 fee, they must pay the full amount.

**Proposed Behavior:**
[How should the system work after the change?]
- Example: Students should be able to pay any amount up to the full fee amount. The system should track partial payments and show remaining balance.

**Reason for Change:**
[Why is this change needed? What problem does it solve?]
- Example: Students often cannot afford to pay full fees at once. Allowing partial payments will make the system more flexible and user-friendly.

**Impact Analysis:**
- **Affected Components**: [List components/features that will be affected]
  - Fee payment flow
  - Fee status calculation
  - Fee reports and outstanding balance display
- **Breaking Changes**: [Will this break existing functionality?]
  - No breaking changes expected
  - Backward compatible with existing full payment flow
- **Migration Required**: [Will data migration be needed?]
  - No data migration required
  - Existing fee records remain unchanged

**Requirements:**
- [Requirement 1]
- [Requirement 2]

**Example:**
- Payment form should allow entering custom amount (up to full fee)
- Fee status should update to "partial" when amount paid is less than total
- Outstanding balance should be calculated and displayed
- Payment history should show partial payment amounts

**Acceptance Criteria:**
- [ ] [Criterion 1]
- [ ] [Criterion 2]

**Example:**
- [ ] Students can enter custom payment amount in payment form
- [ ] System accepts payment amounts less than full fee
- [ ] Fee status updates to "partial" when applicable
- [ ] Outstanding balance is calculated correctly
- [ ] Payment history shows partial payment details

**Priority:**
- [ ] Critical - Blocks other work
- [ ] High - Important change, should be implemented soon
- [ ] Medium - Nice to have, can wait
- [ ] Low - Future consideration

**Related Issues:**
- Related to #[issue-number]
- Depends on #[issue-number]

**Additional Notes:**
[Any other relevant information, constraints, dependencies, etc.]

---

#### Code Review Comment Template

**Use this template when leaving code review comments:**

**Type:** [Suggestion/Question/Blocking Issue/Must Fix/Nice to Have]

**Location:** [File path and line number]
- Example: `backend/controllers/authController.js:45`

**Comment:**
[Your comment about the code]

**Example:**
Consider using a constant for the session duration instead of hardcoding the value. This makes it easier to change later if needed.

**Suggestion:**
[If applicable, suggest how to fix or improve]
```javascript
// Instead of:
const token = jwt.sign(payload, secret, { expiresIn: '24h' });

// Consider:
const SESSION_DURATION = '24h';
const token = jwt.sign(payload, secret, { expiresIn: SESSION_DURATION });
```

**Reference:**
[If applicable, link to coding standards, documentation, or related issues]
- See DEVELOPMENT_STANDARDS.md section 3.3 (Constants)

---

#### Release Notes Template

**Use this template when creating release notes:**

**Version:** [Version number]
- Example: `1.2.0`

**Release Date:** [Date]
- Example: `January 15, 2025`

**Release Type:**
- [ ] Major Release (breaking changes)
- [ ] Minor Release (new features, backward compatible)
- [ ] Patch Release (bug fixes)

**Summary:**
[Brief summary of the release - one or two sentences]

**Example:**
This release adds password reset functionality, improves fee management with partial payment support, and fixes several critical bugs in the attendance tracking system.

**New Features:**
- [Feature 1 with description]
- [Feature 2 with description]

**Example:**
- **Password Reset**: Users can now reset their passwords via email or SMS. Reset codes are sent to registered email or phone number.
- **Partial Fee Payments**: Students can now make partial payments for fees. The system tracks outstanding balances and updates fee status accordingly.
- **Enhanced Attendance Reports**: New attendance report features include monthly summaries, class-level statistics, and export functionality.

**Improvements:**
- [Improvement 1 with description]
- [Improvement 2 with description]

**Example:**
- Improved performance of student search functionality (50% faster)
- Enhanced UI responsiveness on mobile devices
- Better error messages for validation failures

**Bug Fixes:**
- [Bug fix 1 with description]
- [Bug fix 2 with description]

**Example:**
- Fixed IC validation error that rejected valid IC numbers with hyphens
- Resolved issue where attendance records were not saving correctly
- Fixed fee calculation error for students with multiple classes

**Security:**
- [Security fix or enhancement 1]
- [Security fix or enhancement 2]

**Example:**
- Enhanced password hashing security (increased bcrypt rounds)
- Fixed XSS vulnerability in announcement display
- Improved SQL injection protection in search queries

**Breaking Changes:**
- [Breaking change 1 with migration instructions]
- [Breaking change 2 with migration instructions]

**Example:**
- API endpoint `/api/students/search` now requires authentication (previously public)
- Database schema changes require running migration script: `npm run migrate`

**Deprecations:**
- [Deprecated feature 1 with removal date and migration path]
- [Deprecated feature 2 with removal date and migration path]

**Example:**
- Deprecated `/api/students/old-search` endpoint. Will be removed in version 2.0.0. Please use `/api/students/search` instead.

**Upgrade Instructions:**
[Step-by-step upgrade instructions if needed]

**Example:**
1. Backup database
2. Pull latest code: `git pull origin main`
3. Install dependencies: `npm install`
4. Run migrations: `npm run migrate`
5. Rebuild containers: `docker-compose build`
6. Restart services: `docker-compose up -d`

**Known Issues:**
- [Known issue 1]
- [Known issue 2]

**Example:**
- Fee generation may take longer than usual for large student databases (work in progress)
- Mobile UI may display incorrectly on iOS Safari versions below 15.0

**Credits:**
[Thank contributors, acknowledge help, etc.]

**Example:**
Thanks to the development team for their hard work on this release. Special thanks to [Name] for the password reset feature and [Name] for the partial payment implementation.

---

#### API Documentation Template

**Use this template when documenting API endpoints:**

**Endpoint:** [HTTP Method] [Endpoint Path]
- Example: `POST /api/auth/login`
- Example: `GET /api/students/:ic`

**Description:**
[What does this endpoint do?]

**Example:**
Authenticates a user with IC number and password. Returns a JWT token and user information upon successful authentication.

**Authentication:**
- [ ] Required
- [ ] Optional
- [ ] Not required

**Required Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}  (if authentication required)
```

**Request Parameters:**

**Path Parameters:**
- `parameter-name` (type) - [Description]
  - Example: `ic` (string) - Student IC number (12 digits, with or without hyphens)

**Query Parameters:**
- `parameter-name` (type, optional) - [Description]
  - Example: `page` (integer, optional) - Page number for pagination (default: 1)
  - Example: `limit` (integer, optional) - Number of items per page (default: 50, max: 1000)

**Request Body:**
```json
{
  "field1": "value1",
  "field2": "value2"
}
```

**Example:**
```json
{
  "icNumber": "051003060229",
  "password": "123456"
}
```

**Request Body Schema:**
- `field-name` (type, required/optional) - [Description]
  - Example: `icNumber` (string, required) - User IC number (12 digits)
  - Example: `password` (string, required) - User password (minimum 6 characters)

**Success Response:**

**Status Code:** [HTTP status code]
- Example: `200 OK`
- Example: `201 Created`

**Response Body:**
```json
{
  "success": true,
  "message": "Success message",
  "data": {
    "field1": "value1",
    "field2": "value2"
  }
}
```

**Example:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "ic": "051003060229",
      "nama": "Ahmad Zulkifli",
      "email": "ahmad@example.com",
      "role": "student"
    }
  }
}
```

**Error Responses:**

**Status Code:** [HTTP status code]
- Example: `400 Bad Request`
- Example: `401 Unauthorized`
- Example: `404 Not Found`
- Example: `500 Internal Server Error`

**Response Body:**
```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "field-name",
      "message": "Error message for this field"
    }
  ]
}
```

**Example:**
```json
{
  "success": false,
  "message": "Invalid credentials",
  "errors": []
}
```

**Example with Validation Errors:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "icNumber",
      "message": "IC number must be exactly 12 digits"
    },
    {
      "field": "password",
      "message": "Password must be at least 6 characters"
    }
  ]
}
```

**Example Requests:**

**cURL:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "icNumber": "051003060229",
    "password": "123456"
  }'
```

**JavaScript (Axios):**
```javascript
const response = await axios.post('/api/auth/login', {
  icNumber: '051003060229',
  password: '123456'
});
```

**Notes:**
[Any additional notes, warnings, limitations, etc.]

**Example:**
- Token expires after 24 hours. Use refresh token to obtain new access token.
- Rate limiting: 5 requests per 15 minutes per IP address.
- Password is hashed using bcrypt before storage.

**Related Endpoints:**
- [Related endpoint 1]
- [Related endpoint 2]

**Example:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/password-reset` - Reset password
- `GET /api/auth/profile` - Get user profile

### References to Standards

**Industry Standards:**

- **ISO/IEC 25010**: Software Quality Model
  - Defines quality characteristics for software systems
  - Covers functional suitability, performance, compatibility, usability, reliability, security, maintainability, and portability
  - Reference: https://www.iso.org/standard/35733.html

- **OWASP Top 10**: Web Application Security Risks
  - Lists the most critical web application security risks
  - Includes injection, broken authentication, sensitive data exposure, XML external entities (XXE), broken access control, security misconfiguration, XSS, insecure deserialization, using components with known vulnerabilities, and insufficient logging
  - Reference: https://owasp.org/www-project-top-ten/

- **Semantic Versioning (SemVer)**: Version numbering (semver.org)
  - Version format: MAJOR.MINOR.PATCH (e.g., 1.2.3)
  - MAJOR: Breaking changes, MINOR: New features (backward compatible), PATCH: Bug fixes (backward compatible)
  - Reference: https://semver.org/

- **Conventional Commits**: Commit message format
  - Format: `<type>(<scope>): <subject>`
  - Types: feat, fix, docs, style, refactor, test, chore, perf, ci
  - Makes commit history more readable and enables automated tools
  - Reference: https://www.conventionalcommits.org/

**Best Practices:**

- **SOLID Principles**: Object-oriented design
  - **S**ingle Responsibility: Each class/function should have one reason to change
  - **O**pen/Closed: Open for extension, closed for modification
  - **L**iskov Substitution: Derived classes must be substitutable for their base classes
  - **I**nterface Segregation: Clients should not depend on interfaces they don't use
  - **D**ependency Inversion: Depend on abstractions, not concretions
  - Reference: https://en.wikipedia.org/wiki/SOLID

- **DRY (Don't Repeat Yourself)**: Code reuse
  - Principle: Every piece of knowledge should have a single, unambiguous representation
  - Reduces duplication, makes maintenance easier
  - Reference: https://en.wikipedia.org/wiki/Don%27t_repeat_yourself

- **KISS (Keep It Simple, Stupid)**: Simplicity
  - Principle: Simplicity should be a key goal in design
  - Simple solutions are easier to understand, maintain, and debug
  - Reference: https://en.wikipedia.org/wiki/KISS_principle

- **YAGNI (You Aren't Gonna Need It)**: Avoid over-engineering
  - Principle: Don't add functionality until it's necessary
  - Prevents unnecessary complexity and technical debt
  - Reference: https://en.wikipedia.org/wiki/You_aren%27t_gonna_need_it

**Documentation:**

- **Markdown Guide**: markdownguide.org
  - Comprehensive guide to Markdown syntax
  - Used for documentation in MyMasjidApp (README.md, DEVELOPMENT_STANDARDS.md, etc.)
  - Reference: https://www.markdownguide.org/

- **JSDoc**: jsdoc.app
  - Documentation generator for JavaScript
  - Used for documenting JavaScript functions and classes
  - Reference: https://jsdoc.app/

- **React Documentation**: react.dev
  - Official React documentation and guides
  - Covers hooks, components, state management, and best practices
  - Reference: https://react.dev/

- **Node.js Best Practices**: github.com/goldbergyoni/nodebestpractices
  - Comprehensive collection of Node.js best practices
  - Covers project structure, error handling, security, performance, and testing
  - Reference: https://github.com/goldbergyoni/nodebestpractices

---

## Document Maintenance

**Version History:**
- **Version 1.0** - January 2025 - Initial version
  - Created comprehensive development standards manual
  - Included coding standards, version control, architecture, testing, deployment, security, maintenance, tools, roles, compliance
  - Added project-specific examples and explanations
  - Enhanced with detailed explanations and reasoning

**Review Schedule:**
- **Quarterly Reviews**: Review and update the manual every 3 months
- **After Major Changes**: Update after significant technology changes, architecture changes, or process changes
- **On-Demand Updates**: Update as standards evolve based on team feedback or new best practices
- **Team Feedback**: Collect feedback from developers, QA, and project managers
- **Continuous Improvement**: Regularly refine standards based on lessons learned

**Update Process:**
1. Identify areas that need updating (based on team feedback, technology changes, or new requirements)
2. Draft proposed changes (document the rationale for changes)
3. Review with team (discuss in team meetings or via pull request)
4. Get approval (consensus from team or approval from technical lead)
5. Update document (make changes and update version number)
6. Communicate changes (notify team of updates)

**Contact:**
- **Questions or Suggestions**: Contact the development team or technical lead
- **Propose Changes**: Create a pull request with proposed changes
- **Discuss Improvements**: Bring up in team meetings or create an issue
- **Clarifications**: Ask in team chat or create a discussion thread

**Distribution:**
- This manual is available to all developers working on MyMasjidApp
- New team members should read this manual as part of onboarding
- Manual should be easily accessible (version control, shared drive, wiki)
- Latest version should always be clearly marked

---

**End of Development Standards Manual**

**Last Updated**: January 2025  
**Version**: 1.0  
**Maintained By**: MyMasjidApp Development Team

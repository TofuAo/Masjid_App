# MyMasjidApp — Comprehensive Testing Strategy

This document provides a complete testing strategy for MyMasjidApp, including setup guides, templates, integration test plans, and a prioritized component list.

---

## Quick Start

```bash
# Backend: install deps and run tests
cd backend && npm install && npm test

# Frontend: install deps and run tests
npm install && npm run test:run
```

Test files and config are already in place. See sections below for details.

---

## 1. Framework Selection

| Layer | Framework | Rationale |
|-------|-----------|-----------|
| **Backend Unit** | Jest | Industry standard, ESM support, built-in mocking, fast |
| **Backend Integration** | Jest + supertest | Same runner, HTTP assertions, no extra tooling |
| **Frontend Unit** | Vitest + React Testing Library | Vite-native, fast, RTL best practices |
| **Frontend E2E** | Playwright (future) | Cross-browser, reliable, good DX |

---

## 2. Backend Setup (Jest)

### 2.1 Install Dependencies

```bash
cd backend
npm install --save-dev jest @jest/globals supertest
```

### 2.2 Jest Configuration

Create `backend/jest.config.js`:

```javascript
/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  transform: {},
  extensionsToTreatAsEsm: ['.js'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testMatch: ['**/__tests__/**/*.test.js', '**/__tests__/**/*.spec.js'],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'services/**/*.js',
    'middleware/**/*.js',
    'utils/**/*.js',
    '!**/node_modules/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  testTimeout: 10000,
};
```

### 2.3 Test Setup File

Create `backend/__tests__/setup.js`:

```javascript
// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = 'test_password';
process.env.DB_NAME = 'test_masjid_app';
```

### 2.4 Update package.json Scripts

Add to `backend/package.json`:

```json
{
  "scripts": {
    "test": "node --experimental-vm-modules node_modules/jest/bin/jest.js",
    "test:watch": "node --experimental-vm-modules node_modules/jest/bin/jest.js --watch",
    "test:coverage": "node --experimental-vm-modules node_modules/jest/bin/jest.js --coverage"
  }
}
```

---

## 3. Frontend Setup (Vitest + React Testing Library)

### 3.1 Install Dependencies

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### 3.2 Vitest Configuration

Add to `vite.config.js`:

```javascript
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// ... existing config

export default defineConfig({
  // ... existing
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
});
```

### 3.3 Test Setup File

Create `src/test/setup.js`:

```javascript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
```

### 3.4 Update package.json Scripts

Add to root `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## 4. Unit Test Templates

### 4.1 Backend Utility Template

**File:** `backend/__tests__/utils/icNormalizer.test.js`

```javascript
import { describe, it, expect } from '@jest/globals';
import { normalizeIC, isValidICFormat } from '../../utils/icNormalizer.js';

describe('icNormalizer', () => {
  describe('normalizeIC', () => {
    it('formats 12-digit IC with hyphens', () => {
      expect(normalizeIC('123456789012')).toBe('123456-78-9012');
    });
    it('returns null for empty input', () => {
      expect(normalizeIC('')).toBeNull();
      expect(normalizeIC(null)).toBeNull();
    });
    it('normalizes S-prefixed to uppercase', () => {
      expect(normalizeIC('s1234567')).toBe('S1234567');
    });
  });

  describe('isValidICFormat', () => {
    it('accepts valid 12-digit IC', () => {
      expect(isValidICFormat('123456789012')).toBe(true);
      expect(isValidICFormat('123456-78-9012')).toBe(true);
    });
    it('rejects invalid formats', () => {
      expect(isValidICFormat('T0123456')).toBe(false);
      expect(isValidICFormat('abc')).toBe(false);
    });
  });
});
```

### 4.2 Backend Service Template

**File:** `backend/__tests__/utils/safeQuery.test.js`

```javascript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { safeLimit, safeOffset, countPlaceholders, validateParams } from '../../utils/safeQuery.js';

describe('safeQuery', () => {
  describe('safeLimit', () => {
    it('returns default for null/empty', () => {
      expect(safeLimit(null)).toBe(50);
      expect(safeLimit('')).toBe(50);
    });
    it('clamps to max 200', () => {
      expect(safeLimit(500)).toBe(200);
    });
    it('clamps to min 1', () => {
      expect(safeLimit(0)).toBe(1);
    });
  });

  describe('validateParams', () => {
    it('rejects undefined in params', () => {
      const result = validateParams([1, undefined, 3]);
      expect(result.valid).toBe(false);
      expect(result.invalidIndex).toBe(1);
    });
  });
});
```

### 4.3 Backend Middleware Template (Auth)

**File:** `backend/__tests__/middleware/auth.test.js`

```javascript
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { requireRole } from '../../middleware/auth.js';

describe('requireRole', () => {
  let req, res, next;

  beforeEach(() => {
    req = { user: null };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('returns 401 when user is not authenticated', () => {
    const middleware = requireRole(['admin']);
    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next when user has required role', () => {
    req.user = { activeRole: 'admin', roles: ['admin'] };
    const middleware = requireRole(['admin']);
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 403 when user lacks required role', () => {
    req.user = { activeRole: 'student', roles: ['student'] };
    const middleware = requireRole(['admin']);
    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
```

### 4.4 Frontend Component Template

**File:** `src/components/__tests__/ProtectedRoute.test.jsx`

```javascript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';

const TestApp = ({ user, allowedRoles }) => (
  <MemoryRouter>
    <Routes>
      <Route path="/login" element={<div>Login Page</div>} />
      <Route path="/unauthorized" element={<div>Unauthorized</div>} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute user={user} allowedRoles={allowedRoles}>
            <div>Dashboard</div>
          </ProtectedRoute>
        }
      />
    </Routes>
  </MemoryRouter>
);

describe('ProtectedRoute', () => {
  it('redirects to login when user is null', () => {
    render(<TestApp user={null} allowedRoles={[]} />);
    // Navigate to dashboard
    // Expect redirect to login
  });

  it('renders children when user has allowed role', () => {
    const user = { ic: '123', role: 'admin', activeRole: 'admin' };
    render(<TestApp user={user} allowedRoles={['admin']} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('redirects to unauthorized when role not allowed', () => {
    const user = { ic: '123', role: 'student', activeRole: 'student' };
    render(<TestApp user={user} allowedRoles={['admin']} />);
    expect(screen.getByText('Unauthorized')).toBeInTheDocument();
  });
});
```

---

## 5. Integration Test Plan — RBAC & Authentication

### 5.1 Test Matrix

| Endpoint | Admin | PIC | IB | Staff | Teacher | Student |
|----------|-------|-----|-----|-------|---------|---------|
| `POST /api/auth/login` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `GET /api/auth/profile` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `GET /api/admins` | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ |
| `GET /api/ib/reports` | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ |
| `GET /api/students` | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| `GET /api/fees` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (own) |
| `POST /api/admin/classes/change` | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ |

### 5.2 Integration Test Structure

**File:** `backend/__tests__/integration/auth-rbac.test.js`

```javascript
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../server.js'; // Export app without listen

const ROLES = ['admin', 'pic', 'ib', 'staff', 'teacher', 'student'];

describe('Auth & RBAC Integration', () => {
  let adminToken, studentToken;

  beforeAll(async () => {
    // Login as admin (use test DB seed)
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ emailOrIc: 'admin@test.com', password: 'Test123!' });
    adminToken = adminRes.body?.token;
  });

  describe('POST /api/auth/login', () => {
    it('returns 400 for invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ emailOrIc: 'invalid', password: 'wrong' });
      expect(res.status).toBe(400);
    });

    it('returns token and user for valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ emailOrIc: 'admin@test.com', password: 'Test123!' });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
    });
  });

  describe('Protected routes', () => {
    it('GET /api/auth/profile returns 401 without token', async () => {
      const res = await request(app).get('/api/auth/profile');
      expect(res.status).toBe(401);
    });

    it('GET /api/admins returns 403 for student role', async () => {
      // Login as student, then request /api/admins
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ emailOrIc: 'student@test.com', password: 'Test123!' });
      const token = loginRes.body?.token;
      const res = await request(app)
        .get('/api/admins')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });
  });
});
```

### 5.3 Server Export for Testing

Ensure `backend/server.js` exports the Express app:

```javascript
// At end of server.js
export { app };
// Or: export default app;
```

---

## 6. Priority List — First 10 Critical Components

| # | Component/Function | Type | Rationale |
|---|-------------------|------|-----------|
| 1 | `authController.login` | Backend | Core auth flow; security-critical |
| 2 | `middleware/auth.authenticateToken` | Backend | Protects all routes; JWT validation |
| 3 | `middleware/auth.requireRole` | Backend | RBAC enforcement |
| 4 | `utils/icNormalizer` | Backend | Data integrity; used across registration, students |
| 5 | `utils/safeQuery` | Backend | Prevents SQL injection; DB safety |
| 6 | `utils/passwordPolicy` | Backend | Password strength validation |
| 7 | `services/paymentService` | Backend | Financial logic; high impact |
| 8 | `src/services/api` (auth helpers) | Frontend | Token handling, expiry, interceptors |
| 9 | `ProtectedRoute` | Frontend | Route-level RBAC |
| 10 | `getEffectiveRole` (userRoles) | Frontend | Role resolution for UI |

---

## 7. Test Execution Order

1. **Week 1:** Backend utils (`icNormalizer`, `safeQuery`, `passwordPolicy`)
2. **Week 2:** Auth middleware and `requireRole`
3. **Week 3:** Auth controller (login, register)
4. **Week 4:** Integration tests for RBAC
5. **Week 5:** Frontend `api.js` and `ProtectedRoute`
6. **Week 6:** Payment service (with mocks)

---

## 8. Coverage Targets

| Layer | Target | Rationale |
|-------|--------|-----------|
| Backend utils | 90% | Pure logic, easy to test |
| Backend middleware | 80% | Auth/RBAC critical |
| Backend controllers | 60% | Integration-heavy |
| Frontend components | 50% | Start with critical paths |

---

## 9. CI Integration

Tests run in GitHub Actions on every PR. See `.github/workflows/ci-cd.yml` for the full pipeline.

```yaml
# Backend tests
- name: Run backend tests
  run: npm test
  working-directory: ./backend

# Frontend tests
- name: Run frontend tests
  run: npm run test:run
```

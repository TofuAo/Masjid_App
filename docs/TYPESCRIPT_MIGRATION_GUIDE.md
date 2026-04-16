# MyMasjidApp — TypeScript Migration Guide

This guide enables an **incremental** migration from JavaScript to TypeScript, allowing JS and TS to coexist. No big-bang rewrite required.

---

## 1. Step-by-Step Migration Process

### Phase A: Setup (One-time)

1. Install TypeScript and type definitions.
2. Add `tsconfig.json` with `allowJs: true`.
3. Add a `// @ts-check` or convert one file to `.ts` to validate setup.

### Phase B: Incremental Conversion

1. **Start with leaf modules** (no dependencies on other app code): utils, types, constants.
2. **Then API layer**: `api.js` → `api.ts` (used everywhere).
3. **Then components**: Start with presentational components, then containers.
4. **Finally pages**: Convert one page at a time.

### Phase C: Stricter Mode

1. Enable `noImplicitAny` in `tsconfig.json`.
2. Fix new errors file-by-file.
3. Optionally enable `strict: true` for new code only.

---

## 2. Installation

### Frontend (Vite + React)

```bash
npm install --save-dev typescript @types/react @types/react-dom @types/node
```

You already have `@types/react` and `@types/react-dom` in devDependencies.

### Backend (optional, for future)

```bash
cd backend
npm install --save-dev typescript @types/node @types/express
```

---

## 3. tsconfig.json (Production-Grade)

### Root `tsconfig.json` (Frontend)

Create at project root:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "allowJs": true,
    "checkJs": false,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### `tsconfig.node.json` (Vite config)

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.js"]
}
```

### Update `vite.config.js` for path alias

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // ... rest
});
```

---

## 4. Example: Converting a Complex Data-Fetching Component

### Before: `Dashboard.jsx` (JavaScript)

```jsx
import React, { useState, useEffect, useCallback } from 'react';
import { studentsAPI, teachersAPI, classesAPI, feesAPI } from '../services/api';

const Dashboard = () => {
  const [mainStats, setMainStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [students, teachers, classes, fees] = await Promise.all([
        studentsAPI.getAll({ limit: 1000 }),
        teachersAPI.getAll({ limit: 1000 }),
        classesAPI.getAll({ limit: 1000 }),
        feesAPI.getAll({ limit: 1000 }),
      ]);
      // ... process data
    } catch (err) {
      setError(err?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorDisplay message={error} />;
  return <div>...</div>;
};
```

### After: `Dashboard.tsx` (TypeScript)

**Step 1: Create shared types** (`src/types/dashboard.ts`)

```typescript
export interface User {
  ic: string;
  nama?: string;
  email?: string;
  role: string;
  activeRole?: string;
  roles?: string[];
}

export interface Student {
  user_ic: string;
  nama: string;
  kelas_id?: number;
  [key: string]: unknown;
}

export interface Class {
  id: number;
  nama: string;
  [key: string]: unknown;
}

export interface Fee {
  id: number;
  student_ic: string;
  jumlah: number;
  status?: string;
  [key: string]: unknown;
}

export interface DashboardStats {
  label: string;
  value: number | string;
  icon?: string;
}
```

**Step 2: Convert the component** (`src/pages/Dashboard.tsx`)

```tsx
import React, { useState, useEffect, useCallback } from 'react';
import { studentsAPI, teachersAPI, classesAPI, feesAPI } from '../services/api';
import type { User, Student, Class, Fee, DashboardStats } from '../types/dashboard';

const Dashboard: React.FC = () => {
  const [mainStats, setMainStats] = useState<DashboardStats[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const [studentsRes, teachersRes, classesRes, feesRes] = await Promise.allSettled([
        studentsAPI.getAll({ limit: 1000 }),
        teachersAPI.getAll({ limit: 1000 }),
        classesAPI.getAll({ limit: 1000 }),
        feesAPI.getAll({ limit: 1000 }),
      ]);

      const students: Student[] = studentsRes.status === 'fulfilled'
        ? (Array.isArray(studentsRes.value) ? studentsRes.value : studentsRes.value?.data ?? [])
        : [];
      const teachers = teachersRes.status === 'fulfilled'
        ? (Array.isArray(teachersRes.value) ? teachersRes.value : teachersRes.value?.data ?? [])
        : [];
      const classes: Class[] = classesRes.status === 'fulfilled'
        ? (Array.isArray(classesRes.value) ? classesRes.value : classesRes.value?.data ?? [])
        : [];
      const fees: Fee[] = feesRes.status === 'fulfilled'
        ? (Array.isArray(feesRes.value) ? feesRes.value : feesRes.value?.data ?? [])
        : [];

      // Build stats with proper typing
      const stats: DashboardStats[] = [
        { label: 'Pelajar', value: students.length },
        { label: 'Guru', value: teachers.length },
        { label: 'Kelas', value: classes.length },
        { label: 'Yuran', value: fees.length },
      ];
      setMainStats(stats);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorDisplay message={error} />;
  return <div>{/* ... */}</div>;
};

export default Dashboard;
```

**Step 3: Update `api.js` types** (optional but recommended)

Create `src/types/api.d.ts`:

```typescript
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: { page: number; limit: number; total: number };
}

export interface LoginCredentials {
  emailOrIc: string;
  password: string;
}

export interface User {
  ic: string;
  nama?: string;
  email?: string;
  role: string;
  activeRole?: string;
  roles?: string[];
}
```

---

## 5. Converting `api.js` to `api.ts`

The API module is central. Here's a minimal typed version:

```typescript
// src/services/api.ts
import axios, { AxiosInstance, AxiosError } from 'axios';
import resolveApiBaseUrl from '../utils/apiBaseUrl';

const TOKEN_EXPIRY_KEY = 'authTokenExpiry';

const removeStoredAuth = (): void => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
};

const isTokenExpired = (): boolean => {
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  const expiryNum = expiry ? Number(expiry) : null;
  return typeof expiryNum === 'number' && !Number.isNaN(expiryNum) && Date.now() > expiryNum;
};

const api: AxiosInstance = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    if (isTokenExpired()) {
      removeStoredAuth();
      return Promise.reject({ message: 'Session expired', status: 401 });
    }
    const token = localStorage.getItem('authToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError) => {
    const status = error.response?.status;
    const data = error.response?.data as { message?: string } | undefined;
    return Promise.reject({
      message: data?.message || error.message || 'An error occurred',
      status,
      response: error.response,
    });
  }
);

// Typed API modules
export const authAPI = {
  login: (credentials: { emailOrIc: string; password: string }) =>
    api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
  // ... rest
};

export default api;
```

---

## 6. Migration Order (Recommended)

| Order | File | Reason |
|-------|------|--------|
| 1 | `src/types/*.d.ts` | Shared types, no runtime |
| 2 | `src/utils/userRoles.js` → `.ts` | Small, pure utility |
| 3 | `src/config/routeAccess.js` → `.ts` | Config |
| 4 | `src/services/api.js` → `.ts` | Central API layer |
| 5 | `src/components/ProtectedRoute.jsx` → `.tsx` | Small, high impact |
| 6 | `src/components/ui/Button.jsx` → `.tsx` | Reusable |
| 7 | `src/pages/Login.jsx` → `.tsx` | Auth flow |
| 8 | `src/pages/Dashboard.jsx` → `.tsx` | Complex data-fetching |

---

## 7. Handling Mixed JS/TS

- **Allow JS**: `allowJs: true` lets `.js` files import `.ts` and vice versa.
- **Check JS gradually**: Add `// @ts-check` at top of critical `.js` files for early feedback.
- **Rename**: Change `.js` → `.ts` or `.jsx` → `.tsx` when ready; update imports in one step.

---

## 8. Common Pitfalls

| Issue | Solution |
|-------|----------|
| `Cannot find module` | Add `"moduleResolution": "bundler"` or `"node"` |
| `any` everywhere | Define interfaces; use `unknown` when type is unknown |
| Third-party lib has no types | Add `@types/package-name` or `declare module 'package-name'` |
| Vite build fails | Ensure `tsconfig` paths match `vite.config` alias |

---

## 9. Verification

After conversion:

```bash
# Type-check without building
npx tsc --noEmit

# Build (Vite uses esbuild for TS)
npm run build
```

---

## 10. Summary

1. Add `tsconfig.json` with `allowJs: true`.
2. Create `src/types/` for shared interfaces.
3. Convert `api.js` → `api.ts` first.
4. Convert one component at a time.
5. Run `tsc --noEmit` regularly.
6. Enable `strict` and `noImplicitAny` once most critical paths are typed.

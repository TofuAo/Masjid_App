# MyMasjidApp — 12-Week Technical Roadmap

Based on a project maturity score of **6.5/10**, this roadmap is divided into three phases to systematically improve stability, refinement, and scale.

---

## Overview

| Phase | Focus | Duration | Key Outcomes |
|-------|-------|----------|--------------|
| **Phase 1** | Stability | Weeks 1–4 | Automated testing, CI/CD, quality gates |
| **Phase 2** | Refinement | Weeks 5–8 | TypeScript migration, documentation fixes |
| **Phase 3** | Scale | Weeks 9–12 | Monitoring, logging, performance optimization |

---

## Phase 1: Stability (Weeks 1–4)

**Goal:** Establish automated testing and CI/CD so changes are validated before deployment.

### Week 1: Testing Foundation

| Milestone | Tasks | Deliverables |
|-----------|-------|--------------|
| **M1.1** Backend Jest setup | Install Jest, configure for ESM, add `jest.config.js` | `backend/jest.config.js`, `backend/__tests__/setup.js` |
| **M1.2** First unit tests | Test `icNormalizer`, `safeQuery`, `passwordPolicy` | 3 test files, ~15 tests |
| **M1.3** Frontend Vitest setup | Install Vitest, RTL, configure `vite.config.js` | `src/test/setup.js`, test scripts in package.json |
| **M1.4** Fix Docker vllm-api | Remove or make vllm-api optional in docker-compose | `docker-compose.yml` builds without errors |

**Success criteria:** `npm test` in backend passes; `npm run test:run` in frontend passes.

### Week 2: Auth & RBAC Tests

| Milestone | Tasks | Deliverables |
|-----------|-------|--------------|
| **M2.1** Auth middleware tests | Unit tests for `authenticateToken`, `requireRole`, `requirePermission` | `backend/__tests__/middleware/auth.test.js` |
| **M2.2** Auth controller tests | Unit tests for login, register (with mocks) | `backend/__tests__/controllers/auth.test.js` |
| **M2.3** ProtectedRoute tests | RTL tests for role-based redirects | `src/components/__tests__/ProtectedRoute.test.jsx` |
| **M2.4** Integration test scaffold | Supertest setup, first auth integration test | `backend/__tests__/integration/auth.test.js` |

**Success criteria:** Auth flow covered by unit + 1 integration test.

### Week 3: CI Pipeline

| Milestone | Tasks | Deliverables |
|-----------|-------|--------------|
| **M3.1** GitHub Actions workflow | Lint, test (backend + frontend), build on PR | `.github/workflows/ci-cd.yml` |
| **M3.2** npm audit in CI | Run `npm audit` and fail on high/critical | Same workflow |
| **M3.3** Backend lint script | Add ESLint to backend, fix critical issues | `backend/.eslintrc.js`, `npm run lint` |
| **M3.4** PR quality gate | Require CI pass before merge | Branch protection rules |

**Success criteria:** Every PR triggers CI; merge blocked if tests fail.

### Week 4: CD & Staging

| Milestone | Tasks | Deliverables |
|-----------|-------|--------------|
| **M4.1** Docker build on main | Build backend + frontend images on push to main | CI workflow update |
| **M4.2** Staging deployment job | Manual workflow_dispatch for staging deploy | `.github/workflows/deploy-staging.yml` |
| **M4.3** QUICK_START.md | Recreate quick start guide | `docs/QUICK_START.md` |
| **M4.4** DEPLOYMENT_GUIDE.md | Document deployment steps | `docs/DEPLOYMENT_GUIDE.md` |

**Success criteria:** Staging can be deployed manually; docs are complete.

---

## Phase 2: Refinement (Weeks 5–8)

**Goal:** Improve code quality with TypeScript and fix broken documentation.

### Week 5: TypeScript Setup

| Milestone | Tasks | Deliverables |
|-----------|-------|--------------|
| **M5.1** Backend tsconfig | Add `tsconfig.json` with allowJs | `backend/tsconfig.json` |
| **M5.2** Frontend tsconfig | Add `tsconfig.json` for Vite + React | `tsconfig.json` (root) |
| **M5.3** First TS file (api.js) | Convert `src/services/api.js` → `api.ts` | `src/services/api.ts` |
| **M5.4** Type definitions | Create `src/types/api.d.ts`, `User`, `ApiResponse` | `src/types/` |

**Success criteria:** `api.ts` compiles; existing JS still works (incremental).

### Week 6: TypeScript Migration (Core)

| Milestone | Tasks | Deliverables |
|-----------|-------|--------------|
| **M6.1** Convert userRoles | `src/utils/userRoles.js` → `.ts` | Typed role helpers |
| **M6.2** Convert routeAccess | `src/config/routeAccess.js` → `.ts` | Typed route config |
| **M6.3** Convert ProtectedRoute | `ProtectedRoute.jsx` → `.tsx` | Typed props |
| **M6.4** Convert 2–3 API modules | e.g. `authAPI`, `studentsAPI` | Typed API layer |

**Success criteria:** Core auth/routing paths are TypeScript.

### Week 7: Documentation Fixes

| Milestone | Tasks | Deliverables |
|-----------|-------|--------------|
| **M7.1** Fix README links | Remove references to deleted docs; add valid links | `README.md` |
| **M7.2** OpenAPI spec | Add swagger-jsdoc, document 10 key endpoints | `backend/openapi.yaml` or inline JSDoc |
| **M7.3** CHANGELOG | Create CHANGELOG.md, add recent entries | `CHANGELOG.md` |
| **M7.4** REQUIREMENTS.md | Document functional + non-functional requirements | `docs/REQUIREMENTS.md` |

**Success criteria:** No broken doc links; API documented.

### Week 8: TypeScript Migration (Pages)

| Milestone | Tasks | Deliverables |
|-----------|-------|--------------|
| **M8.1** Convert Dashboard | `Dashboard.jsx` → `Dashboard.tsx` | Example data-fetching component |
| **M8.2** Convert Login | `Login.jsx` → `Login.tsx` | Typed form handling |
| **M8.3** Convert 2–3 more pages | e.g. Yuran, Kehadiran | Gradual migration |
| **M8.4** Strict mode prep | Fix `noImplicitAny` issues in converted files | Fewer `any` types |

**Success criteria:** 5+ pages/components in TypeScript.

---

## Phase 3: Scale (Weeks 9–12)

**Goal:** Add observability, structured logging, and performance optimization.

### Week 9: Logging

| Milestone | Tasks | Deliverables |
|-----------|-------|--------------|
| **M9.1** Winston setup | Install Winston, JSON format for production | `backend/utils/logger.js` |
| **M9.2** Replace console.log | Use logger in auth, payment, error handler | Consistent logging |
| **M9.3** Request ID middleware | Add `x-request-id` to requests | Trace requests |
| **M9.4** Log levels | Use info/warn/error appropriately | Configurable levels |

**Success criteria:** All backend logs go through Winston.

### Week 10: Health & Monitoring

| Milestone | Tasks | Deliverables |
|-----------|-------|--------------|
| **M10.1** Health endpoint | `GET /api/health` (DB, disk, uptime) | `backend/routes/health.js` |
| **M10.2** Docker healthcheck | Use `/api/health` in backend Dockerfile | `backend/Dockerfile` |
| **M10.3** SECURITY.md | Document incident response, vulnerability reporting | `docs/SECURITY.md` |
| **M10.4** Backup/recovery doc | Document backup schedule and restore steps | `docs/BACKUP_RECOVERY.md` |

**Success criteria:** Health endpoint returns 200 when system is healthy.

### Week 11: Performance

| Milestone | Tasks | Deliverables |
|-----------|-------|--------------|
| **M11.1** DB query audit | Identify N+1, missing indexes | Audit report |
| **M11.2** Add indexes | Index frequently queried columns | Migration file |
| **M11.3** Frontend bundle analysis | Run `vite build --mode analyze` (if plugin added) | Bundle report |
| **M11.4** Cache settings | Add cache headers for static assets in Nginx | `nginx/nginx.conf` |

**Success criteria:** Critical queries use indexes; bundle size documented.

### Week 12: Polish & Handoff

| Milestone | Tasks | Deliverables |
|-----------|-------|--------------|
| **M12.1** ROADMAP.md | Document this roadmap and future phases | `docs/ROADMAP.md` |
| **M12.2** Run full test suite | Ensure all tests pass | Green CI |
| **M12.3** Dependency audit | `npm audit fix`, update critical deps | Updated lockfiles |
| **M12.4** Maturity re-assessment | Re-score project (target: 7.5+) | Updated audit |

**Success criteria:** Project maturity ≥ 7.5; roadmap documented.

---

## Gantt Summary

```
Week  1  2  3  4  5  6  7  8  9  10 11 12
Phase 1  ████████████████
Phase 2           ████████████████
Phase 3                      ████████████████

Testing  ████████
CI/CD         ████████
TypeScript         ████████████
Docs                   ████
Logging                         ████
Health/Monitor                      ████
Performance                            ████
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|-------------|
| TypeScript breaks build | Incremental migration; allowJs; convert one file at a time |
| Tests slow down PRs | Run in parallel; cache node_modules; limit integration tests |
| Staging env differs from prod | Use same Docker images; document env differences |
| Scope creep | Stick to milestones; defer non-critical items to post-Week 12 |

---

## Post-Roadmap (Future)

- E2E tests with Playwright
- API versioning (`/api/v1/`)
- Multi-tenancy exploration
- PWA / mobile app

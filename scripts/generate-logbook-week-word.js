/**
 * Generates Word logbooks for all 24 weeks of the internship period, matching the UMP
 * Industrial Training Log Book layout: cover, LOG BOOK CONTENTS, DAILY TRAINING LOG,
 * blank form with Marks box, WEEKLY SUMMARY & ASSESSMENT.
 * Reads content from LOG_BOOK_FULL.md. Output: Logbookweek1.docx ... Logbookweek24.docx
 * Usage: node scripts/generate-logbook-week-word.js
 */

import { writeFileSync, readFileSync, existsSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  PageBreak,
  BorderStyle,
  ImageRun,
} from 'docx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const logbookDir = join(rootDir, 'logbook');
const coverImagePath = join(logbookDir, 'LOG BOOK INDUSTRIAL TRAINING.jpg');
const logoImagePath = join(logbookDir, 'UMPSA LOGO.png');

function createCoverImage() {
  if (!existsSync(coverImagePath)) return null;
  try {
    return new ImageRun({
      type: 'jpg',
      data: readFileSync(coverImagePath),
      transformation: { width: 520, height: 720 },
    });
  } catch {
    return null;
  }
}

function createLogoImage() {
  if (!existsSync(logoImagePath)) return null;
  try {
    return new ImageRun({
      type: 'png',
      data: readFileSync(logoImagePath),
      transformation: { width: 180, height: 180 },
    });
  } catch {
    return null;
  }
}

const thinBorder = {
  top: { style: BorderStyle.SINGLE, size: 6 },
  bottom: { style: BorderStyle.SINGLE, size: 6 },
  left: { style: BorderStyle.SINGLE, size: 6 },
  right: { style: BorderStyle.SINGLE, size: 6 },
};

/** Look for LOG_BOOK.md first, then LOG_BOOK_FULL.md (project root, logbook/, docs/). Word logbooks are always generated from LOG_BOOK.md when it exists. */
function resolveLogbookFullPath() {
  const candidates = [
    join(rootDir, 'LOG_BOOK.md'),
    join(rootDir, 'logbook', 'LOG_BOOK.md'),
    join(rootDir, 'docs', 'LOG_BOOK.md'),
    join(rootDir, 'LOG_BOOK_FULL.md'),
    join(rootDir, 'logbook', 'LOG_BOOK_FULL.md'),
    join(rootDir, 'docs', 'LOG_BOOK_FULL.md'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return join(rootDir, 'LOG_BOOK.md'); // default path for message/consistency
}
const LOG_BOOK_FULL_PATH = resolveLogbookFullPath();
const USING_LOG_BOOK_MD = LOG_BOOK_FULL_PATH.endsWith('LOG_BOOK.md');

/** Training period: 17 September 2025 – 6 March 2026 (24 weeks). Weeks run Wed–Tue; Week 24 ends Friday 6 March. */
const TRAINING_START = '17/9/2025';
const TRAINING_END = '6/3/2026';
const NUM_WEEKS = 24;

/** Weekly summary content (work experience, what I learned, how it relates) derived from each week's logbook entries. */
const WEEKLY_SUMMARIES = {
  4: {
    workExperience: [
      'Analyzed existing student management and database schema; planned student CRUD implementation.',
      'Implemented student CREATE (registration form), READ (list and detail), with IC and phone validation.',
      'Implemented student UPDATE and DELETE; added search, filtering, and batch import.',
    ],
    whatDidILearn: [
      'How to map existing codebase structure and design data flows for a new module.',
      'Malaysian IC number normalization and client/server validation patterns.',
      'Transaction-based batch processing and cascade rules for data integrity.',
    ],
    howDoesThisRelate: [
      'Builds on database and programming fundamentals from coursework; applied CRUD design from software engineering.',
      'Validation techniques extend what I learned in web development and data structures.',
    ],
  },
  5: {
    workExperience: [
      'Optimized student-related database schema, indexing, and migrations; tested on dev first.',
      'Developed reusable UI components (Card, Button, Badge) and TailwindCSS responsive forms.',
      'Analyzed teacher management requirements and designed schema; set up teacher controller and API routes.',
    ],
    whatDidILearn: [
      'Safe migration practices and backup procedures before schema changes.',
      'Building a small component library for consistent UI and error boundaries.',
      'Entity-relationship design for teacher–class workflows.',
    ],
    howDoesThisRelate: [
      'Database indexing and normalization connect to DBMS and algorithm efficiency from studies.',
      'UI components and Tailwind align with front-end and human–computer interaction topics.',
    ],
  },
  6: {
    workExperience: [
      'Implemented teacher CRUD, profile management, search and filtering.',
      'Built class management interface: class creation, teacher assignment, levels (ASAS, PERTENGAHAN, LANJUTAN, TALAQQI), schedule (ISNIN & RABU, etc.).',
      'Implemented teacher–class assignment, enrollment tracking, and JWT-based auth with role-based access (Admin, Teacher, Student).',
      'Added password reset, session management, and auth middleware.',
    ],
    whatDidILearn: [
      'Managing many-to-many relationships and schedule validation in a real system.',
      'JWT-based authentication flow and protected routes for different roles.',
      'Secure token generation and one-time use for password reset.',
    ],
    howDoesThisRelate: [
      'Relational database and transaction handling from DBMS course applied to teacher–class–student model.',
      'Security and authentication concepts from networking and software security courses applied in practice.',
    ],
  },
  7: {
    workExperience: [
      'Designed attendance schema and API; built attendance marking interface and daily tracking (hadir, lewat, tidak hadir).',
      'Integrated Google Forms for attendance input; built webhook handler and statistics.',
      'Analyzed fee management, designed fee collection and tracking; set up fee API and controller; added fee reporting and outstanding balance.',
      'RESTful API endpoints for attendance and fees; standardized responses and testing.',
    ],
    whatDidILearn: [
      'Attendance workflow design and concurrent entry handling with validation.',
      'External integration (Google Forms) and data mapping for real-world input.',
      'Fee payment workflow and API consistency and error-handling patterns.',
    ],
    howDoesThisRelate: [
      'API design and REST principles from web development and distributed systems.',
      'Integration and data flow match software engineering and system design concepts.',
    ],
  },
  8: {
    workExperience: [
      'Fee reporting, outstanding balance tracking, and RESTful APIs for attendance and fee management.',
      'Standardized API response format, error handling, and documentation; comprehensive module testing.',
    ],
    whatDidILearn: [
      'Keeping API responses consistent and handling errors gracefully across modules.',
      'Writing test scripts and validating end-to-end behaviour for each module.',
    ],
    howDoesThisRelate: [
      'Extends Week 4–7 CRUD and API work; applies software testing and API design from coursework.',
    ],
  },
  9: {
    workExperience: [
      'Continued development and testing of core modules (students, teachers, classes, attendance, fees) toward production readiness.',
    ],
    whatDidILearn: [
      'Integrating multiple modules and ensuring they work together without regression.',
    ],
    howDoesThisRelate: [
      'Builds on full-stack skills from earlier weeks and system integration from software engineering.',
    ],
  },
  10: {
    workExperience: [
      'Further development of payment integration, exam/result modules, and cross-module testing.',
    ],
    whatDidILearn: [
      'Payment gateway integration and exam/result data modelling in a multi-role system.',
    ],
    howDoesThisRelate: [
      'Connects fee and assessment logic from earlier weeks to payment and reporting features.',
    ],
  },
  11: {
    workExperience: [
      'Finalized core modules; prepared for IB, PIC, and advanced features in subsequent weeks.',
    ],
    whatDidILearn: [
      'Preparing codebase and documentation for handover to more advanced role-based features.',
    ],
    howDoesThisRelate: [
      'Bridges foundation work (Weeks 4–10) with role-based and governance features to come.',
    ],
  },
  12: {
    workExperience: [
      'Implemented IB payment confirmation workflow (approve/reject) with audit trail and status sync.',
      'Strengthened fee and payment reconciliation for IB; added IB reports (confirmed payments, fee collection summary).',
      'Refined IB Account page and route guards so only IB role accesses IB Dashboard and IB Account; tested with different role combinations.',
    ],
    whatDidILearn: [
      'Keeping fee balance and payment status in sync using transactions and status checks to prevent double confirmation.',
      'Unifying payment status and reports across gateway and manual IB confirmations.',
      'RouteGuard and role-based redirect (e.g. IB users land on IB Dashboard) and handling users with multiple roles.',
    ],
    howDoesThisRelate: [
      'Extends JWT and role-based access from Week 6 to a specialized role (IB) and financial workflow.',
      'Reconciliation and reporting build on fee and payment logic from Weeks 7–8.',
    ],
  },
  13: {
    workExperience: [
      'Designed and implemented PIC Approvals: inbox, pending list, detail view, approve/reject, notifications on outcome.',
      'Added PIC recycle bin (rejected/cancelled items), audit trail, and PIC Users management (assign/remove PIC role).',
      'Hardened admin APIs for user and PIC operations; secured PIC routes; documented in admin manual.',
    ],
    whatDidILearn: [
      'Designing a generic approval table with type and reference id for different approval types.',
      'Avoiding race conditions with single-transaction status check and update; in-app notification instead of email for outcome.',
      'Restore-from-bin semantics and managing PIC role alongside other roles in routeAccess and backend.',
    ],
    howDoesThisRelate: [
      'Approval workflow design connects to workflow and state-machine concepts from software engineering.',
      'Role-based access and audit trail build on auth and governance ideas from earlier weeks.',
    ],
  },
  14: {
    workExperience: [
      'Gathered requirements for in-app Notification Center; designed notification_interactions table and filters (Semua, Belum Dibaca, Kelulusan, Ralat Sistem, Status Sistem).',
      'Implemented list notifications API and Notification Center page with filter tabs.',
      'Implemented mark-as-read and read tracking; wired notifications to approval and system events; added notification bell with unread count; tested filters across roles.',
    ],
    whatDidILearn: [
      'Mapping notification types to filters and designing for performance with pagination and load more.',
      'Keeping unread count in sync (e.g. refetch on focus) and filtering by user_id and role-visible types.',
    ],
    howDoesThisRelate: [
      'Notification design extends PIC approval and system events from Week 13; aligns with event-driven and UX patterns from coursework.',
    ],
  },
  15: {
    workExperience: [
      'Implemented Audit Logs backend and admin page (timestamp, user, action, entity, details); middleware to write audit entries on sensitive operations.',
      'Built Permission Matrix page from routeAccess.js (roles vs features); System Health dashboard (DB, backup, maintenance, version).',
      'Refined Audit Logs and Permission Matrix (sorting, date filter); tested System Health under failure scenarios; documented in admin manual.',
    ],
    whatDidILearn: [
      'Deciding what to log without excess; storing enough context (e.g. JSON diff) without sensitive data.',
      'Single source of truth (routeAccess.js) for permission matrix and keeping health checks minimal and actionable.',
    ],
    howDoesThisRelate: [
      'Audit and governance build on role-based access and PIC/IB workflows; System Health relates to operations and reliability from studies.',
    ],
  },
  16: {
    workExperience: [
      'Implemented maintenance mode (backend flag, 503 for non-admin, X-Maintenance header, MaintenanceModeBanner).',
      'Designed and implemented scheduled jobs: backup (mysqldump), payment reconciliation, fee generation/sync, clean-up; documented cron/scheduler usage.',
      'Implemented account lockout after failed login attempts; last_login timestamp; tested backup/restore and lockout flow.',
    ],
    whatDidILearn: [
      'Allowing admin access during maintenance via JWT role check; safe backup and retention policy.',
      'Balancing lockout security with usability; idempotent fee generation and documented restore steps.',
    ],
    howDoesThisRelate: [
      'Maintenance and backup relate to system administration and reliability; lockout extends auth from Week 6.',
    ],
  },
  17: {
    workExperience: [
      'Refined main dashboard with role-specific stat cards and optional draggable widgets; optimized loading with aggregate APIs.',
      'Implemented RouteGuard (JWT and role check), routeAccess.js mapping, ProtectedRoute, Unauthorized (403) page.',
      'Refined IB and student routes; sidebar and menus filtered by role.',
      'Enhanced documentation: user and admin manual updates, technical manual with route list and API summary, deployment steps (Docker, env vars, backup, maintenance).',
    ],
    whatDidILearn: [
      'Switching dashboard content by role without duplication; RouteGuard validation on mount and route change.',
      'Building sidebar from routeAccess.js as single source; backend student-scoped endpoints with req.user.id.',
      'Keeping manuals in sync with Permission Matrix and routeAccess; documenting deployment and backup procedures.',
    ],
    howDoesThisRelate: [
      'RouteGuard and routeAccess extend JWT and RBAC from Week 6 to full route-level security and UX.',
      'Documentation and technical writing from coursework applied to user, admin, and deployment guides.',
    ],
  },
  18: {
    workExperience: [
      'Implemented notification APIs (mark read, mark all read, unread count); optional preferences; pagination and lazy load.',
      'Added notification clean-up job; verified backup in deployment; tested maintenance mode; documented maintenance and backup.',
      'Hardened API error handling (code, message, details); input validation middleware; reviewed SQL injection and XSS; file upload validation.',
      'Improved fee/payment reconciliation report and view; tested webhooks (idempotent, duplicate, amount mismatch); year-end archiving script.',
    ],
    whatDidILearn: [
      'Unread count accuracy across tabs; clean-up without breaking audit; balancing safe error messages with debugging needs.',
      'Idempotent webhook handling and matching transactions across systems; archive policy (e.g. by term).',
    ],
    howDoesThisRelate: [
      'Security hardening builds on validation and auth from earlier weeks; reconciliation extends payment logic from Week 12 and 16.',
    ],
  },
  19: {
    workExperience: [
      'Refined dashboard quick actions and role-specific widgets; improved loading (skeleton, aggregate API); tested on desktop and mobile.',
      'Implemented deployment scripts (build, Docker, nginx); documented env vars and full deploy on staging.',
      'Added technical manual (API list, auth flow, schema overview, migrations); receipt generation and viewer; Payment History page with receipt links.',
      'Fixed receipt download/print; regression test of payment flow including receipt.',
    ],
    whatDidILearn: [
      'Prioritizing quick actions and responsive dashboard layout; Docker and nginx SPA proxy and try_files.',
      'Keeping API docs and schema overview in sync; generating receipt on demand with template and branding.',
    ],
    howDoesThisRelate: [
      'Deployment and DevOps connect to system and network courses; receipt and payment history extend fee/payment modules from earlier weeks.',
    ],
  },
  20: {
    workExperience: [
      'Implemented contact/feedback form with rate limiting; Help Center with FAQ, manual links, contact, system status.',
      'Finalized route access for Help Center, Contact, Payment History, Staff Check-in; end-to-end test across roles; code cleanup and UI fixes.',
    ],
    whatDidILearn: [
      'Rate limiting and optional captcha for contact form; FAQ structure and keeping it updated with features.',
      'Full route audit against routeAccess.js and consistent navigation and back buttons.',
    ],
    howDoesThisRelate: [
      'User support features build on routing and documentation from Week 17; contact storage and admin list extend CRUD patterns.',
    ],
  },
  21: {
    workExperience: [
      'Comprehensive testing of all modules (students, teachers, classes, attendance, fees, results, payments, notifications, PIC, IB, System Health, Audit).',
      'Created test checklist and smoke test; fixed bugs; performance check (slow queries, frontend load).',
      'Result entry refinement (exam session, class, grade validation, report export); Attendance Take by class and date with bulk mark.',
      'Documentation wrap-up and deployment package; handover preparation (backup, maintenance, key contacts).',
    ],
    whatDidILearn: [
      'Prioritizing critical paths and checklist per role; error boundaries and logging for intermittent issues.',
      'Batch save and optimistic UI for attendance; deployment checklist and validating on fresh environment.',
    ],
    howDoesThisRelate: [
      'Testing and handover cap the integration and deployment work from Weeks 17–20; result and attendance refine core academic modules.',
    ],
  },
  22: {
    workExperience: [
      'Continued documentation and deployment checklist; reviewed System Health and backup for handover.',
      'Researched Campus Management Remake design; planned Campus Life and Executive Approvals task breakdown.',
      'Set up campus life backend (routes, controller, status workflow: draf, menunggu kelulusan, diluluskan, ditolak).',
      'Implemented campus_life_items migration; built Campus Life list and form (Tajuk, Butiran, Tarikh/Masa); wired create and list APIs with status filters.',
    ],
    whatDidILearn: [
      'Mapping design spec (e.g. Next.js/Prisma) to current React/Vite/Express/MySQL stack.',
      'Status workflow and reusing existing auth and routeAccess patterns for new module.',
    ],
    howDoesThisRelate: [
      'Campus Life is a new module that reuses patterns from PIC Approvals and route security; documentation continues from Week 21.',
    ],
  },
  23: {
    workExperience: [
      'Implemented Campus Management Remake (hybrid): PageLayout, topbar (search, breadcrumbs, notification bell), 12-col grid; Campus Life module (table, REST API, form, list, side panel).',
      'Built Executive Approvals page (Inbox → List → Detail → Ya/Tidak); optimistic UI for approve/reject; route access and sidebar (Campus Life, Kelulusan Eksekutif).',
      'Documented CAMPUS_MANAGEMENT_REMAKE.md (migration path); deployed frontend and backend via Docker.',
      'Verified deployment; tested receipt and Notification Center with new layout; polished UI and documentation.',
    ],
    whatDidILearn: [
      'Adapting a Next.js/Prisma/PostgreSQL design to current stack and documenting future migration.',
      'Optimistic updates with useTransition and fallback to reload on API error; regression testing after layout changes.',
    ],
    howDoesThisRelate: [
      'Campus Life and Executive Approvals extend approval and governance patterns from PIC and Week 22; deployment and docs from Weeks 17–21 applied again.',
    ],
  },
};

/** Offsets from week start (Wed=0): Wed+0, Thu+1, Fri+2, Mon+5, Tue+6. */
const DAY_OFFSETS = [0, 1, 2, 5, 6];

/** Get calendar date (D/M/YYYY) and day name for a given week (1–24) and day index (0–4). Ensures every logbook page has a date and day. */
function getDateAndDayForWeekSlot(weekNum, dayIndex) {
  const start = new Date(2025, 8, 17); // 17 Sept 2025 (month 0-indexed)
  const end = new Date(2026, 2, 6);    // 6 March 2026
  const offset = (weekNum - 1) * 7 + (DAY_OFFSETS[dayIndex] ?? dayIndex);
  const d = new Date(start);
  d.setDate(d.getDate() + offset);
  if (d > end) {
    const last = new Date(end);
    const dayName = last.toLocaleDateString('en-GB', { weekday: 'long' });
    return { date: `${last.getDate()}/${last.getMonth() + 1}/${last.getFullYear()}`, day: dayName };
  }
  const dayName = d.toLocaleDateString('en-GB', { weekday: 'long' });
  return {
    date: `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`,
    day: dayName,
  };
}

/** Week end date string for each week (1–24) when not from LOG_BOOK_FULL.md. */
const DEFAULT_WEEK_DATE_ENDS = [
  '23 September 2025', '30 September 2025', '7 October 2025', '14 October 2025', '21 October 2025', '28 October 2025',
  '4 November 2025', '11 November 2025', '18 November 2025', '25 November 2025', '2 December 2025', '9 December 2025',
  '16 December 2025', '23 December 2025', '30 December 2025', '6 January 2026', '13 January 2026', '20 January 2026',
  '27 January 2026', '3 February 2026', '10 February 2026', '17 February 2026', '24 February 2026', '6 March 2026',
];

/** Fixed number of daily log pages per week so every document has the same page count.
 *  Total pages per week = 9: 1 cover + 1 contents + 5 daily + 1 blank form + 1 weekly summary. */
const DAILY_LOG_PAGES_PER_WEEK = 5;

/** Cap bullets and text length so each daily log fits on one page and page count stays consistent. */
const MAX_TASKS_PER_DAY = 8;
const MAX_CHALLENGES_PER_DAY = 4;
const MAX_SOLUTIONS_PER_DAY = 4;
const MAX_CHARS_PER_BULLET = 200;

/** No-data day: Tasks Completed: ● No logbook entry. Challenges: (empty). Solutions: (empty). */
const PLACEHOLDER_DAY = {
  date: '—',
  day: '—',
  tasks: ['No logbook entry.'],
  challenges: [],
  solutions: [],
  attachmentNote: null,
  codeScreenshotSuggestions: [],
};

const SCREENSHOTS_DIR = join(rootDir, 'logbook', 'screenshots');
/** Public holidays + absent days (week 1–24, day 1–5): no screenshot embedded. */
const HOLIDAY_DAYS = new Set([
  '3-5', '4-1', '4-2', '5-2', '5-4', '7-5', '8-5', '10-4', '10-5', '11-1', '11-2',
  '12-1', '12-2', '13-1', '14-1', '14-2', '14-3', '15-2', '17-2', '20-1', '20-4',
  '22-5', '23-1', '23-3', '23-5', '24-1',
]);
/** Max width (pt) for code screenshot in the doc so it fits the page */
const CODE_SCREENSHOT_WIDTH = 420;

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function monthNameToNum(name) {
  const i = MONTH_NAMES.findIndex((m) => m.toLowerCase() === (name || '').toLowerCase());
  return i >= 0 ? i + 1 : null;
}
/** "October 8, 2025" -> "8/10/2025" (D/M/YYYY) */
function formatDateDdMmYyyy(monthName, day, year) {
  const m = monthNameToNum(monthName);
  if (m == null || !day || !year) return null;
  return `${parseInt(day, 10)}/${m}/${year}`;
}

/** Parse LOG_BOOK.md (alternative format: ## WEEK N, ### Day M - Weekday, Month DD, YYYY, **Date:** ..., **Tasks Completed:**, etc.) */
function parseLogbookMdFromLogBook() {
  const raw = readFileSync(LOG_BOOK_FULL_PATH, 'utf8');
  const dayBlocksByWeek = {};
  const summariesByWeek = {};
  const weekDateEndByWeek = {};

  const weekHeaderRe = /^## WEEK (\d+)\s*\n\*\*Week \d+:\s*(\w+)\s+(\d+)\s*\([^)]+\)\s*-\s*(\w+)\s+(\d+)\s*\([^)]+\)\s*,\s*(\d{4})\*\*/gm;
  let m;
  while ((m = weekHeaderRe.exec(raw)) !== null) {
    const num = parseInt(m[1], 10);
    const endMonth = m[4];
    const endDay = m[5];
    const year = m[6];
    weekDateEndByWeek[num] = `${endDay} ${endMonth} ${year}`;
  }

  const dayBlockRe = /### Day \d+ -\s*(\w+),\s*(\w+)\s+(\d+),\s*(\d{4})\s*\n\*\*Date:\*\*\s*[^\n]*[\s\S]*?(?=### Day \d+ -|## WEEK \d+|## Summary of Weeks|\n---\s*\n\n## |$)/gi;
  let block;
  while ((block = dayBlockRe.exec(raw)) !== null) {
    const dayName = block[1];
    const monthName = block[2];
    const day = block[3];
    const year = block[4];
    const dateStr = formatDateDdMmYyyy(monthName, day, year) || `${day}/${monthName}/${year}`;
    const body = block[0];

    let weekNum = null;
    const weekSection = raw.substring(0, block.index).split('## WEEK ');
    const lastWeek = weekSection[weekSection.length - 1];
    const weekMatch = lastWeek.match(/^(\d+)/);
    if (weekMatch) weekNum = parseInt(weekMatch[1], 10);
    if (weekNum == null || weekNum < 1 || weekNum > 24) continue;

    const isAbsent = /\*\*Status:\*\*\s*Absent/i.test(body);
    const isRestDay = /\*\*Status:\*\*\s*Rest day/i.test(body);
    const isHoliday = /\*\*Status:\*\*\s*.*[Hh]oliday/i.test(body);
    let tasks = [];
    let challenges = [];
    let solutions = [];

    if (isAbsent) {
      tasks = ['Absent from training.'];
    } else if (isRestDay || isHoliday) {
      tasks = [body.match(/\*\*Status:\*\*\s*([^\n*]+)/)?.[1]?.trim() || 'Rest day / Holiday.'];
    } else {
      const tasksSection = body.match(/\*\*Tasks Completed:\*\*\s*\n([\s\S]*?)(?=\*\*Challenges:\*\*|\*\*Hours Worked:\*\*|---|$)/i);
      const challengesSection = body.match(/\*\*Challenges:\*\*\s*\n([\s\S]*?)(?=\*\*Solutions:\*\*|\*\*Hours Worked:\*\*|---|$)/i);
      const solutionsSection = body.match(/\*\*Solutions:\*\*\s*\n([\s\S]*?)(?=\*\*Hours Worked:\*\*|---|$)/i);
      const toBullets = (s) => (s || '').split(/\n/).map((l) => l.replace(/^\s*-\s*/, '').trim()).filter(Boolean);
      if (tasksSection) tasks = toBullets(tasksSection[1]);
      if (challengesSection) challenges = toBullets(challengesSection[1]);
      if (solutionsSection) solutions = toBullets(solutionsSection[1]);
      if (tasks.length === 0 && !/\*\*Status:\*\*/.test(body)) tasks = ['No logbook entry.'];
    }

    const captionMatch = body.match(/\*\*(?:Screenshot caption|Caption):\*\*\s*([^\n*]+(?:\n(?!\*\*)[^\n*]*)*)/i);
    const screenshotCaption = captionMatch ? captionMatch[1].trim().replace(/\n/g, ' ').slice(0, 200) : null;

    if (!dayBlocksByWeek[weekNum]) dayBlocksByWeek[weekNum] = [];
    dayBlocksByWeek[weekNum].push({
      date: dateStr,
      day: dayName,
      tasks: tasks.length ? tasks : ['No logbook entry.'],
      challenges,
      solutions,
      attachmentNote: null,
      codeScreenshotSuggestions: [],
      screenshotCaption: screenshotCaption || null,
    });
  }

  const defaultSummary = {
    workExperience: ['See daily log entries above.'],
    whatDidILearn: ['Applied development and training activities as per log.'],
    howDoesThisRelate: ['Builds on coursework and prior experience with the project.'],
  };
  for (let w = 1; w <= NUM_WEEKS; w++) {
    if (!summariesByWeek[w]) summariesByWeek[w] = defaultSummary;
  }

  return { dayBlocksByWeek, summariesByWeek, weekDateEndByWeek };
}

/** Parse LOG_BOOK_FULL.md and return { dayBlocksByWeek, summariesByWeek, weekDateEndByWeek } */
function parseLogbookMd() {
  const raw = readFileSync(LOG_BOOK_FULL_PATH, 'utf8');
  const dayBlocksByWeek = {};
  const summariesByWeek = {};
  const weekDateEndByWeek = {};

  // Extract week date ranges from "## WEEK N: ... (Tuesday), 2025" or " - March 6 (Friday), 2026"
  const weekHeaderRe = /^## WEEK (\d+):\s*[^-]+-\s*([^.]+(?:\([^)]+\))?,?\s*\d{4})/gm;
  let m;
  while ((m = weekHeaderRe.exec(raw)) !== null) {
    const num = parseInt(m[1], 10);
    const endPart = m[2].trim(); // e.g. "September 23 (Tuesday), 2025" or "March 6 (Friday), 2026"
    const dateMatch = endPart.match(/(\w+)\s+(\d+)\s*\([^)]+\)\s*,\s*(\d{4})/);
    weekDateEndByWeek[num] = dateMatch ? `${dateMatch[2]} ${dateMatch[1]} ${dateMatch[3]}` : endPart;
  }

  // Parse each "### Date: DD/MM/YYYY  Day: Weekday  Training Week: N" block (tabs or spaces)
  const dayBlockRe = /### Date:\s*(\d{1,2}\/\d{1,2}\/\d{4})\s+Day:\s*(\w+)\s+Training Week:\s*(\d+)\s*\n[\s\S]*?(?=### Date:|### WEEKLY SUMMARY|## WEEK \d+|## LOGBOOK|## VACANT|$)/gi;
  let block;
  while ((block = dayBlockRe.exec(raw)) !== null) {
    const date = block[1];
    const day = block[2];
    const weekNum = parseInt(block[3], 10);
    const body = block[0];
    if (weekNum < 1 || weekNum > 24) continue;
    const absentMatch = body.match(/\*\*ABSENT[^*]*\*\*/i);
    let tasks = [], challenges = [], solutions = [];
    if (absentMatch) {
      tasks = [body.includes('SICK') ? 'Absent from training due to illness.' : 'Absent from training.'];
    } else {
      const tasksSection = body.match(/Tasks Completed:\s*\n([\s\S]*?)(?=Challenges:|$)/i);
      const challengesSection = body.match(/Challenges:\s*\n?([\s\S]*?)(?=Solutions:|$)/i);
      const solutionsSection = body.match(/Solutions:\s*\n?([\s\S]*?)(?=Code Screenshot|Note:|---|$)/i);
      const toBullets = (s) => (s || '').split(/\n/).map((l) => l.replace(/^\s*-\s*/, '').trim()).filter(Boolean);
      if (tasksSection) tasks = toBullets(tasksSection[1]);
      if (challengesSection) challenges = toBullets(challengesSection[1]);
      if (solutionsSection) solutions = toBullets(solutionsSection[1]);
    }
    // Parse "Code Screenshot Suggestions:" block for this day (file path and optional line range)
    let codeScreenshotSuggestions = [];
    const screenshotSection = body.match(/Code Screenshot Suggestions:\s*\n([\s\S]*?)(?=---|### Date:|### WEEKLY SUMMARY|$)/i);
    if (screenshotSection) {
      const fileRe = /File:\s*`([^`]+)`(?:\s*\([^)]*lines?\s*(\d+)\s*[-–]\s*(\d+)[^)]*\))?/gi;
      let fm;
      while ((fm = fileRe.exec(screenshotSection[1])) !== null) {
        const file = fm[1].trim();
        const lineStart = fm[2] ? parseInt(fm[2], 10) : null;
        const lineEnd = fm[3] ? parseInt(fm[3], 10) : null;
        codeScreenshotSuggestions.push({ file, lineStart, lineEnd });
      }
    }
    if (!dayBlocksByWeek[weekNum]) dayBlocksByWeek[weekNum] = [];
    dayBlocksByWeek[weekNum].push({ date, day, tasks, challenges, solutions, attachmentNote: null, codeScreenshotSuggestions });
  }

  // Parse "### WEEKLY SUMMARY - Week N"
  const summaryBlockRe = /### WEEKLY SUMMARY - Week (\d+)\s*\n([\s\S]*?)(?=WEEKLY ASSESSMENT|### WEEKLY SUMMARY|## WEEK \d+|## VACANT|$)/gi;
  while ((m = summaryBlockRe.exec(raw)) !== null) {
    const weekNum = parseInt(m[1], 10);
    const text = m[2];
    const workRe = /Work experience details:?-?\s*\n([\s\S]*?)(?=What did I learn\?|$)/i;
    const learnRe = /What did I learn\?\-?\s*\n([\s\S]*?)(?=How does this relate|$)/i;
    const relateRe = /How does this relate to what I already know\?\-?\s*\n([\s\S]*?)(?=WEEKLY ASSESSMENT|$)/i;
    const toList = (s) => (s || '').split(/\n/).map((l) => l.replace(/^\s*-\s*/, '').trim()).filter(Boolean);
    summariesByWeek[weekNum] = {
      workExperience: toList((workRe.exec(text) || [])[1] || ''),
      whatDidILearn: toList((learnRe.exec(text) || [])[1] || ''),
      howDoesThisRelate: toList((relateRe.exec(text) || [])[1] || ''),
    };
  }

  // Parse weeks 14-24 table rows for placeholder days (| DD/MM/YYYY | Weekday | Status |)
  for (let w = 14; w <= 24; w++) {
    const sectionRe = new RegExp(`## WEEK ${w}:\\s*[^\\n]+\\n\\| Date \\| Day \\| Status \\|\\s*\\n\\|[^\\n]+\\n([\\s\\S]*?)(?=\\n---\\s*\\n|\\n## WEEK |\\n## VACANT|$)`, 'i');
    const section = sectionRe.exec(raw);
    if (section) {
      const tableBody = section[1];
      const lines = tableBody.split(/\n/).filter((l) => /^\|\s*\d{1,2}\/\d{1,2}\/\d{4}\s*\|/.test(l));
      const days = [];
      for (const line of lines) {
        const cells = line.split(/\|/).map((c) => c.trim()).filter(Boolean);
        const date = cells[0] || '—';
        const day = cells[1] || '—';
        const status = cells[2] || '';
        const isVacant = /VACANT|No logbook entry/i.test(status) || /Public Holiday|Christmas|New Year/i.test(status);
        days.push({
          date,
          day,
          tasks: isVacant ? ['No logbook entry.'] : ['Activities as per logbook continuation or schedule.'],
          challenges: [],
          solutions: [],
          attachmentNote: null,
          codeScreenshotSuggestions: [],
        });
      }
      if (days.length) dayBlocksByWeek[w] = days;
      if (!summariesByWeek[w]) {
        summariesByWeek[w] = {
          workExperience: ['Various tasks and activities as per training schedule and continuation entries.'],
          whatDidILearn: ['Ongoing learning and application of skills during the internship period.'],
          howDoesThisRelate: ['Builds upon knowledge and experience gained in earlier weeks.'],
        };
      }
      if (!weekDateEndByWeek[w]) {
        const lastDay = days[days.length - 1];
        if (lastDay) weekDateEndByWeek[w] = lastDay.date.split('/').reverse().join('/'); // rough fallback
      }
    }
  }

  return { dayBlocksByWeek, summariesByWeek, weekDateEndByWeek };
}

/** Build 24 week objects for doc generation. Uses LOG_BOOK_FULL.md if present; otherwise placeholder content. */
function buildAllWeeks() {
  const defaultSummary = {
    workExperience: ['See daily log entries above.'],
    whatDidILearn: ['See weekly reflection.'],
    howDoesThisRelate: ['See weekly reflection.'],
  };
  if (!existsSync(LOG_BOOK_FULL_PATH)) {
    console.log('⚠️ LOG_BOOK_FULL.md / LOG_BOOK.md not found (checked root, logbook/, docs/); generating 24 weeks with no-data days (17/9/2025–6/3/2026).');
    const weeks = [];
    for (let n = 1; n <= NUM_WEEKS; n++) {
      weeks.push({
        weekNumber: n,
        weekDateEnd: DEFAULT_WEEK_DATE_ENDS[n - 1] || `Week ${n}`,
        days: [{ ...PLACEHOLDER_DAY }],
        weeklySummary: defaultSummary,
        assessmentDate: '—',
        marksForWeek: String(n),
      });
    }
    return weeks;
  }

  console.log('📖 Using logbook data from:', LOG_BOOK_FULL_PATH);
  const { dayBlocksByWeek, summariesByWeek, weekDateEndByWeek } = USING_LOG_BOOK_MD
    ? parseLogbookMdFromLogBook()
    : parseLogbookMd();
  for (const w of Object.keys(WEEKLY_SUMMARIES)) {
    summariesByWeek[Number(w)] = WEEKLY_SUMMARIES[w];
  }
  const weeks = [];
  for (let n = 1; n <= NUM_WEEKS; n++) {
    const days = dayBlocksByWeek[n] || [];
    const lastDay = days[days.length - 1];
    const assessmentDate = lastDay ? lastDay.date : '—';
    const noDataDay = { ...PLACEHOLDER_DAY };
    weeks.push({
      weekNumber: n,
      weekDateEnd: weekDateEndByWeek[n] || DEFAULT_WEEK_DATE_ENDS[n - 1] || `Week ${n}`,
      days: days.length ? days : [noDataDay],
      weeklySummary: summariesByWeek[n] || defaultSummary,
      assessmentDate,
      marksForWeek: String(n),
    });
  }
  return weeks;
}

/**
 * Get a screenshot image buffer for a given day. Uses only code screenshots:
 * (1) pre-generated code image at logbook/screenshots/weekN/dayM_code.png,
 * (2) or on-the-fly code-to-image from the day's "Code Screenshot Suggestions" if catage is installed.
 * UI screenshots (dayM.png/jpg) are not used so login/protected pages are never embedded.
 * @returns {Promise<Buffer|null>}
 */
async function getScreenshotBuffer(weekNumber, dayIndex, day) {
  const M = dayIndex + 1;
  if (HOLIDAY_DAYS.has(`${weekNumber}-${M}`)) return null;
  const weekDir = join(SCREENSHOTS_DIR, `week${weekNumber}`);
  const captionPaths = [
    join(weekDir, `day${M}_caption.txt`),
    join(SCREENSHOTS_DIR, `week${weekNumber}_day${M}_caption.txt`),
  ];
  function readCaption() {
    for (const cp of captionPaths) {
      if (existsSync(cp)) {
        try {
          return readFileSync(cp, 'utf8').trim().slice(0, 200);
        } catch {
          return null;
        }
      }
    }
    return null;
  }
  const caption = (day?.screenshotCaption || readCaption() || '').trim();
  // Embed screenshots only when a caption exists.
  if (!caption) return null;

  const imagePaths = [
    [join(weekDir, `day${M}_code.png`), 'png'],
    [join(SCREENSHOTS_DIR, `week${weekNumber}_day${M}_code.png`), 'png'],
    [join(weekDir, `day${M}_ui.png`), 'png'],
    [join(SCREENSHOTS_DIR, `week${weekNumber}_day${M}_ui.png`), 'png'],
    [join(weekDir, `day${M}.png`), 'png'],
    [join(SCREENSHOTS_DIR, `week${weekNumber}_day${M}.png`), 'png'],
  ];
  for (const [p, format] of imagePaths) {
    if (existsSync(p)) {
      try {
        return { buffer: readFileSync(p), format, caption };
      } catch {
        return null;
      }
    }
  }
  // Optional: generate from first suggested code file if catage is available
  const suggestion = day?.codeScreenshotSuggestions?.[0];
  if (!suggestion?.file) return null;
  const codePath = join(rootDir, suggestion.file.replace(/^\//, ''));
  if (!existsSync(codePath)) return null;
  try {
    let code = readFileSync(codePath, 'utf8');
    if (suggestion.lineStart != null && suggestion.lineEnd != null) {
      const lines = code.split(/\n/);
      const start = Math.max(0, suggestion.lineStart - 1);
      const end = Math.min(lines.length, suggestion.lineEnd);
      code = lines.slice(start, end).join('\n');
    } else if (suggestion.lineStart != null) {
      const lines = code.split(/\n/);
      code = lines.slice(Math.max(0, suggestion.lineStart - 1)).join('\n');
    }
    // Keep a small cap so image isn't huge (e.g. first ~40 lines)
    const maxLines = 40;
    const codeLines = code.split(/\n/);
    if (codeLines.length > maxLines) code = codeLines.slice(0, maxLines).join('\n') + '\n// ...';
    const ext = (suggestion.file.match(/\.(jsx?|tsx?|sql|json|md)$/i) || [])[1] || 'js';
    const langMap = { js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript', sql: 'sql', json: 'json', md: 'markdown' };
    const lang = langMap[ext] || 'javascript';
    const { convert, IMAGE_FORMATS, THEMES } = await import('catage').catch(() => ({}));
    if (typeof convert !== 'function') return null;
    const tmpIn = join(tmpdir(), `logbook-code-${Date.now()}-${weekNumber}-${dayIndex}.${ext}`);
    const tmpOut = join(tmpdir(), `logbook-img-${Date.now()}-${weekNumber}-${dayIndex}.png`);
    writeFileSync(tmpIn, code, 'utf8');
    await convert({
      inputFile: tmpIn,
      outputFile: tmpOut,
      language: lang,
      format: IMAGE_FORMATS.PNG,
      theme: THEMES.FIREWATCH,
      hasFrame: true,
      ignoreLineNumbers: false,
    }).catch(() => {});
    if (!existsSync(tmpOut)) return null;
    const buf = readFileSync(tmpOut);
    try { unlinkSync(tmpIn); } catch {}
    try { unlinkSync(tmpOut); } catch {}
    return { buffer: buf, format: 'png', caption };
  } catch {
    return null;
  }
}

function bulletItem(text) {
  const s = String(text || '').trim();
  const truncated = s.length > MAX_CHARS_PER_BULLET ? s.slice(0, MAX_CHARS_PER_BULLET - 3) + '...' : s;
  return new Paragraph({
    bullet: { level: 0 },
    children: [new TextRun({ text: truncated || '—' })],
    spacing: { after: 60 },
  });
}

/** Truncate array to max length so each daily log fits one page and page count stays consistent. */
function capBullets(arr, max) {
  const a = Array.isArray(arr) ? arr : [];
  if (a.length <= max) return a;
  return a.slice(0, max).concat([`(${a.length - max} more item(s) in logbook)`]);
}

/** Daily log page: title, Date/Day/Week (values on underlined blanks, day in CAPS), instruction, small box “DESCRIPTIONS/REMARKS”, large content box with Tasks/Challenges/Solutions and note */
function dailyLogSection(data, weekNumber, screenshot = null) {
  const dayUpper = (data.day || '').toUpperCase();
  const tasks = capBullets(data.tasks || [], MAX_TASKS_PER_DAY);
  const challenges = capBullets(data.challenges || [], MAX_CHALLENGES_PER_DAY);
  const solutions = capBullets(data.solutions || [], MAX_SOLUTIONS_PER_DAY);
  const mainBoxContent = [
    new Paragraph({
      children: [new TextRun({ text: 'Tasks Completed:', bold: true })],
      spacing: { after: 80 },
    }),
    ...tasks.map((t) => bulletItem(t)),
    new Paragraph({
      children: [new TextRun({ text: 'Challenges:', bold: true })],
      spacing: { before: 160, after: 80 },
    }),
    ...challenges.map((t) => bulletItem(t)),
    new Paragraph({
      children: [new TextRun({ text: 'Solutions:', bold: true })],
      spacing: { before: 160, after: 80 },
    }),
    ...solutions.map((t) => bulletItem(t)),
    new Paragraph({ spacing: { before: 200 } }),
  ];
  if (screenshot?.buffer && screenshot.buffer.length > 0) {
    try {
      const format = screenshot.format === 'jpeg' ? 'jpg' : 'png';
      const image = new ImageRun({
        type: format,
        data: screenshot.buffer,
        transformation: { width: CODE_SCREENSHOT_WIDTH, height: Math.round((CODE_SCREENSHOT_WIDTH * 9) / 16) },
      });
      const captionText = (data.screenshotCaption || screenshot.caption || 'Screenshot for this day\'s activities.').trim().slice(0, 200);
      mainBoxContent.push(
        new Paragraph({
          children: [new TextRun({ text: 'Screenshot:', bold: true, size: 20 })],
          spacing: { after: 80 },
        }),
        new Paragraph({ children: [image], spacing: { after: 120 } }),
        new Paragraph({
          children: [new TextRun({ text: `Caption: ${captionText}`, italics: true, size: 18 })],
          spacing: { after: 200 },
        })
      );
    } catch {
      // ignore invalid image buffer
    }
  }
  mainBoxContent.push(
    new Paragraph({ spacing: { before: 200 } }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Note: Please include attachment(s) when necessary',
          italics: true,
          size: 20,
        }),
      ],
    })
  );

  return [
    new Paragraph({
      children: [new TextRun({ text: 'DAILY TRAINING LOG', bold: true, size: 26 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      pageBreakBefore: true,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Date: ' }),
        new TextRun({ text: data.date, underline: {} }),
        new TextRun({ text: '    Day: ' }),
        new TextRun({ text: dayUpper, underline: {} }),
        new TextRun({ text: '    Training Week: ' }),
        new TextRun({ text: String(weekNumber), underline: {} }),
      ],
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: '(Please specify training information through descriptive notes, sketches, figures, etc.)',
          italics: true,
        }),
      ],
      spacing: { after: 200 },
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: thinBorder,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: 'DESCRIPTIONS / REMARKS', bold: true })],
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 0 },
                }),
              ],
              margins: { top: 160, bottom: 160, left: 240, right: 240 },
            }),
          ],
        }),
      ],
    }),
    new Paragraph({ spacing: { after: 120 } }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: thinBorder,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: mainBoxContent,
              margins: { top: 240, bottom: 240, left: 240, right: 240 },
            }),
          ],
        }),
      ],
    }),
  ];
}

const thickBorder = {
  top: { style: BorderStyle.SINGLE, size: 18 },
  bottom: { style: BorderStyle.SINGLE, size: 18 },
  left: { style: BorderStyle.SINGLE, size: 18 },
  right: { style: BorderStyle.SINGLE, size: 18 },
};

/** Build WEEKLY SUMMARY + WEEKLY ASSESSMENT section (one page). Used by both per-week logbook and print-all summary doc. */
function buildWeeklySummaryAndAssessmentSection(week, options = {}) {
  const { emptyMarksBox = false, supervisorComment = '' } = options;
  const summary = week.weeklySummary;
  const out = [
    new Paragraph({
      children: [new TextRun({ text: 'WEEKLY SUMMARY', bold: true, size: 24 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 48 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Weekly Summary for Week ${week.weekNumber} (Date: ${week.weekDateEnd} ` }),
        new TextRun({ text: '__', underline: {} }),
        new TextRun({ text: ')' }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 72 },
    }),
  ];

  const col1Content = [
    new Paragraph({
      children: [new TextRun({ text: 'Work experience details', bold: true })],
      spacing: { after: 60 },
    }),
    ...(summary.workExperience || []).map((t) =>
      new Paragraph({
        bullet: { level: 0 },
        children: [new TextRun({ text: String(t) })],
        spacing: { after: 40 },
      })
    ),
  ];
  const col2Content = [
    new Paragraph({
      children: [new TextRun({ text: 'What did I learn?', bold: true })],
      spacing: { after: 60 },
    }),
    ...(summary.whatDidILearn || []).map((t) =>
      new Paragraph({
        bullet: { level: 0 },
        children: [new TextRun({ text: String(t) })],
        spacing: { after: 40 },
      })
    ),
  ];
  const col3Content = [
    new Paragraph({
      children: [new TextRun({ text: 'How does this relate to what I already know?', bold: true })],
      spacing: { after: 60 },
    }),
    ...(summary.howDoesThisRelate || []).map((t) =>
      new Paragraph({
        bullet: { level: 0 },
        children: [new TextRun({ text: String(t) })],
        spacing: { after: 40 },
      })
    ),
  ];

  const commentText = String(supervisorComment || '').trim();
  const commentParagraphs = commentText
    ? commentText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => new Paragraph({ children: [new TextRun({ text: line })], spacing: { after: 32 } }))
    : [
        new Paragraph({
          children: [new TextRun({ text: '________________________________________________________________________________', underline: {} })],
          spacing: { after: 32 },
        }),
        new Paragraph({
          children: [new TextRun({ text: '________________________________________________________________________________', underline: {} })],
          spacing: { after: 32 },
        }),
        new Paragraph({
          children: [new TextRun({ text: '________________________________________________________________________________', underline: {} })],
          spacing: { after: 32 },
        }),
        new Paragraph({
          children: [new TextRun({ text: '________________________________________________________________________________', underline: {} })],
          spacing: { after: 0 },
        }),
      ];

  out.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: thinBorder,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 33, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: 'Work experience details', bold: true })] })],
              margins: { top: 80, bottom: 80, left: 80, right: 80 },
            }),
            new TableCell({
              width: { size: 33, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: 'What did I learn?', bold: true })] })],
              margins: { top: 80, bottom: 80, left: 80, right: 80 },
            }),
            new TableCell({
              width: { size: 34, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: 'How does this relate to what I already know?', bold: true })] })],
              margins: { top: 80, bottom: 80, left: 80, right: 80 },
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              width: { size: 33, type: WidthType.PERCENTAGE },
              children: col1Content,
              margins: { top: 80, bottom: 80, left: 80, right: 80 },
            }),
            new TableCell({
              width: { size: 33, type: WidthType.PERCENTAGE },
              children: col2Content,
              margins: { top: 80, bottom: 80, left: 80, right: 80 },
            }),
            new TableCell({
              width: { size: 34, type: WidthType.PERCENTAGE },
              children: col3Content,
              margins: { top: 80, bottom: 80, left: 80, right: 80 },
            }),
          ],
        }),
      ],
    })
  );

  out.push(
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 6 } },
      spacing: { before: 120, after: 0 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'WEEKLY ASSESSMENT', bold: true, size: 22 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 0 },
    }),
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 6 } },
      spacing: { after: 48 },
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: thinBorder,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: 'WEEKLY ASSESSMENT BY INDUSTRIAL SUPERVISOR', bold: true })],
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 0 },
                }),
              ],
              margins: { top: 56, bottom: 56, left: 120, right: 120 },
            }),
          ],
        }),
      ],
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: thinBorder,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              margins: { top: 64, bottom: 64, left: 120, right: 120 },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: 'Instruction to Supervisor:', bold: true })],
                  spacing: { after: 48 },
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'Please refer to the relevant daily student report for assessments and comments.',
                    }),
                  ],
                  spacing: { after: 0 },
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Marking Scale: ' }),
        new TextRun({ text: '1. Poor ', underline: {} }),
        new TextRun({ text: '2. Moderate ', underline: {} }),
        new TextRun({ text: '3. Average ', underline: {} }),
        new TextRun({ text: '4. Good ', underline: {} }),
        new TextRun({ text: '5. Excellent', underline: {} }),
      ],
      spacing: { before: 72, after: 72 },
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: thinBorder,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "Supervisor's Signature: " }),
                    new TextRun({ text: '_________________________', underline: {} }),
                  ],
                  spacing: { after: 60 },
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: `Date: ${week.assessmentDate || '—'} ` }),
                    new TextRun({ text: '_________________________', underline: {} }),
                  ],
                  spacing: { after: 72 },
                }),
                new Paragraph({
                  children: [new TextRun({ text: 'Comments:', bold: true })],
                  spacing: { after: 48 },
                }),
                ...commentParagraphs,
              ],
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "Supervisor's Name & Official Stamp: " })],
                  spacing: { after: 56 },
                }),
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  borders: thinBorder,
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [new Paragraph({ text: ' ', spacing: { before: 200, after: 200 } })],
                          margins: { top: 80, bottom: 80, left: 80, right: 80 },
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: thinBorder,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 75, type: WidthType.PERCENTAGE },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: `Marks for Week ${week.marksForWeek} `, bold: true }),
                  ],
                  spacing: { after: 48 },
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: '(To be completed on the last day of each training week)',
                      italics: true,
                    }),
                  ],
                  spacing: { after: 0 },
                }),
              ],
            }),
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  borders: thickBorder,
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({
                          width: { size: 50, type: WidthType.PERCENTAGE },
                          children: [new Paragraph({ text: ' ' })],
                          borders: { bottom: { style: BorderStyle.SINGLE, size: 6 }, right: { style: BorderStyle.SINGLE, size: 6 } },
                        }),
                        new TableCell({
                          width: { size: 50, type: WidthType.PERCENTAGE },
                          children: [new Paragraph({ text: ' ' })],
                          borders: { bottom: { style: BorderStyle.SINGLE, size: 6 }, left: { style: BorderStyle.SINGLE, size: 6 } },
                        }),
                      ],
                    }),
                    new TableRow({
                      children: [
                        new TableCell({
                          width: { size: 50, type: WidthType.PERCENTAGE },
                          children: [new Paragraph({ text: ' ' })],
                          borders: { top: { style: BorderStyle.SINGLE, size: 6 }, right: { style: BorderStyle.SINGLE, size: 6 } },
                        }),
                        new TableCell({
                          width: { size: 50, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: emptyMarksBox ? ' ' : '5',
                                  bold: true,
                                  size: 28,
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          borders: { top: { style: BorderStyle.SINGLE, size: 6 }, left: { style: BorderStyle.SINGLE, size: 6 } },
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  return out;
}

async function buildWeekChildren(week, options = {}) {
  const docChildren = [];

  // ========== PAGE 1: COVER – LOG BOOK REPORT + image or fallback text ==========
  const coverImg = createCoverImage();
  if (coverImg) {
    docChildren.push(
      new Paragraph({
        children: [coverImg],
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Log Book Report – Masjid Management System', bold: true, size: 22 })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 0 },
      })
    );
  } else {
    docChildren.push(
      new Paragraph({
        children: [new TextRun({ text: 'UNIVERSITI MALAYSIA PAHANG', bold: true, size: 28 })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 2400, after: 400 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'LOG BOOK REPORT', bold: true, size: 48, color: '2563A8' })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 1200, after: 200 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Masjid Management System', bold: true, size: 28 })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 400 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'INDUSTRIAL TRAINING', bold: true, size: 44, color: '0D9488' })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 2400 },
      })
    );
  }
  docChildren.push(new Paragraph({ children: [new PageBreak()] }));

  // ========== PAGE 2: LOG BOOK CONTENTS – UMPSA logo + underlined title ==========
  const logoImg = createLogoImage();
  if (logoImg) {
    docChildren.push(
      new Paragraph({
        children: [logoImg],
        alignment: AlignmentType.CENTER,
        spacing: { before: 600, after: 800 },
      })
    );
  } else {
    docChildren.push(
      new Paragraph({
        children: [new TextRun({ text: 'UNIVERSITI MALAYSIA PAHANG', bold: true, size: 24 })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 800, after: 600 },
      })
    );
  }
  docChildren.push(
    new Paragraph({
      children: [new TextRun({ text: 'LOG BOOK CONTENTS', bold: true, size: 32, underline: {} })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Log Book Report – Masjid Management System', bold: true, size: 24 })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `Week ${week.weekNumber}`, bold: true, size: 22 })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 400 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `Training period: ${TRAINING_START} – ${TRAINING_END} (${NUM_WEEKS} weeks)`, size: 22 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 2400 },
    })
  );
  docChildren.push(new Paragraph({ children: [new PageBreak()] }));

  // ========== PAGES 3–7: DAILY TRAINING LOG (exactly 5 pages per week for consistent page count) ==========
  const daysToRender = [];
  for (let i = 0; i < DAILY_LOG_PAGES_PER_WEEK; i++) {
    const slot = week.days[i] ? { ...week.days[i], codeScreenshotSuggestions: week.days[i].codeScreenshotSuggestions || [] } : { ...PLACEHOLDER_DAY };
    const calendar = getDateAndDayForWeekSlot(week.weekNumber, i);
    if (!slot.date || slot.date === '—' || slot.date.trim() === '') slot.date = calendar.date;
    if (!slot.day || slot.day === '—' || slot.day.trim() === '') slot.day = calendar.day;
    daysToRender.push(slot);
  }
  for (let i = 0; i < daysToRender.length; i++) {
    const day = daysToRender[i];
    const screenshot = await getScreenshotBuffer(week.weekNumber, i, day);
    docChildren.push(...dailyLogSection(day, week.weekNumber, screenshot));
    docChildren.push(new Paragraph({ children: [new PageBreak()] }));
  }

  // ========== BLANK DAILY TRAINING LOG FORM (large content area + Marks box upper right) ==========
  const marksBoxCell = new TableCell({
    width: { size: 2200, type: WidthType.DXA },
    children: [
      new Paragraph({
        children: [new TextRun({ text: 'Marks for Week ' + week.marksForWeek, size: 20, bold: true })],
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: '(To be completed on the last day of each training week)',
            italics: true,
            size: 18,
          }),
        ],
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [new TextRun({ text: '_____ / 5', size: 24 })],
      }),
    ],
    margins: { top: 200, bottom: 200, left: 200, right: 200 },
    borders: thinBorder,
    shading: { fill: 'F5F5F5' },
  });

  const blankFormContent = [
    new Paragraph({
      children: [new TextRun({ text: 'DAILY TRAINING LOG', bold: true, size: 26 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Date: ' }),
        new TextRun({ text: '_________________________  ' }),
        new TextRun({ text: 'Day: ' }),
        new TextRun({ text: '_________________________  ' }),
        new TextRun({ text: 'Training Week: ' }),
        new TextRun({ text: '_________________________' }),
      ],
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: '(Please specify training information through descriptive statement, tables, sketches, figures, etc.)',
          italics: true,
        }),
      ],
      spacing: { after: 240 },
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: thinBorder,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 8000, type: WidthType.DXA },
              children: [new Paragraph({ text: ' ', spacing: { before: 2800, after: 2800 } })],
              margins: { top: 300, bottom: 300, left: 300, right: 300 },
            }),
            marksBoxCell,
          ],
        }),
      ],
    }),
    new Paragraph({ spacing: { before: 400 } }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Note: Please include attachment(s) when necessary',
          italics: true,
          size: 20,
        }),
      ],
    }),
  ];

  docChildren.push(...blankFormContent);
  docChildren.push(new Paragraph({ children: [new PageBreak()] }));

  // ========== ONE PAGE: WEEKLY SUMMARY + WEEKLY ASSESSMENT (compact to fit single page) ==========
  docChildren.push(
    ...buildWeeklySummaryAndAssessmentSection(week, {
      emptyMarksBox: false,
      supervisorComment: options.supervisorComment || '',
    })
  );

  return docChildren;
}

async function buildDocForWeek(week) {
  const docChildren = await buildWeekChildren(week);
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: docChildren,
      },
    ],
    styles: {
      default: {
        document: {
          run: {
            font: 'Arial',
            size: 22,
          },
          paragraph: {
            spacing: { line: 276, lineRule: 'auto' },
          },
        },
      },
    },
  });

  return Packer.toBuffer(doc);
}

async function generateAll() {
  const weeks = buildAllWeeks();
  console.log(`Generating ${weeks.length} logbook documents (Week 1–24)...`);
  for (const week of weeks) {
    const buffer = await buildDocForWeek(week);
    const baseName = `Logbookweek${week.weekNumber}.docx`;
    const outputPath = join(rootDir, baseName);
    try {
      writeFileSync(outputPath, buffer);
      console.log('  ✅', baseName);
    } catch (e) {
      if (e.code === 'EBUSY') {
        const altPath = join(rootDir, `Logbookweek${week.weekNumber}_${Date.now()}.docx`);
        writeFileSync(altPath, buffer);
        console.log('  ✅', baseName, '(file open → saved as', altPath + ')');
      } else throw e;
    }
  }
  console.log('📄 All logbooks saved to:', rootDir);
}

export { buildAllWeeks, buildWeeklySummaryAndAssessmentSection, buildWeekChildren };

const isMain =
  process.argv[1] &&
  join(fileURLToPath(import.meta.url)) === join(process.argv[1]);
if (isMain) generateAll().catch(console.error);

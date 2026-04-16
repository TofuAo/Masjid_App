/**
 * Generates code-focused screenshots for selected logbook days.
 * Writes to logbook/screenshots/week{N}/day{M}_code.png so Word logbooks
 * embed only code screenshots (no UI screenshots; the app cannot be
 * accessed for live UI capture).
 *
 * Usage:
 *   node scripts/generate-logbook-code-screenshots.js
 *
 * Prerequisite:
 *   npm install --save-dev catage
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const SCREENSHOTS_DIR = join(rootDir, 'logbook', 'screenshots');

// Public holidays + absent days: no code screenshot.
const EXCLUDE_DAYS = [
  { week: 3, day: 5 }, { week: 4, day: 1 }, { week: 4, day: 2 }, { week: 5, day: 2 }, { week: 5, day: 4 },
  { week: 7, day: 5 }, { week: 8, day: 5 }, { week: 10, day: 4 }, { week: 10, day: 5 }, { week: 11, day: 1 }, { week: 11, day: 2 },
  { week: 12, day: 1 }, { week: 12, day: 2 }, { week: 13, day: 1 }, { week: 14, day: 1 }, { week: 14, day: 2 }, { week: 14, day: 3 },
  { week: 15, day: 2 }, { week: 17, day: 2 }, { week: 20, day: 1 }, { week: 20, day: 4 }, { week: 22, day: 5 },
  { week: 23, day: 1 }, { week: 23, day: 3 }, { week: 23, day: 5 }, { week: 24, day: 1 },
];
const isExcluded = (w, d) => EXCLUDE_DAYS.some((x) => x.week === w && x.day === d);

// Helper to generate one code screenshot for a specific week/day/file.
async function generateCodeScreenshot({ week, day, file }) {
  if (isExcluded(week, day)) {
    console.log(`  ⏭️  Week ${week} Day ${day}: skip (public holiday).`);
    return;
  }
  const codePath = join(rootDir, file.replace(/^\//, ''));
  if (!existsSync(codePath)) {
    console.log(`  ⏭️  Week ${week} Day ${day}: skip (code file not found: ${file})`);
    return;
  }

  let code = readFileSync(codePath, 'utf8');
  const maxLines = 40;
  const lines = code.split(/\n/);
  if (lines.length > maxLines) {
    code = lines.slice(0, maxLines).join('\n') + '\n// ...';
  }

  const extMatch = file.match(/\.(jsx?|tsx?|sql|json|md)$/i);
  const ext = extMatch ? extMatch[1].toLowerCase() : 'js';
  const langMap = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    sql: 'sql',
    json: 'json',
    md: 'markdown',
  };
  const language = langMap[ext] || 'javascript';

  const { convert, IMAGE_FORMATS, THEMES } = await import('catage').catch(() => ({}));
  if (typeof convert !== 'function') {
    console.log('  ❌  catage is not available, cannot generate code screenshot.');
    return;
  }

  const tmpIn = join(tmpdir(), `logbook-code-${Date.now()}-w${week}-d${day}.${ext}`);
  const tmpOut = join(tmpdir(), `logbook-img-${Date.now()}-w${week}-d${day}.png`);
  writeFileSync(tmpIn, code, 'utf8');

  const weekDir = join(SCREENSHOTS_DIR, `week${week}`);
  if (!existsSync(weekDir)) {
    mkdirSync(weekDir, { recursive: true });
  }

  const outPath = join(weekDir, `day${day}_code.png`);

  try {
    await convert({
      inputFile: tmpIn,
      outputFile: tmpOut,
      language,
      format: IMAGE_FORMATS.PNG,
      theme: THEMES.FIREWATCH,
      hasFrame: true,
      ignoreLineNumbers: false,
    });

    if (!existsSync(tmpOut)) {
      console.log(`  ❌  Week ${week} Day ${day}: catage did not produce an image.`);
      return;
    }

    const buf = readFileSync(tmpOut);
    writeFileSync(outPath, buf);
    console.log(`  ✅  Week ${week} Day ${day}: code screenshot from ${file}`);
  } catch (err) {
    console.log(`  ❌  Week ${week} Day ${day}: error generating screenshot from ${file} — ${err.message}`);
  }
}

async function main() {
  // All mappings: keep every logbook screenshot; add at least one per week for weeks that had none.
  const mappings = [
    // Weeks 1–3
    { week: 1, day: 1, file: 'src/App.jsx' },
    { week: 2, day: 1, file: 'backend/server.js' },
    { week: 3, day: 1, file: 'src/pages/Portal.jsx' },

    // Week 4: Student module
    { week: 4, day: 3, file: 'backend/controllers/studentController.js' },
    // Week 5: DB / teacher
    { week: 5, day: 1, file: 'backend/controllers/classController.js' },
    // Week 6: Teacher, class, auth
    { week: 6, day: 1, file: 'backend/controllers/teacherController.js' },
    // Week 7: Attendance, fees
    { week: 7, day: 1, file: 'backend/controllers/attendanceController.js' },
    // Week 8: Fee reporting, API
    { week: 8, day: 1, file: 'backend/controllers/feeController.js' },
    // Week 9
    { week: 9, day: 1, file: 'src/services/api.js' },
    // Week 10
    { week: 10, day: 1, file: 'backend/controllers/paymentController.js' },
    // Week 11
    { week: 11, day: 3, file: 'backend/server.js' },

    // Week 12: IB role & payments
    { week: 12, day: 3, file: 'src/pages/IbAccount.jsx' },
    { week: 12, day: 4, file: 'src/pages/IbAccount.jsx' },
    { week: 12, day: 5, file: 'src/pages/IbAccount.jsx' },

    // Week 13: PIC Approvals
    { week: 13, day: 2, file: 'src/pages/PicApprovals.jsx' },
    { week: 13, day: 3, file: 'src/pages/PicApprovals.jsx' },

    // Week 14: Change Classes (day 2 excluded; day 4 included so week has screenshot)
    { week: 14, day: 2, file: 'src/pages/ChangeClasses.jsx' },
    { week: 14, day: 4, file: 'src/pages/ChangeClasses.jsx' },

    // Week 15: Audit Logs & Permission Matrix
    { week: 15, day: 1, file: 'backend/utils/auditLog.js' },

    // Week 16: Maintenance mode / System health
    { week: 16, day: 1, file: 'src/components/MaintenanceModeBanner.jsx' },

    // Week 17: Dashboard & route guard
    { week: 17, day: 1, file: 'src/pages/Dashboard.jsx' },

    // Week 18: Notification Center
    { week: 18, day: 1, file: 'src/contexts/NotificationContext.jsx' },

    // Week 19: Receipts & payment history
    { week: 19, day: 1, file: 'src/components/receipt/ReceiptViewer.jsx' },

    // Week 20: Pay Yuran (day 1 excluded; day 2 included so week has screenshot)
    { week: 20, day: 1, file: 'src/pages/PayYuran.jsx' },
    { week: 20, day: 2, file: 'src/pages/PayYuran.jsx' },

    // Week 21: Testing & APIs
    { week: 21, day: 1, file: 'src/services/api.js' },

    // Week 22: Settings & roles
    { week: 22, day: 1, file: 'src/pages/Settings.jsx' },

    // Week 23: Campus Life / Executive Approvals
    { week: 23, day: 2, file: 'src/pages/CampusLife.jsx' },

    // Week 24
    { week: 24, day: 2, file: 'backend/server.js' },
  ];

  console.log('Generating code-focused screenshots for selected logbook days...');
  for (const mapping of mappings) {
    // eslint-disable-next-line no-await-in-loop
    await generateCodeScreenshot(mapping);
  }
  console.log('Done. Re-run "npm run generate:logbook:word" to embed the updated screenshots.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


/**
 * Captures UI screenshots for logbook days (optional). Output is saved to
 * logbook/screenshots-ui/ and is NOT used by the Word logbook generator.
 * Word logbooks embed only code screenshots (dayM_code.png or generated from
 * Code Screenshot Suggestions) because the live site cannot be accessed for
 * authenticated UI capture.
 *
 * - Focuses only on relevant UI elements (uses selector to crop).
 * Requires: npm install --save-dev playwright
 * Config: logbook/screenshots/capture-config.json
 *
 * Usage:
 *   node scripts/capture-logbook-screenshots.js
 *   BASE_URL=http://localhost:3000 node scripts/capture-logbook-screenshots.js
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const screenshotsDir = join(rootDir, 'logbook', 'screenshots-ui');
const configPath = join(rootDir, 'logbook', 'screenshots', 'capture-config.json');
const logbookPath = join(rootDir, 'LOG_BOOK.md');

/** Parse LOG_BOOK.md and return [{ week, day, taskSummary, isAbsent }] for each day block. */
function parseLogbookForTopics() {
  if (!existsSync(logbookPath)) return [];
  const raw = readFileSync(logbookPath, 'utf8');
  const entries = [];
  const weekBlockRe = /^## WEEK (\d+)\s*\n\*\*Week \d+:[^\n]+\n([\s\S]*?)(?=^## WEEK \d+|^## Summary|\n---\s*\n\n## Summary|$)/gm;
  let wMatch;
  while ((wMatch = weekBlockRe.exec(raw)) !== null) {
    const weekNum = parseInt(wMatch[1], 10);
    const block = wMatch[2];
    const dayBlockRe = /### Day (\d+) -\s*\w+,[^\n]+\n\*\*Date:\*\*[^\n]*\n([\s\S]*?)(?=### Day \d+ -|---\s*\n\n### Day|\n---\s*\n\n## |$)/gi;
    let dMatch;
    while ((dMatch = dayBlockRe.exec(block)) !== null) {
      const dayNum = parseInt(dMatch[1], 10);
      const body = dMatch[2] || '';
      const isAbsent = /\*\*Status:\*\*\s*Absent/i.test(body) || /\*\*Status:\*\*\s*Rest day/i.test(body) || /\*\*Status:\*\*\s*.*[Hh]oliday/i.test(body);
      const tasksSection = body.match(/\*\*Tasks Completed:\*\*\s*\n([\s\S]*?)(?=\*\*Challenges:\*\*|\*\*Hours Worked:\*\*|---|$)/i);
      const tasksRaw = (tasksSection && tasksSection[1]) ? tasksSection[1] : '';
      const taskSummary = tasksRaw
        .replace(/\n/g, ' ')
        .replace(/^\s*-\s*/gm, ' ')
        .trim()
        .slice(0, 500)
        .toLowerCase();
      if (dayNum >= 1 && dayNum <= 5) {
        entries.push({
          week: weekNum,
          day: dayNum,
          taskSummary,
          isAbsent,
        });
      }
    }
  }
  return entries;
}

/** Find first topicMapping whose keywords match taskSummary. */
function matchTopic(taskSummary, topicMappings) {
  if (!taskSummary || !topicMappings || topicMappings.length === 0) return null;
  for (const mapping of topicMappings) {
    const keywords = Array.isArray(mapping.keywords) ? mapping.keywords : [mapping.keywords];
    const found = keywords.some((k) => taskSummary.includes(String(k).toLowerCase()));
    if (found) return mapping;
  }
  return null;
}

/** Log in once using config.auth (if enabled) so that protected routes don't redirect to /login. */
async function loginIfConfigured(page, baseUrl, auth) {
  if (!auth || !auth.enabled) return;

  const loginUrl = baseUrl + (auth.loginPath || '/login');
  const timeout = auth.timeoutMs || 15000;

  try {
    console.log('Logging in for screenshot capture at', loginUrl);
    await page.goto(loginUrl, { waitUntil: 'networkidle', timeout });

    if (auth.usernameSelector && typeof auth.username === 'string' && auth.username.trim()) {
      await page.fill(auth.usernameSelector, auth.username.trim());
    }
    if (auth.passwordSelector && typeof auth.password === 'string' && auth.password.trim()) {
      await page.fill(auth.passwordSelector, auth.password.trim());
    }

    if (auth.submitSelector) {
      const btn = await page.$(auth.submitSelector);
      if (btn) {
        await btn.click();
      } else {
        await page.keyboard.press('Enter');
      }
    } else {
      await page.keyboard.press('Enter');
    }

    if (auth.postLoginPath) {
      const expected = baseUrl + auth.postLoginPath;
      await page.waitForURL(expected, { timeout }).catch(() => {});
    } else {
      await page.waitForTimeout(1500);
    }

    console.log('Login step completed (continuing with captures).');
  } catch (err) {
    console.log('Login failed, continuing without authenticated session:', err.message);
  }
}

/** Build capture list: from explicit config.captures, or from auto-detect using topicMappings. Ask for clarification if any day has no match. */
function buildCaptureList(config, autoDetect) {
  const explicit = config.captures || [];
  if (explicit.length > 0 && !autoDetect) return { captures: explicit, needsClarification: [] };

  const topicMappings = config.topicMappings || [];
  const entries = parseLogbookForTopics();
  const captures = [];
  const needsClarification = [];

  for (const entry of entries) {
    if (entry.isAbsent || !entry.taskSummary) continue;
    const mapping = matchTopic(entry.taskSummary, topicMappings);
    if (mapping) {
      captures.push({
        week: entry.week,
        day: entry.day,
        path: mapping.path || '/',
        selector: mapping.selector || null,
        caption: mapping.caption || `Screenshot for Week ${entry.week} Day ${entry.day}.`,
      });
    } else {
      needsClarification.push({
        week: entry.week,
        day: entry.day,
        topic: entry.taskSummary.slice(0, 80) + (entry.taskSummary.length > 80 ? '...' : ''),
      });
    }
  }

  if (explicit.length > 0 && autoDetect) {
    const fromAuto = captures;
    const fromExplicit = explicit;
    const seen = new Set(fromAuto.map((c) => `${c.week}-${c.day}`));
    for (const cap of fromExplicit) {
      if (!seen.has(`${cap.week}-${cap.day}`)) {
        captures.push(cap);
        seen.add(`${cap.week}-${cap.day}`);
      }
    }
  }

  return { captures, needsClarification };
}

async function main() {
  const autoDetect = process.argv.includes('--auto') || true;

  let playwright;
  try {
    playwright = await import('playwright');
  } catch {
    console.log('Playwright not installed. Run: npm install --save-dev playwright');
    console.log('Then run: npx playwright install chromium');
    console.log('');
    console.log('Alternatively, add screenshots manually:');
    console.log('  - UI captures go to logbook/screenshots-ui/ (not used by Word logbook; use code screenshots instead).');
    console.log('  - Add caption in logbook/screenshots/week{N}_day{M}_caption.txt');
    console.log('  - Or add **Screenshot caption:** in LOG_BOOK.md for that day.');
    process.exit(1);
  }

  if (!existsSync(configPath)) {
    console.log('Config not found:', configPath);
    console.log('Create it with "baseUrl", "viewport", "topicMappings" (for auto-detect), and optionally "captures".');
    process.exit(1);
  }

  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  const baseUrl = process.env.BASE_URL || config.baseUrl || 'http://localhost:5173';
  const viewport = config.viewport || { width: 1280, height: 720 };

  const { captures, needsClarification } = buildCaptureList(config, autoDetect);

  // Exclude public holidays / rest days (no screenshot for these)
  const excludeDays = config.excludeDays || [];
  const isExcluded = (w, d) => excludeDays.some((x) => x.week === w && x.day === d);
  const capturesFiltered = captures.filter((c) => !isExcluded(c.week, c.day));
  if (excludeDays.length > 0 && capturesFiltered.length < captures.length) {
    console.log(`Excluded ${captures.length - capturesFiltered.length} holiday/rest day(s) from capture.`);
  }

  if (needsClarification.length > 0) {
    console.log('Context could not be determined for the following days. Please add a mapping in');
    console.log('logbook/screenshots/capture-config.json (topicMappings) or add explicit entries to "captures":');
    console.log('');
    for (const n of needsClarification) {
      console.log(`  Week ${n.week} Day ${n.day}: "${n.topic}"`);
    }
    console.log('');
    console.log('Example topicMappings entry:');
    console.log('  { "keywords": ["your", "keywords"], "path": "/your-route", "selector": "main .mosque-card", "caption": "Brief caption." }');
    if (capturesFiltered.length === 0) process.exit(1);
    console.log('');
    console.log('Proceeding with', capturesFiltered.length, 'capture(s) that were matched. Unmapped days will be skipped.');
    console.log('');
  }

  if (capturesFiltered.length === 0) {
    console.log('No captures to run. Add "captures" in capture-config.json or add "topicMappings" and ensure LOG_BOOK.md has task content.');
    process.exit(0);
  }

  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();

  // Perform login once if auth is configured, so subsequent navigations stay authenticated.
  await loginIfConfigured(page, baseUrl, config.auth);

  for (const cap of capturesFiltered) {
    const { week, day, path, selector, caption } = cap;
    const url = baseUrl + (path || '/');
    const M = day;
    const weekDir = join(screenshotsDir, `week${week}`);
    if (!existsSync(weekDir)) mkdirSync(weekDir, { recursive: true });

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(800);

      let buffer;
      if (selector) {
        try {
          const el = await page.$(selector);
          if (el) {
            buffer = await el.screenshot({ type: 'png' });
          } else {
            buffer = await page.screenshot({ type: 'png' });
          }
        } catch {
          buffer = await page.screenshot({ type: 'png' });
        }
      } else {
        buffer = await page.screenshot({ type: 'png' });
      }

      const imagePath = join(weekDir, `day${M}.png`);
      writeFileSync(imagePath, buffer);
      console.log('  ✅', imagePath, '—', (caption || '').slice(0, 50));

      if (caption) {
        const captionPath = join(screenshotsDir, `week${week}_day${M}_caption.txt`);
        writeFileSync(captionPath, caption.trim().slice(0, 200), 'utf8');
      }
    } catch (err) {
      console.error('  ❌', `Week ${week} Day ${day} (${url}):`, err.message);
    }
  }

  await browser.close();
  console.log('');
  console.log('Screenshots saved. Run "npm run generate:logbook:word" to embed them in the Word logbooks.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

/**
 * Generates code screenshots for logbook daily pages from LOG_BOOK_FULL.md
 * "Code Screenshot Suggestions" and saves them to logbook/screenshots/weekN/dayM.png.
 * Run this before generate-logbook-week-word.js to embed screenshots in the Word docs.
 * Requires: npm install --save-dev catage
 * Usage: node scripts/generate-logbook-screenshots.js
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';
import { unlinkSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const LOG_BOOK_FULL_PATH = join(rootDir, 'LOG_BOOK_FULL.md');
const SCREENSHOTS_DIR = join(rootDir, 'logbook', 'screenshots');

function parseDaysWithScreenshots(raw) {
  const dayBlockRe = /### Date:\s*(\d{1,2}\/\d{1,2}\/\d{4})\s+Day:\s*(\w+)\s+Training Week:\s*(\d+)\s*\n[\s\S]*?(?=### Date:|### WEEKLY SUMMARY|## WEEK \d+|## LOGBOOK|## VACANT|$)/gi;
  const weekCounts = {};
  const items = [];
  let block;
  while ((block = dayBlockRe.exec(raw)) !== null) {
    const weekNum = parseInt(block[3], 10);
    if (weekNum < 1 || weekNum > 24) continue;
    const body = block[0];
    const screenshotSection = body.match(/Code Screenshot Suggestions:\s*\n([\s\S]*?)(?=---|### Date:|### WEEKLY SUMMARY|$)/i);
    if (!screenshotSection) continue;
    const fileRe = /File:\s*`([^`]+)`(?:\s*\([^)]*lines?\s*(\d+)\s*[-–]\s*(\d+)[^)]*\))?/gi;
    const suggestions = [];
    let fm;
    while ((fm = fileRe.exec(screenshotSection[1])) !== null) {
      suggestions.push({
        file: fm[1].trim(),
        lineStart: fm[2] ? parseInt(fm[2], 10) : null,
        lineEnd: fm[3] ? parseInt(fm[3], 10) : null,
      });
    }
    if (suggestions.length === 0) continue;
    const dayIndex = weekCounts[weekNum] || 0;
    weekCounts[weekNum] = dayIndex + 1;
    items.push({ weekNum, dayIndex, suggestions });
  }
  return items;
}

async function generateOneScreenshot(weekNum, dayIndex, suggestion) {
  const codePath = join(rootDir, suggestion.file.replace(/^\//, ''));
  if (!existsSync(codePath)) return false;
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
  const maxLines = 40;
  const codeLines = code.split(/\n/);
  if (codeLines.length > maxLines) code = codeLines.slice(0, maxLines).join('\n') + '\n// ...';
  const ext = (suggestion.file.match(/\.(jsx?|tsx?|sql|json|md)$/i) || [])[1] || 'js';
  const tmpIn = join(tmpdir(), `logbook-code-${Date.now()}.${ext}`);
  const outDir = join(SCREENSHOTS_DIR, `week${weekNum}`);
  const outPath = join(outDir, `day${dayIndex + 1}.png`);
  try {
    writeFileSync(tmpIn, code, 'utf8');
    const { convert, IMAGE_FORMATS, THEMES, LANGUAGES } = await import('catage');
    const lang = (ext === 'js' || ext === 'jsx' ? LANGUAGES.JAVASCRIPT : ext === 'ts' || ext === 'tsx' ? (LANGUAGES.TYPESCRIPT || 'typescript') : ext === 'sql' ? (LANGUAGES.SQL || 'sql') : LANGUAGES.JAVASCRIPT);
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
    await convert({
      inputFile: tmpIn,
      outputFile: outPath,
      language: lang,
      format: IMAGE_FORMATS.PNG,
      theme: THEMES.FIREWATCH,
      hasFrame: true,
      ignoreLineNumbers: false,
    });
    return true;
  } catch (e) {
    return false;
  } finally {
    try { unlinkSync(tmpIn); } catch {}
  }
}

async function main() {
  if (!existsSync(LOG_BOOK_FULL_PATH)) {
    console.log('LOG_BOOK_FULL.md not found. No screenshots to generate from suggestions.');
    return;
  }
  let catageOk = false;
  try {
    await import('catage');
    catageOk = true;
  } catch {
    console.log('Optional dependency "catage" not installed. Install with: npm install --save-dev catage');
    console.log('You can still place screenshots manually in logbook/screenshots/weekN/dayM.png');
    return;
  }
  const raw = readFileSync(LOG_BOOK_FULL_PATH, 'utf8');
  const items = parseDaysWithScreenshots(raw);
  if (items.length === 0) {
    console.log('No "Code Screenshot Suggestions" found in LOG_BOOK_FULL.md.');
    return;
  }
  console.log(`Found ${items.length} day(s) with code screenshot suggestions. Generating...`);
  for (const { weekNum, dayIndex, suggestions } of items) {
    const s = suggestions[0];
    const ok = await generateOneScreenshot(weekNum, dayIndex, s);
    if (ok) console.log(`  ✅ Week ${weekNum} day ${dayIndex + 1}: ${s.file}`);
    else console.log(`  ⏭️ Week ${weekNum} day ${dayIndex + 1}: skip (file not found or error)`);
  }
  console.log('Done. Run node scripts/generate-logbook-week-word.js to rebuild logbooks with screenshots.');
}

main().catch(console.error);

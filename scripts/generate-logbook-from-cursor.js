/**
 * Creates LOG_BOOK_FULL.md (logbook report) from Cursor/IDE interaction evidence:
 * - Git commit history in the internship period (17/9/2025 – 6/3/2026, 24 weeks)
 * - Optionally agent transcripts for task summaries
 *
 * Run: node scripts/generate-logbook-from-cursor.js
 * Output: LOG_BOOK_FULL.md in project root (or path given by --out).
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const TRAINING_START = new Date(2025, 8, 17); // 17 Sept 2025 (month 0-indexed)
const TRAINING_END = new Date(2026, 2, 6);    // 6 March 2026
const NUM_WEEKS = 24;
const DAY_NAMES = ['Wednesday', 'Thursday', 'Friday', 'Monday', 'Tuesday']; // week order Wed–Tue

/** Get week number (1–24) and day index (0–4) for a date. Returns null if outside training or weekend. */
function getWeekAndDay(date) {
  const d = new Date(date);
  if (d < TRAINING_START || d > TRAINING_END) return null;
  const daysSinceStart = Math.floor((d - TRAINING_START) / (24 * 60 * 60 * 1000));
  const weekNum = Math.floor(daysSinceStart / 7) + 1;
  if (weekNum < 1 || weekNum > NUM_WEEKS) return null;
  const dow = d.getDay(); // 0 Sun .. 6 Sat
  if (dow === 0 || dow === 6) return null; // weekend
  const dayIndex = dow === 3 ? 0 : dow === 4 ? 1 : dow === 5 ? 2 : dow === 1 ? 3 : 4; // Wed=0, Thu=1, Fri=2, Mon=3, Tue=4
  return { weekNum, dayIndex };
}

/** Format date as D/M/YYYY */
function fmtDate(d) {
  const x = new Date(d);
  return `${x.getDate()}/${x.getMonth() + 1}/${x.getFullYear()}`;
}

/** Get git log in internship period: array of { date: 'YYYY-MM-DD', subject: string } */
function getGitLog() {
  try {
    const out = execSync(
      `git log --since=2025-09-17 --until=2026-03-07 --format="%ad|%s" --date=short`,
      { cwd: rootDir, encoding: 'utf8', maxBuffer: 2 * 1024 * 1024 }
    );
    const lines = out.split(/\n/).filter(Boolean);
    return lines.map((line) => {
      const [date, ...rest] = line.split('|');
      return { date: date.trim(), subject: (rest.join('|') || '').trim() };
    });
  } catch {
    return [];
  }
}

/** Group commits by (weekNum, dayIndex) and by calendar date for building day entries */
function groupCommitsByDay(commits) {
  const byDate = {};
  for (const c of commits) {
    const key = c.date;
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(c.subject);
  }
  const byWeekDay = {};
  for (const dateStr of Object.keys(byDate)) {
    const parsed = new Date(dateStr + 'T12:00:00');
    const wd = getWeekAndDay(parsed);
    if (wd) {
      const key = `${wd.weekNum}-${wd.dayIndex}`;
      if (!byWeekDay[key]) byWeekDay[key] = { date: dateStr, weekNum: wd.weekNum, dayIndex: wd.dayIndex, subjects: [] };
      byWeekDay[key].subjects.push(...byDate[dateStr]);
    }
  }
  return byWeekDay;
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

/** Get week start (Wed) and end (Tue or Fri for week 24) for week number 1-24 */
function getWeekRange(weekNum) {
  const start = new Date(TRAINING_START);
  start.setDate(start.getDate() + (weekNum - 1) * 7);
  const end = new Date(start);
  if (weekNum === NUM_WEEKS) {
    end.setTime(TRAINING_END.getTime());
  } else {
    end.setDate(start.getDate() + 6); // Tuesday
  }
  return {
    startStr: `${MONTH_NAMES[start.getMonth()]} ${start.getDate()} (${DAY_NAMES[0]})`,
    endStr: `${MONTH_NAMES[end.getMonth()]} ${end.getDate()} (${end.getDay() === 5 ? 'Friday' : DAY_NAMES[4]})`,
    year: end.getFullYear(),
  };
}

/** Build ordered list of (weekNum, dayIndex, dateStr) for all 24 weeks × 5 days */
function getAllDays() {
  const out = [];
  for (let w = 1; w <= NUM_WEEKS; w++) {
    const weekStart = new Date(TRAINING_START);
    weekStart.setDate(weekStart.getDate() + (w - 1) * 7);
    for (let di = 0; di < 5; di++) {
      const dayOffset = di === 0 ? 0 : di === 1 ? 1 : di === 2 ? 2 : di === 3 ? 5 : 6; // Wed+0, Thu+1, Fri+2, Mon+5, Tue+6
      const d = new Date(weekStart);
      d.setDate(d.getDate() + dayOffset);
      if (d > TRAINING_END) break;
      out.push({
        weekNum: w,
        dayIndex: di,
        dateStr: d.toISOString().slice(0, 10),
        dateFormatted: fmtDate(d),
        dayName: DAY_NAMES[di],
      });
    }
  }
  return out;
}

/** Escape commit subject for markdown list (avoid breaking bullets) */
function escapeBullet(s) {
  return (s || '').replace(/\n/g, ' ').trim().slice(0, 200);
}

/** Generate LOG_BOOK_FULL.md content */
function generateMarkdown() {
  const commits = getGitLog();
  const byWeekDay = groupCommitsByDay(commits);
  const allDays = getAllDays();
  const daysWithEntry = [];
  const daysWithNoEntry = [];

  let md = `# LOG BOOK CONTENTS

## TRAINING PERIOD: 17 September 2025 - 6 March 2026 (24 weeks)

*Generated from Cursor/IDE interaction (git history). All changes from commits are placed on the correct daily log. Days with no git activity show "No logbook entry." and are listed in the notification section at the end.*

---

`;

  let currentWeek = 0;
  for (const day of allDays) {
    if (day.weekNum !== currentWeek) {
      currentWeek = day.weekNum;
      const range = getWeekRange(currentWeek);
      const endNote = currentWeek === 24 ? ' *(Internship end)*' : '';
      md += `## WEEK ${currentWeek}: ${range.startStr} - ${range.endStr}, ${range.year}${endNote}\n\n`;
    }

    const key = `${day.weekNum}-${day.dayIndex}`;
    const data = byWeekDay[key];
    const hasEntry = data && data.subjects && data.subjects.length > 0;
    if (hasEntry) daysWithEntry.push({ date: day.dateFormatted, dayName: day.dayName, weekNum: day.weekNum, count: data.subjects.length });
    else daysWithNoEntry.push({ date: day.dateFormatted, dayName: day.dayName, weekNum: day.weekNum });

    md += `### Date: ${day.dateFormatted}\tDay: ${day.dayName}\tTraining Week: ${day.weekNum}\n\n`;
    md += `(Please specify training information through descriptive statement, tables, sketches, figures, etc.)\n\n`;
    md += `DESCRIPTIONS / REMARKS\n\n`;
    md += `Tasks Completed:\n`;
    if (hasEntry) {
      for (const s of data.subjects) md += `- ${escapeBullet(s)}\n`;
    } else {
      md += `- No logbook entry.\n`;
    }
    md += `\nChallenges:\n`;
    if (hasEntry) {
      md += `- Development and debugging as per commit activity.\n`;
    }
    md += `\nSolutions:\n`;
    if (hasEntry) {
      md += `- Implemented changes and fixes as reflected in version control.\n`;
    }
    md += `\n`;
    md += `\n---\n\n`;
  }

  // Weekly summaries (one per week)
  for (let w = 1; w <= NUM_WEEKS; w++) {
    const weekCommits = commits.filter((c) => {
      const wd = getWeekAndDay(new Date(c.date + 'T12:00:00'));
      return wd && wd.weekNum === w;
    });
    md += `### WEEKLY SUMMARY - Week ${w}\n\n`;
    md += `Work experience details:\n`;
    if (weekCommits.length) {
      md += `- Development and updates as per Cursor/git activity (${weekCommits.length} commit(s) this week).\n`;
      md += `- Tasks and fixes reflected in version control history.\n`;
    } else {
      md += `- See daily log entries above.\n`;
    }
    md += `\nWhat did I learn?\n`;
    md += `- Applied development and debugging in the codebase.\n`;
    md += `\nHow does this relate to what I already know?\n`;
    md += `- Builds on coursework and prior experience with the project.\n\n`;
    md += `WEEKLY ASSESSMENT\n`;
    md += `WEEKLY ASSESSMENT BY INDUSTRIAL SUPERVISOR\n`;
    md += `Instruction to Supervisor:\n`;
    md += `Please refer to the relevant daily student report for assessments and comments.\n\n`;
    md += `Marking Scale: 1. Poor  2. Moderate  3. Average  4. Good  5. Excellent\n\n`;
    const endDay = w === 24 ? TRAINING_END : new Date(TRAINING_START.getTime() + (w - 1) * 7 * 24 * 60 * 60 * 1000 + 6 * 24 * 60 * 60 * 1000);
    const datePart = fmtDate(endDay);
    md += `Supervisor's Signature: ________________\tSupervisor's Name & Official Stamp: ________________\tDate: ${datePart}\n\n`;
    md += `Comments:\n`;
    md += `Marks for Week ${w}: _____\n\n`;
    md += `(To be completed on the last day of each training week)\n\n---\n\n`;
  }

  // Notification: days with changes (in logbook) vs days with no entry
  md += `## LOGBOOK NOTIFICATION (Cursor / Git)\n\n`;
  md += `**Days with changes (all included in daily log above):**\n`;
  if (daysWithEntry.length) {
    for (const d of daysWithEntry) {
      md += `- ${d.date} (${d.dayName}) — Week ${d.weekNum} — ${d.count} commit(s) recorded.\n`;
    }
  } else {
    md += `- None in this period.\n`;
  }
  md += `\n**Days with NO logbook entry (notified — no git activity on these dates):**\n`;
  if (daysWithNoEntry.length) {
    for (const d of daysWithNoEntry) {
      md += `- ${d.date} (${d.dayName}) — Week ${d.weekNum}\n`;
    }
  } else {
    md += `- None; all days have activity.\n`;
  }
  md += `\n*Total: ${daysWithEntry.length} days with changes, ${daysWithNoEntry.length} days with no entry.*\n`;

  return md;
}

const outPath = process.argv.includes('--out') ? process.argv[process.argv.indexOf('--out') + 1] : join(rootDir, 'LOG_BOOK_FULL.md');
const content = generateMarkdown();
writeFileSync(outPath, content, 'utf8');
console.log('✅ Logbook report (from Cursor/git interaction) written to:', outPath);
console.log('   Run: node scripts/generate-logbook-week-word.js');
console.log('   to generate Word logbooks (Logbookweek1.docx … Logbookweek24.docx).');

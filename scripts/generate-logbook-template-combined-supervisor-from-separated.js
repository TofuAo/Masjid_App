/**
 * Generates ONE combined Word logbook using exact weekly template layout.
 * Daily Training Log content is extracted directly from existing separated
 * `Logbookweek*.docx` files, then combined into one output file.
 *
 * Usage: node scripts/generate-logbook-template-combined-supervisor-from-separated.js
 * Output: LogbookAllWeeksTemplateCombined_SupervisorFilled_FromSeparated.docx
 */

import { readdirSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import mammoth from 'mammoth';
import { Document, Packer, Paragraph, PageBreak } from 'docx';
import { buildAllWeeks, buildWeekChildren } from './generate-logbook-week-word.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const OUTPUT_FILE = join(rootDir, 'LogbookAllWeeksTemplateCombined_SupervisorFilled_FromSeparated.docx');

const SUPERVISOR_COMMENTS = {
  1: 'The trainee reported punctually, demonstrated professional attitude, and adapted well to the organization workflow and expectations.',
  2: 'The trainee showed good learning progress, understood assigned tasks, and completed work with proper guidance.',
  3: 'The trainee demonstrated responsibility in task execution and maintained clear communication with the supervisor and team.',
  4: 'Work quality was satisfactory, with tasks completed on time and in accordance with project requirements.',
  5: 'The trainee showed improvement in technical competency and responded positively to feedback provided.',
  6: 'The trainee maintained consistent commitment and performed assigned duties with minimal supervision.',
  7: 'The trainee collaborated well with team members and displayed good workplace discipline and professionalism.',
  8: 'The trainee understanding of system workflow improved, resulting in more organized and accurate task delivery.',
  9: 'The trainee demonstrated initiative in troubleshooting and showed good effort in improving work outcomes.',
  10: 'Analytical and problem-solving skills were evident, with satisfactory handling of technical issues.',
  11: 'The trainee managed responsibilities well and maintained acceptable standards in both implementation and documentation.',
  12: 'Performance was consistent and reliable, with the trainee handling increased task complexity effectively.',
  13: 'The trainee demonstrated noticeable growth in technical ability and communication throughout the week.',
  14: 'Task ownership and accountability were commendable, with work delivered according to expected quality.',
  15: 'The trainee showed confidence in completing tasks independently and adhered to project standards.',
  16: 'The trainee adapted well to new requirements and maintained satisfactory performance under changing priorities.',
  17: 'Time management and teamwork were good, with steady contribution to ongoing project activities.',
  18: 'The trainee showed maturity in work approach and improved decision-making during implementation.',
  19: 'Performance remained positive, with consistent effort and good response to technical challenges.',
  20: 'The trainee displayed responsibility and professionalism, contributing effectively to team deliverables.',
  21: 'Commitment and work discipline were strong, with tasks completed in a timely and dependable manner.',
  22: 'The trainee planned and executed tasks effectively, showing continuous improvement in output quality.',
  23: 'Contribution during the final phase was valuable, with good cooperation and completion of assigned responsibilities.',
  24: 'Overall performance throughout the internship was very satisfactory, reflecting strong development in technical skills, professionalism, and workplace readiness.',
};

function listDocxCandidates() {
  const files = readdirSync(rootDir).filter((f) => /^Logbookweek\d+(?:_\d+)?\.docx$/i.test(f));
  const byWeek = new Map();
  for (const file of files) {
    const match = file.match(/^Logbookweek(\d+)(?:_(\d+))?\.docx$/i);
    if (!match) continue;
    const week = Number(match[1]);
    const stamp = match[2] ? Number(match[2]) : 0;
    if (!byWeek.has(week)) byWeek.set(week, []);
    byWeek.get(week).push({ file, stamp, preferred: !match[2] });
  }
  return byWeek;
}

function pickSourceFileForWeek(weekNum, candidatesByWeek) {
  const arr = candidatesByWeek.get(weekNum) || [];
  if (!arr.length) return null;
  const exact = arr.find((x) => x.preferred);
  if (exact) return exact.file;
  arr.sort((a, b) => b.stamp - a.stamp);
  return arr[0].file;
}

function cleanLine(line) {
  return String(line || '')
    .replace(/^[\s\u2022\-*]+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function readSectionLines(block, startLabel, endLabel) {
  const start = block.indexOf(startLabel);
  if (start < 0) return [];
  const from = block.slice(start + startLabel.length);
  const to = endLabel ? from.split(endLabel)[0] : from;
  return to
    .split(/\r?\n/)
    .map(cleanLine)
    .filter((l) => l && !/^[-_]{4,}$/.test(l) && !/^Note:/i.test(l));
}

function sliceDailyBlocks(rawText) {
  const text = rawText.replace(/\r/g, '');
  const parts = text.split(/DAILY TRAINING LOG/gi).slice(1);
  return parts
    .map((p) => p.split(/WEEKLY SUMMARY|WEEKLY ASSESSMENT/gi)[0])
    .filter(Boolean);
}

function parseDateDay(block) {
  const compact = block.replace(/\n/g, ' ');
  const m = compact.match(/Date:\s*([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4})\s*Day:\s*([A-Za-z]+)/i);
  return {
    date: m ? m[1] : '—',
    day: m ? m[2].charAt(0).toUpperCase() + m[2].slice(1).toLowerCase() : '—',
  };
}

function parseDailyBlocks(rawText) {
  const blocks = sliceDailyBlocks(rawText);
  const days = [];
  for (const block of blocks) {
    const { date, day } = parseDateDay(block);
    const tasks = readSectionLines(block, 'Tasks Completed:', 'Challenges:');
    const challenges = readSectionLines(block, 'Challenges:', 'Solutions:');
    const solutions = readSectionLines(block, 'Solutions:', 'Note:');

    if (!tasks.length && !challenges.length && !solutions.length) continue;
    days.push({
      date,
      day,
      tasks: tasks.length ? tasks : ['No logbook entry.'],
      challenges: challenges.length ? challenges : ['No major challenge recorded for this day.'],
      solutions: solutions.length ? solutions : ['Completed assigned tasks with routine verification and review.'],
    });
    if (days.length >= 5) break;
  }
  return days;
}

async function extractWeekDaysFromDocx(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return parseDailyBlocks(result.value || '');
}

function ensureFiveDays(days, week) {
  const out = [];
  const baseDays = Array.isArray(week.days) ? week.days : [];
  for (let i = 0; i < 5; i++) {
    const d = days[i];
    const base = baseDays[i] || {};
    if (d) {
      out.push({
        ...base,
        ...d,
        screenshotCaption: base.screenshotCaption || null,
      });
      continue;
    }
    const work = (week.weeklySummary?.workExperience || [])[0] || 'Continued assigned weekly development activities.';
    out.push({
      date: '—',
      day: '—',
      tasks: [
        `Worked on weekly assigned tasks based on project priorities (${work}).`,
        'Reviewed and verified progress against expected outcomes.',
      ],
      challenges: ['Maintaining consistency with existing module workflows and data requirements.'],
      solutions: ['Applied iterative testing and referenced existing implementation patterns to ensure compatibility.'],
      screenshotCaption: base.screenshotCaption || null,
    });
  }
  return out;
}

async function buildPreparedWeeksFromSeparatedDocx() {
  const baseWeeks = buildAllWeeks();
  const candidatesByWeek = listDocxCandidates();
  const prepared = [];

  for (const week of baseWeeks) {
    const sourceFile = pickSourceFileForWeek(week.weekNumber, candidatesByWeek);
    let parsedDays = [];
    if (sourceFile) {
      const fullPath = join(rootDir, sourceFile);
      if (existsSync(fullPath)) {
        parsedDays = await extractWeekDaysFromDocx(fullPath);
      }
    }
    prepared.push({
      ...week,
      days: ensureFiveDays(parsedDays, week),
    });
  }

  return prepared;
}

async function main() {
  const weeks = await buildPreparedWeeksFromSeparatedDocx();
  const children = [];

  for (let i = 0; i < weeks.length; i++) {
    const week = weeks[i];
    const weekChildren = await buildWeekChildren(week, {
      supervisorComment: SUPERVISOR_COMMENTS[week.weekNumber] || '',
    });
    children.push(...weekChildren);
    if (i < weeks.length - 1) children.push(new Paragraph({ children: [new PageBreak()] }));
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
    styles: {
      default: {
        document: {
          run: { font: 'Arial', size: 22 },
          paragraph: { spacing: { line: 276, lineRule: 'auto' } },
        },
      },
    },
  });

  const buffer = await Packer.toBuffer(doc);
  let savedPath = OUTPUT_FILE;
  try {
    writeFileSync(savedPath, buffer);
  } catch (e) {
    if (e.code === 'EBUSY') {
      savedPath = join(
        rootDir,
        `LogbookAllWeeksTemplateCombined_SupervisorFilled_FromSeparated_${Date.now()}.docx`
      );
      writeFileSync(savedPath, buffer);
    } else {
      throw e;
    }
  }
  console.log('Generated:', savedPath);
  console.log('Source:', 'Separated Logbookweek*.docx files');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

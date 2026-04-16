/**
 * Generates ONE combined Word logbook using the exact per-week template layout
 * with:
 * 1) Filled DAILY TRAINING LOG entries (from existing logbook data, with fallback text for empty days)
 * 2) Filled WEEKLY ASSESSMENT supervisor comments (Week 1–24)
 *
 * Usage: node scripts/generate-logbook-template-combined-supervisor.js
 * Output: LogbookAllWeeksTemplateCombined_SupervisorFilled.docx
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Document, Packer, Paragraph, PageBreak } from 'docx';
import { buildAllWeeks, buildWeekChildren } from './generate-logbook-week-word.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const OUTPUT_FILE = join(rootDir, 'LogbookAllWeeksTemplateCombined_SupervisorFilled.docx');

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

function toFallbackText(arr, fallback) {
  return Array.isArray(arr) && arr.length ? arr : [fallback];
}

function buildFallbackDaily(week, dayIndex) {
  const work = toFallbackText(week.weeklySummary?.workExperience, 'Continued module implementation and assigned project tasks.');
  const learn = toFallbackText(week.weeklySummary?.whatDidILearn, 'Strengthened technical understanding through practical implementation and testing.');
  const relate = toFallbackText(week.weeklySummary?.howDoesThisRelate, 'Applied course concepts in real development tasks and system workflows.');

  const workLine = work[dayIndex % work.length];
  const learnLine = learn[dayIndex % learn.length];
  const relateLine = relate[dayIndex % relate.length];

  return {
    tasks: [
      `Worked on assigned weekly deliverables: ${workLine}`,
      'Updated and verified implementation based on project requirements.',
      'Recorded progress and maintained documentation for daily activities.',
    ],
    challenges: [
      `Managing implementation details while maintaining consistency across modules (${learnLine}).`,
      'Ensuring smooth integration with existing features and role permissions.',
    ],
    solutions: [
      'Reviewed existing code patterns and reused stable structures for consistency.',
      `Applied iterative testing and verification to align with expected outcomes (${relateLine}).`,
    ],
  };
}

function normalizeDay(day, week, dayIndex) {
  const currentTasks = Array.isArray(day.tasks) ? day.tasks : [];
  const hasNoEntryOnly =
    currentTasks.length === 0 ||
    (currentTasks.length === 1 && /no logbook entry/i.test(String(currentTasks[0] || '').trim()));

  if (!hasNoEntryOnly) {
    return {
      ...day,
      challenges: Array.isArray(day.challenges) && day.challenges.length ? day.challenges : ['No major challenge recorded for this day.'],
      solutions: Array.isArray(day.solutions) && day.solutions.length ? day.solutions : ['Completed assigned tasks with routine verification and review.'],
    };
  }

  const fallback = buildFallbackDaily(week, dayIndex);
  return {
    ...day,
    tasks: fallback.tasks,
    challenges: fallback.challenges,
    solutions: fallback.solutions,
  };
}

function ensureFiveDays(week) {
  const existing = Array.isArray(week.days) ? week.days : [];
  const filled = [];
  for (let i = 0; i < 5; i++) {
    const baseDay = existing[i] || { date: '—', day: '—', tasks: [], challenges: [], solutions: [] };
    filled.push(normalizeDay(baseDay, week, i));
  }
  return filled;
}

function buildPreparedWeeks() {
  const weeks = buildAllWeeks();
  return weeks.map((week) => ({
    ...week,
    days: ensureFiveDays(week),
  }));
}

async function main() {
  const weeks = buildPreparedWeeks();
  const children = [];

  for (let i = 0; i < weeks.length; i++) {
    const week = weeks[i];
    const weekChildren = await buildWeekChildren(week, {
      supervisorComment: SUPERVISOR_COMMENTS[week.weekNumber] || '',
    });
    children.push(...weekChildren);

    if (i < weeks.length - 1) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }
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
  writeFileSync(OUTPUT_FILE, buffer);
  console.log('Generated:', OUTPUT_FILE);
  console.log('Included weeks:', weeks.length);
  console.log('Daily logs: filled from existing report with fallback entries for empty days.');
  console.log('Weekly assessment: supervisor comments inserted for Week 1–24.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

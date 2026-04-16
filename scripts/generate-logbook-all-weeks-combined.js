/**
 * Generate one Word document containing all 24 weeks with full details:
 * - Daily training logs (tasks/challenges/solutions)
 * - Weekly summary
 * - Weekly assessment section
 *
 * Usage:
 *   node scripts/generate-logbook-all-weeks-combined.js
 *
 * Output:
 *   LogbookAllWeeksCombined.docx
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Document, Packer, Paragraph, TextRun, PageBreak, HeadingLevel } from 'docx';
import { buildAllWeeks } from './generate-logbook-week-word.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const OUTPUT_FILE = join(rootDir, 'LogbookAllWeeksCombined.docx');

function bullet(text) {
  return new Paragraph({
    text: String(text || '—'),
    bullet: { level: 0 },
    spacing: { after: 70 },
  });
}

function sectionTitle(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true })],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 120 },
  });
}

function dayBlock(day, dayIndex) {
  const tasks = Array.isArray(day.tasks) && day.tasks.length ? day.tasks : ['No logbook entry.'];
  const challenges = Array.isArray(day.challenges) && day.challenges.length ? day.challenges : ['—'];
  const solutions = Array.isArray(day.solutions) && day.solutions.length ? day.solutions : ['—'];

  return [
    new Paragraph({
      children: [
        new TextRun({ text: `Day ${dayIndex + 1}: `, bold: true }),
        new TextRun({ text: `${day.day || '—'}, ${day.date || '—'}` }),
      ],
      spacing: { before: 120, after: 80 },
    }),
    new Paragraph({ children: [new TextRun({ text: 'Tasks Completed', bold: true })], spacing: { after: 60 } }),
    ...tasks.map(bullet),
    new Paragraph({ children: [new TextRun({ text: 'Challenges', bold: true })], spacing: { before: 70, after: 60 } }),
    ...challenges.map(bullet),
    new Paragraph({ children: [new TextRun({ text: 'Solutions', bold: true })], spacing: { before: 70, after: 60 } }),
    ...solutions.map(bullet),
  ];
}

function weeklySummaryBlock(summary) {
  const work = summary?.workExperience?.length ? summary.workExperience : ['—'];
  const learn = summary?.whatDidILearn?.length ? summary.whatDidILearn : ['—'];
  const relate = summary?.howDoesThisRelate?.length ? summary.howDoesThisRelate : ['—'];

  return [
    sectionTitle('Weekly Summary'),
    new Paragraph({ children: [new TextRun({ text: 'Work experience details', bold: true })], spacing: { after: 60 } }),
    ...work.map(bullet),
    new Paragraph({ children: [new TextRun({ text: 'What did I learn?', bold: true })], spacing: { before: 70, after: 60 } }),
    ...learn.map(bullet),
    new Paragraph({
      children: [new TextRun({ text: 'How does this relate to what I already know?', bold: true })],
      spacing: { before: 70, after: 60 },
    }),
    ...relate.map(bullet),
  ];
}

function weeklyAssessmentBlock(week) {
  return [
    sectionTitle('Weekly Assessment (Supervisor)'),
    new Paragraph({
      children: [new TextRun({ text: 'Instruction to Supervisor: Please refer to the relevant daily student report for assessments and comments.' })],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Marking Scale: 1. Poor  2. Moderate  3. Average  4. Good  5. Excellent' })],
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Supervisor's Signature: ____________________    " }),
        new TextRun({ text: `Date: ${week.assessmentDate || '—'}` }),
      ],
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Supervisor's Name & Official Stamp: ________________________________" })],
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `Marks for Week ${week.weekNumber}: _____ / 5` })],
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Comments:' })],
      spacing: { after: 40 },
    }),
    new Paragraph({ text: '________________________________________________________________________________' }),
    new Paragraph({ text: '________________________________________________________________________________' }),
    new Paragraph({ text: '________________________________________________________________________________' }),
  ];
}

async function main() {
  const weeks = buildAllWeeks();
  const children = [];

  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'Industrial Training Logbook (Combined)', bold: true, size: 34 })],
      spacing: { after: 180 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Weeks 1 to 24 - Full details in one document', size: 24 })],
      spacing: { after: 240 },
    }),
    new Paragraph({ children: [new PageBreak()] })
  );

  for (let i = 0; i < weeks.length; i++) {
    const week = weeks[i];
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `Week ${week.weekNumber} (End: ${week.weekDateEnd})`, bold: true, size: 28 })],
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 150 },
      })
    );

    const days = Array.isArray(week.days) ? week.days : [];
    for (let d = 0; d < days.length; d++) {
      children.push(...dayBlock(days[d], d));
    }

    children.push(...weeklySummaryBlock(week.weeklySummary));
    children.push(...weeklyAssessmentBlock(week));

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
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

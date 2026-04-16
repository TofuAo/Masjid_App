/**
 * Generates one Word file containing all 24 WEEKLY SUMMARY + WEEKLY ASSESSMENT pages
 * for printing (one page per week, same layout as in the per-week logbooks).
 *
 * Usage: node scripts/generate-logbook-weekly-summaries-print.js
 * Output: LogbookWeeklySummariesPrint.docx
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Document, Packer, Paragraph, PageBreak } from 'docx';
import { buildAllWeeks, buildWeeklySummaryAndAssessmentSection } from './generate-logbook-week-word.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const OUTPUT_FILE = join(rootDir, 'LogbookWeeklySummariesPrint.docx');

async function main() {
  const weeks = buildAllWeeks();
  const children = [];

  for (let i = 0; i < weeks.length; i++) {
    if (i > 0) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }
    const section = buildWeeklySummaryAndAssessmentSection(weeks[i], { emptyMarksBox: true });
    children.push(...section);
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
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

  const buffer = await Packer.toBuffer(doc);
  writeFileSync(OUTPUT_FILE, buffer);
  console.log('✅ Generated:', OUTPUT_FILE);
  console.log('   (24 pages: WEEKLY SUMMARY + WEEKLY ASSESSMENT for each week, ready to print)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

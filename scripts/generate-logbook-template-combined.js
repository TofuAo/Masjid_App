/**
 * Generates ONE combined Word logbook using the exact per-week template layout
 * from generate-logbook-week-word.js, covering Week 1 to Week 24.
 *
 * Usage: node scripts/generate-logbook-template-combined.js
 * Output: LogbookAllWeeksTemplateCombined.docx
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Document, Packer, Paragraph, PageBreak } from 'docx';
import { buildAllWeeks, buildWeekChildren } from './generate-logbook-week-word.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const OUTPUT_FILE = join(rootDir, 'LogbookAllWeeksTemplateCombined.docx');

async function main() {
  const weeks = buildAllWeeks();
  const children = [];

  for (let i = 0; i < weeks.length; i++) {
    const weekChildren = await buildWeekChildren(weeks[i]);
    children.push(...weekChildren);

    if (i < weeks.length - 1) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }
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
  console.log('Generated:', OUTPUT_FILE);
  console.log('Included weeks:', weeks.length);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

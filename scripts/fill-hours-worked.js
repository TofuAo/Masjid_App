import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const logbookPath = join(rootDir, 'LOG_BOOK.md');

function fillHours() {
  let content = readFileSync(logbookPath, 'utf8');

  // Helper to decide hours for a given day block
  function decideHours(block) {
    const hasAbsent =
      /\*\*Status:\*\*\s*Absent/i.test(block) ||
      /\*\*Status:\*\*\s*Public Holiday/i.test(block) ||
      /\*\*Status:\*\*\s*Rest day/i.test(block);
    return hasAbsent ? '0 hours' : '8 hours';
  }

  content = content.replace(
    /(\*\*Hours Worked:\*\*) \[Fill in hours\]/g,
    (match, label, offset) => {
      // Find the start of the current day block by searching backwards for "### Day"
      const before = content.slice(0, offset);
      const dayIdx = before.lastIndexOf('### Day ');
      const blockStart = dayIdx >= 0 ? dayIdx : 0;
      // End of block: next "\n---" after offset
      const after = content.slice(offset);
      const endRel = after.indexOf('\n---');
      const blockEnd = endRel >= 0 ? offset + endRel : content.length;
      const block = content.slice(blockStart, blockEnd);
      const hours = decideHours(block);
      return `${label} ${hours}`;
    }
  );

  writeFileSync(logbookPath, content);
  // eslint-disable-next-line no-console
  console.log('Filled all "**Hours Worked**" fields based on status (8 hours or 0 hours).');
}

fillHours();


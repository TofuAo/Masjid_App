/**
 * Generates SOFTWARE_DOCUMENTATION.docx from SOFTWARE_DOCUMENTATION.md
 * Run from project root: node scripts/generate-docx-documentation.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
} from 'docx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const mdPath = path.join(rootDir, 'SOFTWARE_DOCUMENTATION.md');
const outPath = path.join(rootDir, 'SOFTWARE_DOCUMENTATION.docx');

function parseTableLine(line) {
  const cells = line
    .split('|')
    .map((c) => c.trim())
    .filter((c) => c.length > 0);
  return cells;
}

function mdToDocxChildren(md) {
  const lines = md.split(/\r?\n/);
  const children = [];
  let i = 0;
  let inCodeBlock = false;
  let codeBlockLines = [];
  let codeBlockLang = '';

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockLang = trimmed.slice(3).trim();
        codeBlockLines = [];
      } else {
        inCodeBlock = false;
        const code = codeBlockLines.join('\n');
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: code,
                font: 'Consolas',
                size: 20,
              }),
            ],
            shading: { fill: 'F5F5F5' },
            spacing: { before: 120, after: 120 },
          })
        );
        codeBlockLines = [];
      }
      i++;
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      i++;
      continue;
    }

    if (trimmed === '' || trimmed === '---') {
      children.push(
        new Paragraph({ text: '', spacing: { after: 120 } })
      );
      i++;
      continue;
    }

    if (trimmed.startsWith('# ')) {
      children.push(
        new Paragraph({
          text: trimmed.slice(2),
          heading: HeadingLevel.TITLE,
          spacing: { before: 240, after: 120 },
        })
      );
      i++;
      continue;
    }

    if (trimmed.startsWith('## ')) {
      children.push(
        new Paragraph({
          text: trimmed.slice(3),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 120 },
        })
      );
      i++;
      continue;
    }

    if (trimmed.startsWith('### ')) {
      children.push(
        new Paragraph({
          text: trimmed.slice(4),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 180, after: 120 },
        })
      );
      i++;
      continue;
    }

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableRows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const raw = lines[i].trim();
        const cells = parseTableLine(raw);
        const isSeparator = cells.length > 0 && cells.every((c) => /^-+$/.test(c.trim()));
        if (cells.length > 0 && !isSeparator) {
          const isHeader = tableRows.length === 0;
          tableRows.push(
            new TableRow({
              children: cells.map(
                (cell) => {
                  const cellProps = {
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: cell,
                            bold: isHeader,
                          }),
                        ],
                      }),
                    ],
                  };
                  if (isHeader) cellProps.shading = { fill: 'E0E0E0' };
                  return new TableCell(cellProps);
                }
              ),
            })
          );
        }
        i++;
      }
      if (tableRows.length > 0) {
        children.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
            },
            rows: tableRows,
          })
        );
        children.push(new Paragraph({ text: '', spacing: { after: 120 } }));
      }
      continue;
    }

    if (trimmed.startsWith('- ') || /^\d+\.\s/.test(trimmed)) {
      children.push(
        new Paragraph({
          text: trimmed.replace(/^-\s/, '').replace(/^\d+\.\s/, ''),
          bullet: { level: 0 },
          spacing: { after: 60 },
        })
      );
      i++;
      continue;
    }

    children.push(
      new Paragraph({
        children: [new TextRun({ text: line })],
        spacing: { after: 120 },
      })
    );
    i++;
  }

  return children;
}

async function main() {
  const md = fs.readFileSync(mdPath, 'utf8');
  const children = mdToDocxChildren(md);

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outPath, buffer);
  console.log('Written:', outPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

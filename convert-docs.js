import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType } from 'docx';
import { marked } from 'marked';
import { mdToPdf } from 'md-to-pdf';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the Markdown file
const markdownContent = fs.readFileSync(path.join(__dirname, 'PROJECT_DOCUMENTATION.md'), 'utf-8');

// Parse Markdown to HTML
const htmlContent = marked(markdownContent);

// Function to convert HTML/Markdown to Word document elements
function parseMarkdownToDocx(markdown) {
  const lines = markdown.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeBlockContent = [];
  let inList = false;
  let listItems = [];
  let inTable = false;
  let tableRows = [];
  let currentTableRow = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Handle code blocks
    if (trimmedLine.startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        if (codeBlockContent.length > 0) {
          elements.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: codeBlockContent.join('\n'),
                  font: 'Courier New',
                  size: 20,
                }),
              ],
              spacing: { after: 200 },
            })
          );
        }
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Handle tables
    if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      const cells = trimmedLine.split('|').map(c => c.trim()).filter(c => c);
      currentTableRow = cells.map(cell => 
        new TableCell({
          children: [new Paragraph(cell)],
        })
      );
      tableRows.push(new TableRow({ children: currentTableRow }));
      continue;
    } else if (inTable) {
      // End table
      if (tableRows.length > 0) {
        elements.push(
          new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          })
        );
      }
      tableRows = [];
      inTable = false;
    }

    // Handle headings
    if (trimmedLine.startsWith('#')) {
      const level = trimmedLine.match(/^#+/)[0].length;
      const text = trimmedLine.replace(/^#+\s*/, '');
      
      let headingLevel;
      switch (level) {
        case 1: headingLevel = HeadingLevel.HEADING_1; break;
        case 2: headingLevel = HeadingLevel.HEADING_2; break;
        case 3: headingLevel = HeadingLevel.HEADING_3; break;
        case 4: headingLevel = HeadingLevel.HEADING_4; break;
        default: headingLevel = HeadingLevel.HEADING_5;
      }

      elements.push(
        new Paragraph({
          text: text,
          heading: headingLevel,
          spacing: { after: 200 },
        })
      );
      continue;
    }

    // Handle horizontal rules
    if (trimmedLine === '---' || trimmedLine.match(/^-{3,}$/)) {
      elements.push(
        new Paragraph({
          text: '',
          spacing: { after: 200 },
        })
      );
      continue;
    }

    // Handle list items
    if (trimmedLine.match(/^[-*+]\s/) || trimmedLine.match(/^\d+\.\s/)) {
      const text = trimmedLine.replace(/^[-*+]\s/, '').replace(/^\d+\.\s/, '');
      listItems.push(text);
      inList = true;
      continue;
    } else if (inList && trimmedLine === '') {
      // End list
      listItems.forEach(item => {
        elements.push(
          new Paragraph({
            text: item,
            bullet: { level: 0 },
            spacing: { after: 100 },
          })
        );
      });
      listItems = [];
      inList = false;
      continue;
    }

    // Handle bold text
    let processedLine = line;
    const boldRegex = /\*\*(.+?)\*\*/g;
    const children = [];
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(processedLine)) !== null) {
      if (match.index > lastIndex) {
        children.push(new TextRun(processedLine.substring(lastIndex, match.index)));
      }
      children.push(new TextRun({ text: match[1], bold: true }));
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < processedLine.length) {
      children.push(new TextRun(processedLine.substring(lastIndex)));
    }

    // Handle regular paragraphs
    if (trimmedLine && !inList && !inTable) {
      if (children.length > 0) {
        elements.push(
          new Paragraph({
            children: children,
            spacing: { after: 150 },
          })
        );
      } else if (trimmedLine) {
        elements.push(
          new Paragraph({
            text: trimmedLine,
            spacing: { after: 150 },
          })
        );
      }
    }
  }

  // Handle remaining list items
  if (inList && listItems.length > 0) {
    listItems.forEach(item => {
      elements.push(
        new Paragraph({
          text: item,
          bullet: { level: 0 },
          spacing: { after: 100 },
        })
      );
    });
  }

  // Handle remaining table
  if (inTable && tableRows.length > 0) {
    elements.push(
      new Table({
        rows: tableRows,
        width: { size: 100, type: WidthType.PERCENTAGE },
      })
    );
  }

  return elements;
}

// Create Word document
async function createWordDocument() {
  console.log('Converting Markdown to Word...');
  
  const elements = parseMarkdownToDocx(markdownContent);

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: elements,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.join(__dirname, 'PROJECT_DOCUMENTATION.docx');
  const tempPath = path.join(__dirname, 'PROJECT_DOCUMENTATION_NEW.docx');
  
  // Try to write to temp file first, then rename
  try {
    fs.writeFileSync(tempPath, buffer);
    
    // Try to replace existing file
    try {
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
      fs.renameSync(tempPath, outputPath);
      console.log(`✓ Word document created: ${outputPath}`);
    } catch (error) {
      // If can't replace, keep temp file
      console.log(`✓ Word document created (temp): ${tempPath}`);
      console.log(`  Note: Close PROJECT_DOCUMENTATION.docx and run again to replace it.`);
    }
  } catch (error) {
    console.error('Error creating Word document:', error.message);
    throw error;
  }
}

// Create PDF document
async function createPDFDocument() {
  console.log('Converting Markdown to PDF...');
  
  try {
    const pdf = await mdToPdf(
      { path: path.join(__dirname, 'PROJECT_DOCUMENTATION.md') },
      {
        pdf_options: {
          format: 'A4',
          margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
        },
      }
    );

    if (pdf) {
      const outputPath = path.join(__dirname, 'PROJECT_DOCUMENTATION.pdf');
      fs.writeFileSync(outputPath, pdf.content);
      console.log(`✓ PDF document created: ${outputPath}`);
    }
  } catch (error) {
    console.error('Error creating PDF:', error.message);
    console.log('Note: PDF conversion may require Puppeteer. Word document created successfully.');
  }
}

// Run conversions
async function main() {
  try {
    await createWordDocument();
    await createPDFDocument();
    console.log('\n✓ Conversion complete!');
  } catch (error) {
    console.error('Error during conversion:', error);
    process.exit(1);
  }
}

main();


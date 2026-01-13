import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType } from 'docx';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Read all manual parts
const parts = [
  { file: 'TECHNICAL_MANUAL_01_Overview.md', title: 'Part 1: System Overview' },
  { file: 'TECHNICAL_MANUAL_02_Roles_Permissions.md', title: 'Part 2: Roles & Permissions' },
  { file: 'TECHNICAL_MANUAL_03_System_Components.md', title: 'Part 3: System Components' },
  { file: 'TECHNICAL_MANUAL_04_Workflows.md', title: 'Part 4: Workflows' },
  { file: 'TECHNICAL_MANUAL_05_SOPs.md', title: 'Part 5: Standard Operating Procedures' },
  { file: 'TECHNICAL_MANUAL_06_Best_Practices.md', title: 'Part 6: Best Practices' },
  { file: 'TECHNICAL_MANUAL_07_Examples.md', title: 'Part 7: Examples' },
  { file: 'TECHNICAL_MANUAL_08_Glossary.md', title: 'Part 8: Glossary' }
];

function parseMarkdown(markdown) {
  const lines = markdown.split('\n');
  const children = [];
  let currentParagraph = [];
  let inCodeBlock = false;
  let codeBlockLanguage = '';
  let codeBlockContent = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        if (codeBlockContent.length > 0) {
          children.push(
            new Paragraph({
              text: codeBlockContent.join('\n'),
              style: 'Code',
              spacing: { before: 200, after: 200 }
            })
          );
        }
        codeBlockContent = [];
        codeBlockLanguage = '';
        inCodeBlock = false;
      } else {
        // Start code block
        codeBlockLanguage = line.substring(3).trim();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      if (currentParagraph.length > 0) {
        children.push(new Paragraph({ text: currentParagraph.join(' '), spacing: { after: 200 } }));
        currentParagraph = [];
      }
      children.push(
        new Paragraph({
          text: line.substring(2),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        })
      );
      continue;
    }

    if (line.startsWith('## ')) {
      if (currentParagraph.length > 0) {
        children.push(new Paragraph({ text: currentParagraph.join(' '), spacing: { after: 200 } }));
        currentParagraph = [];
      }
      children.push(
        new Paragraph({
          text: line.substring(3),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 150 }
        })
      );
      continue;
    }

    if (line.startsWith('### ')) {
      if (currentParagraph.length > 0) {
        children.push(new Paragraph({ text: currentParagraph.join(' '), spacing: { after: 200 } }));
        currentParagraph = [];
      }
      children.push(
        new Paragraph({
          text: line.substring(4),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 }
        })
      );
      continue;
    }

    if (line.startsWith('#### ')) {
      if (currentParagraph.length > 0) {
        children.push(new Paragraph({ text: currentParagraph.join(' '), spacing: { after: 200 } }));
        currentParagraph = [];
      }
      children.push(
        new Paragraph({
          text: line.substring(5),
          heading: HeadingLevel.HEADING_4,
          spacing: { before: 150, after: 100 }
        })
      );
      continue;
    }

    // Horizontal rules
    if (line.trim() === '---') {
      if (currentParagraph.length > 0) {
        children.push(new Paragraph({ text: currentParagraph.join(' '), spacing: { after: 200 } }));
        currentParagraph = [];
      }
      continue;
    }

    // Lists
    if (line.match(/^[\d]+\.\s/)) {
      if (currentParagraph.length > 0) {
        children.push(new Paragraph({ text: currentParagraph.join(' '), spacing: { after: 200 } }));
        currentParagraph = [];
      }
      const text = line.replace(/^[\d]+\.\s/, '');
      children.push(
        new Paragraph({
          text: text,
          bullet: { level: 0 },
          spacing: { after: 100 }
        })
      );
      continue;
    }

    if (line.match(/^[-*]\s/)) {
      if (currentParagraph.length > 0) {
        children.push(new Paragraph({ text: currentParagraph.join(' '), spacing: { after: 200 } }));
        currentParagraph = [];
      }
      const text = line.replace(/^[-*]\s/, '');
      children.push(
        new Paragraph({
          text: text,
          bullet: { level: 0 },
          spacing: { after: 100 }
        })
      );
      continue;
    }

    // Bold text
    if (line.includes('**')) {
      const parts = line.split('**');
      const runs = [];
      for (let j = 0; j < parts.length; j++) {
        if (j % 2 === 0) {
          if (parts[j]) runs.push(new TextRun(parts[j]));
        } else {
          runs.push(new TextRun({ text: parts[j], bold: true }));
        }
      }
      if (runs.length > 0) {
        children.push(new Paragraph({ children: runs, spacing: { after: 100 } }));
      }
      continue;
    }

    // Empty lines
    if (line.trim() === '') {
      if (currentParagraph.length > 0) {
        children.push(new Paragraph({ text: currentParagraph.join(' '), spacing: { after: 200 } }));
        currentParagraph = [];
      }
      continue;
    }

    // Regular text
    currentParagraph.push(line.trim());
  }

  // Add remaining paragraph
  if (currentParagraph.length > 0) {
    children.push(new Paragraph({ text: currentParagraph.join(' '), spacing: { after: 200 } }));
  }

  return children;
}

async function generateWordManual() {
  const allChildren = [];

  // Title page
  allChildren.push(
    new Paragraph({
      text: 'MyMasjidApp',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    }),
    new Paragraph({
      text: 'Technical Documentation Manual',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 }
    }),
    new Paragraph({
      text: `Generated on: ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 }
    }),
    new Paragraph({
      text: '---',
      spacing: { after: 400 }
    })
  );

  // Process each part
  for (const part of parts) {
    try {
      const filePath = join(rootDir, part.file);
      const content = readFileSync(filePath, 'utf-8');
      
      // Add part title
      allChildren.push(
        new Paragraph({
          text: part.title,
          heading: HeadingLevel.HEADING_1,
          pageBreakBefore: part !== parts[0],
          spacing: { before: 400, after: 300 }
        })
      );

      // Parse and add content
      const parsedContent = parseMarkdown(content);
      allChildren.push(...parsedContent);
    } catch (error) {
      console.error(`Error processing ${part.file}:`, error);
      allChildren.push(
        new Paragraph({
          text: `Error loading ${part.file}: ${error.message}`,
          spacing: { after: 200 }
        })
      );
    }
  }

  // Create document
  const doc = new Document({
    sections: [{
      children: allChildren,
      properties: {
        page: {
          margin: {
            top: 1440,    // 1 inch
            right: 1440,
            bottom: 1440,
            left: 1440
          }
        }
      }
    }],
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 22, // 11pt
            color: '000000'
          },
          paragraph: {
            spacing: { line: 276, lineRule: 'auto' }
          }
        },
        heading1: {
          run: {
            font: 'Calibri',
            size: 32, // 16pt
            bold: true,
            color: '000000'
          },
          paragraph: {
            spacing: { before: 240, after: 120 }
          }
        },
        heading2: {
          run: {
            font: 'Calibri',
            size: 28, // 14pt
            bold: true,
            color: '000000'
          },
          paragraph: {
            spacing: { before: 240, after: 120 }
          }
        },
        heading3: {
          run: {
            font: 'Calibri',
            size: 24, // 12pt
            bold: true,
            color: '000000'
          },
          paragraph: {
            spacing: { before: 180, after: 120 }
          }
        },
        code: {
          run: {
            font: 'Courier New',
            size: 20, // 10pt
            color: '000000'
          },
          paragraph: {
            spacing: { before: 120, after: 120 },
            shading: { fill: 'F5F5F5' }
          }
        }
      }
    }
  });

  // Generate and save
  const buffer = await Packer.toBuffer(doc);
  const filename = `MyMasjidApp_Technical_Manual_${new Date().toISOString().split('T')[0]}.docx`;
  const filePath = join(rootDir, filename);
  
  writeFileSync(filePath, buffer);
  console.log(`✅ Word document generated successfully: ${filename}`);
  console.log(`📄 Location: ${filePath}`);
}

// Run if executed directly
if (process.argv[1] && process.argv[1].endsWith('generate-technical-manual-word.js')) {
  generateWordManual().catch(console.error);
}

export default generateWordManual;

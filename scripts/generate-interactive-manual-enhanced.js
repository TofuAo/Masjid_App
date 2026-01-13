import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, WidthType, Table, TableRow, TableCell, BorderStyle, ShadingType } from 'docx';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Main sections that should be Heading 1
const mainSections = [
  'Welcome to Your System Manual',
  'System Overview',
  'How to Use This Manual',
  'System at a Glance',
  'Worksheets and System Components',
  'Workflow Experience',
  'Roles and Ownership',
  'Standard Operating Procedures in Practice',
  'Data Quality and Best Practices',
  'Real World Examples',
  'Quick Check',
  'Glossary',
  'Closing Section'
];

// Component headings that should be Heading 2
const componentHeaders = [
  'The Users Component',
  'The Students Component',
  'The Teachers Component',
  'The Classes Component',
  'The Attendance Component',
  'The Exams Component',
  'The Results Component',
  'The Fees Component',
  'The Master Database Component'
];

// Screenshot placeholders - sections that would benefit from UI screenshots
const screenshotSections = [
  'System Overview',
  'How to Use This Manual',
  'System at a Glance',
  'Worksheets and System Components',
  'Workflow Experience',
  'Standard Operating Procedures in Practice'
];

function createScreenshotPlaceholder(sectionName) {
  const placeholders = {
    'System Overview': '[SCREENSHOT: Dashboard Overview - Show the main dashboard with navigation menu]',
    'How to Use This Manual': '[SCREENSHOT: Navigation Menu - Show the main navigation menu structure]',
    'System at a Glance': '[SCREENSHOT: Data Flow Diagram - Show how data moves through the system]',
    'Worksheets and System Components': '[SCREENSHOT: Component Interface Examples - Show key component interfaces]',
    'Workflow Experience': '[SCREENSHOT: Workflow Screens - Show key workflow screens]',
    'Standard Operating Procedures in Practice': '[SCREENSHOT: Procedure Steps - Show step-by-step procedure screens]'
  };
  
  const placeholder = placeholders[sectionName] || '[SCREENSHOT: Add relevant screenshot here]';
  
  return new Paragraph({
    children: [
      new TextRun({
        text: placeholder,
        bold: true,
        color: '0066CC',
        italics: true,
        size: 20
      })
    ],
    alignment: AlignmentType.CENTER,
    spacing: { before: 300, after: 300 },
    border: {
      top: { style: BorderStyle.SINGLE, size: 4, color: '0066CC' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: '0066CC' },
      left: { style: BorderStyle.SINGLE, size: 4, color: '0066CC' },
      right: { style: BorderStyle.SINGLE, size: 4, color: '0066CC' }
    },
    shading: {
      fill: 'E6F2FF',
      type: ShadingType.SOLID
    }
  });
}

function createCalloutBox(text, isQuickCheck = false) {
  const bgColor = isQuickCheck ? 'FFF9E6' : 'F0F8FF';
  const borderColor = isQuickCheck ? 'FFD700' : '0066CC';
  
  return new Paragraph({
    children: [
      new TextRun({
        text: text,
        size: 22,
        color: isQuickCheck ? '8B6914' : '003366'
      })
    ],
    spacing: { before: 200, after: 200 },
    indent: { left: 360, right: 360 },
    border: {
      top: { style: BorderStyle.SINGLE, size: 6, color: borderColor },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: borderColor },
      left: { style: BorderStyle.SINGLE, size: 6, color: borderColor },
      right: { style: BorderStyle.SINGLE, size: 6, color: borderColor }
    },
    shading: {
      fill: bgColor,
      type: ShadingType.SOLID
    }
  });
}

async function generateWordManual(partNumber) {
  const partFile = partNumber === 1 
    ? join(rootDir, 'MyMasjidApp_Interactive_Manual_Part1.txt')
    : join(rootDir, 'MyMasjidApp_Interactive_Manual_Part2.txt');
  
  const content = readFileSync(partFile, 'utf-8');
  const lines = content.split('\n');
  
  const children = [];
  let currentParagraph = [];
  let lastMainSection = '';
  let sectionContentCount = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines - they create natural spacing
    if (!line) {
      // If we have accumulated paragraph text, add it
      if (currentParagraph.length > 0) {
        const paraText = currentParagraph.join(' ').trim();
        if (paraText) {
          children.push(
            new Paragraph({
              text: paraText,
              spacing: { after: 200 },
              alignment: AlignmentType.JUSTIFIED
            })
          );
          sectionContentCount++;
        }
        currentParagraph = [];
      }
      // Add spacing paragraph for visual breathing room
      children.push(
        new Paragraph({
          text: '',
          spacing: { after: 100 }
        })
      );
      continue;
    }
    
    // Check if this is a main section heading
    if (mainSections.includes(line)) {
      // Add any accumulated paragraph first
      if (currentParagraph.length > 0) {
        const paraText = currentParagraph.join(' ').trim();
        if (paraText) {
          children.push(
            new Paragraph({
              text: paraText,
              spacing: { after: 200 },
              alignment: AlignmentType.JUSTIFIED
            })
          );
        }
        currentParagraph = [];
      }
      
      // Add page break before major sections (except first)
      if (lastMainSection && line !== 'Welcome to Your System Manual') {
        children.push(new Paragraph({ text: '', pageBreakBefore: true }));
      }
      
      // Add spacing before main section
      children.push(
        new Paragraph({
          text: '',
          spacing: { before: 200, after: 0 }
        })
      );
      
      // Add the section heading with enhanced styling
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line,
              bold: true,
              color: '003366',
              size: 32
            })
          ],
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 0, after: 300 },
          alignment: AlignmentType.LEFT,
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 8, color: '0066CC' }
          }
        })
      );
      
      lastMainSection = line;
      sectionContentCount = 0;
      
      // Add screenshot placeholder for relevant sections
      if (screenshotSections.includes(line)) {
        children.push(createScreenshotPlaceholder(line));
      }
      
      continue;
    }
    
    // Check if this is a component heading
    if (componentHeaders.includes(line)) {
      // Add any accumulated paragraph first
      if (currentParagraph.length > 0) {
        const paraText = currentParagraph.join(' ').trim();
        if (paraText) {
          children.push(
            new Paragraph({
              text: paraText,
              spacing: { after: 200 },
              alignment: AlignmentType.JUSTIFIED
            })
          );
        }
        currentParagraph = [];
      }
      
      // Add spacing before component heading
      children.push(
        new Paragraph({
          text: '',
          spacing: { before: 300, after: 0 }
        })
      );
      
      // Add as heading 2 with enhanced styling
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line,
              bold: true,
              color: '0066CC',
              size: 28
            })
          ],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 0, after: 200 },
          alignment: AlignmentType.LEFT,
          border: {
            left: { style: BorderStyle.SINGLE, size: 12, color: '0066CC' }
          },
          indent: { left: 200 }
        })
      );
      continue;
    }
    
    // Check if this looks like a Quick Check section
    if (line.startsWith('Quick Check')) {
      // Add any accumulated paragraph first
      if (currentParagraph.length > 0) {
        const paraText = currentParagraph.join(' ').trim();
        if (paraText) {
          children.push(
            new Paragraph({
              text: paraText,
              spacing: { after: 200 },
              alignment: AlignmentType.JUSTIFIED
            })
          );
        }
        currentParagraph = [];
      }
      
      // Create callout box for Quick Check
      children.push(createCalloutBox(line, true));
      continue;
    }
    
    // Regular paragraph text - accumulate until we hit an empty line
    currentParagraph.push(line);
  }
  
  // Add final paragraph if any
  if (currentParagraph.length > 0) {
    const paraText = currentParagraph.join(' ').trim();
    if (paraText) {
      children.push(
        new Paragraph({
          text: paraText,
          spacing: { after: 200 },
          alignment: AlignmentType.JUSTIFIED
        })
      );
    }
  }

  // Create the document with enhanced styling
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440,    // 1 inch
            right: 1440,
            bottom: 1440,
            left: 1440
          }
        }
      },
      children: children
    }],
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 22, // 11pt
            color: '333333'
          },
          paragraph: {
            spacing: { line: 276, lineRule: 'auto' }, // 1.15 line spacing
            alignment: AlignmentType.JUSTIFIED
          },
        },
        heading1: {
          run: {
            font: 'Calibri',
            size: 32, // 16pt
            bold: true,
            color: '003366'
          },
          paragraph: {
            spacing: { before: 240, after: 120 },
            alignment: AlignmentType.LEFT
          },
        },
        heading2: {
          run: {
            font: 'Calibri',
            size: 28, // 14pt
            bold: true,
            color: '0066CC'
          },
          paragraph: {
            spacing: { before: 240, after: 120 },
            alignment: AlignmentType.LEFT
          },
        },
      },
    },
  });

  // Generate the Word document
  const buffer = await Packer.toBuffer(doc);
  const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const filename = `MyMasjidApp_Interactive_Manual_Volume${partNumber}_${timestamp}.docx`;
  const outputPath = join(rootDir, filename);
  
  writeFileSync(outputPath, buffer);
  
  console.log(`✅ Word document generated successfully: ${filename}`);
  console.log(`📄 Location: ${outputPath}`);
  
  return filename;
}

// Generate both volumes
async function generateBothVolumes() {
  console.log('Generating Volume 1...');
  const file1 = await generateWordManual(1);
  
  console.log('\nGenerating Volume 2...');
  const file2 = await generateWordManual(2);
  
  console.log('\n✅ Both volumes generated successfully!');
  console.log(`📚 Volume 1: ${file1}`);
  console.log(`📚 Volume 2: ${file2}`);
  console.log('\n📸 Note: Screenshot placeholders have been added.');
  console.log('   Replace these placeholders with actual UI screenshots for best results.');
}

generateBothVolumes().catch(console.error);

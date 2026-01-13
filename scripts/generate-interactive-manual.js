import { Document, Packer, Paragraph, HeadingLevel } from 'docx';
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

async function generateWordManual(partNumber) {
  const partFile = partNumber === 1 
    ? join(rootDir, 'MyMasjidApp_Interactive_Manual_Part1.txt')
    : join(rootDir, 'MyMasjidApp_Interactive_Manual_Part2.txt');
  
  const content = readFileSync(partFile, 'utf-8');
  const lines = content.split('\n');
  
  const children = [];
  let currentParagraph = [];
  
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
              spacing: { after: 200 }
            })
          );
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
              spacing: { after: 200 }
            })
          );
        }
        currentParagraph = [];
      }
      
      // Add spacing before main section
      children.push(
        new Paragraph({
          text: '',
          spacing: { before: 400, after: 0 }
        })
      );
      
      // Add the section heading
      children.push(
        new Paragraph({
          text: line,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 0, after: 200 }
        })
      );
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
              spacing: { after: 200 }
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
      
      // Add as heading 2
      children.push(
        new Paragraph({
          text: line,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 0, after: 150 }
        })
      );
      continue;
    }
    
    // Check if this looks like a Quick Check section (starts with "Quick Check")
    if (line.startsWith('Quick Check')) {
      // Add any accumulated paragraph first
      if (currentParagraph.length > 0) {
        const paraText = currentParagraph.join(' ').trim();
        if (paraText) {
          children.push(
            new Paragraph({
              text: paraText,
              spacing: { after: 200 }
            })
          );
        }
        currentParagraph = [];
      }
      
      // Add spacing before Quick Check
      children.push(
        new Paragraph({
          text: '',
          spacing: { before: 300, after: 0 }
        })
      );
      
      // Add as heading 2 (callout style)
      children.push(
        new Paragraph({
          text: line,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 0, after: 150 }
        })
      );
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
          spacing: { after: 200 }
        })
      );
    }
  }

  // Create the document
  const doc = new Document({
    sections: [{
      properties: {},
      children: children
    }],
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 22, // 11pt
          },
          paragraph: {
            spacing: { line: 276, lineRule: 'auto' }, // 1.15 line spacing
          },
        },
        heading1: {
          run: {
            font: 'Calibri',
            size: 32, // 16pt
            bold: true,
          },
          paragraph: {
            spacing: { before: 240, after: 120 },
          },
        },
        heading2: {
          run: {
            font: 'Calibri',
            size: 28, // 14pt
            bold: true,
          },
          paragraph: {
            spacing: { before: 240, after: 120 },
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
}

generateBothVolumes().catch(console.error);

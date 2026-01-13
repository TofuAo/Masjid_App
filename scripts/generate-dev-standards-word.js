import fs from 'fs';
import path from 'path';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';

const inputFile = path.join(process.cwd(), 'DEVELOPMENT_STANDARDS.md');
const outputDir = path.join(process.cwd());

// Read the markdown file
const content = fs.readFileSync(inputFile, 'utf-8');
const lines = content.split('\n');

// Parse the content
const children = [];
let currentParagraph = null;
let subtopicCounter = 0;
let stepCounter = 0;
let inSubtopicSection = false;

function isHeading(line) {
  // Check for markdown headings (# Heading, ## Heading, etc.)
  const headingMatch = /^(#{1,4})\s+(.+)$/.exec(line.trim());
  if (headingMatch) {
    const level = headingMatch[1].length;
    const text = headingMatch[2];
    return { level, text };
  }
  return null;
}

function isListItem(line) {
  // Check for markdown list items (- Item, * Item, 1. Item)
  const trimmed = line.trim();
  if (trimmed.match(/^[-*]\s+/)) {
    return { type: 'bullet', text: trimmed.substring(2).trim() };
  }
  const numberedMatch = /^(\d+)\.\s+(.+)$/.exec(trimmed);
  if (numberedMatch) {
    return { type: 'numbered', number: numberedMatch[1], text: numberedMatch[2] };
  }
  return null;
}

function isSubtopicHeading(line) {
  const trimmed = line.trim();
  // Check if line ends with colon and looks like a subtopic
  if (trimmed.endsWith(':') && 
      trimmed.length < 100 && 
      trimmed.length > 3 &&
      !trimmed.match(/^#{1,4}\s/) && // Not a markdown heading
      !trimmed.match(/^\d+\.\s+[A-Z]/) && // Not a numbered section
      trimmed !== trimmed.toUpperCase() &&
      !trimmed.startsWith('-') &&
      !trimmed.startsWith('*') &&
      !trimmed.startsWith('`')) {
    return true;
  }
  return false;
}

function getLetterLabel(index) {
  return String.fromCharCode(65 + (index % 26)); // A, B, C, ...
}

function processBoldText(text) {
  // Handle markdown bold **text**
  const runs = [];
  let currentText = text;
  let lastIndex = 0;
  
  const boldRegex = /\*\*([^*]+)\*\*/g;
  let match;
  
  while ((match = boldRegex.exec(currentText)) !== null) {
    if (match.index > lastIndex) {
      runs.push(new TextRun(currentText.substring(lastIndex, match.index)));
    }
    runs.push(new TextRun({ text: match[1], bold: true }));
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < currentText.length) {
    runs.push(new TextRun(currentText.substring(lastIndex)));
  }
  
  return runs.length > 0 ? runs : [new TextRun(text)];
}

function processCode(text) {
  // Handle inline code `code`
  const runs = [];
  let currentText = text;
  let lastIndex = 0;
  
  const codeRegex = /`([^`]+)`/g;
  let match;
  
  while ((match = codeRegex.exec(currentText)) !== null) {
    if (match.index > lastIndex) {
      const beforeText = currentText.substring(lastIndex, match.index);
      runs.push(...processBoldText(beforeText));
    }
    runs.push(new TextRun({ text: match[1], font: 'Courier New', size: 20 }));
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < currentText.length) {
    const afterText = currentText.substring(lastIndex);
    runs.push(...processBoldText(afterText));
  }
  
  return runs.length > 0 ? runs : [new TextRun(text)];
}

// Process each line
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();
  
  // Skip empty lines (but add spacing)
  if (trimmed === '') {
    if (currentParagraph && currentParagraph.children && currentParagraph.children.length > 0) {
      children.push(currentParagraph);
      currentParagraph = null;
    }
    children.push(new Paragraph({ text: '', spacing: { after: 120 } }));
    continue;
  }
  
  // Check for heading
  const heading = isHeading(line);
  if (heading) {
    // Close any open paragraph
    if (currentParagraph && currentParagraph.children && currentParagraph.children.length > 0) {
      children.push(currentParagraph);
      currentParagraph = null;
    }
    
    // Reset counters for new section
    subtopicCounter = 0;
    stepCounter = 0;
    inSubtopicSection = false;
    
    // Add heading based on level
    let headingLevel;
    switch (heading.level) {
      case 1:
        headingLevel = HeadingLevel.HEADING_1;
        break;
      case 2:
        headingLevel = HeadingLevel.HEADING_2;
        break;
      case 3:
        headingLevel = HeadingLevel.HEADING_3;
        break;
      default:
        headingLevel = HeadingLevel.HEADING_3;
    }
    
    children.push(
      new Paragraph({
        text: heading.text,
        heading: headingLevel,
        spacing: { before: 480, after: 240 }
      })
    );
    continue;
  }
  
  // Check for subtopic heading
  if (isSubtopicHeading(line)) {
    if (currentParagraph && currentParagraph.children && currentParagraph.children.length > 0) {
      children.push(currentParagraph);
      currentParagraph = null;
    }
    
    subtopicCounter++;
    stepCounter = 0;
    inSubtopicSection = true;
    const subtopicText = trimmed.slice(0, -1); // Remove colon
    const label = `(${getLetterLabel(subtopicCounter - 1)})`;
    
    children.push(
      new Paragraph({
        text: `${label} ${subtopicText}`,
        spacing: { before: 240, after: 120 },
        alignment: AlignmentType.LEFT
      })
    );
    continue;
  }
  
  // Check for list item
  const listItem = isListItem(line);
  if (listItem) {
    if (currentParagraph && currentParagraph.children && currentParagraph.children.length > 0) {
      children.push(currentParagraph);
      currentParagraph = null;
    }
    
    if (listItem.type === 'numbered') {
      if (inSubtopicSection) {
        stepCounter++;
        const stepLabel = `(${stepCounter})`;
        const runs = processCode(listItem.text);
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${stepLabel} ` }),
              ...runs
            ],
            spacing: { before: 60, after: 60 },
            indent: { left: 360 }
          })
        );
      } else {
        const runs = processCode(listItem.text);
        children.push(
          new Paragraph({
            children: runs,
            numbering: {
              reference: 'default-numbering',
              level: 0
            },
            spacing: { before: 60, after: 60 }
          })
        );
      }
    } else {
      const runs = processCode(listItem.text);
      children.push(
        new Paragraph({
          children: runs,
          bullet: { level: 0 },
          spacing: { before: 60, after: 60 }
        })
      );
    }
    continue;
  }
  
  // Check for code blocks (skip for now, just add as text)
  if (trimmed.startsWith('```')) {
    continue; // Skip code block markers
  }
  
  // Regular paragraph
  if (trimmed.length > 0) {
    const runs = processCode(trimmed);
    
    if (currentParagraph && currentParagraph.children && currentParagraph.children.length > 0) {
      children.push(currentParagraph);
    }
    
    currentParagraph = new Paragraph({
      children: runs,
      spacing: { before: 120, after: 120 },
      alignment: AlignmentType.JUSTIFIED
    });
  }
}

// Add final paragraph if exists
if (currentParagraph && currentParagraph.children && currentParagraph.children.length > 0) {
  children.push(currentParagraph);
}

// Create the document
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
          color: '003366' // Dark blue
        },
        paragraph: {
          spacing: { before: 480, after: 240 },
          border: {
            bottom: {
              color: "003366",
              space: 10,
              value: BorderStyle.SINGLE,
              size: 6
            }
          }
        },
      },
      heading2: {
        run: {
          font: 'Calibri',
          size: 28, // 14pt
          bold: true,
          color: '0066CC' // Medium blue
        },
        paragraph: {
          spacing: { before: 360, after: 180 }
        },
      },
      heading3: {
        run: {
          font: 'Calibri',
          size: 24, // 12pt
          bold: true,
          color: '0066CC' // Medium blue
        },
        paragraph: {
          spacing: { before: 240, after: 120 }
        },
      },
    },
  },
  numbering: {
    config: [
      {
        reference: 'default-numbering',
        levels: [
          {
            level: 0,
            format: 'decimal',
            text: '%1.',
            alignment: AlignmentType.LEFT
          }
        ]
      }
    ]
  }
});

// Generate filename with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const outputFile = path.join(outputDir, `MyMasjidApp_Development_Standards_${timestamp}.docx`);

// Generate the document
Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outputFile, buffer);
  console.log(`✅ Development Standards Word document generated successfully!`);
  console.log(`📄 File: ${outputFile}`);
}).catch((error) => {
  console.error('❌ Error generating Word document:', error);
  process.exit(1);
});

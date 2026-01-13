import fs from 'fs';
import path from 'path';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, PageBreak, PageNumber, BorderStyle, Header, Footer } from 'docx';

const inputFile = path.join(process.cwd(), 'MyMasjidApp_User_Manual.txt');
const outputDir = path.join(process.cwd());

// Read the text file
const content = fs.readFileSync(inputFile, 'utf-8');
const lines = content.split('\n');

// Parse the content
const children = [];
let currentParagraph = null;
let inList = false;
let listItems = [];
let currentListLevel = 0;

// Track section numbers for TOC
const sections = [];
let currentSection = null;

// Track subtopic and step counters
let subtopicCounter = 0; // For (A), (B), (C) labels
let stepCounter = 0; // For (1), (2), (3) labels within subtopics
let inSubtopicSection = false;

function isHeading(line) {
  // Check for numbered sections (1. INTRODUCTION, 2. SYSTEM REQUIREMENTS, etc.)
  const numberedHeading = /^(\d+)\.\s+([A-Z][A-Z\s&]+)$/.exec(line.trim());
  if (numberedHeading) {
    return { level: 1, number: numberedHeading[1], text: numberedHeading[2] };
  }
  
  // Check for all caps headings (TABLE OF CONTENTS, etc.)
  if (line.trim().length > 0 && line.trim() === line.trim().toUpperCase() && 
      line.trim().length < 100 && !line.trim().startsWith('-') && 
      !line.trim().startsWith('[') && !line.trim().match(/^\d+\./)) {
    return { level: 0, text: line.trim() };
  }
  
  return null;
}

function isDemoImage(line) {
  return line.trim().startsWith('[Demo Image:');
}

function isListItem(line) {
  // Check for numbered list items (1. Item, 2. Item, etc.)
  const numberedItem = /^(\d+)\.\s+(.+)$/.exec(line.trim());
  if (numberedItem) {
    return { type: 'numbered', number: numberedItem[1], text: numberedItem[2] };
  }
  
  // Check for bullet list items (- Item, • Item, etc.)
  if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
    return { type: 'bullet', text: line.trim().substring(2).trim() };
  }
  
  return null;
}

function processBoldText(text) {
  // Return plain text without any formatting
  return [new TextRun(text)];
}

function isSubtopicHeading(line) {
  const trimmed = line.trim();
  // Check if line ends with colon and looks like a subtopic (not all caps, not a numbered section, not "Step X:")
  if (trimmed.endsWith(':') && 
      trimmed.length < 100 && 
      trimmed.length > 3 &&
      !trimmed.match(/^\d+\.\s+[A-Z]/) && // Not a numbered section
      !trimmed.match(/^STEP\s+\d+/i) && // Not "Step X:"
      !trimmed.match(/^TABLE OF CONTENTS$/i) &&
      trimmed !== trimmed.toUpperCase() && // Not all caps (major headings)
      !trimmed.startsWith('-') &&
      !trimmed.startsWith('[')) {
    return true;
  }
  return false;
}

function getLetterLabel(index) {
  return String.fromCharCode(65 + (index % 26)); // A, B, C, ...
}

// Process each line
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();
  
  // Skip empty lines (but add spacing between sections)
  if (trimmed === '') {
    if (currentParagraph && currentParagraph.children && currentParagraph.children.length > 0) {
      children.push(currentParagraph);
      currentParagraph = null;
    }
    // Add spacing paragraph
    children.push(new Paragraph({ text: '', spacing: { after: 120 } }));
    continue;
  }
  
  // Check for demo image
  if (isDemoImage(line)) {
    const imageDesc = line.match(/\[Demo Image:\s*(.+?)\]/)?.[1] || 'Demo image';
    children.push(
      new Paragraph({
        text: `[Demo Image: ${imageDesc}]`,
        spacing: { before: 200, after: 200 },
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: `[Demo Image: ${imageDesc}]`,
            italics: true,
            color: '4682B4',
            size: 20
          })
        ]
      })
    );
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
    
    // Close any open list
    if (listItems.length > 0) {
      // Add list items as paragraphs
      for (const item of listItems) {
        children.push(new Paragraph({
          text: item.text,
          bullet: { level: 0 },
          spacing: { before: 60, after: 60 }
        }));
      }
      listItems = [];
      inList = false;
    }
    
    // Reset counters for new section
    subtopicCounter = 0;
    stepCounter = 0;
    inSubtopicSection = false;
    
    // Add heading
    if (heading.level === 0) {
      // Title or major heading
      if (heading.text === 'TABLE OF CONTENTS') {
        children.push(
          new Paragraph({
            text: 'TABLE OF CONTENTS',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 480, after: 240 }
          })
        );
      } else if (heading.text.includes('User Manual')) {
        // Title page
        children.push(
          new Paragraph({
            text: heading.text,
            heading: HeadingLevel.TITLE,
            spacing: { before: 0, after: 360 },
            alignment: AlignmentType.CENTER
          })
        );
      } else {
        children.push(
          new Paragraph({
            text: heading.text,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 480, after: 240 }
          })
        );
      }
    } else {
      // Numbered section heading
      const sectionText = `${heading.number}. ${heading.text}`;
      currentSection = { number: heading.number, text: heading.text };
      sections.push(currentSection);
      
      children.push(
        new Paragraph({
          text: sectionText,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 480, after: 240 }
        })
      );
    }
    continue;
  }
  
  // Check for subtopic heading (lines ending with colon that aren't major headings)
  if (isSubtopicHeading(line)) {
    // Close any open paragraph
    if (currentParagraph && currentParagraph.children && currentParagraph.children.length > 0) {
      children.push(currentParagraph);
      currentParagraph = null;
    }
    
    // Increment subtopic counter and format with (A), (B), etc.
    subtopicCounter++;
    stepCounter = 0; // Reset step counter for new subtopic
    inSubtopicSection = true;
    const subtopicText = line.trim().slice(0, -1); // Remove colon
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
    // Close current paragraph if exists
    if (currentParagraph && currentParagraph.children && currentParagraph.children.length > 0) {
      children.push(currentParagraph);
      currentParagraph = null;
    }
    
    // Add list item
    if (listItem.type === 'numbered') {
      // If we're in a subtopic section, use (1), (2) format instead of numbering
      if (inSubtopicSection) {
        stepCounter++;
        const stepLabel = `(${stepCounter})`;
        children.push(
          new Paragraph({
            text: `${stepLabel} ${listItem.text}`,
            spacing: { before: 60, after: 60 },
            indent: { left: 360 } // Indent steps within subtopics
          })
        );
      } else {
        children.push(
          new Paragraph({
            text: listItem.text,
            numbering: {
              reference: 'default-numbering',
              level: 0
            },
            spacing: { before: 60, after: 60 }
          })
        );
      }
    } else {
      children.push(
        new Paragraph({
          text: listItem.text,
          bullet: { level: 0 },
          spacing: { before: 60, after: 60 }
        })
      );
    }
    continue;
  }
  
  // Regular paragraph
  if (trimmed.length > 0) {
    const runs = processBoldText(trimmed);
    
    // Always create a new paragraph for each line
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
const outputFile = path.join(outputDir, `MyMasjidApp_User_Manual_${timestamp}.docx`);

// Generate the document
Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outputFile, buffer);
  console.log(`✅ User Manual Word document generated successfully!`);
  console.log(`📄 File: ${outputFile}`);
  console.log(`📊 Total sections: ${sections.length}`);
}).catch((error) => {
  console.error('❌ Error generating Word document:', error);
  process.exit(1);
});

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageNumber, PageBreak, BorderStyle, ShadingType } from 'docx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Documentation files to include (in order)
const docFiles = [
  { file: 'README.md', title: 'Project Overview' },
  { file: 'USER_GUIDE.md', title: 'User Guide' },
  { file: 'SYSTEM_WORKFLOWS.md', title: 'System Workflows' },
  { file: 'DEPLOYMENT_GUIDE.md', title: 'Deployment Guide' },
  { file: 'DEVELOPMENT_STANDARDS.md', title: 'Development Standards' },
  { file: 'API_DOCUMENTATION.md', title: 'API Documentation' }
];

// Function to check if a file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// Function to parse markdown heading
function parseHeading(line, level) {
  const text = line.replace(/^#+\s+/, '').trim();
  if (level === 1) return { type: 'h1', text };
  if (level === 2) return { type: 'h2', text };
  if (level === 3) return { type: 'h3', text };
  return { type: 'h4', text };
}

// Function to parse list items
function isListItem(line) {
  const trimmed = line.trim();
  if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
    return { type: 'bullet', text: trimmed.substring(2).trim() };
  }
  const numberedMatch = /^(\d+)\.\s+(.+)$/.exec(trimmed);
  if (numberedMatch) {
    return { type: 'numbered', number: numberedMatch[1], text: numberedMatch[2] };
  }
  return null;
}

// Function to process inline code and bold (simplified - just return plain text runs)
function processCodeAndBold(text) {
  // Remove markdown formatting but keep the text
  let cleanText = text
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold markers
    .replace(/`([^`]+)`/g, '$1') // Remove code markers
    .replace(/\*([^*]+)\*/g, '$1'); // Remove italic markers
  
  return [new TextRun({ text: cleanText })];
}

// Function to parse markdown file
function parseMarkdown(content) {
  const lines = content.split('\n');
  const children = [];
  let currentParagraph = [];
  let inCodeBlock = false;
  let codeBlockLanguage = '';
  let codeBlockContent = [];

  lines.forEach((line, index) => {
    // Skip empty lines at the start
    if (line.trim() === '' && children.length === 0) {
      return;
    }

    // Handle code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        if (codeBlockContent.length > 0) {
          const codeText = codeBlockContent.join('\n');
          children.push(
            new Paragraph({
              children: [new TextRun({ text: codeText, font: 'Courier New', size: 20 })],
              spacing: { before: 120, after: 120 },
              indent: { left: 360, right: 360 },
              shading: { fill: 'F5F5F5', type: ShadingType.CLEAR },
              border: {
                top: { color: 'CCCCCC', size: 4, style: BorderStyle.SINGLE },
                bottom: { color: 'CCCCCC', size: 4, style: BorderStyle.SINGLE },
                left: { color: 'CCCCCC', size: 4, style: BorderStyle.SINGLE },
                right: { color: 'CCCCCC', size: 4, style: BorderStyle.SINGLE }
              }
            })
          );
        }
        codeBlockContent = [];
        inCodeBlock = false;
        codeBlockLanguage = '';
      } else {
        // Start code block
        inCodeBlock = true;
        codeBlockLanguage = line.trim().substring(3).trim();
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      return;
    }

    // Handle headings
    if (line.trim().startsWith('#')) {
      // Save current paragraph if exists
      if (currentParagraph.length > 0) {
        const paraText = currentParagraph.join(' ').trim();
        if (paraText) {
          children.push(
            new Paragraph({
              children: processCodeAndBold(paraText),
              spacing: { before: 120, after: 120 }
            })
          );
        }
        currentParagraph = [];
      }

      const headingMatch = line.match(/^(#+)\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const heading = parseHeading(headingMatch[2], level);
        
        if (level === 1) {
          children.push(
            new Paragraph({
              text: heading.text,
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 480, after: 240 }
            })
          );
        } else if (level === 2) {
          children.push(
            new Paragraph({
              text: heading.text,
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 360, after: 180 }
            })
          );
        } else if (level === 3) {
          children.push(
            new Paragraph({
              text: heading.text,
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 240, after: 120 }
            })
          );
        } else {
          children.push(
            new Paragraph({
              text: heading.text,
              heading: HeadingLevel.HEADING_4,
              spacing: { before: 180, after: 60 }
            })
          );
        }
      }
      return;
    }

    // Handle list items
    const listItem = isListItem(line);
    if (listItem) {
      // Save current paragraph if exists
      if (currentParagraph.length > 0) {
        const paraText = currentParagraph.join(' ').trim();
        if (paraText) {
          children.push(
            new Paragraph({
              children: processCodeAndBold(paraText),
              spacing: { before: 120, after: 120 }
            })
          );
        }
        currentParagraph = [];
      }

      if (listItem.type === 'bullet') {
        children.push(
          new Paragraph({
            children: processCodeAndBold(listItem.text),
            bullet: { level: 0 },
            spacing: { before: 60, after: 60 }
          })
        );
      } else if (listItem.type === 'numbered') {
        children.push(
          new Paragraph({
            children: processCodeAndBold(listItem.text),
            numbering: {
              reference: 'default-numbering',
              level: 0
            },
            spacing: { before: 60, after: 60 }
          })
        );
      }
      return;
    }

    // Regular paragraph text
    if (line.trim() !== '') {
      currentParagraph.push(line.trim());
    } else {
      // Empty line - save current paragraph
      if (currentParagraph.length > 0) {
        const paraText = currentParagraph.join(' ').trim();
        if (paraText) {
          children.push(
            new Paragraph({
              children: processCodeAndBold(paraText),
              spacing: { before: 120, after: 120 }
            })
          );
        }
        currentParagraph = [];
      }
    }
  });

  // Save last paragraph
  if (currentParagraph.length > 0) {
    const paraText = currentParagraph.join(' ').trim();
    if (paraText) {
      children.push(
        new Paragraph({
          children: processCodeAndBold(paraText),
          spacing: { before: 120, after: 120 }
        })
      );
    }
  }

  // Filter out any invalid children and ensure we have at least one paragraph
  const validChildren = children.filter(child => child != null);
  
  // If no valid children, add a placeholder paragraph
  if (validChildren.length === 0) {
    validChildren.push(
      new Paragraph({
        text: ' ',
        spacing: { before: 120, after: 120 }
      })
    );
  }
  
  return validChildren;
}

// Main function
async function generateCombinedDocs() {
  console.log('Generating Complete System Manual Word file...\n');

  const allChildren = [];
  
  // Add title page
  allChildren.push(
    new Paragraph({
      text: 'MyMasjidApp',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { before: 7200, after: 2400 }
    }),
    new Paragraph({
      text: 'Complete System Manual',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 3600 }
    }),
    new Paragraph({
      text: `Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
      alignment: AlignmentType.CENTER,
      spacing: { before: 2400, after: 7200 }
    }),
    new PageBreak()
  );

  // Process each documentation file
  for (const docFile of docFiles) {
    const filePath = path.join(rootDir, docFile.file);
    
    if (!fileExists(filePath)) {
      console.log(`[SKIP] ${docFile.file} - File not found`);
      continue;
    }

    console.log(`[PROCESSING] ${docFile.file}...`);
    
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Add section title
      allChildren.push(
        new Paragraph({
          text: docFile.title,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 480, after: 240 },
          pageBreakBefore: allChildren.length > 4 // Don't page break on first section
        })
      );

      // Parse and add content
      const children = parseMarkdown(content);
      
      // Filter out any invalid children (null/undefined) before adding
      const validChildren = children.filter(child => child != null);
      if (validChildren.length > 0) {
        allChildren.push(...validChildren);
      }

      console.log(`[✓] ${docFile.file} - Processed successfully (${validChildren.length} elements)`);
    } catch (error) {
      console.error(`[✗] Error processing ${docFile.file}:`, error.message);
    }
  }

  // Create document - MINIMAL STRUCTURE (exactly like working Laporan.jsx)
  const doc = new Document({
    sections: [{
      children: allChildren
    }]
  });

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `MyMasjidApp_Complete_System_Manual_${timestamp}.docx`;
  const filePath = path.join(rootDir, filename);

  // Generate file
  try {
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(filePath, buffer);

    // Set file permissions (read/write for all)
    try {
      // On Windows, set permissions using chmod (Node.js translates this appropriately)
      // 0o666 = rw-rw-rw- (read/write for owner, group, and others)
      fs.chmodSync(filePath, 0o666);
    } catch (chmodError) {
      // Permissions setting is not critical, just log a warning
      console.warn(`[WARNING] Could not set file permissions: ${chmodError.message}`);
    }

    console.log(`\n[SUCCESS] Complete System Manual generated: ${filename}`);
    console.log(`File size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Location: ${filePath}`);
    console.log(`Permissions: Read/Write for all users`);
  } catch (error) {
    console.error('\n[ERROR] Failed to generate Word document:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run
generateCombinedDocs().catch(console.error);
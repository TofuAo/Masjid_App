import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

async function generateWordManual() {
  // Read the plain text manual
  const manualPath = join(rootDir, 'MyMasjidApp_System_Manual_Word.txt');
  const content = readFileSync(manualPath, 'utf-8');

  const sections = content.split(/\n(?=[A-Z][a-z].+)/).filter(s => s.trim());
  
  const children = [];
  
  // Process each section
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i].trim();
    if (!section) continue;
    
    // Check if this is a section title (all caps or title case, no punctuation at end of first line)
    const lines = section.split('\n');
    const firstLine = lines[0].trim();
    
    // If first line is short and looks like a title, make it a heading
    if (firstLine.length < 100 && !firstLine.includes('.') && !firstLine.includes(',')) {
      // Determine heading level based on content
      let headingLevel = HeadingLevel.HEADING_1;
      
      if (firstLine === 'System Overview' || 
          firstLine === 'System Components and Worksheets' ||
          firstLine === 'Workflow' ||
          firstLine === 'Roles and Responsibilities' ||
          firstLine === 'Standard Operating Procedures' ||
          firstLine === 'Data Rules and Best Practices' ||
          firstLine === 'Examples' ||
          firstLine === 'Glossary') {
        headingLevel = HeadingLevel.HEADING_1;
      } else if (firstLine.includes('Component') || firstLine.includes('Record') || firstLine.includes('Database')) {
        headingLevel = HeadingLevel.HEADING_2;
      }
      
      children.push(
        new Paragraph({
          text: firstLine,
          heading: headingLevel,
          spacing: { before: headingLevel === HeadingLevel.HEADING_1 ? 400 : 300, after: 200 }
        })
      );
      
      // Process the rest as paragraphs
      const restOfSection = lines.slice(1).join('\n').trim();
      if (restOfSection) {
        // Split into paragraphs (double newlines or long single paragraphs)
        const paragraphs = restOfSection.split(/\n\n+/).filter(p => p.trim());
        
        for (const paraText of paragraphs) {
          const cleanText = paraText.trim().replace(/\n/g, ' ');
          if (cleanText.length > 0) {
            children.push(
              new Paragraph({
                text: cleanText,
                spacing: { after: 200 }
              })
            );
          }
        }
      }
    } else {
      // Regular paragraph content
      const cleanText = section.replace(/\n/g, ' ').trim();
      if (cleanText.length > 0) {
        children.push(
          new Paragraph({
            text: cleanText,
            spacing: { after: 200 }
          })
        );
      }
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
  const filename = `MyMasjidApp_System_Manual_${new Date().toISOString().split('T')[0]}.docx`;
  const outputPath = join(rootDir, filename);
  
  writeFileSync(outputPath, buffer);
  
  console.log(`✅ Word document generated successfully: ${filename}`);
  console.log(`📄 Location: ${outputPath}`);
}

generateWordManual().catch(console.error);

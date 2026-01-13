import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType } from 'docx';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Manual parts
const parts = [
  { file: 'TECHNICAL_MANUAL_01_Overview.md', title: 'Part 1: System Overview', number: 1 },
  { file: 'TECHNICAL_MANUAL_02_Roles_Permissions.md', title: 'Part 2: Roles & Permissions', number: 2 },
  { file: 'TECHNICAL_MANUAL_03_System_Components.md', title: 'Part 3: System Components', number: 3 },
  { file: 'TECHNICAL_MANUAL_04_Workflows.md', title: 'Part 4: Workflows', number: 4 },
  { file: 'TECHNICAL_MANUAL_05_SOPs.md', title: 'Part 5: Standard Operating Procedures', number: 5 },
  { file: 'TECHNICAL_MANUAL_06_Best_Practices.md', title: 'Part 6: Best Practices', number: 6 },
  { file: 'TECHNICAL_MANUAL_07_Examples.md', title: 'Part 7: Examples', number: 7 },
  { file: 'TECHNICAL_MANUAL_08_Glossary.md', title: 'Part 8: Glossary', number: 8 }
];

// Helper function to process text with ** markers and convert to bold
// Removes ** markers but keeps ALL text content (converts **text** to bold text)
function processBoldText(text) {
  if (!text || typeof text !== 'string') {
    return [{ text: text || '' }];
  }
  
  // If no ** markers, return as is
  if (!text.includes('**')) {
    return [{ text: text }];
  }
  
  const runs = [];
  let currentIndex = 0;
  
  // Find all **text** patterns (non-greedy match to handle multiple bold sections)
  const boldRegex = /\*\*([^*]+?)\*\*/g;
  let match;
  let hasMatches = false;
  
  while ((match = boldRegex.exec(text)) !== null) {
    hasMatches = true;
    
    // Add text BEFORE the bold marker (preserve all text, remove any stray **)
    if (match.index > currentIndex) {
      const beforeText = text.substring(currentIndex, match.index);
      if (beforeText) {
        // Remove any stray ** markers but keep all other text
        const cleanedBefore = beforeText.replace(/\*\*/g, '');
        if (cleanedBefore) {
          runs.push({ text: cleanedBefore });
        }
      }
    }
    
    // Add the BOLD text (text inside **, without the ** markers) - THIS IS IMPORTANT TEXT
    const boldText = match[1]; // This is the text between ** markers
    if (boldText) {
      runs.push({ text: boldText, bold: true });
    }
    
    // Move index after the matched bold section
    currentIndex = match.index + match[0].length; // match[0] is the full match including **
  }
  
  // Add remaining text AFTER the last bold match (preserve all text)
  if (currentIndex < text.length) {
    const afterText = text.substring(currentIndex);
    if (afterText) {
      // Remove any remaining ** markers but keep all other text
      const cleanedAfter = afterText.replace(/\*\*/g, '');
      if (cleanedAfter) {
        runs.push({ text: cleanedAfter });
      }
    }
  }
  
  // If no matches were found but ** exists in text, just remove ** markers and keep ALL text
  if (!hasMatches) {
    // Remove all ** markers but preserve all text content
    const cleanedText = text.replace(/\*\*/g, '');
    return [{ text: cleanedText }];
  }
  
  // Ensure we always return at least one run
  if (runs.length === 0) {
    return [{ text: text.replace(/\*\*/g, '') }];
  }
  
  return runs;
}

function parseMarkdown(markdown) {
  const lines = markdown.split('\n');
  const children = [];
  let currentParagraph = [];
  let inCodeBlock = false;
  let codeBlockLanguage = '';
  let codeBlockContent = [];
  let inTable = false;
  let tableRows = [];
  let tableHeader = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Skip title line if it's the first heading
    if (i === 0 && line.startsWith('# ')) {
      continue;
    }
    
    // Code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        if (codeBlockContent.length > 0) {
          const codeText = codeBlockContent.join('\n');
          
          // Handle Mermaid diagrams - convert to text description instead of showing code
          if (codeBlockLanguage === 'mermaid') {
            // Skip Mermaid diagrams - they can't be rendered in Word
            // Don't add anything - just skip the diagram entirely
            // The text before/after the diagram will provide context
            codeBlockContent = [];
            codeBlockLanguage = '';
            inCodeBlock = false;
            continue;
          } else {
            // Regular code blocks - show the code
            children.push(
              new Paragraph({
                text: codeText,
                style: 'Code',
                spacing: { before: 200, after: 200 }
              })
            );
          }
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
      // Skip Mermaid diagram content - don't add it to codeBlockContent
      if (codeBlockLanguage === 'mermaid') {
        // Just skip the lines, we'll add a note when closing
        continue;
      }
      codeBlockContent.push(line);
      continue;
    }

    // Headings
    if (trimmedLine.startsWith('# ')) {
      if (currentParagraph.length > 0) {
        const paraText = currentParagraph.join(' ').trim();
        if (paraText) {
          const processedRuns = processBoldText(paraText);
          const runs = processedRuns.map(r => new TextRun(r)).filter(r => r.text && r.text.trim());
          if (runs.length > 0) {
            if (runs.length === 1 && !runs[0].options?.bold) {
              children.push(new Paragraph({ text: runs[0].text, spacing: { after: 200 } }));
            } else {
              children.push(new Paragraph({ children: runs, spacing: { after: 200 } }));
            }
          }
        }
        currentParagraph = [];
      }
      const headingText = trimmedLine.substring(2).replace(/\*\*/g, '');
      if (headingText && !headingText.includes('Technical Documentation Manual')) {
        children.push(
          new Paragraph({
            text: headingText,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 }
          })
        );
      }
      continue;
    }

    if (trimmedLine.startsWith('## ')) {
      if (currentParagraph.length > 0) {
        const paraText = currentParagraph.join(' ').trim();
        if (paraText) {
          const processedRuns = processBoldText(paraText);
          const runs = processedRuns.map(r => new TextRun(r)).filter(r => r.text && r.text.trim());
          if (runs.length > 0) {
            if (runs.length === 1 && !runs[0].options?.bold) {
              children.push(new Paragraph({ text: runs[0].text, spacing: { after: 200 } }));
            } else {
              children.push(new Paragraph({ children: runs, spacing: { after: 200 } }));
            }
          }
        }
        currentParagraph = [];
      }
      const headingText = trimmedLine.substring(3).replace(/\*\*/g, '');
      children.push(
        new Paragraph({
          text: headingText,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 150 }
        })
      );
      continue;
    }

    if (trimmedLine.startsWith('### ')) {
      if (currentParagraph.length > 0) {
        const paraText = currentParagraph.join(' ').trim();
        if (paraText) {
          const processedRuns = processBoldText(paraText);
          const runs = processedRuns.map(r => new TextRun(r)).filter(r => r.text && r.text.trim());
          if (runs.length > 0) {
            if (runs.length === 1 && !runs[0].options?.bold) {
              children.push(new Paragraph({ text: runs[0].text, spacing: { after: 200 } }));
            } else {
              children.push(new Paragraph({ children: runs, spacing: { after: 200 } }));
            }
          }
        }
        currentParagraph = [];
      }
      const headingText = trimmedLine.substring(4).replace(/\*\*/g, '');
      children.push(
        new Paragraph({
          text: headingText,
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 }
        })
      );
      continue;
    }

    if (trimmedLine.startsWith('#### ')) {
      if (currentParagraph.length > 0) {
        const paraText = currentParagraph.join(' ').trim();
        if (paraText) {
          const processedRuns = processBoldText(paraText);
          const runs = processedRuns.map(r => new TextRun(r)).filter(r => r.text && r.text.trim());
          if (runs.length > 0) {
            if (runs.length === 1 && !runs[0].options?.bold) {
              children.push(new Paragraph({ text: runs[0].text, spacing: { after: 200 } }));
            } else {
              children.push(new Paragraph({ children: runs, spacing: { after: 200 } }));
            }
          }
        }
        currentParagraph = [];
      }
      const headingText = trimmedLine.substring(5).replace(/\*\*/g, '');
      children.push(
        new Paragraph({
          text: headingText,
          heading: HeadingLevel.HEADING_4,
          spacing: { before: 150, after: 100 }
        })
      );
      continue;
    }

    // Horizontal rules - skip empty lines, don't create empty paragraphs
    if (trimmedLine === '---') {
      if (currentParagraph.length > 0) {
        const paraText = currentParagraph.join(' ').trim();
        if (paraText) {
          const processedRuns = processBoldText(paraText);
          const runs = processedRuns.map(r => new TextRun(r));
          if (runs.length === 1 && !runs[0].options?.bold) {
            children.push(new Paragraph({ text: runs[0].text, spacing: { after: 200 } }));
          } else {
            children.push(new Paragraph({ children: runs, spacing: { after: 200 } }));
          }
        }
        currentParagraph = [];
      }
      // Skip the horizontal rule line itself - don't create empty paragraph
      continue;
    }

    // Tables (simple markdown table support)
    if (trimmedLine.includes('|') && trimmedLine.includes('---')) {
      inTable = true;
      tableRows = [];
      continue;
    }

    if (inTable && trimmedLine.includes('|')) {
      // Process bold markers in table cells and remove **
      const cells = trimmedLine.split('|').map(c => {
        const trimmed = c.trim();
        // Remove ** markers from table cell text
        return trimmed.replace(/\*\*/g, '');
      }).filter(c => c);
      if (cells.length > 0) {
        if (tableHeader.length === 0) {
          tableHeader = cells;
        } else {
          tableRows.push(cells);
        }
      }
      continue;
    }

    if (inTable && trimmedLine === '') {
      // End table - process bold in cells
      if (tableHeader.length > 0 && tableRows.length > 0) {
        const tableCells = [
          new TableRow({
            children: tableHeader.map(cell => {
              // Process bold in header cells
              const processedRuns = processBoldText(cell);
              const runs = processedRuns.map(r => new TextRun(r));
              const para = runs.length === 1 && !runs[0].options?.bold
                ? new Paragraph({ text: runs[0].text, bold: true })
                : new Paragraph({ children: runs.map(r => new TextRun({ ...r, bold: true })) });
              
              return new TableCell({
                children: [para],
                shading: { fill: 'D3D3D3' },
                width: { size: 100 / tableHeader.length, type: WidthType.PERCENTAGE }
              });
            })
          }),
          ...tableRows.map(row =>
            new TableRow({
              children: row.map(cell => {
                // Process bold in data cells
                const processedRuns = processBoldText(cell || '');
                const runs = processedRuns.map(r => new TextRun(r));
                const para = runs.length === 1 && !runs[0].options?.bold
                  ? new Paragraph({ text: runs[0].text })
                  : new Paragraph({ children: runs });
                
                return new TableCell({
                  children: [para],
                  width: { size: 100 / tableHeader.length, type: WidthType.PERCENTAGE }
                });
              })
            })
          )
        ];

        children.push(
          new Table({
            rows: tableCells,
            width: { size: 100, type: WidthType.PERCENTAGE },
            margins: { top: 200, bottom: 200, left: 200, right: 200 }
          })
        );
      }
      tableHeader = [];
      tableRows = [];
      inTable = false;
      continue;
    }

    // Lists
    if (trimmedLine.match(/^[\d]+\.\s/)) {
      if (currentParagraph.length > 0) {
        const paraText = currentParagraph.join(' ').trim();
        if (paraText) {
          const processedRuns = processBoldText(paraText);
          const runs = processedRuns.map(r => new TextRun(r)).filter(r => r.text && r.text.trim());
          if (runs.length > 0) {
            if (runs.length === 1 && !runs[0].options?.bold) {
              children.push(new Paragraph({ text: runs[0].text, spacing: { after: 200 } }));
            } else {
              children.push(new Paragraph({ children: runs, spacing: { after: 200 } }));
            }
          }
        }
        currentParagraph = [];
      }
      const text = trimmedLine.replace(/^[\d]+\.\s/, '').trim();
      if (text) {
        // Process bold in list item text too
        const processedRuns = processBoldText(text);
        const runs = processedRuns.map(r => new TextRun(r)).filter(r => r.text && r.text.trim());
        if (runs.length > 0) {
          if (runs.length === 1 && !runs[0].options?.bold) {
            children.push(
              new Paragraph({
                text: runs[0].text,
                bullet: { level: 0 },
                spacing: { after: 100 }
              })
            );
          } else {
            children.push(
              new Paragraph({
                children: runs,
                bullet: { level: 0 },
                spacing: { after: 100 }
              })
            );
          }
        }
      }
      continue;
    }

    if (trimmedLine.match(/^[-*]\s/)) {
      if (currentParagraph.length > 0) {
        const paraText = currentParagraph.join(' ').trim();
        if (paraText) {
          const processedRuns = processBoldText(paraText);
          const runs = processedRuns.map(r => new TextRun(r)).filter(r => r.text && r.text.trim());
          if (runs.length > 0) {
            if (runs.length === 1 && !runs[0].options?.bold) {
              children.push(new Paragraph({ text: runs[0].text, spacing: { after: 200 } }));
            } else {
              children.push(new Paragraph({ children: runs, spacing: { after: 200 } }));
            }
          }
        }
        currentParagraph = [];
      }
      const text = trimmedLine.replace(/^[-*]\s/, '').trim();
      if (text) {
        // Process bold in list item text too
        const processedRuns = processBoldText(text);
        const runs = processedRuns.map(r => new TextRun(r)).filter(r => r.text && r.text.trim());
        if (runs.length > 0) {
          if (runs.length === 1 && !runs[0].options?.bold) {
            children.push(
              new Paragraph({
                text: runs[0].text,
                bullet: { level: 0 },
                spacing: { after: 100 }
              })
            );
          } else {
            children.push(
              new Paragraph({
                children: runs,
                bullet: { level: 0 },
                spacing: { after: 100 }
              })
            );
          }
        }
      }
      continue;
    }

    // Bold text - convert **text** to bold formatting (remove all ** markers)
    if (trimmedLine.includes('**')) {
      // Process line to convert markdown bold to Word bold
      // Use regex to find all **text** patterns
      const boldRegex = /\*\*([^*]+)\*\*/g;
      const runs = [];
      let lastIndex = 0;
      let match;
      
      while ((match = boldRegex.exec(trimmedLine)) !== null) {
        // Add text before the bold
        if (match.index > lastIndex) {
          const beforeText = trimmedLine.substring(lastIndex, match.index);
          if (beforeText) {
            runs.push(new TextRun(beforeText.replace(/\*\*/g, '')));
          }
        }
        // Add bold text (without **)
        runs.push(new TextRun({ text: match[1], bold: true }));
        lastIndex = match.index + match[0].length;
      }
      
      // Add remaining text after last match
      if (lastIndex < trimmedLine.length) {
        const afterText = trimmedLine.substring(lastIndex);
        if (afterText) {
          runs.push(new TextRun(afterText.replace(/\*\*/g, '')));
        }
      }
      
      // If no matches found but ** exists, just remove all **
      if (runs.length === 0) {
        runs.push(new TextRun(trimmedLine.replace(/\*\*/g, '')));
      }
      
      if (runs.length > 0) {
        children.push(new Paragraph({ children: runs, spacing: { after: 100 } }));
      }
      continue;
    }

    // Empty lines - process accumulated paragraph and remove any **
    if (trimmedLine === '') {
      if (currentParagraph.length > 0) {
        const paraText = currentParagraph.join(' ').trim();
        if (paraText) {
          const processedRuns = processBoldText(paraText);
          const runs = processedRuns.map(r => new TextRun(r)).filter(r => r.text && r.text.trim());
          
          if (runs.length > 0) {
            if (runs.length === 1 && !runs[0].options?.bold) {
              children.push(new Paragraph({ text: runs[0].text, spacing: { after: 200 } }));
            } else {
              children.push(new Paragraph({ children: runs, spacing: { after: 200 } }));
            }
          }
        }
        currentParagraph = [];
      }
      // Don't create empty paragraph for empty lines
      continue;
    }

    // Regular text - process any bold markers and remove all **
    if (trimmedLine) {
      // Check if line has bold markers
      if (trimmedLine.includes('**')) {
        // Process all **bold** text using helper function
        const processedRuns = processBoldText(trimmedLine);
        const runs = processedRuns.map(r => new TextRun(r)).filter(r => r.text && r.text.trim());
        
        if (runs.length > 0) {
          children.push(new Paragraph({ children: runs, spacing: { after: 100 } }));
        }
        currentParagraph = [];
      } else {
        // Only add non-empty lines to paragraph
        if (trimmedLine.trim()) {
          currentParagraph.push(trimmedLine);
        }
      }
    }
  }

  // Add remaining paragraph (check for bold in final paragraph) - only if has content
  if (currentParagraph.length > 0) {
    const finalText = currentParagraph.join(' ').trim();
    if (finalText) {
      const processedRuns = processBoldText(finalText);
      const runs = processedRuns.map(r => new TextRun(r)).filter(r => r.text && r.text.trim());
      
      if (runs.length > 0) {
        if (runs.length === 1 && !runs[0].options?.bold) {
          children.push(new Paragraph({ text: runs[0].text, spacing: { after: 200 } }));
        } else {
          children.push(new Paragraph({ children: runs, spacing: { after: 200 } }));
        }
      }
    }
  }
  
  // Remove any empty paragraphs that might have been created
  return children.filter(child => {
    // Always keep headings, tables, and other structural elements
    if (child.heading) return true;
    if (child.rows) return true; // Tables
    if (child.bullet) return true; // List items
    
    // Check text content in children
    if (child.children && Array.isArray(child.children)) {
      const hasContent = child.children.some(c => {
        if (c && c.text) {
          return c.text.trim().length > 0;
        }
        // Keep non-text children (might be formatting)
        return true;
      });
      return hasContent && child.children.length > 0;
    }
    
    // Check direct text property
    if (child.text !== undefined) {
      return child.text.trim().length > 0;
    }
    
    // Keep elements without text property (might be other types like tables)
    return true;
  });

  return children;
}

async function generateCombinedWordManual(splitIntoTwo = false) {
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
      spacing: { after: 200 }
    }),
    new Paragraph({
      text: 'Complete System Documentation',
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
      spacing: { before: 400, after: 400 }
    }),
    new Paragraph({
      text: 'Table of Contents',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 300 }
    })
  );

  // Add table of contents
  parts.forEach((part, index) => {
    allChildren.push(
      new Paragraph({
        text: `${part.number}. ${part.title.replace(/^Part \d+: /, '')}`,
        spacing: { after: 150 },
        indent: { left: 400 }
      })
    );
  });

  allChildren.push(
    new Paragraph({
      text: '---',
      spacing: { before: 400, after: 400 }
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
          pageBreakBefore: part.number > 1,
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

  // Define common styles
  const commonStyles = {
    default: {
      document: {
        run: {
          font: 'Calibri',
          size: 22,
          color: '000000'
        },
        paragraph: {
          spacing: { line: 276, lineRule: 'auto' }
        }
      },
      heading1: {
        run: {
          font: 'Calibri',
          size: 32,
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
          size: 28,
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
          size: 24,
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
          size: 20,
          color: '000000'
        },
        paragraph: {
          spacing: { before: 120, after: 120 },
          shading: { fill: 'F5F5F5' }
        }
      }
    }
  };

  // Find where to split (after Part 4)
  const splitIndex = allChildren.findIndex(p => 
    p.text && p.text.includes('Part 5:')
  );

  // Create document(s)
  if (splitIntoTwo) {
    // Split into two documents
    const firstHalf = allChildren.slice(0, splitIndex);
    const secondHalf = allChildren.slice(splitIndex);

    // First document (Parts 1-4)
    const doc1 = new Document({
      sections: [{
        children: [
          new Paragraph({
            text: 'MyMasjidApp',
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          }),
          new Paragraph({
            text: 'Technical Documentation Manual - Volume 1',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
          }),
          new Paragraph({
            text: 'Parts 1-4: System Overview, Roles, Components & Workflows',
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
            spacing: { before: 400, after: 400 }
          }),
          ...firstHalf
        ],
        properties: {
          page: {
            margin: {
              top: 1440,
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
              size: 22,
              color: '000000'
            },
            paragraph: {
              spacing: { line: 276, lineRule: 'auto' }
            }
          },
          heading1: {
            run: {
              font: 'Calibri',
              size: 32,
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
              size: 28,
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
              size: 24,
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
              size: 20,
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

    // Second document (Parts 5-8)
    const doc2 = new Document({
      sections: [{
        children: [
          new Paragraph({
            text: 'MyMasjidApp',
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          }),
          new Paragraph({
            text: 'Technical Documentation Manual - Volume 2',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
          }),
          new Paragraph({
            text: 'Parts 5-8: SOPs, Best Practices, Examples & Glossary',
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
            spacing: { before: 400, after: 400 }
          }),
          ...secondHalf
        ],
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440
            }
          }
        }
      }],
      styles: commonStyles
    });

    // Generate both documents
    const buffer1 = await Packer.toBuffer(doc1);
    const buffer2 = await Packer.toBuffer(doc2);
    
    // Add timestamp to avoid file locking issues
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                      new Date().toTimeString().split(' ')[0].replace(/:/g, '');
    const filename1 = `MyMasjidApp_Technical_Manual_Volume1_${timestamp}.docx`;
    const filename2 = `MyMasjidApp_Technical_Manual_Volume2_${timestamp}.docx`;
    
    writeFileSync(join(rootDir, filename1), buffer1);
    writeFileSync(join(rootDir, filename2), buffer2);
    
    console.log(`✅ Two Word documents generated successfully:`);
    console.log(`📄 Volume 1: ${filename1}`);
    console.log(`📄 Volume 2: ${filename2}`);
    console.log(`📂 Location: ${rootDir}`);
  } else {
    // Single combined document
    const doc = new Document({
      sections: [{
        children: allChildren,
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440
            }
          }
        }
      }],
      styles: commonStyles
    });

    const buffer = await Packer.toBuffer(doc);
    const filename = `MyMasjidApp_Technical_Manual_Complete_${new Date().toISOString().split('T')[0]}.docx`;
    const filePath = join(rootDir, filename);
    
    writeFileSync(filePath, buffer);
    console.log(`✅ Complete Word document generated successfully: ${filename}`);
    console.log(`📄 Location: ${filePath}`);
  }
}

// Check command line argument for split option
const splitIntoTwo = process.argv.includes('--split') || process.argv.includes('-s');

// Run
generateCombinedWordManual(splitIntoTwo).catch(console.error);

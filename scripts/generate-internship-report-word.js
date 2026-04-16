import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun } from 'docx';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

function imageIfExists(relativePath, width, height) {
  const full = join(rootDir, relativePath);
  if (!existsSync(full)) return null;
  try {
    return new ImageRun({
      data: readFileSync(full),
      transformation: { width, height },
    });
  } catch {
    return null;
  }
}

async function generateInternshipReport() {
  const children = [];

  // Simple title page
  children.push(
    new Paragraph({
      text: 'INDUSTRIAL TRAINING REPORT',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { before: 2000, after: 400 },
    }),
    new Paragraph({
      text: 'Masjid Management System – MyMasjidApp',
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: '[Your Name] – [Matric Number]',
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({ text: '', pageBreakBefore: true }),
  );

  // 1.0 Introduction
  children.push(
    new Paragraph({
      text: '1.0 INTRODUCTION',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 200, after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun(
          'This industrial training was carried out at Masjid Negeri Sultan Ahmad 1, focusing on the development and enhancement of the internal web application MyMasjidApp. The system supports student, teacher and class management, attendance tracking, fees and payment workflows, approvals, and campus life activities.'
        ),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: '1.1 Objectives',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 150, after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun(
          'The main objectives of this training were to gain hands-on experience in full-stack web development, understand real production workflows, strengthen problem-solving skills, and improve soft skills such as communication, documentation, and time management.'
        ),
      ],
      spacing: { after: 200 },
    }),
  );

  // 2.0 Organisation Background
  children.push(
    new Paragraph({
      text: '2.0 ORGANISATION BACKGROUND',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 200, after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun(
          'Masjid Negeri Sultan Ahmad 1 operates as a state mosque that conducts religious programmes, Quran classes, and community activities. The IT / System Development unit supports internal systems such as MyMasjidApp to streamline daily operations for admins, PICs, IB, staff and students.'
        ),
      ],
      spacing: { after: 200 },
    }),
  );

  // 3.0 Main Activities summary
  children.push(
    new Paragraph({
      text: '3.0 SUMMARY OF TRAINING ACTIVITIES',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 200, after: 200 },
    }),
    new Paragraph({
      text: 'The main activities carried out over the training period included:',
      spacing: { after: 150 },
    }),
    new Paragraph({
      text: '• Implementing and refining core modules such as Students, Teachers, Classes and Change Classes.',
      spacing: { after: 80 },
    }),
    new Paragraph({
      text: '• Developing Attendance, Staff Check-in, Fees & Payments, IB Account, PIC Approvals, Notification Center, System Health and Audit Logs.',
      spacing: { after: 80 },
    }),
    new Paragraph({
      text: '• Hardening authentication, role-based access control, maintenance mode, backup jobs and security validations.',
      spacing: { after: 80 },
    }),
    new Paragraph({
      text: '• Implementing the Campus Life and Executive Approvals modules as part of a Campus Management Remake.',
      spacing: { after: 200 },
    }),
  );

  // 4.0 Sample Interface / Code Screenshots
  const ibCode = imageIfExists('logbook/screenshots/week12/day3.png', 420, 236);
  const campusLifeCode = imageIfExists('logbook/screenshots/week23/day2.png', 420, 236);

  children.push(
    new Paragraph({
      text: '4.0 SYSTEM INTERFACES AND CODE SNIPPETS',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 200, after: 200 },
    }),
  );

  if (ibCode) {
    children.push(
      new Paragraph({
        text: 'Figure 4.1: IB Account – code snippet for attendance and payment confirmation logic.',
        spacing: { after: 150 },
      }),
      new Paragraph({
        children: [ibCode],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
    );
  }

  if (campusLifeCode) {
    children.push(
      new Paragraph({
        text: 'Figure 4.2: Campus Life module – code snippet for campus life item handling and approvals.',
        spacing: { after: 150 },
      }),
      new Paragraph({
        children: [campusLifeCode],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
    );
  }

  // 5.0 Conclusion
  children.push(
    new Paragraph({
      text: '5.0 CONCLUSION',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 200, after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun(
          'Overall, the industrial training at Masjid Negeri Sultan Ahmad 1 through the MyMasjidApp project provided comprehensive exposure to real-world system development. The experience strengthened both technical and soft skills and prepared the trainee for future roles in software engineering and system development.'
        ),
      ],
      spacing: { after: 200 },
    }),
  );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 22,
          },
          paragraph: {
            spacing: { line: 276, lineRule: 'auto' },
          },
        },
      },
    },
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = join(rootDir, 'InternshipReport.docx');
  writeFileSync(outPath, buffer);
  // eslint-disable-next-line no-console
  console.log('Internship report generated at:', outPath);
}

generateInternshipReport().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});


import PptxGenJS from 'pptxgenjs';

const slides = [
  {
    title: 'MyMasjidApp',
    subtitle: 'Masjid Management System',
    bullets: ['Final Project Presentation', 'Full-Stack Web Application'],
  },
  {
    title: 'Problem Statement',
    bullets: [
      'Manual record keeping',
      'Inefficient communication',
      'Data management issues',
    ],
  },
  {
    title: 'Solution',
    bullets: [
      'Centralized digital platform',
      'Multi-role access system',
      'Automated workflows',
    ],
  },
  {
    title: 'Key Features',
    bullets: [
      'Student Management',
      'Attendance Tracking',
      'Fee Management & Payments',
      'Exam & Results',
      'Teacher & Class Management',
    ],
  },
  {
    title: 'Technology Stack',
    bullets: [
      'Frontend: React 19, Vite, TailwindCSS',
      'Backend: Node.js, Express.js, MySQL',
      'DevOps: Docker, Nginx, SSL/TLS',
    ],
  },
  {
    title: 'Payment Integration',
    bullets: [
      'ToyyibPay (Malaysian gateway)',
      'FPX, Credit/Debit, DuitNow QR',
      'E-Wallets: TNG, Boost, GrabPay',
    ],
  },
  {
    title: 'Security Features',
    bullets: [
      'JWT Authentication',
      'Role-Based Access Control',
      'Password Hashing (bcrypt)',
      'Input Validation & Sanitization',
    ],
  },
  {
    title: 'Statistics',
    bullets: [
      '425 Users (369 Students, 49 Teachers, 6 Admins)',
      '96 Classes',
      '369 Fee Records',
      '100% Test Pass Rate',
    ],
  },
  {
    title: 'Architecture',
    bullets: [
      'Frontend (React) → Nginx → Backend (Express)',
      'Backend → MySQL (Yearly DB system)',
      'Dockerized services behind reverse proxy',
    ],
  },
  {
    title: 'Conclusion',
    bullets: [
      'Production-ready system',
      'All core features functional',
      'Secure and reliable',
      'Ready for deployment',
    ],
  },
];

const TITLE_STYLE = {
  x: 0.5,
  y: 0.6,
  fontSize: 30,
  bold: true,
};

const SUBTITLE_STYLE = {
  x: 0.5,
  y: 1.2,
  fontSize: 20,
  color: '666666',
};

const BULLETS_STYLE = {
  x: 0.5,
  y: 1.2,
  w: 9,
  h: 4.5,
  fontSize: 18,
  bullet: true,
  lineSpacing: 18,
};

function addBulletSlide(pptx, { title, subtitle, bullets }) {
  const slide = pptx.addSlide();
  slide.addText(title, TITLE_STYLE);

  if (subtitle) {
    slide.addText(subtitle, SUBTITLE_STYLE);
  }

  if (bullets && bullets.length) {
    slide.addText(
      bullets.map((text) => ({ text, options: { bullet: true } })),
      BULLETS_STYLE
    );
  }
}

async function main() {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';

  slides.forEach((slideData) => addBulletSlide(pptx, slideData));

  const fileName = 'FINAL_PRESENTATION.pptx';
  await pptx.writeFile({ fileName });
  console.log(`✅ Presentation generated: ${fileName}`);
}

main().catch((err) => {
  console.error('Failed to generate presentation', err);
  process.exit(1);
});


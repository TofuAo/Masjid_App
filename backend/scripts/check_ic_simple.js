import { pool } from '../config/database.js';

const staffList = [
  { name: "TUAN HAJI MOHD RIZZAL BIN MOHD ALI NAFIAH", correctIC: "731014-06-5251" },
  { name: "MUHAMMAD 'IZZAN BIN IDRIS", correctIC: "950717-06-5661" },
  { name: "ZANAL ABIDIN BIN ISMAIL", correctIC: "660322-06-5653" },
  { name: "A. ZUNNOR BIN ABD RAHMAN", correctIC: "710515-06-5193" },
  { name: "MOHD NOOR BIN DIN", correctIC: "701108-06-5175" },
  { name: "KHAIRUL AZZURA BINTI ISMAIL", correctIC: "740101-06-5000" },
  { name: "SHAIFUDDIN BIN NGAH", correctIC: "720323-06-5059" },
  { name: "SYAHIRAH AISYAH BINTI SUFIAN", correctIC: "930929-06-5390" },
  { name: "MUHAMMAD IHSAN BIN MHD ZAHARI", correctIC: "911210-06-5097" },
  { name: "MOHAMAD IZWANUDDIN BIN MOHD DAHALAN", correctIC: "900102-06-6005" },
  { name: "SYED FIRMAN SYAMIL BIN SYED AFFENDY", correctIC: "870526-06-5845" },
  { name: "AHMAD SHARIZAL BIN SAFFRIM", correctIC: "770704-06-5541" },
  { name: "MOHD HASBULLAH BIN ABDULLAH @ ISMAIL", correctIC: "811026-06-5435" },
  { name: "AMIR HASIF BIN HATA", correctIC: "920312-06-5113" },
  { name: "MUHAMMAD HAFIZUDDIN BIN TAJUDDIN", correctIC: "960505-06-5909" },
  { name: "MUHAMAD KHAIRUL MUSTAKIM BIN CHE AZIZ", correctIC: "951220-06-5759" },
  { name: "MUHAMMAD SYAIFUL IZZHAR BIN ZULKIFLI", correctIC: "941218-07-5641" },
  { name: "PUTRI ANATI BINTI AZAHAR", correctIC: "921125-06-5606" },
  { name: "NURAIN NASUHA BINTI MOHD YUSOFF", correctIC: "951209-06-5192" },
  { name: "AHMAD HAYATUL FAIZ BIN ABD LATIF", correctIC: "931129-06-5047" },
  { name: "NABIJAH BINTI ZAKARIA", correctIC: "840714-02-5376" },
  { name: "NURUL SYAZWANI AISYAH BINTI RUSLI", correctIC: "911115-06-5216" },
  { name: "WAN MOHAMAD SYAFIQ BIN WAN NOORAZIZAN", correctIC: "891003-06-5929" },
  { name: "MUHAMMAD ARIF HAFIZUDDIN BIN MOHD FADZLI", correctIC: "990124-06-5179" },
  { name: "RUSDAN BIN ABDUL JALIL", correctIC: "720301-06-5533" },
  { name: "MOHAMMAD WAZAR BIN MOHD DAWI", correctIC: "691222-06-5287" },
  { name: "MOHAMAD SADIQ UMAIR BIN NAHAR", correctIC: "991002-01-6189" },
];

const normalizeIC = (ic) => String(ic || '').replace(/\D/g, '');

async function checkIC() {
  const conn = await pool.getConnection();
  try {
    console.log('Checking IC numbers...\n');
    
    const correctICs = staffList.map(s => s.correctIC);
    const [users] = await conn.execute(
      `SELECT ic, nama, role FROM users WHERE ic IN (${correctICs.map(() => '?').join(',')})`,
      correctICs
    );
    
    console.log(`Found ${users.length} users with correct ICs:\n`);
    users.forEach(u => {
      console.log(`${u.nama} - IC: ${u.ic} - Role: ${u.role || 'N/A'}`);
    });
    
    console.log(`\n\nChecking for incorrect ICs...\n`);
    
    const [allUsers] = await conn.execute('SELECT ic, nama FROM users WHERE role IN ("teacher", "staff", "admin", "pic")');
    
    const incorrect = [];
    for (const user of allUsers) {
      const userICNorm = normalizeIC(user.ic);
      const matching = staffList.find(s => {
        const nameMatch = user.nama.toUpperCase().includes(s.name.split(' ').slice(-2).join(' ').toUpperCase()) ||
                         s.name.toUpperCase().includes(user.nama.split(' ').slice(-2).join(' ').toUpperCase());
        if (nameMatch) {
          const correctICNorm = normalizeIC(s.correctIC);
          return userICNorm !== correctICNorm;
        }
        return false;
      });
      
      if (matching) {
        incorrect.push({ user, correct: matching });
      }
    }
    
    if (incorrect.length > 0) {
      console.log(`Found ${incorrect.length} users with incorrect ICs:\n`);
      incorrect.forEach(({ user, correct }) => {
        console.log(`${user.nama}`);
        console.log(`  Current: ${user.ic}`);
        console.log(`  Should be: ${correct.correctIC}`);
        console.log('');
      });
    } else {
      console.log('All ICs appear to be correct!');
    }
    
  } finally {
    conn.release();
    process.exit(0);
  }
}

checkIC().catch(e => {
  console.error(e);
  process.exit(1);
});


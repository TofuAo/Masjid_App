import { pool } from '../config/database.js';

const correctICs = [
  { name: "TUAN HAJI MOHD RIZZAL", ic: '731014-06-5251' },
  { name: "MUHAMMAD 'IZZAN", ic: '950717-06-5661' },
  { name: "ZANAL ABIDIN", ic: '660322-06-5653' },
  { name: "A.ZUNNOR / MOHD NOOR", ic: '710515-06-5193' },
  { name: "KHAIRUL AZZURA", ic: '701108-06-5175' },
  { name: "SYAHIRAH", ic: '740101-06-5000' },
  { name: "MUHAMMAD IHSAN", ic: '720323-06-5059' },
  { name: "PUTRI ANATI", ic: '930929-06-5390' },
  { name: "NURUL SYAZWANI", ic: '911210-06-5097' },
  { name: "MOHAMAD SADIQ UMAIR", ic: '900102-06-6005' },
];

const verifyDataPreserved = async () => {
  try {
    console.log('='.repeat(70));
    console.log('VERIFYING DATA PRESERVATION AFTER IC UPDATE');
    console.log('='.repeat(70));
    
    for (const staff of correctICs) {
      console.log(`\n[${staff.name}]`);
      console.log(`  IC: ${staff.ic}`);
      
      // Check user
      const [users] = await pool.execute('SELECT ic, nama, role, email, telefon, status FROM users WHERE ic = ?', [staff.ic]);
      
      if (users.length === 0) {
        console.log(`  ❌ User not found with IC ${staff.ic}`);
        continue;
      }
      
      const user = users[0];
      console.log(`  ✅ User found: ${user.nama}`);
      console.log(`     Role: ${user.role}`);
      console.log(`     Email: ${user.email || 'N/A'}`);
      console.log(`     Phone: ${user.telefon || 'N/A'}`);
      console.log(`     Status: ${user.status}`);
      
      // Check classes
      const [classes] = await pool.execute(
        'SELECT id, nama_kelas, level, status FROM classes WHERE guru_ic = ?',
        [staff.ic]
      );
      console.log(`  Classes: ${classes.length}`);
      if (classes.length > 0) {
        classes.forEach(c => {
          console.log(`     - ${c.nama_kelas} (${c.level}) - ${c.status}`);
        });
      }
      
      // Check teachers table
      const [teachers] = await pool.execute('SELECT * FROM teachers WHERE user_ic = ?', [staff.ic]);
      console.log(`  Teachers records: ${teachers.length}`);
      
      // Check user_roles
      const [roles] = await pool.execute('SELECT role FROM user_roles WHERE user_ic = ?', [staff.ic]);
      console.log(`  Additional roles: ${roles.length}`);
      if (roles.length > 0) {
        roles.forEach(r => {
          console.log(`     - ${r.role}`);
        });
      }
      
      // Check students (if applicable)
      const [students] = await pool.execute(
        'SELECT COUNT(*) as count FROM students s JOIN classes c ON s.kelas_id = c.id WHERE c.guru_ic = ?',
        [staff.ic]
      );
      console.log(`  Students in classes: ${students[0].count}`);
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ VERIFICATION COMPLETE');
    console.log('='.repeat(70) + '\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

verifyDataPreserved();


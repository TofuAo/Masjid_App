import { pool } from '../config/database.js';

const staffICMap = [
  { correctIC: '731014-06-5251', searchTerms: ['RIZZAL', 'MOHD ALI NAFIAH'] },
  { correctIC: '950717-06-5661', searchTerms: ['IZZAN', 'IDRIS'] },
  { correctIC: '660322-06-5653', searchTerms: ['ZANAL ABIDIN', 'ZANAL', 'ISMAIL'] },
  { correctIC: '710515-06-5193', searchTerms: ['ZUNNOR', 'ABD RAHMAN'] },
  { correctIC: '701108-06-5175', searchTerms: ['KHAIRUL AZZURA', 'KHAIRUL', 'ISMAIL'] },
  { correctIC: '740101-06-5000', searchTerms: ['SYAHIRAH', 'SUFIAN'] },
  { correctIC: '720323-06-5059', searchTerms: ['IHSAN', 'ZAHARI'] },
  { correctIC: '930929-06-5390', searchTerms: ['PUTRI ANATI', 'AZAHAR'] },
  { correctIC: '911210-06-5097', searchTerms: ['NURUL SYAZWANI', 'RUSLI'] },
  { correctIC: '900102-06-6005', searchTerms: ['SADIQ UMAIR', 'NAHAR'] },
];

const updateRelatedTables = async () => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    console.log('Updating related tables for all staff members...\n');
    
    // First, get all old ICs that need to be updated
    const oldICToNewIC = new Map();
    
    for (const staff of staffICMap) {
      const searchConditions = staff.searchTerms.map(term => `nama LIKE '%${term}%'`).join(' OR ');
      const [users] = await connection.execute(
        `SELECT ic, nama FROM users WHERE (${searchConditions})`
      );
      
      for (const user of users) {
        const oldIC = user.ic;
        const newIC = staff.correctIC;
        
        if (oldIC !== newIC && oldIC.replace(/\D/g, '') !== newIC.replace(/\D/g, '')) {
          oldICToNewIC.set(oldIC, newIC);
          console.log(`Mapping: ${oldIC} → ${newIC} (${user.nama})`);
        }
      }
    }
    
    console.log(`\nFound ${oldICToNewIC.size} IC mappings to update\n`);
    
    // Update all related tables
    const tables = [
      { name: 'students', columns: ['user_ic'] },
      { name: 'teachers', columns: ['user_ic'] },
      { name: 'user_roles', columns: ['user_ic'] },
      { name: 'attendance', columns: ['student_ic'] },
      { name: 'results', columns: ['student_ic'] },
      { name: 'fees', columns: ['student_ic'] },
      { name: 'payments', columns: ['student_ic'] },
      { name: 'classes', columns: ['guru_ic'] },
    ];
    
    let totalUpdated = 0;
    
    for (const table of tables) {
      for (const column of table.columns) {
        for (const [oldIC, newIC] of oldICToNewIC) {
          try {
            const [result] = await connection.execute(
              `UPDATE ${table.name} SET ${column} = ? WHERE ${column} = ?`,
              [newIC, oldIC]
            );
            
            if (result.affectedRows > 0) {
              console.log(`✓ Updated ${table.name}.${column}: ${oldIC} → ${newIC} (${result.affectedRows} rows)`);
              totalUpdated += result.affectedRows;
            }
          } catch (error) {
            // Table or column might not exist, skip
            if (!error.message.includes("doesn't exist")) {
              console.log(`  Skipped ${table.name}.${column} (${error.message})`);
            }
          }
        }
      }
    }
    
    await connection.commit();
    
    console.log(`\n✅ Total rows updated: ${totalUpdated}`);
    console.log('✅ All related tables updated successfully!');
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error:', error);
    throw error;
  } finally {
    connection.release();
  }
};

updateRelatedTables()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });


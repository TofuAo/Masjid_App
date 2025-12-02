import { pool } from '../config/database.js';

async function addDocumentConfirmationColumns() {
  try {
    console.log('Checking attendance table columns...');
    const [attendanceCols] = await pool.execute('DESCRIBE attendance');
    const attendanceColNames = attendanceCols.map(c => c.Field);
    
    if (!attendanceColNames.includes('document_confirmed')) {
      console.log('Adding document confirmation columns to attendance table...');
      await pool.execute(`
        ALTER TABLE attendance 
        ADD COLUMN document_confirmed BOOLEAN DEFAULT FALSE AFTER proof_image,
        ADD COLUMN confirmed_by VARCHAR(20) NULL AFTER document_confirmed,
        ADD COLUMN confirmed_at TIMESTAMP NULL AFTER confirmed_by,
        ADD COLUMN confirmation_notes TEXT NULL AFTER confirmed_at
      `);
      
      // Add foreign key if it doesn't exist
      try {
        await pool.execute(`
          ALTER TABLE attendance
          ADD FOREIGN KEY (confirmed_by) REFERENCES users(ic) ON DELETE SET NULL
        `);
      } catch (fkError) {
        // Foreign key might already exist, ignore
        if (!fkError.message.includes('Duplicate foreign key')) {
          console.log('Note: Foreign key may already exist');
        }
      }
      
      // Add index
      try {
        await pool.execute(`
          CREATE INDEX idx_attendance_document_confirmed ON attendance(document_confirmed)
        `);
      } catch (idxError) {
        // Index might already exist, ignore
        console.log('Note: Index may already exist');
      }
      
      console.log('✅ Added document confirmation columns to attendance table');
    } else {
      console.log('✅ Attendance table already has document_confirmed column');
    }
    
    console.log('Checking fees table columns...');
    const [feesCols] = await pool.execute('DESCRIBE fees');
    const feesColNames = feesCols.map(c => c.Field);
    
    if (!feesColNames.includes('document_confirmed')) {
      console.log('Adding document confirmation columns to fees table...');
      await pool.execute(`
        ALTER TABLE fees 
        ADD COLUMN document_confirmed BOOLEAN DEFAULT FALSE AFTER resit_img,
        ADD COLUMN confirmed_by VARCHAR(20) NULL AFTER document_confirmed,
        ADD COLUMN confirmed_at TIMESTAMP NULL AFTER confirmed_by,
        ADD COLUMN confirmation_notes TEXT NULL AFTER confirmed_at
      `);
      
      // Add foreign key if it doesn't exist
      try {
        await pool.execute(`
          ALTER TABLE fees
          ADD FOREIGN KEY (confirmed_by) REFERENCES users(ic) ON DELETE SET NULL
        `);
      } catch (fkError) {
        // Foreign key might already exist, ignore
        if (!fkError.message.includes('Duplicate foreign key')) {
          console.log('Note: Foreign key may already exist');
        }
      }
      
      // Add index
      try {
        await pool.execute(`
          CREATE INDEX idx_fees_document_confirmed ON fees(document_confirmed)
        `);
      } catch (idxError) {
        // Index might already exist, ignore
        console.log('Note: Index may already exist');
      }
      
      console.log('✅ Added document confirmation columns to fees table');
    } else {
      console.log('✅ Fees table already has document_confirmed column');
    }
    
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding columns:', error.message);
    process.exit(1);
  }
}

addDocumentConfirmationColumns();


import { pool } from './config/database.js';

async function checkCols() {
  try {
    const [usersCols] = await pool.query('SHOW COLUMNS FROM users');
    console.log('USERS:', usersCols.map(c => c.Field).join(', '));
    const [attCols] = await pool.query('SHOW COLUMNS FROM attendance');
    console.log('ATTENDANCE:', attCols.map(c => c.Field).join(', '));
    const [feesCols] = await pool.query('SHOW COLUMNS FROM fees');
    console.log('FEES:', feesCols.map(c => c.Field).join(', '));
  } catch(e) {
    console.error(e);
  } finally {
    process.exit();
  }
}
checkCols();

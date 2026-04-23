import { pool } from './config/database.js';
import fs from 'fs';

async function checkDatabase() {
  let output = '';
  try {
    const [tables] = await pool.query("SHOW TABLES");
    output += "Tables in database: " + JSON.stringify(tables.map(t => Object.values(t)[0])) + "\n";

    output += "\n--- ATTENDANCE TABLE SCHEMA ---\n";
    const [attendanceSchema] = await pool.query("DESCRIBE attendance");
    output += JSON.stringify(attendanceSchema, null, 2) + "\n";

    output += "\n--- FEES TABLE SCHEMA ---\n";
    const [feesSchema] = await pool.query("DESCRIBE fees");
    output += JSON.stringify(feesSchema, null, 2) + "\n";
    
    fs.writeFileSync('schema_output.txt', output);
    process.exit(0);
  } catch (error) {
    fs.writeFileSync('schema_output.txt', 'Error: ' + error.message + '\n' + error.stack);
    process.exit(1);
  }
}

checkDatabase();

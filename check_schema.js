import { pool } from './backend/config/database.js';

async function checkDatabase() {
  try {
    const [tables] = await pool.query("SHOW TABLES");
    console.log("Tables in database:", tables.map(t => Object.values(t)[0]));

    console.log("\n--- ATTENDANCE TABLE SCHEMA ---");
    const [attendanceSchema] = await pool.query("DESCRIBE attendance");
    console.log(attendanceSchema);

    console.log("\n--- FEES TABLE SCHEMA ---");
    const [feesSchema] = await pool.query("DESCRIBE fees");
    console.log(feesSchema);

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkDatabase();

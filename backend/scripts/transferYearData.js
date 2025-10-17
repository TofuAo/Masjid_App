import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const transferYearData = async (OLD_YEAR, NEW_YEAR) => {
  const oldDB = `masjid_app_${OLD_YEAR}`;
  const newDB = `masjid_app_${NEW_YEAR}`;

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });

  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${newDB}`);
    await connection.query(`USE ${newDB}`);

    const tablesToCopy = ["students", "teachers", "classes"];

    for (const table of tablesToCopy) {
      try {
        await connection.query(`CREATE TABLE IF NOT EXISTS ${newDB}.${table} LIKE ${oldDB}.${table}`);
        await connection.query(`INSERT INTO ${newDB}.${table} SELECT * FROM ${oldDB}.${table}`);
        console.log(`✅ Data transferred from ${oldDB}.${table} → ${newDB}.${table}`);
      } catch (tableError) {
        console.error(`Error transferring table ${table}:`, tableError);
      }
    }

    console.log(`✅ Data transferred from ${oldDB} → ${newDB}`);
  } catch (error) {
    console.error("Error transferring data:", error);
  } finally {
    connection.end();
  }
};

// Example usage (for testing purposes)
// transferYearData(2024, 2025);

export default transferYearData;

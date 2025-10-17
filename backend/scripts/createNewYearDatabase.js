import mysql from "mysql2/promise";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const createNewYearDatabase = async () => {
  const year = new Date().getFullYear();
  const newDB = `masjid_app_${year}`;
  const schema = fs.readFileSync("./database/masjid_app_schema.sql", "utf8");

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });

  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${newDB}`);
    await connection.query(`USE ${newDB}`);
    await connection.query(schema);

    console.log(`✅ Database ${newDB} created and initialized.`);
  } catch (error) {
    console.error("Error creating database:", error);
  } finally {
    connection.end();
  }
};

createNewYearDatabase();

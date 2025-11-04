import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrateDatabase = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    multipleStatements: true
  });

  try {
    const dbName = process.env.DB_NAME || "masjid_app";
    
    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.query(`USE \`${dbName}\``);
    
    console.log(`✅ Connected to database: ${dbName}`);

    // Read and execute schema SQL file
    const schemaPath = path.join(__dirname, "../../database/masjid_app_schema.sql");
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }

    const schema = fs.readFileSync(schemaPath, "utf8");
    
    // Split by semicolons and execute each statement
    const statements = schema
      .split(";")
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith("--"));

    for (const statement of statements) {
      if (statement) {
        try {
          await connection.query(statement);
        } catch (err) {
          // Ignore errors for "CREATE TABLE IF NOT EXISTS" style errors
          if (!err.message.includes("already exists") && 
              !err.message.includes("Duplicate column")) {
            console.warn(`⚠️ Warning executing statement: ${err.message}`);
            console.warn(`Statement: ${statement.substring(0, 100)}...`);
          }
        }
      }
    }

    // Run timestamp columns migration if needed
    const timestampScriptPath = path.join(__dirname, "add_timestamp_columns.sql");
    if (fs.existsSync(timestampScriptPath)) {
      console.log("📝 Applying timestamp columns migration...");
      const timestampScript = fs.readFileSync(timestampScriptPath, "utf8");
      const timestampStatements = timestampScript
        .split(";")
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith("--"));

      for (const statement of timestampStatements) {
        if (statement) {
          try {
            await connection.query(statement);
          } catch (err) {
            if (!err.message.includes("Duplicate column") && 
                !err.message.includes("Unknown column")) {
              console.warn(`⚠️ Warning: ${err.message}`);
            }
          }
        }
      }
    }

    console.log(`✅ Database migration completed successfully for ${dbName}`);
    
    // Verify tables were created
    const [tables] = await connection.query("SHOW TABLES");
    console.log(`✅ Created tables: ${tables.map(t => Object.values(t)[0]).join(", ")}`);

  } catch (error) {
    console.error("❌ Database migration failed:", error.message);
    throw error;
  } finally {
    await connection.end();
  }
};

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes("migrateDatabase")) {
  migrateDatabase()
    .then(() => {
      console.log("✅ Migration script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Migration script failed:", error);
      process.exit(1);
    });
}

export default migrateDatabase;


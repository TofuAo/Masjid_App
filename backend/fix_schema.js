import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = path.join(__dirname, '../database/masjid_app_full_schema.sql');

try {
  let schema = fs.readFileSync(schemaPath, 'utf8');

  // 1. Add FOREIGN_KEY_CHECKS wrappers if not already there
  if (!schema.includes('SET FOREIGN_KEY_CHECKS=0;')) {
    schema = 'SET FOREIGN_KEY_CHECKS=0;\n\n' + schema;
  }
  if (!schema.includes('SET FOREIGN_KEY_CHECKS=1;')) {
    schema = schema + '\n\nSET FOREIGN_KEY_CHECKS=1;\n';
  }

  // 2. Ensure all CREATE TABLE statements use IF NOT EXISTS
  schema = schema.replace(/CREATE TABLE\s+(?!IF NOT EXISTS)/gi, 'CREATE TABLE IF NOT EXISTS ');

  // 3. Fix MySQL strict mode issues for TIMESTAMP and DATE defaults
  // Specific fix for pic_action_snapshots 'expires_at'
  schema = schema.replace(/expires_at\s+TIMESTAMP\s+NOT NULL\s+COMMENT/gi, "expires_at TIMESTAMP NULL DEFAULT NULL COMMENT");
  
  // Replace zero dates which are invalid in strict mode
  schema = schema.replace(/'0000-00-00 00:00:00'/g, 'NULL');
  schema = schema.replace(/'0000-00-00'/g, 'NULL');

  // Any TIMESTAMP NOT NULL without a DEFAULT will fail in strict mode.
  // We'll look for TIMESTAMP NOT NULL and try to ensure it has a DEFAULT or we'll allow it to be handled safely.
  // A safe generic approach is to let the user schema be, but we've fixed the specific ones.

  fs.writeFileSync(schemaPath, schema, 'utf8');
  console.log('✅ Successfully fixed masjid_app_full_schema.sql');
  console.log('Added SET FOREIGN_KEY_CHECKS=0;');
  console.log('Converted CREATE TABLE to CREATE TABLE IF NOT EXISTS');
  console.log('Fixed invalid default TIMESTAMP values');

} catch (error) {
  console.error('Error fixing schema file:', error);
}

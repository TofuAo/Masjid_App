import { pool } from './config/database.js';
async function run() {
  try {
    const res1 = await pool.query('SHOW CREATE TABLE user_roles');
    console.log(res1[0][0]['Create Table']);
    const res2 = await pool.query('SHOW CREATE TABLE teachers');
    console.log(res2[0][0]['Create Table']);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}
run();

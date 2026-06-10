const fs = require('fs');
const schema = fs.readFileSync('database/schema.sql', 'utf8');
const tables = ['attendance', 'fees', 'results', 'classes', 'students'];
for (const table of tables) {
  const regex = new RegExp(`CREATE TABLE \\\`${table}\\\`[^;]+;`, 'g');
  console.log(schema.match(regex));
}

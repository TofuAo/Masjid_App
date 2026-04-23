import fs from 'fs';

const sqlContent = fs.readFileSync('c:\\MyMasjidApp\\database\\masjid_app_full_schema.sql', 'utf8');
const lines = sqlContent.split('\n');

const attendanceMigrations = lines.filter(l => l.toLowerCase().includes('alter table attendance'));
const feesMigrations = lines.filter(l => l.toLowerCase().includes('alter table fees'));
const creates = lines.filter(l => l.toLowerCase().includes('create table'));

let output = "Attendance ALTERS:\n" + attendanceMigrations.join('\n') + "\nFees ALTERS:\n" + feesMigrations.join('\n') + "\n\nFound tables:\n" + creates.map(l => l.trim()).join('\n');
fs.writeFileSync('c:\\MyMasjidApp\\parse_schema_output.txt', output);

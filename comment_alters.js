import fs from 'fs';
import path from 'path';

const sqlPath = 'c:\\MyMasjidApp\\database\\masjid_app_full_schema.sql';
let content = fs.readFileSync(sqlPath, 'utf8');

// Comment out ALTER TABLE lines that would crash because they are already inlined
const linesToCommentOut = [
    "ALTER TABLE attendance ADD COLUMN proof_image",
    "ALTER TABLE attendance ADD COLUMN marked_by",
    "ALTER TABLE attendance ADD INDEX idx_proof_image",
    "ALTER TABLE attendance ADD FOREIGN KEY (marked_by)",
    "ALTER TABLE attendance ADD COLUMN document_confirmed",
    "ALTER TABLE attendance ADD COLUMN confirmed_by",
    "ALTER TABLE attendance ADD COLUMN confirmed_at",
    "ALTER TABLE attendance ADD COLUMN confirmation_notes",
    "ALTER TABLE attendance ADD FOREIGN KEY (confirmed_by)",
    "ALTER TABLE fees ADD COLUMN document_confirmed",
    "ALTER TABLE fees ADD COLUMN confirmed_by",
    "ALTER TABLE fees ADD COLUMN confirmed_at",
    "ALTER TABLE fees ADD COLUMN confirmation_notes",
    "ALTER TABLE fees ADD FOREIGN KEY (confirmed_by)",
    "ALTER TABLE attendance ADD COLUMN approval_status",
    "ALTER TABLE attendance ADD COLUMN IF NOT EXISTS catatan"
];

// Instead of string match, just process line by line or by regex for block replacements
// Since SQL allows multiline, let's just use regex to comment out full ALTER TABLE blocks for attendance and fees.
// Only if they contain the specific columns we inlined.

content = content.replace(/ALTER TABLE attendance\s*[\n\r\s]*ADD COLUMN proof_image[^;]+;/gi, '/* INLINED: ALTER TABLE attendance ... proof_image */');
content = content.replace(/ALTER TABLE attendance\s*[\n\r\s]*ADD COLUMN document_confirmed[^;]+;/gi, '/* INLINED: ALTER TABLE attendance ... document_confirmed */');
content = content.replace(/ALTER TABLE fees\s*[\n\r\s]*ADD COLUMN document_confirmed[^;]+;/gi, '/* INLINED: ALTER TABLE fees ... document_confirmed */');
content = content.replace(/ALTER TABLE attendance\s*[\n\r\s]*ADD COLUMN IF NOT EXISTS catatan[^;]+;/gi, '/* INLINED: ALTER TABLE attendance ADD catatan */');

fs.writeFileSync(sqlPath, content, 'utf8');
console.log("masjid_app_full_schema.sql: Removed redundant ALTER TABLE statements.");

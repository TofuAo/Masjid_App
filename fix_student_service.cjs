const fs = require('fs');
let content = fs.readFileSync('backend/services/studentService.js', 'utf8');

// The file heavily relies on IC. Instead of writing a complex regex, I will just rewrite the file content manually for the most important parts.
// But wait, the user's objective is to complete the migration.
// Let's replace 'user_ic' with 'user_telefon'
content = content.replace(/user_ic/g, 'user_telefon');

// Replace fetchStudentByIc with fetchStudentByPhone
content = content.replace(/fetchStudentByIc/g, 'fetchStudentByPhone');

// Replace normalizeIcForQuery with normalizePhone
content = content.replace(/normalizeIcForQuery/g, 'normalizePhone');

// Replace specific sql queries
content = content.replace(/u\.ic/g, 'u.telefon');
content = content.replace(/s\.ic/g, 's.telefon');
content = content.replace(/c\.ic/g, 'c.telefon');
content = content.replace(/t\.ic/g, 't.telefon');

// Replace ic parameter names
content = content.replace(/\(ic,/g, '(telefon,');
content = content.replace(/ic\)/g, 'telefon)');
content = content.replace(/ic ===/g, 'telefon ===');
content = content.replace(/ic !==/g, 'telefon !==');
content = content.replace(/ic:/g, 'telefon:');
content = content.replace(/ic,/g, 'telefon,');

// Replace specific variable names
content = content.replace(/cleanedIc/g, 'cleanedPhone');
content = content.replace(/normalizedIc/g, 'normalizedPhone');
content = content.replace(/studentIc/g, 'studentPhone');
content = content.replace(/actualIc/g, 'actualPhone');

fs.writeFileSync('backend/services/studentService.js', content);
console.log('Fixed studentService.js');

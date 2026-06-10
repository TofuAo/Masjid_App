const fs = require('fs');

let content = fs.readFileSync('backend/middleware/auth.js', 'utf8');

// Replace all instances of user.ic to user.telefon
content = content.replace(/user\.ic/g, 'user.telefon');

// Replace SELECT ic, nama, email ... WHERE ic = ? to SELECT telefon, nama, email ... WHERE telefon = ?
content = content.replace(/SELECT ic, nama, email, role, status FROM users WHERE ic = \?/g, 'SELECT telefon, nama, email, role, status FROM users WHERE telefon = ?');

// Replace ic: user.telefon (since we changed user.ic above)
content = content.replace(/ic: user\.telefon/g, 'telefon: user.telefon');

// Replace classes query: guru_ic = ? to guru_telefon = ?
content = content.replace(/guru_ic = \?/g, 'guru_telefon = ?');

// Replace students query: user_ic = ? to user_telefon = ?
content = content.replace(/user_ic = \?/g, 'user_telefon = ?');

// Replace attendance, fees, results queries: student_ic = ? to student_phone = ?
content = content.replace(/student_ic = \?/g, 'student_phone = ?');

fs.writeFileSync('backend/middleware/auth.js', content);
console.log('auth.js refactored!');

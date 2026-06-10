const fs = require('fs');
let content = fs.readFileSync('backend/controllers/authController.js', 'utf8');

content = content.replace(/user\.ic/g, 'user.telefon');
content = content.replace(/req\.user\.ic/g, 'req.user.telefon');

fs.writeFileSync('backend/controllers/authController.js', content);
console.log('authController.js fixed!');

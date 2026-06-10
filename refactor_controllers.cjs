const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const original = content;

      content = content.replace(/student_ic/g, 'student_telefon');
      content = content.replace(/guru_ic/g, 'guru_telefon');
      content = content.replace(/user_ic/g, 'user_telefon');
      content = content.replace(/staff_ic/g, 'staff_telefon');
      content = content.replace(/author_ic/g, 'author_telefon');
      content = content.replace(/pic_ic/g, 'pic_telefon');
      
      // Some camelCase variables
      content = content.replace(/studentIc/g, 'studentPhone');
      content = content.replace(/guruIc/g, 'guruPhone');
      content = content.replace(/userIc/g, 'userPhone');
      content = content.replace(/staffIc/g, 'staffPhone');
      content = content.replace(/authorIc/g, 'authorPhone');
      content = content.replace(/picIc/g, 'picPhone');

      if (content !== original) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDir(path.join(__dirname, 'backend', 'controllers'));
processDir(path.join(__dirname, 'backend', 'services'));
processDir(path.join(__dirname, 'backend', 'utils'));
processDir(path.join(__dirname, 'backend', 'routes'));

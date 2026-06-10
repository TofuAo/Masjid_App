const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const original = content;

      content = content.replace(/user\.ic/g, 'user.telefon');
      content = content.replace(/req\.user\.ic/g, 'req.user.telefon');
      content = content.replace(/user_ic/g, 'user_telefon');
      content = content.replace(/student_ic/g, 'student_phone');
      content = content.replace(/guru_ic/g, 'guru_telefon');
      content = content.replace(/staff\.ic/g, 'staff.telefon');
      content = content.replace(/req\.params\.ic/g, 'req.params.telefon');
      content = content.replace(/u\.ic/g, 'u.telefon');
      content = content.replace(/actorIc/g, 'actorPhone');
      
      // Specifically fix JOINs that might use u.ic
      content = content.replace(/ON f\.student_telefon = u\.ic/g, 'ON f.student_phone = u.telefon');
      content = content.replace(/ON sc\.staff_telefon = u\.ic/g, 'ON sc.staff_telefon = u.telefon');
      content = content.replace(/t\.user_telefon = u\.ic/g, 't.user_telefon = u.telefon');

      if (content !== original) {
        fs.writeFileSync(fullPath, content);
        console.log('Fixed', fullPath);
      }
    }
  }
}

processDir('./backend/controllers');
processDir('./backend/services');
processDir('./backend/utils');
processDir('./backend/routes');
console.log('Done refactoring');

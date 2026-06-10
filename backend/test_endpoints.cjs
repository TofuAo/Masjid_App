const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'backend/.env' });

async function test() {
  const token = jwt.sign({
      userId: '010-2715677',
      nama: 'Master User',
      role: 'admin',
      type: 'access'
    }, 
    process.env.JWT_SECRET, 
    { expiresIn: '1h' }
  );

  try {
    const res = await fetch('http://localhost:5000/api/fees', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const text = await res.text();
    console.log('Status:', res.status, text.substring(0, 500));
  } catch (e) {
    console.error(e.message);
  }
}
test();

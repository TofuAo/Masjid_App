import bcrypt from 'bcryptjs';

const password = 'Rizzal731051';
const hash = await bcrypt.hash(password, 12);
console.log(hash);


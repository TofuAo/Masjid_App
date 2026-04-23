import fetch from 'node-fetch';

async function test() {
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ icNumber: '920312065113', password: 'password' })
    });
    
    const loginData = await loginRes.json();
    if (!loginData.data || !loginData.data.token) {
      console.error('Login failed:', loginData);
      return;
    }
    
    const res = await fetch('http://localhost:5000/api/students', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.data.token}`
      },
      body: JSON.stringify({
        nama: 'aaaa',
        ic: '111111111111',
        umur: 5,
        alamat: '',
        telefon: '010-2715677',
        kelas_id: 1,
        tarikh_daftar: '2026-04-23'
      })
    });
    
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', text);
  } catch (e) {
    console.error(e);
  }
}
test();

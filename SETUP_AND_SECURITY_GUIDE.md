# Panduan Pemasangan Tempatan & Pengujian Keselamatan Sistem (MyMasjidApp)

Panduan ini disediakan khas untuk membantu anda memasang keseluruhan sistem **MyMasjidApp** di dalam _workstation_ tempatan (local), serta senarai semak (checklist) untuk melakukan _Security Testing_ sebelum Ustaz _deploy_ sistem ini di pelayan web (web hosting) sebenar.

---

## Bahagian 1: Pemasangan di Workstation (Local Setup)

Sistem ini terbahagi kepada dua bahagian: **Frontend** (React/Vite) dan **Backend** (Node.js/Express) beserta Pangkalan Data (MySQL).

### Keperluan Sistem:
1. **Node.js** (Disarankan versi LTS, v18 atau v20).
2. **XAMPP / Laragon / MySQL Server** (Untuk pengurusan pangkalan data MySQL tempatan).
3. **Penyunting Kod** seperti VS Code atau Cursor.

### Langkah-langkah Pemasangan:

#### 1. Sediakan Pangkalan Data (MySQL)
1. Buka XAMPP/Laragon dan mulakan (start) modul **MySQL**. (Biar XAMPP berjalan di latar belakang).
2. Pangkalan data belum wujud lagi, langkah seterusnya akan membina pangkalan data ini secara automatik.

#### 2. Konfigurasi Backend (Node.js + MySQL)
Buka Terminal/Command Prompt di dalam _workstation_ dan pastikan anda berada di `c:\MyMasjidApp\backend`:
1. Navigasi ke direktori backend:
   ```bash
   cd c:\MyMasjidApp\backend
   ```
2. Salin atau namakan semula fail `env.example` kepada `.env`.
   - Buka fail `.env` dan pastikan konfigurasi pangkalan data betul (default: `DB_USER=root`, `DB_PASSWORD=` kosong).
3. Muat turun semua kebergantungan (dependencies):
   ```bash
   npm install
   ```
4. Jalankan migrasi pangkalan data. Skrip ini akan membina database `masjid_app` dan memasukkan semua maklumat `masjid_app_schema.sql` dan jadual secara berperingkat.
   ```bash
   npm run migrate
   ```
5. (Opsional/Disarankan) Sediakan kunci penyulitan (encryption layer) dan tetapan admin:
   ```bash
   npm run setup-encryption
   npm run create-master-admin
   ```
6. Mulakan pelayan backend (backend server):
   ```bash
   npm run dev
   ```
   *Pelayan backend anda kini berjalan (biasanya di `http://localhost:5000`). Biarkan terminal ini terbuka.*

#### 3. Konfigurasi Frontend (React + Vite)
Buka Terminal/Command Prompt **baru** dan pastikan anda berada di `c:\MyMasjidApp`:
1. Navigasi ke direktori utama:
   ```bash
   cd c:\MyMasjidApp
   ```
2. Pastikan terdapat fail `.env` (jika tiada, buat baharu dan pastikan terdapat capaian `VITE_API_URL=http://localhost:5000` atau mengikut default backend server).
3. Muat turun semua kebergantungan (dependencies):
   ```bash
   npm install
   ```
4. Mulakan sistem antaramuka pengguna:
   ```bash
   npm run dev
   ```
5. Buka pelayar web (browser) dan layari `http://localhost:5175` (atau localhost mengikut terminal anda). Kini MyMasjidApp sudah sedia digunakan di _workstation_ anda!

---

## Bahagian 2: Pengujian Keselamatan (Security Testing) Sebelum Deployment

Sebelum Ustaz meneruskan sesi _deployment_ di web hosting, adalah sangat disarankan untuk kami melaksanakan senarai semakan keselamatan ini:

### 1. Ujian Kod & Kebergantungan Terbuka (Dependency Audit)
Lakukan audit sekuriti di _workstation_ terhadap pakej-pakej NPM yang digunakan, pastikan tiada ancaman yang kritikal.
* Jalankan arahan ini di lokasi `backend` dan projek utama:
  ```bash
  npm audit
  npm audit fix
  ```

### 2. Semakan Keselamatan Konfigurasi (`.env` file)
* **Kunci JWT Rahsia (`JWT_SECRET`)**: Pastikan di _web hosting_ atau _production_, `JWT_SECRET` dtukar dengan kod rawak yang panjang dan sukar. ***JANGAN GUNA DEFAULTS***.
* **Kata Lalu Email/API**: Pastikan `EMAIL_PASSWORD` (seperti App Password Gmail) tidak terdedah ke _Public Repository_ (seperti dalam Github). Kalau ada `node_modules` atau log fail yang masuk, masukkan ke dalam fail `.gitignore`.
* **Kunci Penyulitan (`ENCRYPTION_KEY`)**: Sistem ini mempunyai struktur enkripsi (`setupEncryption.js`). Pastikan kunci ini dijana (generate) baharu untuk pelayan production.

### 3. Pentesting Penyakitan Kod SQL (SQL Injection Testing)
* Oleh kerana backend ini dikonfigurasi bukan menggunakan ORM seperti Prisma sepenuhnya (hanya menggunakan konektor `mysql2` atau skrip SQL run manual), kaji selidik semua fail di `backend/controllers`.
* **Ujian**: Masukkan kod ancaman (penetration test) di mana-mana borang login input teks (contoh: di borang Carian Ibubapa atau IC). Letakkan input seperti `' OR '1'='1`.
* Pastikan parameter queries `(?)` sentiasa digunakan di backend supaya bebas jangkitan.

### 4. Cross-Site Scripting (XSS)
* Apabila Ustaz atau guru memasukkan perincian jadual atau memo, pastikan tiada kemasukan skrip sewenang-wenangnya. 
* **Ujian**: Cuba masukkan kod HTML `<script>alert('Terkena!')</script>` di mana-mana tempat hantaran mesej / input memo dalam sistem. Apabila disimpan dan dipaparkan, sekiranya paparan sistem mengeluarkan kotak Pop-up "Terkena!", sistem masih terdedah.

### 5. Serangan Kadar Akses (Rate Limiting)
Sistem sedia ada mempunyai perisian `express-rate-limit`. Ambil langkah sewajarnya dengan mencuba _"Brute Force"_ login.
* **Ujian**: Buat percubaan _login_ secara pantas / tidak bertauliah dari peranti tempatan. Selepas percubaan berulang dalam minit yang dibenarkan, pastikan sistem menunjukkan "**Too Many Requests**".

### 6. Hak Akses (Broken Access Control)
* **Ujian**: Buat satu pendaftaran baru atau log masuk sebagai murid (user biasa). Daripada halaman _user_ tersebut, cuba secara manual dan secara paksa layari laman web khusus untuk Admin. (contoh: `http://localhost:5175/admin/pengurusan` mahupun panggil *API Backend Admin* terus menggunakan Postman). 
* Tindakbalas jangkaan: Pengguna harus dinafikan (_Access Denied_ atau di_redirect_ semula).

### Nota Alat Tambahan (_Pen-Testing Tools_ percuma untuk Ustaz cuba)
Jika ustaz/anda mahir menggunakan _tools_, cadangan kami semasa _test_ di _workstation_ (localhost):
1. [OWASP ZAP](https://www.zaproxy.org/) - Percuma sepenuhnya, guna untuk "Scan" URL localhost tersebut, akan hasilkan laporan kelemahan secara automatik.
2. [Postman](https://www.postman.com/) - Uji _API backend_ secara berasingan dari antaramuka (tanpa melalui butang klik dari skrin klien) untuk memastikan sekuriti backend kebal.

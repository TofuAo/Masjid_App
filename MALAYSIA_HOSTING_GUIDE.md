# 🇲🇾 MyMasjidApp - Malaysia Hosting Guide

Panduan lengkap untuk menghoskan MyMasjidApp di Malaysia dengan latensi terendah dan sokongan tempatan.

---

## 🏆 Pilihan Terbaik untuk Malaysia

### ⚠️ PENTING: Anda Perlu VPS, BUKAN Shared Hosting!

**Shared Hosting TIDAK sesuai** untuk aplikasi Docker anda. Anda perlu **VPS (Virtual Private Server)** dengan akses root dan sokongan Docker.

---

### 1. **Exabytes Malaysia VPS** ⭐ PILIHAN TERBAIK

**Mengapa Exabytes VPS?**
- ✅ **Pusat data di Malaysia:** Cyberjaya & Pulau Pinang (latensi terendah!)
- ✅ **Sokongan 24/7:** Bahasa Melayu & Inggeris
- ✅ **Sokongan Docker:** Penuh Docker Compose
- ✅ **Akses Root/SSH:** Lengkap untuk setup Docker
- ✅ **Pembayaran tempatan:** Bank transfer, FPX, kad kredit (RM)
- ✅ **Harga:** RM 30-80/bulan untuk VPS

**⚠️ JANGAN pilih Shared Hosting - ia tidak menyokong Docker!**

**Cara Mendaftar:**
1. Lawati [exabytes.com](https://www.exabytes.com)
2. Pilih **"VPS Hosting"** (BUKAN Shared Hosting!)
3. Pilih pusat data **Cyberjaya** atau **Pulau Pinang**
4. Pilih pelan VPS:
   - **Starter:** 1GB RAM, 1 CPU, 25GB SSD - RM 30-50/bulan (awal)
   - **Business:** 2GB RAM, 2 CPU, 50GB SSD - RM 60-80/bulan (disyorkan)
5. Pilih OS: **Ubuntu 22.04 LTS**
6. Daftar dan bayar (Bank transfer/FPX/kad kredit)

**Pelan Disyorkan untuk Awal:**
- **VPS Starter (1GB RAM)** - RM 30-50/bulan
- Cukup untuk: Testing, pengguna kecil (< 100), deployment awal
- Boleh upgrade kemudian apabila perlu

**Setup:**
Ikuti langkah-langkah dalam `DEPLOYMENT_GUIDE.md` bermula dari Step 2.

---

### 2. **DigitalOcean (Singapore)** ⭐ PILIHAN GLOBAL TERBAIK

**Mengapa DigitalOcean Singapore?**
- ✅ **Pusat data:** Singapore (latensi sangat rendah ke Malaysia ~5-10ms)
- ✅ **Sokongan Docker:** Penuh
- ✅ **Dokumentasi:** Sangat baik
- ✅ **Harga:** $6-12/bulan (~RM 28-56)
- ✅ **Pembayaran:** Kad kredit, PayPal
- 🌐 **Laman web:** [digitalocean.com](https://www.digitalocean.com)

**⚠️ PENTING:** Pilih region **SINGAPORE** semasa membuat droplet!

**Cara Mendaftar:**
1. Lawati [digitalocean.com](https://www.digitalocean.com)
2. Daftar akaun (percuma)
3. Buat Droplet baru
4. **Pilih Region: SINGAPORE** ⚠️
5. Pilih Ubuntu 22.04 LTS
6. Pilih pelan: $6/bulan (1GB RAM) atau $12/bulan (2GB RAM)

---

### 3. **Hostinger Malaysia**

**Mengapa Hostinger?**
- ✅ **VPS dengan Docker siap dipasang**
- ✅ **Pusat data Asia** (latensi baik)
- ✅ **Mudah setup**
- ✅ **Harga:** RM 25-60/bulan
- 🌐 **Laman web:** [hostinger.com/my](https://www.hostinger.com/my)

---

### 4. **ServerFreak Malaysia**

**Mengapa ServerFreak?**
- ✅ **Penyedia tempatan Malaysia**
- ✅ **VPS & Pelayan berdedikasi**
- ✅ **Sokongan responsif tempatan**
- ✅ **Harga:** RM 40-100/bulan
- 🌐 **Laman web:** [serverfreak.com](https://www.serverfreak.com)

---

## 📊 Perbandingan Hosting untuk Malaysia

| Provider | Latensi | Sokongan BM | Harga/Bulan | Docker | Rating |
|----------|---------|-------------|-------------|---------|--------|
| **Exabytes** | ⭐⭐⭐⭐⭐ | ✅ Ya | RM 30-80 | ✅ | ⭐⭐⭐⭐⭐ |
| **DigitalOcean SG** | ⭐⭐⭐⭐⭐ | ❌ English | RM 28-56 | ✅ | ⭐⭐⭐⭐⭐ |
| **Hostinger** | ⭐⭐⭐⭐ | ✅ Ya | RM 25-60 | ✅ | ⭐⭐⭐⭐ |
| **ServerFreak** | ⭐⭐⭐⭐ | ✅ Ya | RM 40-100 | ✅ | ⭐⭐⭐⭐ |
| **AWS Lightsail SG** | ⭐⭐⭐⭐⭐ | ❌ English | RM 16-46 | ✅ | ⭐⭐⭐⭐ |

---

## 🚀 Quick Start - Exabytes Malaysia

### Langkah 1: Daftar & Buat VPS

1. Lawati [exabytes.com](https://www.exabytes.com)
2. Pilih "VPS Hosting"
3. Pilih pusat data **Cyberjaya**
4. Pilih pelan minimum (1GB RAM, 1 CPU)
5. Daftar dan bayar

### Langkah 2: Akses Server

```bash
# SSH ke server (dapat IP dari email Exabytes)
ssh root@your_server_ip
# Masukkan kata laluan yang diberikan
```

### Langkah 3: Pasang Docker

```bash
# Update sistem
apt update && apt upgrade -y

# Pasang Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Pasang Docker Compose
apt install docker-compose-plugin git -y

# Semak pemasangan
docker --version
docker compose version
```

### Langkah 4: Upload Kod

```bash
# Buat direktori
mkdir -p /opt/mymasjidapp
cd /opt/mymasjidapp

# Clone dari GitHub (atau upload via SCP)
git clone https://github.com/yourusername/MyMasjidApp.git .
```

### Langkah 5: Konfigurasi & Deploy

```bash
# Salin fail environment
cp backend/env.production backend/.env
nano backend/.env  # Edit dengan nilai sebenar

cp env.production .env
nano .env  # Edit dengan nilai sebenar

# Deploy
chmod +x deploy-production.sh
./deploy-production.sh
```

### Langkah 6: Setup SSL (Jika ada domain)

```bash
# Pasang Certbot
apt install certbot -y

# Dapatkan sijil SSL
certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Salin sijil
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem

# Restart nginx
docker compose restart nginx
```

---

## 💰 Kos Anggaran Bulanan

### Exabytes Malaysia VPS
- **VPS Starter (1GB RAM):** RM 30-50/bulan ⭐ Untuk awal
- **VPS Business (2GB RAM):** RM 60-80/bulan ⭐ Disyorkan untuk production
- **VPS Professional (4GB RAM):** RM 100-150/bulan (untuk pertumbuhan)
- **Domain:** RM 30-50/tahun (jika beli dari Exabytes)

**⚠️ JANGAN pilih Shared Hosting - ia tidak menyokong Docker!**

### DigitalOcean Singapore
- **Droplet Basic:** $6/bulan (~RM 28)
- **Droplet Regular:** $12/bulan (~RM 56)
- **Domain:** $12/tahun (~RM 56) dari Namecheap/GoDaddy

### Hostinger Malaysia
- **VPS Basic:** RM 25-40/bulan
- **VPS Business:** RM 40-60/bulan

---

## 🔧 Sokongan & Bantuan

### Exabytes Malaysia
- **Email:** support@exabytes.com
- **Phone:** +60 3-2785 3636
- **Live Chat:** Tersedia di laman web
- **Bahasa:** Bahasa Melayu & English

### DigitalOcean
- **Documentation:** Sangat lengkap
- **Community:** Forum aktif
- **Support:** Email & ticket (English)

---

## 📝 Checklist Sebelum Deploy

- [ ] Pilih penyedia hosting
- [ ] Daftar akaun dan buat VPS
- [ ] Dapatkan IP server dan kata laluan
- [ ] Sediakan domain (jika ada)
- [ ] Sediakan email untuk aplikasi
- [ ] Generate kata laluan kuat untuk database
- [ ] Generate JWT secret (32+ aksara)
- [ ] Sediakan app password untuk email (Gmail/Outlook)

---

## 🆘 Troubleshooting

### Tidak boleh SSH ke server?
- Semak IP address betul
- Semak firewall membenarkan port 22
- Hubungi sokongan penyedia hosting

### Aplikasi tidak start?
```bash
# Semak log
docker compose logs

# Semak status
docker compose ps

# Restart semua servis
docker compose restart
```

### Masalah database?
```bash
# Semak MySQL running
docker compose ps mysql

# Semak log MySQL
docker compose logs mysql

# Test connection
docker compose exec mysql mysql -u root -p
```

---

## 📞 Bantuan Lanjut

- **Dokumentasi lengkap:** Lihat `DEPLOYMENT_GUIDE.md`
- **Quick reference:** Lihat `PRODUCTION_SETUP.md`
- **Exabytes Support:** [exabytes.com/support](https://www.exabytes.com/support)
- **DigitalOcean Docs:** [docs.digitalocean.com](https://docs.digitalocean.com)

---

**Selamat Deploy! 🚀**


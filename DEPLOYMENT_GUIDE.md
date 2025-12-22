# MyMasjidApp - Complete Deployment Guide

## 🇲🇾 Untuk Pengguna Malaysia / For Malaysian Users

### 🏆 Recommended Hosting for Malaysia (Ranked by Latency & Support)

#### **Option 1: Exabytes Malaysia** ⭐ BEST FOR MALAYSIA
- ✅ **Data centers in Malaysia:** Cyberjaya & Penang (lowest latency!)
- ✅ **24/7 Support:** Bahasa Melayu & English
- ✅ **Docker support:** Full Docker Compose support
- ✅ **Local payment:** Bank transfer, credit card (MYR)
- ✅ **Pricing:** RM 30-80/month (~$7-18 USD)
- 🌐 **Website:** [exabytes.com](https://www.exabytes.com)
- 💡 **Best for:** Local support, low latency, Malaysian payment methods

#### **Option 2: DigitalOcean (Singapore Region)** ⭐ BEST GLOBAL OPTION
- ✅ **Data center:** Singapore (very low latency to Malaysia ~5-10ms)
- ✅ **Full Docker Compose support**
- ✅ **Easy setup:** Excellent documentation
- ✅ **Pricing:** $6-12/month (~RM 28-56)
- 🌐 **Website:** [digitalocean.com](https://www.digitalocean.com)
- 💡 **Best for:** Reliability, global scale, easy management
- 📍 **Important:** Select **Singapore** region when creating droplet!

#### **Option 3: Hostinger Malaysia**
- ✅ **VPS with Docker pre-installed**
- ✅ **Asian data centers** (good latency)
- ✅ **Pricing:** RM 25-60/month
- 🌐 **Website:** [hostinger.com/my](https://www.hostinger.com/my)
- 💡 **Best for:** Easy setup, pre-configured Docker

#### **Option 4: ServerFreak Malaysia**
- ✅ **Local Malaysian provider**
- ✅ **VPS & Dedicated servers**
- ✅ **Responsive local support**
- ✅ **Pricing:** RM 40-100/month
- 🌐 **Website:** [serverfreak.com](https://www.serverfreak.com)
- 💡 **Best for:** Local support, customizable plans

#### **Option 5: AWS Lightsail (Singapore)**
- ✅ **Data center:** Singapore
- ✅ **Managed by AWS**
- ✅ **Pricing:** $3.50-10/month (~RM 16-46)
- 🌐 **Website:** [aws.amazon.com/lightsail](https://aws.amazon.com/lightsail)
- 💡 **Best for:** AWS ecosystem, scalable

#### **Option 6: Vultr (Singapore)**
- ✅ **Data center:** Singapore
- ✅ **Pay-as-you-go**
- ✅ **Pricing:** $6-12/month
- 🌐 **Website:** [vultr.com](https://www.vultr.com)
- 💡 **Best for:** Flexible pricing, good performance

---

## 🎯 Overall Recommendation for Malaysia

**For Best Local Support & Lowest Latency:**
→ **Exabytes Malaysia** (Cyberjaya/Penang data centers)

**For Best Global Service & Reliability:**
→ **DigitalOcean Singapore** (select Singapore region!)

**For Easiest Setup:**
→ **Hostinger Malaysia** (Docker pre-installed)

---

## 🎯 Recommended Hosting Platform: **DigitalOcean Droplet (Singapore Region)**

**Why DigitalOcean Droplet (Singapore)?**
- ✅ Full Docker Compose support (runs exactly as local)
- ✅ Complete control over your environment
- ✅ Persistent storage for uploads and database
- ✅ Easy SSL setup with Let's Encrypt
- ✅ Cost-effective ($6-12/month for small apps)
- ✅ **Singapore region = Very low latency to Malaysia (~5-10ms)**
- ✅ Simple to scale up when needed
- ✅ No vendor lock-in
- ✅ Excellent documentation & community

**Alternative Options:**
- **Exabytes Malaysia** - Local provider, best latency, Malay support (RM 30-80/month)
- **Hostinger Malaysia** - Docker pre-installed, easy setup (RM 25-60/month)
- **Railway** - Easiest Docker deployment, auto-deploy from Git ($5-20/month)
- **Render** - Managed services, good for beginners ($7-25/month)
- **AWS Lightsail Singapore** - Similar to DigitalOcean ($3.50-10/month)

---

## 📋 Pre-Deployment Checklist

- [ ] Domain name purchased and DNS access
- [ ] Email account with app password (Gmail/Outlook)
- [ ] Twilio account (for SMS) - Optional
- [ ] Strong passwords generated for database and JWT
- [ ] Backup strategy planned

---

## 🚀 Option 1: DigitalOcean Droplet Deployment (Recommended)

### Step 1: Create DigitalOcean Droplet

1. **Sign up** at [digitalocean.com](https://www.digitalocean.com)
2. **Create a Droplet:**
   - **Image:** Ubuntu 22.04 LTS
   - **Plan:** Basic ($6/month - 1GB RAM) or Regular ($12/month - 2GB RAM)
   - **Region:** ⚠️ **IMPORTANT - Select SINGAPORE** (lowest latency to Malaysia!)
   - **Authentication:** SSH keys (recommended) or password
   - **Hostname:** `mymasjidapp` or your domain

### Step 2: Initial Server Setup

```bash
# SSH into your server
ssh root@your_server_ip

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version

# Create app directory
mkdir -p /opt/mymasjidapp
cd /opt/mymasjidapp
```

### Step 3: Upload Your Code

**Option A: Using Git (Recommended)**
```bash
# Install Git
apt install git -y

# Clone your repository
git clone https://github.com/yourusername/MyMasjidApp.git .
```

**Option B: Using SCP (from your local machine)**
```bash
# From your local machine
scp -r . root@your_server_ip:/opt/mymasjidapp/
```

### Step 4: Configure Environment Variables

```bash
# Create production .env files
cd /opt/mymasjidapp

# Copy and edit backend .env
cp backend/env.production backend/.env
nano backend/.env

# Copy and edit root .env
cp env.production .env
nano .env
```

**Required Environment Variables:**
- `DB_PASSWORD` - Strong database password
- `JWT_SECRET` - Random 32+ character string
- `FRONTEND_URL` - Your domain (https://yourdomain.com)
- `EMAIL_USER` - Your email
- `EMAIL_PASSWORD` - App password
- `TWILIO_*` - If using SMS

### Step 5: Set Up SSL with Let's Encrypt

```bash
# Install Certbot
apt install certbot -y

# Stop nginx temporarily
docker compose down

# Get SSL certificate
certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Certificates will be in:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

### Step 6: Update Nginx Configuration

```bash
# Copy SSL certificates to project
mkdir -p nginx/ssl
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem

# Update nginx.conf with your domain
nano nginx/nginx.conf
# Change "yourdomain.com" to your actual domain
```

### Step 7: Update Docker Compose for Production

```bash
# Use the production docker-compose file
cp docker-compose.prod.yml docker-compose.yml
# Or edit existing docker-compose.yml
```

### Step 8: Deploy Application

```bash
# Build and start services
docker compose build --no-cache
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

### Step 9: Run Database Migrations

```bash
# Wait for MySQL to be ready (30 seconds)
sleep 30

# Run migrations
docker compose exec backend npm run migrate
```

### Step 10: Set Up Auto-Renewal for SSL

```bash
# Test renewal
certbot renew --dry-run

# Add to crontab (auto-renew every 12 hours)
crontab -e
# Add this line:
0 */12 * * * certbot renew --quiet && docker compose restart nginx
```

### Step 11: Configure Firewall

```bash
# Install UFW
apt install ufw -y

# Allow SSH, HTTP, HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable
```

### Step 12: Set Up Automatic Backups

```bash
# Create backup script
nano /opt/mymasjidapp/backup.sh
```

Add backup script content (see backup section below).

---

## 🚀 Option 2: Exabytes Malaysia Deployment (Local Provider)

### Step 1: Sign Up for Exabytes

1. **Sign up** at [exabytes.com](https://www.exabytes.com)
2. **Choose VPS Plan:**
   - Select VPS with Ubuntu 22.04 LTS
   - Choose **Cyberjaya** or **Penang** data center (lowest latency!)
   - Minimum: 1GB RAM, 1 CPU core
   - Pricing: RM 30-80/month

### Step 2: Access Your VPS

1. You'll receive server IP and root password via email
2. **SSH into server:**
```bash
ssh root@your_server_ip
# Enter password when prompted
```

### Step 3: Follow DigitalOcean Setup Steps

Continue with **Step 2 onwards** from the DigitalOcean section above. The setup process is identical!

**Advantages of Exabytes:**
- ✅ Support in Bahasa Melayu
- ✅ Local payment methods (Bank transfer, FPX)
- ✅ Data centers in Malaysia (lowest latency)
- ✅ Local business hours support

---

## 🚀 Option 3: Railway Deployment (Easier Alternative)

### Step 1: Sign Up and Install CLI

1. Sign up at [railway.app](https://railway.app)
2. Install Railway CLI:
```bash
npm i -g @railway/cli
railway login
```

### Step 2: Initialize Project

```bash
# In your project directory
railway init
railway link
```

### Step 3: Add Services

1. **Add MySQL Database:**
   - In Railway dashboard: New → Database → MySQL
   - Note the connection string

2. **Add Backend Service:**
   - New → GitHub Repo → Select your repo
   - Root Directory: `/backend`
   - Build Command: `npm ci`
   - Start Command: `npm start`
   - Add environment variables from `backend/env.production`

3. **Add Frontend Service:**
   - New → GitHub Repo → Select your repo
   - Root Directory: `/`
   - Build Command: `npm ci && npm run build`
   - Start Command: `npm run preview`
   - Add environment variables from `env.production`

### Step 4: Configure Environment Variables

In Railway dashboard, add all variables from:
- `backend/env.production`
- `env.production`
- Update `DB_HOST` to Railway's MySQL host
- Update `FRONTEND_URL` to Railway's frontend URL

### Step 5: Deploy

```bash
railway up
```

Railway will automatically deploy on every git push!

---

## 🚀 Option 4: Render Deployment

### Step 1: Create Render Account

Sign up at [render.com](https://render.com)

### Step 2: Create MySQL Database

1. New → PostgreSQL/MySQL → MySQL
2. Note connection details

### Step 3: Create Backend Service

1. New → Web Service
2. Connect GitHub repo
3. Settings:
   - **Name:** mymasjidapp-backend
   - **Root Directory:** `backend`
   - **Build Command:** `npm ci`
   - **Start Command:** `npm start`
   - **Environment:** Node
   - **Plan:** Free or Starter ($7/month)

### Step 4: Create Frontend Service

1. New → Static Site
2. Connect GitHub repo
3. Settings:
   - **Build Command:** `npm ci && npm run build`
   - **Publish Directory:** `dist`

### Step 5: Configure Environment Variables

Add all variables in Render dashboard for each service.

---

## 🔒 Security Best Practices

### 1. Strong Passwords
```bash
# Generate strong passwords
openssl rand -base64 32
```

### 2. Firewall Configuration
- Only expose ports 80, 443, and 22 (SSH)
- Use fail2ban for SSH protection

### 3. Regular Updates
```bash
# Set up automatic security updates
apt install unattended-upgrades -y
dpkg-reconfigure -plow unattended-upgrades
```

### 4. Database Security
- Use strong database passwords
- Restrict database access to localhost only
- Regular backups

---

## 💾 Backup Strategy

### Automated Backup Script

Create `/opt/mymasjidapp/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/mymasjidapp"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup database
docker compose exec -T mysql mysqldump -u root -p$DB_PASSWORD masjid_app > $BACKUP_DIR/db_$DATE.sql

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz uploads/

# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete

# Optional: Upload to cloud storage (S3, etc.)
```

Make it executable:
```bash
chmod +x /opt/mymasjidapp/backup.sh
```

Add to crontab (daily at 2 AM):
```bash
crontab -e
# Add:
0 2 * * * /opt/mymasjidapp/backup.sh
```

---

## 🔄 Updating Your Application

### On DigitalOcean (VPS):

```bash
# SSH into server
ssh root@your_server_ip
cd /opt/mymasjidapp

# Pull latest changes
git pull

# Rebuild and restart
docker compose build --no-cache
docker compose down
docker compose up -d

# Run migrations if needed
docker compose exec backend npm run migrate
```

### On Railway:

Just push to GitHub - Railway auto-deploys!

```bash
git add .
git commit -m "Update application"
git push
```

---

## 📊 Monitoring & Maintenance

### Check Application Status

```bash
# View running containers
docker compose ps

# View logs
docker compose logs -f

# Check specific service
docker compose logs backend -f
```

### Health Checks

- Frontend: `https://yourdomain.com/health`
- Backend: `https://yourdomain.com/api/health`

### Performance Monitoring

Consider adding:
- **Uptime monitoring:** UptimeRobot (free)
- **Error tracking:** Sentry (free tier)
- **Analytics:** Google Analytics

---

## 🆘 Troubleshooting

### Application Won't Start

```bash
# Check logs
docker compose logs

# Check if ports are in use
netstat -tulpn | grep :80
netstat -tulpn | grep :443

# Restart services
docker compose restart
```

### Database Connection Issues

```bash
# Check MySQL is running
docker compose ps mysql

# Check MySQL logs
docker compose logs mysql

# Test connection
docker compose exec mysql mysql -u root -p
```

### SSL Certificate Issues

```bash
# Renew certificate manually
certbot renew

# Check certificate expiry
certbot certificates

# Restart nginx
docker compose restart nginx
```

---

## 📞 Support & Resources

- **DigitalOcean Docs:** https://docs.digitalocean.com
- **Docker Docs:** https://docs.docker.com
- **Let's Encrypt:** https://letsencrypt.org/docs/

---

## ✅ Post-Deployment Checklist

- [ ] Application accessible via domain
- [ ] SSL certificate working (HTTPS)
- [ ] Database migrations completed
- [ ] Admin account created
- [ ] Email sending working
- [ ] File uploads working
- [ ] Backups configured
- [ ] Monitoring set up
- [ ] Firewall configured
- [ ] Documentation updated

---

**Need Help?** Check the troubleshooting section or review the logs for specific error messages.


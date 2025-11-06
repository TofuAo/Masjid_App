# VPS Deployment Guide - MyMasjidApp

Complete guide to deploy MyMasjidApp on a VPS with provider recommendations.

## 📋 Table of Contents

1. [Best VPS Providers](#best-vps-providers)
2. [Provider Comparison](#provider-comparison)
3. [Recommended Choice](#recommended-choice)
4. [VPS Setup](#vps-setup)
5. [Application Deployment](#application-deployment)
6. [Domain & SSL Setup](#domain--ssl-setup)
7. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Best VPS Providers

### 🥇 Top Recommendations

#### 1. **DigitalOcean** (Best Overall)
**Why Choose:**
- ✅ Excellent documentation and tutorials
- ✅ Simple, intuitive interface
- ✅ Great for beginners
- ✅ Predictable pricing
- ✅ Excellent performance
- ✅ $200 free credit for new users

**Pricing:**
- **Droplet Basic**: $4/month (1GB RAM, 1 vCPU, 25GB SSD)
- **Droplet Regular**: $6/month (1GB RAM, 1 vCPU, 25GB SSD) - **RECOMMENDED**
- **Droplet Regular**: $12/month (2GB RAM, 1 vCPU, 50GB SSD)

**Best For:** Beginners, developers, small to medium apps

**Website:** https://www.digitalocean.com/

---

#### 2. **Linode** (Best Value)
**Why Choose:**
- ✅ Excellent price-to-performance ratio
- ✅ No hidden fees
- ✅ Great customer support
- ✅ Simple interface
- ✅ $100 free credit

**Pricing:**
- **Shared CPU**: $5/month (1GB RAM, 1 vCPU, 25GB SSD)
- **Shared CPU**: $12/month (2GB RAM, 1 vCPU, 50GB SSD) - **RECOMMENDED**

**Best For:** Budget-conscious users, developers

**Website:** https://www.linode.com/

---

#### 3. **Vultr** (Best Performance)
**Why Choose:**
- ✅ High-performance servers
- ✅ Global data centers
- ✅ Flexible billing (hourly/monthly)
- ✅ Good for scaling
- ✅ $100 free credit

**Pricing:**
- **Regular**: $6/month (1GB RAM, 1 vCPU, 25GB SSD)
- **Regular**: $12/month (2GB RAM, 1 vCPU, 55GB SSD) - **RECOMMENDED**

**Best For:** Performance-focused applications, global users

**Website:** https://www.vultr.com/

---

#### 4. **Hetzner** (Best for Europe)
**Why Choose:**
- ✅ Very affordable pricing
- ✅ Excellent performance
- ✅ Great for European users
- ✅ No hidden costs

**Pricing:**
- **CX11**: €4.51/month (2GB RAM, 1 vCPU, 20GB SSD) - **EXCELLENT VALUE**
- **CPX11**: €4.75/month (2GB RAM, 2 vCPU, 20GB SSD)

**Best For:** European users, budget-conscious

**Website:** https://www.hetzner.com/

---

#### 5. **Contabo** (Budget Option)
**Why Choose:**
- ✅ Very low prices
- ✅ Good for testing
- ✅ European data centers

**Pricing:**
- **VPS S**: €4.99/month (4GB RAM, 2 vCPU, 50GB SSD)

**Best For:** Budget projects, testing

**Website:** https://www.contabo.com/

---

## Provider Comparison

| Provider | Price | RAM | vCPU | Storage | Best For | Rating |
|----------|-------|-----|------|---------|----------|--------|
| **DigitalOcean** | $6/mo | 1GB | 1 | 25GB | Beginners | ⭐⭐⭐⭐⭐ |
| **Linode** | $5/mo | 1GB | 1 | 25GB | Value | ⭐⭐⭐⭐⭐ |
| **Vultr** | $6/mo | 1GB | 1 | 25GB | Performance | ⭐⭐⭐⭐⭐ |
| **Hetzner** | €4.51/mo | 2GB | 1 | 20GB | Europe | ⭐⭐⭐⭐⭐ |
| **Contabo** | €4.99/mo | 4GB | 2 | 50GB | Budget | ⭐⭐⭐⭐ |

---

## Recommended Choice

### 🏆 **DigitalOcean** - Best Overall Choice

**Why DigitalOcean:**
1. **Easiest to Use** - Perfect for beginners
2. **Excellent Documentation** - Great tutorials and guides
3. **Reliable** - 99.99% uptime SLA
4. **Free Credits** - $200 credit for new users
5. **Great Support** - Active community and helpful support
6. **Scalable** - Easy to upgrade when needed

**Recommended Plan:**
- **Regular Droplet**: $6/month
- **1GB RAM, 1 vCPU, 25GB SSD**
- **Perfect for MyMasjidApp**

**Alternative (More Users):**
- **Regular Droplet**: $12/month
- **2GB RAM, 1 vCPU, 50GB SSD**
- **Better for production with more traffic**

---

## VPS Setup

### Step 1: Create VPS Account

#### DigitalOcean Setup

1. **Sign Up:**
   - Go to https://www.digitalocean.com/
   - Click "Sign Up"
   - Use GitHub or email
   - **Get $200 free credit!**

2. **Verify Email:**
   - Check your email
   - Click verification link

3. **Add Payment Method:**
   - Add credit card (won't be charged with free credits)
   - Or use PayPal

### Step 2: Create Droplet (Server)

1. **Click "Create" → "Droplets"**

2. **Choose Configuration:**
   - **Region**: Choose closest to your users
   - **Image**: **Ubuntu 22.04 (LTS) x64**
   - **Plan**: **Regular** - $6/month (1GB RAM)
   - **Authentication**: **SSH keys** (recommended) or **Password**

3. **SSH Key Setup (Recommended):**
   ```bash
   # On your local machine, generate SSH key
   ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
   
   # Copy public key
   cat ~/.ssh/id_rsa.pub
   # Copy the output and paste in DigitalOcean
   ```

4. **Finalize:**
   - Droplet name: `mymasjidapp-production`
   - Click "Create Droplet"
   - Wait 1-2 minutes for setup

5. **Get Server IP:**
   - Note your Droplet's **IP address**
   - Example: `157.230.123.45`

### Step 3: Connect to Your VPS

```bash
# Connect via SSH
ssh root@YOUR_SERVER_IP

# Or if using SSH key
ssh -i ~/.ssh/id_rsa root@YOUR_SERVER_IP

# For Ubuntu, use 'ubuntu' user instead of 'root'
ssh ubuntu@YOUR_SERVER_IP
```

**First Time Setup:**
```bash
# Update system
apt update && apt upgrade -y

# Create non-root user (recommended)
adduser deploy
usermod -aG sudo deploy
usermod -aG docker deploy

# Switch to new user
su - deploy
```

---

## Application Deployment

### Step 1: Install Prerequisites

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y git curl wget nano ufw htop

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Log out and log back in
exit
# Then reconnect
ssh user@YOUR_SERVER_IP

# Verify installations
docker --version
docker-compose --version
```

### Step 2: Configure Firewall

```bash
# Enable firewall
sudo ufw enable

# Allow SSH (important - do this first!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check status
sudo ufw status
```

### Step 3: Clone/Upload Application

**Option A: Using Git (Recommended)**
```bash
# Clone repository
git clone https://github.com/yourusername/MyMasjidApp.git
cd MyMasjidApp
```

**Option B: Upload via SCP**
```bash
# From your local machine
scp -r /path/to/MyMasjidApp user@YOUR_SERVER_IP:~/
```

**Option C: Using SFTP (FileZilla)**
- Download FileZilla
- Connect using SFTP
- Upload MyMasjidApp folder

### Step 4: Configure Environment

```bash
# Navigate to project
cd ~/MyMasjidApp

# Copy environment templates
cp backend/env.production backend/.env
cp env.production .env

# Edit backend environment
nano backend/.env
```

**Configure `backend/.env`:**
```env
# Database Configuration
DB_HOST=mysql
DB_PORT=3306
DB_USER=masjid_user
DB_PASSWORD=GENERATE_STRONG_PASSWORD_HERE
DB_NAME=masjid_app

# JWT Configuration
JWT_SECRET=GENERATE_LONG_RANDOM_STRING_HERE_MIN_32_CHARS
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=5000
NODE_ENV=production

# CORS Configuration - Replace with your domain
FRONTEND_URL=https://yourdomain.com

# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM_NAME=Masjid App

# Security
BCRYPT_ROUNDS=12
```

**Generate secure passwords:**
```bash
# Generate DB password
openssl rand -base64 24

# Generate JWT secret
openssl rand -base64 32
```

**Configure root `.env`:**
```bash
nano .env
```

```env
DOMAIN=yourdomain.com
VITE_API_BASE_URL=https://yourdomain.com/api
```

### Step 5: Update Nginx Configuration

```bash
nano nginx/nginx.conf
```

Replace `yourdomain.com` with your actual domain (or use server IP temporarily for testing).

### Step 6: Deploy Application

```bash
# Make deployment script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

**Or manually:**
```bash
# Create directories
mkdir -p nginx/ssl nginx/logs uploads

# Build and start
docker-compose down --remove-orphans
docker-compose build --no-cache
docker-compose up -d

# Wait for services
sleep 30

# Run migrations
docker-compose exec backend npm run migrate

# Check status
docker-compose ps
```

### Step 7: Verify Deployment

```bash
# Check containers
docker-compose ps

# Check logs
docker-compose logs

# Test locally on server
curl http://localhost
curl http://localhost/api/health
```

**Test from browser:**
- Visit: `http://YOUR_SERVER_IP`
- You should see your application! 🎉

---

## Domain & SSL Setup

### Step 1: Point Domain to VPS

1. **Get Your Server IP:**
   ```bash
   curl ifconfig.me
   ```

2. **Configure DNS:**
   - Go to your domain registrar (GoDaddy, Namecheap, etc.)
   - Find DNS settings
   - Create A Record:
     - **Host**: `@` (root domain)
     - **Points to**: Your server IP
     - **TTL**: 3600
   - Create A Record for www:
     - **Host**: `www`
     - **Points to**: Your server IP
     - **TTL**: 3600

3. **Wait for DNS Propagation:**
   - Usually 5 minutes to 48 hours
   - Check: `nslookup yourdomain.com`
   - Online tool: https://dnschecker.org

### Step 2: Install SSL Certificate

```bash
# Install Certbot
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Stop nginx container temporarily
docker-compose stop nginx

# Install system nginx temporarily
sudo apt install -y nginx

# Obtain SSL certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy certificates
mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem
sudo chmod 644 nginx/ssl/cert.pem
sudo chmod 600 nginx/ssl/key.pem
sudo chown -R $USER:$USER nginx/ssl

# Stop system nginx
sudo systemctl stop nginx
sudo systemctl disable nginx

# Restart Docker nginx
docker-compose restart nginx
```

### Step 3: Configure Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Create renewal cron job
sudo crontab -e
```

Add this line:
```bash
0 12 * * * certbot renew --quiet --deploy-hook "cd /home/$USER/MyMasjidApp && docker-compose restart nginx"
```

### Step 4: Update Application Configuration

```bash
# Update nginx config with domain
nano nginx/nginx.conf
# Replace 'yourdomain.com' with actual domain

# Update .env
nano .env
# Update DOMAIN and VITE_API_BASE_URL

# Update backend/.env
nano backend/.env
# Update FRONTEND_URL

# Restart services
docker-compose restart
```

---

## Monitoring & Maintenance

### Daily Checks

```bash
# Check container status
docker-compose ps

# Check logs
docker-compose logs --tail=50

# Check disk space
df -h
```

### Weekly Tasks

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Update application
git pull origin main
docker-compose up -d --build

# Check SSL certificate
openssl x509 -in nginx/ssl/cert.pem -noout -dates
```

### Backup Setup

```bash
# Make backup script executable
chmod +x scripts/backup-db.sh

# Test backup
./scripts/backup-db.sh

# Set up automatic daily backups
crontab -e
```

Add:
```bash
0 2 * * * cd /home/$USER/MyMasjidApp && ./scripts/backup-db.sh
```

---

## Provider-Specific Guides

### DigitalOcean Specific

**Additional Features:**
- **Spaces**: Object storage (S3 alternative)
- **Load Balancers**: For high availability
- **Monitoring**: Built-in monitoring dashboard
- **Snapshots**: Easy backups

**Creating Droplet:**
1. Go to DigitalOcean → Create → Droplets
2. Choose Ubuntu 22.04
3. Select $6/month plan
4. Add SSH key
5. Create Droplet

**Useful Commands:**
```bash
# Install doctl (DigitalOcean CLI)
# See: https://docs.digitalocean.com/reference/doctl/how-to/install/
```

### Linode Specific

**Additional Features:**
- **Linode Object Storage**: S3-compatible storage
- **NodeBalancers**: Load balancing
- **Backups**: Automated backups

**Creating Linode:**
1. Go to Linode → Create → Linode
2. Choose Ubuntu 22.04
3. Select $5/month plan
4. Add root password or SSH key
5. Create Linode

### Vultr Specific

**Additional Features:**
- **Block Storage**: Additional storage volumes
- **Load Balancers**: High availability
- **Object Storage**: S3-compatible

**Creating Instance:**
1. Go to Vultr → Deploy Server
2. Choose Ubuntu 22.04
3. Select $6/month plan
4. Add SSH key
5. Deploy

---

## Cost Comparison

### Monthly Costs

| Provider | Plan | Price | RAM | Storage | Data Transfer |
|----------|------|-------|-----|---------|----------------|
| **DigitalOcean** | Basic | $6 | 1GB | 25GB | 1TB |
| **Linode** | Shared | $5 | 1GB | 25GB | 1TB |
| **Vultr** | Regular | $6 | 1GB | 25GB | 0.5TB |
| **Hetzner** | CX11 | €4.51 | 2GB | 20GB | 20TB |
| **Contabo** | VPS S | €4.99 | 4GB | 50GB | Unlimited |

**Additional Costs:**
- Domain: ~$10-15/year
- SSL Certificate: Free (Let's Encrypt)

---

## Troubleshooting

### Can't Connect via SSH

**Solution:**
- Verify server IP is correct
- Check firewall allows SSH (port 22)
- Verify SSH key permissions: `chmod 400 key.pem`
- Try password authentication if key doesn't work

### Website Not Accessible

**Solution:**
```bash
# Check containers
docker-compose ps

# Check firewall
sudo ufw status

# Check logs
docker-compose logs

# Test locally
curl http://localhost
```

### Out of Memory

**Solution:**
- Upgrade to larger VPS plan
- Optimize Docker containers
- Clear unused Docker images: `docker system prune -a`

---

## Quick Reference Commands

```bash
# Connect to VPS
ssh user@YOUR_SERVER_IP

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Rebuild after changes
docker-compose up -d --build

# Create backup
./scripts/backup-db.sh

# Monitor system
htop
```

---

## Recommendation Summary

### 🏆 **Best Choice: DigitalOcean**

**Why:**
- Easiest for beginners
- Excellent documentation
- $200 free credit
- Great support
- Reliable service

**Plan: $6/month**
- Perfect for MyMasjidApp
- 1GB RAM is sufficient
- Can upgrade anytime

**Get Started:**
1. Sign up: https://www.digitalocean.com/
2. Create Droplet ($6/month)
3. Follow deployment steps above

---

## Next Steps

1. ✅ Choose a VPS provider (Recommended: DigitalOcean)
2. ✅ Create account and server
3. ✅ Follow deployment steps
4. ✅ Configure domain and SSL
5. ✅ Set up monitoring and backups

**Your MyMasjidApp will be live on a VPS! 🎉**

---

**Last Updated**: 2025-01-27
**Version**: 1.0.0


# Install and Run MyMasjidApp on VPS - Complete Guide

This guide will help you install all software and run your MyMasjidApp on a VPS.

## 🚀 Quick Installation (One Command)

### For Fresh Ubuntu VPS

1. **Connect to your VPS:**
   ```bash
   ssh root@YOUR_VPS_IP
   # Or: ssh ubuntu@YOUR_VPS_IP
   ```

2. **Download and run the complete deployment script:**
   ```bash
   # Download the script
   curl -o vps-complete-deploy.sh https://raw.githubusercontent.com/yourusername/MyMasjidApp/main/vps-complete-deploy.sh
   
   # Make it executable
   chmod +x vps-complete-deploy.sh
   
   # Run it (as root)
   sudo bash vps-complete-deploy.sh
   ```

3. **Wait for installation (10-15 minutes)**
   - The script will install everything automatically
   - Docker, Docker Compose, firewall, etc.
   - Deploy your application

4. **Access your app:**
   - Visit: `http://YOUR_VPS_IP`
   - Your app is live! 🎉

---

## 📋 What Gets Installed

The script automatically installs:

- ✅ **Docker** - Container platform
- ✅ **Docker Compose** - Multi-container orchestration
- ✅ **Git** - Version control
- ✅ **Certbot** - SSL certificate tool
- ✅ **UFW Firewall** - Security firewall
- ✅ **Essential tools** - curl, wget, nano, etc.

---

## 🔧 Manual Installation Steps

If you prefer to install manually or the script doesn't work:

### Step 1: Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### Step 2: Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### Step 3: Configure Firewall

```bash
# Enable firewall
sudo ufw enable

# Allow necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# Check status
sudo ufw status
```

### Step 4: Upload Your Application

**Option A: Using Git (Recommended)**
```bash
# Clone your repository
git clone https://github.com/yourusername/MyMasjidApp.git
cd MyMasjidApp
```

**Option B: Using SCP (from your local machine)**
```bash
# From your local machine
scp -r /path/to/MyMasjidApp root@YOUR_VPS_IP:/opt/
```

**Option C: Using SFTP (FileZilla)**
- Download FileZilla
- Connect to your VPS
- Upload MyMasjidApp folder to `/opt/`

### Step 5: Configure Environment

```bash
cd /opt/MyMasjidApp  # or wherever you put the app

# Copy environment templates
cp backend/env.production backend/.env
cp env.production .env

# Generate secure passwords
DB_PASSWORD=$(openssl rand -base64 24)
JWT_SECRET=$(openssl rand -base64 32)

# Edit backend/.env
nano backend/.env
# Update:
# - DB_PASSWORD=$DB_PASSWORD
# - JWT_SECRET=$JWT_SECRET
# - FRONTEND_URL=http://YOUR_VPS_IP
```

### Step 6: Deploy Application

```bash
# Create directories
mkdir -p nginx/ssl nginx/logs uploads backups

# Build and start
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

# Test endpoints
curl http://localhost
curl http://localhost/api/health
```

**Visit in browser:**
```
http://YOUR_VPS_IP
```

---

## 🎯 VPS Provider Setup

### DigitalOcean

1. **Create Droplet:**
   - Go to https://www.digitalocean.com/
   - Create → Droplets
   - Ubuntu 22.04 LTS
   - $6/month plan (1GB RAM)
   - Add SSH key
   - Create Droplet

2. **Connect:**
   ```bash
   ssh root@YOUR_DROPLET_IP
   ```

3. **Run deployment:**
   ```bash
   curl -o vps-complete-deploy.sh https://raw.githubusercontent.com/TofuAo/Masjid_App/main/vps-complete-deploy.sh
   chmod +x vps-complete-deploy.sh
   sudo bash vps-complete-deploy.sh
   ```

### Linode

1. **Create Linode:**
   - Go to https://www.linode.com/
   - Create → Linode
   - Ubuntu 22.04 LTS
   - $5/month plan
   - Create Linode

2. **Connect and deploy** (same as DigitalOcean)

### Vultr

1. **Deploy Instance:**
   - Go to https://www.vultr.com/
   - Deploy Server
   - Ubuntu 22.04
   - $6/month plan
   - Deploy

2. **Connect and deploy** (same as DigitalOcean)

---

## 🔍 Verification Steps

### Check if Services are Running

```bash
# Check Docker containers
docker-compose ps

# Should show:
# - masjid_mysql (running)
# - masjid_backend (running)
# - masjid_frontend (running)
# - masjid_nginx (running)
```

### Check Logs

```bash
# View all logs
docker-compose logs

# View specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mysql
docker-compose logs nginx
```

### Test Endpoints

```bash
# Backend health
curl http://localhost:5000/health

# Frontend
curl http://localhost:3000

# Nginx (main entry)
curl http://localhost
```

### Check from Browser

- Open browser
- Visit: `http://YOUR_VPS_IP`
- You should see your MyMasjidApp!

---

## 🛠️ Troubleshooting

### Issue: Can't connect to VPS

**Solutions:**
- Verify IP address is correct
- Check if VPS is running in provider dashboard
- Ensure SSH key is correct
- Try password authentication if SSH key doesn't work

### Issue: Docker not installing

**Solutions:**
```bash
# Update package list
sudo apt update

# Install prerequisites
sudo apt install -y curl ca-certificates gnupg

# Try Docker installation again
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### Issue: Containers not starting

**Solutions:**
```bash
# Check logs
docker-compose logs

# Check if ports are in use
sudo netstat -tulpn | grep -E ':(80|443|5000|3000)'

# Restart Docker service
sudo systemctl restart docker

# Try starting again
docker-compose up -d
```

### Issue: Database connection failed

**Solutions:**
```bash
# Check MySQL container
docker-compose logs mysql

# Verify database credentials in backend/.env
cat backend/.env | grep DB_

# Restart services
docker-compose restart
```

### Issue: Website not accessible

**Solutions:**
```bash
# Check firewall
sudo ufw status

# Ensure ports are open
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check nginx logs
docker-compose logs nginx

# Test locally on server
curl http://localhost
```

---

## 📊 System Requirements

### Minimum Requirements

- **RAM**: 1GB (2GB recommended)
- **CPU**: 1 vCPU
- **Storage**: 20GB
- **OS**: Ubuntu 20.04+ or 22.04 LTS

### Recommended VPS Plans

- **DigitalOcean**: $6/month (1GB RAM)
- **Linode**: $5/month (1GB RAM)
- **Vultr**: $6/month (1GB RAM)
- **Hetzner**: €4.51/month (2GB RAM)

---

## 🔒 Security Checklist

After deployment:

- [ ] Change default passwords in `backend/.env`
- [ ] Update JWT secret
- [ ] Configure firewall (already done by script)
- [ ] Set up SSL certificate
- [ ] Configure domain name
- [ ] Set up automatic backups
- [ ] Review security settings

---

## 📝 Post-Deployment

### Set Up Domain

1. **Point domain to VPS:**
   - Go to domain registrar
   - Create A record: `@` → `YOUR_VPS_IP`
   - Create A record: `www` → `YOUR_VPS_IP`

2. **Update configuration:**
   ```bash
   nano nginx/nginx.conf
   # Replace 'yourdomain.com' with your domain
   
   nano .env
   # Update DOMAIN
   
   nano backend/.env
   # Update FRONTEND_URL
   
   docker-compose restart
   ```

### Set Up SSL

```bash
# Stop nginx
docker-compose stop nginx

# Get SSL certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem
sudo chmod 644 nginx/ssl/cert.pem
sudo chmod 600 nginx/ssl/key.pem

# Restart nginx
docker-compose restart nginx
```

### Set Up Backups

```bash
# Make backup script executable
chmod +x scripts/backup-db.sh

# Test backup
./scripts/backup-db.sh

# Set up automatic daily backups
crontab -e
# Add: 0 2 * * * cd /opt/MyMasjidApp && ./scripts/backup-db.sh
```

---

## 🎉 Success!

Your MyMasjidApp is now:
- ✅ Installed and running
- ✅ Accessible via IP address
- ✅ Auto-restarting on reboot
- ✅ Secure with firewall
- ✅ Ready for domain and SSL

---

## 📚 Additional Resources

- **VPS Quick Start**: `VPS_QUICK_START.md`
- **VPS Deployment Guide**: `VPS_DEPLOYMENT_GUIDE.md`
- **Provider Comparison**: `VPS_PROVIDER_COMPARISON.md`

---

**Need help?** Check the troubleshooting section above or review the deployment logs.


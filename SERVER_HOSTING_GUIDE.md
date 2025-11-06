# Complete Server Hosting Guide for MyMasjidApp

This guide will walk you through hosting your MyMasjidApp on a production server step-by-step.

## 📋 Table of Contents

1. [Prerequisites & Server Selection](#prerequisites--server-selection)
2. [Server Setup](#server-setup)
3. [Application Deployment](#application-deployment)
4. [Domain & SSL Configuration](#domain--ssl-configuration)
5. [Production Configuration](#production-configuration)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites & Server Selection

### Required Server Specifications

**Minimum Requirements:**
- **CPU**: 2 cores
- **RAM**: 2GB (4GB recommended)
- **Storage**: 20GB SSD
- **OS**: Ubuntu 20.04 LTS or 22.04 LTS (recommended)
- **Network**: Static IP address

**Recommended Providers:**
- **DigitalOcean** (Droplets starting at $12/month)
- **Linode** (Nanode starting at $5/month)
- **AWS EC2** (t3.micro free tier available)
- **Vultr** (Starting at $6/month)
- **Hetzner** (Good value for Europe)

### What You'll Need

1. ✅ A VPS/Cloud server with Ubuntu
2. ✅ A domain name (e.g., `yourmasjid.com`)
3. ✅ SSH access to your server
4. ✅ Basic terminal/command line knowledge

---

## Server Setup

### Step 1: Connect to Your Server

```bash
# Connect via SSH (replace with your server IP)
ssh root@your-server-ip

# Or if using a non-root user
ssh username@your-server-ip
```

### Step 2: Update System

```bash
# Update package lists
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y git curl wget nano ufw
```

### Step 3: Install Docker

```bash
# Install Docker using the official script
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (replace 'your-username' with your actual username)
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

**Note:** You may need to log out and log back in for Docker group changes to take effect.

### Step 4: Configure Firewall

```bash
# Allow SSH (important - don't skip this!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## Application Deployment

### Step 1: Clone Your Application

```bash
# Navigate to home directory (or wherever you want to install)
cd ~

# Clone your repository (replace with your actual repository URL)
git clone https://github.com/yourusername/MyMasjidApp.git
# OR if you're using SSH
# git clone git@github.com:yourusername/MyMasjidApp.git

# Navigate to project directory
cd MyMasjidApp
```

**Alternative:** If you don't have a Git repository, you can upload your files using:
- **SCP**: `scp -r /local/path/to/MyMasjidApp user@server:/home/user/`
- **SFTP**: Use FileZilla or similar FTP client
- **rsync**: `rsync -avz /local/path/to/MyMasjidApp user@server:/home/user/`

### Step 2: Set Up Environment Variables

```bash
# Copy production environment templates
cp backend/env.production backend/.env
cp env.production .env

# Edit backend environment file
nano backend/.env
```

**Configure `backend/.env` with your production values:**

```env
# Database Configuration
DB_HOST=mysql              # Use 'mysql' for Docker MySQL container
DB_PORT=3306
DB_USER=masjid_user        # Change this!
DB_PASSWORD=STRONG_PASSWORD_HERE  # Change this to a strong password!
DB_NAME=masjid_app

# JWT Configuration
JWT_SECRET=GENERATE_A_LONG_RANDOM_STRING_HERE_MIN_32_CHARACTERS  # MUST CHANGE!
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=5000
NODE_ENV=production

# CORS Configuration - Replace with your actual domain
FRONTEND_URL=https://yourdomain.com

# Email Configuration (if using email features)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM_NAME=Masjid App

# Security Configuration
BCRYPT_ROUNDS=12
```

**Generate a secure JWT secret:**
```bash
# Generate a random secret
openssl rand -base64 32
```

**Edit root `.env` file:**
```bash
nano .env
```

```env
# Replace with your actual domain
DOMAIN=yourdomain.com
VITE_API_BASE_URL=https://yourdomain.com/api
```

### Step 3: Update Docker Compose Configuration

```bash
# Edit docker-compose.yml if needed
nano docker-compose.yml
```

**Important:** Ensure the database password in `docker-compose.yml` matches your `backend/.env` file.

### Step 4: Update Nginx Configuration

```bash
# Edit nginx configuration
nano nginx/nginx.conf
```

**Replace `yourdomain.com` with your actual domain:**
- Line 50: `server_name yourdomain.com www.yourdomain.com;`
- Line 57: `server_name yourdomain.com www.yourdomain.com;`

### Step 5: Deploy the Application

```bash
# Make deployment script executable
chmod +x deploy.sh

# Run deployment script
./deploy.sh
```

**What the deployment script does:**
1. Creates necessary directories (nginx/ssl, nginx/logs, uploads)
2. Builds Docker images for frontend and backend
3. Starts all containers (MySQL, Backend, Frontend, Nginx)
4. Waits for MySQL to be ready
5. Runs database migrations

**Manual deployment (if script doesn't work):**
```bash
# Create necessary directories
mkdir -p nginx/ssl nginx/logs uploads

# Build and start services
docker-compose down --remove-orphans
docker-compose build --no-cache
docker-compose up -d

# Wait for MySQL to be ready (about 30 seconds)
sleep 30

# Run database migrations
docker-compose exec backend npm run migrate

# Check status
docker-compose ps
```

### Step 6: Verify Deployment

```bash
# Check all containers are running
docker-compose ps

# Check logs
docker-compose logs

# Test backend health
curl http://localhost:5000/health

# Test frontend
curl http://localhost:3000
```

---

## Domain & SSL Configuration

### Step 1: Point Your Domain to Server

1. **Get your server's IP address:**
   ```bash
   curl ifconfig.me
   ```

2. **Configure DNS records** in your domain registrar:
   - **A Record**: Point `@` (root domain) to your server IP
   - **A Record**: Point `www` to your server IP

   Example DNS records:
   ```
   Type    Name    Value           TTL
   A       @       YOUR_SERVER_IP  3600
   A       www     YOUR_SERVER_IP  3600
   ```

3. **Wait for DNS propagation** (usually 5 minutes to 48 hours)
   - Check propagation: `nslookup yourdomain.com`
   - Online tool: https://dnschecker.org

### Step 2: Set Up SSL Certificate (HTTPS)

**Option A: Using Certbot (Let's Encrypt - Free)**

```bash
# Install Certbot
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Stop nginx container temporarily (we'll use system nginx for cert generation)
docker-compose stop nginx

# Install nginx on the system (temporarily for certbot)
sudo apt install -y nginx

# Obtain SSL certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Follow the prompts:
# - Enter your email address
# - Agree to terms
# - Choose whether to share email (optional)
```

**Copy certificates for Docker:**
```bash
# Create SSL directory
mkdir -p nginx/ssl

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem

# Set proper permissions
sudo chmod 644 nginx/ssl/cert.pem
sudo chmod 600 nginx/ssl/key.pem

# Change ownership (if needed)
sudo chown -R $USER:$USER nginx/ssl
```

**Update nginx configuration:**
```bash
nano nginx/nginx.conf
```

Ensure SSL paths are correct:
```nginx
ssl_certificate /etc/nginx/ssl/cert.pem;
ssl_certificate_key /etc/nginx/ssl/key.pem;
```

**Restart services:**
```bash
# Stop system nginx (we'll use Docker nginx)
sudo systemctl stop nginx
sudo systemctl disable nginx

# Restart Docker nginx
docker-compose restart nginx
```

**Set up auto-renewal:**
```bash
# Test renewal
sudo certbot renew --dry-run

# Create renewal script
sudo nano /etc/cron.d/certbot-renewal
```

Add this content:
```bash
0 12 * * * root certbot renew --quiet --deploy-hook "cd /home/$USER/MyMasjidApp && docker-compose restart nginx"
```

**Option B: Using Existing SSL Certificates**

If you already have SSL certificates:
```bash
# Copy your certificates
mkdir -p nginx/ssl
cp your-certificate.pem nginx/ssl/cert.pem
cp your-private-key.pem nginx/ssl/key.pem

# Set permissions
chmod 644 nginx/ssl/cert.pem
chmod 600 nginx/ssl/key.pem

# Restart nginx
docker-compose restart nginx
```

### Step 3: Test HTTPS

```bash
# Test from server
curl https://yourdomain.com

# Test from browser
# Visit: https://yourdomain.com
```

---

## Production Configuration

### Step 1: Security Hardening

**Update database password:**
```bash
# Generate strong password
openssl rand -base64 24

# Update in backend/.env and docker-compose.yml
nano backend/.env
nano docker-compose.yml
```

**Update JWT secret:**
```bash
# Generate strong JWT secret
openssl rand -base64 32

# Update in backend/.env
nano backend/.env
```

**Disable root login (if using root user):**
```bash
# Create new user
sudo adduser deploy
sudo usermod -aG sudo deploy
sudo usermod -aG docker deploy

# Set up SSH key authentication
sudo mkdir -p /home/deploy/.ssh
sudo cp ~/.ssh/authorized_keys /home/deploy/.ssh/
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

### Step 2: Set Up Automatic Backups

```bash
# Make backup script executable
chmod +x scripts/backup-db.sh

# Test backup
./scripts/backup-db.sh

# Set up cron job for daily backups (2 AM)
crontab -e
```

Add this line:
```bash
0 2 * * * cd /home/$USER/MyMasjidApp && ./scripts/backup-db.sh
```

### Step 3: Set Up Monitoring

```bash
# Make monitor script executable
chmod +x scripts/monitor.sh

# Test monitoring
./scripts/monitor.sh

# Set up monitoring cron (every hour)
crontab -e
```

Add this line:
```bash
0 * * * * cd /home/$USER/MyMasjidApp && ./scripts/monitor.sh >> logs/monitor.log 2>&1
```

### Step 4: Configure Log Rotation

```bash
# Create logrotate configuration
sudo nano /etc/logrotate.d/masjid-app
```

Add:
```
/home/*/MyMasjidApp/nginx/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0644 root root
    sharedscripts
}
```

---

## Monitoring & Maintenance

### Daily Tasks

**Check application status:**
```bash
docker-compose ps
docker-compose logs --tail=50
```

**Check disk space:**
```bash
df -h
docker system df
```

### Weekly Tasks

**Update dependencies:**
```bash
# Pull latest changes
git pull origin main

# Rebuild containers
docker-compose up -d --build
```

**Check SSL certificate expiry:**
```bash
openssl x509 -in nginx/ssl/cert.pem -noout -dates
```

**Review logs:**
```bash
tail -n 100 nginx/logs/error.log
docker-compose logs backend | tail -n 100
```

### Monthly Tasks

**Database backup verification:**
```bash
ls -lh backups/
```

**Security updates:**
```bash
sudo apt update && sudo apt upgrade -y
docker system prune -a
```

**Performance check:**
```bash
docker stats
```

### Useful Commands

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
docker-compose logs -f nginx

# Restart a service
docker-compose restart backend

# Restart all services
docker-compose restart

# Stop all services
docker-compose down

# Start all services
docker-compose up -d

# Rebuild after code changes
docker-compose up -d --build

# Access database
docker-compose exec mysql mysql -u masjid_user -p masjid_app

# Access backend container
docker-compose exec backend sh

# Check resource usage
docker stats
```

---

## Troubleshooting

### Issue: Containers won't start

**Solution:**
```bash
# Check logs
docker-compose logs

# Check if ports are in use
sudo netstat -tulpn | grep -E ':(80|443|5000|3000|3306)'

# Stop conflicting services
sudo systemctl stop nginx apache2  # if system services are running
```

### Issue: Database connection failed

**Solution:**
```bash
# Check MySQL container
docker-compose logs mysql

# Test connection
docker-compose exec mysql mysqladmin ping -h localhost

# Verify credentials
cat backend/.env | grep DB_

# Check database exists
docker-compose exec mysql mysql -u masjid_user -p -e "SHOW DATABASES;"
```

### Issue: Frontend not loading

**Solution:**
```bash
# Check frontend container
docker-compose logs frontend

# Rebuild frontend
npm run build
docker-compose up -d --build frontend

# Check nginx configuration
docker-compose exec nginx nginx -t
```

### Issue: SSL certificate errors

**Solution:**
```bash
# Check certificate validity
openssl x509 -in nginx/ssl/cert.pem -noout -dates

# Verify domain DNS
nslookup yourdomain.com

# Renew certificate
sudo certbot renew
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem
docker-compose restart nginx
```

### Issue: Out of disk space

**Solution:**
```bash
# Clean Docker system
docker system prune -a --volumes

# Remove old backups
find backups/ -name "*.sql.gz" -mtime +30 -delete

# Check large files
du -sh * | sort -h
```

### Issue: Application is slow

**Solution:**
```bash
# Check resource usage
docker stats
htop

# Check database performance
docker-compose exec mysql mysql -u masjid_user -p masjid_app -e "SHOW PROCESSLIST;"

# Review nginx logs for errors
tail -f nginx/logs/error.log
```

---

## Quick Reference

### Essential Commands Checklist

- [ ] `docker --version` - Verify Docker installed
- [ ] `docker-compose --version` - Verify Docker Compose installed
- [ ] `sudo ufw status` - Check firewall
- [ ] `docker-compose ps` - Check all services running
- [ ] `curl https://yourdomain.com` - Test website
- [ ] `docker-compose logs` - Check for errors

### Important Files

- `backend/.env` - Backend configuration
- `.env` - Frontend configuration
- `docker-compose.yml` - Docker services configuration
- `nginx/nginx.conf` - Web server configuration
- `nginx/ssl/` - SSL certificates directory

### Support Resources

1. **Check logs first**: `docker-compose logs`
2. **Review this guide**: `SERVER_HOSTING_GUIDE.md`
3. **Check deployment guide**: `DEPLOYMENT_GUIDE.md`
4. **Run health check**: `./scripts/monitor.sh`

---

## Post-Deployment Checklist

- [ ] All Docker containers running (`docker-compose ps`)
- [ ] Website accessible via HTTP (`http://yourdomain.com`)
- [ ] Website accessible via HTTPS (`https://yourdomain.com`)
- [ ] SSL certificate valid (no browser warnings)
- [ ] Database migrations completed
- [ ] Backups configured and tested
- [ ] Monitoring set up
- [ ] Strong passwords set for database and JWT
- [ ] Firewall configured
- [ ] Domain DNS properly configured
- [ ] Application functionality tested
- [ ] Logs reviewed for errors

---

## Next Steps

1. **Test all features** - Login, create users, test all functionality
2. **Set up monitoring alerts** - Configure email/SMS alerts for downtime
3. **Document access credentials** - Store securely (password manager)
4. **Train administrators** - Ensure team knows how to manage the system
5. **Regular maintenance schedule** - Set calendar reminders for updates

---

**Congratulations! Your MyMasjidApp is now hosted on a production server! 🎉**

For additional help, refer to:
- `DEPLOYMENT_GUIDE.md` - Detailed deployment information
- `DEPLOYMENT_README.md` - Alternative deployment methods
- `SECURITY_GUIDE.md` - Security best practices

---

**Last Updated**: 2025-01-27
**Version**: 1.0.0


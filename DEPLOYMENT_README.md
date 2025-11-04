# MyMasjidApp - Complete Deployment Guide

This guide provides step-by-step instructions for deploying the MyMasjidApp to production.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start Deployment](#quick-start-deployment)
3. [Step-by-Step Deployment](#step-by-step-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [SSL Certificate Setup](#ssl-certificate-setup)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Docker** (version 20.10+) - [Install Docker](https://docs.docker.com/get-docker/)
- **Docker Compose** (version 2.0+) - Usually included with Docker Desktop
- **Git** - For cloning the repository
- **Domain Name** (for production deployment)
- **VPS or Cloud Server** (Ubuntu 20.04+ recommended)

### System Requirements
- **RAM**: Minimum 2GB, Recommended 4GB+
- **Storage**: Minimum 20GB free space
- **CPU**: 2+ cores recommended
- **Network**: Static IP address for your server

---

## Quick Start Deployment

### For Linux/macOS:
```bash
# 1. Clone the repository
git clone <your-repo-url>
cd MyMasjidApp

# 2. Set up environment files
./setup-env.sh

# 3. Edit environment variables
nano backend/.env
nano .env

# 4. Deploy
./deploy.sh
```

### For Windows:
```batch
# 1. Clone the repository
git clone <your-repo-url>
cd MyMasjidApp

# 2. Set up environment files
setup-env.bat

# 3. Edit environment variables
notepad backend\.env
notepad .env

# 4. Deploy
deploy.bat
```

---

## Step-by-Step Deployment

### Step 1: Set Up Environment Variables

#### Option A: Using the Setup Script
```bash
# Linux/macOS
./setup-env.sh

# Windows
setup-env.bat
```

#### Option B: Manual Setup
```bash
# Copy template files
cp backend/env.production backend/.env
cp env.production .env

# Edit the files
nano backend/.env  # or use your preferred editor
nano .env
```

#### Required Environment Variables

**backend/.env:**
```env
# Database Configuration
DB_HOST=mysql              # Use 'mysql' for Docker, or external DB host
DB_PORT=3306
DB_USER=masjid_user        # Change in production!
DB_PASSWORD=secure_password_here  # Change in production!
DB_NAME=masjid_app

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_min_32_chars  # MUST CHANGE IN PRODUCTION!
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=5000
NODE_ENV=production

# CORS Configuration
FRONTEND_URL=https://yourdomain.com

# Security Configuration
BCRYPT_ROUNDS=12
```

**.env (root):**
```env
# Frontend Environment Variables
VITE_API_BASE_URL=https://yourdomain.com/api
VITE_APP_NAME=MyMasjidApp
VITE_APP_VERSION=1.0.0
```

### Step 2: Database Configuration

The application uses MySQL 8.0. You have two options:

#### Option A: Use Docker MySQL (Recommended for development)
The `docker-compose.yml` includes a MySQL container. Just ensure your `backend/.env` uses:
```
DB_HOST=mysql
```

#### Option B: Use External MySQL Database
1. Create database and user:
```sql
CREATE DATABASE masjid_app;
CREATE USER 'masjid_user'@'%' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON masjid_app.* TO 'masjid_user'@'%';
FLUSH PRIVILEGES;
```

2. Update `backend/.env`:
```
DB_HOST=your-database-host
DB_USER=masjid_user
DB_PASSWORD=secure_password
DB_NAME=masjid_app
```

### Step 3: Run Database Migrations

#### Using Docker (Automatic):
Migrations run automatically when you execute `./deploy.sh` or `deploy.bat`.

#### Manual Migration:
```bash
# If using Docker
docker-compose exec backend npm run migrate

# If using external database
./scripts/init-db.sh
```

The migration script will:
- Create the database if it doesn't exist
- Import the schema from `database/masjid_app_schema.sql`
- Apply timestamp column migrations if needed

### Step 4: Build and Deploy

```bash
# Deploy all services
./deploy.sh    # Linux/macOS
deploy.bat     # Windows
```

This script will:
1. Create necessary directories (nginx/ssl, nginx/logs, uploads)
2. Check/create .env files
3. Build Docker images
4. Start all containers
5. Wait for MySQL to be ready
6. Run database migrations
7. Display service status

### Step 5: Verify Deployment

```bash
# Check all services
docker-compose ps

# Check logs
docker-compose logs

# Run health check script
./scripts/monitor.sh

# Test endpoints
curl http://localhost:5000/health
curl http://localhost:3000
```

---

## SSL Certificate Setup

### Using Let's Encrypt (Certbot)

1. **Update domain in nginx config:**
   ```bash
   # Edit nginx/nginx.conf
   # Replace 'yourdomain.com' with your actual domain
   nano nginx/nginx.conf
   ```

2. **Run SSL setup script:**
   ```bash
   sudo ./setup-ssl.sh yourdomain.com admin@yourdomain.com
   ```

3. **Verify SSL:**
   - Visit `https://yourdomain.com`
   - Check certificate: `https://www.ssllabs.com/ssltest/`

### Manual SSL Setup

1. **Install Certbot:**
   ```bash
   sudo apt update
   sudo apt install certbot python3-certbot-nginx
   ```

2. **Obtain certificate:**
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

3. **Copy certificates for Docker:**
   ```bash
   mkdir -p nginx/ssl
   sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
   sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem
   sudo chmod 600 nginx/ssl/*.pem
   ```

4. **Update nginx.conf** with certificate paths:
   ```
   ssl_certificate /etc/nginx/ssl/cert.pem;
   ssl_certificate_key /etc/nginx/ssl/key.pem;
   ```

5. **Restart nginx:**
   ```bash
   docker-compose restart nginx
   ```

### Auto-Renewal Setup

Certbot certificates expire every 90 days. Set up auto-renewal:

```bash
# Test renewal
sudo certbot renew --dry-run

# Add to crontab
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet --post-hook 'docker-compose -f /path/to/docker-compose.yml restart nginx'
```

---

## Monitoring & Maintenance

### Health Monitoring

Run the monitoring script:
```bash
./scripts/monitor.sh
```

This checks:
- Docker container status
- Backend API health
- Database connectivity
- Frontend accessibility
- Nginx status
- System resources

### Logs

**View all logs:**
```bash
docker-compose logs
```

**View specific service:**
```bash
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mysql
docker-compose logs nginx
```

**Follow logs in real-time:**
```bash
docker-compose logs -f backend
```

### Database Backups

**Create backup:**
```bash
./scripts/backup-db.sh
```

Backups are stored in `./backups/` directory with timestamp.

**Schedule automatic backups:**
```bash
# Add to crontab
crontab -e
# Daily backup at 2 AM
0 2 * * * /path/to/MyMasjidApp/scripts/backup-db.sh
```

**Restore from backup:**
```bash
gunzip < backups/masjid_app_backup_TIMESTAMP.sql.gz | \
  docker exec -i masjid_mysql mysql -u masjid_user -p masjid_app
```

### Performance Monitoring

**Check container resource usage:**
```bash
docker stats
```

**Check disk usage:**
```bash
df -h
docker system df
```

**Check database size:**
```bash
docker exec masjid_mysql mysql -u masjid_user -p -e \
  "SELECT table_schema AS 'Database', \
   ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)' \
   FROM information_schema.tables WHERE table_schema='masjid_app';"
```

---

## Troubleshooting

### Common Issues

#### 1. Containers won't start
```bash
# Check logs
docker-compose logs

# Check if ports are in use
netstat -tulpn | grep -E ':(80|443|5000|3000|3306)'

# Stop conflicting services
sudo systemctl stop nginx  # if system nginx is running
```

#### 2. Database connection failed
```bash
# Check MySQL container
docker-compose logs mysql

# Test connection
docker-compose exec mysql mysqladmin ping -h localhost

# Verify credentials in backend/.env
# Check database exists
docker-compose exec mysql mysql -u masjid_user -p -e "SHOW DATABASES;"
```

#### 3. Migration errors
```bash
# Run migration manually
docker-compose exec backend npm run migrate

# Check if tables exist
docker-compose exec mysql mysql -u masjid_user -p masjid_app -e "SHOW TABLES;"
```

#### 4. Frontend not loading
```bash
# Check frontend container
docker-compose logs frontend

# Verify build exists
ls -la dist/

# Rebuild frontend
npm run build
docker-compose up -d --build frontend
```

#### 5. Nginx errors
```bash
# Test nginx configuration
docker-compose exec nginx nginx -t

# Check nginx logs
cat nginx/logs/error.log

# Verify domain configuration
grep -r "yourdomain.com" nginx/nginx.conf
```

#### 6. SSL certificate issues
```bash
# Check certificate expiry
openssl x509 -in nginx/ssl/cert.pem -noout -dates

# Renew certificate
sudo certbot renew

# Verify domain DNS
nslookup yourdomain.com
```

### Emergency Procedures

#### Application is down
1. Check all containers: `docker-compose ps`
2. Check logs: `docker-compose logs`
3. Restart services: `docker-compose restart`
4. If needed, full restart: `docker-compose down && docker-compose up -d`

#### Database is corrupted
1. Stop backend: `docker-compose stop backend`
2. Restore from backup (see Database Backups section)
3. Verify data: `docker-compose exec mysql mysql -u masjid_user -p masjid_app`
4. Restart backend: `docker-compose start backend`

#### Disk space full
```bash
# Clean Docker resources
docker system prune -a --volumes

# Remove old backups
find backups/ -name "*.sql.gz" -mtime +30 -delete

# Check large files
du -sh * | sort -h
```

---

## Security Best Practices

### ✅ Implemented
- Password hashing with bcrypt (12 rounds)
- SQL injection protection via parameterized queries
- JWT authentication with expiration
- CORS configuration
- Rate limiting
- Security headers (Helmet.js)
- HTTPS/SSL support
- Non-root Docker users

### 📝 Additional Recommendations
- [ ] Set up firewall (UFW/iptables)
- [ ] Install fail2ban
- [ ] Enable SSH key authentication only
- [ ] Regular security updates
- [ ] Database SSL/TLS connections (for external DB)
- [ ] Regular security audits
- [ ] Implement WAF (Web Application Firewall)
- [ ] Set up intrusion detection

---

## Production Checklist

Refer to `DEPLOYMENT_CHECKLIST.md` for a comprehensive checklist covering:
- Pre-deployment setup
- Deployment steps
- Post-deployment verification
- Security verification
- Monitoring setup
- Backup configuration

---

## Support

For issues:
1. Check the troubleshooting section
2. Review logs: `docker-compose logs`
3. Run health check: `./scripts/monitor.sh`
4. Consult `DEPLOYMENT_GUIDE.md`
5. Check `DEPLOYMENT_CHECKLIST.md`

---

## Quick Reference

### Essential Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f

# Run migration
docker-compose exec backend npm run migrate

# Create backup
./scripts/backup-db.sh

# Health check
./scripts/monitor.sh

# Rebuild after code changes
docker-compose up -d --build
```

---

**Last Updated**: 2025-01-27
**Version**: 1.0.0


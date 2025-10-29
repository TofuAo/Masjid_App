# MyMasjidApp Deployment Guide

This guide will walk you through deploying the MyMasjidApp to a production environment.

## Prerequisites

- Docker and Docker Compose installed
- A VPS or cloud server (Ubuntu 20.04+ recommended)
- Domain name pointing to your server
- Basic knowledge of Linux commands

## Quick Start

### 1. Environment Setup

1. **Clone the repository** to your server:
   ```bash
   git clone <your-repository-url>
   cd MyMasjidApp
   ```

2. **Set up environment variables**:
   ```bash
   # Copy the production environment files
   cp backend/env.production backend/.env
   cp env.production .env
   
   # Edit the files with your actual values
   nano backend/.env
   nano .env
   ```

3. **Update configuration**:
   - Update `backend/.env` with your database credentials and JWT secret
   - Update `.env` with your domain name
   - Update `nginx/nginx.conf` with your domain name

### 2. Database Setup

The application uses MySQL. The database schema will be automatically created when you run the deployment script.

**Manual setup** (if needed):
```bash
# Connect to MySQL
mysql -u root -p

# Create database
CREATE DATABASE masjid_app;
CREATE USER 'masjid_user'@'%' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON masjid_app.* TO 'masjid_user'@'%';
FLUSH PRIVILEGES;
EXIT;

# Import schema
mysql -u masjid_user -p masjid_app < database/masjid_app_schema.sql
```

### 3. Deploy with Docker

**Option A: Using the deployment script**
```bash
# Linux/macOS
./deploy.sh

# Windows
deploy.bat
```

**Option B: Manual deployment**
```bash
# Build and start services
docker-compose down --remove-orphans
docker-compose build --no-cache
docker-compose up -d

# Check status
docker-compose ps
```

### 4. SSL Certificate Setup

1. **Install Certbot**:
   ```bash
   sudo apt update
   sudo apt install certbot python3-certbot-nginx
   ```

2. **Obtain SSL certificate**:
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

3. **Update nginx configuration** to use the certificates:
   ```bash
   # The certificates will be at:
   # /etc/letsencrypt/live/yourdomain.com/fullchain.pem
   # /etc/letsencrypt/live/yourdomain.com/privkey.pem
   ```

### 5. Production Configuration

1. **Update nginx/nginx.conf**:
   - Replace `yourdomain.com` with your actual domain
   - Update SSL certificate paths
   - Adjust rate limiting as needed

2. **Set up firewall**:
   ```bash
   sudo ufw allow 22
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw enable
   ```

3. **Configure automatic SSL renewal**:
   ```bash
   sudo crontab -e
   # Add this line:
   0 12 * * * /usr/bin/certbot renew --quiet
   ```

## Manual VPS Deployment

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Nginx (if not using Docker)
sudo apt install nginx -y
```

### 2. Application Deployment

```bash
# Clone repository
git clone <your-repository-url>
cd MyMasjidApp

# Set up environment
cp backend/env.production backend/.env
cp env.production .env

# Edit configuration files
nano backend/.env
nano .env
nano nginx/nginx.conf

# Deploy
docker-compose up -d
```

### 3. Nginx Configuration (Non-Docker)

If you prefer to use the system Nginx instead of Docker:

```bash
# Copy nginx configuration
sudo cp nginx/nginx.conf /etc/nginx/sites-available/masjid-app
sudo ln -s /etc/nginx/sites-available/masjid-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Monitoring and Logging

### 1. Application Logs

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs nginx
```

### 2. Database Monitoring

```bash
# Connect to database
docker-compose exec mysql mysql -u masjid_user -p masjid_app

# Check database status
docker-compose exec mysql mysqladmin -u root -p status
```

### 3. System Monitoring

```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Monitor system resources
htop
```

## Security Best Practices

### 1. Environment Security

- [ ] Use strong passwords for database and JWT secrets
- [ ] Enable firewall and configure proper rules
- [ ] Keep system and Docker images updated
- [ ] Use HTTPS only in production
- [ ] Implement rate limiting

### 2. Database Security

- [ ] Use non-root database user
- [ ] Enable SSL for database connections
- [ ] Regular database backups
- [ ] Monitor database access logs

### 3. Application Security

- [ ] Validate all inputs
- [ ] Use parameterized queries (already implemented)
- [ ] Implement proper authentication and authorization
- [ ] Regular security updates

## Backup Strategy

### 1. Database Backup

```bash
# Create backup script
cat > backup_db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec mysql mysqldump -u masjid_user -p masjid_app > backup_${DATE}.sql
gzip backup_${DATE}.sql
EOF

chmod +x backup_db.sh

# Schedule daily backups
echo "0 2 * * * /path/to/backup_db.sh" | crontab -
```

### 2. Application Backup

```bash
# Backup uploads directory
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/

# Backup configuration
tar -czf config_backup_$(date +%Y%m%d).tar.gz backend/.env .env nginx/
```

## Troubleshooting

### Common Issues

1. **Port already in use**:
   ```bash
   sudo netstat -tulpn | grep :80
   sudo kill -9 <PID>
   ```

2. **Database connection failed**:
   - Check database credentials in `.env`
   - Ensure MySQL container is running
   - Check database logs: `docker-compose logs mysql`

3. **SSL certificate issues**:
   - Verify domain DNS settings
   - Check certificate validity: `openssl x509 -in cert.pem -text -noout`
   - Renew certificates: `sudo certbot renew`

4. **Application not loading**:
   - Check container status: `docker-compose ps`
   - Check logs: `docker-compose logs`
   - Verify nginx configuration: `nginx -t`

### Performance Optimization

1. **Enable gzip compression** (already configured)
2. **Set up CDN** for static assets
3. **Implement caching** for API responses
4. **Use Redis** for session storage
5. **Optimize database queries**

## Maintenance

### Regular Tasks

- [ ] Monitor application logs
- [ ] Check disk space usage
- [ ] Update dependencies
- [ ] Backup database
- [ ] Review security logs
- [ ] Test SSL certificate renewal

### Updates

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Support

For issues and questions:
- Check the logs first
- Review this deployment guide
- Check the application documentation
- Contact the development team

---

**Note**: This guide assumes you have basic knowledge of Linux, Docker, and web server administration. For production deployments, consider consulting with a DevOps specialist.

# MyMasjidApp Deployment Checklist

This checklist ensures a complete and secure deployment of the MyMasjidApp.

## ✅ Pre-Deployment Setup

### Environment Configuration
- [ ] Run `./setup-env.sh` (Linux/macOS) or `setup-env.bat` (Windows) to create .env files
- [ ] Edit `backend/.env` with production values:
  - [ ] Database credentials (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)
  - [ ] Strong JWT_SECRET (minimum 32 characters)
  - [ ] Production FRONTEND_URL
  - [ ] NODE_ENV=production
- [ ] Edit `.env` (root) with production frontend settings:
  - [ ] VITE_API_BASE_URL (your production API URL)
  - [ ] VITE_APP_NAME
  - [ ] VITE_APP_VERSION

### Database Setup
- [ ] Database server is accessible
- [ ] Database user has proper permissions
- [ ] Database credentials are correct in `backend/.env`

## ✅ Deployment Steps

### 1. Initial Setup
- [ ] Clone repository to production server
- [ ] Ensure Docker and Docker Compose are installed
- [ ] Run environment setup script: `./setup-env.sh` or `setup-env.bat`
- [ ] Configure environment variables in `.env` files

### 2. Database Migration
- [ ] Option A (Docker): Run `./deploy.sh` - migrations run automatically
- [ ] Option B (Manual): Run `./scripts/init-db.sh` to initialize database
- [ ] Verify database tables were created successfully
- [ ] Check database connection from backend

### 3. Build and Deploy
- [ ] Run `./deploy.sh` (Linux/macOS) or `deploy.bat` (Windows)
- [ ] Wait for all containers to start
- [ ] Verify all services are running: `docker-compose ps`
- [ ] Check service logs for errors: `docker-compose logs`

### 4. SSL Certificate Setup
- [ ] Update domain name in `nginx/nginx.conf`
- [ ] Run `sudo ./setup-ssl.sh yourdomain.com your-email@example.com`
- [ ] Verify SSL certificates are created
- [ ] Test HTTPS connection

### 5. Nginx Configuration
- [ ] Update `nginx/nginx.conf` with your domain name
- [ ] Verify SSL certificate paths are correct
- [ ] Test nginx configuration: `docker-compose exec nginx nginx -t`
- [ ] Restart nginx if needed: `docker-compose restart nginx`

## ✅ Post-Deployment Verification

### Health Checks
- [ ] Run `./scripts/monitor.sh` to check all services
- [ ] Verify backend health endpoint: `http://yourdomain.com/api/health`
- [ ] Verify frontend is accessible: `http://yourdomain.com`
- [ ] Test API endpoints are working
- [ ] Verify database connection from application

### Security Verification
- [ ] HTTPS is working (redirects HTTP to HTTPS)
- [ ] SSL certificate is valid and not expired
- [ ] Firewall is configured (ports 80, 443, 22 only)
- [ ] Strong passwords are set for database and JWT
- [ ] Rate limiting is active
- [ ] Security headers are present in responses

### Functionality Testing
- [ ] User registration works
- [ ] User login works
- [ ] JWT authentication is working
- [ ] CRUD operations work for all modules
- [ ] File uploads work (if applicable)
- [ ] Database queries are executing correctly

## ✅ Monitoring and Maintenance

### Logging
- [ ] Application logs are accessible: `docker-compose logs`
- [ ] Nginx logs are being written: `nginx/logs/`
- [ ] Error logs are monitored
- [ ] Log rotation is configured

### Backup Strategy
- [ ] Database backup script is working: `./scripts/backup-db.sh`
- [ ] Automated daily backups are scheduled (cron job)
- [ ] Backup retention policy is set (7 days minimum)
- [ ] Backup restoration has been tested

### Monitoring
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom, etc.)
- [ ] Configure alerting for service failures
- [ ] Monitor disk space usage
- [ ] Monitor database size and growth

### Maintenance Tasks
- [ ] SSL certificate auto-renewal is configured
- [ ] System updates are scheduled
- [ ] Docker images are updated regularly
- [ ] Dependencies are kept up to date

## ✅ Security Best Practices

### Application Security
- [ ] Passwords are hashed using bcrypt (already implemented)
- [ ] SQL injection protection via parameterized queries (already implemented)
- [ ] CORS is properly configured
- [ ] JWT tokens have proper expiration
- [ ] Rate limiting is active
- [ ] Input validation is working

### Infrastructure Security
- [ ] SSH key authentication is enabled
- [ ] Root login is disabled
- [ ] Firewall (UFW/iptables) is configured
- [ ] Fail2ban is installed and configured (recommended)
- [ ] Regular security updates are applied
- [ ] Non-root user for application (Docker handles this)

### Database Security
- [ ] Database user has minimal required permissions
- [ ] Root database password is strong
- [ ] Database is not exposed to public internet
- [ ] SSL/TLS for database connections (if external)

## ✅ Documentation

- [ ] Deployment guide is reviewed: `DEPLOYMENT_GUIDE.md`
- [ ] Environment variables are documented
- [ ] API endpoints are documented
- [ ] Troubleshooting guide is available

## 🚨 Emergency Procedures

### If Application is Down
1. Check container status: `docker-compose ps`
2. Check logs: `docker-compose logs [service]`
3. Check database connection
4. Restart services: `docker-compose restart`
5. Check disk space: `df -h`

### If Database is Corrupted
1. Stop application: `docker-compose stop backend`
2. Restore from latest backup
3. Verify data integrity
4. Restart application

### If SSL Certificate Expired
1. Renew certificate: `sudo certbot renew`
2. Restart nginx: `docker-compose restart nginx`
3. Verify HTTPS is working

## 📝 Notes

- Keep backups of `.env` files in a secure location
- Document any custom configurations
- Keep deployment logs for troubleshooting
- Test disaster recovery procedures regularly

---

**Last Updated**: $(date)
**Deployed By**: [Your Name]
**Environment**: Production

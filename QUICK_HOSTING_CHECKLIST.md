# Quick Hosting Checklist

A quick reference checklist for hosting MyMasjidApp on a server.

## Pre-Deployment

- [ ] Server purchased (VPS/Cloud server with Ubuntu 20.04+)
- [ ] Domain name purchased and configured
- [ ] SSH access to server working
- [ ] Server IP address noted

## Server Setup

- [ ] System updated (`sudo apt update && sudo apt upgrade -y`)
- [ ] Docker installed (`docker --version`)
- [ ] Docker Compose installed (`docker-compose --version`)
- [ ] Firewall configured (ports 22, 80, 443 open)
- [ ] User added to docker group

## Application Setup

- [ ] Application files uploaded/cloned to server
- [ ] `backend/.env` file created and configured
- [ ] Root `.env` file created and configured
- [ ] Domain name updated in `nginx/nginx.conf`
- [ ] Strong passwords set (database, JWT secret)
- [ ] Database credentials configured

## Deployment

- [ ] Deployment script executed (`./deploy.sh`)
- [ ] All containers running (`docker-compose ps`)
- [ ] Database migrations completed
- [ ] No errors in logs (`docker-compose logs`)

## Domain & SSL

- [ ] DNS records configured (A records for domain and www)
- [ ] DNS propagated (verified with `nslookup`)
- [ ] SSL certificate obtained (Let's Encrypt)
- [ ] SSL certificates copied to `nginx/ssl/`
- [ ] HTTPS working (no browser warnings)
- [ ] Auto-renewal configured for SSL

## Security

- [ ] Strong database password set
- [ ] Strong JWT secret set (32+ characters)
- [ ] Firewall enabled and configured
- [ ] Root SSH disabled (if applicable)
- [ ] SSL/TLS configured correctly

## Monitoring & Backups

- [ ] Backup script tested (`./scripts/backup-db.sh`)
- [ ] Automatic backups scheduled (cron job)
- [ ] Monitoring script tested (`./scripts/monitor.sh`)
- [ ] Log rotation configured

## Testing

- [ ] Website accessible via HTTP
- [ ] Website accessible via HTTPS
- [ ] Login functionality works
- [ ] All features tested
- [ ] Mobile view tested
- [ ] API endpoints working

## Post-Deployment

- [ ] All services running correctly
- [ ] No errors in application logs
- [ ] Performance acceptable
- [ ] Documentation updated
- [ ] Team trained on system management

---

## Quick Commands Reference

```bash
# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Check health
curl http://localhost:5000/health

# Access database
docker-compose exec mysql mysql -u masjid_user -p masjid_app

# Create backup
./scripts/backup-db.sh

# Monitor system
./scripts/monitor.sh
```

---

**For detailed instructions, see:** `SERVER_HOSTING_GUIDE.md`


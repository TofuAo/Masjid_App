# 🚀 MyMasjidApp - Quick Start Deployment

Get your application up and running in minutes!

## Prerequisites Checklist
- [ ] Docker and Docker Compose installed
- [ ] Git installed
- [ ] Terminal/Command Prompt access
- [ ] Basic Linux/Windows knowledge

## ⚡ 5-Minute Deployment (Development)

### Step 1: Clone and Setup
```bash
git clone <your-repo-url>
cd MyMasjidApp
```

### Step 2: Create Environment Files
```bash
# Linux/macOS
./setup-env.sh

# Windows
setup-env.bat
```

### Step 3: Deploy
```bash
# Linux/macOS
./deploy.sh

# Windows
deploy.bat
```

### Step 4: Access Your App
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

**Default Login (from schema):**
- Email: `admin@madrasah.com`
- Password: `admin123`

## 🎯 Production Deployment (10 Steps)

### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker (if not installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### 2. Clone Repository
```bash
git clone <your-repo-url>
cd MyMasjidApp
```

### 3. Setup Environment
```bash
./setup-env.sh
nano backend/.env    # Edit with your values
nano .env            # Edit with your domain
```

### 4. Configure Database
Edit `backend/.env`:
```env
DB_HOST=mysql
DB_USER=your_secure_user
DB_PASSWORD=your_secure_password
DB_NAME=masjid_app
JWT_SECRET=your_32_char_secret_here
```

### 5. Deploy Application
```bash
./deploy.sh
```

### 6. Setup SSL Certificate
```bash
# Update domain in nginx/nginx.conf first
sudo ./setup-ssl.sh yourdomain.com admin@yourdomain.com
```

### 7. Verify Deployment
```bash
./scripts/monitor.sh
```

### 8. Test Your Application
- Visit: `https://yourdomain.com`
- Test login
- Test API endpoints

### 9. Setup Backups
```bash
# Test backup
./scripts/backup-db.sh

# Schedule daily backups
crontab -e
# Add: 0 2 * * * /path/to/MyMasjidApp/scripts/backup-db.sh
```

### 10. Configure Firewall
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 🛠️ Common Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart a service
docker-compose restart backend

# Run database migration
docker-compose exec backend npm run migrate

# Create backup
./scripts/backup-db.sh

# Health check
./scripts/monitor.sh

# Rebuild after code changes
docker-compose up -d --build
```

## 📋 Quick Troubleshooting

**Containers won't start?**
```bash
docker-compose logs
docker-compose ps
```

**Database connection failed?**
- Check `backend/.env` credentials
- Verify MySQL container is running: `docker-compose ps mysql`
- Check logs: `docker-compose logs mysql`

**Frontend not loading?**
- Rebuild: `npm run build && docker-compose up -d --build frontend`
- Check logs: `docker-compose logs frontend`

**Migration errors?**
```bash
docker-compose exec backend npm run migrate
```

## 📚 Documentation

- **Full Deployment Guide**: See `DEPLOYMENT_README.md`
- **Security Guide**: See `SECURITY_GUIDE.md`
- **Deployment Checklist**: See `DEPLOYMENT_CHECKLIST.md`
- **Original Guide**: See `DEPLOYMENT_GUIDE.md`

## 🆘 Need Help?

1. Check the logs: `docker-compose logs`
2. Run health check: `./scripts/monitor.sh`
3. Review documentation files
4. Check troubleshooting section in `DEPLOYMENT_README.md`

## ✅ Post-Deployment Checklist

- [ ] Application accessible via domain
- [ ] HTTPS working (SSL certificate valid)
- [ ] Can login with admin account
- [ ] Database migrations completed
- [ ] Backups configured
- [ ] Monitoring set up
- [ ] Firewall configured
- [ ] Environment variables secure

---

**Ready to deploy?** Start with Step 1 above! 🚀


# Production Setup Quick Reference

## 🇲🇾 For Malaysian Users

**Best Options:**
1. **Exabytes Malaysia** - Local provider, lowest latency, Malay support (RM 30-80/month)
2. **DigitalOcean Singapore** - Global provider, excellent service (RM 28-56/month)
3. **Hostinger Malaysia** - Easy setup, Docker pre-installed (RM 25-60/month)

**See `MALAYSIA_HOSTING_GUIDE.md` for detailed Malaysia-specific guide.**

---

## 🎯 Recommended: DigitalOcean Droplet (Singapore Region)

**Why?** Best for Docker Compose, full control, cost-effective ($6-12/month)
**⚠️ IMPORTANT:** Select **SINGAPORE** region for lowest latency to Malaysia!

## Quick Start (5 Steps)

### 1. Create Droplet
- Ubuntu 22.04 LTS
- $6/month (1GB) or $12/month (2GB)
- Add SSH key

### 2. Initial Setup
```bash
ssh root@your_server_ip
curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh
apt install docker-compose-plugin git -y
```

### 3. Deploy Code
```bash
mkdir -p /opt/mymasjidapp && cd /opt/mymasjidapp
git clone https://github.com/yourusername/MyMasjidApp.git .
# OR upload via SCP
```

### 4. Configure & Deploy
```bash
# Set up environment variables
cp backend/env.production backend/.env
nano backend/.env  # Edit with your values

cp env.production .env
nano .env  # Edit with your values

# Set up SSL (if you have domain)
apt install certbot -y
certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem

# Deploy
chmod +x deploy-production.sh
./deploy-production.sh
```

### 5. Configure Firewall
```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

## Environment Variables Checklist

**backend/.env:**
- ✅ `DB_PASSWORD` - Strong password
- ✅ `JWT_SECRET` - Random 32+ chars
- ✅ `FRONTEND_URL` - https://yourdomain.com
- ✅ `EMAIL_USER` - Your email
- ✅ `EMAIL_PASSWORD` - App password

**.env:**
- ✅ `VITE_API_BASE_URL` - https://yourdomain.com/api

## Post-Deployment

```bash
# Check status
docker compose ps

# View logs
docker compose logs -f

# Create admin user
docker compose exec backend npm run create-master-admin

# Test application
curl https://yourdomain.com/health
```

## Alternative: Railway (Easier)

1. Sign up at railway.app
2. Install CLI: `npm i -g @railway/cli`
3. Run: `railway init && railway up`
4. Add MySQL database in dashboard
5. Configure environment variables
6. Deploy!

**Cost:** $5-20/month, auto-deploys from Git

## Support

- Full guide: See `DEPLOYMENT_GUIDE.md`
- Troubleshooting: Check logs with `docker compose logs`


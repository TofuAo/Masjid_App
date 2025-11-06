# VPS Quick Start - Deploy in 10 Minutes

Ultra-fast deployment guide for MyMasjidApp on a VPS.

## 🏆 Recommended Provider: DigitalOcean

**Why DigitalOcean:**
- ✅ Easiest to use
- ✅ $200 free credit for new users
- ✅ Excellent documentation
- ✅ Great support

**Get Started:** https://www.digitalocean.com/

---

## ⚡ Quick Deployment (10 Minutes)

### Step 1: Create VPS (2 minutes)

1. **Sign up at DigitalOcean:**
   - Go to https://www.digitalocean.com/
   - Click "Sign Up"
   - Use GitHub or email
   - **Get $200 free credit!**

2. **Create Droplet:**
   - Click "Create" → "Droplets"
   - **Region**: Choose closest to you
   - **Image**: Ubuntu 22.04 (LTS)
   - **Plan**: **$6/month** (1GB RAM) - Perfect for your app
   - **Authentication**: SSH keys (recommended) or Password
   - **Name**: `mymasjidapp`
   - Click "Create Droplet"
   - Wait 1 minute

3. **Get Your Server IP:**
   - Copy the IP address shown
   - Example: `157.230.123.45`

### Step 2: Connect to Server (1 minute)

```bash
# Connect via SSH
ssh root@YOUR_SERVER_IP

# Or if using password
ssh root@YOUR_SERVER_IP
# Enter password when prompted
```

### Step 3: Run Setup Script (3 minutes)

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Configure firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

### Step 4: Deploy Application (4 minutes)

```bash
# Clone your repository
git clone https://github.com/yourusername/MyMasjidApp.git
cd MyMasjidApp

# Or upload files via SCP from your local machine:
# scp -r /path/to/MyMasjidApp root@YOUR_SERVER_IP:~/

# Set up environment
cp backend/env.production backend/.env
cp env.production .env

# Generate passwords
openssl rand -base64 24 > db_password.txt
openssl rand -base64 32 > jwt_secret.txt

# Update backend/.env (quick edit)
nano backend/.env
# Replace:
# - DB_PASSWORD with password from db_password.txt
# - JWT_SECRET with secret from jwt_secret.txt
# - FRONTEND_URL with http://YOUR_SERVER_IP (for now)

# Deploy
chmod +x deploy.sh
./deploy.sh
```

### Step 5: Access Your App!

**Visit in browser:**
```
http://YOUR_SERVER_IP
```

**🎉 Your app is live!**

---

## 🔧 Quick Configuration

### Update Domain (Optional)

1. **Point domain to your server:**
   - Go to your domain registrar
   - Create A record: `@` → `YOUR_SERVER_IP`
   - Create A record: `www` → `YOUR_SERVER_IP`

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

### Set Up SSL (Optional but Recommended)

```bash
# Install Certbot
apt install -y certbot

# Stop nginx container
docker-compose stop nginx

# Get SSL certificate
certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy certificates
mkdir -p nginx/ssl
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem
chmod 644 nginx/ssl/cert.pem
chmod 600 nginx/ssl/key.pem

# Restart nginx
docker-compose restart nginx
```

---

## 📊 Quick Commands

```bash
# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Rebuild after code changes
docker-compose up -d --build
```

---

## 💰 Cost

**DigitalOcean:**
- **$6/month** (1GB RAM) - Perfect for your app
- **$12/month** (2GB RAM) - If you have more users

**Other Options:**
- **Linode**: $5/month (1GB)
- **Vultr**: $6/month (1GB)
- **Hetzner**: €4.51/month (2GB) - Europe

---

## 🆘 Troubleshooting

### Can't access website?

```bash
# Check containers
docker-compose ps

# Check firewall
ufw status

# Check logs
docker-compose logs
```

### Can't connect via SSH?

- Verify IP address is correct
- Check email from DigitalOcean for root password (if using password auth)
- Try: `ssh root@YOUR_IP`

---

## ✅ Done!

Your MyMasjidApp is now:
- ✅ Running on VPS
- ✅ Accessible via IP address
- ✅ Ready for domain and SSL
- ✅ Auto-restarting on reboot

**Next:** Read `VPS_DEPLOYMENT_GUIDE.md` for detailed configuration.

---

**Provider Links:**
- **DigitalOcean**: https://www.digitalocean.com/ (Recommended)
- **Linode**: https://www.linode.com/
- **Vultr**: https://www.vultr.com/
- **Hetzner**: https://www.hetzner.com/


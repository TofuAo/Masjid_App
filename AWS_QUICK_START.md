# AWS Quick Start Guide - Deploy in 15 Minutes

Quick step-by-step guide to deploy MyMasjidApp on AWS EC2.

## 🚀 Quick Deployment Steps

### Step 1: Launch EC2 Instance (5 minutes)

1. **Go to AWS Console** → EC2
2. **Click "Launch Instance"**
3. **Configure:**
   - Name: `MyMasjidApp`
   - AMI: **Ubuntu Server 22.04 LTS**
   - Instance type: **t2.micro** (Free tier)
   - Key pair: **Create new** → Download `.pem` file
   - Network settings: **Allow SSH (22), HTTP (80), HTTPS (443)**
   - Storage: **20GB**
4. **Click "Launch Instance"**
5. **Wait 2-3 minutes** for instance to start
6. **Note your Public IPv4 address**

### Step 2: Connect to Instance (2 minutes)

**Linux/Mac:**
```bash
chmod 400 masjid-app-key.pem
ssh -i masjid-app-key.pem ubuntu@YOUR_PUBLIC_IP
```

**Windows (PuTTY):**
- Convert `.pem` to `.ppk` using PuTTYgen
- Connect using PuTTY

### Step 3: Run Setup Script (3 minutes)

```bash
# Download and run setup script
curl -o aws-setup.sh https://raw.githubusercontent.com/yourusername/MyMasjidApp/main/aws-setup.sh
chmod +x aws-setup.sh
./aws-setup.sh

# Log out and log back in
exit
ssh -i masjid-app-key.pem ubuntu@YOUR_PUBLIC_IP
```

### Step 4: Clone and Deploy (5 minutes)

```bash
# Clone your repository
git clone https://github.com/yourusername/MyMasjidApp.git
cd MyMasjidApp

# Or upload files via SCP from your local machine:
# scp -i masjid-app-key.pem -r /path/to/MyMasjidApp ubuntu@YOUR_IP:~/

# Run deployment script
chmod +x aws-deploy.sh
./aws-deploy.sh
```

### Step 5: Access Your Application

**Visit in browser:**
```
http://YOUR_PUBLIC_IP
```

**That's it! Your app is live! 🎉**

---

## 🔧 Post-Deployment Configuration

### Configure Domain (Optional)

1. **Point domain to EC2 IP:**
   - Go to your domain registrar
   - Create A record: `@` → `YOUR_EC2_IP`
   - Create A record: `www` → `YOUR_EC2_IP`

2. **Update nginx config:**
   ```bash
   nano nginx/nginx.conf
   # Replace 'yourdomain.com' with your domain
   ```

3. **Update environment files:**
   ```bash
   nano .env
   # Update DOMAIN and VITE_API_BASE_URL
   
   nano backend/.env
   # Update FRONTEND_URL
   ```

### Set Up SSL (Optional but Recommended)

```bash
# Stop nginx container
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

---

## 📋 Quick Commands Reference

```bash
# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Rebuild after code changes
docker-compose up -d --build

# Access database
docker-compose exec mysql mysql -u masjid_user -p masjid_app

# Create backup
./scripts/backup-db.sh
```

---

## ⚠️ Important Security Steps

1. **Update passwords:**
   ```bash
   nano backend/.env
   # Change DB_PASSWORD and JWT_SECRET
   ```

2. **Restrict SSH access:**
   - AWS Console → EC2 → Security Groups
   - Edit inbound rules
   - Change SSH source to "My IP"

3. **Set up backups:**
   ```bash
   crontab -e
   # Add: 0 2 * * * cd ~/MyMasjidApp && ./scripts/backup-db.sh
   ```

---

## 🆘 Troubleshooting

### Can't access website?

```bash
# Check containers
docker-compose ps

# Check security group
# AWS Console → EC2 → Security Groups → Allow HTTP/HTTPS

# Check logs
docker-compose logs
```

### Can't connect via SSH?

- Verify security group allows SSH from your IP
- Check key file permissions: `chmod 400 masjid-app-key.pem`
- Ensure instance is "Running" in AWS Console

### Application errors?

```bash
# Check backend logs
docker-compose logs backend

# Check frontend logs
docker-compose logs frontend

# Check database
docker-compose logs mysql

# Restart services
docker-compose restart
```

---

## 💰 Cost Estimate

**Free Tier (First 12 months):**
- EC2 t2.micro: **$0**
- EBS Storage (20GB): **$0**
- Data Transfer: **$0**
- **Total: $0/month**

**After Free Tier:**
- EC2 t2.micro: **~$8-10/month**
- EBS Storage: **~$2/month**
- Data Transfer: **~$1/month**
- **Total: ~$10-13/month**

---

## 📚 Additional Resources

- **Full AWS Guide:** `AWS_DEPLOYMENT_GUIDE.md`
- **Server Hosting Guide:** `SERVER_HOSTING_GUIDE.md`
- **Deployment Guide:** `DEPLOYMENT_GUIDE.md`

---

**Need help?** Check the troubleshooting section in `AWS_DEPLOYMENT_GUIDE.md`


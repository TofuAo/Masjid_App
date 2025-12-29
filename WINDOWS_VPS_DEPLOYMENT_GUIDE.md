# Windows VPS Deployment Guide for MyMasjidApp

## ⚠️ Important: Your VPS is Windows 2022

Your Shinjiru VPS is running **Windows Server 2022**, but MyMasjidApp is designed for **Linux**. You have 3 options:

---

## 🎯 Option 1: Reinstall with Linux (RECOMMENDED) ⭐

**This is the easiest and best option!**

### Step 1: Access Your VPS Control Panel

1. Log into your Shinjiru client area: `billing.shinjiru.com.my`
2. Go to your VPS management page
3. Look for **"Rebuild"** or **"Reinstall OS"** button

### Step 2: Reinstall with Ubuntu

1. Click **"Rebuild"** button (blue gear icon)
2. Select **"Ubuntu 22.04 LTS"** or **"Ubuntu 24.04 LTS"**
3. Confirm the rebuild (this will erase all data)
4. Wait 5-10 minutes for installation

### Step 3: Get New Root Password

1. After rebuild, check your email or control panel
2. You'll receive a new root password
3. Note down the password securely

### Step 4: Connect via SSH

**On Windows (using PowerShell or Command Prompt):**

```powershell
# If you don't have SSH, install OpenSSH first:
# Settings > Apps > Optional Features > Add OpenSSH Client

# Connect to your server
ssh root@124.217.248.113
# Enter password when prompted
```

**Or use PuTTY (download from putty.org):**
- Host: `124.217.248.113`
- Port: `22`
- Connection type: `SSH`
- Username: `root`

### Step 5: Follow Linux Deployment Steps

Once you have Ubuntu installed, follow the deployment steps below.

---

## 🎯 Option 2: Use WSL2 on Windows (Advanced)

If you want to keep Windows, you can use WSL2 (Windows Subsystem for Linux).

### Step 1: Enable WSL2 on Windows Server 2022

```powershell
# Run PowerShell as Administrator
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux
Enable-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform

# Restart server
Restart-Computer
```

### Step 2: Install Ubuntu in WSL2

```powershell
# After restart, install Ubuntu
wsl --install -d Ubuntu-22.04

# Or download from Microsoft Store
# Search for "Ubuntu 22.04 LTS"
```

### Step 3: Install Docker Desktop for Windows

1. Download Docker Desktop: https://www.docker.com/products/docker-desktop
2. Install and enable WSL2 backend
3. Start Docker Desktop

### Step 4: Deploy in WSL2

```bash
# Open Ubuntu terminal (WSL2)
wsl

# Navigate to your project
cd /mnt/c/MyMasjidApp  # Adjust path as needed

# Follow deployment steps below
```

**Note:** This is more complex and may have performance issues. Option 1 (reinstall with Linux) is recommended.

---

## 🎯 Option 3: Manual Deployment on Windows (Not Recommended)

This requires installing Node.js, MySQL, and Nginx manually on Windows. It's complex and not recommended.

---

## 🚀 Linux Deployment Steps (After Reinstalling with Ubuntu)

Once you have Ubuntu installed, follow these steps:

### Step 1: Initial Server Setup

```bash
# Connect via SSH
ssh root@124.217.248.113

# Update system
apt update && apt upgrade -y

# Install essential tools
apt install -y git curl wget nano ufw
```

### Step 2: Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install -y docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

### Step 3: Upload Your Code

**Option A: Using Git (Recommended if your code is on GitHub/GitLab)**

```bash
# Install Git
apt install -y git

# Clone your repository
cd /opt
git clone https://github.com/yourusername/MyMasjidApp.git
cd MyMasjidApp
```

**Option B: Using SCP (from your local Windows machine)**

On your **local Windows machine**, open PowerShell:

```powershell
# Navigate to your project folder
cd C:\MyMasjidApp

# Upload to server (replace with your actual password)
scp -r * root@124.217.248.113:/opt/mymasjidapp/

# Or use WinSCP (GUI tool): https://winscp.net
```

Then on the server:

```bash
# Create directory
mkdir -p /opt/mymasjidapp
cd /opt/mymasjidapp
```

### Step 4: Configure Environment Variables

```bash
cd /opt/mymasjidapp

# Create backend .env file
cp backend/env.production backend/.env
nano backend/.env
```

**Edit these important variables:**

```env
DB_PASSWORD=your_strong_password_here
JWT_SECRET=your_jwt_secret_here
FRONTEND_URL=http://124.217.248.113
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

**Generate secure passwords:**

```bash
# Generate DB password
openssl rand -base64 24

# Generate JWT secret
openssl rand -base64 32
```

Save and exit (Ctrl+X, then Y, then Enter)

### Step 5: Configure Firewall

```bash
# Allow SSH, HTTP, HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable
```

### Step 6: Deploy Application

```bash
cd /opt/mymasjidapp

# Make deployment script executable
chmod +x vps-deploy-existing.sh

# Run deployment script
./vps-deploy-existing.sh
```

**Or manually:**

```bash
# Build and start services
docker compose build --no-cache
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

### Step 7: Wait for Services to Start

```bash
# Wait 30 seconds for MySQL
sleep 30

# Check if MySQL is ready
docker compose exec mysql mysqladmin ping -h localhost

# Run database migrations
docker compose exec backend npm run migrate
```

### Step 8: Access Your Application

Open your browser and visit:
- **Frontend:** http://124.217.248.113
- **Backend API:** http://124.217.248.113/api
- **Health Check:** http://124.217.248.113/api/health

---

## 🔧 Troubleshooting

### Can't Connect via SSH

1. **Check if SSH is enabled** in your VPS control panel
2. **Check firewall** - make sure port 22 is open
3. **Try using PuTTY** instead of PowerShell SSH

### Docker Won't Start

```bash
# Check Docker status
systemctl status docker

# Start Docker
systemctl start docker
systemctl enable docker
```

### Services Won't Start

```bash
# Check logs
docker compose logs

# Check specific service
docker compose logs backend
docker compose logs mysql

# Restart services
docker compose restart
```

### Can't Access Website

1. **Check if ports are open:**
   ```bash
   ufw status
   netstat -tulpn | grep :80
   ```

2. **Check if containers are running:**
   ```bash
   docker compose ps
   ```

3. **Check Nginx logs:**
   ```bash
   docker compose logs nginx
   ```

---

## 📋 Quick Reference Commands

```bash
# View all running containers
docker compose ps

# View logs
docker compose logs -f

# Restart all services
docker compose restart

# Stop all services
docker compose down

# Start all services
docker compose up -d

# Rebuild after code changes
docker compose build --no-cache
docker compose up -d

# Access MySQL
docker compose exec mysql mysql -u root -p

# Access backend container
docker compose exec backend sh
```

---

## 🔒 Security Recommendations

1. **Change default SSH port** (optional but recommended)
2. **Use SSH keys instead of passwords**
3. **Set up SSL certificate** (Let's Encrypt) for HTTPS
4. **Regular backups** of database and uploads
5. **Keep system updated:** `apt update && apt upgrade -y`

---

## 📞 Need Help?

If you encounter issues:

1. **Check logs:** `docker compose logs`
2. **Verify services:** `docker compose ps`
3. **Check firewall:** `ufw status`
4. **Contact Shinjiru support** if server issues

---

## ✅ Recommended: Reinstall with Ubuntu

**The easiest path forward:**
1. Use "Rebuild" in your VPS control panel
2. Select Ubuntu 22.04 LTS
3. Follow the Linux deployment steps above

This will save you time and avoid compatibility issues!


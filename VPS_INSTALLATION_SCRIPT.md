# VPS Installation Script - Usage Guide

## Quick Start

### For DigitalOcean / Linode / Vultr / Any Ubuntu VPS

1. **Launch your VPS** (Ubuntu 22.04 recommended)

2. **Connect via SSH:**
   ```bash
   ssh root@YOUR_VPS_IP
   ```

3. **Run the complete installation script:**
   ```bash
   # Download the script
   curl -o vps-complete-deploy.sh https://raw.githubusercontent.com/yourusername/MyMasjidApp/main/vps-complete-deploy.sh
   
   # Make executable
   chmod +x vps-complete-deploy.sh
   
   # Run it
   sudo bash vps-complete-deploy.sh
   ```

4. **When prompted, upload your application files:**
   - The script will wait for you to upload/clone your MyMasjidApp
   - Or clone from Git: `git clone https://github.com/yourusername/MyMasjidApp.git /opt/mymasjidapp`

5. **Wait for completion** (10-15 minutes)

6. **Access your app:**
   - Visit: `http://YOUR_VPS_IP`

---

## What the Script Does

1. ✅ Updates system packages
2. ✅ Installs Docker and Docker Compose
3. ✅ Configures firewall (UFW)
4. ✅ Installs Certbot for SSL
5. ✅ Sets up application directory
6. ✅ Configures environment variables
7. ✅ Generates secure passwords
8. ✅ Builds Docker images
9. ✅ Starts all services
10. ✅ Runs database migrations
11. ✅ Verifies deployment

---

## Manual Installation Alternative

If you prefer manual installation, see `INSTALL_AND_RUN_VPS.md` for step-by-step instructions.

---

## Troubleshooting

### Script fails at Docker installation

```bash
# Manually install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### Script can't find application files

```bash
# Upload files manually
cd /opt
git clone https://github.com/yourusername/MyMasjidApp.git mymasjidapp
# Then run the script again
```

### Services not starting

```bash
# Check logs
cd /opt/mymasjidapp
docker-compose logs
```

---

**For detailed instructions, see:** `INSTALL_AND_RUN_VPS.md`


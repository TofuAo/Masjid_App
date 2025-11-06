# Quick VPS Deployment - 3 Steps

## 🚀 Deploy MyMasjidApp in 3 Steps

### Step 1: Get a VPS (2 minutes)

**Recommended: DigitalOcean**
1. Sign up: https://www.digitalocean.com/
2. Create Droplet:
   - Ubuntu 22.04 LTS
   - $6/month (1GB RAM)
   - Add SSH key
3. Note your server IP

### Step 2: Connect and Run Script (5 minutes)

```bash
# Connect to your VPS
ssh root@YOUR_VPS_IP

# Run the complete installation script
curl -o install.sh https://raw.githubusercontent.com/yourusername/MyMasjidApp/main/vps-complete-deploy.sh
chmod +x install.sh
sudo bash install.sh
```

**When prompted:**
- Upload your MyMasjidApp files to `/opt/mymasjidapp`
- Or clone: `git clone https://github.com/yourusername/MyMasjidApp.git /opt/mymasjidapp`

### Step 3: Access Your App (Instant)

Visit: `http://YOUR_VPS_IP`

**🎉 Done! Your app is live!**

---

## 📋 What Gets Installed

- ✅ Docker
- ✅ Docker Compose  
- ✅ Firewall (UFW)
- ✅ Certbot (for SSL)
- ✅ All dependencies

---

## 🔧 Alternative: If You Already Have Files

If your application is already on the VPS:

```bash
cd /path/to/MyMasjidApp
chmod +x vps-deploy-existing.sh
./vps-deploy-existing.sh
```

---

## 📚 Full Documentation

- **Complete Guide**: `INSTALL_AND_RUN_VPS.md`
- **Quick Start**: `VPS_QUICK_START.md`
- **Provider Comparison**: `VPS_PROVIDER_COMPARISON.md`

---

**Need help?** Check `INSTALL_AND_RUN_VPS.md` for detailed troubleshooting.


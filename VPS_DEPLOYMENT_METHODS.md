# VPS Deployment Methods - How to Get Scripts on Your VPS

Since the scripts aren't on GitHub yet, here are several ways to deploy:

## Method 1: Copy Script Content Directly (Easiest)

### Step 1: On Your VPS, Create the Script

```bash
# Connect to your VPS
ssh root@YOUR_VPS_IP

# Create the script file
nano vps-complete-deploy.sh
```

### Step 2: Copy Script Content

1. **On your local machine**, open the file: `vps-complete-deploy.sh`
2. **Copy the entire content** (Ctrl+A, Ctrl+C)
3. **Paste into nano** on your VPS (right-click to paste, or Shift+Insert)
4. **Save and exit**: Press `Ctrl+X`, then `Y`, then `Enter`

### Step 3: Make Executable and Run

```bash
chmod +x vps-complete-deploy.sh
sudo bash vps-complete-deploy.sh
```

---

## Method 2: Upload Script via SCP (Recommended)

### From Your Local Machine (Windows/Mac/Linux)

```bash
# Upload the script to your VPS
scp vps-complete-deploy.sh root@YOUR_VPS_IP:/root/

# Or upload entire project
scp -r . root@YOUR_VPS_IP:/opt/mymasjidapp
```

### Then on VPS:

```bash
cd /root  # or /opt/mymasjidapp
chmod +x vps-complete-deploy.sh
sudo bash vps-complete-deploy.sh
```

---

## Method 3: Use SFTP (FileZilla)

1. **Download FileZilla**: https://filezilla-project.org/
2. **Connect to your VPS**:
   - Host: `sftp://YOUR_VPS_IP`
   - Username: `root`
   - Password: (your VPS password)
   - Port: `22`
3. **Upload** `vps-complete-deploy.sh` to `/root/`
4. **On VPS**, run:
   ```bash
   chmod +x /root/vps-complete-deploy.sh
   sudo bash /root/vps-complete-deploy.sh
   ```

---

## Method 4: Create Script Manually on VPS

### Quick Manual Installation (No Script Needed)

```bash
# Connect to VPS
ssh root@YOUR_VPS_IP

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

# Install Certbot
apt install -y certbot python3-certbot-nginx

# Create app directory
mkdir -p /opt/mymasjidapp
cd /opt/mymasjidapp

# Upload your MyMasjidApp files here (via SCP/SFTP)
# Then continue with deployment...
```

---

## Method 5: Upload to GitHub First

### Step 1: Push Scripts to GitHub

```bash
# On your local machine
git add vps-complete-deploy.sh vps-deploy-existing.sh vps-setup.sh
git commit -m "Add VPS deployment scripts"
git push origin main
```

### Step 2: Then Download on VPS

```bash
# On your VPS
curl -o vps-complete-deploy.sh https://raw.githubusercontent.com/TofuAo/MyMasjidApp/main/vps-complete-deploy.sh
chmod +x vps-complete-deploy.sh
sudo bash vps-complete-deploy.sh
```

---

## Method 6: One-Line Installation (After Uploading to GitHub)

Once you've pushed to GitHub, you can use:

```bash
# Replace TofuAo/MyMasjidApp with your actual GitHub username/repo
curl -fsSL https://raw.githubusercontent.com/TofuAo/MyMasjidApp/main/vps-complete-deploy.sh | sudo bash
```

---

## Recommended Approach

**For first-time deployment:**

1. **Use Method 2 (SCP)** - Upload the script file
2. **Or Method 1** - Copy/paste script content directly

**After pushing to GitHub:**

1. **Use Method 5 or 6** - Download directly from GitHub

---

## Quick Reference

### Files You Need on VPS:

- `vps-complete-deploy.sh` - Complete installation script
- `vps-deploy-existing.sh` - For existing installations
- Your `MyMasjidApp` folder - Your application files

### Upload Entire Project:

```bash
# From your local machine
scp -r C:\MyMasjidApp root@YOUR_VPS_IP:/opt/mymasjidapp
```

Then on VPS:
```bash
cd /opt/mymasjidapp
chmod +x vps-complete-deploy.sh
sudo bash vps-complete-deploy.sh
```

---

## Troubleshooting

### Can't upload via SCP?

**Windows:**
- Use **WinSCP** or **FileZilla** (SFTP)
- Or use **WSL** (Windows Subsystem for Linux)

**Mac/Linux:**
- SCP should work natively
- Or use FileZilla

### Script permissions error?

```bash
chmod +x vps-complete-deploy.sh
```

### Script not found?

```bash
# Check current directory
pwd

# List files
ls -la

# Navigate to script location
cd /path/to/script
```

---

**Choose the method that's easiest for you!** Method 2 (SCP) or Method 1 (Copy/Paste) are usually the quickest.


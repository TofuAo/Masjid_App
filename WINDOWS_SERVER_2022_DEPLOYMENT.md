# Windows Server 2022 Deployment Guide for MyMasjidApp

## 🎯 Your Situation

- **VPS:** Windows Server 2022 (Shinjiru)
- **Only Windows templates available** in control panel
- **Project:** Node.js + React + MySQL (designed for Linux/Docker)

---

## ✅ Solution: Deploy on Windows Server 2022

You have **3 options** to deploy on Windows:

### Option 1: Docker Desktop for Windows (RECOMMENDED) ⭐
- Easiest and closest to Linux deployment
- Uses same docker-compose.yml
- Best compatibility

### Option 2: WSL2 + Docker (Alternative)
- Run Linux inside Windows
- More complex setup

### Option 3: Native Windows Installation (Advanced)
- Install Node.js, MySQL, Nginx directly on Windows
- Most complex, but no Docker needed

---

## 🚀 Option 1: Docker Desktop for Windows (RECOMMENDED)

### Step 1: Connect to Your Windows VPS

**Using Remote Desktop (RDP):**

1. On your **local Windows PC**, open **Remote Desktop Connection**
   - Press `Win + R`, type `mstsc`, press Enter
2. Enter your server IP: `124.217.248.113`
3. Click **Connect**
4. Enter username: `Administrator` (or the username provided)
5. Enter password (from your VPS control panel)

**Or use the noVNC Console** in your control panel (if available)

### Step 2: Install Docker Desktop for Windows Server

1. **Download Docker Desktop:**
   - Go to: https://www.docker.com/products/docker-desktop
   - Download **Docker Desktop for Windows**
   - Choose **Windows Server** version if available

2. **Install Docker Desktop:**
   - Run the installer
   - Follow the installation wizard
   - **Important:** Enable "Use WSL 2 based engine" if prompted
   - Restart when prompted

3. **Verify Installation:**
   ```powershell
   # Open PowerShell as Administrator
   docker --version
   docker compose version
   ```

### Step 3: Upload Your Code to Windows VPS

**Option A: Using Remote Desktop + Copy/Paste**

1. Connect via RDP
2. Open File Explorer
3. Create folder: `C:\MyMasjidApp`
4. On your **local PC**, zip your project folder
5. Copy the zip file via RDP (drag and drop or copy/paste)
6. Extract in `C:\MyMasjidApp`

**Option B: Using PowerShell (SCP)**

On your **local Windows PC**:

```powershell
# Navigate to your project
cd C:\MyMasjidApp

# Upload to server (replace password when prompted)
scp -r * Administrator@124.217.248.113:C:\MyMasjidApp\
```

**Option C: Using WinSCP (GUI Tool)**

1. Download WinSCP: https://winscp.net
2. Connect to: `124.217.248.113`
3. Username: `Administrator`
4. Drag and drop your project folder

### Step 4: Configure Environment Variables

On your **Windows VPS** (via RDP or PowerShell):

```powershell
# Navigate to project
cd C:\MyMasjidApp

# Copy environment templates
Copy-Item backend\env.production backend\.env
Copy-Item env.production .env

# Edit backend\.env (use Notepad or PowerShell)
notepad backend\.env
```

**Edit these important variables in `backend\.env`:**

```env
DB_PASSWORD=your_strong_password_here
JWT_SECRET=your_jwt_secret_here
FRONTEND_URL=http://124.217.248.113
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

**Generate secure passwords in PowerShell:**

```powershell
# Generate DB password
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# Generate JWT secret
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
```

### Step 5: Configure Windows Firewall

```powershell
# Run PowerShell as Administrator

# Allow HTTP (port 80)
New-NetFirewallRule -DisplayName "HTTP" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow

# Allow HTTPS (port 443)
New-NetFirewallRule -DisplayName "HTTPS" -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow

# Allow Backend API (port 5000)
New-NetFirewallRule -DisplayName "Backend API" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow

# Allow MySQL (port 3307)
New-NetFirewallRule -DisplayName "MySQL" -Direction Inbound -LocalPort 3307 -Protocol TCP -Action Allow
```

### Step 6: Deploy Using Docker Compose

```powershell
# Navigate to project
cd C:\MyMasjidApp

# Make sure Docker Desktop is running
# Check Docker status
docker ps

# Build and start services
docker compose build --no-cache
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

### Step 7: Wait and Run Migrations

```powershell
# Wait 30 seconds for MySQL to start
Start-Sleep -Seconds 30

# Run database migrations
docker compose exec backend npm run migrate
```

### Step 8: Access Your Application

Open browser and visit:
- **Frontend:** http://124.217.248.113
- **Backend API:** http://124.217.248.113/api
- **Health Check:** http://124.217.248.113/api/health

---

## 🚀 Option 2: WSL2 + Docker (Alternative)

If Docker Desktop doesn't work, use WSL2:

### Step 1: Enable WSL2 on Windows Server 2022

```powershell
# Run PowerShell as Administrator

# Enable WSL
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

# Enable Virtual Machine Platform
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# Restart server
Restart-Computer
```

### Step 2: Install Ubuntu in WSL2

```powershell
# After restart, install Ubuntu
wsl --install -d Ubuntu-22.04

# Or download manually:
# https://aka.ms/wslubuntu2204
```

### Step 3: Install Docker in WSL2

```bash
# Open Ubuntu terminal (WSL2)
wsl

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install -y docker-compose-plugin

# Add your user to docker group
sudo usermod -aG docker $USER

# Exit and re-enter WSL
exit
wsl
```

### Step 4: Access Your Code from WSL2

```bash
# In WSL2, navigate to Windows files
cd /mnt/c/MyMasjidApp

# Deploy
docker compose build
docker compose up -d
```

---

## 🚀 Option 3: Native Windows Installation (Advanced)

If Docker doesn't work, install everything natively:

### Step 1: Install Node.js

1. Download Node.js: https://nodejs.org
2. Install **Node.js 18 LTS** (Windows Installer)
3. Verify:
   ```powershell
   node --version
   npm --version
   ```

### Step 2: Install MySQL

1. Download MySQL: https://dev.mysql.com/downloads/mysql/
2. Install MySQL Server 8.0
3. Set root password (remember this!)
4. Start MySQL service:
   ```powershell
   Start-Service MySQL80
   ```

### Step 3: Install Nginx for Windows

1. Download Nginx: http://nginx.org/en/download.html
2. Extract to `C:\nginx`
3. Start Nginx:
   ```powershell
   cd C:\nginx
   .\nginx.exe
   ```

### Step 4: Configure and Run Backend

```powershell
cd C:\MyMasjidApp\backend

# Install dependencies
npm install

# Configure .env file (edit with your settings)
notepad .env

# Run migrations
npm run migrate

# Start backend (in separate terminal)
npm start
```

### Step 5: Build and Serve Frontend

```powershell
cd C:\MyMasjidApp

# Install dependencies
npm install

# Build frontend
npm run build

# Serve with Nginx (configure nginx.conf to point to dist folder)
```

**This option is complex and requires manual Nginx configuration.**

---

## 🔧 Troubleshooting

### Docker Desktop Won't Start

1. **Check Windows version:**
   ```powershell
   systeminfo | findstr /B /C:"OS Name" /C:"OS Version"
   ```
   - Windows Server 2022 should work with Docker Desktop

2. **Enable Hyper-V (if needed):**
   ```powershell
   Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All
   Restart-Computer
   ```

3. **Check virtualization:**
   - Ensure virtualization is enabled in BIOS
   - Check in Task Manager > Performance > CPU > Virtualization

### Can't Connect via RDP

1. **Enable RDP:**
   ```powershell
   Set-ItemProperty -Path 'HKLM:\System\CurrentControlSet\Control\Terminal Server' -name "fDenyTSConnections" -value 0
   Enable-NetFirewallRule -DisplayGroup "Remote Desktop"
   ```

2. **Check firewall:**
   ```powershell
   Get-NetFirewallRule -DisplayGroup "Remote Desktop"
   ```

### Services Won't Start

```powershell
# Check Docker containers
docker compose ps

# View logs
docker compose logs backend
docker compose logs mysql
docker compose logs frontend

# Restart services
docker compose restart
```

### Port Already in Use

```powershell
# Check what's using port 80
netstat -ano | findstr :80

# Check what's using port 5000
netstat -ano | findstr :5000

# Kill process if needed (replace PID)
taskkill /PID <process_id> /F
```

---

## 📋 Quick Reference Commands

### Docker Commands (PowerShell)

```powershell
# View running containers
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

### Windows Service Commands

```powershell
# Check if service is running
Get-Service Docker

# Start service
Start-Service Docker

# Stop service
Stop-Service Docker

# Restart service
Restart-Service Docker
```

---

## 🔒 Security Recommendations

1. **Change default Administrator password**
2. **Enable Windows Firewall**
3. **Set up Windows Updates**
4. **Use strong passwords** for database and JWT
5. **Consider setting up SSL** (Let's Encrypt with Certbot)

---

## 📞 Need Help?

### Common Issues:

1. **Docker Desktop not available for Windows Server?**
   - Try WSL2 option (Option 2)
   - Or use native installation (Option 3)

2. **Can't access website?**
   - Check Windows Firewall rules
   - Verify ports are open
   - Check if services are running

3. **Database connection errors?**
   - Verify MySQL container is running
   - Check database credentials in `.env`
   - Ensure firewall allows port 3307

---

## ✅ Recommended Path Forward

**Best option:** Use **Docker Desktop for Windows** (Option 1)

1. Connect via RDP
2. Install Docker Desktop
3. Upload your code
4. Configure `.env` files
5. Run `docker compose up -d`

This will work exactly like Linux deployment!

---

## 🎯 Next Steps

1. **Connect to your VPS** via Remote Desktop
2. **Install Docker Desktop** for Windows
3. **Upload your code** to `C:\MyMasjidApp`
4. **Follow Step 4-8** from Option 1 above

Good luck! 🚀


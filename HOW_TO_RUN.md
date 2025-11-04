# 🚀 How to Run MyMasjidApp on Your Device

This guide will show you how to run the MyMasjidApp on your local machine or any device.

## 📋 Prerequisites

1. **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop/)
2. **Git** (optional, if cloning from repository)
3. **4GB+ RAM** (recommended)
4. **Windows 10/11, macOS, or Linux**

---

## 🖥️ Running on Windows

### Step 1: Install Docker Desktop

1. Download Docker Desktop from: https://www.docker.com/products/docker-desktop/
2. Install and start Docker Desktop
3. Wait for Docker to fully start (you'll see a green icon in system tray)

### Step 2: Clone/Download the Project

If you have the project files:
```powershell
# Navigate to the project directory
cd C:\MyMasjidApp
```

Or if cloning:
```powershell
git clone <your-repo-url>
cd MyMasjidApp
```

### Step 3: Start the Application

```powershell
# Start all services
docker-compose up -d

# Wait about 30 seconds for services to start
```

### Step 4: Verify It's Running

```powershell
# Check container status
docker-compose ps

# Test backend health
Invoke-RestMethod -Uri "http://localhost:5000/health"
```

You should see:
- All containers showing "Up" status
- Health endpoint returning `{"status":"healthy",...}`

### Step 5: Access the Application

Open your web browser:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **API Health**: http://localhost:5000/health

---

## 🍎 Running on macOS

### Step 1: Install Docker Desktop

```bash
# Using Homebrew
brew install --cask docker

# Or download from: https://www.docker.com/products/docker-desktop/
```

### Step 2: Start Docker Desktop

Open Docker Desktop from Applications and wait for it to start.

### Step 3: Navigate to Project

```bash
cd ~/MyMasjidApp
# or wherever your project is located
```

### Step 4: Start Services

```bash
# Start all services
docker-compose up -d

# Wait for services to start
sleep 30

# Check status
docker-compose ps
```

### Step 5: Access Application

Open browser:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

---

## 🐧 Running on Linux

### Step 1: Install Docker

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Log out and log back in for group changes to take effect
```

### Step 2: Start Services

```bash
cd ~/MyMasjidApp
docker-compose up -d
```

### Step 3: Access Application

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

---

## 📱 Access from Mobile Device (Same Network)

### Step 1: Find Your Computer's IP Address

**Windows:**
```powershell
ipconfig | findstr IPv4
# Look for something like: 192.168.1.100
```

**macOS/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
# Or
hostname -I
```

### Step 2: Configure Firewall

**Windows:**
```powershell
# Allow ports through firewall
New-NetFirewallRule -DisplayName "MyMasjidApp Frontend" `
    -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow

New-NetFirewallRule -DisplayName "MyMasjidApp Backend" `
    -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
```

**macOS:**
1. System Preferences → Security & Privacy → Firewall
2. Click "Firewall Options"
3. Add rules for ports 3000 and 5000

**Linux:**
```bash
# Ubuntu/Debian with UFW
sudo ufw allow 3000/tcp
sudo ufw allow 5000/tcp
```

### Step 3: Access from Mobile Device

On your phone/tablet browser:
- **Frontend**: `http://YOUR_IP_ADDRESS:3000`
- **Backend**: `http://YOUR_IP_ADDRESS:5000`

Example: If your IP is `192.168.1.100`:
- Frontend: `http://192.168.1.100:3000`
- Backend: `http://192.168.1.100:5000`

---

## 🧪 Testing the API

### Quick Test Script

Run the provided test script:

**Windows:**
```powershell
.\test-api.ps1
```

**macOS/Linux:**
```bash
# You can use curl or create a bash version
curl http://localhost:5000/health
```

### Manual Testing

**1. Health Check:**
```powershell
# PowerShell
Invoke-RestMethod -Uri "http://localhost:5000/health"

# Or browser
# Visit: http://localhost:5000/health
```

**2. Login:**
```powershell
$body = @{
    icNumber = "051003060229"
    password = "123456"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

**3. Get Students (with token):**
```powershell
$token = "YOUR_TOKEN_HERE"
$headers = @{
    'Authorization' = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:5000/api/students" `
    -Headers $headers
```

See `TEST_API.md` for complete API documentation.

---

## 🔧 Common Commands

### Start/Stop Services

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Check Status

```bash
# Container status
docker-compose ps

# Resource usage
docker stats

# Test backend
curl http://localhost:5000/health
```

### Troubleshooting

```bash
# Rebuild containers
docker-compose up -d --build

# Remove all containers and restart
docker-compose down
docker-compose up -d

# Check if ports are in use
# Windows
netstat -ano | findstr ":3000"
netstat -ano | findstr ":5000"

# Linux/macOS
lsof -i :3000
lsof -i :5000
```

---

## 🔐 Default Login Credentials

After starting the application, you can login with:

| Role | IC Number | Email | Password |
|------|-----------|-------|----------|
| Student | 051003060229 | ahmad@student.com | 123456 |
| Student | 040502070118 | siti@student.com | 123456 |
| Teacher | 820503060229 | rahim@teacher.com | 123456 |
| Teacher | 790204030117 | nur@teacher.com | 123456 |
| **Admin** | **990101010101** | **admin@madrasah.com** | **admin123** |

---

## 🐛 Troubleshooting

### Docker Desktop Not Starting

1. Make sure virtualization is enabled in BIOS
2. On Windows: Enable WSL 2 feature
3. Restart your computer

### Port Already in Use

If ports 3000 or 5000 are already in use:

```bash
# Find what's using the port
# Windows
netstat -ano | findstr ":3000"

# Linux/macOS
lsof -i :3000

# Stop the conflicting service or change ports in docker-compose.yml
```

### Containers Won't Start

```bash
# Check logs
docker-compose logs

# Rebuild containers
docker-compose up -d --build

# Check Docker is running
docker ps
```

### Database Connection Errors

```bash
# Wait for MySQL to be ready (can take 30-60 seconds)
docker-compose logs mysql

# Restart MySQL
docker-compose restart mysql
```

### Can't Access from Mobile Device

1. Make sure computer and mobile are on the same WiFi network
2. Check firewall rules are configured
3. Verify IP address is correct
4. Try accessing from computer's browser first: `http://localhost:3000`

---

## 📊 Verification Checklist

After starting, verify:

- [ ] Docker Desktop is running
- [ ] All containers show "Up" status: `docker-compose ps`
- [ ] Health endpoint works: `http://localhost:5000/health`
- [ ] Frontend loads: `http://localhost:3000`
- [ ] Can login with default credentials
- [ ] API endpoints return data (use `test-api.ps1`)

---

## 📚 Additional Resources

- **API Testing Guide**: See `TEST_API.md`
- **Deployment Guide**: See `DEPLOYMENT_README.md`
- **Security Guide**: See `SECURITY_GUIDE.md`
- **Quick Start**: See `QUICK_START.md`

---

## 🎉 Success!

If everything is working:
- ✅ Frontend: http://localhost:3000
- ✅ Backend: http://localhost:5000
- ✅ You can login and see data

Your MyMasjidApp is running successfully! 🚀


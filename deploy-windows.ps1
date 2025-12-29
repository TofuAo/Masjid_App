# MyMasjidApp - Windows Server 2022 Deployment Script
# Run this script on your Windows VPS after uploading your code

Write-Host "🚀 MyMasjidApp - Windows Server Deployment" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[ERROR] Please run PowerShell as Administrator" -ForegroundColor Red
    Write-Host "Right-click PowerShell > Run as Administrator" -ForegroundColor Yellow
    exit 1
}

# Check if Docker is installed
Write-Host "[INFO] Checking Docker installation..." -ForegroundColor Cyan
try {
    $dockerVersion = docker --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[✓] Docker found: $dockerVersion" -ForegroundColor Green
    } else {
        throw "Docker not found"
    }
} catch {
    Write-Host "[ERROR] Docker is not installed!" -ForegroundColor Red
    Write-Host "[INFO] Please install Docker Desktop for Windows first:" -ForegroundColor Yellow
    Write-Host "       https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Check if Docker Compose is available
Write-Host "[INFO] Checking Docker Compose..." -ForegroundColor Cyan
try {
    $composeVersion = docker compose version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[✓] Docker Compose found: $composeVersion" -ForegroundColor Green
    } else {
        throw "Docker Compose not found"
    }
} catch {
    Write-Host "[ERROR] Docker Compose is not available!" -ForegroundColor Red
    Write-Host "[INFO] Docker Compose should be included with Docker Desktop" -ForegroundColor Yellow
    exit 1
}

# Check if Docker is running
Write-Host "[INFO] Checking if Docker is running..." -ForegroundColor Cyan
try {
    docker ps 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[✓] Docker is running" -ForegroundColor Green
    } else {
        throw "Docker not running"
    }
} catch {
    Write-Host "[ERROR] Docker is not running!" -ForegroundColor Red
    Write-Host "[INFO] Please start Docker Desktop" -ForegroundColor Yellow
    exit 1
}

# Get current directory
$APP_DIR = Get-Location
Write-Host "[INFO] Application directory: $APP_DIR" -ForegroundColor Cyan

# Check if this is the application directory
if (-not (Test-Path "package.json") -and -not (Test-Path "docker-compose.yml")) {
    Write-Host "[ERROR] This doesn't appear to be the MyMasjidApp directory" -ForegroundColor Red
    Write-Host "[INFO] Please run this script from the MyMasjidApp directory" -ForegroundColor Yellow
    exit 1
}

# Get server IP
$SERVER_IP = (Invoke-WebRequest -Uri "https://ifconfig.me" -UseBasicParsing).Content.Trim()
if (-not $SERVER_IP) {
    $SERVER_IP = "localhost"
}
Write-Host "[INFO] Server IP: $SERVER_IP" -ForegroundColor Cyan

# Create necessary directories
Write-Host "[INFO] Creating necessary directories..." -ForegroundColor Cyan
$directories = @("nginx\ssl", "nginx\logs", "uploads", "backups")
foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "[✓] Created: $dir" -ForegroundColor Green
    }
}

# Set up environment files
Write-Host "[INFO] Setting up environment files..." -ForegroundColor Cyan

if (-not (Test-Path "backend\.env")) {
    if (Test-Path "backend\env.production") {
        Copy-Item "backend\env.production" "backend\.env"
        Write-Host "[✓] Created backend\.env from template" -ForegroundColor Green
        Write-Host "[!] Please edit backend\.env with your configuration" -ForegroundColor Yellow
    } else {
        Write-Host "[ERROR] backend\env.production not found" -ForegroundColor Red
        exit 1
    }
}

if (-not (Test-Path ".env")) {
    if (Test-Path "env.production") {
        Copy-Item "env.production" ".env"
        Write-Host "[✓] Created .env from template" -ForegroundColor Green
    } else {
        Write-Host "[!] Creating basic .env file" -ForegroundColor Yellow
        "DOMAIN=$SERVER_IP" | Out-File -FilePath ".env" -Encoding UTF8
        "VITE_API_BASE_URL=http://$SERVER_IP/api" | Out-File -FilePath ".env" -Append -Encoding UTF8
    }
}

# Generate secure passwords if needed
Write-Host "[INFO] Checking passwords in backend\.env..." -ForegroundColor Cyan
$envContent = Get-Content "backend\.env" -Raw

if ($envContent -match "your_database_password_here|masjid_password") {
    $DB_PASSWORD = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 24 | ForEach-Object {[char]$_})
    $envContent = $envContent -replace "your_database_password_here", $DB_PASSWORD
    $envContent = $envContent -replace "DB_PASSWORD=.*", "DB_PASSWORD=$DB_PASSWORD"
    $envContent | Out-File -FilePath "backend\.env" -Encoding UTF8 -NoNewline
    Write-Host "[✓] Generated database password" -ForegroundColor Green
}

if ($envContent -match "your_super_secret_jwt_key|your_jwt_secret_here") {
    $JWT_SECRET = [Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
    $envContent = $envContent -replace "your_super_secret_jwt_key.*", "JWT_SECRET=$JWT_SECRET"
    $envContent = $envContent -replace "JWT_SECRET=.*", "JWT_SECRET=$JWT_SECRET"
    $envContent | Out-File -FilePath "backend\.env" -Encoding UTF8 -NoNewline
    Write-Host "[✓] Generated JWT secret" -ForegroundColor Green
}

# Update FRONTEND_URL with server IP
$envContent = Get-Content "backend\.env" -Raw
$envContent = $envContent -replace "FRONTEND_URL=.*", "FRONTEND_URL=http://$SERVER_IP"
$envContent | Out-File -FilePath "backend\.env" -Encoding UTF8 -NoNewline

# Configure Windows Firewall
Write-Host "[INFO] Configuring Windows Firewall..." -ForegroundColor Cyan
$ports = @(80, 443, 5000, 3307)
foreach ($port in $ports) {
    $ruleName = "MyMasjidApp-Port-$port"
    $existingRule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
    if (-not $existingRule) {
        New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -LocalPort $port -Protocol TCP -Action Allow | Out-Null
        Write-Host "[✓] Opened port $port" -ForegroundColor Green
    }
}

# Stop existing containers
Write-Host "[INFO] Stopping existing containers..." -ForegroundColor Cyan
docker compose down --remove-orphans 2>&1 | Out-Null

# Build Docker images
Write-Host "[INFO] Building Docker images (this may take a few minutes)..." -ForegroundColor Cyan
docker compose build --no-cache
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Docker build failed!" -ForegroundColor Red
    exit 1
}

# Start services
Write-Host "[INFO] Starting services..." -ForegroundColor Cyan
docker compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to start services!" -ForegroundColor Red
    exit 1
}

# Wait for services
Write-Host "[INFO] Waiting for services to initialize..." -ForegroundColor Cyan
Start-Sleep -Seconds 30

# Check service status
Write-Host "[INFO] Checking service status..." -ForegroundColor Cyan
docker compose ps

# Wait for MySQL
Write-Host "[INFO] Waiting for MySQL..." -ForegroundColor Cyan
$maxRetries = 30
$retryCount = 0
$mysqlReady = $false

while ($retryCount -lt $maxRetries -and -not $mysqlReady) {
    try {
        $result = docker compose exec -T mysql mysqladmin ping -h localhost --silent 2>&1
        if ($LASTEXITCODE -eq 0) {
            $mysqlReady = $true
            Write-Host "[✓] MySQL is ready!" -ForegroundColor Green
        }
    } catch {
        # Continue waiting
    }
    
    if (-not $mysqlReady) {
        $retryCount++
        Start-Sleep -Seconds 2
    }
}

if (-not $mysqlReady) {
    Write-Host "[ERROR] MySQL failed to start" -ForegroundColor Red
    docker compose logs mysql
    exit 1
}

# Run migrations
Write-Host "[INFO] Running database migrations..." -ForegroundColor Cyan
docker compose exec -T backend npm run migrate
if ($LASTEXITCODE -ne 0) {
    Write-Host "[!] Migration may have already been run" -ForegroundColor Yellow
}

# Test endpoints
Write-Host "[INFO] Testing endpoints..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "[✓] Backend health check passed" -ForegroundColor Green
    }
} catch {
    Write-Host "[!] Backend health check failed (may need more time)" -ForegroundColor Yellow
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "[✓] Frontend/Nginx is accessible" -ForegroundColor Green
    }
} catch {
    Write-Host "[!] Frontend check failed (may need more time)" -ForegroundColor Yellow
}

# Display summary
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "🎉 Deployment completed!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Access your application:" -ForegroundColor Cyan
Write-Host "   HTTP:  http://$SERVER_IP" -ForegroundColor White
Write-Host "   API:   http://$SERVER_IP/api" -ForegroundColor White
Write-Host ""
Write-Host "📊 Service Status:" -ForegroundColor Cyan
docker compose ps
Write-Host ""
Write-Host "📝 Quick Commands:" -ForegroundColor Cyan
Write-Host "   View logs:    docker compose logs -f" -ForegroundColor White
Write-Host "   Restart:      docker compose restart" -ForegroundColor White
Write-Host "   Stop:         docker compose down" -ForegroundColor White
Write-Host "   Start:        docker compose up -d" -ForegroundColor White
Write-Host ""


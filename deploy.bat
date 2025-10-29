@echo off
REM MyMasjidApp Deployment Script for Windows
REM This script automates the deployment process

echo 🚀 Starting MyMasjidApp deployment...

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed. Please install Docker Desktop first.
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose is not installed. Please install Docker Compose first.
    exit /b 1
)

REM Create necessary directories
echo [INFO] Creating necessary directories...
if not exist "nginx\ssl" mkdir nginx\ssl
if not exist "nginx\logs" mkdir nginx\logs
if not exist "uploads" mkdir uploads

REM Check if .env files exist
if not exist "backend\.env" (
    echo [WARNING] backend\.env not found. Creating from template...
    copy backend\env.production backend\.env
    echo [WARNING] Please edit backend\.env with your actual configuration values.
)

if not exist ".env" (
    echo [WARNING] .env not found. Creating from template...
    copy env.production .env
    echo [WARNING] Please edit .env with your actual configuration values.
)

REM Build and start services
echo [INFO] Building and starting services...
docker-compose down --remove-orphans
docker-compose build --no-cache
docker-compose up -d

REM Wait for services to be ready
echo [INFO] Waiting for services to be ready...
timeout /t 30 /nobreak >nul

REM Check if services are running
echo [INFO] Checking service status...
docker-compose ps

echo [INFO] Deployment completed successfully!
echo [INFO] Frontend: http://localhost:3000
echo [INFO] Backend API: http://localhost:5000
echo [INFO] Database: localhost:3306

echo [WARNING] Don't forget to:
echo [WARNING] 1. Update your domain name in nginx\nginx.conf
echo [WARNING] 2. Obtain SSL certificates for HTTPS
echo [WARNING] 3. Update environment variables with production values
echo [WARNING] 4. Set up monitoring and logging

pause

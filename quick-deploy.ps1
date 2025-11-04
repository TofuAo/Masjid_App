# Quick deployment script for MyMasjidApp (PowerShell)
# Automatically builds and deploys frontend changes

Write-Host "🚀 Quick Deploy: Building and deploying frontend..." -ForegroundColor Green

# Build frontend
Write-Host "📦 Building frontend..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Rebuild and restart frontend container
Write-Host "🐳 Rebuilding frontend container..." -ForegroundColor Yellow
docker-compose build frontend

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "🔄 Restarting frontend service..." -ForegroundColor Yellow
docker-compose up -d frontend

# Verify deployment
Write-Host "✅ Verifying deployment..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
docker-compose ps frontend

Write-Host "✨ Deployment complete!" -ForegroundColor Green
Write-Host "🌐 Frontend available at: http://localhost:3000" -ForegroundColor Cyan


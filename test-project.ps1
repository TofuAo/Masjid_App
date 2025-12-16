# Simple Project Test Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   MyMasjidApp Project Test" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1: Check Docker Containers
Write-Host "1. Checking Docker Containers..." -ForegroundColor Yellow
$containers = docker-compose ps --format json | ConvertFrom-Json
$runningCount = ($containers | Where-Object { $_.State -eq "running" }).Count
Write-Host "   Running containers: $runningCount" -ForegroundColor Gray
if ($runningCount -ge 3) {
    Write-Host "   ✓ All containers are running!" -ForegroundColor Green
} else {
    Write-Host "   ✗ Some containers may not be running" -ForegroundColor Red
}

# Test 2: Backend Health Check
Write-Host "`n2. Testing Backend Health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5000/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ✓ Backend is healthy!" -ForegroundColor Green
    Write-Host "   Status: $($health.status)" -ForegroundColor Gray
    Write-Host "   Database: $($health.database)" -ForegroundColor Gray
    Write-Host "   Uptime: $([math]::Round($health.uptime, 2)) seconds" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Backend health check failed: $_" -ForegroundColor Red
}

# Test 3: Frontend Check
Write-Host "`n3. Testing Frontend..." -ForegroundColor Yellow
try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction Stop
    if ($frontend.StatusCode -eq 200) {
        Write-Host "   ✓ Frontend is accessible!" -ForegroundColor Green
    } else {
        Write-Host "   ⚠ Frontend returned status: $($frontend.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ✗ Frontend check failed: $_" -ForegroundColor Red
}

# Test 4: Database Connection (via API)
Write-Host "`n4. Testing Database Connection..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5000/health" -TimeoutSec 5 -ErrorAction Stop
    if ($health.database -eq "connected") {
        Write-Host "   ✓ Database is connected!" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Database connection issue: $($health.database)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ Could not check database connection" -ForegroundColor Red
}

# Test 5: API Root Endpoint
Write-Host "`n5. Testing API Root..." -ForegroundColor Yellow
try {
    $apiRoot = Invoke-RestMethod -Uri "http://localhost:5000/" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ✓ API root is accessible!" -ForegroundColor Green
    Write-Host "   Message: $($apiRoot.message)" -ForegroundColor Gray
} catch {
    Write-Host "   ⚠ API root check failed (may be expected)" -ForegroundColor Yellow
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   Test Summary" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Access Points:" -ForegroundColor Yellow
Write-Host "  Frontend:    http://localhost:3000" -ForegroundColor White
Write-Host "  Backend API: http://localhost:5000/api" -ForegroundColor White
Write-Host "  Health:      http://localhost:5000/health" -ForegroundColor White

Write-Host "`nTo test login functionality, run:" -ForegroundColor Yellow
Write-Host "  test-login.ps1" -ForegroundColor White

Write-Host "`nTo test all API endpoints, run:" -ForegroundColor Yellow
Write-Host "  test-all-functions.ps1" -ForegroundColor White

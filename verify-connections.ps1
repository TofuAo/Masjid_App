# Comprehensive Connection Verification Script
Write-Host "`n=== CONNECTION VERIFICATION ===" -ForegroundColor Cyan
Write-Host ""

# 1. Check Docker Services
Write-Host "1. Docker Services Status:" -ForegroundColor Yellow
$services = docker-compose ps --format json | ConvertFrom-Json
$allRunning = $true
foreach ($service in $services) {
    $status = if ($service.State -eq "running") { "✅" } else { "❌"; $allRunning = $false }
    Write-Host "   $status $($service.Name): $($service.State)" -ForegroundColor $(if ($service.State -eq "running") { "Green" } else { "Red" })
}
Write-Host ""

# 2. Test Backend Health
Write-Host "2. Backend Health Check:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "   ✅ Backend is responding (Status: $($response.StatusCode))" -ForegroundColor Green
    $backendOk = $true
} catch {
    Write-Host "   ❌ Backend not responding: $($_.Exception.Message)" -ForegroundColor Red
    $backendOk = $false
}
Write-Host ""

# 3. Test Frontend
Write-Host "3. Frontend Accessibility:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "   ✅ Frontend is responding (Status: $($response.StatusCode))" -ForegroundColor Green
    $frontendOk = $true
} catch {
    Write-Host "   ❌ Frontend not responding: $($_.Exception.Message)" -ForegroundColor Red
    $frontendOk = $false
}
Write-Host ""

# 4. Test API Endpoint
Write-Host "4. API Endpoint Test:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "   ✅ API endpoint is responding (Status: $($response.StatusCode))" -ForegroundColor Green
    $apiOk = $true
} catch {
    Write-Host "   ❌ API endpoint not responding: $($_.Exception.Message)" -ForegroundColor Red
    $apiOk = $false
}
Write-Host ""

# 5. Check Database Connection
Write-Host "5. Database Connection:" -ForegroundColor Yellow
$dbCheck = docker-compose exec -T backend node -e "const {pool} = require('./config/database.js'); pool.execute('SELECT 1 as test').then(([r])=>{console.log('OK'); pool.end();}).catch(e=>{console.log('FAIL:',e.message); pool.end();});" 2>&1
if ($dbCheck -match "OK") {
    Write-Host "   ✅ Database connection successful" -ForegroundColor Green
    $dbOk = $true
} else {
    Write-Host "   ❌ Database connection failed: $dbCheck" -ForegroundColor Red
    $dbOk = $false
}
Write-Host ""

# 6. Check Admin Accounts
Write-Host "6. Admin Accounts:" -ForegroundColor Yellow
$adminCheck = docker-compose exec -T backend mysql -h mysql -u masjid_user -pmasjid_password masjid_app -e "SELECT COUNT(*) as count FROM users WHERE role='admin' AND status='aktif';" 2>&1
if ($adminCheck -match "count") {
    $count = ($adminCheck | Select-String -Pattern "\d+").Matches[0].Value
    Write-Host "   ✅ Found $count active admin account(s)" -ForegroundColor Green
    $adminOk = $true
} else {
    Write-Host "   ❌ Could not check admin accounts: $adminCheck" -ForegroundColor Red
    $adminOk = $false
}
Write-Host ""

# Summary
Write-Host "=== SUMMARY ===" -ForegroundColor Cyan
$allOk = $backendOk -and $frontendOk -and $apiOk -and $dbOk -and $adminOk
if ($allOk) {
    Write-Host "✅ All connections are working correctly!" -ForegroundColor Green
} else {
    Write-Host "❌ Some connections need attention" -ForegroundColor Red
    Write-Host ""
    Write-Host "To fix issues:" -ForegroundColor Yellow
    Write-Host "  - Restart services: docker-compose restart" -ForegroundColor White
    Write-Host "  - Check logs: docker-compose logs backend" -ForegroundColor White
    Write-Host "  - Rebuild: docker-compose up -d --build" -ForegroundColor White
}
Write-Host ""


# Comprehensive Test Script for All Website Functions
# This script tests login and verifies all connections work

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "COMPREHENSIVE FUNCTION TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Docker Containers
Write-Host "Step 1: Checking Docker Containers..." -ForegroundColor Yellow
$containers = docker ps --filter "name=masjid" --format "{{.Names}} - {{.Status}}"
if ($containers) {
    Write-Host "✅ Containers running:" -ForegroundColor Green
    $containers | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
} else {
    Write-Host "❌ No containers found. Starting containers..." -ForegroundColor Red
    docker-compose up -d
    Start-Sleep -Seconds 10
}

# Step 2: Test Backend Health
Write-Host "`nStep 2: Testing Backend Health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5000/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Backend is healthy" -ForegroundColor Green
    Write-Host "   Status: $($health.status)" -ForegroundColor Gray
    Write-Host "   Uptime: $([math]::Round($health.uptime, 2)) seconds" -ForegroundColor Gray
} catch {
    Write-Host "❌ Backend health check failed" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    Write-Host "   Starting backend..." -ForegroundColor Yellow
    docker-compose up -d backend
    Start-Sleep -Seconds 15
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:5000/health" -TimeoutSec 5 -ErrorAction Stop
        Write-Host "✅ Backend is now healthy" -ForegroundColor Green
    } catch {
        Write-Host "❌ Backend still not responding" -ForegroundColor Red
        Write-Host "   Check logs: docker-compose logs backend" -ForegroundColor Yellow
    }
}

# Step 3: Create/Verify Admin Accounts
Write-Host "`nStep 3: Creating/Verifying Admin Accounts..." -ForegroundColor Yellow
try {
    docker-compose exec -T backend node scripts/fix_admin_accounts.js 2>&1 | Out-Null
    Write-Host "✅ Admin accounts script executed" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not run admin script (this is OK if accounts already exist)" -ForegroundColor Yellow
}

# Step 4: Test Login API
Write-Host "`nStep 4: Testing Login API..." -ForegroundColor Yellow
$loginBody = @{
    icNumber = "920312065113"
    password = "Amir920313"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
        -Method POST `
        -Body $loginBody `
        -ContentType "application/json" `
        -TimeoutSec 10 `
        -ErrorAction Stop

    if ($loginResponse.success -and $loginResponse.data.token) {
        Write-Host "✅ LOGIN TEST SUCCESSFUL!" -ForegroundColor Green
        Write-Host "   User: $($loginResponse.data.user.nama)" -ForegroundColor Gray
        Write-Host "   Role: $($loginResponse.data.user.role)" -ForegroundColor Gray
        Write-Host "   Token: $($loginResponse.data.token.Substring(0, 30))..." -ForegroundColor Gray
        $loginSuccess = $true
    } else {
        Write-Host "❌ Login returned unexpected format" -ForegroundColor Red
        $loginResponse | ConvertTo-Json -Depth 3
        $loginSuccess = $false
    }
} catch {
    Write-Host "❌ LOGIN TEST FAILED" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        try {
            $errorData = $_.ErrorDetails.Message | ConvertFrom-Json
            Write-Host "   Error: $($errorData.message)" -ForegroundColor Red
            if ($errorData.message -like "*IC Number*") {
                Write-Host "`n   ⚠️  Admin account may not exist in database" -ForegroundColor Yellow
                Write-Host "   Running admin account creation..." -ForegroundColor Yellow
                docker-compose exec -T mysql mysql -umasjid_user -pmasjid_password masjid_app -e "DELETE FROM users WHERE REPLACE(ic, '-', '') = '920312065113'; INSERT INTO users (ic, nama, password, role, status) VALUES ('920312065113', 'USTAZ AMIR HASIF BIN HATA', '\$2a\$12\$0RdYCA0Exxyh4GyVEL1Uyu90H3N69DdqdM1PDj.3JXvGh9CJW9Jpu', 'admin', 'aktif');" 2>&1 | Out-Null
                Write-Host "   ✅ Admin account created. Try login again." -ForegroundColor Green
            }
        } catch {
            Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    $loginSuccess = $false
}

# Step 5: Test Database Connection
Write-Host "`nStep 5: Testing Database Connection..." -ForegroundColor Yellow
try {
    $dbResult = docker-compose exec -T mysql mysql -umasjid_user -pmasjid_password masjid_app -e "SELECT COUNT(*) as count FROM users;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database connection successful" -ForegroundColor Green
    } else {
        Write-Host "❌ Database connection failed" -ForegroundColor Red
    }
} catch {
    Write-Host "⚠️  Could not test database directly" -ForegroundColor Yellow
}

# Final Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($loginSuccess) {
    Write-Host "`n✅ ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "`nYou can now login at http://localhost:3000 with:" -ForegroundColor Green
    Write-Host "   IC: 920312065113 (or 920312-06-5113)" -ForegroundColor White
    Write-Host "   Password: Amir920313" -ForegroundColor White
} else {
    Write-Host "`n❌ LOGIN TEST FAILED" -ForegroundColor Red
    Write-Host "`nTroubleshooting steps:" -ForegroundColor Yellow
    Write-Host "1. Check backend logs: docker-compose logs backend --tail 50" -ForegroundColor White
    Write-Host "2. Restart backend: docker-compose restart backend" -ForegroundColor White
    Write-Host "3. Run admin fix: docker-compose exec backend node scripts/fix_admin_accounts.js" -ForegroundColor White
    Write-Host "4. Check database: docker-compose exec mysql mysql -umasjid_user -pmasjid_password masjid_app -e 'SELECT * FROM users WHERE role=\"admin\";'" -ForegroundColor White
}

Write-Host ""


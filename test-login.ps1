# Test Login Script for MyMasjidApp
Write-Host "=== Testing Login Functionality ===" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "`n1. Testing Backend Health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5000/health" -ErrorAction Stop
    Write-Host "✅ Backend is healthy!" -ForegroundColor Green
    Write-Host "   Status: $($health.status)" -ForegroundColor Gray
    Write-Host "   Uptime: $([math]::Round($health.uptime, 2)) seconds" -ForegroundColor Gray
} catch {
    Write-Host "❌ Backend health check failed: $_" -ForegroundColor Red
    Write-Host "   Make sure the backend container is running: docker-compose ps" -ForegroundColor Yellow
    exit 1
}

# Test 2: Admin Login
Write-Host "`n2. Testing Admin Login (IC: 920312065113)..." -ForegroundColor Yellow
$loginBody = @{
    icNumber = "920312065113"
    password = "Amir920313"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
        -Method POST `
        -Body $loginBody `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    if ($loginResponse.success -and $loginResponse.data.token) {
        Write-Host "✅ Login successful!" -ForegroundColor Green
        Write-Host "   User: $($loginResponse.data.user.nama)" -ForegroundColor Gray
        Write-Host "   Role: $($loginResponse.data.user.role)" -ForegroundColor Gray
        Write-Host "   Token: $($loginResponse.data.token.Substring(0, 50))..." -ForegroundColor Gray
    } else {
        Write-Host "❌ Login failed: Invalid response format" -ForegroundColor Red
        $loginResponse | ConvertTo-Json -Depth 3
    }
} catch {
    Write-Host "❌ Login failed!" -ForegroundColor Red
    $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
    if ($errorResponse) {
        Write-Host "   Error: $($errorResponse.message)" -ForegroundColor Red
        if ($errorResponse.message -like "*IC Number*") {
            Write-Host "`n   ⚠️  Admin account may not exist in database." -ForegroundColor Yellow
            Write-Host "   Run: docker-compose exec backend node scripts/fix_admin_accounts.js" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   Error: $_" -ForegroundColor Red
    }
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan


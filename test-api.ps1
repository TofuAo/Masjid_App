# MyMasjidApp API Testing Script
# This script tests all API endpoints

param(
    [string]$BaseUrl = "http://localhost:5000"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   MyMasjidApp API Testing" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Colors
$successColor = "Green"
$errorColor = "Red"
$infoColor = "Yellow"

# 1. Health Check
Write-Host "1. Testing Health Endpoint..." -ForegroundColor $infoColor
try {
    $health = Invoke-RestMethod -Uri "$BaseUrl/health"
    Write-Host "   ✓ Backend is healthy!" -ForegroundColor $successColor
    Write-Host "   Status: $($health.status)" -ForegroundColor Gray
    Write-Host "   Uptime: $([math]::Round($health.uptime, 2)) seconds" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Health check failed: $_" -ForegroundColor $errorColor
    Write-Host "   Make sure Docker containers are running: docker-compose ps" -ForegroundColor $errorColor
    exit 1
}

# 2. Login
Write-Host "`n2. Testing Login..." -ForegroundColor $infoColor
$loginBody = @{
    icNumber = "051003060229"
    password = "123456"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" `
        -Method POST `
        -Body $loginBody `
        -ContentType "application/json"
    
    if ($loginResponse.success -and $loginResponse.data.token) {
        $global:token = $loginResponse.data.token
        Write-Host "   ✓ Login successful!" -ForegroundColor $successColor
        Write-Host "   User: $($loginResponse.data.user.nama)" -ForegroundColor Gray
        Write-Host "   Role: $($loginResponse.data.user.role)" -ForegroundColor Gray
        Write-Host "   Email: $($loginResponse.data.user.email)" -ForegroundColor Gray
    } else {
        Write-Host "   ✗ Login failed: Invalid response" -ForegroundColor $errorColor
        exit 1
    }
} catch {
    Write-Host "   ✗ Login failed: $_" -ForegroundColor $errorColor
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Response: $responseBody" -ForegroundColor $errorColor
    }
    exit 1
}

# Setup headers for authenticated requests
$headers = @{
    'Authorization' = "Bearer $global:token"
}

# 3. Get Profile
Write-Host "`n3. Testing Profile Endpoint..." -ForegroundColor $infoColor
try {
    $profile = Invoke-RestMethod -Uri "$BaseUrl/api/auth/profile" `
        -Headers $headers
    Write-Host "   ✓ Profile retrieved!" -ForegroundColor $successColor
    Write-Host "   Name: $($profile.data.nama)" -ForegroundColor Gray
    Write-Host "   Email: $($profile.data.email)" -ForegroundColor Gray
} catch {
    Write-Host "   ⚠ Profile endpoint returned error (may be expected)" -ForegroundColor Yellow
}

# 4. Get Students
Write-Host "`n4. Testing Students Endpoint..." -ForegroundColor $infoColor
try {
    $students = Invoke-RestMethod -Uri "$BaseUrl/api/students" `
        -Headers $headers
    Write-Host "   ✓ Students retrieved!" -ForegroundColor $successColor
    Write-Host "   Count: $($students.data.Count)" -ForegroundColor Gray
    if ($students.data.Count -gt 0) {
        Write-Host "   First student: $($students.data[0].nama) - $($students.data[0].email)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ✗ Students retrieval failed: $_" -ForegroundColor $errorColor
}

# 5. Get Teachers
Write-Host "`n5. Testing Teachers Endpoint..." -ForegroundColor $infoColor
try {
    $teachers = Invoke-RestMethod -Uri "$BaseUrl/api/teachers" `
        -Headers $headers
    Write-Host "   ✓ Teachers retrieved!" -ForegroundColor $successColor
    Write-Host "   Count: $($teachers.data.Count)" -ForegroundColor Gray
    if ($teachers.data.Count -gt 0) {
        Write-Host "   First teacher: $($teachers.data[0].nama)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ✗ Teachers retrieval failed: $_" -ForegroundColor $errorColor
}

# 6. Get Classes
Write-Host "`n6. Testing Classes Endpoint..." -ForegroundColor $infoColor
try {
    $classes = Invoke-RestMethod -Uri "$BaseUrl/api/classes" `
        -Headers $headers
    Write-Host "   ✓ Classes retrieved!" -ForegroundColor $successColor
    Write-Host "   Count: $($classes.data.Count)" -ForegroundColor Gray
    if ($classes.data.Count -gt 0) {
        Write-Host "   First class: $($classes.data[0].nama_kelas)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ✗ Classes retrieval failed: $_" -ForegroundColor $errorColor
}

# 7. Get Attendance
Write-Host "`n7. Testing Attendance Endpoint..." -ForegroundColor $infoColor
try {
    $attendance = Invoke-RestMethod -Uri "$BaseUrl/api/attendance" `
        -Headers $headers
    Write-Host "   ✓ Attendance retrieved!" -ForegroundColor $successColor
    Write-Host "   Count: $($attendance.data.Count)" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Attendance retrieval failed: $_" -ForegroundColor $errorColor
}

# 8. Get Exams
Write-Host "`n8. Testing Exams Endpoint..." -ForegroundColor $infoColor
try {
    $exams = Invoke-RestMethod -Uri "$BaseUrl/api/exams" `
        -Headers $headers
    Write-Host "   ✓ Exams retrieved!" -ForegroundColor $successColor
    Write-Host "   Count: $($exams.data.Count)" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Exams retrieval failed: $_" -ForegroundColor $errorColor
}

# 9. Get Fees
Write-Host "`n9. Testing Fees Endpoint..." -ForegroundColor $infoColor
try {
    $fees = Invoke-RestMethod -Uri "$BaseUrl/api/fees" `
        -Headers $headers
    Write-Host "   ✓ Fees retrieved!" -ForegroundColor $successColor
    Write-Host "   Count: $($fees.data.Count)" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Fees retrieval failed: $_" -ForegroundColor $errorColor
}

# 10. Get Results
Write-Host "`n10. Testing Results Endpoint..." -ForegroundColor $infoColor
try {
    $results = Invoke-RestMethod -Uri "$BaseUrl/api/results" `
        -Headers $headers
    Write-Host "   ✓ Results retrieved!" -ForegroundColor $successColor
    Write-Host "   Count: $($results.data.Count)" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Results retrieval failed: $_" -ForegroundColor $errorColor
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   Testing Complete!" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Access Points:" -ForegroundColor Yellow
Write-Host "  Frontend:    http://localhost:3000" -ForegroundColor White
Write-Host "  Backend API: http://localhost:5000/api" -ForegroundColor White
Write-Host "  Health:      http://localhost:5000/health" -ForegroundColor White

Write-Host "`nDefault Test Accounts:" -ForegroundColor Yellow
Write-Host "  IC: 051003060229, Password: 123456 (Student)" -ForegroundColor White
Write-Host "  IC: 990101010101, Password: admin123 (Admin)" -ForegroundColor White

Write-Host "`nFor more details, see TEST_API.md" -ForegroundColor Gray

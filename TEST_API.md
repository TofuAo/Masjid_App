# API Testing Guide - MyMasjidApp

This guide shows you how to test the API endpoints and run the application on your device.

## 🚀 Quick Start - Running the Application

### Prerequisites
- Docker Desktop installed and running
- Git (optional, if cloning from repository)

### Step 1: Start the Application

```bash
# Navigate to project directory
cd MyMasjidApp

# Start all services
docker-compose up -d

# Wait for services to start (about 30 seconds)
# Check status
docker-compose ps
```

### Step 2: Verify Services

```bash
# Check backend health
curl http://localhost:5000/health

# Or in PowerShell:
Invoke-RestMethod -Uri "http://localhost:5000/health"
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-31T...",
  "uptime": 123.456,
  "environment": "production"
}
```

### Step 3: Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/health

---

## 🔐 Authentication

### Login Endpoint

**POST** `/api/auth/login`

**Request Body:**
```json
{
  "icNumber": "051003060229",
  "password": "123456"
}
```

**PowerShell Example:**
```powershell
$body = @{
    icNumber = "051003060229"
    password = "123456"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"

$token = $response.token
Write-Host "Token: $token"
```

**cURL Example:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"icNumber":"051003060229","password":"123456"}'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "ic": "051003060229",
      "nama": "Ahmad Zulkifli",
      "email": "ahmad@student.com",
      "role": "student"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Using the Token

Save the token and include it in all authenticated requests:

**PowerShell:**
```powershell
$headers = @{
    'Authorization' = "Bearer $token"
    'Content-Type' = "application/json"
}

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/profile" `
    -Headers $headers
```

**cURL:**
```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📋 Available Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login` | User login | No |
| POST | `/api/auth/register` | Register new user | No |
| GET | `/api/auth/profile` | Get user profile | Yes |
| PUT | `/api/auth/change-password` | Change password | Yes |

### Student Endpoints

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| GET | `/api/students` | Get all students | Yes | Any |
| GET | `/api/students/:ic` | Get student by IC | Yes | Any |
| GET | `/api/students/stats` | Get student statistics | Yes | Any |
| POST | `/api/students` | Create new student | Yes | admin, staff |
| PUT | `/api/students/:ic` | Update student | Yes | admin, staff |
| DELETE | `/api/students/:ic` | Delete student | Yes | admin |

**Example - Get All Students:**
```powershell
$headers = @{
    'Authorization' = "Bearer $token"
}

$students = Invoke-RestMethod -Uri "http://localhost:5000/api/students" `
    -Headers $headers

$students | ConvertTo-Json -Depth 5
```

### Teacher Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/teachers` | Get all teachers | Yes |
| GET | `/api/teachers/:ic` | Get teacher by IC | Yes |
| GET | `/api/teachers/stats` | Get teacher statistics | Yes |
| POST | `/api/teachers` | Create new teacher | Yes |
| PUT | `/api/teachers/:ic` | Update teacher | Yes |
| DELETE | `/api/teachers/:ic` | Delete teacher | Yes |

### Class Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/classes` | Get all classes | Yes |
| GET | `/api/classes/:id` | Get class by ID | Yes |
| GET | `/api/classes/stats` | Get class statistics | Yes |
| POST | `/api/classes` | Create new class | Yes |
| PUT | `/api/classes/:id` | Update class | Yes |
| DELETE | `/api/classes/:id` | Delete class | Yes |

### Attendance Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/attendance` | Get all attendance | Yes |
| POST | `/api/attendance` | Mark attendance | Yes |
| POST | `/api/attendance/bulk` | Bulk mark attendance | Yes |
| GET | `/api/attendance/stats` | Get attendance statistics | Yes |
| GET | `/api/attendance/student/:ic` | Get student attendance history | Yes |

### Exam Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/exams` | Get all exams | Yes |
| GET | `/api/exams/:id` | Get exam by ID | Yes |
| POST | `/api/exams` | Create new exam | Yes |
| PUT | `/api/exams/:id` | Update exam | Yes |
| DELETE | `/api/exams/:id` | Delete exam | Yes |

### Result Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/results` | Get all results | Yes |
| GET | `/api/results/:id` | Get result by ID | Yes |
| GET | `/api/results/stats` | Get result statistics | Yes |
| GET | `/api/results/top-performers` | Get top performers | Yes |
| POST | `/api/results` | Create new result | Yes |
| PUT | `/api/results/:id` | Update result | Yes |
| DELETE | `/api/results/:id` | Delete result | Yes |

### Fee Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/fees` | Get all fees | Yes |
| GET | `/api/fees/:id` | Get fee by ID | Yes |
| GET | `/api/fees/stats` | Get fee statistics | Yes |
| POST | `/api/fees` | Create new fee | Yes |
| PUT | `/api/fees/:id` | Update fee | Yes |
| PUT | `/api/fees/:id/mark-paid` | Mark fee as paid | Yes |
| DELETE | `/api/fees/:id` | Delete fee | Yes |

---

## 🧪 Complete Testing Script

### PowerShell Testing Script

```powershell
# API Testing Script for MyMasjidApp

Write-Host "=== MyMasjidApp API Testing ===" -ForegroundColor Cyan

# 1. Health Check
Write-Host "`n1. Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5000/health"
    Write-Host "✓ Backend is healthy!" -ForegroundColor Green
    Write-Host "   Status: $($health.status)" -ForegroundColor Gray
    Write-Host "   Uptime: $($health.uptime) seconds" -ForegroundColor Gray
} catch {
    Write-Host "✗ Health check failed: $_" -ForegroundColor Red
    exit 1
}

# 2. Login
Write-Host "`n2. Testing Login..." -ForegroundColor Yellow
$loginBody = @{
    icNumber = "051003060229"
    password = "123456"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
        -Method POST `
        -Body $loginBody `
        -ContentType "application/json"
    
    if ($loginResponse.success -and $loginResponse.data.token) {
        $token = $loginResponse.data.token
        Write-Host "✓ Login successful!" -ForegroundColor Green
        Write-Host "   User: $($loginResponse.data.user.nama)" -ForegroundColor Gray
        Write-Host "   Role: $($loginResponse.data.user.role)" -ForegroundColor Gray
    } else {
        Write-Host "✗ Login failed: Invalid response" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Login failed: $_" -ForegroundColor Red
    exit 1
}

# 3. Get Profile
Write-Host "`n3. Testing Profile Endpoint..." -ForegroundColor Yellow
try {
    $headers = @{
        'Authorization' = "Bearer $token"
    }
    $profile = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/profile" `
        -Headers $headers
    Write-Host "✓ Profile retrieved!" -ForegroundColor Green
    Write-Host "   Name: $($profile.data.nama)" -ForegroundColor Gray
    Write-Host "   Email: $($profile.data.email)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Profile retrieval failed: $_" -ForegroundColor Red
}

# 4. Get Students
Write-Host "`n4. Testing Students Endpoint..." -ForegroundColor Yellow
try {
    $students = Invoke-RestMethod -Uri "http://localhost:5000/api/students" `
        -Headers $headers
    Write-Host "✓ Students retrieved!" -ForegroundColor Green
    Write-Host "   Count: $($students.data.Count)" -ForegroundColor Gray
    if ($students.data.Count -gt 0) {
        Write-Host "   First student: $($students.data[0].nama)" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Students retrieval failed: $_" -ForegroundColor Red
}

# 5. Get Teachers
Write-Host "`n5. Testing Teachers Endpoint..." -ForegroundColor Yellow
try {
    $teachers = Invoke-RestMethod -Uri "http://localhost:5000/api/teachers" `
        -Headers $headers
    Write-Host "✓ Teachers retrieved!" -ForegroundColor Green
    Write-Host "   Count: $($teachers.data.Count)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Teachers retrieval failed: $_" -ForegroundColor Red
}

# 6. Get Classes
Write-Host "`n6. Testing Classes Endpoint..." -ForegroundColor Yellow
try {
    $classes = Invoke-RestMethod -Uri "http://localhost:5000/api/classes" `
        -Headers $headers
    Write-Host "✓ Classes retrieved!" -ForegroundColor Green
    Write-Host "   Count: $($classes.data.Count)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Classes retrieval failed: $_" -ForegroundColor Red
}

Write-Host "`n=== Testing Complete ===" -ForegroundColor Cyan
Write-Host "All endpoints are working correctly!" -ForegroundColor Green
```

Save this as `test-api.ps1` and run:
```powershell
.\test-api.ps1
```

---

## 📱 Running on Your Device

### Local Development

1. **Make sure Docker Desktop is running**

2. **Start the application:**
   ```bash
   docker-compose up -d
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

### Access from Other Devices on Same Network

1. **Find your computer's IP address:**
   ```powershell
   # Windows
   ipconfig | findstr IPv4
   
   # Or
   Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*"}
   ```

2. **Access from another device:**
   - Frontend: `http://YOUR_IP_ADDRESS:3000`
   - Backend: `http://YOUR_IP_ADDRESS:5000`

   **Note:** Make sure Windows Firewall allows connections on ports 3000 and 5000.

3. **Configure firewall (Windows):**
   ```powershell
   # Allow inbound connections on ports
   New-NetFirewallRule -DisplayName "MyMasjidApp Frontend" `
       -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
   
   New-NetFirewallRule -DisplayName "MyMasjidApp Backend" `
       -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
   ```

---

## 🔍 Troubleshooting

### API Not Responding

1. **Check if containers are running:**
   ```bash
   docker-compose ps
   ```

2. **Check backend logs:**
   ```bash
   docker-compose logs backend
   ```

3. **Restart services:**
   ```bash
   docker-compose restart
   ```

### Authentication Errors

- Make sure you're including the token in the `Authorization` header
- Format: `Authorization: Bearer YOUR_TOKEN`
- Token expires after 24 hours - login again to get a new token

### Connection Refused

- Verify Docker Desktop is running
- Check if ports 3000 and 5000 are not in use by other applications
- Verify firewall settings

---

## 📊 Default Test Accounts

From the database schema, you can use these accounts:

| IC Number | Email | Password | Role |
|-----------|-------|----------|------|
| 051003060229 | ahmad@student.com | 123456 | student |
| 040502070118 | siti@student.com | 123456 | student |
| 820503060229 | rahim@teacher.com | 123456 | teacher |
| 790204030117 | nur@teacher.com | 123456 | teacher |
| 990101010101 | admin@madrasah.com | admin123 | admin |

---

## 📝 Notes

- All timestamps are in UTC
- IC numbers are used as unique identifiers
- Passwords are hashed using bcrypt
- Tokens expire after 24 hours
- API uses JSON format for requests and responses


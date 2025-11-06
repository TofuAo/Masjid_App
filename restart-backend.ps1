# PowerShell script to restart backend server
Write-Host "🔄 Restarting Backend Server..." -ForegroundColor Yellow

# Try to find and stop existing Node.js processes running the backend
$backendProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.Path -like "*backend*" -or 
    (Get-WmiObject Win32_Process -Filter "ProcessId = $($_.Id)").CommandLine -like "*server.js*"
}

if ($backendProcesses) {
    Write-Host "Stopping existing backend processes..." -ForegroundColor Yellow
    $backendProcesses | Stop-Process -Force
    Start-Sleep -Seconds 2
}

# Navigate to backend directory and start server
Set-Location "$PSScriptRoot\backend"
Write-Host "Starting backend server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start" -WorkingDirectory "$PSScriptRoot\backend"

Write-Host "✅ Backend server restarted!" -ForegroundColor Green
Write-Host "Check the new PowerShell window for server logs." -ForegroundColor Cyan


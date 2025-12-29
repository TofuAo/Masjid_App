# Prepare MyMasjidApp for Upload to Server
# This script creates a clean, deployable package

Write-Host "📦 Preparing MyMasjidApp for Server Upload" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host ""

# Get current directory
$PROJECT_DIR = Get-Location
$OUTPUT_DIR = "$PROJECT_DIR\MyMasjidApp-Package"

Write-Host "[INFO] Project directory: $PROJECT_DIR" -ForegroundColor Cyan
Write-Host "[INFO] Output directory: $OUTPUT_DIR" -ForegroundColor Cyan
Write-Host ""

# Create output directory
if (Test-Path $OUTPUT_DIR) {
    Write-Host "[INFO] Cleaning existing package directory..." -ForegroundColor Yellow
    Remove-Item -Path $OUTPUT_DIR -Recurse -Force
}

New-Item -ItemType Directory -Path $OUTPUT_DIR -Force | Out-Null
Write-Host "[✓] Created package directory" -ForegroundColor Green

# Files and directories to copy
$itemsToCopy = @(
    "backend",
    "src",
    "public",
    "nginx",
    "database",
    "package.json",
    "package-lock.json",
    "vite.config.js",
    "tailwind.config.cjs",
    "postcss.config.cjs",
    "eslint.config.js",
    "index.html",
    "docker-compose.yml",
    "Dockerfile",
    "deploy-windows.ps1",
    "WINDOWS_SERVER_2022_DEPLOYMENT.md",
    "RDP_CONNECTION_TROUBLESHOOTING.md"
)

Write-Host "[INFO] Copying files..." -ForegroundColor Cyan

foreach ($item in $itemsToCopy) {
    $sourcePath = Join-Path $PROJECT_DIR $item
    $destPath = Join-Path $OUTPUT_DIR $item
    
    if (Test-Path $sourcePath) {
        if (Test-Path $sourcePath -PathType Container) {
            # Copy directory
            Copy-Item -Path $sourcePath -Destination $destPath -Recurse -Force
            Write-Host "[✓] Copied directory: $item" -ForegroundColor Green
        } else {
            # Copy file
            Copy-Item -Path $sourcePath -Destination $destPath -Force
            Write-Host "[✓] Copied file: $item" -ForegroundColor Green
        }
    } else {
        Write-Host "[!] Not found: $item" -ForegroundColor Yellow
    }
}

# Create necessary directories
Write-Host "[INFO] Creating necessary directories..." -ForegroundColor Cyan
$directories = @("uploads", "nginx\ssl", "nginx\logs", "backups")
foreach ($dir in $directories) {
    $fullPath = Join-Path $OUTPUT_DIR $dir
    New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
    Write-Host "[✓] Created: $dir" -ForegroundColor Green
}

# Create environment file templates if they don't exist
Write-Host "[INFO] Setting up environment files..." -ForegroundColor Cyan

if (-not (Test-Path (Join-Path $OUTPUT_DIR "backend\.env"))) {
    if (Test-Path (Join-Path $OUTPUT_DIR "backend\env.production")) {
        Copy-Item (Join-Path $OUTPUT_DIR "backend\env.production") (Join-Path $OUTPUT_DIR "backend\.env")
        Write-Host "[✓] Created backend\.env from template" -ForegroundColor Green
    }
}

if (-not (Test-Path (Join-Path $OUTPUT_DIR ".env"))) {
    if (Test-Path (Join-Path $OUTPUT_DIR "env.production")) {
        Copy-Item (Join-Path $OUTPUT_DIR "env.production") (Join-Path $OUTPUT_DIR ".env")
        Write-Host "[✓] Created .env from template" -ForegroundColor Green
    }
}

# Create README for server
$readmeContent = @"
# MyMasjidApp - Server Deployment Package

This package contains all files needed to deploy MyMasjidApp on Windows Server 2022.

## Quick Start

1. Extract this folder to: C:\MyMasjidApp
2. Install Docker Desktop for Windows
3. Open PowerShell as Administrator
4. Run: cd C:\MyMasjidApp && .\deploy-windows.ps1

## Files Included

- Backend application (Node.js)
- Frontend application (React)
- Docker configuration
- Deployment scripts
- Database schema

## Important Notes

- Edit backend\.env with your configuration before deploying
- Ensure Docker Desktop is installed and running
- Run PowerShell as Administrator

## Documentation

See WINDOWS_SERVER_2022_DEPLOYMENT.md for detailed instructions.

Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
"@

$readmeContent | Out-File -FilePath (Join-Path $OUTPUT_DIR "README-DEPLOYMENT.txt") -Encoding UTF8
Write-Host "[✓] Created README-DEPLOYMENT.txt" -ForegroundColor Green

# Create zip file
Write-Host "[INFO] Creating ZIP archive..." -ForegroundColor Cyan
$zipPath = "$PROJECT_DIR\MyMasjidApp-Package.zip"

if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

Compress-Archive -Path $OUTPUT_DIR -DestinationPath $zipPath -Force
Write-Host "[✓] Created ZIP: MyMasjidApp-Package.zip" -ForegroundColor Green

# Calculate sizes
$folderSize = (Get-ChildItem -Path $OUTPUT_DIR -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
$zipSize = (Get-Item $zipPath).Length / 1MB

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "✅ Package Created Successfully!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Package Details:" -ForegroundColor Cyan
Write-Host "   Folder: $OUTPUT_DIR" -ForegroundColor White
Write-Host "   Size: $([math]::Round($folderSize, 2)) MB" -ForegroundColor White
Write-Host ""
Write-Host "📦 ZIP Archive:" -ForegroundColor Cyan
Write-Host "   File: $zipPath" -ForegroundColor White
Write-Host "   Size: $([math]::Round($zipSize, 2)) MB" -ForegroundColor White
Write-Host ""
Write-Host "📤 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Upload ZIP file to server via FTP/SFTP" -ForegroundColor White
Write-Host "   2. OR upload folder contents to C:\MyMasjidApp" -ForegroundColor White
Write-Host "   3. Extract and follow README-DEPLOYMENT.txt" -ForegroundColor White
Write-Host ""



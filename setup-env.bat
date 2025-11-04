@echo off
REM Setup Environment Files Script for Windows
REM This script creates .env files from templates

echo 🔧 Setting up environment files...

REM Create backend .env from template if it doesn't exist
if not exist "backend\.env" (
    echo [INFO] Creating backend\.env from template...
    copy backend\env.production backend\.env
    echo ✓ Created backend\.env
    echo ⚠️  Please edit backend\.env with your production values!
) else (
    echo ✓ backend\.env already exists
)

REM Create frontend .env from template if it doesn't exist
if not exist ".env" (
    echo [INFO] Creating .env from template...
    copy env.production .env
    echo ✓ Created .env
    echo ⚠️  Please edit .env with your production values!
) else (
    echo ✓ .env already exists
)

echo.
echo ✅ Environment files setup complete!
echo.
echo 📝 Next steps:
echo    1. Edit backend\.env with your database credentials and JWT secret
echo    2. Edit .env with your frontend API URL
echo    3. Run deploy.bat to deploy the application
echo.

pause


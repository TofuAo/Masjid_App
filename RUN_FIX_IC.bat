@echo off
echo ========================================
echo FIXING IC NUMBERS FOR 27 STAFF MEMBERS
echo ========================================
echo.

echo Step 1: Running Node.js script...
docker-compose exec backend node scripts/FIX_ALL_IC_DIRECT.js

echo.
echo Step 2: Verifying updates...
docker-compose exec mysql mysql -u masjid_user -pmasjid_password masjid_app -e "SELECT u.ic, u.nama FROM users u WHERE u.role = 'teacher' AND u.ic IN ('710515-06-5193', '701108-06-5175', '731014-06-5251') ORDER BY u.nama;"

echo.
echo Step 3: Restarting services...
docker-compose restart backend
docker-compose restart frontend

echo.
echo Step 4: Rebuilding frontend...
call npm run build
docker-compose build frontend
docker-compose up -d frontend

echo.
echo ========================================
echo COMPLETED!
echo ========================================
pause


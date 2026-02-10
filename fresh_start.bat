@echo off
cd backend
echo.
echo ==========================================
echo   SEEDING DATABASE...
echo ==========================================
call node seed.js
if %errorlevel% neq 0 (
    echo.
    echo ❌ Seeding Failed! Check your DB credentials in backend/.env
    echo Ensure MySQL is running and the database 'field_service_db' exists.
    pause
    exit /b
)
echo.
echo ==========================================
echo   STARTING BACKEND SERVER...
echo ==========================================
start /B npm start
cd ..
echo.
echo ==========================================
echo   STARTING FRONTEND APP...
echo ==========================================
call npm run dev

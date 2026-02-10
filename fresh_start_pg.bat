@echo off
SET PATH=%PATH%;C:\Program Files\nodejs
cd backend
echo.
echo ==========================================
echo   SEEDING POSTGRES DATABASE...
echo ==========================================
call node seed-pg.js
if %errorlevel% neq 0 (
    echo.
    echo ❌ Seeding Failed! Check if PostgreSQL is running and credentials in backend/.env are correct.
    echo Default User: postgres OR Default Pass: postgres
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

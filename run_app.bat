@echo off
setlocal
SET PATH=%PATH%;C:\Program Files\nodejs

echo ========================================================
echo   FIELD SERVICE MANAGEMENT - RESTART SCRIPT
echo ========================================================
echo.

echo 1. Stopping Old Processes...
taskkill /F /IM node.exe /T 2>nul
timeout /t 2 /nobreak >nul

echo.
echo 2. Starting Backend Server...
start "FSM Backend" /B cmd /c "cd backend && node server.js"
echo    Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

echo.
echo 3. Starting Frontend Application...
start "FSM Frontend" cmd /c "npm run dev"

echo.
echo ========================================================
echo   STATUS:
echo   - Frontend: http://localhost:5173
echo   - Backend:  http://localhost:3001
echo.
echo   NOTE: If you see 'Database Connection Failed' in the 
echo   backend window, standard features will work with 
echo   mock data, but some stats may be empty.
echo ========================================================
pause

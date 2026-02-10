@echo off
cd backend
echo Installing backend dependencies (if needed)...
call npm install
echo.
echo Starting Backend Server...
call npm start
pause

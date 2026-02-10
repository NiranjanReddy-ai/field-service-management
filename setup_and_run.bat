@echo off
echo Installing dependencies...
set "PATH=C:\Program Files\nodejs;%PATH%"
call npm install
if %errorlevel% neq 0 (
    echo.
    echo Error: Could not install dependencies. Please ensure Node.js is installed.
    pause
    exit /b %errorlevel%
)

echo.
echo Starting development server...
call npm run dev
pause

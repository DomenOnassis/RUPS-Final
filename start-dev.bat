@echo off
REM RUPS-Final Development Startup Script (Windows)
REM This script starts all required services for development

echo.
echo ========================================
echo   Starting RUPS-Final Development
echo ========================================
echo.

REM Create logs directory if it doesn't exist
if not exist logs mkdir logs

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8 or higher
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js 20 or higher
    pause
    exit /b 1
)

echo [1/2] Starting Vezalko Backend (Port 8000)...
echo.

REM Start Backend
cd Vezalko\backend

REM Check if virtual environment exists
if not exist venv (
    echo Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment and install dependencies
call venv\Scripts\activate.bat
pip install -q -r requirements.txt

REM Start backend in new window
start "Vezalko Backend" cmd /k "venv\Scripts\activate.bat && python main.py"

cd ..\..

REM Wait a bit for backend to start
echo Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

echo.
echo [2/2] Starting AppLauncher (Port 3002)...
echo.

REM Start AppLauncher
cd AppLauncher

REM Install dependencies if needed
if not exist node_modules (
    echo Installing AppLauncher dependencies...
    call npm install
)

REM Start AppLauncher in new window
start "AppLauncher" cmd /k "npm run dev"

cd ..

REM Wait a bit for AppLauncher to start
echo Waiting for AppLauncher to initialize...
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo   Services Started Successfully!
echo ========================================
echo.
echo Access the application:
echo   AppLauncher:  http://localhost:3002
echo.
echo Backend API:
echo   Vezalko Backend: http://127.0.0.1:8000
echo   API Docs:        http://127.0.0.1:8000/docs
echo.
echo ========================================
echo.
echo Optional: Start the games
echo.
echo To start Risalko (Port 3000):
echo   cd Risalko\frontend
echo   npm install
echo   npm run dev
echo.
echo To start Vezalko Frontend (Port 3001):
echo   cd Vezalko
echo   npm install
echo   npm run dev
echo.
echo ========================================
echo.
echo Press any key to stop all services...
pause >nul

REM Kill processes by window title
taskkill /FI "WindowTitle eq Vezalko Backend*" /F >nul 2>&1
taskkill /FI "WindowTitle eq AppLauncher*" /F >nul 2>&1

echo.
echo Services stopped.
echo.

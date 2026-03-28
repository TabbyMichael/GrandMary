@echo off
REM Everbloom Full Development Environment Starter for Windows
REM This script starts both frontend and backend in development mode

echo 🚀 Starting Everbloom Full Development Environment...
echo ==================================================

REM Function to kill processes on a port (Windows version)
call :kill_port 3001
call :kill_port 5173

REM Start backend
echo.
echo 📡 Starting Backend Server...
cd backend

if not exist "node_modules" (
    echo 📦 Installing backend dependencies...
    npm install
)

if not exist ".env" (
    echo ⚙️  Creating backend .env file...
    copy .env.example .env >nul
)

if not exist "database\everbloom.db" (
    echo 🗄️  Initializing database...
    npm run migrate
    npm run seed
)

echo 🌟 Backend starting on http://localhost:3001
set NODE_ENV=development
start "Backend Server" cmd /k "npm run dev"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend
echo.
echo 🎨 Starting Frontend Server...
cd ..

if not exist "node_modules" (
    echo 📦 Installing frontend dependencies...
    npm install
)

if not exist ".env" (
    echo ⚙️  Creating frontend .env file...
    echo VITE_API_URL=http://localhost:3001/api > .env
)

echo 🌟 Frontend starting on http://localhost:5173
start "Frontend Server" cmd /k "npm run dev"

REM Wait for services to be ready
echo.
echo ⏳ Waiting for services to start...
timeout /t 5 /nobreak >nul

echo.
echo 🎉 Everbloom Development Environment is ready!
echo ==================================================
echo 📱 Frontend: http://localhost:5173
echo 🔧 Backend API: http://localhost:3001/api
echo ❤️  Health Check: http://localhost:3001/api/health
echo.
echo 📝 Admin Login ^(default^):
echo    Username: admin
echo    Password: admin123
echo.
echo ⚠️  Close this window to stop both servers
echo.

pause
goto :eof

:kill_port
set port=%1
for /f "tokens=5" %%a in ('netstat -aon ^| find ":%port%" ^| find "LISTENING"') do (
    echo 🔄 Killing process on port %port% ^(PID: %%a^)
    taskkill /f /pid %%a >nul 2>&1
)
goto :eof

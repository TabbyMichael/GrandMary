@echo off
REM Everbloom Backend Development Starter Script for Windows
REM This script sets up and starts the backend in development mode

echo 🚀 Starting Everbloom Backend Development Server...
echo ==================================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js version: %NODE_VERSION%

REM Check if we're in the backend directory
if not exist "package.json" (
    echo ❌ Please run this script from the backend directory
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed
)

REM Check if .env file exists
if not exist ".env" (
    echo ⚙️  Creating .env file from template...
    copy .env.example .env >nul
    echo 📝 Please edit .env file with your configuration before running in production
    echo    Current settings are suitable for development
)

REM Check if database exists
if not exist "database\everbloom.db" (
    echo 🗄️  Initializing database...
    npm run migrate
    if %errorlevel% neq 0 (
        echo ❌ Failed to initialize database
        pause
        exit /b 1
    )
    
    echo 🌱 Adding sample data...
    npm run seed
    if %errorlevel% neq 0 (
        echo ⚠️  Warning: Failed to add sample data ^(database still works^)
    )
    echo ✅ Database initialized
)

REM Start the development server
echo 🌟 Starting development server...
echo    Backend will be available at: http://localhost:3001
echo    Health check: http://localhost:3001/api/health
echo    Press Ctrl+C to stop the server
echo.

REM Set development environment
set NODE_ENV=development

REM Start with nodemon for auto-restart
npm run dev

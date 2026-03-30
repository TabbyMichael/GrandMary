#!/bin/bash

# Everbloom Full Development Environment Starter
# This script starts both frontend and backend in development mode

echo "🚀 Starting Everbloom Full Development Environment..."
echo "=================================================="

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to kill processes on a port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo "🔄 Killing process on port $port (PID: $pid)"
        kill -9 $pid 2>/dev/null
        sleep 1
    fi
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2)
echo "✅ Node.js version: $NODE_VERSION"

# Kill existing processes on ports 3001 and 5173
echo "🧹 Cleaning up existing processes..."
kill_port 3001
kill_port 5173

# Start backend
echo ""
echo "📡 Starting Backend Server..."
cd backend

if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

if [ ! -f ".env" ]; then
    echo "⚙️  Creating backend .env file..."
    cp .env.example .env
fi

if [ ! -f "database/everbloom.db" ]; then
    echo "🗄️  Initializing database..."
    npm run migrate
    npm run seed
fi

echo "🌟 Backend starting on http://localhost:3001"
export NODE_ENV=development
npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
echo ""
echo "🎨 Starting Frontend Server..."
cd ..

if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

if [ ! -f ".env" ]; then
    echo "⚙️  Creating frontend .env file..."
    echo "VITE_API_URL=http://localhost:3001/api" > .env
fi

echo "🌟 Frontend starting on http://localhost:5173"
npm run dev &
FRONTEND_PID=$!

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to start..."
sleep 5

# Check if services are running
echo ""
echo "🔍 Verifying services..."

# Check backend
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Backend is running at http://localhost:3001"
else
    echo "❌ Backend failed to start"
fi

# Check frontend
if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ Frontend is running at http://localhost:5173"
else
    echo "⏳ Frontend is starting (may take a few more seconds)..."
fi

echo ""
echo "🎉 Everbloom Development Environment is ready!"
echo "=================================================="
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend API: http://localhost:3001/api"
echo "❤️  Health Check: http://localhost:3001/api/health"
echo ""
echo "📝 Admin Login (default):"
echo "   Username: admin"
echo "   Password: [See .env.example for secure setup]"
echo ""
echo "⚠️  Press Ctrl+C to stop both servers"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ All servers stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for processes
wait

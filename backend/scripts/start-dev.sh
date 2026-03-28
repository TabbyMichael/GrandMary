#!/bin/bash

# Everbloom Backend Development Starter Script
# This script sets up and starts the backend in development mode

echo "🚀 Starting Everbloom Backend Development Server..."
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please upgrade to Node.js 18+"
    exit 1
fi

echo "✅ Node.js version: $NODE_VERSION"

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the backend directory"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed"
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file from template..."
    cp .env.example .env
    echo "📝 Please edit .env file with your configuration before running in production"
    echo "   Current settings are suitable for development"
fi

# Check if database exists
if [ ! -f "database/everbloom.db" ]; then
    echo "🗄️  Initializing database..."
    npm run migrate
    if [ $? -ne 0 ]; then
        echo "❌ Failed to initialize database"
        exit 1
    fi
    
    echo "🌱 Adding sample data..."
    npm run seed
    if [ $? -ne 0 ]; then
        echo "⚠️  Warning: Failed to add sample data (database still works)"
    fi
    echo "✅ Database initialized"
fi

# Start the development server
echo "🌟 Starting development server..."
echo "   Backend will be available at: http://localhost:3001"
echo "   Health check: http://localhost:3001/api/health"
echo "   Press Ctrl+C to stop the server"
echo ""

# Set development environment
export NODE_ENV=development

# Start with nodemon for auto-restart
npm run dev

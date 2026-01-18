#!/bin/bash

# RUPS-Final Development Startup Script
# This script starts all required services for development

echo "🚀 Starting RUPS-Final Development Environment"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0
    else
        return 1
    fi
}

# Function to wait for a port to be ready
wait_for_port() {
    local port=$1
    local name=$2
    local max_attempts=30
    local attempt=0

    echo -n "Waiting for $name (port $port) to be ready..."
    while ! check_port $port; do
        if [ $attempt -ge $max_attempts ]; then
            echo -e " ${RED}TIMEOUT${NC}"
            return 1
        fi
        sleep 1
        attempt=$((attempt + 1))
        echo -n "."
    done
    echo -e " ${GREEN}READY${NC}"
    return 0
}

# Check if ports are already in use
echo "📋 Checking ports..."
if check_port 8000; then
    echo -e "${YELLOW}⚠️  Port 8000 (Backend) is already in use${NC}"
    read -p "Kill existing process? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        lsof -ti:8000 | xargs kill -9 2>/dev/null
        echo -e "${GREEN}✓ Killed process on port 8000${NC}"
        sleep 2
    fi
fi

if check_port 3002; then
    echo -e "${YELLOW}⚠️  Port 3002 (AppLauncher) is already in use${NC}"
    read -p "Kill existing process? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        lsof -ti:3002 | xargs kill -9 2>/dev/null
        echo -e "${GREEN}✓ Killed process on port 3002${NC}"
        sleep 2
    fi
fi

echo ""
echo "🔧 Starting services..."
echo ""

# Start Backend (Vezalko)
echo "1️⃣  Starting Vezalko Backend (Port 8000)..."
cd Vezalko/backend || exit 1

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment and install dependencies
source venv/bin/activate
pip install -q -r requirements.txt

# Start backend in background
python main.py > ../../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"

cd ../..

# Wait for backend to be ready
wait_for_port 8000 "Backend" || exit 1

echo ""

# Start AppLauncher
echo "2️⃣  Starting AppLauncher (Port 3002)..."
cd AppLauncher || exit 1

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing AppLauncher dependencies..."
    npm install
fi

# Start AppLauncher in background
npm run dev > ../logs/applauncher.log 2>&1 &
APPLAUNCHER_PID=$!
echo -e "${GREEN}✓ AppLauncher started (PID: $APPLAUNCHER_PID)${NC}"

cd ..

# Wait for AppLauncher to be ready
wait_for_port 3002 "AppLauncher" || exit 1

echo ""
echo "=============================================="
echo -e "${GREEN}✅ Core services are running!${NC}"
echo ""
echo "📱 Access the application:"
echo "   AppLauncher: http://localhost:3002"
echo ""
echo "🔧 Backend API:"
echo "   Vezalko Backend: http://127.0.0.1:8000"
echo "   API Docs: http://127.0.0.1:8000/docs"
echo ""
echo "📝 Logs:"
echo "   Backend: logs/backend.log"
echo "   AppLauncher: logs/applauncher.log"
echo ""
echo "=============================================="
echo ""
echo "Optional: Start the games"
echo ""
echo "To start Risalko (Port 3000):"
echo "   cd Risalko/frontend && npm install && npm run dev"
echo ""
echo "To start Vezalko Frontend (Port 3001):"
echo "   cd Vezalko && npm install && npm run dev"
echo ""
echo "=============================================="
echo ""
echo "To stop all services, press Ctrl+C or run:"
echo "   kill $BACKEND_PID $APPLAUNCHER_PID"
echo ""

# Save PIDs to file for cleanup
mkdir -p logs
echo "$BACKEND_PID" > logs/backend.pid
echo "$APPLAUNCHER_PID" > logs/applauncher.pid

# Keep script running and handle Ctrl+C
trap 'echo ""; echo "🛑 Stopping services..."; kill $BACKEND_PID $APPLAUNCHER_PID 2>/dev/null; rm -f logs/*.pid; echo "✓ Services stopped"; exit 0' INT TERM

echo "Press Ctrl+C to stop all services"
echo ""

# Wait for processes
wait

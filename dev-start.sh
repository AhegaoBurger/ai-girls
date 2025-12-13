#!/bin/bash

# AI Girls - Development Quick Start Script
# This script helps you start all development servers in parallel

set -e

echo "🎭 AI Girls Development Server Startup"
echo "======================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if required directories exist
if [ ! -d "backend" ]; then
    echo "❌ backend directory not found"
    exit 1
fi

if [ ! -d "frontend" ]; then
    echo "❌ frontend directory not found"
    exit 1
fi

# Check if .env exists in backend
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  backend/.env not found${NC}"
    echo "Creating from .env.example..."
    cp backend/.env.example backend/.env
    echo -e "${YELLOW}⚠️  Please edit backend/.env and add your GEMINI_API_KEY${NC}"
    exit 1
fi

# Check if node_modules exist
if [ ! -d "backend/node_modules" ]; then
    echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
    cd frontend && npm install && cd ..
fi

# Check if Godot build exists
if [ ! -f "godot-web-build/index.html" ]; then
    echo -e "${YELLOW}⚠️  Godot HTML5 build not found${NC}"
    echo "Please export the Godot project to godot-web-build/"
    echo "See godot-web-build/README.md for instructions"
    echo ""
    echo "Continuing anyway (avatar won't load, but chat will work)..."
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo ""

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping development servers...${NC}"
    jobs -p | xargs -r kill 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo -e "${BLUE}🚀 Starting Hono backend on http://localhost:3000${NC}"
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 2

# Start frontend
echo -e "${BLUE}🚀 Starting React frontend on http://localhost:5173${NC}"
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait a bit for frontend to start
sleep 3

echo ""
echo -e "${GREEN}✅ Development servers started!${NC}"
echo ""
echo "📝 Access points:"
echo "   Frontend:  http://localhost:5173"
echo "   Backend:   http://localhost:3000"
echo "   Health:    http://localhost:3000/health"
echo ""
echo "📋 Logs:"
echo "   Backend:   tail -f backend.log"
echo "   Frontend:  tail -f frontend.log"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID

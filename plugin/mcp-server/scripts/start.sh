#!/bin/bash

# MCP Server Start Script
set -e

PID_FILE="server.pid"
LOG_FILE="server.log"

# Check if server is already running
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        echo "Server is already running with PID: $PID"
        exit 1
    else
        # Remove stale PID file
        rm "$PID_FILE"
    fi
fi

# Load environment variables from .env file
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | grep -v '^$' | xargs)
    echo "Environment variables loaded from .env"
else
    echo "Warning: .env file not found"
fi

# Check if build exists
if [ ! -f "dist/index.js" ]; then
    echo "Build not found. Building..."
    npm run build
fi

# Start server in background
echo "Starting MCP Server..."
nohup node server-wrapper.js > "$LOG_FILE" 2>&1 &
echo $! > "$PID_FILE"

# Wait a moment to check if server started successfully
sleep 2

if kill -0 $(cat "$PID_FILE") 2>/dev/null; then
    echo "✅ Server started successfully with PID: $(cat "$PID_FILE")"
    echo "📝 Logs: npm run logs"
    echo "🔍 Status: npm run status"
    echo "🛑 Stop: npm stop"
else
    echo "❌ Failed to start server. Check logs:"
    cat "$LOG_FILE"
    rm "$PID_FILE"
    exit 1
fi

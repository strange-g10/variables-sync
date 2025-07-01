#!/bin/bash

# MCP Server Stop Script

PID_FILE="server.pid"

# Check if server is running
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        echo "Stopping server with PID: $PID"
        kill "$PID"
        rm "$PID_FILE"
        echo "✅ Server stopped successfully."
    else
        echo "⚠️  Server with PID $PID not running. Removing stale PID file."
        rm "$PID_FILE"
    fi
else
    echo "🔍 Server is not running. No PID file found."
fi


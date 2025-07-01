#!/bin/bash

# MCP Server Status Script

PID_FILE="server.pid"
LOG_FILE="server.log"

echo "=== MCP Server Status ==="

# Check if server is running
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        echo "🟢 Status: Running"
        echo "🆔 PID: $PID"
        echo "⏰ Uptime: $(ps -o etime= -p $PID | tr -d ' ')"
        echo "💾 Memory: $(ps -o rss= -p $PID | tr -d ' ') KB"
        
        if [ -f "$LOG_FILE" ]; then
            echo "📝 Log file: $LOG_FILE ($(wc -l < $LOG_FILE) lines)"
            echo "📄 Last log entries:"
            tail -5 "$LOG_FILE" | sed 's/^/    /'
        fi
    else
        echo "🔴 Status: Not running (stale PID file)"
        echo "⚠️  Removing stale PID file: $PID_FILE"
        rm "$PID_FILE"
    fi
else
    echo "🔴 Status: Not running"
fi

echo ""
echo "Commands:"
echo "  npm start   - Start server"
echo "  npm stop    - Stop server"
echo "  npm restart - Restart server"
echo "  npm run logs - View logs"

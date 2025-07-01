#!/bin/bash

# Quick start script for MCP Server
# Usage: source start-server.sh or ./start-server.sh

set -e

echo "🚀 Starting Figma Variables Sync MCP Server..."

# Load environment variables if .env exists
if [ -f ".env" ]; then
    echo "📋 Loading environment variables..."
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "⚠️  .env file not found. Using default environment variables."
fi

# Check if project is built
if [ ! -d "dist" ]; then
    echo "📦 Building project..."
    npm run build
fi

# Start the server
echo "🌟 MCP Server is starting..."
npm start

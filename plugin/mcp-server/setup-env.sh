#!/bin/bash

# Setup Environment Variables for Figma Variables Sync MCP Server
# Chạy với: source setup-env.sh

echo "🔧 Setting up environment variables for MCP Server..."

# Đọc từ .env file nếu tồn tại
if [ -f ".env" ]; then
    echo "📋 Loading variables from .env file..."
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "⚠️  .env file not found. Setting up example values..."
    # Thiết lập các biến môi trường mẫu
    export GOOGLE_SHEETS_API_KEY="your_api_key_here"
    export GOOGLE_CREDENTIALS_PATH="./credentials.json"
    export FIGMA_TOKEN="your_figma_token_here"
    export FIGMA_FILE_ID="your_file_id_here"
    export LOG_LEVEL="info"
fi

echo "✅ Environment variables configured:"
echo "   GOOGLE_SHEETS_API_KEY: ${GOOGLE_SHEETS_API_KEY:0:10}..."
echo "   GOOGLE_CREDENTIALS_PATH: $GOOGLE_CREDENTIALS_PATH"
echo "   FIGMA_TOKEN: ${FIGMA_TOKEN:0:10}..."
echo "   FIGMA_FILE_ID: ${FIGMA_FILE_ID:0:10}..."
echo "   LOG_LEVEL: $LOG_LEVEL"

echo ""
echo "🚀 MCP Server is ready to test!"
echo "Run: npm start"


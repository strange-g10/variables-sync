#!/bin/bash

echo "🚀 Setting up Figma Variables Sync MCP Server (Portable Version)"
echo "=================================================================="

# Check Node.js and npm versions
echo "📋 Checking system requirements..."
node --version
npm --version

# Remove any workspace configuration interference
echo "🧹 Cleaning workspace configuration..."
rm -f .npmrc
rm -f package-lock.json
rm -rf node_modules
rm -rf dist

# Temporarily move to isolated location and install
echo "📦 Installing dependencies in isolated environment..."
TEMP_DIR="/tmp/mcp-server-$(date +%s)"
mkdir -p "$TEMP_DIR"

# Copy files to temp directory
cp -r src "$TEMP_DIR/"
cp package.json "$TEMP_DIR/"
cp tsconfig.json "$TEMP_DIR/"
cp README.md "$TEMP_DIR/" 2>/dev/null || true

# Install in temp directory
cd "$TEMP_DIR"
npm install
npm run build

# Copy back the working installation
cd - > /dev/null
cp -r "$TEMP_DIR/node_modules" .
if [ -d "$TEMP_DIR/dist" ]; then
    cp -r "$TEMP_DIR/dist" .
else
    echo "⚠️  Warning: Build directory not found, but continuing with installation..."
fi
cp "$TEMP_DIR/package-lock.json" .

# Clean up temp directory
rm -rf "$TEMP_DIR"

echo "✅ Installation complete!"
echo ""
echo "🎯 Available commands:"
echo "  npm start         - Start MCP server (stdio mode)"
echo "  npm run start:http - Start HTTP server"
echo "  npm run dev       - Development mode with watch"
echo "  npm run test      - Test the build"
echo ""
echo "🔗 To start the server:"
echo "  npm start"
echo ""
echo "📱 To test HTTP server:"
echo "  npm run start:http"
echo "  curl http://localhost:3000/health"

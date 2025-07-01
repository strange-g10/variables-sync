#!/bin/bash

# This script sets up the environment for Figma Variables Sync MCP Server
# It ensures compatibility with both macOS and Windows systems
# How to run: 
# On macOS: source setup.sh
# On Windows (using Git Bash or WSL): . setup.sh

set -e

echo "🔧 Setting up environment variables for MCP Server..."

# Check operating system
echo "Detecting Operating System..."
UNAME=$(uname)
OS="unknown"
case "$UNAME" in
  'Darwin') OS='macOS' ;;
  'Linux') OS='Linux' ;;
  'CYGWIN'* | 'MINGW'* | 'MSYS'*) OS='Windows' ;;
  *) echo "Unsupported OS, exiting"; exit 1 ;;
esac

echo "Running on $OS"

# Load environment variables
echo "📋 Loading variables from .env file..."
if [ -f ".env" ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Install dependencies
echo "Installing npm dependencies..."
npm install

# Build Project
echo "Building project..."
npm run build

# Start Server
echo "🚀 Starting MCP Server..."
npm start

# Instructions for Product Designers
echo "To use the MCP Server with Figma Plugin and Google Sheets, follow these steps:"
echo "1. Ensure the MCP Server is running (this script has started it)."
echo "2. In Figma, open the Variables Sync Plugin."
echo "3. Use the plugin interface to connect to Google Sheets for importing/exporting variables."
echo "4. Any changes will reflect based on the server's output and your Google Sheets configuration."
echo "5. For development purposes, ensure your local environment reflects changes on local and remote resources."



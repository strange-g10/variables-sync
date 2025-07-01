# Quick start script for MCP Server on Windows
# Usage: .\start-server.ps1

Write-Host "🚀 Starting Figma Variables Sync MCP Server..." -ForegroundColor Green

# Load environment variables if .env exists
if (Test-Path ".env") {
    Write-Host "📋 Loading environment variables..." -ForegroundColor Blue
    Get-Content ".env" | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            $name = $matches[1]
            $value = $matches[2]
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
} else {
    Write-Host "⚠️ .env file not found. Using default environment variables." -ForegroundColor Yellow
}

# Check if project is built
if (!(Test-Path "dist")) {
    Write-Host "📦 Building project..." -ForegroundColor Blue
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to build project" -ForegroundColor Red
        exit 1
    }
}

# Start the server
Write-Host "🌟 MCP Server is starting..." -ForegroundColor Cyan
npm start

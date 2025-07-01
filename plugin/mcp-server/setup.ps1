# PowerShell script for Windows setup of Figma Variables Sync MCP Server
# How to run: Open PowerShell as Administrator, navigate to this directory, then run: .\setup.ps1

Write-Host "🔧 Setting up environment variables for MCP Server..." -ForegroundColor Green

# Check if .env file exists
Write-Host "📋 Loading variables from .env file..." -ForegroundColor Blue
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            $name = $matches[1]
            $value = $matches[2]
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
            Write-Host "Set $name" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "⚠️ .env file not found. Please create one with your configuration." -ForegroundColor Red
    Write-Host "Example .env content:" -ForegroundColor Yellow
    Write-Host "GOOGLE_SHEETS_API_KEY=your_api_key_here" -ForegroundColor Gray
    Write-Host "FIGMA_TOKEN=your_figma_token_here" -ForegroundColor Gray
    exit 1
}

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Blue
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "Installing npm dependencies..." -ForegroundColor Blue
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Build project
Write-Host "Building project..." -ForegroundColor Blue
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build project" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 To start the MCP Server, run:" -ForegroundColor Cyan
Write-Host "npm start" -ForegroundColor Yellow
Write-Host ""
Write-Host "📖 Next steps for Product Designers:" -ForegroundColor Cyan
Write-Host "1. Run 'npm start' to start the MCP Server" -ForegroundColor White
Write-Host "2. Open Figma and install the Variables Sync Plugin" -ForegroundColor White
Write-Host "3. Use the plugin to connect to your Google Sheets" -ForegroundColor White
Write-Host "4. Import/export variables between Figma and Google Sheets" -ForegroundColor White

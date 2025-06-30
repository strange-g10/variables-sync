# Figma Variables Sync MCP Server

Model Context Protocol (MCP) server cho Figma Variables Sync Plugin. Cung cấp interface để tương tác với plugin thông qua Warp terminal.

## 🚀 Setup

### 1. Cài đặt dependencies

```bash
cd /Users/trangpham/Documents/variables-sync-main/plugin/mcp-server
npm install
```

### 2. Cấu hình Environment Variables

Tạo file `.env` hoặc export các biến môi trường:

```bash
export GOOGLE_SHEETS_API_KEY="your_api_key_here"
export GOOGLE_CREDENTIALS_PATH="./credentials.json"
export FIGMA_TOKEN="your_figma_token_here"
```

### 3. Build MCP Server

```bash
npm run build
```

### 4. Cấu hình Warp MCP

Thêm cấu hình sau vào Warp settings:

```json
{
  "mcpServers": {
    "figma-variables-sync": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "/Users/trangpham/Documents/variables-sync-main/plugin/mcp-server",
      "env": {
        "GOOGLE_SHEETS_API_KEY": "${GOOGLE_SHEETS_API_KEY}",
        "GOOGLE_CREDENTIALS_PATH": "${GOOGLE_CREDENTIALS_PATH}",
        "FIGMA_TOKEN": "${FIGMA_TOKEN}",
        "LOG_LEVEL": "info"
      },
      "disabled": false
    }
  }
}
```

## 🛠️ Available Tools

### 1. Export Variables
```bash
export_variables --collection "Design Tokens" --format full
```

### 2. Import Variables
```bash
import_variables --sheetUrl "https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID" --excludeSheets '["Sheet2", "Sheet3"]'
```

### 3. Assign Variables
```bash
assign_variables --sheetUrl "https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID" --sheetName "Assign Layers" --forceBindAll false
```

### 4. Get Collections
```bash
get_collections
```

### 5. Clear Collections
```bash
clear_collections
```

### 6. Fetch Sheet List
```bash
fetch_sheet_list --sheetUrl "https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID"
```

## 📚 Resources

### Configuration
- `config://variables-sync/config` - Current configuration
- `data://variables-sync/collections` - Variable collections data

## 🔧 Development

### Watch mode
```bash
npm run dev
```

### Test server
```bash
npm start
```

## 🔐 Security

- API keys được load từ environment variables
- Không commit `.env` file vào git
- Sử dụng secure storage cho production

## 📝 Logs

Server logs được output qua stderr để tương thích với MCP protocol.

## 🐛 Troubleshooting

### Check configuration
```bash
# Verify environment variables are set
echo $GOOGLE_SHEETS_API_KEY
echo $FIGMA_TOKEN

# Check server status
node dist/index.js --help
```

### Common issues
1. **API Key not found**: Đảm bảo `GOOGLE_SHEETS_API_KEY` được set
2. **Build errors**: Chạy `npm run clean && npm run build`
3. **Permission errors**: Kiểm tra Google Sheets permissions

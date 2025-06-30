# 🚀 Hướng dẫn cấu hình Warp MCP cho Figma Variables Sync

## 📋 Điều kiện tiên quyết

✅ MCP Server đã được build thành công  
✅ Biến môi trường đã được cấu hình  
✅ Dependencies đã được cài đặt  

## 🔧 Cấu hình Warp MCP

### Bước 1: Thiết lập biến môi trường trong shell profile

Thêm vào `~/.zshrc` hoặc `~/.bash_profile`:

```bash
# Figma Variables Sync Environment Variables
export GOOGLE_SHEETS_API_KEY="your_actual_api_key_here"
export GOOGLE_CREDENTIALS_PATH="/Users/trangpham/Documents/variables-sync-main/plugin/mcp-server/credentials.json"
export FIGMA_TOKEN="your_actual_figma_token_here"
export FIGMA_FILE_ID="your_actual_file_id_here"
export LOG_LEVEL="info"
```

### Bước 2: Reload shell configuration

```bash
source ~/.zshrc
```

### Bước 3: Cấu hình Warp Settings

1. Mở Warp → Settings (Cmd+,)
2. Tìm phần "Features" → "AI"
3. Thêm cấu hình MCP Server

**Cách 1: Sử dụng warp-config.json có sẵn**

Copy nội dung từ file `warp-config.json` trong thư mục này:

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

**Cách 2: Cấu hình trực tiếp trong Warp UI**

- Server Name: `figma-variables-sync`
- Command: `node`
- Args: `["dist/index.js"]`
- Working Directory: `/Users/trangpham/Documents/variables-sync-main/plugin/mcp-server`
- Environment Variables:
  - `GOOGLE_SHEETS_API_KEY`: `${GOOGLE_SHEETS_API_KEY}`
  - `GOOGLE_CREDENTIALS_PATH`: `${GOOGLE_CREDENTIALS_PATH}`
  - `FIGMA_TOKEN`: `${FIGMA_TOKEN}`
  - `LOG_LEVEL`: `info`

### Bước 4: Restart Warp

Sau khi cấu hình, restart Warp để áp dụng thay đổi.

## 🧪 Test MCP Tools trong Warp

Khi đã cấu hình thành công, bạn có thể sử dụng các tools sau trong Warp:

### 1. Lấy danh sách collections
```bash
get_collections
```

### 2. Export variables
```bash
export_variables --collection "Design Tokens" --format full
```

### 3. Import variables từ Google Sheets
```bash
import_variables --sheetUrl "https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID"
```

### 4. Assign variables to layers
```bash
assign_variables --sheetUrl "https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID" --sheetName "Assign Layers"
```

### 5. Lấy danh sách sheets
```bash
fetch_sheet_list --sheetUrl "https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID"
```

### 6. Clear collections
```bash
clear_collections
```

## 🔍 Troubleshooting

### Lỗi "Server not found"
- Kiểm tra đường dẫn `cwd` trong cấu hình
- Đảm bảo file `dist/index.js` tồn tại

### Lỗi API Key
- Kiểm tra biến môi trường đã được set chưa: `echo $GOOGLE_SHEETS_API_KEY`
- Đảm bảo API key có quyền truy cập Google Sheets

### Lỗi Figma Token
- Kiểm tra token Figma: `echo $FIGMA_TOKEN`
- Đảm bảo token có quyền truy cập file Figma

### Server không start
```bash
# Debug server manually
cd /Users/trangpham/Documents/variables-sync-main/plugin/mcp-server
node dist/index.js
```

## 🎯 Kết quả mong đợi

Khi cấu hình thành công, bạn sẽ thấy:

1. ✅ MCP server xuất hiện trong danh sách servers của Warp
2. ✅ Có thể chạy các tools mà không báo lỗi
3. ✅ Tools trả về kết quả hoặc error message rõ ràng
4. ✅ Logs hiển thị trong Warp terminal

## 📚 Resources

- [MCP Protocol Documentation](https://modelcontextprotocol.io/)
- [Warp MCP Setup Guide](https://docs.warp.dev/)
- [Figma API Documentation](https://www.figma.com/developers/api)
- [Google Sheets API Documentation](https://developers.google.com/sheets/api)

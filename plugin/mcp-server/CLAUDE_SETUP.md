# Cấu Hình MCP Server cho Claude Desktop

## Bước 1: Tìm File Cấu Hình Claude Desktop

### MacOS
```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

### Windows
```bash
%APPDATA%/Claude/claude_desktop_config.json
```

### Linux
```bash
~/.config/Claude/claude_desktop_config.json
```

## Bước 2: Cập Nhật Cấu Hình

Mở file `claude_desktop_config.json` và thêm cấu hình MCP server:

```json
{
  "mcpServers": {
    "figma-variables-sync": {
      "command": "node",
      "args": ["/ABSOLUTE_PATH_TO/variables-sync-main/plugin/mcp-server/dist/index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

**Lưu ý:** Thay `/ABSOLUTE_PATH_TO/` bằng đường dẫn thực tế đến thư mục của bạn.

### Ví Dụ Cấu Hình Hoàn Chỉnh

```json
{
  "mcpServers": {
    "figma-variables-sync": {
      "command": "node", 
      "args": ["/Users/trangpham/Documents/variables-sync-main/plugin/mcp-server/dist/index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/trangpham/Documents"],
      "env": {}
    }
  }
}
```

## Bước 3: Khởi Động Lại Claude Desktop

1. **Thoát hoàn toàn** Claude Desktop
2. **Khởi động lại** ứng dụng
3. **Kiểm tra** MCP server đã được load

## Bước 4: Kiểm Tra Kết Nối

Trong Claude Desktop, hỏi:

```
What MCP servers are available?
```

Bạn sẽ thấy `figma-variables-sync` trong danh sách.

## Bước 5: Sử Dụng MCP Tools

### Liệt Kê Các Tools Có Sẵn

```
What tools are available in the figma-variables-sync server?
```

### Sử Dụng Tools

#### 1. Phân Tích File Figma
```
Please analyze the Figma variables file at "/path/to/figma-export.json" using the analyze_figma_file tool.
```

#### 2. Tạo Template Import
```
Create a Google Sheets import template for these variables:
- primary-color (COLOR)
- secondary-color (COLOR) 
- base-spacing (FLOAT)
- font-size-body (FLOAT)
```

#### 3. Validate Google Sheets URL
```
Validate this Google Sheets URL: https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit
```

#### 4. Generate Plugin Config
```
Generate a Figma plugin configuration for this Google Sheets URL: https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit
```

#### 5. Convert CSV to Figma Format
```
Convert the CSV file at "./variables.csv" to Figma variables format and save to "./figma-variables.json"
```

## Bước 6: Truy Cập Resources

### Xem Template Google Sheets
```
Show me the Google Sheets template from figma://variables/template
```

### Xem Example Export
```
Show me an example Figma variables export from figma://variables/export
```

### Xem Configuration Example
```
Show me a configuration example from figma://config/example
```

## Troubleshooting

### Lỗi "Server not found"
1. Kiểm tra đường dẫn trong cấu hình có chính xác không
2. Đảm bảo file `dist/index.js` đã được build
3. Khởi động lại Claude Desktop

### Lỗi "Permission denied"
```bash
chmod +x /path/to/mcp-server/dist/index.js
```

### Lỗi "Node not found"
Đảm bảo Node.js đã được cài đặt và có trong PATH:
```bash
which node
node --version
```

### Xem Debug Logs
Trên macOS, xem logs tại:
```bash
~/Library/Logs/Claude/mcp*.log
```

## Advanced Configuration

### Với Environment Variables
```json
{
  "mcpServers": {
    "figma-variables-sync": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/index.js"],
      "env": {
        "NODE_ENV": "production",
        "GOOGLE_SHEETS_API_KEY": "your-api-key-here",
        "WORKING_DIRECTORY": "/path/to/your/projects"
      }
    }
  }
}
```

### Với Custom Working Directory
```json
{
  "mcpServers": {
    "figma-variables-sync": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/index.js"],
      "cwd": "/path/to/your/design-system",
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

## Use Cases Thực Tế

### 1. Design System Workflow
```
I have a Figma design system and want to sync variables with Google Sheets. Can you:
1. Analyze my current variables export
2. Create a Google Sheets template
3. Generate the plugin configuration
```

### 2. CSV Import Workflow  
```
I have design tokens in a CSV file. Can you:
1. Convert it to Figma variables format
2. Validate the structure
3. Provide recommendations for organization
```

### 3. Quality Assurance
```
I want to validate my Google Sheets setup before importing to Figma. Can you:
1. Check the URL format
2. Analyze the sheet structure
3. Suggest improvements
```

## Security Notes

- **Không commit** API keys vào git
- **Sử dụng environment variables** cho sensitive data
- **Giới hạn quyền truy cập** files và folders
- **Kiểm tra paths** trước khi thực hiện operations

## Support

Nếu gặp vấn đề, hãy:
1. Kiểm tra logs của Claude Desktop
2. Verify MCP server configuration
3. Test MCP server độc lập: `node dist/index.js`
4. Check Node.js và npm versions

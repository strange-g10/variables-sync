# Figma Variables Sync MCP Server

**Dành cho Product Designers** - Hướng dẫn setup và sử dụng MCP Server để đồng bộ variables giữa Figma và Google Sheets.

## 🎯 Workflow Tổng Quan

```
Figma Design File ↔ MCP Server ↔ Google Sheets
      ↑                 ↑              ↑
   Variables        API Bridge     Data Storage
```

### Quy trình làm việc:
1. **Designer** tạo variables trong Figma
2. **MCP Server** làm cầu nối API
3. **Google Sheets** lưu trữ và quản lý data
4. **Team** có thể cập nhật variables qua Google Sheets
5. **Sync** tự động cập nhật lại trong Figma

## 🚀 Quick Start (Portable Setup)

### Bước 1: Setup tự động cho Product Designers

**Khi copy thư mục plugin/ sang máy mới:**

```bash
# Di chuyển vào thư mục mcp-server
cd plugin/mcp-server/

# Chạy setup portable (tự động cài đặt tất cả dependencies)
./setup-portable.sh
```

### Bước 2: Khởi chạy Server

```bash
# MCP Server (stdio mode) - để sử dụng với Claude Desktop
node dist/index.js

# HTTP Server - để test hoặc sử dụng với web interfaces
node dist/httpServer.js
```

### Bước 3: Kiểm tra Server đang hoạt động

```bash
# Test HTTP server
curl http://localhost:3000/health
```

## ⚙️ Setup Chi Tiết

### 1. Yêu cầu hệ thống
- Node.js (v18 trở lên)
- npm hoặc yarn
- Git (để clone project)

### 2. Cấu hình Environment Variables

Tạo file `.env` với nội dung:

```env
# Google Sheets Configuration
GOOGLE_SHEETS_API_KEY=your_api_key_here
GOOGLE_CREDENTIALS_PATH=./credentials.json

# Figma Configuration  
FIGMA_TOKEN=your_figma_token_here
FIGMA_FILE_ID=your_file_id_here

# Server Configuration
SERVER_PORT=3000
SERVER_HOST=localhost

# Logging Configuration
LOG_LEVEL=info
```

### 3. Lấy API Keys

#### Google Sheets API Key:
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project có sẵn
3. Enable Google Sheets API
4. Tạo API Key trong Credentials
5. Copy API Key vào file `.env`

#### Figma Token:
1. Vào Figma > Settings > Account
2. Scroll xuống "Personal access tokens"
3. Click "Create new token"
4. Copy token vào file `.env`

### 4. Cài đặt thủ công (nếu cần)

```bash
# Cài đặt dependencies
npm install

# Build project
npm run build

# Khởi chạy server
npm start
```

## 🛠️ Sử Dụng cho Product Designers

### 1. Kết nối Figma Plugin
1. Mở Figma file của bạn
2. Vào Plugins > Variables Sync
3. Đảm bảo MCP Server đang chạy (check terminal)
4. Plugin sẽ tự động kết nối với server

### 2. Export Variables từ Figma
- Chọn collection muốn export
- Click "Export to Google Sheets"
- Chọn format: `full` (đầy đủ) hoặc `ids` (chỉ ID)

### 3. Import Variables từ Google Sheets
- Paste Google Sheets URL vào plugin
- Chọn sheets muốn import (có thể exclude một số sheets)
- Click "Import Variables"

### 4. Assign Variables tự động
- Chuẩn bị Google Sheets với mapping data
- Chọn sheet chứa assignment rules
- Có thể force bind tất cả variables

### 5. Quản lý Collections
- View tất cả collections hiện có
- Clear collections khi cần reset
- Fetch danh sách sheets từ Google Sheets

## 📊 Cấu Trúc Google Sheets

### Sheet "Variables" (Required):
| Name | Type | Value | Description |
|------|------|-------|-------------|
| primary-color | color | #FF0000 | Main brand color |
| font-size-base | number | 16 | Base font size |
| spacing-small | number | 8 | Small spacing |

### Sheet "Assignments" (Optional):
| Layer Name | Variable Name | Property |
|------------|---------------|----------|
| Button | primary-color | fill |
| Heading | font-size-base | fontSize |

## 🔄 Workflow chi tiết

### Scenario 1: Designer tạo variables mới
1. Tạo variables trong Figma
2. Export qua plugin → Google Sheets
3. Team có thể edit values trong Sheets
4. Import lại để sync changes

### Scenario 2: Team update variables
1. Edit values trong Google Sheets
2. Designer import changes qua plugin
3. Variables tự động update trong Figma
4. Apply cho design elements

### Scenario 3: Bulk assignment
1. Chuẩn bị mapping trong Google Sheets
2. Chạy assign_variables command
3. Tất cả layers tự động bind với variables

## 📚 Resources & References

### Configuration Files
- `.env` - Environment variables
- `warp-config.json` - Warp terminal configuration
- `package.json` - Project dependencies

### API Documentation
- [Google Sheets API](https://developers.google.com/sheets/api)
- [Figma API](https://www.figma.com/developers/api)
- [MCP Protocol](https://modelcontextprotocol.io/)

## 🔧 Development & Testing

### Development mode
```bash
npm run dev          # Watch mode với auto-rebuild
npm run dev:http     # HTTP server mode for testing
```

### Testing
```bash
./test-mcp.sh        # Test MCP functionality
npm start            # Production server
```

## 🔐 Security & Best Practices

- ✅ API keys trong environment variables
- ✅ Không commit `.env` vào git
- ✅ HTTPS cho production
- ✅ Rate limiting cho API calls
- ✅ Input validation

## 🐛 Troubleshooting cho Designers

### Vấn đề thường gặp:

#### 1. Server không khởi chạy được
```bash
# Check Node.js
node --version

# Reinstall dependencies
npm install

# Rebuild project
npm run clean && npm run build
```

#### 2. Plugin không kết nối được
- Đảm bảo server đang chạy (check terminal)
- Kiểm tra port 3000 có bị blocked không
- Restart cả server và Figma

#### 3. Google Sheets API lỗi
- Kiểm tra API key trong `.env`
- Verify Google Sheets URL đúng format
- Đảm bảo sheets có permission để access

#### 4. Figma API lỗi
- Check Figma token còn valid không
- Verify file ID đúng
- Đảm bảo có quyền edit file

### Debug Commands
```bash
# Check environment variables
echo $GOOGLE_SHEETS_API_KEY
echo $FIGMA_TOKEN

# View server logs
tail -f server.log

# Test API connection
curl http://localhost:3000/health
```

## 📞 Support

Nếu gặp vấn đề:
1. Check troubleshooting section trước
2. Tạo issue trên GitHub với log details
3. Include OS, Node version, và error messages

## 🎉 Tips cho Product Designers

- **Naming Convention**: Sử dụng kebab-case cho variable names
- **Organization**: Group variables theo type (colors, spacing, typography)
- **Documentation**: Thêm description cho variables phức tạp
- **Backup**: Thường xuyên export variables ra Google Sheets
- **Collaboration**: Share Google Sheets với team để cùng maintain

# Model Context Protocol (MCP) Implementation Guide

## Giới Thiệu

Model Context Protocol (MCP) là một giao thức chuẩn hóa cho phép tương tác giữa AI models và các nguồn dữ liệu khác nhau. Trong Figma plugin này, chúng ta đã triển khai MCP để:

- **Chuẩn hóa API**: Tạo interface nhất quán cho tất cả operations
- **Tách biệt concerns**: Phân chia rõ ràng giữa data management và business logic
- **Extensibility**: Dễ dàng thêm mới các data sources và tools
- **Conflict resolution**: Quản lý conflicts giữa multiple MCP instances

## Cấu Trúc MCP

### 1. Base MCP Server (`src/mcp/base/mcpServer.ts`)

Cung cấp foundation cho tất cả MCP instances:

```typescript
export abstract class BaseMCPServer {
  protected server: Server;
  protected scope: MCPScope;
  protected resources: Map<string, MCPResource>;
  protected tools: Map<string, MCPTool>;
}
```

**Key Features:**
- **Scope management**: Mỗi MCP có namespace và priority riêng
- **Conflict resolution**: Tự động resolve conflicts dựa trên priority
- **Resource & Tool registration**: Type-safe registration system
- **Abstract methods**: Force implementation of core functionality

### 2. Variables MCP Server (`src/mcp/servers/variablesMCP.ts`)

Quản lý Figma variables operations:

**Resources:**
- `figma://variables/current` - Current variables in file
- `figma://collections/current` - Variable collections
- `figma://variables/usage` - Variable usage analysis

**Tools:**
- `import_variables` - Import from Google Sheets
- `export_variables` - Export to JSON
- `assign_variables` - Assign to design elements  
- `clear_collections` - Clear all collections
- `get_collections` - List collections
- `analyze_variables` - Analysis and insights

### 3. Sheets MCP Server (`src/mcp/servers/sheetsMCP.ts`)

Quản lý Google Sheets integration:

**Resources:**
- `sheets://metadata/{spreadsheetId}` - Sheet metadata
- `sheets://data/{spreadsheetId}/{sheetName}` - Sheet data
- `sheets://cache/list` - Cached data list

**Tools:**
- `fetch_sheet_metadata` - Get sheet metadata
- `fetch_sheet_data` - Get sheet data with caching
- `list_sheets` - List all sheets
- `validate_sheet_url` - Validate URLs
- `clear_cache` - Cache management
- `analyze_sheet_structure` - Structure analysis

## MCP Manager

### Thiết Lập

```typescript
import { MCPManager } from "./mcp/mcpManager";

const mcpManager = MCPManager.getInstance({
  enableVariables: true,
  enableSheets: true,
  autoStart: false,
  conflictResolution: "priority"
});

await mcpManager.initialize();
```

### Configuration Options

```typescript
interface MCPManagerConfig {
  enableVariables: boolean;    // Enable Variables MCP
  enableSheets: boolean;       // Enable Sheets MCP  
  autoStart: boolean;          // Auto-start servers
  conflictResolution: "priority" | "error" | "merge";
}
```

### Conflict Resolution Strategies

#### 1. Priority-based (Recommended)
```typescript
conflictResolution: "priority"
```
- Variables MCP (priority: 100) > Sheets MCP (priority: 90)
- Higher priority MCP overwrites lower priority
- Automatic resolution, no user intervention

#### 2. Error-based
```typescript
conflictResolution: "error"
```
- Throw error when conflicts detected
- Force manual resolution
- Strict validation

#### 3. Merge-based
```typescript
conflictResolution: "merge"
```
- Attempt to merge conflicting resources/tools
- Complex logic, use with caution
- May require custom implementation

## Scope Management

### Định Nghĩa Scope

```typescript
interface MCPScope {
  name: string;        // Human-readable name
  namespace: string;   // Unique identifier
  priority: number;    // Conflict resolution priority
  description: string; // Purpose description
}
```

### Best Practices

1. **Namespace Naming:**
   - Use descriptive, unique names
   - Follow pattern: `domain.feature.version`
   - Examples: `figma.variables.v1`, `sheets.integration.v1`

2. **Priority Assignment:**
   - Core functionality: 100+
   - Extensions: 50-99
   - Experimental: 1-49

3. **Scope Isolation:**
   - Each MCP handles specific domain
   - Minimize cross-scope dependencies
   - Clear responsibility boundaries

## Multiple MCP Instances

### Khi Nào Tạo Multiple MCPs?

1. **Separation of Concerns:**
   ```typescript
   // Variables management
   const variablesMCP = new VariablesMCPServer();
   
   // Data integration  
   const sheetsMCP = new SheetsMCPServer();
   
   // Custom functionality
   const customMCP = new CustomMCPServer();
   ```

2. **Different Data Sources:**
   - Google Sheets integration
   - Airtable integration
   - Database connections
   - File system access

3. **Feature Modules:**
   - Core plugin features
   - Optional extensions
   - Experimental features

### Tránh Conflicts

#### 1. Namespace Prefixing
```typescript
// Variables MCP
resources: {
  "figma://variables/current": {...}
}

// Sheets MCP  
resources: {
  "sheets://data/123": {...}
}
```

#### 2. Priority-based Resolution
```typescript
const coreScope: MCPScope = {
  name: "Core Variables",
  namespace: "variables.core",
  priority: 100,  // High priority
  description: "Core variable management"
};

const extensionScope: MCPScope = {
  name: "Variable Extensions", 
  namespace: "variables.extensions",
  priority: 50,   // Lower priority
  description: "Additional variable features"
};
```

#### 3. Tool Name Conventions
```typescript
// Variables MCP
tools: [
  "variables_import",
  "variables_export", 
  "variables_analyze"
]

// Sheets MCP
tools: [
  "sheets_fetch",
  "sheets_validate",
  "sheets_analyze"  
]
```

## Sử Dụng Thực Tế

### 1. Basic Setup

```typescript
// Initialize MCP Manager
const manager = MCPManager.getInstance({
  enableVariables: true,
  enableSheets: true,
  autoStart: true,
  conflictResolution: "priority"
});

await manager.initialize();
```

### 2. Add Custom MCP

```typescript
class AnalyticsMCPServer extends BaseMCPServer {
  constructor() {
    super({
      name: "Analytics",
      namespace: "analytics", 
      priority: 70,
      description: "Usage analytics and insights"
    });
  }
  
  protected async initialize(): Promise<void> {
    this.addTool({
      name: "track_usage",
      description: "Track plugin usage",
      inputSchema: z.object({
        action: z.string(),
        metadata: z.object({}).optional()
      }),
      handler: async (args) => {
        // Analytics implementation
        return { tracked: true };
      }
    });
  }
}

// Add to manager
const analyticsMCP = new AnalyticsMCPServer();
manager.addServer("analytics", analyticsMCP);
await manager.startServer("analytics");
```

### 3. Health Monitoring

```typescript
// Check health
const health = await manager.healthCheck();
console.log("Overall health:", health.overall);

// Server-specific status
health.servers.forEach(server => {
  console.log(`${server.name}: ${server.status}`);
  if (server.error) {
    console.error(`Error: ${server.error}`);
  }
});
```

### 4. Conflict Detection

```typescript
// Check for conflicts
const conflicts = manager.checkConflicts();

if (conflicts.resourceConflicts.length > 0) {
  console.warn("Resource conflicts:", conflicts.resourceConflicts);
}

if (conflicts.toolConflicts.length > 0) {
  console.warn("Tool conflicts:", conflicts.toolConflicts);
}

// Resolve conflicts
await manager.resolveConflicts();
```

## Best Practices

### 1. Design Principles

- **Single Responsibility**: Mỗi MCP chỉ handle một domain cụ thể
- **Loose Coupling**: Minimize dependencies giữa các MCPs
- **Clear Interfaces**: Sử dụng TypeScript types cho type safety
- **Error Handling**: Comprehensive error handling và logging

### 2. Performance

- **Lazy Loading**: Chỉ initialize MCPs khi cần thiết
- **Resource Cleanup**: Proper cleanup khi shutdown
- **Memory Management**: Monitor memory usage
- **Caching**: Cache frequently accessed data

### 3. Security

- **Input Validation**: Validate tất cả inputs với Zod schemas
- **Resource Access**: Kiểm soát access to sensitive resources
- **Error Messages**: Không expose sensitive information trong errors

### 4. Testing

```typescript
// Unit tests cho individual MCPs
describe("VariablesMCPServer", () => {
  let server: VariablesMCPServer;
  
  beforeEach(async () => {
    server = new VariablesMCPServer();
    await server.start();
  });
  
  afterEach(async () => {
    await server.stop();
  });
  
  it("should handle import_variables tool", async () => {
    // Test implementation
  });
});

// Integration tests cho MCP Manager
describe("MCPManager", () => {
  // Test multiple MCP coordination
});
```

## Migration Strategy

### Từ Legacy Code

1. **Identify Domains**: Phân tích existing code để identify domains
2. **Create MCPs**: Tạo MCP servers cho mỗi domain
3. **Gradual Migration**: Migrate từng phần một cách incremental
4. **Deprecate Legacy**: Gradually phase out old implementations

### Example Migration

```typescript
// Before: Direct function calls
await importVariables(link, excludeSheets, apiKey);

// After: MCP-based
const variablesMCP = manager.getServer("variables");
const result = await variablesMCP.callTool("import_variables", {
  googleSheetsUrl: link,
  excludeSheets,
  apiKey
});
```

## Troubleshooting

### Common Issues

1. **Conflicts**: Use conflict detection và resolution tools
2. **Performance**: Monitor memory usage và optimize caching
3. **Errors**: Check logs và implement proper error handling
4. **Startup Issues**: Verify configuration và dependencies

### Debug Mode

```typescript
// Enable detailed logging
const manager = MCPManager.getInstance({
  enableVariables: true,
  enableSheets: true,
  autoStart: true,
  conflictResolution: "priority"
});

// Monitor events
manager.on("server-started", (name) => {
  console.log(`Server ${name} started`);
});

manager.on("conflict-detected", (conflict) => {
  console.warn("Conflict detected:", conflict);
});
```

## Future Extensions

### Planned Features

1. **Event System**: Pub/sub events giữa MCPs
2. **Plugin Registry**: Dynamic MCP discovery và loading
3. **Performance Metrics**: Built-in performance monitoring
4. **Remote MCPs**: Support for remote MCP servers
5. **Configuration UI**: Visual MCP management interface

### Custom MCP Examples

- **Database MCP**: SQL database integration
- **File System MCP**: Local file operations
- **API Gateway MCP**: External API integrations
- **Notification MCP**: Push notifications và alerts

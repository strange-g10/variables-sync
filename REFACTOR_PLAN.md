# Variables Sync Pipeline - Refactor Plan

## Cấu trúc thư mục mới

```
variables-sync-main/
├── src/                          # Source code chính
│   ├── core/                     # Core business logic
│   │   ├── __init__.py
│   │   ├── base.py              # Base classes và interfaces
│   │   ├── exceptions.py        # Custom exceptions
│   │   └── constants.py         # Constants toàn cục
│   │
│   ├── domain/                   # Domain models và entities
│   │   ├── __init__.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── figma_models.py   # Figma data models
│   │   │   ├── sheet_models.py   # Google Sheets models
│   │   │   └── variable_models.py # Variable models
│   │   └── repositories/
│   │       ├── __init__.py
│   │       ├── figma_repository.py
│   │       ├── sheet_repository.py
│   │       └── file_repository.py
│   │
│   ├── services/                 # Business logic services
│   │   ├── __init__.py
│   │   ├── figma_service.py     # Figma API operations
│   │   ├── sheet_service.py     # Google Sheets operations
│   │   ├── data_processor.py    # Data processing logic
│   │   └── pipeline_service.py  # Pipeline orchestration
│   │
│   ├── infrastructure/           # External integrations
│   │   ├── __init__.py
│   │   ├── figma_client.py      # Figma API client
│   │   ├── sheets_client.py     # Google Sheets client
│   │   └── file_handler.py      # File I/O operations
│   │
│   ├── utils/                    # Utilities và helpers
│   │   ├── __init__.py
│   │   ├── config_manager.py    # Configuration management
│   │   ├── logger.py            # Logging utilities
│   │   ├── validators.py        # Data validation
│   │   ├── formatters.py        # Data formatting
│   │   └── retry_handler.py     # Retry mechanism
│   │
│   └── cli/                      # CLI interfaces
│       ├── __init__.py
│       ├── base_cli.py          # Base CLI class
│       ├── figma_cli.py         # Figma commands
│       ├── sheets_cli.py        # Sheets commands
│       └── pipeline_cli.py      # Pipeline commands
│
├── scripts/                      # Legacy scripts (deprecated)
├── tests/                        # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── main.py                       # Entry point mới
└── requirements.txt
```

## Nguyên tắc thiết kế

### 1. Separation of Concerns
- **Domain Layer**: Chứa business logic thuần túy, không phụ thuộc infrastructure
- **Service Layer**: Orchestrate các operations phức tạp
- **Infrastructure Layer**: Handle external dependencies
- **Utils Layer**: Shared utilities không có business logic

### 2. Dependency Injection
- Sử dụng dependency injection để loose coupling
- Interface-based design cho testability

### 3. Error Handling Strategy
- Centralized error handling với custom exceptions
- Consistent error responses
- Proper logging và monitoring

### 4. Configuration Management
- Centralized config management
- Environment-based configuration
- Type-safe config loading

## Implementation Plan

### Phase 1: Core Infrastructure
1. Setup base classes và interfaces
2. Implement logging system
3. Configuration management
4. Exception handling

### Phase 2: Domain Models
1. Define data models
2. Repository interfaces
3. Business rules validation

### Phase 3: Services Layer
1. Figma service
2. Sheets service  
3. Data processing service
4. Pipeline orchestration

### Phase 4: CLI Refactor
1. New CLI structure
2. Command pattern implementation
3. Interactive menus

### Phase 5: Migration & Testing
1. Migrate existing scripts
2. Unit tests
3. Integration tests
4. Documentation

"""
Constants cho Variables Sync Pipeline
"""

# API URLs
FIGMA_API_BASE_URL = "https://api.figma.com/v1"
GOOGLE_SHEETS_API_BASE_URL = "https://sheets.googleapis.com/v4"

# File paths
DEFAULT_CONFIG_DIR = "config"
DEFAULT_LOG_DIR = "logs"
DEFAULT_DATA_DIR = "local_data"
DEFAULT_RAW_DATA_DIR = "raw_data"
DEFAULT_PROCESSED_DATA_DIR = "processed_data"

# File names
PROCESSED_DATA_FILE = "processed_data.json"
SYNC_DATA_FILE = "sync_data.json"
EXECUTION_LOG_FILE = "execution.log"

# API Limits
DEFAULT_FIGMA_RATE_LIMIT = 60  # requests per minute
DEFAULT_TIMEOUT = 30  # seconds
DEFAULT_RETRY_ATTEMPTS = 3
DEFAULT_RETRY_DELAY = 5  # seconds

# Batch sizes
SHEETS_BATCH_SIZE = 500
MAX_CELLS_PER_REQUEST = 100000

# Variable types
VARIABLE_TYPES = {
    "STRING": "STRING",
    "BOOLEAN": "BOOLEAN", 
    "FLOAT": "FLOAT",
    "COLOR": "COLOR"
}

# Sheet settings
DEFAULT_ROW_HEIGHT = 30
DEFAULT_COLUMN_WIDTH = 200
FROZEN_ROWS = 1
FROZEN_COLUMNS = 3

# Colors (RGB)
EVEN_ROW_COLOR = (240, 240, 240)
ODD_ROW_COLOR = (255, 255, 255)
HEADER_COLOR = (200, 200, 200)

# Status messages
SUCCESS_MESSAGES = {
    "FIGMA_SYNC": "Successfully synced Figma data",
    "DATA_PROCESSED": "Data processed successfully",
    "SHEETS_UPDATED": "Google Sheets updated successfully"
}

ERROR_MESSAGES = {
    "CONFIG_NOT_FOUND": "Configuration file not found",
    "INVALID_CONFIG": "Invalid configuration format",
    "API_ERROR": "API request failed",
    "AUTHENTICATION_FAILED": "Authentication failed",
    "FILE_NOT_FOUND": "Required file not found",
    "VALIDATION_FAILED": "Data validation failed"
}

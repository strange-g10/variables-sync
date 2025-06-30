"""
Logging utilities cho Variables Sync Pipeline
"""
import logging
import os
import sys
from typing import Optional
from datetime import datetime
from pathlib import Path

from ..core.constants import DEFAULT_LOG_DIR, EXECUTION_LOG_FILE
from ..core.base import Singleton


class Logger(metaclass=Singleton):
    """Centralized logger với configuration linh hoạt"""
    
    def __init__(self, 
                 log_dir: str = DEFAULT_LOG_DIR,
                 log_file: str = EXECUTION_LOG_FILE,
                 level: int = logging.INFO,
                 format_string: Optional[str] = None):
        
        self.log_dir = Path(log_dir)
        self.log_file = log_file
        self.level = level
        
        # Default format
        if format_string is None:
            format_string = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        
        self.format_string = format_string
        self._setup_logger()
    
    def _setup_logger(self):
        """Setup logger với file và console handlers"""
        # Tạo thư mục log nếu chưa tồn tại
        self.log_dir.mkdir(parents=True, exist_ok=True)
        
        # Tạo logger
        self.logger = logging.getLogger("variables_sync")
        self.logger.setLevel(self.level)
        
        # Clear existing handlers
        self.logger.handlers.clear()
        
        # Formatter
        formatter = logging.Formatter(self.format_string)
        
        # File handler
        log_path = self.log_dir / self.log_file
        file_handler = logging.FileHandler(log_path, encoding='utf-8')
        file_handler.setLevel(self.level)
        file_handler.setFormatter(formatter)
        self.logger.addHandler(file_handler)
        
        # Console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.WARNING)  # Chỉ show warning+ trên console
        console_handler.setFormatter(formatter)
        self.logger.addHandler(console_handler)
    
    def get_logger(self, name: str = None) -> logging.Logger:
        """Get logger instance với tên cụ thể"""
        if name:
            return logging.getLogger(f"variables_sync.{name}")
        return self.logger
    
    def info(self, message: str, **kwargs):
        """Log info message"""
        self.logger.info(message, extra=kwargs)
    
    def error(self, message: str, **kwargs):
        """Log error message"""
        self.logger.error(message, extra=kwargs)
    
    def warning(self, message: str, **kwargs):
        """Log warning message"""
        self.logger.warning(message, extra=kwargs)
    
    def debug(self, message: str, **kwargs):
        """Log debug message"""
        self.logger.debug(message, extra=kwargs)
    
    def create_operation_logger(self, operation_name: str) -> 'OperationLogger':
        """Tạo operation logger để track một operation cụ thể"""
        return OperationLogger(operation_name, self.get_logger(operation_name))


class OperationLogger:
    """Logger cho một operation cụ thể với timing và metrics"""
    
    def __init__(self, operation_name: str, logger: logging.Logger):
        self.operation_name = operation_name
        self.logger = logger
        self.start_time = None
        self.metrics = {}
    
    def start(self, message: str = ""):
        """Bắt đầu operation"""
        self.start_time = datetime.now()
        msg = f"[{self.operation_name}] Started"
        if message:
            msg += f": {message}"
        self.logger.info(msg)
    
    def finish(self, message: str = ""):
        """Kết thúc operation"""
        if self.start_time:
            duration = datetime.now() - self.start_time
            self.metrics['duration_seconds'] = duration.total_seconds()
        
        msg = f"[{self.operation_name}] Completed"
        if message:
            msg += f": {message}"
        if 'duration_seconds' in self.metrics:
            msg += f" (Duration: {self.metrics['duration_seconds']:.3f}s)"
        
        self.logger.info(msg)
    
    def progress(self, message: str, current: int = None, total: int = None):
        """Log progress update"""
        msg = f"[{self.operation_name}] {message}"
        if current is not None and total is not None:
            percentage = (current / total) * 100
            msg += f" ({current}/{total} - {percentage:.1f}%)"
        
        self.logger.info(msg)
    
    def error(self, message: str, error: Exception = None):
        """Log error trong operation"""
        msg = f"[{self.operation_name}] ERROR: {message}"
        if error:
            msg += f" - {str(error)}"
        self.logger.error(msg)
    
    def warning(self, message: str):
        """Log warning trong operation"""
        msg = f"[{self.operation_name}] WARNING: {message}"
        self.logger.warning(msg)
    
    def add_metric(self, key: str, value):
        """Thêm metric cho operation"""
        self.metrics[key] = value
    
    def get_metrics(self) -> dict:
        """Lấy tất cả metrics"""
        return self.metrics.copy()


# Convenience functions
def get_logger(name: str = None) -> logging.Logger:
    """Get logger instance"""
    logger_instance = Logger()
    return logger_instance.get_logger(name)


def create_operation_logger(operation_name: str) -> OperationLogger:
    """Tạo operation logger"""
    logger_instance = Logger()
    return logger_instance.create_operation_logger(operation_name)

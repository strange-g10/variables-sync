"""
File Repository interface cho local file operations
"""
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from pathlib import Path

from src.core.base import OperationResult


class FileRepository(ABC):
    """Repository interface cho file operations"""
    
    @abstractmethod
    def save_json(self, file_path: Path, data: Any) -> OperationResult[bool]:
        """Lưu dữ liệu dưới dạng JSON"""
        pass
    
    @abstractmethod
    def load_json(self, file_path: Path) -> OperationResult[Any]:
        """Tải dữ liệu từ file JSON"""
        pass
    
    @abstractmethod
    def save_text(self, file_path: Path, content: str) -> OperationResult[bool]:
        """Lưu nội dung text"""
        pass
    
    @abstractmethod
    def load_text(self, file_path: Path) -> OperationResult[str]:
        """Tải nội dung text"""
        pass
    
    @abstractmethod
    def file_exists(self, file_path: Path) -> bool:
        """Kiểm tra file có tồn tại không"""
        pass
    
    @abstractmethod
    def create_directory(self, dir_path: Path) -> OperationResult[bool]:
        """Tạo thư mục"""
        pass
    
    @abstractmethod
    def list_files(self, dir_path: Path, pattern: str = "*") -> OperationResult[List[Path]]:
        """Liệt kê các file trong thư mục"""
        pass
    
    @abstractmethod
    def delete_file(self, file_path: Path) -> OperationResult[bool]:
        """Xóa file"""
        pass
    
    @abstractmethod
    def backup_file(self, file_path: Path, backup_suffix: str = ".bak") -> OperationResult[Path]:
        """Tạo backup của file"""
        pass
    
    @abstractmethod
    def get_file_info(self, file_path: Path) -> OperationResult[Dict[str, Any]]:
        """Lấy thông tin của file (size, modified time, etc.)"""
        pass
    
    @abstractmethod
    def watch_file_changes(self, file_path: Path, callback) -> OperationResult[bool]:
        """Theo dõi thay đổi của file"""
        pass

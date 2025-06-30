"""
File Handler cho local file operations
"""
import json
import os
import shutil
from pathlib import Path
from typing import Any, Dict, List, Optional
from datetime import datetime

from src.core.base import OperationResult, OperationStatus
from src.utils.logger import get_logger


class FileHandler:
    """Handler cho file operations"""
    
    def __init__(self, base_dir: Optional[str] = None):
        self.base_dir = Path(base_dir) if base_dir else Path.cwd()
        self.logger = get_logger(self.__class__.__name__)
        
        # Đảm bảo base directory tồn tại
        self.base_dir.mkdir(parents=True, exist_ok=True)
    
    def save_json(self, file_path: Path, data: Any, indent: int = 2) -> OperationResult[bool]:
        """Lưu dữ liệu dưới dạng JSON"""
        try:
            # Tạo thư mục cha nếu chưa tồn tại
            file_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Chuyển đổi relative path sang absolute
            if not file_path.is_absolute():
                file_path = self.base_dir / file_path
            
            # Backup file cũ nếu tồn tại
            if file_path.exists():
                backup_result = self.backup_file(file_path)
                if not backup_result.is_success:
                    self.logger.warning(f"Could not backup existing file: {backup_result.message}")
            
            # Lưu JSON
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=indent, ensure_ascii=False)
            
            self.logger.info(f"Successfully saved JSON to {file_path}")
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=True,
                message=f"JSON saved to {file_path}"
            )
            
        except (OSError, IOError) as e:
            error_msg = f"File I/O error saving JSON: {e}"
            self.logger.error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                data=False,
                message=error_msg,
                errors=[str(e)]
            )
        except Exception as e:
            error_msg = f"Unexpected error saving JSON: {e}"
            self.logger.error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                data=False,
                message=error_msg,
                errors=[str(e)]
            )
    
    def load_json(self, file_path: Path) -> OperationResult[Any]:
        """Tải dữ liệu từ file JSON"""
        try:
            # Chuyển đổi relative path sang absolute
            if not file_path.is_absolute():
                file_path = self.base_dir / file_path
            
            if not file_path.exists():
                return OperationResult(
                    status=OperationStatus.FAILED,
                    message=f"File not found: {file_path}",
                    errors=["FileNotFoundError"]
                )
            
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            self.logger.debug(f"Successfully loaded JSON from {file_path}")
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=data,
                message=f"JSON loaded from {file_path}"
            )
            
        except json.JSONDecodeError as e:
            error_msg = f"Invalid JSON format: {e}"
            self.logger.error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
        except (OSError, IOError) as e:
            error_msg = f"File I/O error loading JSON: {e}"
            self.logger.error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
        except Exception as e:
            error_msg = f"Unexpected error loading JSON: {e}"
            self.logger.error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def save_text(self, file_path: Path, content: str, encoding: str = 'utf-8') -> OperationResult[bool]:
        """Lưu nội dung text"""
        try:
            # Tạo thư mục cha nếu chưa tồn tại
            file_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Chuyển đổi relative path sang absolute
            if not file_path.is_absolute():
                file_path = self.base_dir / file_path
            
            with open(file_path, 'w', encoding=encoding) as f:
                f.write(content)
            
            self.logger.info(f"Successfully saved text to {file_path}")
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=True,
                message=f"Text saved to {file_path}"
            )
            
        except (OSError, IOError) as e:
            error_msg = f"File I/O error saving text: {e}"
            self.logger.error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                data=False,
                message=error_msg,
                errors=[str(e)]
            )
        except Exception as e:
            error_msg = f"Unexpected error saving text: {e}"
            self.logger.error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                data=False,
                message=error_msg,
                errors=[str(e)]
            )
    
    def load_text(self, file_path: Path, encoding: str = 'utf-8') -> OperationResult[str]:
        """Tải nội dung text"""
        try:
            # Chuyển đổi relative path sang absolute
            if not file_path.is_absolute():
                file_path = self.base_dir / file_path
            
            if not file_path.exists():
                return OperationResult(
                    status=OperationStatus.FAILED,
                    message=f"File not found: {file_path}",
                    errors=["FileNotFoundError"]
                )
            
            with open(file_path, 'r', encoding=encoding) as f:
                content = f.read()
            
            self.logger.debug(f"Successfully loaded text from {file_path}")
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=content,
                message=f"Text loaded from {file_path}"
            )
            
        except (OSError, IOError) as e:
            error_msg = f"File I/O error loading text: {e}"
            self.logger.error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
        except Exception as e:
            error_msg = f"Unexpected error loading text: {e}"
            self.logger.error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def file_exists(self, file_path: Path) -> bool:
        """Kiểm tra file có tồn tại không"""
        # Chuyển đổi relative path sang absolute
        if not file_path.is_absolute():
            file_path = self.base_dir / file_path
        
        return file_path.exists() and file_path.is_file()
    
    def create_directory(self, dir_path: Path) -> OperationResult[bool]:
        """Tạo thư mục"""
        try:
            # Chuyển đổi relative path sang absolute
            if not dir_path.is_absolute():
                dir_path = self.base_dir / dir_path
            
            dir_path.mkdir(parents=True, exist_ok=True)
            
            self.logger.info(f"Successfully created directory {dir_path}")
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=True,
                message=f"Directory created: {dir_path}"
            )
            
        except Exception as e:
            error_msg = f"Error creating directory: {e}"
            self.logger.error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                data=False,
                message=error_msg,
                errors=[str(e)]
            )
    
    def list_files(self, dir_path: Path, pattern: str = "*", recursive: bool = False) -> OperationResult[List[Path]]:
        """Liệt kê các file trong thư mục"""
        try:
            # Chuyển đổi relative path sang absolute
            if not dir_path.is_absolute():
                dir_path = self.base_dir / dir_path
            
            if not dir_path.exists() or not dir_path.is_dir():
                return OperationResult(
                    status=OperationStatus.FAILED,
                    message=f"Directory not found: {dir_path}",
                    errors=["DirectoryNotFoundError"]
                )
            
            if recursive:
                files = list(dir_path.rglob(pattern))
            else:
                files = list(dir_path.glob(pattern))
            
            # Chỉ lấy files, không lấy directories
            files = [f for f in files if f.is_file()]
            
            self.logger.debug(f"Found {len(files)} files in {dir_path} with pattern '{pattern}'")
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=files,
                message=f"Found {len(files)} files"
            )
            
        except Exception as e:
            error_msg = f"Error listing files: {e}"
            self.logger.error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def delete_file(self, file_path: Path) -> OperationResult[bool]:
        """Xóa file"""
        try:
            # Chuyển đổi relative path sang absolute
            if not file_path.is_absolute():
                file_path = self.base_dir / file_path
            
            if not file_path.exists():
                return OperationResult(
                    status=OperationStatus.WARNING,
                    data=True,
                    message=f"File already does not exist: {file_path}"
                )
            
            if file_path.is_file():
                file_path.unlink()
            elif file_path.is_dir():
                shutil.rmtree(file_path)
            
            self.logger.info(f"Successfully deleted {file_path}")
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=True,
                message=f"File deleted: {file_path}"
            )
            
        except Exception as e:
            error_msg = f"Error deleting file: {e}"
            self.logger.error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                data=False,
                message=error_msg,
                errors=[str(e)]
            )
    
    def backup_file(self, file_path: Path, backup_suffix: str = ".bak") -> OperationResult[Path]:
        """Tạo backup của file"""
        try:
            # Chuyển đổi relative path sang absolute
            if not file_path.is_absolute():
                file_path = self.base_dir / file_path
            
            if not file_path.exists():
                return OperationResult(
                    status=OperationStatus.FAILED,
                    message=f"File not found for backup: {file_path}",
                    errors=["FileNotFoundError"]
                )
            
            # Tạo tên backup với timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_path = file_path.with_suffix(f"{backup_suffix}.{timestamp}")
            
            # Copy file
            shutil.copy2(file_path, backup_path)
            
            self.logger.info(f"Successfully backed up {file_path} to {backup_path}")
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=backup_path,
                message=f"File backed up to {backup_path}"
            )
            
        except Exception as e:
            error_msg = f"Error backing up file: {e}"
            self.logger.error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def get_file_info(self, file_path: Path) -> OperationResult[Dict[str, Any]]:
        """Lấy thông tin của file"""
        try:
            # Chuyển đổi relative path sang absolute
            if not file_path.is_absolute():
                file_path = self.base_dir / file_path
            
            if not file_path.exists():
                return OperationResult(
                    status=OperationStatus.FAILED,
                    message=f"File not found: {file_path}",
                    errors=["FileNotFoundError"]
                )
            
            stat = file_path.stat()
            
            info = {
                "path": str(file_path),
                "name": file_path.name,
                "size": stat.st_size,
                "size_mb": round(stat.st_size / (1024 * 1024), 2),
                "modified_time": datetime.fromtimestamp(stat.st_mtime),
                "created_time": datetime.fromtimestamp(stat.st_ctime),
                "is_file": file_path.is_file(),
                "is_directory": file_path.is_dir(),
                "extension": file_path.suffix,
                "permissions": oct(stat.st_mode)[-3:]
            }
            
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=info,
                message=f"File info retrieved for {file_path}"
            )
            
        except Exception as e:
            error_msg = f"Error getting file info: {e}"
            self.logger.error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def watch_file_changes(self, file_path: Path, callback) -> OperationResult[bool]:
        """Theo dõi thay đổi của file (placeholder implementation)"""
        # Đây là placeholder implementation
        # Trong thực tế có thể sử dụng watchdog library
        self.logger.warning("File watching not implemented yet. Consider using watchdog library.")
        
        return OperationResult(
            status=OperationStatus.WARNING,
            data=False,
            message="File watching not implemented",
            errors=["NotImplementedError"]
        )
    
    def ensure_dir_exists(self, dir_path: Path) -> bool:
        """Đảm bảo thư mục tồn tại"""
        result = self.create_directory(dir_path)
        return result.is_success
    
    def get_relative_path(self, file_path: Path) -> Path:
        """Lấy relative path từ base directory"""
        if file_path.is_absolute():
            try:
                return file_path.relative_to(self.base_dir)
            except ValueError:
                return file_path
        return file_path
    
    def get_absolute_path(self, file_path: Path) -> Path:
        """Lấy absolute path"""
        if file_path.is_absolute():
            return file_path
        return self.base_dir / file_path

"""
Google Sheets Repository interface
"""
from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any

from ..models.sheet_models import Spreadsheet, Worksheet, CellRange
from src.core.base import OperationResult


class SheetRepository(ABC):
    """Repository interface cho Google Sheets data"""
    
    @abstractmethod
    def get_spreadsheet(self, spreadsheet_id: str) -> OperationResult[Spreadsheet]:
        """Lấy thông tin spreadsheet"""
        pass
    
    @abstractmethod
    def create_spreadsheet(self, name: str, worksheets: List[str] = None) -> OperationResult[Spreadsheet]:
        """Tạo spreadsheet mới"""
        pass
    
    @abstractmethod
    def delete_spreadsheet(self, spreadsheet_id: str) -> OperationResult[bool]:
        """Xóa spreadsheet"""
        pass
    
    @abstractmethod
    def get_worksheet(self, spreadsheet_id: str, worksheet_title: str) -> OperationResult[Worksheet]:
        """Lấy thông tin worksheet"""
        pass
    
    @abstractmethod
    def create_worksheet(self, spreadsheet_id: str, worksheet: Worksheet) -> OperationResult[Worksheet]:
        """Tạo worksheet mới"""
        pass
    
    @abstractmethod
    def update_worksheet(self, spreadsheet_id: str, worksheet: Worksheet) -> OperationResult[Worksheet]:
        """Cập nhật worksheet"""
        pass
    
    @abstractmethod
    def delete_worksheet(self, spreadsheet_id: str, worksheet_id: int) -> OperationResult[bool]:
        """Xóa worksheet"""
        pass
    
    @abstractmethod
    def get_range_values(self, spreadsheet_id: str, worksheet_title: str, range_address: str) -> OperationResult[CellRange]:
        """Lấy giá trị từ một range"""
        pass
    
    @abstractmethod
    def update_range_values(self, spreadsheet_id: str, worksheet_title: str, cell_range: CellRange) -> OperationResult[bool]:
        """Cập nhật giá trị cho một range"""
        pass
    
    @abstractmethod
    def append_rows(self, spreadsheet_id: str, worksheet_title: str, values: List[List[Any]]) -> OperationResult[bool]:
        """Thêm các hàng mới vào cuối worksheet"""
        pass
    
    @abstractmethod
    def clear_range(self, spreadsheet_id: str, worksheet_title: str, range_address: str) -> OperationResult[bool]:
        """Xóa nội dung của một range"""
        pass
    
    @abstractmethod
    def batch_update(self, spreadsheet_id: str, updates: List[Dict[str, Any]]) -> OperationResult[bool]:
        """Thực hiện batch update"""
        pass
    
    @abstractmethod
    def format_range(self, spreadsheet_id: str, worksheet_title: str, range_address: str, format_config: Dict[str, Any]) -> OperationResult[bool]:
        """Format một range"""
        pass
    
    @abstractmethod
    def get_sheet_permissions(self, spreadsheet_id: str) -> OperationResult[List[Dict[str, Any]]]:
        """Lấy thông tin quyền truy cập"""
        pass
    
    @abstractmethod
    def share_spreadsheet(self, spreadsheet_id: str, email: str, role: str = "reader") -> OperationResult[bool]:
        """Chia sẻ spreadsheet"""
        pass

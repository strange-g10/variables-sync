"""
Figma Repository interface
"""
from abc import ABC, abstractmethod
from typing import List, Optional

from ..models.figma_models import FigmaFile, FigmaCollection, FigmaVariable
from src.core.base import OperationResult


class FigmaRepository(ABC):
    """Repository interface cho Figma data"""
    
    @abstractmethod
    def get_file(self, file_id: str) -> OperationResult[FigmaFile]:
        """Lấy thông tin file Figma"""
        pass
    
    @abstractmethod
    def get_collections(self, file_id: str) -> OperationResult[List[FigmaCollection]]:
        """Lấy danh sách collections từ file"""
        pass
    
    @abstractmethod
    def get_collection(self, collection_id: str) -> OperationResult[FigmaCollection]:
        """Lấy thông tin chi tiết của một collection"""
        pass
    
    @abstractmethod
    def get_variables(self, collection_id: str) -> OperationResult[List[FigmaVariable]]:
        """Lấy danh sách variables từ collection"""
        pass
    
    @abstractmethod
    def get_variable(self, variable_id: str) -> OperationResult[FigmaVariable]:
        """Lấy thông tin chi tiết của một variable"""
        pass
    
    @abstractmethod
    def create_variable(self, collection_id: str, variable: FigmaVariable) -> OperationResult[FigmaVariable]:
        """Tạo variable mới"""
        pass
    
    @abstractmethod
    def update_variable(self, variable: FigmaVariable) -> OperationResult[FigmaVariable]:
        """Cập nhật variable"""
        pass
    
    @abstractmethod
    def delete_variable(self, variable_id: str) -> OperationResult[bool]:
        """Xóa variable"""
        pass
    
    @abstractmethod
    def create_collection(self, file_id: str, collection: FigmaCollection) -> OperationResult[FigmaCollection]:
        """Tạo collection mới"""
        pass
    
    @abstractmethod
    def update_collection(self, collection: FigmaCollection) -> OperationResult[FigmaCollection]:
        """Cập nhật collection"""
        pass
    
    @abstractmethod
    def delete_collection(self, collection_id: str) -> OperationResult[bool]:
        """Xóa collection"""
        pass
    
    @abstractmethod
    def save_file_data(self, file_data: FigmaFile) -> OperationResult[bool]:
        """Lưu dữ liệu file vào local storage"""
        pass
    
    @abstractmethod
    def load_file_data(self, file_id: str) -> OperationResult[FigmaFile]:
        """Tải dữ liệu file từ local storage"""
        pass

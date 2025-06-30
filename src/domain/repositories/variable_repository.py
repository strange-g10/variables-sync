"""
Variable Repository interface cho variable sync operations
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

from ..models.variable_models import Variable, VariableMapping, VariableAssignment, ProcessingResult
from src.core.base import OperationResult


class VariableRepository(ABC):
    """Repository interface cho variable sync operations"""
    
    @abstractmethod
    def save_variables(self, variables: List[Variable]) -> OperationResult[bool]:
        """Lưu danh sách variables"""
        pass
    
    @abstractmethod
    def load_variables(self) -> OperationResult[List[Variable]]:
        """Tải danh sách variables"""
        pass
    
    @abstractmethod
    def get_variable_by_id(self, variable_id: str) -> OperationResult[Variable]:
        """Lấy variable theo ID"""
        pass
    
    @abstractmethod
    def save_variable_mappings(self, mappings: List[VariableMapping]) -> OperationResult[bool]:
        """Lưu danh sách variable mappings"""
        pass
    
    @abstractmethod
    def load_variable_mappings(self) -> OperationResult[List[VariableMapping]]:
        """Tải danh sách variable mappings"""
        pass
    
    @abstractmethod
    def save_assignments(self, assignments: List[VariableAssignment]) -> OperationResult[bool]:
        """Lưu danh sách assignments"""
        pass
    
    @abstractmethod
    def load_assignments(self) -> OperationResult[List[VariableAssignment]]:
        """Tải danh sách assignments"""
        pass
    
    @abstractmethod
    def save_processing_result(self, result: ProcessingResult) -> OperationResult[bool]:
        """Lưu kết quả xử lý"""
        pass
    
    @abstractmethod
    def load_processing_result(self) -> OperationResult[ProcessingResult]:
        """Tải kết quả xử lý gần nhất"""
        pass
    
    @abstractmethod
    def get_sync_history(self, limit: int = 10) -> OperationResult[List[Dict[str, Any]]]:
        """Lấy lịch sử đồng bộ"""
        pass
    
    @abstractmethod
    def clear_cache(self) -> OperationResult[bool]:
        """Xóa cache"""
        pass

"""
Variable domain models, used for syncing and processing
"""
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Any
from enum import Enum


class SyncStatus(Enum):
    """Trạng thái đồng bộ hoá của biến"""
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


@dataclass
class Variable:
    """Biểu diễn cho một biến cần đồng bộ"""
    id: str
    name: str
    type: str
    value: Any = None
    description: Optional[str] = ""

    def __str__(self) -> str:
        return f"Variable({self.name}={self.value})"


@dataclass
class VariableAssignment:
    """Assignment của biến vào một mode"""
    variable_id: str
    mode_id: str
    value: Any
    status: SyncStatus = SyncStatus.PENDING
    
    def __str__(self) -> str:
        return f"Assignment({self.variable_id} to {self.mode_id})"


@dataclass
class VariableMapping:
    """Định nghĩa cách một biến được map giữa các domain khác nhau"""
    source_variable: Variable
    target_variable: Variable
    mapping_rules: List[str] = field(default_factory=list)
    is_active: bool = True
    
    def __str__(self) -> str:
        return f"Mapping({self.source_variable} -> {self.target_variable})"


@dataclass
class ProcessingResult:
    """Kết quả xử lý của biến trong quá trình đồng bộ"""
    processed_variables: List[Variable] = field(default_factory=list)
    failed_variables: List[str] = field(default_factory=list)  # list of failed variable ids
    warnings: List[str] = field(default_factory=list)
    
    def __str__(self) -> str:
        return (f"Processed: {[v.name for v in self.processed_variables]}, "
                f"Failed: {self.failed_variables}, Warnings: {self.warnings}")

"""
Figma domain models
"""
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any, Union
from enum import Enum
from datetime import datetime


class VariableType(Enum):
    """Các kiểu variable trong Figma"""
    STRING = "STRING"
    BOOLEAN = "BOOLEAN"
    FLOAT = "FLOAT"
    COLOR = "COLOR"


@dataclass
class VariableValue:
    """Giá trị của một variable"""
    type: VariableType
    value: Union[str, bool, float, Dict[str, float]]
    
    def __post_init__(self):
        self._validate_value()
    
    def _validate_value(self):
        """Validate value theo type"""
        if self.type == VariableType.STRING and not isinstance(self.value, str):
            raise ValueError(f"STRING variable must have string value, got {type(self.value)}")
        elif self.type == VariableType.BOOLEAN and not isinstance(self.value, bool):
            raise ValueError(f"BOOLEAN variable must have boolean value, got {type(self.value)}")
        elif self.type == VariableType.FLOAT and not isinstance(self.value, (int, float)):
            raise ValueError(f"FLOAT variable must have numeric value, got {type(self.value)}")
        elif self.type == VariableType.COLOR and not isinstance(self.value, dict):
            raise ValueError(f"COLOR variable must have dict value, got {type(self.value)}")
    
    @property
    def as_string(self) -> str:
        """Convert value to string representation"""
        if self.type == VariableType.COLOR:
            # Color format: {"r": 1.0, "g": 0.5, "b": 0.0, "a": 1.0}
            if isinstance(self.value, dict):
                r = int(self.value.get('r', 0) * 255)
                g = int(self.value.get('g', 0) * 255)
                b = int(self.value.get('b', 0) * 255)
                a = self.value.get('a', 1.0)
                if a == 1.0:
                    return f"rgb({r}, {g}, {b})"
                else:
                    return f"rgba({r}, {g}, {b}, {a})"
        return str(self.value)


@dataclass
class FigmaMode:
    """Mode trong Figma collection (như Light/Dark theme)"""
    id: str
    name: str
    
    def __str__(self) -> str:
        return f"Mode({self.name})"


@dataclass
class FigmaVariable:
    """Variable trong Figma"""
    id: str
    name: str
    key: str
    variable_collection_id: str
    resolved_type: VariableType
    values_by_mode: Dict[str, VariableValue]  # mode_id -> value
    description: str = ""
    hidden_from_publishing: bool = False
    scopes: List[str] = field(default_factory=list)
    code_syntax: Dict[str, str] = field(default_factory=dict)
    
    def get_value_for_mode(self, mode_id: str) -> Optional[VariableValue]:
        """Lấy giá trị variable cho mode cụ thể"""
        return self.values_by_mode.get(mode_id)
    
    def get_value_as_string(self, mode_id: str) -> str:
        """Lấy giá trị variable dưới dạng string"""
        value = self.get_value_for_mode(mode_id)
        return value.as_string if value else ""
    
    @property
    def display_name(self) -> str:
        """Tên hiển thị cho variable"""
        return self.name or self.key
    
    def __str__(self) -> str:
        return f"FigmaVariable({self.display_name})"


@dataclass
class FigmaCollection:
    """Collection chứa các variables trong Figma"""
    id: str
    name: str
    modes: List[FigmaMode]
    default_mode_id: str
    variables: List[FigmaVariable] = field(default_factory=list)
    
    def get_mode_by_id(self, mode_id: str) -> Optional[FigmaMode]:
        """Tìm mode theo ID"""
        return next((m for m in self.modes if m.id == mode_id), None)
    
    def get_mode_by_name(self, mode_name: str) -> Optional[FigmaMode]:
        """Tìm mode theo tên"""
        return next((m for m in self.modes if m.name == mode_name), None)
    
    def get_variable_by_id(self, variable_id: str) -> Optional[FigmaVariable]:
        """Tìm variable theo ID"""
        return next((v for v in self.variables if v.id == variable_id), None)
    
    def get_variable_by_name(self, variable_name: str) -> Optional[FigmaVariable]:
        """Tìm variable theo tên"""
        return next((v for v in self.variables if v.name == variable_name), None)
    
    def get_variables_by_type(self, variable_type: VariableType) -> List[FigmaVariable]:
        """Lấy tất cả variables theo type"""
        return [v for v in self.variables if v.resolved_type == variable_type]
    
    @property
    def default_mode(self) -> Optional[FigmaMode]:
        """Mode mặc định"""
        return self.get_mode_by_id(self.default_mode_id)
    
    @property
    def variable_count(self) -> int:
        """Số lượng variables"""
        return len(self.variables)
    
    def add_variable(self, variable: FigmaVariable):
        """Thêm variable vào collection"""
        if variable.variable_collection_id != self.id:
            raise ValueError(f"Variable {variable.id} không thuộc collection {self.id}")
        
        # Kiểm tra không trùng ID
        if any(v.id == variable.id for v in self.variables):
            raise ValueError(f"Variable {variable.id} đã tồn tại trong collection")
        
        self.variables.append(variable)
    
    def __str__(self) -> str:
        return f"FigmaCollection({self.name}, {self.variable_count} variables)"


@dataclass
class FigmaFile:
    """File Figma chứa các collections"""
    id: str
    name: str
    last_modified: Optional[datetime] = None
    collections: List[FigmaCollection] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def get_collection_by_id(self, collection_id: str) -> Optional[FigmaCollection]:
        """Tìm collection theo ID"""
        return next((c for c in self.collections if c.id == collection_id), None)
    
    def get_collection_by_name(self, collection_name: str) -> Optional[FigmaCollection]:
        """Tìm collection theo tên"""
        return next((c for c in self.collections if c.name == collection_name), None)
    
    def get_all_variables(self) -> List[FigmaVariable]:
        """Lấy tất cả variables từ mọi collections"""
        all_variables = []
        for collection in self.collections:
            all_variables.extend(collection.variables)
        return all_variables
    
    def get_variables_by_type(self, variable_type: VariableType) -> List[FigmaVariable]:
        """Lấy tất cả variables theo type từ mọi collections"""
        variables = []
        for collection in self.collections:
            variables.extend(collection.get_variables_by_type(variable_type))
        return variables
    
    @property
    def total_variable_count(self) -> int:
        """Tổng số variables trong file"""
        return sum(c.variable_count for c in self.collections)
    
    @property
    def collection_count(self) -> int:
        """Số lượng collections"""
        return len(self.collections)
    
    def add_collection(self, collection: FigmaCollection):
        """Thêm collection vào file"""
        # Kiểm tra không trùng ID
        if any(c.id == collection.id for c in self.collections):
            raise ValueError(f"Collection {collection.id} đã tồn tại trong file")
        
        self.collections.append(collection)
    
    def __str__(self) -> str:
        return f"FigmaFile({self.name}, {self.collection_count} collections, {self.total_variable_count} variables)"

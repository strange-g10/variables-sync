"""
Variable Domain Service cho business logic
"""
from typing import List, Optional, Dict, Any

from ..models.variable_models import Variable, VariableMapping, VariableAssignment, SyncStatus
from ..models.figma_models import FigmaVariable, VariableType
from src.core.exceptions import ValidationError


class VariableDomainService:
    """Domain service cho variable business logic"""
    
    def validate_variable(self, variable: Variable) -> bool:
        """Validate một variable"""
        errors = []
        
        # Kiểm tra ID không rỗng
        if not variable.id or not variable.id.strip():
            errors.append("Variable ID không được rỗng")
        
        # Kiểm tra tên không rỗng
        if not variable.name or not variable.name.strip():
            errors.append("Variable name không được rỗng")
        
        # Kiểm tra type hợp lệ
        valid_types = [vt.value for vt in VariableType]
        if variable.type not in valid_types:
            errors.append(f"Variable type '{variable.type}' không hợp lệ. Các type hợp lệ: {valid_types}")
        
        if errors:
            raise ValidationError("Variable validation failed", errors)
        
        return True
    
    def validate_variable_mapping(self, mapping: VariableMapping) -> bool:
        """Validate một variable mapping"""
        errors = []
        
        # Kiểm tra source và target variables
        try:
            self.validate_variable(mapping.source_variable)
        except ValidationError as e:
            errors.extend([f"Source variable: {err}" for err in e.errors])
        
        try:
            self.validate_variable(mapping.target_variable)
        except ValidationError as e:
            errors.extend([f"Target variable: {err}" for err in e.errors])
        
        # Kiểm tra không map vào chính nó
        if mapping.source_variable.id == mapping.target_variable.id:
            errors.append("Không thể map variable vào chính nó")
        
        # Kiểm tra type tương thích
        if mapping.source_variable.type != mapping.target_variable.type:
            errors.append(f"Type không tương thích: {mapping.source_variable.type} -> {mapping.target_variable.type}")
        
        if errors:
            raise ValidationError("Variable mapping validation failed", errors)
        
        return True
    
    def validate_variable_assignment(self, assignment: VariableAssignment) -> bool:
        """Validate một variable assignment"""
        errors = []
        
        # Kiểm tra variable ID không rỗng
        if not assignment.variable_id or not assignment.variable_id.strip():
            errors.append("Variable ID không được rỗng")
        
        # Kiểm tra mode ID không rỗng
        if not assignment.mode_id or not assignment.mode_id.strip():
            errors.append("Mode ID không được rỗng")
        
        # Kiểm tra value không None
        if assignment.value is None:
            errors.append("Assignment value không được None")
        
        # Kiểm tra status hợp lệ
        if assignment.status not in SyncStatus:
            errors.append(f"Status '{assignment.status}' không hợp lệ")
        
        if errors:
            raise ValidationError("Variable assignment validation failed", errors)
        
        return True
    
    def create_variable_from_figma(self, figma_variable: FigmaVariable, mode_id: str) -> Variable:
        """Tạo Variable từ FigmaVariable"""
        value = figma_variable.get_value_as_string(mode_id)
        
        return Variable(
            id=figma_variable.id,
            name=figma_variable.display_name,
            type=figma_variable.resolved_type.value,
            value=value,
            description=figma_variable.description
        )
    
    def create_mapping_between_variables(self, source: Variable, target: Variable, rules: List[str] = None) -> VariableMapping:
        """Tạo mapping giữa 2 variables"""
        mapping = VariableMapping(
            source_variable=source,
            target_variable=target,
            mapping_rules=rules or [],
            is_active=True
        )
        
        # Validate trước khi trả về
        self.validate_variable_mapping(mapping)
        
        return mapping
    
    def create_assignment(self, variable_id: str, mode_id: str, value: Any) -> VariableAssignment:
        """Tạo assignment mới"""
        assignment = VariableAssignment(
            variable_id=variable_id,
            mode_id=mode_id,
            value=value,
            status=SyncStatus.PENDING
        )
        
        # Validate trước khi trả về
        self.validate_variable_assignment(assignment)
        
        return assignment
    
    def can_sync_variables(self, variables: List[Variable]) -> Dict[str, Any]:
        """Kiểm tra xem có thể sync danh sách variables không"""
        result = {
            "can_sync": True,
            "errors": [],
            "warnings": [],
            "variable_count": len(variables)
        }
        
        if not variables:
            result["can_sync"] = False
            result["errors"].append("Danh sách variables rỗng")
            return result
        
        # Kiểm tra duplicate IDs
        variable_ids = [v.id for v in variables]
        duplicate_ids = set([id for id in variable_ids if variable_ids.count(id) > 1])
        if duplicate_ids:
            result["warnings"].append(f"Có {len(duplicate_ids)} variables bị trùng ID: {list(duplicate_ids)}")
        
        # Validate từng variable
        invalid_variables = []
        for var in variables:
            try:
                self.validate_variable(var)
            except ValidationError:
                invalid_variables.append(var.id)
        
        if invalid_variables:
            result["can_sync"] = False
            result["errors"].append(f"Có {len(invalid_variables)} variables không hợp lệ: {invalid_variables}")
        
        return result
    
    def filter_syncable_variables(self, variables: List[Variable]) -> List[Variable]:
        """Lọc ra các variables có thể sync được"""
        syncable = []
        
        for var in variables:
            try:
                self.validate_variable(var)
                syncable.append(var)
            except ValidationError:
                # Bỏ qua variables không hợp lệ
                continue
        
        return syncable

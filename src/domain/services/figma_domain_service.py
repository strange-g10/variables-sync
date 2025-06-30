"""
Figma Domain Service cho business logic
"""
from typing import List, Optional, Dict, Any

from ..models.figma_models import FigmaFile, FigmaCollection, FigmaVariable, FigmaMode, VariableType
from src.core.exceptions import ValidationError


class FigmaDomainService:
    """Domain service cho Figma business logic"""
    
    def validate_figma_file(self, file: FigmaFile) -> bool:
        """Validate FigmaFile"""
        errors = []
        
        if not file.id or not file.id.strip():
            errors.append("File ID không được rỗng")
        
        if not file.name or not file.name.strip():
            errors.append("File name không được rỗng")
        
        # Validate collections
        for collection in file.collections:
            try:
                self.validate_figma_collection(collection)
            except ValidationError as e:
                errors.extend([f"Collection {collection.name}: {err}" for err in e.errors])
        
        if errors:
            raise ValidationError("Figma file validation failed", errors)
        
        return True
    
    def validate_figma_collection(self, collection: FigmaCollection) -> bool:
        """Validate FigmaCollection"""
        errors = []
        
        if not collection.id or not collection.id.strip():
            errors.append("Collection ID không được rỗng")
        
        if not collection.name or not collection.name.strip():
            errors.append("Collection name không được rỗng")
        
        if not collection.modes:
            errors.append("Collection phải có ít nhất 1 mode")
        
        # Kiểm tra default mode có tồn tại
        if not collection.get_mode_by_id(collection.default_mode_id):
            errors.append(f"Default mode ID '{collection.default_mode_id}' không tồn tại trong collection")
        
        # Validate variables
        for variable in collection.variables:
            try:
                self.validate_figma_variable(variable)
            except ValidationError as e:
                errors.extend([f"Variable {variable.name}: {err}" for err in e.errors])
        
        if errors:
            raise ValidationError("Figma collection validation failed", errors)
        
        return True
    
    def validate_figma_variable(self, variable: FigmaVariable) -> bool:
        """Validate FigmaVariable"""
        errors = []
        
        if not variable.id or not variable.id.strip():
            errors.append("Variable ID không được rỗng")
        
        if not variable.name or not variable.name.strip():
            errors.append("Variable name không được rỗng")
        
        if not variable.key or not variable.key.strip():
            errors.append("Variable key không được rỗng")
        
        if not variable.variable_collection_id or not variable.variable_collection_id.strip():
            errors.append("Variable collection ID không được rỗng")
        
        if not variable.resolved_type:
            errors.append("Variable resolved_type không được rỗng")
        
        # Kiểm tra values_by_mode không rỗng
        if not variable.values_by_mode:
            errors.append("Variable phải có ít nhất 1 giá trị cho mode")
        
        if errors:
            raise ValidationError("Figma variable validation failed", errors)
        
        return True
    
    def can_merge_collections(self, collection1: FigmaCollection, collection2: FigmaCollection) -> Dict[str, Any]:
        """Kiểm tra xem có thể merge 2 collections không"""
        result = {
            "can_merge": True,
            "conflicts": [],
            "warnings": []
        }
        
        # Kiểm tra mode conflicts
        modes1 = {m.name: m.id for m in collection1.modes}
        modes2 = {m.name: m.id for m in collection2.modes}
        
        conflicting_modes = set(modes1.keys()) & set(modes2.keys())
        if conflicting_modes:
            for mode_name in conflicting_modes:
                if modes1[mode_name] != modes2[mode_name]:
                    result["conflicts"].append(f"Mode '{mode_name}' có ID khác nhau")
        
        # Kiểm tra variable name conflicts
        vars1 = {v.name: v.id for v in collection1.variables}
        vars2 = {v.name: v.id for v in collection2.variables}
        
        conflicting_vars = set(vars1.keys()) & set(vars2.keys())
        if conflicting_vars:
            for var_name in conflicting_vars:
                if vars1[var_name] != vars2[var_name]:
                    result["conflicts"].append(f"Variable '{var_name}' có ID khác nhau")
        
        if result["conflicts"]:
            result["can_merge"] = False
        
        return result
    
    def get_collection_statistics(self, collection: FigmaCollection) -> Dict[str, Any]:
        """Lấy thống kê của collection"""
        stats = {
            "total_variables": len(collection.variables),
            "total_modes": len(collection.modes),
            "variables_by_type": {},
            "mode_names": [m.name for m in collection.modes],
            "default_mode": collection.default_mode.name if collection.default_mode else None
        }
        
        # Thống kê variables theo type
        for var_type in VariableType:
            count = len(collection.get_variables_by_type(var_type))
            if count > 0:
                stats["variables_by_type"][var_type.value] = count
        
        return stats
    
    def get_file_statistics(self, file: FigmaFile) -> Dict[str, Any]:
        """Lấy thống kê của file"""
        stats = {
            "total_collections": file.collection_count,
            "total_variables": file.total_variable_count,
            "collections": [],
            "variables_by_type": {}
        }
        
        # Thống kê cho từng collection
        for collection in file.collections:
            collection_stats = self.get_collection_statistics(collection)
            collection_stats["name"] = collection.name
            collection_stats["id"] = collection.id
            stats["collections"].append(collection_stats)
        
        # Tổng thống kê variables theo type
        for var_type in VariableType:
            variables = file.get_variables_by_type(var_type)
            if variables:
                stats["variables_by_type"][var_type.value] = len(variables)
        
        return stats
    
    def find_duplicate_variable_names(self, file: FigmaFile) -> List[Dict[str, Any]]:
        """Tìm các variables có tên trùng lập"""
        all_variables = file.get_all_variables()
        name_counts = {}
        
        # Đếm số lần xuất hiện của mỗi tên
        for var in all_variables:
            name = var.name
            if name not in name_counts:
                name_counts[name] = []
            name_counts[name].append({
                "id": var.id,
                "collection_id": var.variable_collection_id,
                "type": var.resolved_type.value
            })
        
        # Lọc ra các tên có > 1 variable
        duplicates = []
        for name, variables in name_counts.items():
            if len(variables) > 1:
                duplicates.append({
                    "name": name,
                    "count": len(variables),
                    "variables": variables
                })
        
        return duplicates
    
    def suggest_variable_renaming(self, duplicates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Gợi ý đổi tên cho các variables trùng lập"""
        suggestions = []
        
        for duplicate in duplicates:
            name = duplicate["name"]
            variables = duplicate["variables"]
            
            suggestion = {
                "original_name": name,
                "suggested_names": []
            }
            
            for i, var in enumerate(variables):
                if i == 0:
                    # Giữ nguyên tên cho variable đầu tiên
                    suggested_name = name
                else:
                    # Thêm suffix cho các variables khác
                    suggested_name = f"{name}_{i + 1}"
                
                suggestion["suggested_names"].append({
                    "variable_id": var["id"],
                    "current_name": name,
                    "suggested_name": suggested_name,
                    "collection_id": var["collection_id"],
                    "type": var["type"]
                })
            
            suggestions.append(suggestion)
        
        return suggestions

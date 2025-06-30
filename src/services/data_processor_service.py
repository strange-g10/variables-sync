"""
Data Processor Service - Handles data transformation and sync logic
"""
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

from src.core.base import BaseService, OperationResult, OperationStatus
from src.domain.models.figma_models import FigmaFile, FigmaVariable, VariableType
from src.domain.models.sheet_models import Spreadsheet, Worksheet, CellRange
from src.domain.models.variable_models import Variable, VariableMapping, VariableAssignment
from src.domain.services.variable_domain_service import VariableDomainService
from src.services.figma_service import FigmaService
from src.services.sheet_service import SheetService
from src.utils.logger import get_logger


class SyncDirection(Enum):
    """Hướng sync dữ liệu"""
    FIGMA_TO_SHEETS = "figma_to_sheets"
    SHEETS_TO_FIGMA = "sheets_to_figma" 
    BIDIRECTIONAL = "bidirectional"


class ConflictResolutionStrategy(Enum):
    """Chiến lược giải quyết conflict"""
    FIGMA_WINS = "figma_wins"
    SHEETS_WINS = "sheets_wins"
    MANUAL = "manual"
    NEWEST_WINS = "newest_wins"


@dataclass
class SyncConfig:
    """Cấu hình cho sync operation"""
    direction: SyncDirection
    conflict_resolution: ConflictResolutionStrategy
    include_collections: Optional[List[str]] = None  # Nếu None -> sync all
    exclude_variable_types: Optional[List[VariableType]] = None
    mode_mappings: Optional[Dict[str, str]] = None  # Figma mode -> Sheet column
    dry_run: bool = False


@dataclass
class SyncResult:
    """Kết quả của sync operation"""
    total_variables: int
    synced_variables: int
    skipped_variables: int
    conflicts_detected: int
    conflicts_resolved: int
    errors: List[str]
    warnings: List[str]
    sync_summary: Dict[str, Any]


@dataclass
class ConflictInfo:
    """Thông tin về conflict được phát hiện"""
    variable_id: str
    variable_name: str
    figma_value: Any
    sheet_value: Any
    conflict_type: str
    suggested_resolution: str


class DataProcessorService(BaseService):
    """Service xử lý transformations và sync giữa Figma và Sheets"""
    
    def __init__(self, figma_service: FigmaService, sheet_service: SheetService, logger=None):
        super().__init__(logger)
        self.figma_service = figma_service
        self.sheet_service = sheet_service
        self.variable_domain_service = VariableDomainService()
        self.logger = logger or get_logger(self.__class__.__name__)
    
    def sync_figma_to_sheets(
        self, 
        figma_file_id: str, 
        spreadsheet_id: str,
        config: SyncConfig
    ) -> OperationResult[SyncResult]:
        """Sync variables từ Figma sang Google Sheets"""
        try:
            self.log_info(f"Starting Figma → Sheets sync (file: {figma_file_id}, sheet: {spreadsheet_id})")
            
            # Lấy data từ Figma
            figma_result = self.figma_service.get_file_with_variables(figma_file_id)
            if not figma_result.is_success:
                return OperationResult(
                    status=figma_result.status,
                    message=f"Failed to load Figma file: {figma_result.message}",
                    errors=figma_result.errors
                )
            
            figma_file = figma_result.data
            
            # Lấy data từ Sheets
            sheet_result = self.sheet_service.get_variables_data(spreadsheet_id)
            if not sheet_result.is_success:
                self.log_warning(f"Could not load existing sheet data: {sheet_result.message}")
                existing_variables = []
            else:
                existing_variables = sheet_result.data
            
            # Transform Figma variables thành Variables format
            variables_to_sync = self._transform_figma_to_variables(figma_file, config)
            
            # Detect conflicts
            conflicts = self._detect_conflicts(variables_to_sync, existing_variables)
            
            # Resolve conflicts
            resolved_variables, conflict_summary = self._resolve_conflicts(
                variables_to_sync, existing_variables, conflicts, config.conflict_resolution
            )
            
            # Perform sync (nếu không phải dry run)
            sync_summary = {}
            if not config.dry_run:
                sync_result = self.sheet_service.update_variables_data(
                    spreadsheet_id, resolved_variables
                )
                if not sync_result.is_success:
                    return OperationResult(
                        status=sync_result.status,
                        message=f"Failed to update sheet: {sync_result.message}",
                        errors=sync_result.errors
                    )
                sync_summary = sync_result.metadata or {}
            
            # Tạo result summary
            result = SyncResult(
                total_variables=len(variables_to_sync),
                synced_variables=len(resolved_variables),
                skipped_variables=len(variables_to_sync) - len(resolved_variables),
                conflicts_detected=len(conflicts),
                conflicts_resolved=len([c for c in conflicts if c.suggested_resolution != "manual"]),
                errors=[],
                warnings=[],
                sync_summary=sync_summary
            )
            
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=result,
                message=f"Successfully synced {result.synced_variables} variables from Figma to Sheets",
                metadata={
                    "sync_direction": config.direction.value,
                    "dry_run": config.dry_run,
                    "conflicts": [self._conflict_to_dict(c) for c in conflicts]
                }
            )
            
        except Exception as e:
            error_msg = f"Error in Figma → Sheets sync: {e}"
            self.log_error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def sync_sheets_to_figma(
        self, 
        spreadsheet_id: str,
        figma_file_id: str, 
        config: SyncConfig
    ) -> OperationResult[SyncResult]:
        """Sync variables từ Google Sheets sang Figma"""
        try:
            self.log_info(f"Starting Sheets → Figma sync (sheet: {spreadsheet_id}, file: {figma_file_id})")
            
            # Figma API hiện tại không support write operations
            # Đây là placeholder cho tương lai
            return OperationResult(
                status=OperationStatus.FAILED,
                message="Sheets → Figma sync not yet supported by Figma API",
                errors=["NotImplementedError"]
            )
            
        except Exception as e:
            error_msg = f"Error in Sheets → Figma sync: {e}"
            self.log_error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def perform_bidirectional_sync(
        self,
        figma_file_id: str,
        spreadsheet_id: str,
        config: SyncConfig
    ) -> OperationResult[Dict[str, SyncResult]]:
        """Thực hiện bidirectional sync"""
        try:
            self.log_info(f"Starting bidirectional sync (Figma: {figma_file_id}, Sheets: {spreadsheet_id})")
            
            # Hiện tại chỉ support Figma → Sheets do Figma API limitations
            figma_to_sheets_result = self.sync_figma_to_sheets(figma_file_id, spreadsheet_id, config)
            
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data={
                    "figma_to_sheets": figma_to_sheets_result.data if figma_to_sheets_result.is_success else None,
                    "sheets_to_figma": None  # Not implemented
                },
                message="Bidirectional sync completed (Figma → Sheets only)",
                metadata={
                    "figma_to_sheets_success": figma_to_sheets_result.is_success,
                    "sheets_to_figma_success": False
                }
            )
            
        except Exception as e:
            error_msg = f"Error in bidirectional sync: {e}"
            self.log_error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def analyze_sync_feasibility(
        self,
        figma_file_id: str,
        spreadsheet_id: str
    ) -> OperationResult[Dict[str, Any]]:
        """Phân tích khả năng sync giữa Figma file và Sheet"""
        try:
            # Lấy thông tin từ cả hai sources
            figma_result = self.figma_service.get_file_statistics(figma_file_id)
            sheet_result = self.sheet_service.get_spreadsheet_statistics(spreadsheet_id)
            
            analysis = {
                "figma_stats": figma_result.data if figma_result.is_success else None,
                "sheet_stats": sheet_result.data if sheet_result.is_success else None,
                "compatibility": self._analyze_compatibility(figma_result.data, sheet_result.data),
                "recommendations": self._generate_sync_recommendations(figma_result.data, sheet_result.data)
            }
            
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=analysis,
                message="Sync feasibility analysis completed"
            )
            
        except Exception as e:
            error_msg = f"Error analyzing sync feasibility: {e}"
            self.log_error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def _transform_figma_to_variables(self, figma_file: FigmaFile, config: SyncConfig) -> List[Variable]:
        """Transform Figma variables thành Variable objects"""
        variables = []
        
        for collection in figma_file.collections:
            # Skip collections nếu có filter
            if config.include_collections and collection.id not in config.include_collections:
                continue
                
            for figma_var in collection.variables:
                # Skip variable types nếu có exclude
                if config.exclude_variable_types and figma_var.resolved_type in config.exclude_variable_types:
                    continue
                
                # Transform thành Variable object
                # Sử dụng default mode value hoặc first available mode
                default_mode_id = collection.default_mode_id
                if default_mode_id not in figma_var.values_by_mode and figma_var.values_by_mode:
                    default_mode_id = list(figma_var.values_by_mode.keys())[0]
                
                if default_mode_id in figma_var.values_by_mode:
                    value = figma_var.values_by_mode[default_mode_id].as_string()
                    
                    variable = Variable(
                        name=figma_var.name,
                        type=figma_var.resolved_type.value,
                        value=value,
                        metadata={
                            "figma_id": figma_var.id,
                            "figma_key": figma_var.key,
                            "collection_id": collection.id,
                            "collection_name": collection.name,
                            "description": figma_var.description,
                            "mode_id": default_mode_id
                        }
                    )
                    variables.append(variable)
        
        return variables
    
    def _detect_conflicts(self, new_variables: List[Variable], existing_variables: List[Variable]) -> List[ConflictInfo]:
        """Phát hiện conflicts giữa new và existing variables"""
        conflicts = []
        existing_by_name = {var.name: var for var in existing_variables}
        
        for new_var in new_variables:
            if new_var.name in existing_by_name:
                existing_var = existing_by_name[new_var.name]
                
                # Check value conflict
                if new_var.value != existing_var.value:
                    conflict = ConflictInfo(
                        variable_id=new_var.metadata.get("figma_id", ""),
                        variable_name=new_var.name,
                        figma_value=new_var.value,
                        sheet_value=existing_var.value,
                        conflict_type="value_mismatch",
                        suggested_resolution="use_figma_value"  # Default strategy
                    )
                    conflicts.append(conflict)
                
                # Check type conflict
                if new_var.type != existing_var.type:
                    conflict = ConflictInfo(
                        variable_id=new_var.metadata.get("figma_id", ""),
                        variable_name=new_var.name,
                        figma_value=new_var.type,
                        sheet_value=existing_var.type,
                        conflict_type="type_mismatch",
                        suggested_resolution="manual"  # Type conflicts cần manual review
                    )
                    conflicts.append(conflict)
        
        return conflicts
    
    def _resolve_conflicts(
        self, 
        new_variables: List[Variable], 
        existing_variables: List[Variable],
        conflicts: List[ConflictInfo],
        strategy: ConflictResolutionStrategy
    ) -> Tuple[List[Variable], Dict[str, Any]]:
        """Giải quyết conflicts theo strategy"""
        
        resolved_variables = []
        existing_by_name = {var.name: var for var in existing_variables}
        conflict_by_name = {c.variable_name: c for c in conflicts}
        
        for new_var in new_variables:
            if new_var.name in conflict_by_name:
                conflict = conflict_by_name[new_var.name]
                existing_var = existing_by_name[new_var.name]
                
                if strategy == ConflictResolutionStrategy.FIGMA_WINS:
                    resolved_variables.append(new_var)
                elif strategy == ConflictResolutionStrategy.SHEETS_WINS:
                    resolved_variables.append(existing_var)
                elif strategy == ConflictResolutionStrategy.MANUAL:
                    # Trong trường hợp manual, skip variable này
                    continue
                else:  # NEWEST_WINS - default to Figma for now
                    resolved_variables.append(new_var)
            else:
                # Không có conflict, add new variable
                resolved_variables.append(new_var)
        
        # Add existing variables không có trong new_variables
        new_names = {var.name for var in new_variables}
        for existing_var in existing_variables:
            if existing_var.name not in new_names:
                resolved_variables.append(existing_var)
        
        summary = {
            "total_conflicts": len(conflicts),
            "resolution_strategy": strategy.value,
            "resolved_count": len([c for c in conflicts if c.suggested_resolution != "manual"])
        }
        
        return resolved_variables, summary
    
    def _analyze_compatibility(self, figma_stats: Dict[str, Any], sheet_stats: Dict[str, Any]) -> Dict[str, Any]:
        """Phân tích compatibility giữa Figma và Sheet data"""
        if not figma_stats or not sheet_stats:
            return {"compatible": False, "reason": "Missing statistics"}
        
        compatibility = {
            "compatible": True,
            "issues": [],
            "score": 100
        }
        
        # Check variable count mismatch
        figma_count = figma_stats.get("total_variables", 0)
        sheet_count = sheet_stats.get("total_variables", 0)
        
        if abs(figma_count - sheet_count) > 10:  # Threshold
            compatibility["issues"].append(f"Large variable count difference: Figma={figma_count}, Sheet={sheet_count}")
            compatibility["score"] -= 20
        
        # Check type distribution
        figma_types = figma_stats.get("type_distribution", {})
        sheet_types = sheet_stats.get("type_distribution", {})
        
        for var_type, figma_count in figma_types.items():
            sheet_count = sheet_types.get(var_type, 0)
            if abs(figma_count - sheet_count) > 5:
                compatibility["issues"].append(f"Type count mismatch for {var_type}: Figma={figma_count}, Sheet={sheet_count}")
                compatibility["score"] -= 10
        
        compatibility["compatible"] = compatibility["score"] >= 70
        return compatibility
    
    def _generate_sync_recommendations(self, figma_stats: Dict[str, Any], sheet_stats: Dict[str, Any]) -> List[str]:
        """Tạo recommendations cho sync operation"""
        recommendations = []
        
        if not figma_stats:
            recommendations.append("Load Figma file data first")
            return recommendations
        
        if not sheet_stats:
            recommendations.append("Create variables spreadsheet structure first")
            return recommendations
        
        figma_count = figma_stats.get("total_variables", 0)
        sheet_count = sheet_stats.get("total_variables", 0)
        
        if figma_count > sheet_count * 2:
            recommendations.append("Consider filtering Figma collections to reduce sync scope")
        
        if sheet_count > figma_count:
            recommendations.append("Review existing sheet data for outdated variables")
        
        # Type-specific recommendations
        figma_types = figma_stats.get("type_distribution", {})
        if figma_types.get("COLOR", 0) > 50:
            recommendations.append("Use color-specific formatting for better readability")
        
        if figma_types.get("STRING", 0) > 100:
            recommendations.append("Consider grouping string variables by category")
        
        return recommendations
    
    def _conflict_to_dict(self, conflict: ConflictInfo) -> Dict[str, Any]:
        """Convert ConflictInfo thành dict"""
        return {
            "variable_id": conflict.variable_id,
            "variable_name": conflict.variable_name,
            "figma_value": conflict.figma_value,
            "sheet_value": conflict.sheet_value,
            "conflict_type": conflict.conflict_type,
            "suggested_resolution": conflict.suggested_resolution
        }

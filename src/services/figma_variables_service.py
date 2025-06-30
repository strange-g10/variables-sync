"""
Figma Variables Service - Chuyên biệt cho việc lấy và xử lý Variables từ Figma
"""
import json
import time
from typing import Dict, List, Optional, Any, Tuple, Set
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum

from src.infrastructure.figma_client import FigmaClient
from src.core.base import OperationResult, OperationStatus
from src.core.exceptions import APIClientError
from src.utils.logger import get_logger


class VariableType(Enum):
    """Loại Variable trong Figma"""
    COLOR = "COLOR"
    FLOAT = "FLOAT" 
    STRING = "STRING"
    BOOLEAN = "BOOLEAN"


class VariableScope(Enum):
    """Scope của Variable"""
    ALL_SCOPES = "ALL_SCOPES"
    TEXT_CONTENT = "TEXT_CONTENT"
    FONT_FAMILY = "FONT_FAMILY"
    FONT_SIZE = "FONT_SIZE"
    FONT_WEIGHT = "FONT_WEIGHT"
    LINE_HEIGHT = "LINE_HEIGHT"
    LETTER_SPACING = "LETTER_SPACING"
    FILL = "FILL"
    STROKE = "STROKE"
    BORDER_RADIUS = "BORDER_RADIUS"
    OPACITY = "OPACITY"
    WIDTH_HEIGHT = "WIDTH_HEIGHT"
    GAP = "GAP"


@dataclass
class FigmaVariable:
    """Model cho Figma Variable"""
    id: str
    name: str
    description: str
    variable_type: VariableType
    variable_collection_id: str
    value_by_mode: Dict[str, Any]
    scopes: List[VariableScope]
    hidden_from_publishing: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        data = asdict(self)
        # Convert enum values to strings
        data['variable_type'] = self.variable_type.value
        data['scopes'] = [scope.value for scope in self.scopes]
        # Handle datetime serialization
        if self.created_at:
            data['created_at'] = self.created_at.isoformat()
        if self.updated_at:
            data['updated_at'] = self.updated_at.isoformat()
        return data


@dataclass
class FigmaVariableCollection:
    """Model cho Figma Variable Collection"""
    id: str
    name: str
    description: str
    modes: List[Dict[str, str]]
    default_mode_id: str
    remote: bool = False
    hidden_from_publishing: bool = False
    variables: List[str] = None  # Variable IDs
    
    def __post_init__(self):
        if self.variables is None:
            self.variables = []
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return asdict(self)


@dataclass
class VariablesSyncStats:
    """Thống kê quá trình sync Variables"""
    total_collections: int = 0
    total_variables: int = 0
    synced_variables: int = 0
    failed_variables: int = 0
    cached_requests: int = 0
    api_requests: int = 0
    sync_duration: float = 0.0
    last_sync: Optional[datetime] = None


class FigmaVariablesService:
    """Service chuyên biệt cho việc làm việc với Figma Variables"""
    
    def __init__(self, figma_client: FigmaClient, cache_timeout: int = 300):
        self.client = figma_client
        self.logger = get_logger(self.__class__.__name__)
        self.cache_timeout = cache_timeout  # 5 minutes default
        
        # Cache for variables and collections
        self._variables_cache: Dict[str, Tuple[datetime, List[FigmaVariable]]] = {}
        self._collections_cache: Dict[str, Tuple[datetime, List[FigmaVariableCollection]]] = {}
        self._file_cache: Dict[str, Tuple[datetime, Dict[str, Any]]] = {}
        
        # Performance stats
        self._stats = VariablesSyncStats()
    
    def get_file_variables(self, file_id: str, use_cache: bool = True, include_collections: bool = True) -> OperationResult[Dict[str, Any]]:
        """
        Lấy tất cả Variables từ file Figma
        
        Args:
            file_id: ID của file Figma
            use_cache: Có sử dụng cache không
            include_collections: Có lấy collections không
            
        Returns:
            OperationResult chứa Variables và Collections data
        """
        start_time = time.time()
        
        try:
            # Check cache first
            if use_cache and self._is_cache_valid(file_id):
                self.logger.info(f"Using cached data for file {file_id}")
                cached_data = self._get_cached_file_data(file_id)
                self._stats.cached_requests += 1
                return OperationResult(
                    status=OperationStatus.SUCCESS,
                    data=cached_data,
                    message="Data retrieved from cache"
                )
            
            # Fetch variables from API
            self.logger.info(f"Fetching variables for file {file_id} from Figma API")
            variables_result = self.client.get_file_variables(file_id)
            
            if not variables_result.is_success:
                return OperationResult(
                    status=OperationStatus.FAILED,
                    message=f"Failed to fetch variables: {variables_result.message}",
                    errors=variables_result.errors
                )
            
            variables_data = variables_result.data
            self._stats.api_requests += 1
            
            # Fetch collections if requested
            collections_data = None
            if include_collections:
                collections_result = self.client.get_variable_collections(file_id)
                if collections_result.is_success:
                    collections_data = collections_result.data
                    self._stats.api_requests += 1
                else:
                    self.logger.warning(f"Failed to fetch collections: {collections_result.message}")
            
            # Process and structure the data
            processed_data = self._process_variables_data(variables_data, collections_data)
            
            # Update cache
            if use_cache:
                self._update_file_cache(file_id, processed_data)
            
            # Update stats
            self._stats.sync_duration = time.time() - start_time
            self._stats.last_sync = datetime.now()
            
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=processed_data,
                message=f"Successfully fetched {len(processed_data.get('variables', []))} variables"
            )
            
        except Exception as e:
            error_msg = f"Error fetching variables for file {file_id}: {str(e)}"
            self.logger.error(error_msg, exc_info=True)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def get_variables_by_collection(self, file_id: str, collection_id: str, use_cache: bool = True) -> OperationResult[List[FigmaVariable]]:
        """
        Lấy Variables theo Collection ID
        
        Args:
            file_id: ID của file Figma
            collection_id: ID của collection
            use_cache: Có sử dụng cache không
            
        Returns:
            OperationResult chứa list Variables
        """
        try:
            # Get all variables first
            all_variables_result = self.get_file_variables(file_id, use_cache, include_collections=False)
            
            if not all_variables_result.is_success:
                return OperationResult(
                    status=OperationStatus.FAILED,
                    message=f"Failed to fetch variables: {all_variables_result.message}",
                    errors=all_variables_result.errors
                )
            
            # Filter by collection
            variables_data = all_variables_result.data.get('variables', [])
            collection_variables = [
                var for var in variables_data 
                if isinstance(var, FigmaVariable) and var.variable_collection_id == collection_id
            ]
            
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=collection_variables,
                message=f"Found {len(collection_variables)} variables in collection {collection_id}"
            )
            
        except Exception as e:
            error_msg = f"Error fetching variables for collection {collection_id}: {str(e)}"
            self.logger.error(error_msg, exc_info=True)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def get_variables_by_type(self, file_id: str, variable_type: VariableType, use_cache: bool = True) -> OperationResult[List[FigmaVariable]]:
        """
        Lấy Variables theo loại (COLOR, FLOAT, STRING, BOOLEAN)
        
        Args:
            file_id: ID của file Figma
            variable_type: Loại variable cần lấy
            use_cache: Có sử dụng cache không
            
        Returns:
            OperationResult chứa list Variables
        """
        try:
            # Get all variables first
            all_variables_result = self.get_file_variables(file_id, use_cache, include_collections=False)
            
            if not all_variables_result.is_success:
                return OperationResult(
                    status=OperationStatus.FAILED,
                    message=f"Failed to fetch variables: {all_variables_result.message}",
                    errors=all_variables_result.errors
                )
            
            # Filter by type
            variables_data = all_variables_result.data.get('variables', [])
            typed_variables = [
                var for var in variables_data 
                if isinstance(var, FigmaVariable) and var.variable_type == variable_type
            ]
            
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=typed_variables,
                message=f"Found {len(typed_variables)} {variable_type.value} variables"
            )
            
        except Exception as e:
            error_msg = f"Error fetching {variable_type.value} variables: {str(e)}"
            self.logger.error(error_msg, exc_info=True)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def search_variables(self, file_id: str, search_term: str, search_in: List[str] = None, use_cache: bool = True) -> OperationResult[List[FigmaVariable]]:
        """
        Tìm kiếm Variables theo tên hoặc description
        
        Args:
            file_id: ID của file Figma
            search_term: Từ khóa tìm kiếm
            search_in: Các field để tìm kiếm ['name', 'description']
            use_cache: Có sử dụng cache không
            
        Returns:
            OperationResult chứa list Variables tìm thấy
        """
        if search_in is None:
            search_in = ['name', 'description']
        
        try:
            # Get all variables first
            all_variables_result = self.get_file_variables(file_id, use_cache, include_collections=False)
            
            if not all_variables_result.is_success:
                return OperationResult(
                    status=OperationStatus.FAILED,
                    message=f"Failed to fetch variables: {all_variables_result.message}",
                    errors=all_variables_result.errors
                )
            
            # Search in variables
            variables_data = all_variables_result.data.get('variables', [])
            search_term_lower = search_term.lower()
            found_variables = []
            
            for var in variables_data:
                if not isinstance(var, FigmaVariable):
                    continue
                    
                # Search in name
                if 'name' in search_in and search_term_lower in var.name.lower():
                    found_variables.append(var)
                    continue
                
                # Search in description
                if 'description' in search_in and var.description and search_term_lower in var.description.lower():
                    found_variables.append(var)
                    continue
            
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=found_variables,
                message=f"Found {len(found_variables)} variables matching '{search_term}'"
            )
            
        except Exception as e:
            error_msg = f"Error searching variables: {str(e)}"
            self.logger.error(error_msg, exc_info=True)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def get_variable_collections(self, file_id: str, use_cache: bool = True) -> OperationResult[List[FigmaVariableCollection]]:
        """
        Lấy tất cả Variable Collections từ file
        
        Args:
            file_id: ID của file Figma
            use_cache: Có sử dụng cache không
            
        Returns:
            OperationResult chứa list Collections
        """
        try:
            # Check cache first
            if use_cache and self._is_collections_cache_valid(file_id):
                self.logger.info(f"Using cached collections for file {file_id}")
                _, cached_collections = self._collections_cache[file_id]
                self._stats.cached_requests += 1
                return OperationResult(
                    status=OperationStatus.SUCCESS,
                    data=cached_collections,
                    message="Collections retrieved from cache"
                )
            
            # Fetch from API
            self.logger.info(f"Fetching collections for file {file_id} from Figma API")
            collections_result = self.client.get_variable_collections(file_id)
            
            if not collections_result.is_success:
                return OperationResult(
                    status=OperationStatus.FAILED,
                    message=f"Failed to fetch collections: {collections_result.message}",
                    errors=collections_result.errors
                )
            
            # Process collections data
            collections_data = collections_result.data.get('variable_collections', {})
            processed_collections = []
            
            for collection_id, collection_info in collections_data.items():
                collection = FigmaVariableCollection(
                    id=collection_id,
                    name=collection_info.get('name', ''),
                    description=collection_info.get('description', ''),
                    modes=collection_info.get('modes', []),
                    default_mode_id=collection_info.get('defaultModeId', ''),
                    remote=collection_info.get('remote', False),
                    hidden_from_publishing=collection_info.get('hiddenFromPublishing', False),
                    variables=collection_info.get('variableIds', [])
                )
                processed_collections.append(collection)
            
            # Update cache
            if use_cache:
                self._collections_cache[file_id] = (datetime.now(), processed_collections)
            
            self._stats.api_requests += 1
            self._stats.total_collections = len(processed_collections)
            
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=processed_collections,
                message=f"Successfully fetched {len(processed_collections)} collections"
            )
            
        except Exception as e:
            error_msg = f"Error fetching collections for file {file_id}: {str(e)}"
            self.logger.error(error_msg, exc_info=True)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def export_variables_to_json(self, file_id: str, output_path: str, include_collections: bool = True, pretty_print: bool = True) -> OperationResult[str]:
        """
        Export Variables ra file JSON
        
        Args:
            file_id: ID của file Figma
            output_path: Đường dẫn file output
            include_collections: Có bao gồm collections không
            pretty_print: Có format JSON đẹp không
            
        Returns:
            OperationResult với đường dẫn file đã tạo
        """
        try:
            # Get variables data
            variables_result = self.get_file_variables(file_id, use_cache=True, include_collections=include_collections)
            
            if not variables_result.is_success:
                return OperationResult(
                    status=OperationStatus.FAILED,
                    message=f"Failed to fetch variables: {variables_result.message}",
                    errors=variables_result.errors
                )
            
            # Prepare export data
            export_data = {
                'file_id': file_id,
                'exported_at': datetime.now().isoformat(),
                'variables': [],
                'collections': [],
                'stats': asdict(self._stats)
            }
            
            # Convert variables to dict format
            variables_data = variables_result.data.get('variables', [])
            for var in variables_data:
                if isinstance(var, FigmaVariable):
                    export_data['variables'].append(var.to_dict())
            
            # Convert collections to dict format if included
            if include_collections:
                collections_data = variables_result.data.get('collections', [])
                for collection in collections_data:
                    if isinstance(collection, FigmaVariableCollection):
                        export_data['collections'].append(collection.to_dict())
            
            # Write to file
            with open(output_path, 'w', encoding='utf-8') as f:
                if pretty_print:
                    json.dump(export_data, f, indent=2, ensure_ascii=False)
                else:
                    json.dump(export_data, f, ensure_ascii=False)
            
            self.logger.info(f"Exported {len(export_data['variables'])} variables to {output_path}")
            
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=output_path,
                message=f"Successfully exported variables to {output_path}"
            )
            
        except Exception as e:
            error_msg = f"Error exporting variables to JSON: {str(e)}"
            self.logger.error(error_msg, exc_info=True)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def validate_variables_structure(self, file_id: str) -> OperationResult[Dict[str, Any]]:
        """
        Validate cấu trúc Variables và Collections
        
        Args:
            file_id: ID của file Figma
            
        Returns:
            OperationResult chứa validation report
        """
        try:
            # Get variables and collections
            data_result = self.get_file_variables(file_id, use_cache=True, include_collections=True)
            
            if not data_result.is_success:
                return OperationResult(
                    status=OperationStatus.FAILED,
                    message=f"Failed to fetch data for validation: {data_result.message}",
                    errors=data_result.errors
                )
            
            variables = data_result.data.get('variables', [])
            collections = data_result.data.get('collections', [])
            
            # Validation checks
            validation_report = {
                'file_id': file_id,
                'validated_at': datetime.now().isoformat(),
                'total_variables': len(variables),
                'total_collections': len(collections),
                'issues': [],
                'warnings': [],
                'stats': {}
            }
            
            # Check for orphaned variables (no collection)
            collection_ids = {col.id for col in collections if isinstance(col, FigmaVariableCollection)}
            orphaned_variables = []
            
            for var in variables:
                if isinstance(var, FigmaVariable):
                    if var.variable_collection_id not in collection_ids:
                        orphaned_variables.append(var.name)
            
            if orphaned_variables:
                validation_report['issues'].append({
                    'type': 'orphaned_variables',
                    'count': len(orphaned_variables),
                    'variables': orphaned_variables[:10]  # Limit to first 10
                })
            
            # Check for empty collections
            empty_collections = []
            for collection in collections:
                if isinstance(collection, FigmaVariableCollection):
                    if not collection.variables:
                        empty_collections.append(collection.name)
            
            if empty_collections:
                validation_report['warnings'].append({
                    'type': 'empty_collections',
                    'count': len(empty_collections),
                    'collections': empty_collections
                })
            
            # Variable type distribution
            type_distribution = {}
            for var in variables:
                if isinstance(var, FigmaVariable):
                    var_type = var.variable_type.value
                    type_distribution[var_type] = type_distribution.get(var_type, 0) + 1
            
            validation_report['stats']['type_distribution'] = type_distribution
            
            # Overall health score
            issues_count = len(validation_report['issues'])
            warnings_count = len(validation_report['warnings'])
            health_score = max(0, 100 - (issues_count * 10) - (warnings_count * 5))
            validation_report['health_score'] = health_score
            
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=validation_report,
                message=f"Validation completed. Health score: {health_score}/100"
            )
            
        except Exception as e:
            error_msg = f"Error validating variables structure: {str(e)}"
            self.logger.error(error_msg, exc_info=True)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def clear_cache(self, file_id: Optional[str] = None):
        """
        Xóa cache
        
        Args:
            file_id: ID file cụ thể, None để xóa tất cả cache
        """
        if file_id:
            self._variables_cache.pop(file_id, None)
            self._collections_cache.pop(file_id, None)
            self._file_cache.pop(file_id, None)
            self.logger.info(f"Cleared cache for file {file_id}")
        else:
            self._variables_cache.clear()
            self._collections_cache.clear()
            self._file_cache.clear()
            self.logger.info("Cleared all cache")
    
    def get_sync_stats(self) -> VariablesSyncStats:
        """Lấy thống kê sync"""
        return self._stats
    
    def reset_stats(self):
        """Reset thống kê"""
        self._stats = VariablesSyncStats()
    
    # Private methods for cache management
    
    def _is_cache_valid(self, file_id: str) -> bool:
        """Kiểm tra cache có còn valid không"""
        if file_id not in self._file_cache:
            return False
        
        cache_time, _ = self._file_cache[file_id]
        return datetime.now() - cache_time < timedelta(seconds=self.cache_timeout)
    
    def _is_collections_cache_valid(self, file_id: str) -> bool:
        """Kiểm tra collections cache có còn valid không"""
        if file_id not in self._collections_cache:
            return False
        
        cache_time, _ = self._collections_cache[file_id]
        return datetime.now() - cache_time < timedelta(seconds=self.cache_timeout)
    
    def _get_cached_file_data(self, file_id: str) -> Dict[str, Any]:
        """Lấy cached file data"""
        if file_id in self._file_cache:
            _, cached_data = self._file_cache[file_id]
            return cached_data
        return {}
    
    def _update_file_cache(self, file_id: str, data: Dict[str, Any]):
        """Cập nhật file cache"""
        self._file_cache[file_id] = (datetime.now(), data)
    
    def _process_variables_data(self, variables_data: Dict[str, Any], collections_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Xử lý và cấu trúc lại data từ Figma API
        
        Args:
            variables_data: Raw variables data từ API
            collections_data: Raw collections data từ API
            
        Returns:
            Processed data với FigmaVariable và FigmaVariableCollection objects
        """
        processed_data = {
            'variables': [],
            'collections': [],
            'modes': {},
            'meta': {
                'processed_at': datetime.now().isoformat(),
                'variable_count': 0,
                'collection_count': 0
            }
        }
        
        # Process variables
        variables_raw = variables_data.get('variables', {})
        for var_id, var_info in variables_raw.items():
            try:
                # Parse variable type
                var_type_str = var_info.get('resolvedType', 'STRING')
                var_type = VariableType(var_type_str) if var_type_str in [t.value for t in VariableType] else VariableType.STRING
                
                # Parse scopes
                scopes_raw = var_info.get('scopes', ['ALL_SCOPES'])
                scopes = []
                for scope_str in scopes_raw:
                    try:
                        scopes.append(VariableScope(scope_str))
                    except ValueError:
                        # Skip unknown scopes
                        pass
                
                if not scopes:
                    scopes = [VariableScope.ALL_SCOPES]
                
                variable = FigmaVariable(
                    id=var_id,
                    name=var_info.get('name', ''),
                    description=var_info.get('description', ''),
                    variable_type=var_type,
                    variable_collection_id=var_info.get('variableCollectionId', ''),
                    value_by_mode=var_info.get('valuesByMode', {}),
                    scopes=scopes,
                    hidden_from_publishing=var_info.get('hiddenFromPublishing', False)
                )
                
                processed_data['variables'].append(variable)
                
            except Exception as e:
                self.logger.warning(f"Failed to process variable {var_id}: {str(e)}")
                continue
        
        # Process collections
        if collections_data:
            collections_raw = collections_data.get('variable_collections', {})
            for coll_id, coll_info in collections_raw.items():
                try:
                    collection = FigmaVariableCollection(
                        id=coll_id,
                        name=coll_info.get('name', ''),
                        description=coll_info.get('description', ''),
                        modes=coll_info.get('modes', []),
                        default_mode_id=coll_info.get('defaultModeId', ''),
                        remote=coll_info.get('remote', False),
                        hidden_from_publishing=coll_info.get('hiddenFromPublishing', False),
                        variables=coll_info.get('variableIds', [])
                    )
                    
                    processed_data['collections'].append(collection)
                    
                except Exception as e:
                    self.logger.warning(f"Failed to process collection {coll_id}: {str(e)}")
                    continue
        
        # Update meta info
        processed_data['meta']['variable_count'] = len(processed_data['variables'])
        processed_data['meta']['collection_count'] = len(processed_data['collections'])
        
        # Update stats
        self._stats.total_variables = processed_data['meta']['variable_count']
        self._stats.total_collections = processed_data['meta']['collection_count']
        self._stats.synced_variables = processed_data['meta']['variable_count']
        
        return processed_data

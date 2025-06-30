"""
Figma Repository Implementation
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from pathlib import Path

from src.domain.repositories.figma_repository import FigmaRepository
from src.domain.models.figma_models import (
    FigmaFile, FigmaCollection, FigmaVariable, FigmaMode, 
    VariableType, VariableValue
)
from src.core.base import OperationResult, OperationStatus
from src.infrastructure.figma_client import FigmaClient
from src.infrastructure.file_handler import FileHandler
from src.utils.logger import get_logger


class FigmaRepositoryImpl(FigmaRepository):
    """Implementation của FigmaRepository"""
    
    def __init__(self, figma_client: FigmaClient, file_handler: FileHandler = None):
        self.figma_client = figma_client
        self.file_handler = file_handler or FileHandler()
        self.logger = get_logger(self.__class__.__name__)
        self._collection_cache = {}  # Cache for loaded collections
        self._variable_cache = {}    # Cache for loaded variables
    
    def get_file(self, file_id: str) -> OperationResult[FigmaFile]:
        """Lấy thông tin file Figma"""
        try:
            # Gọi API lấy file info
            file_result = self.figma_client.get_file(file_id)
            if not file_result.is_success:
                return OperationResult(
                    status=file_result.status,
                    message=file_result.message,
                    errors=file_result.errors
                )
            
            file_data = file_result.data
            
            # Lấy collections và variables
            collections_result = self.get_collections(file_id)
            collections = collections_result.data if collections_result.is_success else []
            
            # Cache collections và variables
            self._cache_collections(collections)
            
            # Tạo FigmaFile object
            figma_file = FigmaFile(
                id=file_id,
                name=file_data.get('name', 'Unknown'),
                last_modified=datetime.now(),  # Figma API không trả về last_modified
                collections=collections,
                metadata={
                    'version': file_data.get('version', ''),
                    'thumbnail_url': file_data.get('thumbnailUrl', ''),
                    'role': file_data.get('role', '')
                }
            )
            
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=figma_file,
                message=f"Successfully retrieved Figma file {file_id}"
            )
            
        except Exception as e:
            error_msg = f"Error getting Figma file: {e}"
            self.logger.error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def get_collections(self, file_id: str) -> OperationResult[List[FigmaCollection]]:
        """Lấy danh sách collections từ file"""
        try:
            # Lấy variable collections
            collections_result = self.figma_client.get_variable_collections(file_id)
            if not collections_result.is_success:
                return OperationResult(
                    status=collections_result.status,
                    message=collections_result.message,
                    errors=collections_result.errors
                )
            
            collections_data = collections_result.data.get('meta', {}).get('variableCollections', {})
            
            # Lấy variables
            variables_result = self.figma_client.get_file_variables(file_id)
            variables_data = {}
            if variables_result.is_success:
                variables_data = variables_result.data.get('meta', {}).get('variables', {})
            
            collections = []
            for collection_id, collection_data in collections_data.items():
                collection = self._parse_collection(collection_id, collection_data, variables_data)
                collections.append(collection)
            
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=collections,
                message=f"Successfully retrieved {len(collections)} collections"
            )
            
        except Exception as e:
            error_msg = f"Error getting collections: {e}"
            self.logger.error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def get_collection(self, collection_id: str) -> OperationResult[FigmaCollection]:
        """Lấy thông tin chi tiết của một collection"""
        try:
            # Tìm collection từ cache hoặc từ tất cả files đã load
            cached_collection = self._find_collection_in_cache(collection_id)
            if cached_collection:
                return OperationResult(
                    status=OperationStatus.SUCCESS,
                    data=cached_collection,
                    message=f"Found collection {collection_id} in cache"
                )
            
            return OperationResult(
                status=OperationStatus.FAILED,
                message=f"Collection {collection_id} not found. Load file first using get_file().",
                errors=["Collection not in cache"]
            )
            
        except Exception as e:
            error_msg = f"Error getting collection: {e}"
            self.logger.error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def get_variables(self, collection_id: str) -> OperationResult[List[FigmaVariable]]:
        """Lấy danh sách variables từ collection"""
        try:
            # Tìm collection trong cache
            collection = self._find_collection_in_cache(collection_id)
            if collection:
                return OperationResult(
                    status=OperationStatus.SUCCESS,
                    data=collection.variables,
                    message=f"Found {len(collection.variables)} variables in collection {collection_id}"
                )
            
            return OperationResult(
                status=OperationStatus.FAILED,
                message=f"Collection {collection_id} not found. Load file first using get_file().",
                errors=["Collection not in cache"]
            )
            
        except Exception as e:
            error_msg = f"Error getting variables: {e}"
            self.logger.error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def get_variable(self, variable_id: str) -> OperationResult[FigmaVariable]:
        """Lấy thông tin chi tiết của một variable"""
        try:
            # Tìm variable trong cache
            variable = self._find_variable_in_cache(variable_id)
            if variable:
                return OperationResult(
                    status=OperationStatus.SUCCESS,
                    data=variable,
                    message=f"Found variable {variable_id} in cache"
                )
            
            return OperationResult(
                status=OperationStatus.FAILED,
                message=f"Variable {variable_id} not found. Load file first using get_file().",
                errors=["Variable not in cache"]
            )
            
        except Exception as e:
            error_msg = f"Error getting variable: {e}"
            self.logger.error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def create_variable(self, collection_id: str, variable: FigmaVariable) -> OperationResult[FigmaVariable]:
        """Tạo variable mới"""
        # Implementation sẽ được thêm sau khi Figma API hỗ trợ
        return OperationResult(
            status=OperationStatus.FAILED,
            message="Create variable not implemented yet",
            errors=["NotImplementedError"]
        )
    
    def update_variable(self, variable: FigmaVariable) -> OperationResult[FigmaVariable]:
        """Cập nhật variable"""
        return OperationResult(
            status=OperationStatus.FAILED,
            message="Update variable not implemented yet",
            errors=["NotImplementedError"]
        )
    
    def delete_variable(self, variable_id: str) -> OperationResult[bool]:
        """Xóa variable"""
        return OperationResult(
            status=OperationStatus.FAILED,
            message="Delete variable not implemented yet",
            errors=["NotImplementedError"]
        )
    
    def create_collection(self, file_id: str, collection: FigmaCollection) -> OperationResult[FigmaCollection]:
        """Tạo collection mới"""
        return OperationResult(
            status=OperationStatus.FAILED,
            message="Create collection not implemented yet",
            errors=["NotImplementedError"]
        )
    
    def update_collection(self, collection: FigmaCollection) -> OperationResult[FigmaCollection]:
        """Cập nhật collection"""
        return OperationResult(
            status=OperationStatus.FAILED,
            message="Update collection not implemented yet",
            errors=["NotImplementedError"]
        )
    
    def delete_collection(self, collection_id: str) -> OperationResult[bool]:
        """Xóa collection"""
        return OperationResult(
            status=OperationStatus.FAILED,
            message="Delete collection not implemented yet",
            errors=["NotImplementedError"]
        )
    
    def save_file_data(self, file_data: FigmaFile) -> OperationResult[bool]:
        """Lưu dữ liệu file vào local storage"""
        try:
            # Convert FigmaFile to dict
            data = self._figma_file_to_dict(file_data)
            
            # Save to JSON file
            file_path = Path(f"figma_data/{file_data.id}.json")
            result = self.file_handler.save_json(file_path, data)
            
            if result.is_success:
                self.logger.info(f"Saved Figma file data to {file_path}")
            
            return result
            
        except Exception as e:
            error_msg = f"Error saving file data: {e}"
            self.logger.error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                data=False,
                message=error_msg,
                errors=[str(e)]
            )
    
    def load_file_data(self, file_id: str) -> OperationResult[FigmaFile]:
        """Tải dữ liệu file từ local storage"""
        try:
            file_path = Path(f"figma_data/{file_id}.json")
            result = self.file_handler.load_json(file_path)
            
            if not result.is_success:
                return OperationResult(
                    status=result.status,
                    message=result.message,
                    errors=result.errors
                )
            
            # Convert dict to FigmaFile
            figma_file = self._dict_to_figma_file(result.data)
            
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=figma_file,
                message=f"Loaded Figma file data from {file_path}"
            )
            
        except Exception as e:
            error_msg = f"Error loading file data: {e}"
            self.logger.error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def _parse_collection(self, collection_id: str, collection_data: Dict[str, Any], variables_data: Dict[str, Any]) -> FigmaCollection:
        """Parse collection data từ Figma API"""
        # Parse modes
        modes = []
        for mode_data in collection_data.get('modes', []):
            mode = FigmaMode(
                id=mode_data.get('modeId', ''),
                name=mode_data.get('name', '')
            )
            modes.append(mode)
        
        # Parse variables trong collection
        variables = []
        for variable_id, variable_data in variables_data.items():
            if variable_data.get('variableCollectionId') == collection_id:
                variable = self._parse_variable(variable_id, variable_data)
                variables.append(variable)
        
        return FigmaCollection(
            id=collection_id,
            name=collection_data.get('name', ''),
            modes=modes,
            default_mode_id=collection_data.get('defaultModeId', ''),
            variables=variables
        )
    
    def _parse_variable(self, variable_id: str, variable_data: Dict[str, Any]) -> FigmaVariable:
        """Parse variable data từ Figma API"""
        # Parse variable type
        resolved_type = VariableType(variable_data.get('resolvedType', 'STRING'))
        
        # Parse values by mode
        values_by_mode = {}
        for mode_id, value_data in variable_data.get('valuesByMode', {}).items():
            try:
                variable_value = VariableValue(
                    type=resolved_type,
                    value=value_data
                )
                values_by_mode[mode_id] = variable_value
            except ValueError as e:
                self.logger.warning(f"Invalid value for variable {variable_id} in mode {mode_id}: {e}")
        
        return FigmaVariable(
            id=variable_id,
            name=variable_data.get('name', ''),
            key=variable_data.get('key', ''),
            variable_collection_id=variable_data.get('variableCollectionId', ''),
            resolved_type=resolved_type,
            values_by_mode=values_by_mode,
            description=variable_data.get('description', ''),
            hidden_from_publishing=variable_data.get('hiddenFromPublishing', False),
            scopes=variable_data.get('scopes', []),
            code_syntax=variable_data.get('codeSyntax', {})
        )
    
    def _figma_file_to_dict(self, figma_file: FigmaFile) -> Dict[str, Any]:
        """Convert FigmaFile thành dict để serialize"""
        return {
            'id': figma_file.id,
            'name': figma_file.name,
            'last_modified': figma_file.last_modified.isoformat() if figma_file.last_modified else None,
            'collections': [
                {
                    'id': col.id,
                    'name': col.name,
                    'default_mode_id': col.default_mode_id,
                    'modes': [
                        {'id': mode.id, 'name': mode.name}
                        for mode in col.modes
                    ],
                    'variables': [
                        {
                            'id': var.id,
                            'name': var.name,
                            'key': var.key,
                            'variable_collection_id': var.variable_collection_id,
                            'resolved_type': var.resolved_type.value,
                            'values_by_mode': {
                                mode_id: {
                                    'type': val.type.value,
                                    'value': val.value
                                }
                                for mode_id, val in var.values_by_mode.items()
                            },
                            'description': var.description,
                            'hidden_from_publishing': var.hidden_from_publishing,
                            'scopes': var.scopes,
                            'code_syntax': var.code_syntax
                        }
                        for var in col.variables
                    ]
                }
                for col in figma_file.collections
            ],
            'metadata': figma_file.metadata
        }
    
    def _dict_to_figma_file(self, data: Dict[str, Any]) -> FigmaFile:
        """Convert dict thành FigmaFile"""
        collections = []
        
        for col_data in data.get('collections', []):
            # Parse modes
            modes = [
                FigmaMode(id=mode['id'], name=mode['name'])
                for mode in col_data.get('modes', [])
            ]
            
            # Parse variables
            variables = []
            for var_data in col_data.get('variables', []):
                # Parse values by mode
                values_by_mode = {}
                for mode_id, val_data in var_data.get('values_by_mode', {}).items():
                    values_by_mode[mode_id] = VariableValue(
                        type=VariableType(val_data['type']),
                        value=val_data['value']
                    )
                
                variable = FigmaVariable(
                    id=var_data['id'],
                    name=var_data['name'],
                    key=var_data['key'],
                    variable_collection_id=var_data['variable_collection_id'],
                    resolved_type=VariableType(var_data['resolved_type']),
                    values_by_mode=values_by_mode,
                    description=var_data.get('description', ''),
                    hidden_from_publishing=var_data.get('hidden_from_publishing', False),
                    scopes=var_data.get('scopes', []),
                    code_syntax=var_data.get('code_syntax', {})
                )
                variables.append(variable)
            
            collection = FigmaCollection(
                id=col_data['id'],
                name=col_data['name'],
                modes=modes,
                default_mode_id=col_data['default_mode_id'],
                variables=variables
            )
            collections.append(collection)
        
        return FigmaFile(
            id=data['id'],
            name=data['name'],
            last_modified=datetime.fromisoformat(data['last_modified']) if data.get('last_modified') else None,
            collections=collections,
            metadata=data.get('metadata', {})
        )
    
    def _find_collection_in_cache(self, collection_id: str) -> Optional[FigmaCollection]:
        """Tìm collection trong cache"""
        return self._collection_cache.get(collection_id)
    
    def _cache_collections(self, collections: List[FigmaCollection]) -> None:
        """Cache collections để sử dụng sau"""
        for collection in collections:
            self._collection_cache[collection.id] = collection
            # Cache variables trong collection
            for variable in collection.variables:
                self._variable_cache[variable.id] = variable
    
    def _find_variable_in_cache(self, variable_id: str) -> Optional[FigmaVariable]:
        """Tìm variable trong cache"""
        return self._variable_cache.get(variable_id)

"""
Figma Service - Application service cho Figma operations
"""
from typing import List, Optional, Dict, Any
from pathlib import Path
import json
import requests
import os

from src.core.base import BaseService, OperationResult, OperationStatus
from src.domain.repositories.figma_repository import FigmaRepository
from src.domain.models.figma_models import FigmaFile, FigmaCollection, FigmaVariable, VariableType
from src.domain.services.figma_domain_service import FigmaDomainService
from src.utils.logger import get_logger


class FigmaService(BaseService):
    """Application service cho Figma operations"""
    
    def __init__(self, figma_repository: FigmaRepository, logger=None):
        super().__init__(logger)
        self.figma_repository = figma_repository
        self.figma_domain_service = FigmaDomainService()
        self.logger = logger or get_logger(self.__class__.__name__)
    
    def get_file_with_variables(self, file_id: str, use_cache: bool = True) -> OperationResult[FigmaFile]:
        """Lấy file Figma với đầy đủ thông tin variables"""
        try:
            self.log_info(f"Getting Figma file {file_id} (use_cache: {use_cache})")
            
            # Kiểm tra cache trước
            if use_cache:
                cache_result = self.figma_repository.load_file_data(file_id)
                if cache_result.is_success:
                    self.log_info(f"Loaded file {file_id} from cache")
                    return cache_result
            
            # Lấy từ API
            result = self.figma_repository.get_file(file_id)
            if not result.is_success:
                return result
            
            figma_file = result.data
            
            # Validate file
            try:
                self.figma_domain_service.validate_figma_file(figma_file)
            except Exception as e:
                self.log_warning(f"File validation failed: {e}")
            
            # Lưu vào cache
            cache_result = self.figma_repository.save_file_data(figma_file)
            if cache_result.is_success:
                self.log_info(f"Saved file {file_id} to cache")
            
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=figma_file,
                message=f"Successfully retrieved file {file_id}",
                metadata={
                    "from_cache": False,
                    "collections_count": figma_file.collection_count,
                    "variables_count": figma_file.total_variable_count
                }
            )
            
        except Exception as e:
            error_msg = f"Error getting file with variables: {e}"
            self.log_error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def get_collections_summary(self, file_id: str) -> OperationResult[List[Dict[str, Any]]]:
        """Lấy tóm tắt thông tin các collections"""
        try:
            file_result = self.get_file_with_variables(file_id)
            if not file_result.is_success:
                return OperationResult(
                    status=file_result.status,
                    message=file_result.message,
                    errors=file_result.errors
                )
            
            figma_file = file_result.data
            
            collections_summary = []
            for collection in figma_file.collections:
                stats = self.figma_domain_service.get_collection_statistics(collection)
                summary = {
                    "id": collection.id,
                    "name": collection.name,
                    "statistics": stats
                }
                collections_summary.append(summary)
            
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=collections_summary,
                message=f"Retrieved summary for {len(collections_summary)} collections"
            )
            
        except Exception as e:
            error_msg = f"Error getting collections summary: {e}"
            self.log_error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def get_variables_by_type(self, file_id: str, variable_type: VariableType) -> OperationResult[List[FigmaVariable]]:
        """Lấy tất cả variables theo type"""
        try:
            file_result = self.get_file_with_variables(file_id)
            if not file_result.is_success:
                return OperationResult(
                    status=file_result.status,
                    message=file_result.message,
                    errors=file_result.errors
                )
            
            figma_file = file_result.data
            variables = figma_file.get_variables_by_type(variable_type)
            
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=variables,
                message=f"Found {len(variables)} variables of type {variable_type.value}"
            )
            
        except Exception as e:
            error_msg = f"Error getting variables by type: {e}"
            self.log_error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def get_file_statistics(self, file_id: str) -> OperationResult[Dict[str, Any]]:
        """Lấy thống kê chi tiết của file"""
        try:
            file_result = self.get_file_with_variables(file_id)
            if not file_result.is_success:
                return OperationResult(
                    status=file_result.status,
                    message=file_result.message,
                    errors=file_result.errors
                )
            
            figma_file = file_result.data
            stats = self.figma_domain_service.get_file_statistics(figma_file)
            
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=stats,
                message="File statistics retrieved successfully"
            )
            
        except Exception as e:
            error_msg = f"Error getting file statistics: {e}"
            self.log_error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def find_duplicate_variables(self, file_id: str) -> OperationResult[List[Dict[str, Any]]]:
        """Tìm các variables có tên trùng lập"""
        try:
            file_result = self.get_file_with_variables(file_id)
            if not file_result.is_success:
                return OperationResult(
                    status=file_result.status,
                    message=file_result.message,
                    errors=file_result.errors
                )
            
            figma_file = file_result.data
            duplicates = self.figma_domain_service.find_duplicate_variable_names(figma_file)
            
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=duplicates,
                message=f"Found {len(duplicates)} groups of duplicate variable names"
            )
            
        except Exception as e:
            error_msg = f"Error finding duplicate variables: {e}"
            self.log_error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def suggest_variable_renaming(self, file_id: str) -> OperationResult[List[Dict[str, Any]]]:
        """Gợi ý đổi tên cho các variables trùng lập"""
        try:
            duplicates_result = self.find_duplicate_variables(file_id)
            if not duplicates_result.is_success:
                return duplicates_result
            
            duplicates = duplicates_result.data
            if not duplicates:
                return OperationResult(
                    status=OperationStatus.SUCCESS,
                    data=[],
                    message="No duplicate variable names found"
                )
            
            suggestions = self.figma_domain_service.suggest_variable_renaming(duplicates)
            
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=suggestions,
                message=f"Generated renaming suggestions for {len(suggestions)} duplicate groups"
            )
            
        except Exception as e:
            error_msg = f"Error suggesting variable renaming: {e}"
            self.log_error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def export_variables_for_sync(self, file_id: str, collection_ids: List[str] = None, 
                                 mode_ids: List[str] = None) -> OperationResult[List[Dict[str, Any]]]:
        """Export variables để chuẩn bị sync"""
        try:
            file_result = self.get_file_with_variables(file_id)
            if not file_result.is_success:
                return OperationResult(
                    status=file_result.status,
                    message=file_result.message,
                    errors=file_result.errors
                )
            
            figma_file = file_result.data
            exported_variables = []
            
            for collection in figma_file.collections:
                # Lọc collection nếu có đề nghị
                if collection_ids and collection.id not in collection_ids:
                    continue
                
                for variable in collection.variables:
                    for mode in collection.modes:
                        # Lọc mode nếu có đề nghị
                        if mode_ids and mode.id not in mode_ids:
                            continue
                        
                        value = variable.get_value_for_mode(mode.id)
                        if value:
                            exported_variables.append({
                                "variable_id": variable.id,
                                "variable_name": variable.name,
                                "variable_key": variable.key,
                                "collection_id": collection.id,
                                "collection_name": collection.name,
                                "mode_id": mode.id,
                                "mode_name": mode.name,
                                "type": variable.resolved_type.value,
                                "value": value.value,
                                "value_string": value.as_string,
                                "description": variable.description
                            })
            
            self.log_info(f"Exported {len(exported_variables)} variable entries for sync")
            
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=exported_variables,
                message=f"Exported {len(exported_variables)} variable entries",
                metadata={
                    "file_id": file_id,
                    "collections_processed": len([c for c in figma_file.collections if not collection_ids or c.id in collection_ids]),
                    "modes_processed": len(mode_ids) if mode_ids else sum(len(c.modes) for c in figma_file.collections)
                }
            )
            
        except Exception as e:
            error_msg = f"Error exporting variables for sync: {e}"
            self.log_error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def clear_cache(self, file_id: str = None) -> OperationResult[bool]:
        """Xóa cache cho file hoặc toàn bộ"""
        try:
            if file_id:
                # Xóa cache cho file cụ thể
                file_path = Path(f"figma_data/{file_id}.json")
                if self.figma_repository.file_handler.file_exists(file_path):
                    result = self.figma_repository.file_handler.delete_file(file_path)
                    return result
                else:
                    return OperationResult(
                        status=OperationStatus.SUCCESS,
                        data=True,
                        message=f"Cache for file {file_id} was already cleared"
                    )
            else:
                # Xóa toàn bộ cache
                cache_dir = Path("figma_data")
                if cache_dir.exists():
                    import shutil
                    shutil.rmtree(cache_dir)
                
                return OperationResult(
                    status=OperationStatus.SUCCESS,
                    data=True,
                    message="All Figma cache cleared"
                )
            
        except Exception as e:
            error_msg = f"Error clearing cache: {e}"
            self.log_error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                data=False,
                message=error_msg,
                errors=[str(e)]
            )
    
    def validate_file_for_sync(self, file_id: str) -> OperationResult[Dict[str, Any]]:
        """Validate file trước khi sync"""
        try:
            file_result = self.get_file_with_variables(file_id)
            if not file_result.is_success:
                return OperationResult(
                    status=file_result.status,
                    message=file_result.message,
                    errors=file_result.errors
                )
            
            figma_file = file_result.data
            validation_report = {
                "is_valid": True,
                "errors": [],
                "warnings": [],
                "statistics": self.figma_domain_service.get_file_statistics(figma_file)
            }
            
            # Kiểm tra duplicates
            duplicates = self.figma_domain_service.find_duplicate_variable_names(figma_file)
            if duplicates:
                validation_report["warnings"].append(f"Found {len(duplicates)} groups of duplicate variable names")
            
            # Kiểm tra collections không rỗng
            empty_collections = [c for c in figma_file.collections if not c.variables]
            if empty_collections:
                validation_report["warnings"].append(f"Found {len(empty_collections)} empty collections")
            
            # Kiểm tra variables không có giá trị
            variables_without_values = []
            for collection in figma_file.collections:
                for variable in collection.variables:
                    if not variable.values_by_mode:
                        variables_without_values.append(variable.name)
            
            if variables_without_values:
                validation_report["errors"].append(f"Found {len(variables_without_values)} variables without values")
                validation_report["is_valid"] = False
            
            status = OperationStatus.SUCCESS if validation_report["is_valid"] else OperationStatus.WARNING
            
            return OperationResult(
                status=status,
                data=validation_report,
                message="File validation completed"
            )
            
        except Exception as e:
            error_msg = f"Error validating file for sync: {e}"
            self.log_error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def get_configured_file_keys(self) -> OperationResult[List[str]]:
        """Load Figma file keys from config file"""
        try:
            config_path = Path("config/get_file_data_config.json")
            if not config_path.exists():
                return OperationResult(
                    status=OperationStatus.FAILED,
                    message=f"Config file not found: {config_path}",
                    errors=[f"File {config_path} does not exist"]
                )
            
            with open(config_path, 'r') as f:
                config_data = json.load(f)
            
            file_keys = config_data.get('file_keys', [])
            if not file_keys:
                return OperationResult(
                    status=OperationStatus.WARNING,
                    data=[],
                    message="No file keys found in config"
                )
            
            self.log_info(f"Loaded {len(file_keys)} file keys from config")
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=file_keys,
                message=f"Successfully loaded {len(file_keys)} file keys"
            )
            
        except json.JSONDecodeError as e:
            error_msg = f"Invalid JSON in config file: {e}"
            self.log_error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
        except Exception as e:
            error_msg = f"Error loading file keys from config: {e}"
            self.log_error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def test_figma_token(self) -> OperationResult[Dict[str, Any]]:
        """Test if the Figma token is valid and get user info"""
        try:
            token = os.getenv('FIGMA_TOKEN')
            if not token:
                return OperationResult(
                    status=OperationStatus.FAILED,
                    message="FIGMA_TOKEN environment variable not set",
                    errors=["Missing FIGMA_TOKEN"]
                )
            
            # Test token with /me endpoint
            headers = {'X-Figma-Token': token}
            response = requests.get('https://api.figma.com/v1/me', headers=headers, timeout=10)
            
            if response.status_code == 200:
                user_data = response.json()
                self.log_info(f"Token valid for user: {user_data.get('email', 'Unknown')}")
                return OperationResult(
                    status=OperationStatus.SUCCESS,
                    data={
                        "user_info": user_data,
                        "token_type": "Organization PAT" if user_data.get('team_ids') else "Personal PAT"
                    },
                    message="Token validation successful"
                )
            elif response.status_code == 403:
                return OperationResult(
                    status=OperationStatus.FAILED,
                    message="Invalid or expired Figma token",
                    errors=[f"HTTP 403: {response.text}"]
                )
            else:
                return OperationResult(
                    status=OperationStatus.FAILED,
                    message=f"Token validation failed with status {response.status_code}",
                    errors=[f"HTTP {response.status_code}: {response.text}"]
                )
                
        except requests.RequestException as e:
            error_msg = f"Network error during token validation: {e}"
            self.log_error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
        except Exception as e:
            error_msg = f"Error testing Figma token: {e}"
            self.log_error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def test_file_access(self, file_id: str) -> OperationResult[Dict[str, Any]]:
        """Test if the token has access to a specific Figma file"""
        try:
            token = os.getenv('FIGMA_TOKEN')
            if not token:
                return OperationResult(
                    status=OperationStatus.FAILED,
                    message="FIGMA_TOKEN environment variable not set",
                    errors=["Missing FIGMA_TOKEN"]
                )
            
            # Test file access with minimal request
            headers = {'X-Figma-Token': token}
            url = f'https://api.figma.com/v1/files/{file_id}'
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                file_data = response.json()
                self.log_info(f"Access confirmed for file: {file_data.get('name', file_id)}")
                return OperationResult(
                    status=OperationStatus.SUCCESS,
                    data={
                        "file_id": file_id,
                        "file_name": file_data.get('name', 'Unknown'),
                        "access_granted": True
                    },
                    message=f"Access granted to file {file_id}"
                )
            elif response.status_code == 403:
                return OperationResult(
                    status=OperationStatus.FAILED,
                    data={
                        "file_id": file_id,
                        "access_granted": False,
                        "reason": "Permission denied"
                    },
                    message=f"Access denied to file {file_id}",
                    errors=[f"HTTP 403: Token does not have access to this file"]
                )
            elif response.status_code == 404:
                return OperationResult(
                    status=OperationStatus.FAILED,
                    data={
                        "file_id": file_id,
                        "access_granted": False,
                        "reason": "File not found"
                    },
                    message=f"File {file_id} not found",
                    errors=[f"HTTP 404: File does not exist or is not accessible"]
                )
            else:
                return OperationResult(
                    status=OperationStatus.FAILED,
                    data={
                        "file_id": file_id,
                        "access_granted": False,
                        "reason": f"HTTP {response.status_code}"
                    },
                    message=f"File access test failed with status {response.status_code}",
                    errors=[f"HTTP {response.status_code}: {response.text}"]
                )
                
        except requests.RequestException as e:
            error_msg = f"Network error during file access test: {e}"
            self.log_error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
        except Exception as e:
            error_msg = f"Error testing file access: {e}"
            self.log_error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def test_batch_file_access(self, file_ids: List[str] = None) -> OperationResult[Dict[str, Any]]:
        """Test access to multiple files, either provided or from config"""
        try:
            # Use provided file_ids or load from config
            if not file_ids:
                config_result = self.get_configured_file_keys()
                if not config_result.is_success:
                    return config_result
                file_ids = config_result.data
            
            if not file_ids:
                return OperationResult(
                    status=OperationStatus.WARNING,
                    data={"accessible": [], "inaccessible": []},
                    message="No file IDs to test"
                )
            
            # First test the token itself
            token_result = self.test_figma_token()
            if not token_result.is_success:
                return token_result
            
            accessible_files = []
            inaccessible_files = []
            
            self.log_info(f"Testing access to {len(file_ids)} files...")
            
            for file_id in file_ids:
                access_result = self.test_file_access(file_id)
                if access_result.is_success:
                    accessible_files.append(access_result.data)
                else:
                    inaccessible_files.append({
                        "file_id": file_id,
                        "error": access_result.message,
                        "reason": access_result.data.get("reason", "Unknown") if access_result.data else "Unknown"
                    })
            
            total_files = len(file_ids)
            accessible_count = len(accessible_files)
            inaccessible_count = len(inaccessible_files)
            
            result_data = {
                "token_info": token_result.data,
                "total_files": total_files,
                "accessible_count": accessible_count,
                "inaccessible_count": inaccessible_count,
                "accessible": accessible_files,
                "inaccessible": inaccessible_files
            }
            
            if inaccessible_count == 0:
                status = OperationStatus.SUCCESS
                message = f"All {accessible_count} files are accessible"
            elif accessible_count == 0:
                status = OperationStatus.FAILED
                message = f"None of the {total_files} files are accessible"
            else:
                status = OperationStatus.WARNING
                message = f"{accessible_count}/{total_files} files are accessible"
            
            self.log_info(f"Batch access test completed: {message}")
            
            return OperationResult(
                status=status,
                data=result_data,
                message=message
            )
            
        except Exception as e:
            error_msg = f"Error during batch file access test: {e}"
            self.log_error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def test_token_validity(self) -> OperationResult[Dict[str, Any]]:
        """Test token validity - alias for test_figma_token for compatibility"""
        return self.test_figma_token()
    
    def test_file_access_batch(self, file_ids: List[str] = None) -> OperationResult[List[Dict[str, Any]]]:
        """Test file access batch - enhanced for pipeline compatibility"""
        try:
            batch_result = self.test_batch_file_access(file_ids)
            if not batch_result.is_success:
                return OperationResult(
                    status=batch_result.status,
                    message=batch_result.message,
                    errors=batch_result.errors
                )
            
            # Transform data for pipeline compatibility
            batch_data = batch_result.data
            test_results = []
            
            # Add accessible files
            for accessible_file in batch_data.get('accessible', []):
                test_results.append({
                    'file_key': accessible_file['file_id'],
                    'accessible': True,
                    'file_info': {
                        'name': accessible_file.get('file_name', 'Unknown')
                    }
                })
            
            # Add inaccessible files
            for inaccessible_file in batch_data.get('inaccessible', []):
                test_results.append({
                    'file_key': inaccessible_file['file_id'],
                    'accessible': False,
                    'error': inaccessible_file.get('reason', 'Unknown error')
                })
            
            return OperationResult(
                status=batch_result.status,
                data=test_results,
                message=batch_result.message
            )
            
        except Exception as e:
            error_msg = f"Error in test_file_access_batch: {e}"
            self.log_error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )

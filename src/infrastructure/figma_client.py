"""
Figma API Client
"""
import requests
import time
from typing import Dict, Any, Optional, List
from datetime import datetime

from src.core.base import BaseClient, OperationResult, OperationStatus
from src.core.constants import FIGMA_API_BASE_URL, DEFAULT_TIMEOUT, DEFAULT_RETRY_ATTEMPTS
from src.core.exceptions import APIClientError
from src.utils.logger import get_logger


class FigmaClient(BaseClient):
    """Client cho Figma API"""
    
    def __init__(self, access_token: str, timeout: int = DEFAULT_TIMEOUT, max_retries: int = DEFAULT_RETRY_ATTEMPTS):
        super().__init__(FIGMA_API_BASE_URL, timeout, max_retries)
        self.access_token = access_token
        self.logger = get_logger(self.__class__.__name__)
        self.session = requests.Session()
        self._setup_session()
    
    def _setup_session(self):
        """Cấu hình session cho API calls"""
        self.session.headers.update({
            'X-Figma-Token': self.access_token,
            'Content-Type': 'application/json',
            'User-Agent': 'Variables-Sync-Pipeline/1.0'
        })
    
    def authenticate(self) -> bool:
        """Kiểm tra xác thực"""
        try:
            # Test authentication bằng cách gọi request đến user endpoint
            response = self.session.get(f"{self.base_url}/me", timeout=self.timeout)
            return response.status_code == 200
        except Exception as e:
            self.logger.error(f"Authentication failed: {e}")
            return False
    
    def make_request(self, endpoint: str, method: str = "GET", **kwargs) -> OperationResult[Any]:
        """Thực hiện API request với retry logic"""
        url = f"{self.base_url}{endpoint}"
        
        for attempt in range(self.max_retries):
            try:
                self.logger.debug(f"Making {method} request to {url} (attempt {attempt + 1})")
                
                response = self.session.request(
                    method=method,
                    url=url,
                    timeout=self.timeout,
                    **kwargs
                )
                
                # Handle rate limiting
                if response.status_code == 429:
                    retry_after = int(response.headers.get('Retry-After', 60))
                    self.logger.warning(f"Rate limited. Waiting {retry_after} seconds...")
                    time.sleep(retry_after)
                    continue
                
                # Handle successful responses
                if response.status_code == 200:
                    data = response.json()
                    return OperationResult(
                        status=OperationStatus.SUCCESS,
                        data=data,
                        message=f"Successfully {method} {endpoint}"
                    )
                
                # Handle client errors (4xx)
                elif 400 <= response.status_code < 500:
                    error_msg = f"Client error {response.status_code}: {response.text}"
                    self.logger.error(error_msg)
                    return OperationResult(
                        status=OperationStatus.FAILED,
                        message=error_msg,
                        errors=[error_msg]
                    )
                
                # Handle server errors (5xx) - retry
                elif response.status_code >= 500:
                    if attempt < self.max_retries - 1:
                        wait_time = 2 ** attempt  # Exponential backoff
                        self.logger.warning(f"Server error {response.status_code}. Retrying in {wait_time}s...")
                        time.sleep(wait_time)
                        continue
                    else:
                        error_msg = f"Server error {response.status_code} after {self.max_retries} attempts"
                        self.logger.error(error_msg)
                        return OperationResult(
                            status=OperationStatus.FAILED,
                            message=error_msg,
                            errors=[error_msg]
                        )
                        
            except requests.exceptions.Timeout:
                if attempt < self.max_retries - 1:
                    self.logger.warning(f"Request timeout. Retrying... (attempt {attempt + 1})")
                    continue
                else:
                    error_msg = f"Request timeout after {self.max_retries} attempts"
                    self.logger.error(error_msg)
                    return OperationResult(
                        status=OperationStatus.FAILED,
                        message=error_msg,
                        errors=[error_msg]
                    )
                    
            except Exception as e:
                error_msg = f"Unexpected error: {str(e)}"
                self.logger.error(error_msg)
                return OperationResult(
                    status=OperationStatus.FAILED,
                    message=error_msg,
                    errors=[error_msg]
                )
        
        # Fallback error
        return OperationResult(
            status=OperationStatus.FAILED,
            message="Request failed after all retry attempts",
            errors=["Max retries exceeded"]
        )
    
    def get_file(self, file_id: str) -> OperationResult[Dict[str, Any]]:
        """Lấy thông tin file Figma"""
        return self.make_request(f"/files/{file_id}")
    
    def get_file_variables(self, file_id: str) -> OperationResult[Dict[str, Any]]:
        """Lấy variables từ file"""
        return self.make_request(f"/files/{file_id}/variables/local")
    
    def get_variable_collections(self, file_id: str) -> OperationResult[Dict[str, Any]]:
        """Lấy collections từ file"""
        return self.make_request(f"/files/{file_id}/variable_collections")
    
    def create_variable(self, file_id: str, variable_data: Dict[str, Any]) -> OperationResult[Dict[str, Any]]:
        """Tạo variable mới"""
        return self.make_request(
            f"/files/{file_id}/variables",
            method="POST",
            json=variable_data
        )
    
    def update_variable(self, file_id: str, variable_id: str, variable_data: Dict[str, Any]) -> OperationResult[Dict[str, Any]]:
        """Cập nhật variable"""
        return self.make_request(
            f"/files/{file_id}/variables/{variable_id}",
            method="PUT",
            json=variable_data
        )
    
    def delete_variable(self, file_id: str, variable_id: str) -> OperationResult[bool]:
        """Xóa variable"""
        result = self.make_request(
            f"/files/{file_id}/variables/{variable_id}",
            method="DELETE"
        )
        
        if result.is_success:
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=True,
                message="Variable deleted successfully"
            )
        else:
            return OperationResult(
                status=result.status,
                data=False,
                message=result.message,
                errors=result.errors
            )
    
    def create_variable_collection(self, file_id: str, collection_data: Dict[str, Any]) -> OperationResult[Dict[str, Any]]:
        """Tạo collection mới"""
        return self.make_request(
            f"/files/{file_id}/variable_collections",
            method="POST",
            json=collection_data
        )
    
    def update_variable_collection(self, file_id: str, collection_id: str, collection_data: Dict[str, Any]) -> OperationResult[Dict[str, Any]]:
        """Cập nhật collection"""
        return self.make_request(
            f"/files/{file_id}/variable_collections/{collection_id}",
            method="PUT",
            json=collection_data
        )
    
    def delete_variable_collection(self, file_id: str, collection_id: str) -> OperationResult[bool]:
        """Xóa collection"""
        result = self.make_request(
            f"/files/{file_id}/variable_collections/{collection_id}",
            method="DELETE"
        )
        
        if result.is_success:
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=True,
                message="Collection deleted successfully"
            )
        else:
            return OperationResult(
                status=result.status,
                data=False,
                message=result.message,
                errors=result.errors
            )
    
    def batch_update_variables(self, file_id: str, updates: List[Dict[str, Any]]) -> OperationResult[Dict[str, Any]]:
        """Cập nhật nhiều variables cùng lúc"""
        batch_data = {
            "updates": updates
        }
        
        return self.make_request(
            f"/files/{file_id}/variables/batch",
            method="POST",
            json=batch_data
        )
    
    def get_user_info(self) -> OperationResult[Dict[str, Any]]:
        """Lấy thông tin user hiện tại"""
        return self.make_request("/me")
    
    def get_team_projects(self, team_id: str) -> OperationResult[Dict[str, Any]]:
        """Lấy danh sách projects của team"""
        return self.make_request(f"/teams/{team_id}/projects")
    
    def close(self):
        """Dọng dập session"""
        if self.session:
            self.session.close()
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

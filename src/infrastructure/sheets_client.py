"""
Google Sheets API Client
"""
import json
from typing import Dict, Any, List, Optional
from pathlib import Path

try:
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
    from googleapiclient.errors import HttpError
except ImportError:
    print("Warning: Google API libraries not installed. Install with: pip install google-auth google-auth-oauthlib google-api-python-client")
    service_account = None
    build = None
    HttpError = Exception

from src.core.base import BaseClient, OperationResult, OperationStatus
from src.core.constants import GOOGLE_SHEETS_API_BASE_URL, DEFAULT_TIMEOUT
from src.core.exceptions import APIClientError
from src.utils.logger import get_logger


class SheetsClient(BaseClient):
    """Client cho Google Sheets API"""
    
    def __init__(self, credentials_file: str, timeout: int = DEFAULT_TIMEOUT, max_retries: int = 3):
        super().__init__(GOOGLE_SHEETS_API_BASE_URL, timeout, max_retries)
        self.credentials_file = credentials_file
        self.logger = get_logger(self.__class__.__name__)
        self.service = None
        self.drive_service = None
        self._authenticated = False
        
        if service_account is None:
            self.logger.error("Google API libraries not available. Please install required packages.")
            return
            
        self._authenticate()
    
    def _authenticate(self):
        """Xác thực với Google Sheets API"""
        try:
            credentials_path = Path(self.credentials_file)
            if not credentials_path.exists():
                self.logger.error(f"Credentials file not found: {self.credentials_file}")
                return
            
            # Load service account credentials
            scopes = [
                'https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/drive'
            ]
            
            credentials = service_account.Credentials.from_service_account_file(
                self.credentials_file,
                scopes=scopes
            )
            
            # Build services
            self.service = build('sheets', 'v4', credentials=credentials)
            self.drive_service = build('drive', 'v3', credentials=credentials)
            
            self._authenticated = True
            self.logger.info("Successfully authenticated with Google Sheets API")
            
        except Exception as e:
            self.logger.error(f"Authentication failed: {e}")
            self._authenticated = False
    
    def authenticate(self) -> bool:
        """Kiểm tra trạng thái xác thực"""
        return self._authenticated
    
    def make_request(self, endpoint: str, method: str = "GET", **kwargs) -> OperationResult[Any]:
        """Base method cho API requests (không sử dụng trực tiếp)"""
        # This method is required by BaseClient but we use service methods instead
        return OperationResult(
            status=OperationStatus.FAILED,
            message="Use specific service methods instead of make_request"
        )
    
    def get_spreadsheet(self, spreadsheet_id: str) -> OperationResult[Dict[str, Any]]:
        """Lấy thông tin spreadsheet"""
        if not self._authenticated:
            return OperationResult(
                status=OperationStatus.FAILED,
                message="Not authenticated",
                errors=["Google Sheets authentication required"]
            )
        
        try:
            result = self.service.spreadsheets().get(
                spreadsheetId=spreadsheet_id,
                includeGridData=False
            ).execute()
            
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=result,
                message=f"Successfully retrieved spreadsheet {spreadsheet_id}"
            )
            
        except HttpError as e:
            error_msg = f"HTTP error getting spreadsheet: {e}"
            self.logger.error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
        except Exception as e:
            error_msg = f"Unexpected error getting spreadsheet: {e}"
            self.logger.error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def create_spreadsheet(self, title: str, sheet_titles: List[str] = None) -> OperationResult[Dict[str, Any]]:
        """Tạo spreadsheet mới"""
        if not self._authenticated:
            return OperationResult(
                status=OperationStatus.FAILED,
                message="Not authenticated"
            )
        
        try:
            # Prepare sheets
            sheets = []
            if sheet_titles:
                for i, sheet_title in enumerate(sheet_titles):
                    sheets.append({
                        'properties': {
                            'sheetId': i,
                            'title': sheet_title,
                            'index': i
                        }
                    })
            else:
                sheets.append({
                    'properties': {
                        'sheetId': 0,
                        'title': 'Sheet1',
                        'index': 0
                    }
                })
            
            spreadsheet_body = {
                'properties': {
                    'title': title
                },
                'sheets': sheets
            }
            
            result = self.service.spreadsheets().create(
                body=spreadsheet_body
            ).execute()
            
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=result,
                message=f"Successfully created spreadsheet '{title}'"
            )
            
        except Exception as e:
            error_msg = f"Error creating spreadsheet: {e}"
            self.logger.error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def get_range_values(self, spreadsheet_id: str, range_name: str) -> OperationResult[List[List[Any]]]:
        """Lấy giá trị từ range"""
        if not self._authenticated:
            return OperationResult(
                status=OperationStatus.FAILED,
                message="Not authenticated"
            )
        
        try:
            result = self.service.spreadsheets().values().get(
                spreadsheetId=spreadsheet_id,
                range=range_name,
                valueRenderOption='UNFORMATTED_VALUE'
            ).execute()
            
            values = result.get('values', [])
            
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=values,
                message=f"Successfully retrieved range {range_name}"
            )
            
        except Exception as e:
            error_msg = f"Error getting range values: {e}"
            self.logger.error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def update_range_values(self, spreadsheet_id: str, range_name: str, values: List[List[Any]], 
                          value_input_option: str = 'RAW') -> OperationResult[Dict[str, Any]]:
        """Cập nhật giá trị cho range"""
        if not self._authenticated:
            return OperationResult(
                status=OperationStatus.FAILED,
                message="Not authenticated"
            )
        
        try:
            body = {
                'values': values
            }
            
            result = self.service.spreadsheets().values().update(
                spreadsheetId=spreadsheet_id,
                range=range_name,
                valueInputOption=value_input_option,
                body=body
            ).execute()
            
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=result,
                message=f"Successfully updated range {range_name}"
            )
            
        except Exception as e:
            error_msg = f"Error updating range values: {e}"
            self.logger.error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def append_values(self, spreadsheet_id: str, range_name: str, values: List[List[Any]], 
                     value_input_option: str = 'RAW') -> OperationResult[Dict[str, Any]]:
        """Thêm giá trị vào cuối range"""
        if not self._authenticated:
            return OperationResult(
                status=OperationStatus.FAILED,
                message="Not authenticated"
            )
        
        try:
            body = {
                'values': values
            }
            
            result = self.service.spreadsheets().values().append(
                spreadsheetId=spreadsheet_id,
                range=range_name,
                valueInputOption=value_input_option,
                insertDataOption='INSERT_ROWS',
                body=body
            ).execute()
            
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=result,
                message=f"Successfully appended values to {range_name}"
            )
            
        except Exception as e:
            error_msg = f"Error appending values: {e}"
            self.logger.error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def clear_range(self, spreadsheet_id: str, range_name: str) -> OperationResult[bool]:
        """Xóa nội dung range"""
        if not self._authenticated:
            return OperationResult(
                status=OperationStatus.FAILED,
                message="Not authenticated"
            )
        
        try:
            self.service.spreadsheets().values().clear(
                spreadsheetId=spreadsheet_id,
                range=range_name
            ).execute()
            
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=True,
                message=f"Successfully cleared range {range_name}"
            )
            
        except Exception as e:
            error_msg = f"Error clearing range: {e}"
            self.logger.error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                data=False,
                message=error_msg,
                errors=[str(e)]
            )
    
    def batch_update(self, spreadsheet_id: str, requests: List[Dict[str, Any]]) -> OperationResult[Dict[str, Any]]:
        """Thực hiện batch update"""
        if not self._authenticated:
            return OperationResult(
                status=OperationStatus.FAILED,
                message="Not authenticated"
            )
        
        try:
            body = {
                'requests': requests
            }
            
            result = self.service.spreadsheets().batchUpdate(
                spreadsheetId=spreadsheet_id,
                body=body
            ).execute()
            
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=result,
                message=f"Successfully executed {len(requests)} batch updates"
            )
            
        except Exception as e:
            error_msg = f"Error in batch update: {e}"
            self.logger.error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def add_worksheet(self, spreadsheet_id: str, title: str, rows: int = 1000, cols: int = 26) -> OperationResult[Dict[str, Any]]:
        """Thêm worksheet mới"""
        request = {
            'addSheet': {
                'properties': {
                    'title': title,
                    'gridProperties': {
                        'rowCount': rows,
                        'columnCount': cols
                    }
                }
            }
        }
        
        return self.batch_update(spreadsheet_id, [request])
    
    def format_range(self, spreadsheet_id: str, sheet_id: int, start_row: int, end_row: int, 
                    start_col: int, end_col: int, format_config: Dict[str, Any]) -> OperationResult[Dict[str, Any]]:
        """Format một range"""
        request = {
            'repeatCell': {
                'range': {
                    'sheetId': sheet_id,
                    'startRowIndex': start_row,
                    'endRowIndex': end_row,
                    'startColumnIndex': start_col,
                    'endColumnIndex': end_col
                },
                'cell': {
                    'userEnteredFormat': format_config
                },
                'fields': 'userEnteredFormat'
            }
        }
        
        return self.batch_update(spreadsheet_id, [request])
    
    def share_spreadsheet(self, spreadsheet_id: str, email: str, role: str = 'reader') -> OperationResult[bool]:
        """Chia sẻ spreadsheet"""
        if not self._authenticated or not self.drive_service:
            return OperationResult(
                status=OperationStatus.FAILED,
                message="Not authenticated or Drive service unavailable"
            )
        
        try:
            permission = {
                'type': 'user',
                'role': role,
                'emailAddress': email
            }
            
            self.drive_service.permissions().create(
                fileId=spreadsheet_id,
                body=permission,
                sendNotificationEmail=True
            ).execute()
            
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=True,
                message=f"Successfully shared spreadsheet with {email}"
            )
            
        except Exception as e:
            error_msg = f"Error sharing spreadsheet: {e}"
            self.logger.error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                data=False,
                message=error_msg,
                errors=[str(e)]
            )

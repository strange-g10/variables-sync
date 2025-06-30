"""
Google Sheets Repository Implementation
Provides robust foundation for all Google Sheets data operations
"""
from typing import List, Optional, Dict, Any
from datetime import datetime

from src.domain.repositories.sheet_repository import SheetRepository
from src.domain.models.sheet_models import Spreadsheet, Worksheet, CellRange, Cell, SheetConfiguration
from src.core.base import OperationResult, OperationStatus
from src.infrastructure.sheets_client import SheetsClient
from src.utils.logger import get_logger


class SheetRepositoryImpl(SheetRepository):
    """Complete implementation của SheetRepository interface"""
    
    def __init__(self, sheets_client: SheetsClient, logger=None):
        self.sheets_client = sheets_client
        self.logger = logger or get_logger(self.__class__.__name__)
    
    def get_spreadsheet(self, spreadsheet_id: str) -> OperationResult[Spreadsheet]:
        """Lấy thông tin spreadsheet với đầy đủ worksheets"""
        try:
            self.logger.info(f"Getting spreadsheet {spreadsheet_id}")
            
            # Get spreadsheet metadata
            result = self.sheets_client.get_spreadsheet(spreadsheet_id)
            if not result.is_success:
                return OperationResult(
                    status=result.status,
                    message=result.message,
                    errors=result.errors
                )
            
            spreadsheet_data = result.data
            
            # Parse worksheets
            worksheets = []
            for sheet_data in spreadsheet_data.get('sheets', []):
                worksheet = self._parse_worksheet(sheet_data)
                if worksheet:
                    worksheets.append(worksheet)
            
            # Create Spreadsheet object
            spreadsheet = Spreadsheet(
                id=spreadsheet_id,
                name=spreadsheet_data['properties']['title'],
                url=f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}",
                worksheets=worksheets,
                created_time=datetime.now(),  # Google API doesn't provide creation time
                modified_time=datetime.now(), # Will be updated with actual time if available
                permissions=spreadsheet_data.get('properties', {}).get('permissions', {}),
                metadata={
                    'locale': spreadsheet_data['properties'].get('locale', 'en'),
                    'timeZone': spreadsheet_data['properties'].get('timeZone', 'UTC'),
                    'autoRecalc': spreadsheet_data['properties'].get('autoRecalc', 'ON_CHANGE')
                }
            )
            
            self.logger.info(f"Successfully retrieved spreadsheet with {len(worksheets)} worksheets")
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=spreadsheet,
                message=f"Successfully retrieved spreadsheet '{spreadsheet.name}'",
                metadata={
                    "worksheets_count": len(worksheets),
                    "spreadsheet_id": spreadsheet_id
                }
            )
            
        except Exception as e:
            error_msg = f"Error getting spreadsheet: {e}"
            self.logger.error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def create_spreadsheet(self, name: str, worksheets: List[str] = None) -> OperationResult[Spreadsheet]:
        """Tạo spreadsheet mới với các worksheets được chỉ định"""
        try:
            self.logger.info(f"Creating spreadsheet '{name}' with worksheets: {worksheets}")
            
            # Create spreadsheet
            result = self.sheets_client.create_spreadsheet(name, worksheets)
            if not result.is_success:
                return OperationResult(
                    status=result.status,
                    message=result.message,
                    errors=result.errors
                )
            
            spreadsheet_data = result.data
            spreadsheet_id = spreadsheet_data['spreadsheetId']
            
            # Get full spreadsheet info
            return self.get_spreadsheet(spreadsheet_id)
            
        except Exception as e:
            error_msg = f"Error creating spreadsheet: {e}"
            self.logger.error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def delete_spreadsheet(self, spreadsheet_id: str) -> OperationResult[bool]:
        """Xóa spreadsheet (requires Drive API permissions)"""
        try:
            # Note: This requires Drive API to delete the entire spreadsheet
            # For now, we'll return a not implemented error
            return OperationResult(
                status=OperationStatus.FAILED,
                message="Delete spreadsheet requires Drive API implementation",
                errors=["NotImplementedError: Use Drive API to delete spreadsheets"]
            )
            
        except Exception as e:
            error_msg = f"Error deleting spreadsheet: {e}"
            self.logger.error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def get_worksheet(self, spreadsheet_id: str, worksheet_title: str) -> OperationResult[Worksheet]:
        """Lấy thông tin chi tiết của một worksheet"""
        try:
            # Get full spreadsheet to find the worksheet
            spreadsheet_result = self.get_spreadsheet(spreadsheet_id)
            if not spreadsheet_result.is_success:
                return OperationResult(
                    status=spreadsheet_result.status,
                    message=spreadsheet_result.message,
                    errors=spreadsheet_result.errors
                )
            
            spreadsheet = spreadsheet_result.data
            
            # Find the worksheet
            worksheet = spreadsheet.get_worksheet_by_title(worksheet_title)
            if worksheet is None:
                return OperationResult(
                    status=OperationStatus.FAILED,
                    message=f"Worksheet '{worksheet_title}' not found",
                    errors=[f"Worksheet '{worksheet_title}' does not exist"]
                )
            
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=worksheet,
                message=f"Successfully retrieved worksheet '{worksheet_title}'"
            )
            
        except Exception as e:
            error_msg = f"Error getting worksheet: {e}"
            self.logger.error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def create_worksheet(self, spreadsheet_id: str, worksheet: Worksheet) -> OperationResult[Worksheet]:
        """Tạo worksheet mới"""
        try:
            self.logger.info(f"Creating worksheet '{worksheet.title}' in spreadsheet {spreadsheet_id}")
            
            # Add worksheet using sheets client
            result = self.sheets_client.add_worksheet(
                spreadsheet_id,
                worksheet.title,
                worksheet.row_count,
                worksheet.column_count
            )
            
            if not result.is_success:
                return OperationResult(
                    status=result.status,
                    message=result.message,
                    errors=result.errors
                )
            
            # Get the created worksheet
            return self.get_worksheet(spreadsheet_id, worksheet.title)
            
        except Exception as e:
            error_msg = f"Error creating worksheet: {e}"
            self.logger.error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def update_worksheet(self, spreadsheet_id: str, worksheet: Worksheet) -> OperationResult[Worksheet]:
        """Cập nhật thông tin worksheet"""
        try:
            self.logger.info(f"Updating worksheet '{worksheet.title}' in spreadsheet {spreadsheet_id}")
            
            # Build update requests
            requests = []
            
            # Update worksheet properties if needed
            if worksheet.title or worksheet.row_count or worksheet.column_count:
                update_request = {
                    "updateSheetProperties": {
                        "properties": {
                            "sheetId": worksheet.id
                        },
                        "fields": ""
                    }
                }
                
                if worksheet.title:
                    update_request["updateSheetProperties"]["properties"]["title"] = worksheet.title
                    update_request["updateSheetProperties"]["fields"] += "title,"
                
                if worksheet.row_count:
                    update_request["updateSheetProperties"]["properties"]["gridProperties"] = {
                        "rowCount": worksheet.row_count
                    }
                    update_request["updateSheetProperties"]["fields"] += "gridProperties.rowCount,"
                
                if worksheet.column_count:
                    if "gridProperties" not in update_request["updateSheetProperties"]["properties"]:
                        update_request["updateSheetProperties"]["properties"]["gridProperties"] = {}
                    update_request["updateSheetProperties"]["properties"]["gridProperties"]["columnCount"] = worksheet.column_count
                    update_request["updateSheetProperties"]["fields"] += "gridProperties.columnCount,"
                
                # Remove trailing comma
                update_request["updateSheetProperties"]["fields"] = update_request["updateSheetProperties"]["fields"].rstrip(",")
                requests.append(update_request)
            
            # Execute batch update if there are requests
            if requests:
                batch_result = self.sheets_client.batch_update(spreadsheet_id, requests)
                if not batch_result.is_success:
                    return OperationResult(
                        status=batch_result.status,
                        message=batch_result.message,
                        errors=batch_result.errors
                    )
            
            # Update data ranges if provided
            for data_range in worksheet.data_ranges:
                range_result = self.update_range_values(spreadsheet_id, worksheet.title, data_range)
                if not range_result.is_success:
                    self.logger.warning(f"Failed to update range {data_range.get_address()}: {range_result.message}")
            
            # Get updated worksheet
            return self.get_worksheet(spreadsheet_id, worksheet.title)
            
        except Exception as e:
            error_msg = f"Error updating worksheet: {e}"
            self.logger.error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def delete_worksheet(self, spreadsheet_id: str, worksheet_id: int) -> OperationResult[bool]:
        """Xóa worksheet"""
        try:
            self.logger.info(f"Deleting worksheet {worksheet_id} from spreadsheet {spreadsheet_id}")
            
            # Create delete request
            request = {
                "deleteSheet": {
                    "sheetId": worksheet_id
                }
            }
            
            # Execute batch update
            result = self.sheets_client.batch_update(spreadsheet_id, [request])
            if not result.is_success:
                return OperationResult(
                    status=result.status,
                    message=result.message,
                    errors=result.errors
                )
            
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=True,
                message=f"Successfully deleted worksheet {worksheet_id}"
            )
            
        except Exception as e:
            error_msg = f"Error deleting worksheet: {e}"
            self.logger.error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                data=False,
                message=error_msg,
                errors=[str(e)]
            )
    
    def get_range_values(self, spreadsheet_id: str, worksheet_title: str, range_address: str) -> OperationResult[CellRange]:
        """Lấy giá trị từ một range"""
        try:
            self.logger.info(f"Getting range {range_address} from worksheet '{worksheet_title}'")
            
            # Format range name
            full_range = f"{worksheet_title}!{range_address}"
            
            # Get values from API
            result = self.sheets_client.get_range_values(spreadsheet_id, full_range)
            if not result.is_success:
                return OperationResult(
                    status=result.status,
                    message=result.message,
                    errors=result.errors
                )
            
            values = result.data
            
            # Parse range address to get dimensions
            start_row, start_col, end_row, end_col = self._parse_range_address(range_address)
            
            # Create CellRange object
            cell_range = CellRange(
                start_row=start_row,
                start_column=start_col,
                end_row=end_row,
                end_column=end_col
            )
            
            # Set values
            if values:
                cell_range.set_values_2d(values)
            
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=cell_range,
                message=f"Successfully retrieved range {range_address}",
                metadata={
                    "rows_retrieved": len(values) if values else 0,
                    "range_address": range_address
                }
            )
            
        except Exception as e:
            error_msg = f"Error getting range values: {e}"
            self.logger.error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def update_range_values(self, spreadsheet_id: str, worksheet_title: str, cell_range: CellRange) -> OperationResult[bool]:
        """Cập nhật giá trị cho một range"""
        try:
            range_address = cell_range.get_address()
            self.logger.info(f"Updating range {range_address} in worksheet '{worksheet_title}'")
            
            # Format range name
            full_range = f"{worksheet_title}!{range_address}"
            
            # Get values from CellRange
            values = cell_range.get_values_2d()
            
            # Update values via API
            result = self.sheets_client.update_range_values(spreadsheet_id, full_range, values)
            if not result.is_success:
                return OperationResult(
                    status=result.status,
                    message=result.message,
                    errors=result.errors
                )
            
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=True,
                message=f"Successfully updated range {range_address}",
                metadata={
                    "updated_cells": cell_range.row_count * cell_range.column_count,
                    "range_address": range_address
                }
            )
            
        except Exception as e:
            error_msg = f"Error updating range values: {e}"
            self.logger.error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                data=False,
                message=error_msg,
                errors=[str(e)]
            )
    
    def append_rows(self, spreadsheet_id: str, worksheet_title: str, values: List[List[Any]]) -> OperationResult[bool]:
        """Thêm các hàng mới vào cuối worksheet"""
        try:
            self.logger.info(f"Appending {len(values)} rows to worksheet '{worksheet_title}'")
            
            # Use A:A range to append to the end
            range_name = f"{worksheet_title}!A:A"
            
            result = self.sheets_client.append_values(spreadsheet_id, range_name, values)
            if not result.is_success:
                return OperationResult(
                    status=result.status,
                    message=result.message,
                    errors=result.errors
                )
            
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=True,
                message=f"Successfully appended {len(values)} rows",
                metadata={
                    "rows_appended": len(values),
                    "worksheet_title": worksheet_title
                }
            )
            
        except Exception as e:
            error_msg = f"Error appending rows: {e}"
            self.logger.error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                data=False,
                message=error_msg,
                errors=[str(e)]
            )
    
    def clear_range(self, spreadsheet_id: str, worksheet_title: str, range_address: str) -> OperationResult[bool]:
        """Xóa nội dung của một range"""
        try:
            self.logger.info(f"Clearing range {range_address} in worksheet '{worksheet_title}'")
            
            # Format range name
            full_range = f"{worksheet_title}!{range_address}"
            
            result = self.sheets_client.clear_range(spreadsheet_id, full_range)
            if not result.is_success:
                return OperationResult(
                    status=result.status,
                    message=result.message,
                    errors=result.errors
                )
            
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=True,
                message=f"Successfully cleared range {range_address}"
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
    
    def batch_update(self, spreadsheet_id: str, updates: List[Dict[str, Any]]) -> OperationResult[bool]:
        """Thực hiện batch update với nhiều operations"""
        try:
            self.logger.info(f"Executing batch update with {len(updates)} operations")
            
            result = self.sheets_client.batch_update(spreadsheet_id, updates)
            if not result.is_success:
                return OperationResult(
                    status=result.status,
                    message=result.message,
                    errors=result.errors
                )
            
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=True,
                message=f"Successfully executed {len(updates)} batch operations",
                metadata={
                    "operations_count": len(updates)
                }
            )
            
        except Exception as e:
            error_msg = f"Error in batch update: {e}"
            self.logger.error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                data=False,
                message=error_msg,
                errors=[str(e)]
            )
    
    def format_range(self, spreadsheet_id: str, worksheet_title: str, range_address: str, format_config: Dict[str, Any]) -> OperationResult[bool]:
        """Format một range với configuration được chỉ định"""
        try:
            self.logger.info(f"Formatting range {range_address} in worksheet '{worksheet_title}'")
            
            # Get worksheet to find sheet ID
            worksheet_result = self.get_worksheet(spreadsheet_id, worksheet_title)
            if not worksheet_result.is_success:
                return OperationResult(
                    status=worksheet_result.status,
                    message=worksheet_result.message,
                    errors=worksheet_result.errors
                )
            
            worksheet = worksheet_result.data
            
            # Parse range address
            start_row, start_col, end_row, end_col = self._parse_range_address(range_address)
            
            # Format range using sheets client
            result = self.sheets_client.format_range(
                spreadsheet_id,
                worksheet.id,
                start_row - 1,  # Convert to 0-based index
                end_row,
                start_col - 1,  # Convert to 0-based index
                end_col,
                format_config
            )
            
            if not result.is_success:
                return OperationResult(
                    status=result.status,
                    message=result.message,
                    errors=result.errors
                )
            
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=True,
                message=f"Successfully formatted range {range_address}"
            )
            
        except Exception as e:
            error_msg = f"Error formatting range: {e}"
            self.logger.error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                data=False,
                message=error_msg,
                errors=[str(e)]
            )
    
    def get_sheet_permissions(self, spreadsheet_id: str) -> OperationResult[List[Dict[str, Any]]]:
        """Lấy thông tin quyền truy cập (requires Drive API)"""
        try:
            # This would require Drive API implementation
            return OperationResult(
                status=OperationStatus.FAILED,
                message="Get permissions requires Drive API implementation",
                errors=["NotImplementedError: Use Drive API to get permissions"]
            )
            
        except Exception as e:
            error_msg = f"Error getting permissions: {e}"
            self.logger.error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def share_spreadsheet(self, spreadsheet_id: str, email: str, role: str = "reader") -> OperationResult[bool]:
        """Chia sẻ spreadsheet với email được chỉ định"""
        try:
            self.logger.info(f"Sharing spreadsheet {spreadsheet_id} with {email} as {role}")
            
            result = self.sheets_client.share_spreadsheet(spreadsheet_id, email, role)
            if not result.is_success:
                return OperationResult(
                    status=result.status,
                    message=result.message,
                    errors=result.errors
                )
            
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
    
    # Helper methods
    def _parse_worksheet(self, sheet_data: Dict[str, Any]) -> Optional[Worksheet]:
        """Parse worksheet data từ Google Sheets API response"""
        try:
            properties = sheet_data.get('properties', {})
            grid_properties = properties.get('gridProperties', {})
            
            worksheet = Worksheet(
                id=properties.get('sheetId', 0),
                title=properties.get('title', 'Untitled'),
                index=properties.get('index', 0),
                row_count=grid_properties.get('rowCount', 1000),
                column_count=grid_properties.get('columnCount', 26),
                data_ranges=[],  # Will be populated separately if needed
                configuration=SheetConfiguration()  # Default configuration
            )
            
            return worksheet
            
        except Exception as e:
            self.logger.error(f"Error parsing worksheet data: {e}")
            return None
    
    def _parse_range_address(self, range_address: str) -> tuple:
        """Parse range address like 'A1:C10' to get start/end positions"""
        try:
            if ':' in range_address:
                start_cell, end_cell = range_address.split(':')
            else:
                start_cell = end_cell = range_address
            
            start_row, start_col = self._parse_cell_address(start_cell)
            end_row, end_col = self._parse_cell_address(end_cell)
            
            return start_row, start_col, end_row, end_col
            
        except Exception as e:
            self.logger.error(f"Error parsing range address {range_address}: {e}")
            return 1, 1, 1, 1  # Default to A1
    
    def _parse_cell_address(self, cell_address: str) -> tuple:
        """Parse cell address như 'A1' thành row, column numbers"""
        try:
            import re
            match = re.match(r'([A-Z]+)(\d+)', cell_address.upper())
            if not match:
                return 1, 1
            
            col_letters, row_str = match.groups()
            row = int(row_str)
            
            # Convert column letters to number
            col = 0
            for char in col_letters:
                col = col * 26 + (ord(char) - ord('A') + 1)
            
            return row, col
            
        except Exception as e:
            self.logger.error(f"Error parsing cell address {cell_address}: {e}")
            return 1, 1  # Default to A1

"""
Sheet Service - Application service cho Google Sheets operations
Provides high-level business operations on top of SheetRepository
"""
from typing import List, Optional, Dict, Any, Tuple
from pathlib import Path

from src.core.base import BaseService, OperationResult, OperationStatus
from src.domain.repositories.sheet_repository import SheetRepository
from src.domain.models.sheet_models import Spreadsheet, Worksheet, CellRange, Cell, SheetConfiguration
from src.domain.services.sheet_domain_service import SheetDomainService
from src.utils.logger import get_logger


class SheetService(BaseService):
    """Application service cho Google Sheets operations"""
    
    def __init__(self, sheet_repository: SheetRepository, logger=None):
        super().__init__(logger)
        self.sheet_repository = sheet_repository
        self.sheet_domain_service = SheetDomainService()
        self.logger = logger or get_logger(self.__class__.__name__)
    
    def create_variables_spreadsheet(self, name: str, variable_collections: List[str] = None) -> OperationResult[Spreadsheet]:
        """Tạo spreadsheet mới cho variables với worksheets được setup sẵn"""
        try:
            self.log_info(f"Creating variables spreadsheet '{name}' with collections: {variable_collections}")
            
            # Prepare worksheet names
            worksheets = []
            if variable_collections:
                worksheets.extend(variable_collections)
            else:
                worksheets = ["Variables"]  # Default worksheet
            
            # Add metadata worksheets
            worksheets.extend(["Settings", "Log"])
            
            # Create spreadsheet
            result = self.sheet_repository.create_spreadsheet(name, worksheets)
            if not result.is_success:
                return result
            
            spreadsheet = result.data
            
            # Setup each worksheet with appropriate headers and formatting
            for worksheet in spreadsheet.worksheets:
                if worksheet.title in (variable_collections or ["Variables"]):
                    setup_result = self._setup_variables_worksheet(spreadsheet.id, worksheet.title)
                    if not setup_result.is_success:
                        self.log_warning(f"Failed to setup worksheet {worksheet.title}: {setup_result.message}")
                
                elif worksheet.title == "Settings":
                    setup_result = self._setup_settings_worksheet(spreadsheet.id, worksheet.title)
                    if not setup_result.is_success:
                        self.log_warning(f"Failed to setup settings worksheet: {setup_result.message}")
                
                elif worksheet.title == "Log":
                    setup_result = self._setup_log_worksheet(spreadsheet.id, worksheet.title)
                    if not setup_result.is_success:
                        self.log_warning(f"Failed to setup log worksheet: {setup_result.message}")
            
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=spreadsheet,
                message=f"Successfully created and setup variables spreadsheet '{name}'",
                metadata={
                    "worksheets_created": len(worksheets),
                    "variable_collections": variable_collections or ["Variables"]
                }
            )
            
        except Exception as e:
            error_msg = f"Error creating variables spreadsheet: {e}"
            self.log_error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def update_variables_data(self, spreadsheet_id: str, worksheet_title: str, variables_data: List[Dict[str, Any]]) -> OperationResult[bool]:
        """Cập nhật dữ liệu variables vào worksheet"""
        try:
            self.log_info(f"Updating {len(variables_data)} variables in worksheet '{worksheet_title}'")
            
            # Validate input data
            validation_result = self.sheet_domain_service.validate_variables_data(variables_data)
            if not validation_result.is_success:
                return validation_result
            
            # Convert variables data to 2D array
            headers, rows = self._convert_variables_to_rows(variables_data)
            
            # Create full data array
            all_data = [headers] + rows
            
            # Create CellRange
            cell_range = CellRange(
                start_row=1,
                start_column=1,
                end_row=len(all_data),
                end_column=len(headers)
            )
            cell_range.set_values_2d(all_data)
            
            # Update range
            result = self.sheet_repository.update_range_values(spreadsheet_id, worksheet_title, cell_range)
            if not result.is_success:
                return result
            
            # Apply formatting
            format_result = self._apply_variables_formatting(spreadsheet_id, worksheet_title, len(all_data), len(headers))
            if not format_result.is_success:
                self.log_warning(f"Failed to apply formatting: {format_result.message}")
            
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=True,
                message=f"Successfully updated {len(variables_data)} variables",
                metadata={
                    "variables_count": len(variables_data),
                    "worksheet_title": worksheet_title,
                    "rows_updated": len(all_data)
                }
            )
            
        except Exception as e:
            error_msg = f"Error updating variables data: {e}"
            self.log_error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                data=False,
                message=error_msg,
                errors=[str(e)]
            )
    
    def get_variables_data(self, spreadsheet_id: str, worksheet_title: str) -> OperationResult[List[Dict[str, Any]]]:
        """Lấy dữ liệu variables từ worksheet"""
        try:
            self.log_info(f"Getting variables data from worksheet '{worksheet_title}'")
            
            # Get worksheet to determine data range
            worksheet_result = self.sheet_repository.get_worksheet(spreadsheet_id, worksheet_title)
            if not worksheet_result.is_success:
                return OperationResult(
                    status=worksheet_result.status,
                    message=worksheet_result.message,
                    errors=worksheet_result.errors
                )
            
            worksheet = worksheet_result.data
            
            # Get all data (assuming data starts from A1)
            range_address = f"A1:{self._column_number_to_letter(worksheet.column_count)}{worksheet.row_count}"
            
            range_result = self.sheet_repository.get_range_values(spreadsheet_id, worksheet_title, range_address)
            if not range_result.is_success:
                return OperationResult(
                    status=range_result.status,
                    message=range_result.message,
                    errors=range_result.errors
                )
            
            cell_range = range_result.data
            values = cell_range.get_values_2d()
            
            # Convert to variables data
            if not values or len(values) < 2:  # Need at least headers + 1 data row
                return OperationResult(
                    status=OperationStatus.SUCCESS,
                    data=[],
                    message="No variables data found"
                )
            
            headers = values[0]
            data_rows = values[1:]
            
            variables_data = []
            for row in data_rows:
                if not any(row):  # Skip empty rows
                    continue
                
                variable_dict = {}
                for i, header in enumerate(headers):
                    if i < len(row):
                        variable_dict[header] = row[i]
                    else:
                        variable_dict[header] = ""
                
                variables_data.append(variable_dict)
            
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=variables_data,
                message=f"Successfully retrieved {len(variables_data)} variables",
                metadata={
                    "variables_count": len(variables_data),
                    "headers": headers
                }
            )
            
        except Exception as e:
            error_msg = f"Error getting variables data: {e}"
            self.log_error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def append_variables_batch(self, spreadsheet_id: str, worksheet_title: str, variables_data: List[Dict[str, Any]]) -> OperationResult[bool]:
        """Thêm batch variables vào cuối worksheet"""
        try:
            self.log_info(f"Appending {len(variables_data)} variables to worksheet '{worksheet_title}'")
            
            # Convert to rows
            _, rows = self._convert_variables_to_rows(variables_data)
            
            # Append rows
            result = self.sheet_repository.append_rows(spreadsheet_id, worksheet_title, rows)
            if not result.is_success:
                return result
            
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=True,
                message=f"Successfully appended {len(variables_data)} variables"
            )
            
        except Exception as e:
            error_msg = f"Error appending variables: {e}"
            self.log_error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                data=False,
                message=error_msg,
                errors=[str(e)]
            )
    
    def create_backup(self, spreadsheet_id: str) -> OperationResult[Spreadsheet]:
        """Tạo backup của spreadsheet"""
        try:
            self.log_info(f"Creating backup of spreadsheet {spreadsheet_id}")
            
            # Get original spreadsheet
            original_result = self.sheet_repository.get_spreadsheet(spreadsheet_id)
            if not original_result.is_success:
                return OperationResult(
                    status=original_result.status,
                    message=original_result.message,
                    errors=original_result.errors
                )
            
            original = original_result.data
            
            # Create backup name with timestamp
            from datetime import datetime
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_name = f"{original.name}_backup_{timestamp}"
            
            # Create backup spreadsheet
            worksheet_titles = [ws.title for ws in original.worksheets]
            backup_result = self.sheet_repository.create_spreadsheet(backup_name, worksheet_titles)
            if not backup_result.is_success:
                return backup_result
            
            backup = backup_result.data
            
            # Copy data from each worksheet
            for original_ws in original.worksheets:
                # Get all data from original worksheet
                variables_result = self.get_variables_data(spreadsheet_id, original_ws.title)
                if variables_result.is_success and variables_result.data:
                    # Update backup worksheet with data
                    update_result = self.update_variables_data(backup.id, original_ws.title, variables_result.data)
                    if not update_result.is_success:
                        self.log_warning(f"Failed to copy data to backup worksheet {original_ws.title}")
            
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=backup,
                message=f"Successfully created backup '{backup_name}'"
            )
            
        except Exception as e:
            error_msg = f"Error creating backup: {e}"
            self.log_error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    def get_spreadsheet_statistics(self, spreadsheet_id: str) -> OperationResult[Dict[str, Any]]:
        """Lấy thống kê chi tiết của spreadsheet"""
        try:
            # Get spreadsheet
            spreadsheet_result = self.sheet_repository.get_spreadsheet(spreadsheet_id)
            if not spreadsheet_result.is_success:
                return OperationResult(
                    status=spreadsheet_result.status,
                    message=spreadsheet_result.message,
                    errors=spreadsheet_result.errors
                )
            
            spreadsheet = spreadsheet_result.data
            stats = self.sheet_domain_service.get_spreadsheet_statistics(spreadsheet)
            
            # Add detailed statistics for each worksheet
            worksheet_stats = {}
            for worksheet in spreadsheet.worksheets:
                variables_result = self.get_variables_data(spreadsheet_id, worksheet.title)
                if variables_result.is_success:
                    variables_data = variables_result.data
                    worksheet_stats[worksheet.title] = {
                        "variables_count": len(variables_data),
                        "row_count": worksheet.row_count,
                        "column_count": worksheet.column_count,
                        "has_data": len(variables_data) > 0
                    }
            
            stats["worksheets_detail"] = worksheet_stats
            
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=stats,
                message="Successfully retrieved spreadsheet statistics"
            )
            
        except Exception as e:
            error_msg = f"Error getting spreadsheet statistics: {e}"
            self.log_error(error_msg)
            return OperationResult(
                status=OperationStatus.FAILED,
                message=error_msg,
                errors=[str(e)]
            )
    
    # Private helper methods
    def _setup_variables_worksheet(self, spreadsheet_id: str, worksheet_title: str) -> OperationResult[bool]:
        """Setup variables worksheet với headers và formatting"""
        try:
            # Standard headers for variables
            headers = [
                "Name", "Type", "Variable Key", "Variable ID", 
                "Light Mode", "Light Mode Alias", 
                "Dark Mode", "Dark Mode Alias",
                "Description", "Last Modified"
            ]
            
            # Create header range
            cell_range = CellRange(start_row=1, start_column=1, end_row=1, end_column=len(headers))
            cell_range.set_values_2d([headers])
            
            # Update headers
            result = self.sheet_repository.update_range_values(spreadsheet_id, worksheet_title, cell_range)
            if not result.is_success:
                return result
            
            # Apply header formatting
            header_format = {
                "backgroundColor": {"red": 0.9, "green": 0.9, "blue": 1.0},
                "textFormat": {"bold": True},
                "horizontalAlignment": "CENTER"
            }
            
            format_result = self.sheet_repository.format_range(
                spreadsheet_id, worksheet_title, "A1:J1", header_format
            )
            
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=True,
                message=f"Successfully setup variables worksheet '{worksheet_title}'"
            )
            
        except Exception as e:
            return OperationResult(
                status=OperationStatus.FAILED,
                data=False,
                message=f"Error setting up variables worksheet: {e}",
                errors=[str(e)]
            )
    
    def _setup_settings_worksheet(self, spreadsheet_id: str, worksheet_title: str) -> OperationResult[bool]:
        """Setup settings worksheet"""
        try:
            settings_data = [
                ["Setting", "Value", "Description"],
                ["Sync Direction", "Figma → Sheets", "Direction of synchronization"],
                ["Auto Backup", "True", "Create backup before sync"],
                ["Conflict Resolution", "Manual", "How to handle conflicts"],
                ["Last Sync", "", "Timestamp of last sync"],
                ["Figma File ID", "", "Source Figma file ID"],
                ["Collection Filter", "", "Comma-separated collection names to sync"]
            ]
            
            cell_range = CellRange(start_row=1, start_column=1, end_row=len(settings_data), end_column=3)
            cell_range.set_values_2d(settings_data)
            
            return self.sheet_repository.update_range_values(spreadsheet_id, worksheet_title, cell_range)
            
        except Exception as e:
            return OperationResult(
                status=OperationStatus.FAILED,
                data=False,
                message=f"Error setting up settings worksheet: {e}",
                errors=[str(e)]
            )
    
    def _setup_log_worksheet(self, spreadsheet_id: str, worksheet_title: str) -> OperationResult[bool]:
        """Setup log worksheet"""
        try:
            log_headers = [
                ["Timestamp", "Action", "Status", "Details", "User"]
            ]
            
            cell_range = CellRange(start_row=1, start_column=1, end_row=1, end_column=5)
            cell_range.set_values_2d(log_headers)
            
            return self.sheet_repository.update_range_values(spreadsheet_id, worksheet_title, cell_range)
            
        except Exception as e:
            return OperationResult(
                status=OperationStatus.FAILED,
                data=False,
                message=f"Error setting up log worksheet: {e}",
                errors=[str(e)]
            )
    
    def _convert_variables_to_rows(self, variables_data: List[Dict[str, Any]]) -> Tuple[List[str], List[List[Any]]]:
        """Convert variables data to headers and rows format"""
        if not variables_data:
            return [], []
        
        # Extract all possible keys to create comprehensive headers
        all_keys = set()
        for var in variables_data:
            all_keys.update(var.keys())
        
        # Standard order for headers
        standard_headers = ["name", "type", "id", "key", "description", "collection"]
        headers = []
        
        # Add standard headers first
        for header in standard_headers:
            if header in all_keys:
                headers.append(header)
                all_keys.remove(header)
        
        # Add remaining headers
        headers.extend(sorted(all_keys))
        
        # Convert to rows
        rows = []
        for var in variables_data:
            row = []
            for header in headers:
                value = var.get(header, "")
                # Handle complex values
                if isinstance(value, dict):
                    row.append(str(value))
                elif isinstance(value, list):
                    row.append(", ".join(str(item) for item in value))
                else:
                    row.append(str(value) if value is not None else "")
            rows.append(row)
        
        return headers, rows
    
    def _apply_variables_formatting(self, spreadsheet_id: str, worksheet_title: str, row_count: int, col_count: int) -> OperationResult[bool]:
        """Apply formatting to variables data"""
        try:
            # This would implement various formatting rules
            # For now, just apply basic formatting to headers
            header_format = {
                "backgroundColor": {"red": 0.85, "green": 0.85, "blue": 0.95},
                "textFormat": {"bold": True}
            }
            
            return self.sheet_repository.format_range(
                spreadsheet_id, worksheet_title, "A1:Z1", header_format
            )
            
        except Exception as e:
            return OperationResult(
                status=OperationStatus.FAILED,
                data=False,
                message=f"Error applying formatting: {e}",
                errors=[str(e)]
            )
    
    def _column_number_to_letter(self, column_number: int) -> str:
        """Convert column number to letter (1=A, 2=B, ..., 27=AA)"""
        result = ""
        while column_number > 0:
            column_number -= 1
            result = chr(ord('A') + column_number % 26) + result
            column_number //= 26
        return result

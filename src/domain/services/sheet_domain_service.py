"""
Google Sheets Domain Service cho business logic
"""
from typing import List, Optional, Dict, Any, Tuple

from ..models.sheet_models import Spreadsheet, Worksheet, CellRange, Cell, SheetConfiguration
from src.core.exceptions import ValidationError


class SheetDomainService:
    """Domain service cho Google Sheets business logic"""
    
    def validate_spreadsheet(self, spreadsheet: Spreadsheet) -> bool:
        """Validate Spreadsheet"""
        errors = []
        
        if not spreadsheet.id or not spreadsheet.id.strip():
            errors.append("Spreadsheet ID không được rỗng")
        
        if not spreadsheet.name or not spreadsheet.name.strip():
            errors.append("Spreadsheet name không được rỗng")
        
        if not spreadsheet.url or not spreadsheet.url.strip():
            errors.append("Spreadsheet URL không được rỗng")
        
        # Validate worksheets
        for worksheet in spreadsheet.worksheets:
            try:
                self.validate_worksheet(worksheet)
            except ValidationError as e:
                errors.extend([f"Worksheet {worksheet.title}: {err}" for err in e.errors])
        
        if errors:
            raise ValidationError("Spreadsheet validation failed", errors)
        
        return True
    
    def validate_worksheet(self, worksheet: Worksheet) -> bool:
        """Validate Worksheet"""
        errors = []
        
        if worksheet.id is None or worksheet.id < 0:
            errors.append("Worksheet ID phải là số không âm")
        
        if not worksheet.title or not worksheet.title.strip():
            errors.append("Worksheet title không được rỗng")
        
        if worksheet.index < 0:
            errors.append("Worksheet index phải là số không âm")
        
        # Validate tên worksheet không chứa ký tự cấm
        forbidden_chars = ['[', ']', '*', '?', ':', '\\', '/']
        if any(char in worksheet.title for char in forbidden_chars):
            errors.append(f"Worksheet title không được chứa các ký tự: {forbidden_chars}")
        
        # Validate data ranges
        for cell_range in worksheet.data_ranges:
            try:
                self.validate_cell_range(cell_range)
            except ValidationError as e:
                errors.extend([f"Range {cell_range.range_address}: {err}" for err in e.errors])
        
        if errors:
            raise ValidationError("Worksheet validation failed", errors)
        
        return True
    
    def validate_cell_range(self, cell_range: CellRange) -> bool:
        """Validate CellRange"""
        errors = []
        
        if cell_range.start_row <= 0 or cell_range.start_column <= 0:
            errors.append("Start row và column phải lớn hơn 0")
        
        if cell_range.end_row < cell_range.start_row:
            errors.append("End row phải lớn hơn hoặc bằng start row")
        
        if cell_range.end_column < cell_range.start_column:
            errors.append("End column phải lớn hơn hoặc bằng start column")
        
        # Kiểm tra kích thước range không quá lớn
        max_cells = 1000000  # 1 triệu cells
        total_cells = cell_range.row_count * cell_range.column_count
        if total_cells > max_cells:
            errors.append(f"Range quá lớn: {total_cells} cells (max: {max_cells})")
        
        if errors:
            raise ValidationError("Cell range validation failed", errors)
        
        return True
    
    def calculate_optimal_range_for_data(self, data: List[List[Any]], start_row: int = 1, start_col: int = 1) -> CellRange:
        """Tính toán range tối ưu cho dữ liệu"""
        if not data or not data[0]:
            raise ValueError("Data không được rỗng")
        
        num_rows = len(data)
        num_cols = max(len(row) for row in data) if data else 0
        
        end_row = start_row + num_rows - 1
        end_col = start_col + num_cols - 1
        
        cell_range = CellRange(
            start_row=start_row,
            start_column=start_col,
            end_row=end_row,
            end_column=end_col
        )
        
        # Set data vào range
        cell_range.set_values_2d(data)
        
        return cell_range
    
    def suggest_worksheet_name(self, base_name: str, existing_names: List[str]) -> str:
        """Gợi ý tên worksheet không trùng lập"""
        if base_name not in existing_names:
            return base_name
        
        # Thử thêm số vào cuối
        counter = 1
        while f"{base_name}_{counter}" in existing_names:
            counter += 1
        
        return f"{base_name}_{counter}"
    
    def can_merge_ranges(self, range1: CellRange, range2: CellRange) -> Dict[str, Any]:
        """Kiểm tra xem có thể merge 2 ranges không"""
        result = {
            "can_merge": False,
            "merge_type": None,
            "suggested_range": None
        }
        
        # Kiểm tra liền kề theo hàng
        if (range1.start_column == range2.start_column and 
            range1.end_column == range2.end_column):
            
            if range1.end_row + 1 == range2.start_row:
                # range2 liền kề dưới range1
                result["can_merge"] = True
                result["merge_type"] = "vertical"
                result["suggested_range"] = CellRange(
                    start_row=range1.start_row,
                    start_column=range1.start_column,
                    end_row=range2.end_row,
                    end_column=range1.end_column
                )
            elif range2.end_row + 1 == range1.start_row:
                # range1 liền kề dưới range2
                result["can_merge"] = True
                result["merge_type"] = "vertical"
                result["suggested_range"] = CellRange(
                    start_row=range2.start_row,
                    start_column=range2.start_column,
                    end_row=range1.end_row,
                    end_column=range2.end_column
                )
        
        # Kiểm tra liền kề theo cột
        elif (range1.start_row == range2.start_row and 
              range1.end_row == range2.end_row):
            
            if range1.end_column + 1 == range2.start_column:
                # range2 liền kề bên phải range1
                result["can_merge"] = True
                result["merge_type"] = "horizontal"
                result["suggested_range"] = CellRange(
                    start_row=range1.start_row,
                    start_column=range1.start_column,
                    end_row=range1.end_row,
                    end_column=range2.end_column
                )
            elif range2.end_column + 1 == range1.start_column:
                # range1 liền kề bên phải range2
                result["can_merge"] = True
                result["merge_type"] = "horizontal"
                result["suggested_range"] = CellRange(
                    start_row=range2.start_row,
                    start_column=range2.start_column,
                    end_row=range2.end_row,
                    end_column=range1.end_column
                )
        
        return result
    
    def get_spreadsheet_statistics(self, spreadsheet: Spreadsheet) -> Dict[str, Any]:
        """Lấy thống kê của spreadsheet"""
        stats = {
            "total_worksheets": spreadsheet.worksheet_count,
            "worksheets": [],
            "total_cells": 0,
            "total_ranges": 0
        }
        
        for worksheet in spreadsheet.worksheets:
            worksheet_stats = {
                "title": worksheet.title,
                "id": worksheet.id,
                "row_count": worksheet.row_count,
                "column_count": worksheet.column_count,
                "total_cells": worksheet.row_count * worksheet.column_count,
                "data_ranges": len(worksheet.data_ranges)
            }
            
            stats["worksheets"].append(worksheet_stats)
            stats["total_cells"] += worksheet_stats["total_cells"]
            stats["total_ranges"] += worksheet_stats["data_ranges"]
        
        return stats
    
    def suggest_sheet_configuration(self, data_type: str, row_count: int, col_count: int) -> SheetConfiguration:
        """Gợi ý cấu hình sheet dựa trên loại dữ liệu"""
        config = SheetConfiguration()
        
        if data_type == "variables":
            # Cấu hình cho dữ liệu variables
            config.frozen_rows = 1  # Freeze header row
            config.frozen_columns = 2  # Freeze name và type columns
            config.auto_resize_columns = True
            
        elif data_type == "mapping":
            # Cấu hình cho dữ liệu mapping
            config.frozen_rows = 1
            config.frozen_columns = 3  # Freeze source, target, status columns
            
        elif data_type == "log":
            # Cấu hình cho dữ liệu log
            config.frozen_rows = 1
            config.frozen_columns = 1  # Freeze timestamp column
            config.default_column_width = 150
        
        # Điều chỉnh dựa trên kích thước
        if col_count > 10:
            config.default_column_width = 120  # Thu nhỏ cột nếu có nhiều cột
        
        if row_count > 1000:
            config.default_row_height = 25  # Thu nhỏ hàng nếu có nhiều hàng
        
        return config
    
    def detect_data_conflicts(self, existing_range: CellRange, new_data: List[List[Any]]) -> List[Dict[str, Any]]:
        """Phát hiện conflicts giữa dữ liệu hiện tại và dữ liệu mới"""
        conflicts = []
        
        existing_data = existing_range.get_values_2d()
        
        min_rows = min(len(existing_data), len(new_data))
        
        for row_idx in range(min_rows):
            existing_row = existing_data[row_idx] if row_idx < len(existing_data) else []
            new_row = new_data[row_idx] if row_idx < len(new_data) else []
            
            min_cols = min(len(existing_row), len(new_row))
            
            for col_idx in range(min_cols):
                existing_value = existing_row[col_idx] if col_idx < len(existing_row) else None
                new_value = new_row[col_idx] if col_idx < len(new_row) else None
                
                if existing_value != new_value and existing_value is not None:
                    conflicts.append({
                        "row": row_idx + existing_range.start_row,
                        "column": col_idx + existing_range.start_column,
                        "existing_value": existing_value,
                        "new_value": new_value,
                        "cell_address": Cell(row_idx + existing_range.start_row, col_idx + existing_range.start_column).address
                    })
        
        return conflicts

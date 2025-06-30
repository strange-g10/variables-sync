"""
Google Sheets domain models
"""
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any, Tuple
from enum import Enum
from datetime import datetime


class CellType(Enum):
    """Loại dữ liệu trong cell"""
    STRING = "STRING"
    NUMBER = "NUMBER"
    BOOLEAN = "BOOLEAN"
    FORMULA = "FORMULA"
    DATE = "DATE"
    EMPTY = "EMPTY"


@dataclass
class Cell:
    """Một cell trong Google Sheets"""
    row: int
    column: int
    value: Any = None
    formula: str = ""
    cell_type: CellType = CellType.EMPTY
    formatted_value: str = ""
    note: str = ""
    
    @property
    def address(self) -> str:
        """Địa chỉ cell (ví dụ: A1, B2)"""
        return f"{self._column_to_letter(self.column)}{self.row}"
    
    @property
    def display_value(self) -> str:
        """Giá trị hiển thị"""
        return self.formatted_value or str(self.value) if self.value is not None else ""
    
    def _column_to_letter(self, column: int) -> str:
        """Chuyển đổi số cột thành chữ cái (1->A, 2->B, 27->AA)"""
        result = ""
        while column > 0:
            column -= 1
            result = chr(column % 26 + ord('A')) + result
            column //= 26
        return result
    
    def set_value(self, value: Any, cell_type: CellType = None):
        """Set giá trị cho cell"""
        self.value = value
        if cell_type:
            self.cell_type = cell_type
        elif value is None:
            self.cell_type = CellType.EMPTY
        elif isinstance(value, str):
            self.cell_type = CellType.STRING
        elif isinstance(value, (int, float)):
            self.cell_type = CellType.NUMBER
        elif isinstance(value, bool):
            self.cell_type = CellType.BOOLEAN
        
        self.formatted_value = str(value) if value is not None else ""
    
    def __str__(self) -> str:
        return f"Cell({self.address}: {self.display_value})"


@dataclass
class CellRange:
    """Một vùng cells trong Google Sheets"""
    start_row: int
    start_column: int
    end_row: int
    end_column: int
    cells: List[List[Cell]] = field(default_factory=list)
    
    def __post_init__(self):
        """Khởi tạo cells nếu chưa có"""
        if not self.cells:
            self._initialize_cells()
    
    def _initialize_cells(self):
        """Khởi tạo ma trận cells trống"""
        self.cells = []
        for row in range(self.start_row, self.end_row + 1):
            cell_row = []
            for col in range(self.start_column, self.end_column + 1):
                cell_row.append(Cell(row=row, column=col))
            self.cells.append(cell_row)
    
    @property
    def range_address(self) -> str:
        """Địa chỉ range (ví dụ: A1:C5)"""
        start_cell = Cell(self.start_row, self.start_column)
        end_cell = Cell(self.end_row, self.end_column)
        return f"{start_cell.address}:{end_cell.address}"
    
    def get_address(self) -> str:
        """Alias for range_address property"""
        return self.range_address
    
    @property
    def row_count(self) -> int:
        """Số lượng hàng"""
        return self.end_row - self.start_row + 1
    
    @property
    def column_count(self) -> int:
        """Số lượng cột"""
        return self.end_column - self.start_column + 1
    
    def get_cell(self, row: int, column: int) -> Optional[Cell]:
        """Lấy cell tại vị trí cụ thể"""
        if (self.start_row <= row <= self.end_row and 
            self.start_column <= column <= self.end_column):
            row_idx = row - self.start_row
            col_idx = column - self.start_column
            return self.cells[row_idx][col_idx]
        return None
    
    def set_cell_value(self, row: int, column: int, value: Any):
        """Set giá trị cho cell tại vị trí cụ thể"""
        cell = self.get_cell(row, column)
        if cell:
            cell.set_value(value)
    
    def get_values_2d(self) -> List[List[Any]]:
        """Lấy giá trị dưới dạng ma trận 2D"""
        return [[cell.value for cell in row] for row in self.cells]
    
    def set_values_2d(self, values: List[List[Any]]):
        """Set giá trị từ ma trận 2D"""
        for i, row_values in enumerate(values):
            if i < len(self.cells):
                for j, value in enumerate(row_values):
                    if j < len(self.cells[i]):
                        self.cells[i][j].set_value(value)
    
    def __str__(self) -> str:
        return f"CellRange({self.range_address})"


@dataclass
class SheetConfiguration:
    """Cấu hình cho một worksheet"""
    frozen_rows: int = 0
    frozen_columns: int = 0
    default_row_height: int = 30
    default_column_width: int = 200
    header_row_color: Tuple[int, int, int] = (200, 200, 200)
    even_row_color: Tuple[int, int, int] = (240, 240, 240)
    odd_row_color: Tuple[int, int, int] = (255, 255, 255)
    auto_resize_columns: bool = True
    show_gridlines: bool = True
    
    def to_dict(self) -> Dict[str, Any]:
        """Chuyển đổi thành dict để gửi API"""
        return {
            "frozenRowCount": self.frozen_rows,
            "frozenColumnCount": self.frozen_columns,
            "defaultRowHeight": self.default_row_height,
            "defaultColumnWidth": self.default_column_width,
            "showGridlines": self.show_gridlines
        }


@dataclass
class Worksheet:
    """Một worksheet trong Google Sheets"""
    id: int
    title: str
    index: int
    sheet_type: str = "GRID"
    grid_properties: Dict[str, Any] = field(default_factory=dict)
    configuration: SheetConfiguration = field(default_factory=SheetConfiguration)
    data_ranges: List[CellRange] = field(default_factory=list)
    last_modified: Optional[datetime] = None
    
    def __init__(self, id: int, title: str, index: int, sheet_type: str = "GRID", 
                 row_count: int = None, column_count: int = None, 
                 grid_properties: Dict[str, Any] = None, 
                 configuration: SheetConfiguration = None,
                 data_ranges: List[CellRange] = None,
                 last_modified: Optional[datetime] = None):
        self.id = id
        self.title = title
        self.index = index
        self.sheet_type = sheet_type
        self.grid_properties = grid_properties or {}
        
        # Handle row_count and column_count parameters
        if row_count is not None:
            self.grid_properties['rowCount'] = row_count
        if column_count is not None:
            self.grid_properties['columnCount'] = column_count
            
        self.configuration = configuration or SheetConfiguration()
        self.data_ranges = data_ranges or []
        self.last_modified = last_modified
    
    @property
    def row_count(self) -> int:
        """Số lượng hàng"""
        return self.grid_properties.get('rowCount', 1000)
    
    @property
    def column_count(self) -> int:
        """Số lượng cột"""
        return self.grid_properties.get('columnCount', 26)
    
    def add_data_range(self, cell_range: CellRange):
        """Thêm vùng dữ liệu"""
        self.data_ranges.append(cell_range)
    
    def get_range(self, start_row: int, start_col: int, end_row: int, end_col: int) -> CellRange:
        """Tạo và trả về một range mới"""
        return CellRange(start_row, start_col, end_row, end_col)
    
    def get_range_by_address(self, range_address: str) -> CellRange:
        """Tạo range từ địa chỉ (ví dụ: A1:C5)"""
        # Parse range address (simplified implementation)
        parts = range_address.split(':')
        if len(parts) != 2:
            raise ValueError(f"Invalid range address: {range_address}")
        
        start_cell = self._parse_cell_address(parts[0])
        end_cell = self._parse_cell_address(parts[1])
        
        return CellRange(
            start_row=start_cell[0],
            start_column=start_cell[1],
            end_row=end_cell[0],
            end_column=end_cell[1]
        )
    
    def _parse_cell_address(self, address: str) -> Tuple[int, int]:
        """Parse địa chỉ cell thành (row, column)"""
        import re
        match = re.match(r'([A-Z]+)(\d+)', address.upper())
        if not match:
            raise ValueError(f"Invalid cell address: {address}")
        
        col_letters = match.group(1)
        row_number = int(match.group(2))
        
        # Convert column letters to number
        col_number = 0
        for char in col_letters:
            col_number = col_number * 26 + (ord(char) - ord('A') + 1)
        
        return row_number, col_number
    
    def __str__(self) -> str:
        return f"Worksheet({self.title}, {self.row_count}x{self.column_count})"


@dataclass
class Spreadsheet:
    """Một Google Spreadsheet"""
    id: str
    name: str
    url: str
    worksheets: List[Worksheet] = field(default_factory=list)
    created_time: Optional[datetime] = None
    modified_time: Optional[datetime] = None
    permissions: Dict[str, Any] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def get_worksheet_by_id(self, worksheet_id: int) -> Optional[Worksheet]:
        """Tìm worksheet theo ID"""
        return next((ws for ws in self.worksheets if ws.id == worksheet_id), None)
    
    def get_worksheet_by_title(self, title: str) -> Optional[Worksheet]:
        """Tìm worksheet theo tên"""
        return next((ws for ws in self.worksheets if ws.title == title), None)
    
    def add_worksheet(self, worksheet: Worksheet):
        """Thêm worksheet"""
        # Kiểm tra không trùng ID
        if any(ws.id == worksheet.id for ws in self.worksheets):
            raise ValueError(f"Worksheet {worksheet.id} đã tồn tại")
        
        # Kiểm tra không trùng tên
        if any(ws.title == worksheet.title for ws in self.worksheets):
            raise ValueError(f"Worksheet '{worksheet.title}' đã tồn tại")
        
        self.worksheets.append(worksheet)
    
    def remove_worksheet(self, worksheet_id: int) -> bool:
        """Xóa worksheet theo ID"""
        for i, ws in enumerate(self.worksheets):
            if ws.id == worksheet_id:
                del self.worksheets[i]
                return True
        return False
    
    @property
    def worksheet_count(self) -> int:
        """Số lượng worksheets"""
        return len(self.worksheets)
    
    def __str__(self) -> str:
        return f"Spreadsheet({self.name}, {self.worksheet_count} worksheets)"


@dataclass
class GoogleSheet:
    """Aggregate root cho Google Sheets domain"""
    spreadsheets: List[Spreadsheet] = field(default_factory=list)
    
    def add_spreadsheet(self, spreadsheet: Spreadsheet):
        """Thêm spreadsheet"""
        # Kiểm tra không trùng ID
        if any(s.id == spreadsheet.id for s in self.spreadsheets):
            raise ValueError(f"Spreadsheet {spreadsheet.id} đã tồn tại")
        
        self.spreadsheets.append(spreadsheet)
    
    def get_spreadsheet_by_id(self, spreadsheet_id: str) -> Optional[Spreadsheet]:
        """Tìm spreadsheet theo ID"""
        return next((s for s in self.spreadsheets if s.id == spreadsheet_id), None)
    
    def get_spreadsheet_by_name(self, name: str) -> Optional[Spreadsheet]:
        """Tìm spreadsheet theo tên"""
        return next((s for s in self.spreadsheets if s.name == name), None)
    
    @property
    def total_spreadsheet_count(self) -> int:
        """Tổng số spreadsheets"""
        return len(self.spreadsheets)
    
    def __str__(self) -> str:
        return f"GoogleSheet({self.total_spreadsheet_count} spreadsheets)"

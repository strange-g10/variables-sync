# Node Export Feature Documentation

## Tổng quan

Tính năng **Export Selected Nodes** cho phép export dữ liệu Node ID của các đối tượng được chọn trong Figma. Tính năng này sử dụng cơ chế rà soát được cấu hình bằng cú pháp config trên UI, tương tự như script `collect_node_ids.py`.

## Tính năng chính

### 1. Export Node IDs từ vùng đã chọn
- Chọn nodes trong Figma 
- Áp dụng patterns để lọc và sắp xếp nodes
- Export thành file JSON với cấu trúc có tổ chức

### 2. Cấu hình linh hoạt qua UI
- **Root Pattern**: Regex để match containers cha
- **Sort Groups**: Danh sách patterns để match và sắp xếp nodes con
- **Range Support**: Hỗ trợ cấu trúc grid (bảng, button groups)

### 3. Tích hợp với logic từ `collect_node_ids.py`
- Sử dụng cùng logic traverse và collect
- Tương thích với `naming_config.json`
- Hỗ trợ range-based sorting

## Cách sử dụng

### Bước 1: Chọn nodes trong Figma
```
Chọn các nodes hoặc containers chứa cấu trúc bạn muốn export
```

### Bước 2: Mở cấu hình
```
1. Mở plugin Variables Sync
2. Click tab "Export"
3. Click button "Export Selected Nodes"
```

### Bước 3: Cấu hình patterns
```
Root Pattern: Role-Body-\\d+|Block-\\d+
Sort Groups:
  - Row_\\d+_Text_Col_ (with range 1-10 rows, 1-4 cols)
  - Row_\\d+_Visible_Col_ (with range 1-10 rows, 1-4 cols)  
  - Title
  - Item \\d+
```

### Bước 4: Export
```
Click "Apply & Export" để tạo file JSON
```

## Cấu trúc Output

```json
{
  "fileName": "MyFigmaFile",
  "selectionCount": 2,
  "roots": {
    "Role-Body-1": {
      "type": "tree",
      "nodes": [
        {
          "name": "Row_1_Text_Col_1",
          "id": "123:456",
          "type": "TEXT"
        },
        {
          "name": "Row_1_Text_Col_2", 
          "id": "123:457",
          "type": "TEXT"
        }
      ]
    }
  }
}
```

## Cấu hình Pattern

### Root Pattern
Regex để identify containers cha:
```
Role-Body-\\d+     # Matches Role-Body-1, Role-Body-2
Block-\\d+         # Matches Block-1, Block-2
Card-\\d+|Comp-\\d+ # Matches Card-1 or Comp-1
```

### Sort Groups

#### Simple Prefix
```json
{
  "prefix": "Title"
}
```
Matches exact "Title" nodes.

#### Regex Prefix
```json
{
  "prefix": "Item \\d+"
}
```
Matches "Item 1", "Item 2", etc.

#### Range-based
```json
{
  "prefix": "Row_\\d+_Text_Col_",
  "range": {
    "rows": [1, 10],
    "cols": [1, 4]
  }
}
```
Matches grid pattern:
- Row_1_Text_Col_1, Row_1_Text_Col_2, ..., Row_1_Text_Col_4
- Row_2_Text_Col_1, Row_2_Text_Col_2, ..., Row_2_Text_Col_4
- ...
- Row_10_Text_Col_1, ..., Row_10_Text_Col_4

## Ví dụ thực tế

### Cấu hình cho bảng dữ liệu
```
Root Pattern: Role-Body-\\d+
Sort Groups:
  1. Text columns: Row_\\d+_Text_Col_ (range: rows 1-10, cols 1-4)
  2. Visibility: Row_\\d+_Visible_Col_ (range: rows 1-10, cols 1-4)
```

### Cấu hình cho danh sách items
```
Root Pattern: Block-\\d+
Sort Groups:
  1. Title
  2. Item \\d+
```

### Cấu hình cho card components
```
Root Pattern: Card-\\d+
Sort Groups:
  1. Header
  2. Content  
  3. Footer
  4. Button_\\d+ (range: rows 1-1, cols 1-3)
```

## So sánh với collect_node_ids.py

| Aspect | collect_node_ids.py | Plugin Feature |
|--------|-------------------|----------------|
| Input | JSON file từ Figma API | Selected nodes trong Figma |
| Config | Static JSON file | Dynamic UI config |
| Output | File JSON trên disk | Download JSON từ browser |
| Usage | Command line script | Figma plugin UI |
| Performance | Batch processing | Real-time processing |

## Implementation Details

### Files thêm mới:
- `src/features/export/selectedNodes.ts` - Main export logic
- `src/ui/components/nodeExportUI.ts` - UI components
- `src/features/types.ts` - Updated với NodeExportConfig
- `src/ui/styles/main.css` - Modal styling

### Logic chính:
1. **collectSortedNodes()**: Traverse node tree và collect theo patterns
2. **exportSelectedNodes()**: Main export function
3. **initializeNodeExportUI()**: UI initialization và event handling

### Integration points:
- Message handling trong `src/index.ts`
- UI initialization trong `src/ui/ui.ts`
- Type definitions trong `src/features/types.ts`

## Best Practices

### 1. Pattern Design
- Sử dụng regex cụ thể để tránh false positives
- Test patterns với naming conventions thực tế
- Combine multiple patterns với `|` operator

### 2. Range Usage
- Sử dụng ranges cho grid structures
- Thiết lập range bounds phù hợp với dữ liệu thực tế
- Tránh ranges quá lớn ảnh hưởng performance

### 3. Selection Strategy
- Select containers cha chứa cấu trúc mong muốn
- Tránh select nodes con lẻ tẻ
- Kiểm tra selection trước khi export

## Troubleshooting

### Lỗi thường gặp:

1. **"No nodes selected"**
   - Chọn ít nhất 1 node trước khi export

2. **"No matching nodes found"**
   - Kiểm tra root pattern có match với node names
   - Kiểm tra sort group patterns có chính xác

3. **Missing nodes trong output**
   - Kiểm tra prefix patterns
   - Xem log để debug matching process

4. **Performance issues**
   - Giảm range bounds
   - Chọn ít nodes hơn trong một lần export
   - Simplify regex patterns

## Future Enhancements

1. **Preset Configurations**: Save/load config presets
2. **Batch Export**: Export multiple selections với configs khác nhau
3. **Pattern Validation**: Real-time validation của regex patterns
4. **Preview Mode**: Preview matches trước khi export
5. **Integration**: Sync với external systems như Google Sheets

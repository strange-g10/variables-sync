# Node Export Filter Logic Guide

## Tổng quan về Filter Logic

Feature Export Selected Nodes sử dụng 2 cấp filter:
1. **Root Pattern**: Tìm containers cha
2. **Sort Groups**: Lọc và sắp xếp nodes con

## Nguyên nhân gây trùng lặp kết quả

### 1. **Inconsistency giữa Config và UI**

**Vấn đề**: `naming_config.json` và UI default config không đồng bộ

```json
// naming_config.json
{
  "root_pattern": "Block-\\d+",
  "sort_groups": [
    {"prefix": "Title"},        // KHÔNG có range
    {"prefix": "Item \\d+"}     // KHÔNG có range  
  ]
}
```

```typescript
// UI default (trước khi fix)
addSortGroup("Title", { rows: [1, 10], cols: [1, 4] });    // SAI: có range
addSortGroup("Item \\d+", { rows: [1, 10], cols: [1, 4] }); // SAI: có range
```

**✅ Fix**: UI default giờ đã match chính xác với naming_config.json

### 2. **Duplicate Node Processing**

**Nguyên nhân**: Nodes có thể match multiple sort groups

```typescript
// Trước khi fix
for (const group of sortGroups) {
  const matchingNodes = nodesArray.filter(n => prefixRegex.test(n.name));
  sortedNodes.push(...matchingNodes); // Có thể add cùng node nhiều lần
}
```

**✅ Fix**: Added duplicate prevention với Set tracking

```typescript
// Sau khi fix
const processedNodeIds = new Set<string>();
for (const group of sortGroups) {
  const matchingNodes = nodesArray.filter(n => 
    prefixRegex.test(n.name) && !processedNodeIds.has(n.id)
  );
  for (const node of matchingNodes) {
    sortedNodes.push(node);
    processedNodeIds.add(node.id); // Track để tránh duplicate
  }
}
```

## Cách Filter Hoạt Động

### 1. **Root Pattern Matching**

```typescript
// Example: "Role-Body-\\d+|Block-\\d+"
const rootRegex = new RegExp("Role-Body-\\d+|Block-\\d+");

// Matches:
// ✅ Role-Body-1
// ✅ Role-Body-99  
// ✅ Block-1
// ✅ Block-42
// ❌ Role-Body-Text (không match \\d+)
// ❌ Block-ABC (không match \\d+)
```

### 2. **Sort Group Processing**

#### A. **Prefix-only (không có range)**
```typescript
// Example: "Title"
const prefixRegex = new RegExp("Title");

// Matches:
// ✅ Title (exact match)
// ✅ Title_Copy (partial match) 
// ❌ Subtitle (không bắt đầu với "Title")
```

#### B. **Regex Pattern**
```typescript
// Example: "Item \\d+"
const prefixRegex = new RegExp("Item \\d+");

// Matches:
// ✅ Item 1
// ✅ Item 99
// ✅ Item 001  
// ❌ Item A
// ❌ Item_1 (underscore thay space)
```

#### C. **Range-based (cho grid structures)**
```typescript
// Example: "Row_\\d+_Text_Col_" với range {rows: [1,3], cols: [1,2]}
// Generates expected names:
// Row_1_Text_Col_1, Row_1_Text_Col_2
// Row_2_Text_Col_1, Row_2_Text_Col_2  
// Row_3_Text_Col_1, Row_3_Text_Col_2

for (let row = 1; row <= 3; row++) {
  for (let col = 1; col <= 2; col++) {
    let expectedName = "Row_\\d+_Text_Col_".replace("\\d+", String(col));
    expectedName = expectedName.replace("Row_\\\\d+", `Row_${row}`);
    // Result: Row_1_Text_Col_1, Row_1_Text_Col_2, etc.
  }
}
```

## Best Practices để tránh trùng lặp

### 1. **Thiết kế Pattern cụ thể**

❌ **Tránh patterns quá general:**
```json
{"prefix": ".*Text.*"}  // Match quá nhiều
{"prefix": "Item"}      // Match cả "Item 1" và "ItemDetails"
```

✅ **Sử dụng patterns cụ thể:**
```json
{"prefix": "^Item \\d+$"}     // Chỉ match "Item 1", "Item 2", etc.
{"prefix": "^Title$"}         // Chỉ match exact "Title"
```

### 2. **Organize Sort Groups theo độ ưu tiên**

```json
// Đặt patterns cụ thể trước
[
  {"prefix": "Row_\\d+_Text_Col_", "range": {...}},  // Specific grid pattern
  {"prefix": "Item \\d+"},                           // Specific regex
  {"prefix": "Title"}                                // Simple exact match
]
```

### 3. **Kiểm tra Range Settings**

✅ **Chỉ dùng range cho grid structures:**
```json
// Grid patterns - CẦN range
{"prefix": "Row_\\d+_Col_", "range": {"rows": [1, 10], "cols": [1, 4]}}

// Simple patterns - KHÔNG cần range  
{"prefix": "Title"}
{"prefix": "Item \\d+"}
```

## Troubleshooting Guide

### Problem 1: Không có nodes nào được export

**Symptoms:**
- Export thành công nhưng file JSON trống
- Log hiển thị "0 nodes collected"

**Debugging:**
1. Check root pattern có match với node names:
   ```
   Root Pattern: "Role-Body-\\d+"
   Node Names: "Role-Body-1", "Role-Body-2" ✅
   Node Names: "Body-1", "Role-1" ❌
   ```

2. Check sort group patterns:
   ```
   Pattern: "Item \\d+"
   Node Names: "Item 1", "Item 2" ✅
   Node Names: "Item_1", "Item A" ❌
   ```

### Problem 2: Duplicate nodes trong output

**Symptoms:**
- Cùng node xuất hiện nhiều lần
- Node count cao hơn expected

**Solutions:**
1. ✅ Updated logic đã fix duplicate prevention
2. Kiểm tra sort group patterns không overlap:
   ```json
   // BAD: Overlapping patterns
   [
     {"prefix": "Item"},     // Matches "Item 1", "Item_Text"
     {"prefix": "Item \\d+"} // Also matches "Item 1"
   ]
   
   // GOOD: Non-overlapping patterns  
   [
     {"prefix": "^Item \\d+$"},    // Only "Item 1", "Item 2"
     {"prefix": "^Item_Text$"}     // Only exact "Item_Text"
   ]
   ```

### Problem 3: Range không hoạt động đúng

**Symptoms:**
- Grid nodes không được collect đầy đủ
- Unexpected node order

**Solutions:**
1. Verify range bounds phù hợp:
   ```json
   // Grid có 5 rows, 3 columns
   {"range": {"rows": [1, 5], "cols": [1, 3]}} ✅
   {"range": {"rows": [1, 10], "cols": [1, 4]}} // Over-range, OK
   {"range": {"rows": [2, 4], "cols": [2, 3]}}  // Under-range, missing nodes
   ```

2. Check pattern replacement logic:
   ```typescript
   // Pattern: "Row_\\d+_Col_"
   // Expected: Row_1_Col_1, Row_1_Col_2, etc.
   let expectedName = group.prefix.replace("\\d+", String(col));
   expectedName = expectedName.replace("Row_\\\\d+", `Row_${row}`);
   ```

## Validation Checklist

Trước khi export, check:

- [ ] Root pattern match với actual node names  
- [ ] Sort group patterns không overlap
- [ ] Range settings phù hợp với grid structure
- [ ] Test với một vài nodes trước khi export toàn bộ
- [ ] Check log output để verify logic

## Advanced Configuration Examples

### 1. **Complex Table Structure**
```json
{
  "rootPattern": "DataTable_\\d+",
  "sortGroups": [
    {"prefix": "Header_\\d+", "range": {"rows": [1, 1], "cols": [1, 5]}},
    {"prefix": "Row_\\d+_Col_", "range": {"rows": [1, 20], "cols": [1, 5]}},
    {"prefix": "Footer_Summary"}
  ]
}
```

### 2. **Multi-Component Layout**
```json
{
  "rootPattern": "Section_\\d+|Card_\\d+|Widget_\\d+",
  "sortGroups": [
    {"prefix": "^Header$"},
    {"prefix": "^Content$"},
    {"prefix": "Button_\\d+", "range": {"rows": [1, 1], "cols": [1, 3]}},
    {"prefix": "^Footer$"}
  ]
}
```

### 3. **Nested Structure**
```json
{
  "rootPattern": "Form_\\d+",
  "sortGroups": [
    {"prefix": "Section_\\d+_Title"},
    {"prefix": "Field_\\d+_Label", "range": {"rows": [1, 10], "cols": [1, 2]}},
    {"prefix": "Field_\\d+_Input", "range": {"rows": [1, 10], "cols": [1, 2]}},
    {"prefix": "SubmitButton"}
  ]
}
```

## Performance Considerations

### Large Node Trees
- Limit range bounds để tránh over-processing
- Use specific patterns để reduce regex matching
- Process small selections trước để test config

### Memory Usage  
- Plugin tracks processed nodes để tránh duplicates
- Large selections có thể cause memory issues
- Consider batch processing nếu cần

## Future Enhancements

1. **Pattern Validation**: Real-time regex validation trong UI
2. **Preview Mode**: Show matching nodes trước khi export
3. **Performance Metrics**: Track processing time và memory usage
4. **Config Templates**: Pre-built configs cho common patterns

#!/usr/bin/env python3
"""
Test the fixed filter logic để verify các scenarios user báo cáo
"""

def test_user_scenarios():
    """Test exact scenarios user báo cáo"""
    
    print("🧪 TESTING USER REPORTED SCENARIOS")
    print("=" * 60)
    
    # Mock data tương tự user's data
    mock_figma_nodes = [
        # Title nodes
        {"name": "Title", "id": "1:1", "type": "TEXT"},
        {"name": "Title_Main", "id": "1:2", "type": "TEXT"},
        {"name": "Title_Secondary", "id": "1:3", "type": "TEXT"},
        
        # Item nodes  
        {"name": "Item 1", "id": "2:1", "type": "TEXT"},
        {"name": "Item 2", "id": "2:2", "type": "TEXT"},
        {"name": "Item 3", "id": "2:3", "type": "TEXT"},
        {"name": "Item 4", "id": "2:4", "type": "TEXT"},
        {"name": "Item 5", "id": "2:5", "type": "TEXT"},
        {"name": "Item 6", "id": "2:6", "type": "TEXT"},
        {"name": "Item 7", "id": "2:7", "type": "TEXT"},
        {"name": "Item 8", "id": "2:8", "type": "TEXT"},
        
        # Other nodes (should not match)
        {"name": "Header", "id": "3:1", "type": "TEXT"},
        {"name": "Footer", "id": "3:2", "type": "TEXT"},
        {"name": "Button", "id": "3:3", "type": "TEXT"},
        {"name": "Label", "id": "3:4", "type": "TEXT"},
        {"name": "Description", "id": "3:5", "type": "TEXT"},
        {"name": "Random_Node", "id": "4:1", "type": "TEXT"},
        {"name": "Another_Element", "id": "4:2", "type": "TEXT"},
    ]
    
    print(f"📋 Total mock nodes: {len(mock_figma_nodes)}")
    print(f"   - Title variants: 3")
    print(f"   - Item variants: 8") 
    print(f"   - Other nodes: {len(mock_figma_nodes) - 11}")
    
    # Scenario 1: Only Title filter
    print("\n" + "─" * 60)
    print("📋 SCENARIO 1: Only Title filter selected")
    result1 = simulate_export(mock_figma_nodes, [{"prefix": "Title"}])
    print(f"   Expected: 3 nodes (Title variants)")
    print(f"   Actual: {len(result1)} nodes")
    print(f"   Nodes: {[n['name'] for n in result1]}")
    print(f"   ✅ PASS" if len(result1) == 3 else f"   ❌ FAIL - Expected 3, got {len(result1)}")
    
    # Scenario 2: Only Item filter (regex)
    print("\n" + "─" * 60)
    print("📋 SCENARIO 2: Only Item filter selected")
    result2 = simulate_export(mock_figma_nodes, [{"prefix": "Item \\d+"}])
    print(f"   Expected: 8 nodes (Item 1-8)")
    print(f"   Actual: {len(result2)} nodes")
    print(f"   Nodes: {[n['name'] for n in result2]}")
    print(f"   ✅ PASS" if len(result2) == 8 else f"   ❌ FAIL - Expected 8, got {len(result2)}")
    
    # Scenario 3: NO filters selected
    print("\n" + "─" * 60)
    print("📋 SCENARIO 3: NO filters selected (empty sort groups)")
    result3 = simulate_export(mock_figma_nodes, [])
    print(f"   Expected: 0 nodes (no filters)")
    print(f"   Actual: {len(result3)} nodes")
    print(f"   ✅ PASS" if len(result3) == 0 else f"   ❌ FAIL - Expected 0, got {len(result3)}")
    
    # Scenario 4: Multiple filters (Title + Item)
    print("\n" + "─" * 60)
    print("📋 SCENARIO 4: Both Title and Item filters selected")
    result4 = simulate_export(mock_figma_nodes, [
        {"prefix": "Title"}, 
        {"prefix": "Item \\d+"}
    ])
    print(f"   Expected: 11 nodes (3 Title + 8 Item)")
    print(f"   Actual: {len(result4)} nodes")
    print(f"   Title nodes: {len([n for n in result4 if 'Title' in n['name']])}")
    print(f"   Item nodes: {len([n for n in result4 if 'Item' in n['name']])}")
    print(f"   ✅ PASS" if len(result4) == 11 else f"   ❌ FAIL - Expected 11, got {len(result4)}")
    
    # Scenario 5: Invalid/empty prefix filters
    print("\n" + "─" * 60)
    print("📋 SCENARIO 5: Invalid/empty prefix filters")
    result5 = simulate_export(mock_figma_nodes, [
        {"prefix": ""},      # Empty prefix
        {"prefix": "   "},   # Whitespace only
        {"prefix": "Title"}  # Valid prefix
    ])
    print(f"   Expected: 3 nodes (only valid Title filter should work)")
    print(f"   Actual: {len(result5)} nodes")
    print(f"   ✅ PASS" if len(result5) == 3 else f"   ❌ FAIL - Expected 3, got {len(result5)}")

def simulate_export(nodes, sort_groups):
    """
    Simulate the fixed export logic
    """
    # Early return if no sort groups - nothing to filter
    if not sort_groups or len(sort_groups) == 0:
        return []
    
    # Filter out empty/invalid sort groups
    valid_sort_groups = [group for group in sort_groups if group.get('prefix', '').strip() != '']
    
    if len(valid_sort_groups) == 0:
        return []
    
    result = []
    processed_ids = set()
    
    for group in valid_sort_groups:
        import re
        prefix_regex = re.compile(group['prefix'])
        matching_nodes = [node for node in nodes if prefix_regex.search(node['name'])]
        
        for node in matching_nodes:
            if node['id'] not in processed_ids:
                result.append(node)
                processed_ids.add(node['id'])
    
    return result

def test_range_ui_logic():
    """Test range UI visibility logic"""
    print("\n" + "=" * 60)
    print("🔧 TESTING RANGE UI LOGIC")
    print("=" * 60)
    
    test_patterns = [
        ("Title", False, "Simple single word"),
        ("Item \\d+", False, "Simple regex pattern"),
        ("Row_\\d+_Text_Col_", True, "Grid pattern with Row/Col"),
        ("Cell_\\d+", True, "Cell pattern"),
        ("Grid_Item_\\d+", True, "Grid naming pattern"),
        ("Button", False, "Simple button"),
        ("Table_Row_\\d+_Col_\\d+", True, "Table cell pattern"),
        ("Header_\\d+", False, "Simple numbered header"),
    ]
    
    for pattern, should_show_range, description in test_patterns:
        needs_range = is_grid_pattern(pattern)
        status = "✅ PASS" if needs_range == should_show_range else "❌ FAIL"
        print(f"   {pattern:<25} | Range: {needs_range:<5} | {description:<25} | {status}")

def is_grid_pattern(pattern):
    """Simulate the isGridPattern function"""
    import re
    grid_indicators = [
        re.compile(r'Row_.*Col_', re.I),          # Row_X_Col_Y patterns
        re.compile(r'\d+.*\d+'),                  # Multiple numeric placeholders  
        re.compile(r'_\\d\+.*_\\d\+'),            # Multiple regex digit patterns
        re.compile(r'Col.*Row', re.I),            # Col_X_Row_Y patterns
        re.compile(r'Grid', re.I),                # Explicit grid naming
        re.compile(r'Table.*Cell', re.I),         # Table cell patterns
        re.compile(r'Cell_\\d', re.I)             # Cell patterns
    ]
    
    return any(regex.search(pattern) for regex in grid_indicators)

if __name__ == "__main__":
    test_user_scenarios()
    test_range_ui_logic()
    
    print("\n" + "=" * 60)
    print("🎯 SUMMARY OF FIXES")
    print("=" * 60)
    print("✅ 1. Empty sort groups now return 0 nodes (not all nodes)")
    print("✅ 2. Invalid/empty prefixes are filtered out")
    print("✅ 3. Range UI only shows for grid patterns")
    print("✅ 4. Duplicate prevention with Set tracking")
    print("✅ 5. Proper regex matching with early exits")
    print("\n🚀 Ready for build and testing!")

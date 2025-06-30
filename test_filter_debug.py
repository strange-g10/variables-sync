#!/usr/bin/env python3
"""
Test cases để debug Node Export filter issues
Simulate các scenarios mà user báo cáo
"""

import json

def test_filter_logic():
    """Test filter logic với các scenarios khác nhau"""
    
    # Mock node data for testing
    mock_nodes = [
        {"name": "Title", "id": "1:1", "type": "TEXT"},
        {"name": "Title_Copy", "id": "1:2", "type": "TEXT"},
        {"name": "Title_Main", "id": "1:3", "type": "TEXT"},
        {"name": "Item 1", "id": "2:1", "type": "TEXT"},
        {"name": "Item 2", "id": "2:2", "type": "TEXT"},
        {"name": "Item 3", "id": "2:3", "type": "TEXT"},
        {"name": "Item_Special", "id": "2:4", "type": "TEXT"},
        {"name": "Header", "id": "3:1", "type": "TEXT"},
        {"name": "Footer", "id": "3:2", "type": "TEXT"},
        {"name": "Button", "id": "3:3", "type": "TEXT"},
        {"name": "Random_Node", "id": "4:1", "type": "TEXT"},
        {"name": "Another_Node", "id": "4:2", "type": "TEXT"},
    ]
    
    print("🧪 TESTING FILTER LOGIC")
    print("=" * 50)
    
    # Test Case 1: Only Title filter
    print("\n📋 TEST CASE 1: Only Title filter")
    title_pattern = r"Title"
    title_matches = filter_nodes(mock_nodes, title_pattern)
    print(f"Pattern: '{title_pattern}'")
    print(f"Expected: Title, Title_Copy, Title_Main (3 nodes)")
    print(f"Actual: {[n['name'] for n in title_matches]} ({len(title_matches)} nodes)")
    print(f"✅ PASS" if len(title_matches) == 3 else f"❌ FAIL")
    
    # Test Case 2: Only Item filter with regex
    print("\n📋 TEST CASE 2: Only Item filter (regex)")
    item_pattern = r"Item \d+"
    item_matches = filter_nodes(mock_nodes, item_pattern)
    print(f"Pattern: '{item_pattern}'")
    print(f"Expected: Item 1, Item 2, Item 3 (3 nodes)")
    print(f"Actual: {[n['name'] for n in item_matches]} ({len(item_matches)} nodes)")
    print(f"✅ PASS" if len(item_matches) == 3 else f"❌ FAIL")
    
    # Test Case 3: No filters (empty sort groups)
    print("\n📋 TEST CASE 3: No filters selected")
    no_filter_matches = filter_nodes_with_groups(mock_nodes, [])
    print(f"Sort Groups: []")
    print(f"Expected: 0 nodes (no filters)")
    print(f"Actual: {len(no_filter_matches)} nodes")
    print(f"✅ PASS" if len(no_filter_matches) == 0 else f"❌ FAIL")
    
    # Test Case 4: Multiple filters
    print("\n📋 TEST CASE 4: Multiple filters")
    multi_patterns = [r"Title", r"Item \d+"]
    multi_matches = filter_nodes_with_groups(mock_nodes, multi_patterns)
    print(f"Patterns: {multi_patterns}")
    print(f"Expected: 6 nodes (3 Title + 3 Item)")
    print(f"Actual: {len(multi_matches)} nodes")
    print(f"✅ PASS" if len(multi_matches) == 6 else f"❌ FAIL")
    
    # Test Case 5: Exact match filter
    print("\n📋 TEST CASE 5: Exact Title filter")
    exact_title_pattern = r"^Title$"
    exact_matches = filter_nodes(mock_nodes, exact_title_pattern)
    print(f"Pattern: '{exact_title_pattern}'")
    print(f"Expected: Title only (1 node)")
    print(f"Actual: {[n['name'] for n in exact_matches]} ({len(exact_matches)} nodes)")
    print(f"✅ PASS" if len(exact_matches) == 1 else f"❌ FAIL")

def filter_nodes(nodes, pattern):
    """Helper function to filter nodes by pattern"""
    import re
    regex = re.compile(pattern)
    return [node for node in nodes if regex.search(node['name'])]

def filter_nodes_with_groups(nodes, patterns):
    """Helper function to simulate sort groups filtering"""
    if not patterns:  # No filters = no results
        return []
    
    result = []
    processed_ids = set()
    
    for pattern in patterns:
        matches = filter_nodes(nodes, pattern)
        for node in matches:
            if node['id'] not in processed_ids:
                result.append(node)
                processed_ids.add(node['id'])
    
    return result

def analyze_current_logic():
    """Analyze issues với current logic"""
    print("\n" + "=" * 50)
    print("🔍 ANALYZING CURRENT LOGIC ISSUES")
    print("=" * 50)
    
    issues = [
        {
            "issue": "Range options for single filters",
            "problem": "Title và Item patterns không cần range nhưng UI hiển thị range checkbox",
            "expected": "Range chỉ cho grid patterns như Row_\\d+_Col_",
            "fix": "Conditional range display dựa trên pattern type"
        },
        {
            "issue": "Filter bypass when no groups selected", 
            "problem": "Khi không chọn filter nào, vẫn return nodes",
            "expected": "0 nodes khi không có sort groups",
            "fix": "Early return empty khi sortGroups.length === 0"
        },
        {
            "issue": "Incorrect regex matching",
            "problem": "Pattern 'Item' matches cả 'Item 1' và 'Item_Special'",
            "expected": "Exact pattern matching hoặc specific regex",
            "fix": "Use anchored regex hoặc more specific patterns"
        },
        {
            "issue": "Multiple filter collection logic",
            "problem": "Logic có thể collect duplicate hoặc unintended nodes",
            "expected": "Chỉ nodes match exact patterns",
            "fix": "Stricter pattern matching và better validation"
        }
    ]
    
    for i, issue in enumerate(issues, 1):
        print(f"\n🚨 ISSUE {i}: {issue['issue']}")
        print(f"   Problem: {issue['problem']}")
        print(f"   Expected: {issue['expected']}")  
        print(f"   Fix: {issue['fix']}")

if __name__ == "__main__":
    test_filter_logic()
    analyze_current_logic()
    
    print("\n" + "=" * 50)
    print("🎯 SUMMARY")
    print("=" * 50)
    print("1. ✅ Create test cases for validation")
    print("2. 🔧 Fix range display logic")  
    print("3. 🔧 Fix empty filter handling")
    print("4. 🔧 Fix regex pattern matching")
    print("5. 🔧 Improve filter collection logic")
    print("6. ✅ Build and test again")

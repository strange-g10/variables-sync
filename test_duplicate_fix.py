#!/usr/bin/env python3
"""
Test script để verify fix của Node ID duplication issue
"""

import json
from collections import Counter

def analyze_node_export(file_path):
    """Analyze exported node data for duplicates"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print(f"=== Analysis of {file_path} ===")
        print(f"File Name: {data.get('fileName', 'N/A')}")
        print(f"Selection Count: {data.get('selectionCount', 'N/A')}")
        print(f"Number of Roots: {len(data.get('roots', {}))}")
        
        all_node_ids = []
        all_node_names = []
        
        for root_name, root_data in data.get('roots', {}).items():
            nodes = root_data.get('nodes', [])
            print(f"\nRoot: {root_name}")
            print(f"  Nodes count: {len(nodes)}")
            
            root_ids = [node['id'] for node in nodes]
            root_names = [node['name'] for node in nodes]
            
            all_node_ids.extend(root_ids)
            all_node_names.extend(root_names)
            
            # Check for duplicates within this root
            id_counts = Counter(root_ids)
            name_counts = Counter(root_names)
            
            duplicated_ids = {id_val: count for id_val, count in id_counts.items() if count > 1}
            duplicated_names = {name: count for name, count in name_counts.items() if count > 1}
            
            if duplicated_ids:
                print(f"  ⚠️  DUPLICATE IDs in {root_name}: {duplicated_ids}")
            else:
                print(f"  ✅ No duplicate IDs in {root_name}")
                
            if duplicated_names:
                print(f"  ⚠️  DUPLICATE Names in {root_name}: {duplicated_names}")
            else:
                print(f"  ✅ No duplicate names in {root_name}")
        
        # Global analysis
        print(f"\n=== Global Analysis ===")
        global_id_counts = Counter(all_node_ids)
        global_name_counts = Counter(all_node_names)
        
        global_duplicated_ids = {id_val: count for id_val, count in global_id_counts.items() if count > 1}
        global_duplicated_names = {name: count for name, count in global_name_counts.items() if count > 1}
        
        print(f"Total unique node IDs: {len(set(all_node_ids))}")
        print(f"Total node entries: {len(all_node_ids)}")
        
        if global_duplicated_ids:
            print(f"⚠️  GLOBAL DUPLICATE IDs: {global_duplicated_ids}")
        else:
            print("✅ No global duplicate IDs found")
            
        if global_duplicated_names:
            print(f"⚠️  GLOBAL DUPLICATE Names: {global_duplicated_names}")
        else:
            print("✅ No global duplicate names found")
            
        # Return analysis results
        return {
            'has_duplicate_ids': bool(global_duplicated_ids),
            'has_duplicate_names': bool(global_duplicated_names),
            'total_nodes': len(all_node_ids),
            'unique_ids': len(set(all_node_ids)),
            'duplicate_ids': global_duplicated_ids,
            'duplicate_names': global_duplicated_names
        }
        
    except Exception as e:
        print(f"Error analyzing file: {e}")
        return None

def create_sample_with_duplicates():
    """Create a sample file that would show the old duplication issue"""
    sample_data = {
        "fileName": "Test_Figma_File",
        "selectionCount": 1,
        "roots": {
            "Block-1": {
                "type": "tree",
                "nodes": [
                    # This would be the result of old buggy logic
                    {"name": "Title", "id": "I76:8315;2327:96031", "type": "TEXT"},
                    {"name": "Title", "id": "I76:8315;2327:96031", "type": "TEXT"},  # Duplicate
                    {"name": "Title", "id": "I76:8315;2327:96031", "type": "TEXT"},  # Duplicate
                    {"name": "Item 1", "id": "I76:8315;2327:96032", "type": "FRAME"},
                    {"name": "Item 2", "id": "I76:8315;2327:96033", "type": "FRAME"}
                ]
            }
        }
    }
    
    with open('sample_with_duplicates.json', 'w', encoding='utf-8') as f:
        json.dump(sample_data, f, indent=2, ensure_ascii=False)
    
    print("Created sample_with_duplicates.json for testing")
    return 'sample_with_duplicates.json'

def create_sample_fixed():
    """Create a sample file that shows the fixed logic result"""
    sample_data = {
        "fileName": "Test_Figma_File",
        "selectionCount": 1,
        "roots": {
            "Block-1": {
                "type": "tree",
                "nodes": [
                    # This would be the result of fixed logic
                    {"name": "Title", "id": "I76:8315;2327:96031", "type": "TEXT"},  # Only once
                    {"name": "Item 1", "id": "I76:8315;2327:96032", "type": "FRAME"},
                    {"name": "Item 2", "id": "I76:8315;2327:96033", "type": "FRAME"}
                ]
            }
        }
    }
    
    with open('sample_fixed.json', 'w', encoding='utf-8') as f:
        json.dump(sample_data, f, indent=2, ensure_ascii=False)
    
    print("Created sample_fixed.json for testing")
    return 'sample_fixed.json'

def main():
    print("Node Export Duplication Analysis Tool")
    print("=" * 50)
    
    # Create test samples
    duplicate_file = create_sample_with_duplicates()
    fixed_file = create_sample_fixed()
    
    print("\n" + "=" * 50)
    print("TESTING WITH DUPLICATE SAMPLE (Old buggy logic)")
    result1 = analyze_node_export(duplicate_file)
    
    print("\n" + "=" * 50)
    print("TESTING WITH FIXED SAMPLE (New fixed logic)")
    result2 = analyze_node_export(fixed_file)
    
    print("\n" + "=" * 50)
    print("SUMMARY")
    print("=" * 50)
    
    if result1 and result2:
        print(f"Sample with duplicates: {result1['has_duplicate_ids']} (Expected: True)")
        print(f"Sample fixed: {result2['has_duplicate_ids']} (Expected: False)")
        
        if result1['has_duplicate_ids'] and not result2['has_duplicate_ids']:
            print("✅ Test logic correctly identifies the fix!")
        else:
            print("❌ Test logic may have issues")
    
    print("\nTo test your actual exported file:")
    print("python test_duplicate_fix.py <your_exported_file.json>")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        # Analyze provided file
        file_path = sys.argv[1]
        result = analyze_node_export(file_path)
        if result:
            if result['has_duplicate_ids']:
                print("\n❌ ISSUES FOUND: This file has duplicate node IDs")
                sys.exit(1)
            else:
                print("\n✅ SUCCESS: No duplicate node IDs found")
                sys.exit(0)
    else:
        # Run demo analysis
        main()

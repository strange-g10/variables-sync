#!/usr/bin/env python3
"""
Test script để validate output format của Node Export feature
"""

import json
import sys
from pathlib import Path

def validate_node_export_output(file_path):
    """Validate the structure of node export output JSON"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Check required top-level fields
        required_fields = ['fileName', 'selectionCount', 'roots']
        for field in required_fields:
            if field not in data:
                return False, f"Missing required field: {field}"
        
        # Validate selectionCount
        if not isinstance(data['selectionCount'], int) or data['selectionCount'] < 0:
            return False, "selectionCount must be a non-negative integer"
        
        # Validate roots structure
        if not isinstance(data['roots'], dict):
            return False, "roots must be a dictionary"
        
        # Validate each root
        for root_name, root_data in data['roots'].items():
            if not isinstance(root_data, dict):
                return False, f"Root '{root_name}' data must be a dictionary"
            
            if 'type' not in root_data or 'nodes' not in root_data:
                return False, f"Root '{root_name}' missing required fields (type, nodes)"
            
            if not isinstance(root_data['nodes'], list):
                return False, f"Root '{root_name}' nodes must be a list"
            
            # Validate each node
            for i, node in enumerate(root_data['nodes']):
                if not isinstance(node, dict):
                    return False, f"Node {i} in root '{root_name}' must be a dictionary"
                
                node_required = ['name', 'id', 'type']
                for field in node_required:
                    if field not in node:
                        return False, f"Node {i} in root '{root_name}' missing field: {field}"
                
                if not isinstance(node['name'], str) or not node['name']:
                    return False, f"Node {i} in root '{root_name}' name must be non-empty string"
                
                if not isinstance(node['id'], str) or not node['id']:
                    return False, f"Node {i} in root '{root_name}' id must be non-empty string"
                
                if not isinstance(node['type'], str) or not node['type']:
                    return False, f"Node {i} in root '{root_name}' type must be non-empty string"
        
        return True, "Valid node export output"
    
    except json.JSONDecodeError as e:
        return False, f"Invalid JSON: {e}"
    except Exception as e:
        return False, f"Error validating file: {e}"

def generate_sample_output():
    """Generate sample output for testing"""
    sample_data = {
        "fileName": "Sample_Figma_File",
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
                    },
                    {
                        "name": "Row_1_Visible_Col_1",
                        "id": "123:458",
                        "type": "BOOLEAN_OPERATION"
                    },
                    {
                        "name": "Row_2_Text_Col_1",
                        "id": "123:459",
                        "type": "TEXT"
                    }
                ]
            },
            "Block-1": {
                "type": "tree",
                "nodes": [
                    {
                        "name": "Title",
                        "id": "123:460",
                        "type": "TEXT"
                    },
                    {
                        "name": "Item 1",
                        "id": "123:461",
                        "type": "FRAME"
                    },
                    {
                        "name": "Item 2", 
                        "id": "123:462",
                        "type": "FRAME"
                    }
                ]
            }
        }
    }
    
    sample_file = Path(__file__).parent / "sample_node_export.json"
    with open(sample_file, 'w', encoding='utf-8') as f:
        json.dump(sample_data, f, indent=2, ensure_ascii=False)
    
    print(f"Generated sample output: {sample_file}")
    return sample_file

def compare_with_collect_script_output():
    """Compare format with collect_node_ids.py output"""
    collect_output_pattern = {
        "root_name": {
            "type": "tree",
            "nodes": [
                {"name": "node_name", "id": "node_id"}
            ]
        }
    }
    
    plugin_output_pattern = {
        "fileName": "file_name",
        "selectionCount": 1,
        "roots": {
            "root_name": {
                "type": "tree", 
                "nodes": [
                    {"name": "node_name", "id": "node_id", "type": "node_type"}
                ]
            }
        }
    }
    
    print("=== Format Comparison ===")
    print("collect_node_ids.py output structure:")
    print(json.dumps(collect_output_pattern, indent=2))
    print("\nPlugin export output structure:")
    print(json.dumps(plugin_output_pattern, indent=2))
    print("\nKey differences:")
    print("1. Plugin adds 'fileName' and 'selectionCount' metadata")
    print("2. Plugin wraps roots in 'roots' container")
    print("3. Plugin adds 'type' field to each node")
    print("4. Both maintain same tree structure for nodes")

def main():
    if len(sys.argv) > 1:
        file_path = Path(sys.argv[1])
        if not file_path.exists():
            print(f"File not found: {file_path}")
            sys.exit(1)
        
        is_valid, message = validate_node_export_output(file_path)
        print(f"Validation result: {message}")
        sys.exit(0 if is_valid else 1)
    else:
        print("Node Export Output Validator")
        print("=" * 40)
        
        # Generate sample
        sample_file = generate_sample_output()
        
        # Validate sample
        is_valid, message = validate_node_export_output(sample_file)
        print(f"\nSample validation: {message}")
        
        # Show format comparison
        print()
        compare_with_collect_script_output()
        
        print(f"\nUsage: python {sys.argv[0]} <exported_json_file>")

if __name__ == "__main__":
    main()

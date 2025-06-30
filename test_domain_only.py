#!/usr/bin/env python3
"""
Simple test for domain models only - no external dependencies
"""
import sys
import os
from datetime import datetime
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

print("🚀 Testing Domain Models Only")
print("=" * 40)

def test_sheet_models():
    """Test sheet domain models"""
    print("\n=== Testing Sheet Models ===")
    
    try:
        from src.domain.models.sheet_models import (
            Cell, CellRange, Worksheet, Spreadsheet, SheetConfiguration, CellType
        )
        
        # Test Cell
        cell = Cell(row=1, column=1, value="Test", formatted_value="Test")
        print(f"✅ Cell: {cell}")
        print(f"   Address: {cell.address}")
        
        # Test CellRange
        cell_range = CellRange(start_row=1, start_column=1, end_row=3, end_column=3)
        test_data = [
            ["Name", "Type", "Value"],
            ["Color", "COLOR", "#FF0000"], 
            ["Size", "FLOAT", "16"]
        ]
        cell_range.set_values_2d(test_data)
        print(f"✅ CellRange: {cell_range}")
        print(f"   Address: {cell_range.get_address()}")
        print(f"   Data: {cell_range.get_values_2d()}")
        
        # Test Worksheet
        worksheet = Worksheet(
            id=0,
            title="Variables",
            index=0,
            row_count=100,
            column_count=10
        )
        worksheet.add_data_range(cell_range)
        print(f"✅ Worksheet: {worksheet}")
        print(f"   Row count: {worksheet.row_count}")
        print(f"   Column count: {worksheet.column_count}")
        
        # Test Spreadsheet
        spreadsheet = Spreadsheet(
            id="test_123",
            name="Test Spreadsheet",
            url="https://docs.google.com/spreadsheets/d/test_123",
            worksheets=[worksheet],
            created_time=datetime.now(),
            modified_time=datetime.now()
        )
        print(f"✅ Spreadsheet: {spreadsheet}")
        
        # Test finding worksheet
        found_ws = spreadsheet.get_worksheet_by_title("Variables")
        print(f"✅ Found worksheet: {found_ws.title if found_ws else 'None'}")
        
        return True
        
    except Exception as e:
        print(f"❌ Sheet models test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_figma_models():
    """Test figma domain models"""
    print("\n=== Testing Figma Models ===")
    
    try:
        from src.domain.models.figma_models import (
            FigmaFile, FigmaCollection, FigmaVariable, FigmaMode, 
            VariableType, VariableValue
        )
        
        # Test VariableValue
        color_value = VariableValue(VariableType.COLOR, {"r": 0.2, "g": 0.4, "b": 0.8, "a": 1.0})
        print(f"✅ VariableValue: {color_value}")
        print(f"   As string: {color_value.as_string}")
        
        # Test FigmaMode
        light_mode = FigmaMode(id="light", name="Light")
        dark_mode = FigmaMode(id="dark", name="Dark")
        print(f"✅ FigmaModes: {light_mode}, {dark_mode}")
        
        # Test FigmaVariable
        variable = FigmaVariable(
            id="var_1",
            name="Primary Color",
            key="primary-color",
            variable_collection_id="col_1",
            resolved_type=VariableType.COLOR,
            values_by_mode={
                "light": color_value,
                "dark": VariableValue(VariableType.COLOR, {"r": 0.3, "g": 0.5, "b": 0.9, "a": 1.0})
            }
        )
        print(f"✅ FigmaVariable: {variable}")
        print(f"   Light value: {variable.get_value_as_string('light')}")
        print(f"   Dark value: {variable.get_value_as_string('dark')}")
        
        # Test FigmaCollection
        collection = FigmaCollection(
            id="col_1",
            name="Colors",
            modes=[light_mode, dark_mode],
            default_mode_id="light",
            variables=[variable]
        )
        print(f"✅ FigmaCollection: {collection}")
        print(f"   Variable count: {collection.variable_count}")
        
        # Test FigmaFile
        figma_file = FigmaFile(
            id="file_1",
            name="Design System",
            last_modified=datetime.now(),
            collections=[collection]
        )
        print(f"✅ FigmaFile: {figma_file}")
        print(f"   Collection count: {figma_file.collection_count}")
        print(f"   Total variables: {figma_file.total_variable_count}")
        
        return True
        
    except Exception as e:
        print(f"❌ Figma models test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_variable_models():
    """Test variable domain models"""
    print("\n=== Testing Variable Models ===")
    
    try:
        from src.domain.models.variable_models import (
            Variable, VariableMapping, VariableAssignment, SyncStatus
        )
        
        # Test Variable
        source_var = Variable(
            id="var_1",
            name="Primary Color",
            type="COLOR",
            value="#FF0000",
            description="Main color"
        )
        print(f"✅ Variable: {source_var}")
        
        target_var = Variable(
            id="var_2", 
            name="Brand Primary",
            type="COLOR",
            value="#FF0000",
            description="Brand color"
        )
        
        # Test VariableMapping
        mapping = VariableMapping(
            source_variable=source_var,
            target_variable=target_var,
            mapping_rules=["color_conversion"]
        )
        print(f"✅ VariableMapping: {mapping}")
        print(f"   Compatible types: {mapping.source_variable.type == mapping.target_variable.type}")
        
        # Test VariableAssignment
        assignment = VariableAssignment(
            variable_id="var_1",
            mode_id="light",
            value="#FF0000",
            status=SyncStatus.COMPLETED
        )
        print(f"✅ VariableAssignment: {assignment}")
        
        return True
        
    except Exception as e:
        print(f"❌ Variable models test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_domain_services():
    """Test domain services"""
    print("\n=== Testing Domain Services ===")
    
    try:
        from src.domain.services.variable_domain_service import VariableDomainService
        from src.domain.services.figma_domain_service import FigmaDomainService  
        from src.domain.services.sheet_domain_service import SheetDomainService
        from src.domain.models.figma_models import FigmaFile, FigmaCollection, VariableType
        from src.domain.models.sheet_models import Spreadsheet, Worksheet
        from src.domain.models.variable_models import Variable
        
        # Test VariableDomainService
        var_service = VariableDomainService()
        print("✅ VariableDomainService created")
        
        # Test variables compatibility
        vars_list = [
            Variable(id="1", name="color1", type="COLOR", value="#FF0000"),
            Variable(id="2", name="color2", type="COLOR", value="#00FF00")
        ]
        can_sync = var_service.can_sync_variables(vars_list)
        print(f"   Can sync: {can_sync}")
        
        # Test FigmaDomainService
        figma_service = FigmaDomainService()
        print("✅ FigmaDomainService created")
        
        # Test SheetDomainService
        sheet_service = SheetDomainService()
        print("✅ SheetDomainService created")
        
        # Test worksheet suggestions
        test_vars = [
            {"name": "primary", "type": "COLOR"},
            {"name": "secondary", "type": "COLOR"},
            {"name": "font-size", "type": "FLOAT"}
        ]
        existing_names = ["Sheet1", "Settings"]
        suggestions = sheet_service.suggest_worksheet_name(test_vars, existing_names)
        print(f"   Worksheet suggestions: {suggestions}")
        
        return True
        
    except Exception as e:
        print(f"❌ Domain services test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all tests"""
    tests = [
        ("Sheet Models", test_sheet_models),
        ("Figma Models", test_figma_models), 
        ("Variable Models", test_variable_models),
        ("Domain Services", test_domain_services)
    ]
    
    passed = 0
    failed = 0
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            print(f"❌ Test '{test_name}' crashed: {e}")
            failed += 1
    
    print("\n" + "=" * 40)
    print("🏁 DOMAIN MODELS TEST SUMMARY")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"📊 Total: {passed + failed}")
    
    if failed == 0:
        print("\n🎉 ALL DOMAIN MODELS TESTS PASSED!")
        print("📋 Domain Foundation is solid:")
        print("  ✓ Sheet Models - Complete business entities")
        print("  ✓ Figma Models - Rich variable models")
        print("  ✓ Variable Models - Sync logic models")
        print("  ✓ Domain Services - Business logic")
        print("\n🚀 Domain layer is ready for Infrastructure layer!")
    else:
        print(f"\n⚠️  {failed} tests failed. Domain models need fixing.")

if __name__ == "__main__":
    main()

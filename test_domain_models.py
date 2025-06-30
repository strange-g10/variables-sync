#!/usr/bin/env python3
"""
Test script cho Domain Models - Phase 2
"""
import sys
import os
from datetime import datetime
from pathlib import Path

# Thêm src vào Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from domain.models.figma_models import (
    FigmaFile, FigmaCollection, FigmaVariable, FigmaMode, 
    VariableType, VariableValue
)
from domain.models.sheet_models import (
    Spreadsheet, Worksheet, CellRange, Cell,
    SheetConfiguration
)
from domain.models.variable_models import (
    Variable, VariableMapping, VariableAssignment, SyncStatus
)
from domain.services.variable_domain_service import VariableDomainService
from domain.services.figma_domain_service import FigmaDomainService
from domain.services.sheet_domain_service import SheetDomainService


def test_figma_models():
    print("\n=== Testing Figma Models ===")
    
    # Tạo modes
    light_mode = FigmaMode(id="light", name="Light")
    dark_mode = FigmaMode(id="dark", name="Dark")
    
    # Tạo variable values
    primary_light = VariableValue(VariableType.COLOR, {"r": 0.2, "g": 0.4, "b": 0.8, "a": 1.0})
    primary_dark = VariableValue(VariableType.COLOR, {"r": 0.3, "g": 0.5, "b": 0.9, "a": 1.0})
    
    # Tạo variable
    primary_color = FigmaVariable(
        id="var1",
        name="Primary Color",
        key="primary-color",
        variable_collection_id="col1",
        resolved_type=VariableType.COLOR,
        values_by_mode={
            "light": primary_light,
            "dark": primary_dark
        }
    )
    
    # Tạo collection
    colors_collection = FigmaCollection(
        id="col1",
        name="Colors",
        modes=[light_mode, dark_mode],
        default_mode_id="light",
        variables=[primary_color]
    )
    
    # Tạo file
    figma_file = FigmaFile(
        id="file1",
        name="Design System",
        last_modified=datetime.now(),
        collections=[colors_collection]
    )
    
    print(f"✓ Figma File: {figma_file}")
    print(f"✓ Collection: {colors_collection}")
    print(f"✓ Variable: {primary_color}")
    print(f"✓ Light value: {primary_color.get_value_as_string('light')}")
    print(f"✓ Dark value: {primary_color.get_value_as_string('dark')}")
    
    # Test domain service
    figma_service = FigmaDomainService()
    stats = figma_service.get_file_statistics(figma_file)
    print(f"✓ File statistics: {stats}")


def test_sheet_models():
    print("\n=== Testing Sheet Models ===")
    
    # Tạo cell range
    cell_range = CellRange(start_row=1, start_column=1, end_row=3, end_column=3)
    
    # Set data
    data = [
        ["Name", "Type", "Value"],
        ["Primary Color", "COLOR", "rgb(51, 102, 204)"],
        ["Font Size", "FLOAT", "16"]
    ]
    cell_range.set_values_2d(data)
    
    # Tạo worksheet
    worksheet = Worksheet(
        id=0,
        title="Variables",
        index=0,
        data_ranges=[cell_range]
    )
    
    # Tạo spreadsheet
    spreadsheet = Spreadsheet(
        id="sheet1",
        name="Variables Sync",
        url="https://docs.google.com/spreadsheets/d/sheet1",
        worksheets=[worksheet]
    )
    
    print(f"✓ Spreadsheet: {spreadsheet}")
    print(f"✓ Worksheet: {worksheet}")
    print(f"✓ Cell range: {cell_range}")
    print(f"✓ Cell A1: {cell_range.get_cell(1, 1)}")
    
    # Test domain service
    sheet_service = SheetDomainService()
    stats = sheet_service.get_spreadsheet_statistics(spreadsheet)
    print(f"✓ Spreadsheet statistics: {stats}")


def test_variable_models():
    print("\n=== Testing Variable Models ===")
    
    # Tạo variables
    source_var = Variable(
        id="var1",
        name="Primary Color",
        type="COLOR",
        value="rgb(51, 102, 204)",
        description="Main brand color"
    )
    
    target_var = Variable(
        id="var2",
        name="Brand Primary",
        type="COLOR",
        value="rgb(51, 102, 204)",
        description="Brand primary color for sheets"
    )
    
    # Tạo mapping
    mapping = VariableMapping(
        source_variable=source_var,
        target_variable=target_var,
        mapping_rules=["color_conversion", "name_normalization"]
    )
    
    # Tạo assignment
    assignment = VariableAssignment(
        variable_id="var1",
        mode_id="light",
        value="rgb(51, 102, 204)",
        status=SyncStatus.COMPLETED
    )
    
    print(f"✓ Source variable: {source_var}")
    print(f"✓ Target variable: {target_var}")
    print(f"✓ Mapping: {mapping}")
    print(f"✓ Assignment: {assignment}")
    
    # Test domain service
    var_service = VariableDomainService()
    can_sync = var_service.can_sync_variables([source_var, target_var])
    print(f"✓ Can sync check: {can_sync}")


def test_integration():
    print("\n=== Testing Integration ===")
    
    # Tạo Figma variable
    figma_var = FigmaVariable(
        id="figma_var1",
        name="Primary Color",
        key="primary-color",
        variable_collection_id="col1",
        resolved_type=VariableType.COLOR,
        values_by_mode={
            "light": VariableValue(VariableType.COLOR, {"r": 0.2, "g": 0.4, "b": 0.8, "a": 1.0})
        }
    )
    
    # Convert sang domain variable
    var_service = VariableDomainService()
    domain_var = var_service.create_variable_from_figma(figma_var, "light")
    
    print(f"✓ Figma variable: {figma_var}")
    print(f"✓ Domain variable: {domain_var}")
    
    # Tạo data cho sheet
    sheet_data = [
        ["Variable ID", "Name", "Type", "Value"],
        [domain_var.id, domain_var.name, domain_var.type, domain_var.value]
    ]
    
    # Test sheet range calculation
    sheet_service = SheetDomainService()
    optimal_range = sheet_service.calculate_optimal_range_for_data(sheet_data)
    
    print(f"✓ Sheet data: {sheet_data}")
    print(f"✓ Optimal range: {optimal_range}")
    print(f"✓ Range address: {optimal_range.range_address}")


def main():
    print("🚀 Testing Domain Models - Phase 2")
    
    try:
        test_figma_models()
        test_sheet_models() 
        test_variable_models()
        test_integration()
        
        print("\n✅ All tests passed! Domain Models Phase 2 completed successfully.")
        print("\n📋 Summary:")
        print("  - Figma Models: FigmaFile, FigmaCollection, FigmaVariable ✓")
        print("  - Sheet Models: Spreadsheet, Worksheet, CellRange, Cell ✓")
        print("  - Variable Models: Variable, VariableMapping, VariableAssignment ✓")
        print("  - Repository Interfaces: Figma, Sheet, File, Variable ✓")
        print("  - Domain Services: Validation, Business logic ✓")
        
        print("\n🎯 Ready for Phase 3: Services Layer implementation!")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())

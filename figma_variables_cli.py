#!/usr/bin/env python3
"""
CLI Tool để test và demo FigmaVariablesService với Personal Access Token (PAT)
"""
import os
import sys
import argparse
import json
from datetime import datetime
from typing import Optional

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
from src.infrastructure.figma_client import FigmaClient
from src.services.figma_variables_service import FigmaVariablesService, VariableType
from src.utils.logger import get_logger

# Load environment variables
load_dotenv()

logger = get_logger(__name__)


def setup_figma_service() -> Optional[FigmaVariablesService]:
    """
    Setup FigmaVariablesService với PAT từ environment
    
    Returns:
        FigmaVariablesService instance hoặc None nếu setup failed
    """
    figma_token = os.getenv('FIGMA_TOKEN')
    
    if not figma_token:
        print("❌ FIGMA_TOKEN không được tìm thấy trong .env file")
        print("📝 Hãy copy .env.example thành .env và điền thông tin PAT")
        return None
    
    if not figma_token.startswith('figd_'):
        print("⚠️  Token có vẻ không phải Organization PAT (không bắt đầu bằng 'figd_')")
        print("💡 Organization PAT cung cấp higher rate limits và enhanced permissions")
    
    try:
        # Create Figma client
        figma_client = FigmaClient(access_token=figma_token)
        
        # Test authentication
        print("🔐 Đang test authentication...")
        if not figma_client.authenticate():
            print("❌ Authentication failed - vui lòng kiểm tra FIGMA_TOKEN")
            return None
        
        print("✅ Authentication thành công!")
        
        # Create variables service
        variables_service = FigmaVariablesService(figma_client, cache_timeout=300)
        
        return variables_service
        
    except Exception as e:
        print(f"❌ Error setting up Figma service: {str(e)}")
        return None


def cmd_test_connection(args):
    """Test kết nối với Figma API"""
    print("🚀 Testing Figma API connection...")
    
    service = setup_figma_service()
    if not service:
        return False
    
    try:
        # Get user info
        user_result = service.client.get_user_info()
        if user_result.is_success:
            user_data = user_result.data
            print(f"👤 User: {user_data.get('name', 'Unknown')}")
            print(f"📧 Email: {user_data.get('email', 'Unknown')}")
            print(f"🏢 Handle: {user_data.get('handle', 'Unknown')}")
        else:
            print(f"❌ Failed to get user info: {user_result.message}")
            return False
        
        print("✅ Figma API connection successful!")
        return True
        
    except Exception as e:
        print(f"❌ Error testing connection: {str(e)}")
        return False


def cmd_get_variables(args):
    """Lấy Variables từ Figma file"""
    if not args.file_id:
        print("❌ File ID is required. Use --file-id parameter")
        return False
    
    print(f"📁 Getting variables from file: {args.file_id}")
    
    service = setup_figma_service()
    if not service:
        return False
    
    try:
        # Get variables
        result = service.get_file_variables(
            file_id=args.file_id,
            use_cache=not args.no_cache,
            include_collections=True
        )
        
        if not result.is_success:
            print(f"❌ Failed to get variables: {result.message}")
            return False
        
        data = result.data
        variables = data.get('variables', [])
        collections = data.get('collections', [])
        
        print(f"📊 Found {len(variables)} variables in {len(collections)} collections")
        
        # Show summary by type
        type_counts = {}
        for var in variables:
            var_type = var.variable_type.value
            type_counts[var_type] = type_counts.get(var_type, 0) + 1
        
        print("\n📈 Variables by type:")
        for var_type, count in type_counts.items():
            print(f"  • {var_type}: {count}")
        
        # Show collections
        if collections:
            print(f"\n📚 Collections:")
            for collection in collections:
                modes_count = len(collection.modes)
                vars_count = len(collection.variables)
                print(f"  • {collection.name}: {vars_count} variables, {modes_count} modes")
        
        # Export if requested
        if args.export:
            export_result = service.export_variables_to_json(
                file_id=args.file_id,
                output_path=args.export,
                include_collections=True,
                pretty_print=True
            )
            
            if export_result.is_success:
                print(f"💾 Exported to: {export_result.data}")
            else:
                print(f"❌ Export failed: {export_result.message}")
        
        # Show stats
        stats = service.get_sync_stats()
        print(f"\n📈 Performance stats:")
        print(f"  • API requests: {stats.api_requests}")
        print(f"  • Cached requests: {stats.cached_requests}")
        print(f"  • Sync duration: {stats.sync_duration:.2f}s")
        
        return True
        
    except Exception as e:
        print(f"❌ Error getting variables: {str(e)}")
        return False


def cmd_search_variables(args):
    """Tìm kiếm Variables"""
    if not args.file_id or not args.search_term:
        print("❌ File ID and search term are required")
        return False
    
    print(f"🔍 Searching variables in file {args.file_id} for: '{args.search_term}'")
    
    service = setup_figma_service()
    if not service:
        return False
    
    try:
        # Search variables
        result = service.search_variables(
            file_id=args.file_id,
            search_term=args.search_term,
            search_in=['name', 'description'],
            use_cache=not args.no_cache
        )
        
        if not result.is_success:
            print(f"❌ Search failed: {result.message}")
            return False
        
        found_variables = result.data
        print(f"✅ Found {len(found_variables)} variables")
        
        # Show results
        for var in found_variables[:10]:  # Limit to first 10
            print(f"  • {var.name} ({var.variable_type.value})")
            if var.description:
                print(f"    📝 {var.description}")
        
        if len(found_variables) > 10:
            print(f"    ... and {len(found_variables) - 10} more")
        
        return True
        
    except Exception as e:
        print(f"❌ Error searching variables: {str(e)}")
        return False


def cmd_filter_by_type(args):
    """Lọc Variables theo type"""
    if not args.file_id or not args.variable_type:
        print("❌ File ID and variable type are required")
        return False
    
    try:
        var_type = VariableType(args.variable_type.upper())
    except ValueError:
        print(f"❌ Invalid variable type. Valid types: {[t.value for t in VariableType]}")
        return False
    
    print(f"🎯 Filtering {var_type.value} variables from file: {args.file_id}")
    
    service = setup_figma_service()
    if not service:
        return False
    
    try:
        # Filter by type
        result = service.get_variables_by_type(
            file_id=args.file_id,
            variable_type=var_type,
            use_cache=not args.no_cache
        )
        
        if not result.is_success:
            print(f"❌ Filter failed: {result.message}")
            return False
        
        typed_variables = result.data
        print(f"✅ Found {len(typed_variables)} {var_type.value} variables")
        
        # Show some examples
        for var in typed_variables[:5]:  # Limit to first 5
            print(f"  • {var.name}")
            if var.description:
                print(f"    📝 {var.description}")
            
            # Show value preview for some types
            if var.value_by_mode:
                mode_values = list(var.value_by_mode.values())
                if mode_values:
                    value = mode_values[0]
                    if var_type == VariableType.COLOR and isinstance(value, dict):
                        print(f"    🎨 Color: {value}")
                    elif var_type == VariableType.FLOAT:
                        print(f"    📏 Value: {value}")
                    elif var_type == VariableType.STRING:
                        print(f"    📝 Text: {value}")
        
        if len(typed_variables) > 5:
            print(f"    ... and {len(typed_variables) - 5} more")
        
        return True
        
    except Exception as e:
        print(f"❌ Error filtering variables: {str(e)}")
        return False


def cmd_validate_structure(args):
    """Validate cấu trúc Variables"""
    if not args.file_id:
        print("❌ File ID is required")
        return False
    
    print(f"🔍 Validating variables structure for file: {args.file_id}")
    
    service = setup_figma_service()
    if not service:
        return False
    
    try:
        # Validate structure
        result = service.validate_variables_structure(args.file_id)
        
        if not result.is_success:
            print(f"❌ Validation failed: {result.message}")
            return False
        
        report = result.data
        health_score = report.get('health_score', 0)
        
        # Show health score
        if health_score >= 90:
            print(f"🟢 Health Score: {health_score}/100 - Excellent!")
        elif health_score >= 70:
            print(f"🟡 Health Score: {health_score}/100 - Good")
        else:
            print(f"🔴 Health Score: {health_score}/100 - Needs attention")
        
        print(f"📊 Summary:")
        print(f"  • Total variables: {report['total_variables']}")
        print(f"  • Total collections: {report['total_collections']}")
        
        # Show type distribution
        type_dist = report.get('stats', {}).get('type_distribution', {})
        if type_dist:
            print(f"  • Type distribution:")
            for var_type, count in type_dist.items():
                print(f"    - {var_type}: {count}")
        
        # Show issues
        issues = report.get('issues', [])
        if issues:
            print(f"\n❌ Issues found ({len(issues)}):")
            for issue in issues:
                print(f"  • {issue['type']}: {issue['count']} items")
                if 'variables' in issue:
                    for var_name in issue['variables'][:3]:
                        print(f"    - {var_name}")
                    if issue['count'] > 3:
                        print(f"    - ... and {issue['count'] - 3} more")
        
        # Show warnings
        warnings = report.get('warnings', [])
        if warnings:
            print(f"\n⚠️ Warnings ({len(warnings)}):")
            for warning in warnings:
                print(f"  • {warning['type']}: {warning['count']} items")
        
        if not issues and not warnings:
            print("\n✅ No issues or warnings found!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error validating structure: {str(e)}")
        return False


def cmd_clear_cache(args):
    """Clear cache"""
    service = setup_figma_service()
    if not service:
        return False
    
    if args.file_id:
        service.clear_cache(args.file_id)
        print(f"🗑️ Cleared cache for file: {args.file_id}")
    else:
        service.clear_cache()
        print("🗑️ Cleared all cache")
    
    return True


def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(
        description="Figma Variables CLI - Test và demo PAT functionality",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Test connection
  python figma_variables_cli.py test-connection
  
  # Get all variables from a file
  python figma_variables_cli.py get-variables --file-id YOUR_FILE_ID
  
  # Export variables to JSON
  python figma_variables_cli.py get-variables --file-id YOUR_FILE_ID --export variables.json
  
  # Search variables
  python figma_variables_cli.py search --file-id YOUR_FILE_ID --search "color"
  
  # Filter by type
  python figma_variables_cli.py filter-type --file-id YOUR_FILE_ID --type COLOR
  
  # Validate structure
  python figma_variables_cli.py validate --file-id YOUR_FILE_ID
  
  # Clear cache
  python figma_variables_cli.py clear-cache --file-id YOUR_FILE_ID
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Test connection command
    test_parser = subparsers.add_parser('test-connection', help='Test Figma API connection')
    
    # Get variables command
    get_parser = subparsers.add_parser('get-variables', help='Get variables from Figma file')
    get_parser.add_argument('--file-id', required=True, help='Figma file ID')
    get_parser.add_argument('--export', help='Export to JSON file')
    get_parser.add_argument('--no-cache', action='store_true', help='Skip cache')
    
    # Search command
    search_parser = subparsers.add_parser('search', help='Search variables')
    search_parser.add_argument('--file-id', required=True, help='Figma file ID')
    search_parser.add_argument('--search-term', required=True, help='Search term')
    search_parser.add_argument('--no-cache', action='store_true', help='Skip cache')
    
    # Filter by type command
    filter_parser = subparsers.add_parser('filter-type', help='Filter variables by type')
    filter_parser.add_argument('--file-id', required=True, help='Figma file ID')
    filter_parser.add_argument('--type', dest='variable_type', required=True, 
                              choices=['COLOR', 'FLOAT', 'STRING', 'BOOLEAN'],
                              help='Variable type to filter')
    filter_parser.add_argument('--no-cache', action='store_true', help='Skip cache')
    
    # Validate command
    validate_parser = subparsers.add_parser('validate', help='Validate variables structure')
    validate_parser.add_argument('--file-id', required=True, help='Figma file ID')
    
    # Clear cache command
    cache_parser = subparsers.add_parser('clear-cache', help='Clear cache')
    cache_parser.add_argument('--file-id', help='File ID to clear cache for (all if not specified)')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    # Execute command
    success = False
    
    if args.command == 'test-connection':
        success = cmd_test_connection(args)
    elif args.command == 'get-variables':
        success = cmd_get_variables(args)
    elif args.command == 'search':
        success = cmd_search_variables(args)
    elif args.command == 'filter-type':
        success = cmd_filter_by_type(args)
    elif args.command == 'validate':
        success = cmd_validate_structure(args)
    elif args.command == 'clear-cache':
        success = cmd_clear_cache(args)
    else:
        print(f"❌ Unknown command: {args.command}")
        parser.print_help()
    
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()

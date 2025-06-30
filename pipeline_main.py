#!/usr/bin/env python3
"""
Variables Sync Pipeline - Main Entry Point
Integrates new architecture with legacy scripts functionality
"""
import os
import sys
import json
import argparse
import logging
from pathlib import Path
from typing import Optional, Dict, Any
from datetime import datetime

# Add src to path for new architecture
sys.path.append(str(Path(__file__).parent / "src"))

# Import new architecture services
from src.services.figma_service import FigmaService
from src.services.sheet_service import SheetService
from src.services.data_processor_service import (
    DataProcessorService, SyncConfig, SyncDirection, ConflictResolutionStrategy
)
from src.services.pipeline_service import PipelineService, PipelineConfig
from src.infrastructure.repositories.figma_repository_impl import FigmaRepositoryImpl
from src.infrastructure.repositories.sheet_repository_impl import SheetRepositoryImpl
from src.infrastructure.figma_client import FigmaClient
from src.infrastructure.sheets_client import SheetsClient
from src.infrastructure.file_handler import FileHandler
from src.utils.logger import get_logger

# Legacy script imports
import subprocess
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class VariablesSyncPipeline:
    """Enhanced Variables Sync Pipeline with new architecture integration"""
    
    def __init__(self, config_path: str = None):
        self.base_dir = Path(__file__).parent
        self.config_path = config_path or self.base_dir / "config" / "process_data_config.json"
        self.logger = get_logger("VariablesSyncPipeline")
        
        # Load configuration
        self.config = self._load_config()
        
        # Initialize services
        self.services = self._setup_services()
        
        # Setup logging
        self._setup_logging()
    
    def _load_config(self) -> Dict[str, Any]:
        """Load pipeline configuration"""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
            self.logger.info(f"Loaded configuration from {self.config_path}")
            return config
        except Exception as e:
            self.logger.error(f"Failed to load configuration: {e}")
            raise
    
    def _setup_logging(self):
        """Setup logging configuration"""
        log_dir = self.base_dir / "logs"
        log_dir.mkdir(exist_ok=True)
        
        log_file = log_dir / f"pipeline_{datetime.now().strftime('%Y%m%d')}.log"
        
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            handlers=[
                logging.FileHandler(log_file),
                logging.StreamHandler()
            ],
            force=True
        )
    
    def _setup_services(self) -> Dict[str, Any]:
        """Setup new architecture services"""
        try:
            # Get credentials from environment
            figma_token = os.getenv('FIGMA_TOKEN')
            google_credentials_file = os.getenv('GOOGLE_CREDENTIALS_FILE')
            
            if not figma_token:
                self.logger.warning("FIGMA_TOKEN not found in environment. Using mock for testing.")
                figma_token = "mock_token"
            
            if not google_credentials_file:
                self.logger.warning("GOOGLE_CREDENTIALS_FILE not found in environment. Using mock for testing.")
                google_credentials_file = "mock_credentials"
            
            # Setup clients
            figma_client = FigmaClient(figma_token)
            sheets_client = SheetsClient(google_credentials_file)
            file_handler = FileHandler()
            
            # Setup repositories
            figma_repo = FigmaRepositoryImpl(figma_client, file_handler)
            sheet_repo = SheetRepositoryImpl(sheets_client)
            
            # Setup services
            figma_service = FigmaService(figma_repo)
            sheet_service = SheetService(sheet_repo)
            data_processor_service = DataProcessorService(figma_service, sheet_service)
            pipeline_service = PipelineService(figma_service, sheet_service, data_processor_service)
            
            return {
                'figma_service': figma_service,
                'sheet_service': sheet_service,
                'data_processor_service': data_processor_service,
                'pipeline_service': pipeline_service
            }
        except Exception as e:
            self.logger.error(f"Failed to setup services: {e}")
            # Return mock services for testing
            return self._setup_mock_services()
    
    def _setup_mock_services(self) -> Dict[str, Any]:
        """Setup mock services for testing when credentials are not available"""
        figma_client = FigmaClient("mock_token")
        sheets_client = SheetsClient("mock_credentials")
        file_handler = FileHandler()
        
        figma_repo = FigmaRepositoryImpl(figma_client, file_handler)
        sheet_repo = SheetRepositoryImpl(sheets_client)
        
        figma_service = FigmaService(figma_repo)
        sheet_service = SheetService(sheet_repo)
        data_processor_service = DataProcessorService(figma_service, sheet_service)
        pipeline_service = PipelineService(figma_service, sheet_service, data_processor_service)
        
        return {
            'figma_service': figma_service,
            'sheet_service': sheet_service,
            'data_processor_service': data_processor_service,
            'pipeline_service': pipeline_service
        }
    
    def run_legacy_script(self, script_name: str, args: str = "") -> bool:
        """Run legacy script with enhanced error handling"""
        script_path = self.base_dir / "scripts" / script_name
        
        if not script_path.exists():
            self.logger.error(f"Script not found: {script_path}")
            return False
        
        try:
            self.logger.info(f"Running legacy script: {script_name} with args: {args}")
            
            if script_name == "process_data.py":
                # Run process_data.py with interactive terminal
                result = subprocess.run(
                    f"python {script_path} {args}",
                    shell=True,
                    cwd=self.base_dir
                )
                success = result.returncode == 0
            else:
                # Run other scripts with output capture
                result = subprocess.run(
                    f"python {script_path} {args}",
                    shell=True,
                    cwd=self.base_dir,
                    capture_output=True,
                    text=True
                )
                
                if result.stdout:
                    print(result.stdout)
                if result.stderr:
                    print(result.stderr)
                    
                success = result.returncode == 0
            
            if success:
                self.logger.info(f"Successfully completed: {script_name}")
            else:
                self.logger.error(f"Failed to run {script_name} (return code: {result.returncode})")
            
            return success
            
        except Exception as e:
            self.logger.error(f"Exception running {script_name}: {e}")
            return False
    
    def run_new_pipeline(self, figma_file_id: str, spreadsheet_id: str, direction: str = "figma_to_sheets") -> bool:
        """Run sync using new pipeline architecture"""
        try:
            self.logger.info(f"Starting new pipeline: {figma_file_id} -> {spreadsheet_id}")
            
            # Create sync configuration
            sync_direction = SyncDirection(direction)
            sync_config = SyncConfig(
                direction=sync_direction,
                conflict_resolution=ConflictResolutionStrategy.FIGMA_WINS,
                dry_run=False
            )
            
            # Progress callback
            def progress_callback(message: str, progress: int):
                print(f"📈 {progress:3d}% - {message}")
            
            # Stage callback
            def stage_callback(stage, info):
                print(f"🔄 {stage.value}: {info['status']}")
            
            # Create pipeline configuration
            pipeline_config = PipelineConfig(
                figma_file_id=figma_file_id,
                spreadsheet_id=spreadsheet_id,
                sync_config=sync_config,
                progress_callback=progress_callback,
                stage_callback=stage_callback,
                auto_create_sheet=True,
                backup_before_sync=True,
                validate_after_sync=True
            )
            
            # Execute pipeline
            pipeline_service = self.services['pipeline_service']
            result = pipeline_service.execute_sync_pipeline(pipeline_config)
            
            if result.is_success:
                self.logger.info(f"Pipeline completed successfully: {result.message}")
                print(f"✅ Pipeline completed successfully!")
                print(f"📊 Status: {result.data.status.value}")
                print(f"⏱️  Duration: {result.data.total_duration_seconds:.2f}s")
                print(f"📈 Stages: {result.data.successful_stages}/{result.data.total_stages} successful")
                return True
            else:
                self.logger.error(f"Pipeline failed: {result.message}")
                print(f"❌ Pipeline failed: {result.message}")
                if result.errors:
                    for error in result.errors:
                        print(f"   - {error}")
                return False
                
        except Exception as e:
            self.logger.error(f"Exception in new pipeline: {e}")
            print(f"❌ Pipeline exception: {e}")
            return False
    
    def select_spreadsheet(self) -> Optional[str]:
        """Select spreadsheet from configuration"""
        try:
            spreadsheets = self.config.get("spreadsheets", [])
            if not spreadsheets:
                self.logger.error("No spreadsheets found in configuration")
                return None
            
            print("\n📊 Available spreadsheets:")
            for i, s in enumerate(spreadsheets, 1):
                print(f"  {i}. {s['name']} (ID: {s['id']})")
            
            while True:
                try:
                    choice = int(input("\nSelect a spreadsheet (number): ")) - 1
                    if 0 <= choice < len(spreadsheets):
                        selected = spreadsheets[choice]
                        self.logger.info(f"Selected spreadsheet: {selected['name']}")
                        return selected['id']
                    else:
                        print("❌ Invalid choice. Please select a valid number.")
                except ValueError:
                    print("❌ Please enter a valid number.")
                except KeyboardInterrupt:
                    print("\n⏹️  Operation cancelled.")
                    return None
                    
        except Exception as e:
            self.logger.error(f"Error selecting spreadsheet: {e}")
            return None
    
    def display_menu(self) -> str:
        """Display main menu"""
        print("\n" + "="*50)
        print("🔄 Variables Sync Pipeline - Enhanced Edition")
        print("="*50)
        print("📋 Legacy Workflow:")
        print("  1. Process Variables (legacy process_data.py)")
        print("  2. Push to Google Sheets (legacy setup_sheets.py)")
        print("  3. Run Complete Legacy Pipeline")
        print("")
        print("🚀 New Architecture:")
        print("  4. Run New Pipeline (Figma → Sheets)")
        print("  5. Test New Pipeline (dry run)")
        print("  6. Pipeline Status & Demo")
        print("")
        print("🔧 Utilities:")
        print("  7. Get Figma File Data (get_file_data.py)")
        print("  8. Test Services Setup")
        print("  9. Exit")
        print("")
        print("💡 Note: For Organization PAT, ensure FIGMA_TOKEN is set in .env")
        
        return input("Select an option (1-9): ").strip()
    
    def test_figma_token(self):
        """Test Figma PAT token validity"""
        try:
            figma_service = self.services['figma_service']
            result = figma_service.test_token_validity()
            
            if result.is_success:
                print("✅ Figma PAT Token is valid!")
                if result.data:
                    user_info = result.data
                    print(f"   - User: {user_info.get('handle', 'N/A')}")
                    print(f"   - Name: {user_info.get('name', 'N/A')}")
                    print(f"   - Email: {user_info.get('email', 'N/A')}")
                    print(f"   - ID: {user_info.get('id', 'N/A')}")
            else:
                print(f"❌ Figma PAT Token is invalid: {result.message}")
                if result.errors:
                    for error in result.errors:
                        print(f"   - {error}")
                        
        except Exception as e:
            print(f"❌ Error testing Figma token: {e}")
            self.logger.error(f"Error testing Figma token: {e}")
    
    def test_figma_file_access(self):
        """Test access to Figma files from config"""
        try:
            figma_service = self.services['figma_service']
            result = figma_service.test_file_access_batch()
            
            if result.is_success and result.data:
                test_results = result.data
                print(f"\n📋 Tested {len(test_results)} file(s) from configuration:")
                
                accessible_files = []
                failed_files = []
                
                for file_result in test_results:
                    file_key = file_result.get('file_key', 'Unknown')
                    is_accessible = file_result.get('accessible', False)
                    error = file_result.get('error')
                    
                    if is_accessible:
                        accessible_files.append(file_key)
                        file_info = file_result.get('file_info', {})
                        print(f"   ✅ {file_key} - {file_info.get('name', 'N/A')}")
                    else:
                        failed_files.append((file_key, error))
                        print(f"   ❌ {file_key} - {error}")
                
                print(f"\n📊 Summary:")
                print(f"   - Accessible: {len(accessible_files)} files")
                print(f"   - Failed: {len(failed_files)} files")
                
                if failed_files:
                    print(f"\n⚠️  Failed files typically indicate:")
                    print(f"   - 403 Forbidden: Token lacks permission or file is in private team")
                    print(f"   - 404 Not Found: File doesn't exist or file key is incorrect")
                    print(f"   - Check if your Organization PAT has access to these files")
            else:
                print(f"❌ Failed to test file access: {result.message}")
                if result.errors:
                    for error in result.errors:
                        print(f"   - {error}")
                        
        except Exception as e:
            print(f"❌ Error testing file access: {e}")
            self.logger.error(f"Error testing file access: {e}")
    
    def run_interactive(self):
        """Run interactive pipeline"""
        print("🎉 Welcome to Variables Sync Pipeline!")
        print("📝 Make sure you have configured .env file with your tokens")
        
        while True:
            try:
                choice = self.display_menu()
                self.logger.info(f"User selected option: {choice}")
                
                if choice == "1":
                    print("\n📊 Running process_data.py...")
                    spreadsheet_id = self.select_spreadsheet()
                    if spreadsheet_id:
                        # Get spreadsheet name for legacy script
                        spreadsheets = self.config.get("spreadsheets", [])
                        sheet_name = next((s['name'] for s in spreadsheets if s['id'] == spreadsheet_id), None)
                        if sheet_name:
                            args = f'--sheet "{sheet_name}"'
                            success = self.run_legacy_script("process_data.py", args)
                            if not success:
                                print("❌ Process failed. Check logs for details.")
                
                elif choice == "2":
                    print("\n📤 Running setup_sheets.py...")
                    processed_data_path = self.base_dir / "processed_data.json"
                    if processed_data_path.exists():
                        success = self.run_legacy_script("setup_sheets.py")
                        if not success:
                            print("❌ Setup failed. Check logs for details.")
                    else:
                        print("❌ processed_data.json not found. Run process_data.py first.")
                
                elif choice == "3":
                    print("\n🔄 Running Complete Legacy Pipeline...")
                    spreadsheet_id = self.select_spreadsheet()
                    if spreadsheet_id:
                        # Get spreadsheet name
                        spreadsheets = self.config.get("spreadsheets", [])
                        sheet_name = next((s['name'] for s in spreadsheets if s['id'] == spreadsheet_id), None)
                        if sheet_name:
                            print("📊 Step 1: Processing variables...")
                            args = f'--sheet "{sheet_name}" --auto-push'
                            success = self.run_legacy_script("process_data.py", args)
                            if success:
                                print("📤 Step 2: Pushing to sheets...")
                                success = self.run_legacy_script("setup_sheets.py")
                                if success:
                                    print("✅ Complete legacy pipeline finished successfully!")
                                else:
                                    print("❌ Setup failed. Check logs for details.")
                            else:
                                print("❌ Processing failed. Check logs for details.")
                
                elif choice == "4":
                    print("\n🚀 Running New Pipeline...")
                    figma_file_id = input("Enter Figma File ID: ").strip()
                    spreadsheet_id = self.select_spreadsheet()
                    if figma_file_id and spreadsheet_id:
                        success = self.run_new_pipeline(figma_file_id, spreadsheet_id)
                        if success:
                            print("✅ New pipeline completed successfully!")
                
                elif choice == "5":
                    print("\n🧪 Testing New Pipeline (dry run)...")
                    print("This would run the new pipeline in dry-run mode")
                    # TODO: Implement dry run
                    print("⚠️  Dry run mode not yet implemented")
                
                elif choice == "6":
                    print("\n📈 Pipeline Status & Demo...")
                    subprocess.run([sys.executable, "phase4_cli.py", "status"], cwd=self.base_dir)
                
                elif choice == "7":
                    print("\n📥 Getting Figma File Data...")
                    success = self.run_legacy_script("get_file_data.py")
                    if success:
                        print("✅ Figma data retrieved successfully!")
                
                elif choice == "8":
                    print("\n🔧 Testing Services Setup...")
                    try:
                        services = self.services
                        print("✅ All services initialized successfully:")
                        for service_name, service in services.items():
                            print(f"   - {service_name}: {type(service).__name__}")
                        
                        # Test environment
                        figma_token = os.getenv('FIGMA_TOKEN')
                        google_creds = os.getenv('GOOGLE_CREDENTIALS_FILE')
                        
                        print("\n🔑 Environment Status:")
                        print(f"   - FIGMA_TOKEN: {'✅ Set' if figma_token else '❌ Not set'}")
                        print(f"   - GOOGLE_CREDENTIALS_FILE: {'✅ Set' if google_creds else '❌ Not set'}")
                        
                        if figma_token and figma_token != "mock_token":
                            print("✅ Ready for production use with Organization PAT")
                        else:
                            print("⚠️  Using mock services - set environment variables for production")
                            
                    except Exception as e:
                        print(f"❌ Service setup error: {e}")
                
                elif choice == "9":
                    print("\n🔍 Test Figma PAT Token...")
                    self.test_figma_token()
                    
                elif choice == "10":
                    print("\n🔍 Test Figma File Access...")
                    self.test_figma_file_access()
                
                elif choice == "11":
                    print("\n👋 Goodbye!")
                    self.logger.info("User exited pipeline")
                    break
                
                else:
                    print("❌ Invalid option. Please select 1-9.")
                    
            except KeyboardInterrupt:
                print("\n\n⏹️  Pipeline interrupted by user.")
                self.logger.info("Pipeline interrupted by user")
                break
            except Exception as e:
                self.logger.error(f"Unexpected error: {e}")
                print(f"❌ Unexpected error: {e}")
                print("Please check logs for details.")


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Variables Sync Pipeline - Enhanced Edition")
    parser.add_argument('--config', help='Path to configuration file')
    parser.add_argument('--figma-file-id', help='Figma file ID for direct sync')
    parser.add_argument('--spreadsheet-id', help='Google Spreadsheet ID for direct sync')
    parser.add_argument('--direction', choices=['figma_to_sheets', 'sheets_to_figma', 'bidirectional'], 
                       default='figma_to_sheets', help='Sync direction')
    parser.add_argument('--interactive', action='store_true', default=True, 
                       help='Run in interactive mode (default)')
    parser.add_argument('--dry-run', action='store_true', help='Run in dry-run mode')
    
    args = parser.parse_args()
    
    # Initialize pipeline
    pipeline = VariablesSyncPipeline(args.config)
    
    # Check if direct sync is requested
    if args.figma_file_id and args.spreadsheet_id:
        print("🚀 Running direct sync...")
        success = pipeline.run_new_pipeline(args.figma_file_id, args.spreadsheet_id, args.direction)
        sys.exit(0 if success else 1)
    
    # Run interactive mode
    if args.interactive:
        pipeline.run_interactive()
    else:
        print("Use --interactive for menu-driven operation or provide --figma-file-id and --spreadsheet-id for direct sync")


if __name__ == "__main__":
    main()

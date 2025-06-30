#!/usr/bin/env python3
"""
Pipeline Setup Script
Checks dependencies and environment for Organization PAT usage
"""
import os
import sys
import subprocess
import json
from pathlib import Path
from typing import List, Tuple, Dict

def check_python_version() -> Tuple[bool, str]:
    """Check if Python version is compatible"""
    version = sys.version_info
    if version.major >= 3 and version.minor >= 8:
        return True, f"Python {version.major}.{version.minor}.{version.micro}"
    else:
        return False, f"Python {version.major}.{version.minor}.{version.micro} (requires 3.8+)"

def check_package_installed(package: str) -> bool:
    """Check if a Python package is installed"""
    try:
        __import__(package)
        return True
    except ImportError:
        return False

def install_package(package: str) -> bool:
    """Install a Python package using pip"""
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        return True
    except subprocess.CalledProcessError:
        return False

def check_requirements() -> List[Tuple[str, bool, str]]:
    """Check all required packages"""
    requirements = [
        ("requests", "HTTP requests"),
        ("google-auth", "Google authentication"),
        ("google-auth-oauthlib", "Google OAuth"),
        ("google-auth-httplib2", "Google HTTP lib"),
        ("google-api-python-client", "Google API client"),
        ("python-dotenv", "Environment variables"),
    ]
    
    results = []
    for package, description in requirements:
        # Handle package name differences
        import_name = package
        if package == "google-api-python-client":
            import_name = "googleapiclient"
        elif package == "python-dotenv":
            import_name = "dotenv"
        
        installed = check_package_installed(import_name)
        results.append((package, installed, description))
    
    return results

def check_environment_variables() -> Dict[str, Tuple[bool, str]]:
    """Check environment variables"""
    from dotenv import load_dotenv
    load_dotenv()
    
    env_vars = {
        "FIGMA_TOKEN": "Figma Organization PAT",
        "GOOGLE_CREDENTIALS_FILE": "Google Service Account credentials file"
    }
    
    results = {}
    for var, description in env_vars.items():
        value = os.getenv(var)
        if value and value != "your_figma_organization_pat_here":
            if var == "GOOGLE_CREDENTIALS_FILE":
                file_exists = Path(value).exists()
                results[var] = (file_exists, f"{description} ({'Found' if file_exists else 'File not found'})")
            else:
                results[var] = (True, f"{description} (Set)")
        else:
            results[var] = (False, f"{description} (Not set)")
    
    return results

def check_config_files() -> Dict[str, Tuple[bool, str]]:
    """Check configuration files"""
    base_dir = Path(__file__).parent
    config_files = {
        "process_data_config.json": base_dir / "config" / "process_data_config.json",
        "config.json": base_dir / "config" / "config.json",
        "sheet_config.json": base_dir / "config" / "sheet_config.json"
    }
    
    results = {}
    for name, path in config_files.items():
        if path.exists():
            try:
                with open(path, 'r') as f:
                    json.load(f)
                results[name] = (True, "Valid JSON")
            except json.JSONDecodeError:
                results[name] = (False, "Invalid JSON")
        else:
            results[name] = (False, "File not found")
    
    return results

def create_env_file():
    """Create .env file from example"""
    base_dir = Path(__file__).parent
    env_example = base_dir / ".env.example"
    env_file = base_dir / ".env"
    
    if env_example.exists() and not env_file.exists():
        try:
            with open(env_example, 'r') as src:
                content = src.read()
            with open(env_file, 'w') as dst:
                dst.write(content)
            return True, "Created .env file from .env.example"
        except Exception as e:
            return False, f"Failed to create .env file: {e}"
    elif env_file.exists():
        return True, ".env file already exists"
    else:
        return False, ".env.example not found"

def test_figma_connection() -> Tuple[bool, str]:
    """Test Figma API connection"""
    try:
        import requests
        from dotenv import load_dotenv
        load_dotenv()
        
        token = os.getenv('FIGMA_TOKEN')
        if not token or token == "your_figma_organization_pat_here":
            return False, "FIGMA_TOKEN not configured"
        
        headers = {"X-Figma-Token": token}
        response = requests.get("https://api.figma.com/v1/me", headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            user_name = data.get('name', 'Unknown')
            return True, f"Connected as {user_name}"
        else:
            return False, f"API error: {response.status_code}"
            
    except ImportError:
        return False, "requests package not installed"
    except Exception as e:
        return False, f"Connection error: {e}"

def main():
    """Main setup function"""
    print("🔧 Variables Sync Pipeline - Setup & Verification")
    print("=" * 60)
    
    # Check Python version
    python_ok, python_version = check_python_version()
    print(f"\n🐍 Python Version: {python_version}")
    if not python_ok:
        print("❌ Python 3.8+ is required")
        return False
    else:
        print("✅ Python version compatible")
    
    # Check requirements
    print(f"\n📦 Checking Python Packages:")
    requirements_results = check_requirements()
    missing_packages = []
    
    for package, installed, description in requirements_results:
        status = "✅" if installed else "❌"
        print(f"   {status} {package}: {description}")
        if not installed:
            missing_packages.append(package)
    
    # Install missing packages
    if missing_packages:
        print(f"\n📥 Installing missing packages...")
        for package in missing_packages:
            print(f"   Installing {package}...")
            if install_package(package):
                print(f"   ✅ {package} installed successfully")
            else:
                print(f"   ❌ Failed to install {package}")
                return False
    
    # Check .env file
    print(f"\n📄 Environment Configuration:")
    env_created, env_msg = create_env_file()
    print(f"   {'.env file:' : <20} {'✅' if env_created else '❌'} {env_msg}")
    
    # Check environment variables
    env_results = check_environment_variables()
    for var, (status, description) in env_results.items():
        icon = "✅" if status else "⚠️"
        print(f"   {var : <20} {icon} {description}")
    
    # Check configuration files
    print(f"\n⚙️  Configuration Files:")
    config_results = check_config_files()
    for name, (status, description) in config_results.items():
        icon = "✅" if status else "❌"
        print(f"   {name : <25} {icon} {description}")
    
    # Test Figma connection
    print(f"\n🎨 Figma API Connection:")
    figma_ok, figma_msg = test_figma_connection()
    icon = "✅" if figma_ok else "⚠️"
    print(f"   Connection test: {icon} {figma_msg}")
    
    # Summary
    print(f"\n📋 Setup Summary:")
    
    all_env_ok = all(status for status, _ in env_results.values())
    all_config_ok = all(status for status, _ in config_results.values())
    
    if python_ok and not missing_packages and all_config_ok:
        if all_env_ok and figma_ok:
            print("✅ Pipeline is ready for production use with Organization PAT!")
            print("\n🚀 Quick Start:")
            print("   python pipeline_main.py --interactive")
        else:
            print("⚠️  Pipeline is set up but needs environment configuration")
            print("\n📝 Next Steps:")
            print("   1. Configure your .env file with actual tokens")
            print("   2. Add your Google Service Account credentials file")
            print("   3. Run: python pipeline_main.py --interactive")
    else:
        print("❌ Setup incomplete - please resolve issues above")
        return False
    
    print(f"\n💡 For Organization PAT:")
    print("   - Get your PAT from Figma Organization settings")
    print("   - Organization PATs have higher rate limits")
    print("   - Ensure you have access to the target Figma files")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

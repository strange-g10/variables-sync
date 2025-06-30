#!/usr/bin/env python3
import os
import subprocess
import json
from datetime import datetime

def get_git_info():
    """Lấy thông tin Git"""
    try:
        # Git branch
        branch = subprocess.check_output(['git', 'branch', '--show-current'], 
                                       stderr=subprocess.DEVNULL).decode().strip()
        
        # Git status
        status = subprocess.check_output(['git', 'status', '--porcelain'], 
                                       stderr=subprocess.DEVNULL).decode().strip()
        
        # Last commit
        last_commit = subprocess.check_output(['git', 'log', '-1', '--pretty=format:%h - %s (%cr)'], 
                                            stderr=subprocess.DEVNULL).decode().strip()
        
        return {
            'branch': branch,
            'status': status,
            'last_commit': last_commit,
            'available': True
        }
    except:
        return {'available': False}

def check_virtual_env():
    """Kiểm tra trạng thái môi trường ảo"""
    venv_path = ".venv"
    if os.path.exists(venv_path):
        # Kiểm tra xem có đang active không
        virtual_env = os.environ.get('VIRTUAL_ENV')
        is_active = virtual_env and venv_path in virtual_env
        
        # Đếm số package đã cài
        try:
            result = subprocess.run(['pip', 'list', '--format=freeze'], 
                                  capture_output=True, text=True)
            package_count = len(result.stdout.strip().split('\n')) if result.stdout.strip() else 0
        except:
            package_count = 0
            
        return {
            'exists': True,
            'active': is_active,
            'package_count': package_count
        }
    return {'exists': False}

def check_config_files():
    """Kiểm tra các file cấu hình"""
    config_files = [
        'requirements.txt',
        'credentials.json',
        'config/process_data_config.json',
        'config/config.json',
        'main.py'
    ]
    
    status = {}
    for file in config_files:
        status[file] = {
            'exists': os.path.exists(file),
            'size': os.path.getsize(file) if os.path.exists(file) else 0
        }
    
    return status

def get_recent_logs():
    """Lấy log gần đây"""
    log_files = ['logs/execution.log', 'logs/get_variables_execution.log']
    recent_logs = []
    
    for log_file in log_files:
        if os.path.exists(log_file):
            try:
                with open(log_file, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                    if lines:
                        # Lấy 3 dòng cuối
                        recent_logs.append({
                            'file': log_file,
                            'lines': lines[-3:]
                        })
            except:
                pass
    
    return recent_logs

def format_size(bytes):
    """Format kích thước file"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if bytes < 1024.0:
            return f"{bytes:.1f} {unit}"
        bytes /= 1024.0
    return f"{bytes:.1f} TB"

def main():
    print("🚀 DASHBOARD DỰ ÁN VARIABLES-SYNC")
    print("=" * 60)
    print(f"📅 Thời gian: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"📂 Thư mục: {os.getcwd()}")
    print("=" * 60)
    
    # 1. Thông tin Git
    git_info = get_git_info()
    print("🔗 GIT STATUS")
    print("-" * 30)
    if git_info['available']:
        print(f"🌿 Branch: {git_info['branch']}")
        print(f"📝 Last commit: {git_info['last_commit']}")
        if git_info['status']:
            print(f"⚠️  Uncommitted changes: {len(git_info['status'].split())} files")
        else:
            print("✅ Working directory clean")
    else:
        print("❌ Git không khả dụng hoặc không phải Git repository")
    
    print()
    
    # 2. Môi trường ảo
    venv_info = check_virtual_env()
    print("🐍 PYTHON VIRTUAL ENVIRONMENT")
    print("-" * 30)
    if venv_info['exists']:
        print(f"✅ Virtual environment: Đã tạo")
        print(f"{'🟢' if venv_info['active'] else '🔴'} Status: {'Active' if venv_info['active'] else 'Inactive'}")
        print(f"📦 Packages installed: {venv_info['package_count']}")
    else:
        print("❌ Virtual environment: Chưa tạo")
    
    print()
    
    # 3. File cấu hình
    config_status = check_config_files()
    print("⚙️  CONFIG FILES STATUS")
    print("-" * 30)
    for file, status in config_status.items():
        icon = "✅" if status['exists'] else "❌"
        size_str = format_size(status['size']) if status['exists'] else "N/A"
        print(f"{icon} {file} ({size_str})")
    
    print()
    
    # 4. Logs gần đây
    recent_logs = get_recent_logs()
    print("📋 RECENT LOGS")
    print("-" * 30)
    if recent_logs:
        for log_info in recent_logs:
            print(f"📄 {log_info['file']}:")
            for line in log_info['lines']:
                print(f"   {line.strip()}")
            print()
    else:
        print("🔍 Không có logs gần đây")
    
    print()
    
    # 5. Quick commands
    print("🛠️  QUICK COMMANDS")
    print("-" * 30)
    print("📊 Xem cấu trúc dự án:    python3 show_structure.py")
    print("📈 Theo dõi thay đổi:     python3 monitor_changes.py --changes 24")
    print("📊 Thống kê dự án:        python3 monitor_changes.py --stats")
    print("🐍 Kích hoạt venv:        source .venv/bin/activate")
    print("🚀 Chạy ứng dụng:         python main.py")
    print("📦 Cài đặt packages:      pip install -r requirements.txt")
    
    print("\n" + "=" * 60)
    print("✨ Dashboard updated successfully!")

if __name__ == "__main__":
    main()

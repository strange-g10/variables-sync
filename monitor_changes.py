#!/usr/bin/env python3
import os
import time
from datetime import datetime

def get_file_info(directory, ignore_patterns=None):
    """Lấy thông tin files trong directory"""
    if ignore_patterns is None:
        ignore_patterns = ['.git', '__pycache__', '*.pyc', '.DS_Store', '.venv']
    
    files_info = {}
    
    for root, dirs, files in os.walk(directory):
        # Lọc directories
        dirs[:] = [d for d in dirs if not any(pattern in os.path.join(root, d) for pattern in ignore_patterns)]
        
        for file in files:
            file_path = os.path.join(root, file)
            try:
                stat = os.stat(file_path)
                relative_path = os.path.relpath(file_path, directory)
                files_info[relative_path] = {
                    'size': stat.st_size,
                    'modified': stat.st_mtime
                }
            except (OSError, FileNotFoundError):
                pass
    
    return files_info

def format_size(bytes):
    """Format kích thước file"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if bytes < 1024.0:
            return f"{bytes:.1f} {unit}"
        bytes /= 1024.0
    return f"{bytes:.1f} TB"

def show_recent_changes(directory=".", hours=24):
    """Hiển thị files thay đổi trong X giờ gần đây"""
    current_time = time.time()
    cutoff_time = current_time - (hours * 3600)
    
    print(f"📊 FILES THAY ĐỔI TRONG {hours} GIỜ GẦN ĐÂY")
    print("=" * 60)
    
    recent_files = []
    
    for root, dirs, files in os.walk(directory):
        # Bỏ qua các thư mục không cần thiết
        dirs[:] = [d for d in dirs if d not in ['.git', '__pycache__', '.venv']]
        
        for file in files:
            file_path = os.path.join(root, file)
            try:
                stat = os.stat(file_path)
                if stat.st_mtime > cutoff_time:
                    relative_path = os.path.relpath(file_path, directory)
                    modified_time = datetime.fromtimestamp(stat.st_mtime)
                    recent_files.append({
                        'path': relative_path,
                        'size': stat.st_size,
                        'modified': modified_time,
                        'timestamp': stat.st_mtime
                    })
            except (OSError, FileNotFoundError):
                pass
    
    # Sắp xếp theo thời gian mới nhất
    recent_files.sort(key=lambda x: x['timestamp'], reverse=True)
    
    if not recent_files:
        print(f"🔍 Không có files nào thay đổi trong {hours} giờ gần đây")
        return
    
    print(f"📁 Tìm thấy {len(recent_files)} files thay đổi:")
    print("-" * 60)
    
    for file_info in recent_files[:20]:  # Hiển thị 20 files gần nhất
        modified_str = file_info['modified'].strftime("%Y-%m-%d %H:%M:%S")
        size_str = format_size(file_info['size'])
        print(f"📄 {file_info['path']}")
        print(f"   ⏰ {modified_str} | 💾 {size_str}")
        print()
    
    if len(recent_files) > 20:
        print(f"... và {len(recent_files) - 20} files khác")

def show_directory_stats(directory="."):
    """Hiển thị thống kê thư mục"""
    print("📈 THỐNG KÊ DỰ ÁN")
    print("=" * 40)
    
    # Thống kê theo extension
    extensions = {}
    total_files = 0
    total_size = 0
    
    for root, dirs, files in os.walk(directory):
        dirs[:] = [d for d in dirs if d not in ['.git', '__pycache__', '.venv']]
        
        for file in files:
            file_path = os.path.join(root, file)
            try:
                size = os.path.getsize(file_path)
                ext = os.path.splitext(file)[1].lower() or 'no_ext'
                
                if ext not in extensions:
                    extensions[ext] = {'count': 0, 'size': 0}
                
                extensions[ext]['count'] += 1
                extensions[ext]['size'] += size
                total_files += 1
                total_size += size
            except (OSError, FileNotFoundError):
                pass
    
    print(f"📁 Tổng số files: {total_files}")
    print(f"💾 Tổng kích thước: {format_size(total_size)}")
    print("\n📊 THỐNG KÊ THEO LOẠI FILE:")
    print("-" * 40)
    
    # Sắp xếp theo kích thước
    sorted_ext = sorted(extensions.items(), key=lambda x: x[1]['size'], reverse=True)
    
    for ext, stats in sorted_ext[:10]:
        percentage = (stats['size'] / total_size) * 100
        print(f"{ext:10} | {stats['count']:4} files | {format_size(stats['size']):>8} ({percentage:.1f}%)")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "--changes":
            hours = int(sys.argv[2]) if len(sys.argv) > 2 else 24
            show_recent_changes(".", hours)
        elif sys.argv[1] == "--stats":
            show_directory_stats(".")
        else:
            print("Sử dụng:")
            print("  python3 monitor_changes.py --changes [hours]  # Xem files thay đổi")
            print("  python3 monitor_changes.py --stats           # Xem thống kê")
    else:
        # Mặc định hiển thị cả hai
        show_recent_changes(".", 24)
        print("\n")
        show_directory_stats(".")

#!/usr/bin/env python3
import os
import fnmatch

def should_ignore(path, ignore_patterns):
    """Kiểm tra xem file/folder có nên bỏ qua không"""
    for pattern in ignore_patterns:
        if fnmatch.fnmatch(os.path.basename(path), pattern):
            return True
        if fnmatch.fnmatch(path, pattern):
            return True
    return False

def print_tree(directory, prefix="", ignore_patterns=None, max_depth=None, current_depth=0):
    """In cấu trúc thư mục dạng tree"""
    if ignore_patterns is None:
        ignore_patterns = ['.git', '__pycache__', '*.pyc', '.DS_Store', '.venv/lib', '.venv/include']
    
    if max_depth is not None and current_depth >= max_depth:
        return
    
    if should_ignore(directory, ignore_patterns):
        return
        
    try:
        items = sorted(os.listdir(directory))
    except PermissionError:
        return
    
    dirs = []
    files = []
    
    for item in items:
        item_path = os.path.join(directory, item)
        if should_ignore(item_path, ignore_patterns):
            continue
            
        if os.path.isdir(item_path):
            dirs.append(item)
        else:
            files.append(item)
    
    # In files trước
    for i, file in enumerate(files):
        is_last_file = (i == len(files) - 1) and len(dirs) == 0
        print(f"{prefix}{'└── ' if is_last_file else '├── '}{file}")
    
    # In directories sau
    for i, dir_name in enumerate(dirs):
        is_last = i == len(dirs) - 1
        print(f"{prefix}{'└── ' if is_last else '├── '}{dir_name}/")
        
        dir_path = os.path.join(directory, dir_name)
        extension = "    " if is_last else "│   "
        print_tree(dir_path, prefix + extension, ignore_patterns, max_depth, current_depth + 1)

def get_file_count_and_size(directory, ignore_patterns=None):
    """Đếm số file và tính tổng kích thước"""
    if ignore_patterns is None:
        ignore_patterns = ['.git', '__pycache__', '*.pyc', '.DS_Store', '.venv/lib', '.venv/include']
    
    total_files = 0
    total_size = 0
    
    for root, dirs, files in os.walk(directory):
        # Lọc directories
        dirs[:] = [d for d in dirs if not should_ignore(os.path.join(root, d), ignore_patterns)]
        
        for file in files:
            file_path = os.path.join(root, file)
            if not should_ignore(file_path, ignore_patterns):
                try:
                    size = os.path.getsize(file_path)
                    total_files += 1
                    total_size += size
                except (OSError, FileNotFoundError):
                    pass
    
    return total_files, total_size

def format_size(bytes):
    """Format kích thước file"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if bytes < 1024.0:
            return f"{bytes:.1f} {unit}"
        bytes /= 1024.0
    return f"{bytes:.1f} TB"

if __name__ == "__main__":
    project_dir = "."
    print("🌳 CẤU TRÚC DỰ ÁN VARIABLES-SYNC")
    print("=" * 50)
    
    # Thống kê tổng quan
    file_count, total_size = get_file_count_and_size(project_dir)
    print(f"📁 Tổng số files: {file_count}")
    print(f"💾 Tổng kích thước: {format_size(total_size)}")
    print("=" * 50)
    
    print_tree(project_dir, max_depth=3)
    
    print("\n" + "=" * 50)
    print("📋 MÔ TẢ CÁC THỦ MỤC CHÍNH:")
    print("├── config/          : File cấu hình dự án")
    print("├── scripts/         : Các script xử lý chính")
    print("├── local_data/      : Dữ liệu local cache")
    print("├── processed_data/  : Dữ liệu đã xử lý")
    print("├── raw_data/        : Dữ liệu thô từ Figma")
    print("├── logs/            : File log hệ thống")
    print("├── docs/            : Tài liệu dự án")
    print("├── plugin/          : Plugin Figma")
    print("└── .venv/           : Môi trường ảo Python")

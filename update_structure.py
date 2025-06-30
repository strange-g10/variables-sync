import json
import logging
from pathlib import Path

# Thiết lập logging chỉ hiển thị trên console
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()]
)

# Config gộp trực tiếp vào script
PROJECT_DIR = "."  # Đường dẫn tương đối so với thư mục chứa script
EXECUTE_DIRS = ["plugin"]  # Danh sách thư mục con cần quét (để trống để quét toàn bộ)
EXCLUDED_DIRS = ["plugin\ode_modules","docs",".venv","venv", ".git","logs"]  # Thư mục bị bỏ qua nội dung (dựa trên relative path)

def scan_directory(directory: Path, project_root: Path) -> dict:
    """Quét thư mục và trả về cấu trúc metadata đầy đủ."""
    metadata = {
        "name": directory.name,
        "type": "folder" if directory.is_dir() else "file",
        "relative_path": str(directory.relative_to(project_root)),
        "children": []
    }
    
    if directory.is_dir():
        # Kiểm tra nếu đường dẫn tương đối của thư mục nằm trong danh sách bỏ qua
        if metadata["relative_path"] in EXCLUDED_DIRS:
            logging.info(f"Excluded directory contents: {metadata['relative_path']}")
            return metadata  # Trả về metadata mà không quét nội dung con
        
        try:
            for item in directory.iterdir():
                # Bỏ qua script chính để không tự quét
                if item.name == "update_structure.py":
                    continue
                metadata["children"].append(scan_directory(item, project_root))
            logging.info(f"Scanned directory: {metadata['relative_path']}")
        except Exception as e:
            logging.error(f"Error scanning {directory}: {e}")
    
    return metadata

def generate_ascii_tree(metadata: dict, prefix: str = "", is_last: bool = True) -> str:
    """Tạo chuỗi cây ASCII từ metadata."""
    tree_str = ""
    
    if prefix == "":
        tree_str += f"{metadata['name']}\\"
    else:
        connector = "└── " if is_last else "├── "
        tree_str += f"{prefix}{connector}{metadata['name']}"
        if metadata.get("type") == "folder":
            tree_str += "\\"
    
    children = metadata.get("children", [])
    for i, child in enumerate(children):
        is_last_child = (i == len(children) - 1)
        new_prefix = prefix + ("    " if is_last else "│   ")
        tree_str += "\n" + generate_ascii_tree(child, new_prefix, is_last_child)
    
    return tree_str

def main():
    # Lấy thư mục chứa script làm gốc
    script_dir = Path(__file__).parent
    project_root = (script_dir / PROJECT_DIR).resolve()
    execute_dirs = EXECUTE_DIRS
    
    # Quét cấu trúc đầy đủ
    if not execute_dirs:
        structure = scan_directory(project_root, project_root)
        output_file = script_dir / f"metadata-{project_root.name}.json"
        simple_output_file = script_dir / f"simple_tree-{project_root.name}.txt"
    else:
        structure = {"name": "root", "type": "folder", "relative_path": ".", "children": []}
        for dir_name in execute_dirs:
            dir_path = project_root / dir_name
            if dir_path.exists() and dir_path.is_dir():
                structure["children"].append(scan_directory(dir_path, project_root))
            else:
                logging.warning(f"Directory not found: {dir_name}")
        output_file = script_dir / "metadata-project.json"
        simple_output_file = script_dir / "simple_tree-project.txt"
    
    # Ghi cấu trúc đầy đủ ra file JSON
    try:
        with open(output_file, "w") as f:
            json.dump(structure, f, indent=4)
        logging.info(f"Full metadata written to {output_file}")
    except Exception as e:
        logging.error(f"Error writing full JSON: {e}")
    
    # Tạo và ghi cây ASCII ra file text
    try:
        ascii_tree = generate_ascii_tree(structure)
        with open(simple_output_file, "w", encoding="utf-8") as f:
            f.write(ascii_tree)
        logging.info(f"ASCII tree written to {simple_output_file}")
    except Exception as e:
        logging.error(f"Error writing ASCII tree: {e}")

if __name__ == "__main__":
    main()
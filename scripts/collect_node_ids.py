import json
import os
import logging
import re
import argparse
from collections import defaultdict

# Setup logging
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOG_DIR = os.path.join(BASE_DIR, "logs")
os.makedirs(LOG_DIR, exist_ok=True)
logging.basicConfig(
    filename=os.path.join(LOG_DIR, "execution.log"),
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger()

# Paths
RAW_DATA_DIR = os.path.join(BASE_DIR, "raw_data", "pages")
CONFIG_DIR = os.path.join(BASE_DIR, "config")
OUTPUT_PATH = os.path.join(BASE_DIR, "processed_data", "node_ids_mapping.json")

# Argument parser
parser = argparse.ArgumentParser(description="Collect Node IDs from Figma data")
parser.add_argument("--input", help="Input JSON file path (optional)")
parser.add_argument("--config", help="Config file name (optional)")
args = parser.parse_args()

# Hàm chọn file từ thư mục
def select_input_file():
    files = [f for f in os.listdir(RAW_DATA_DIR) if f.endswith("-raw.json")]
    if not files:
        logger.error(f"No raw JSON files found in {RAW_DATA_DIR}")
        raise FileNotFoundError(f"No raw JSON files found in {RAW_DATA_DIR}")
    
    print("\nAvailable raw data files:")
    for i, file in enumerate(files, 1):
        print(f"{i}. {file}")
    choice = int(input("Select a file (number): ")) - 1
    if 0 <= choice < len(files):
        return os.path.join(RAW_DATA_DIR, files[choice])
    else:
        logger.error(f"Invalid file selection: {choice}")
        raise ValueError("Invalid file selection")

# Hàm chọn config
def select_config():
    configs = [f for f in os.listdir(CONFIG_DIR) if f.startswith("naming_config") and f.endswith(".json")]
    if not configs:
        logger.error(f"No config files found in {CONFIG_DIR}")
        raise FileNotFoundError(f"No config files found in {CONFIG_DIR}")
    
    print("\nAvailable config files:")
    for i, config in enumerate(configs, 1):
        print(f"{i}. {config}")
    choice = int(input("Select a config (number): ")) - 1
    if 0 <= choice < len(configs):
        return os.path.join(CONFIG_DIR, configs[choice])
    else:
        logger.error(f"Invalid config selection: {choice}")
        raise ValueError("Invalid config selection")

# Hàm duyệt cây node để thu thập và sắp xếp tên node
def collect_sorted_nodes(node, root_pattern, sort_groups):
    root_matcher = re.compile(root_pattern)
    node_dict = defaultdict(list)
    found_nodes = defaultdict(int)
    missing_nodes = defaultdict(int)

    def traverse(node, current_root=None, depth=0):
        name = node.get("name", "")
        node_id = node.get("id", "")
        if depth == 1:
            logger.debug(f"Top-level node: {name}")
        if root_matcher.match(name):
            current_root = name
            logger.info(f"Found root: {current_root} at depth {depth}")

        if current_root and "children" in node:
            for child in node["children"]:
                child_name = child.get("name", "")
                child_id = child.get("id", "")
                for group in sort_groups:
                    prefix_pattern = re.compile(group["prefix"])
                    if prefix_pattern.match(child_name):
                        node_dict[current_root].append({"name": child_name, "id": child_id})
                        found_nodes[group["prefix"]] += 1
                        logger.debug(f"Found node: {child_name} (ID: {child_id}) under {current_root}")
                traverse(child, current_root, depth + 1)
        elif "children" in node:
            for child in node["children"]:
                traverse(child, current_root, depth + 1)

    logger.debug(f"Starting traversal with root_pattern: {root_pattern}")
    traverse(node)

    result = {}
    for root, nodes in node_dict.items():
        sorted_nodes = []
        for group in sort_groups:
            prefix = group["prefix"]
            if "range" in group:
                row_range = range(group["range"]["rows"][0], group["range"]["rows"][1] + 1)
                col_range = range(group["range"]["cols"][0], group["range"]["cols"][1] + 1)
                for row in row_range:
                    for col in col_range:
                        expected_name = f"{prefix}{col}"
                        expected_name = expected_name.replace("Row_\\d+", f"Row_{row}")
                        for node_entry in nodes:
                            if node_entry["name"] == expected_name:
                                sorted_nodes.append(node_entry)
                                break
                        else:
                            missing_nodes[prefix] += 1
            else:
                # Nếu không có range, chỉ cần lấy tất cả node con khớp prefix
                prefix_pattern = re.compile(prefix)
                for node_entry in nodes:
                    if prefix_pattern.match(node_entry["name"]):
                        sorted_nodes.append(node_entry)
        result[root] = {
            "type": "tree",
            "nodes": sorted_nodes
        }
        logger.info(f"Collected and sorted {len(sorted_nodes)} nodes for {root}")

    for group in sort_groups:
        prefix_str = group["prefix"]
        found = found_nodes[prefix_str]
        missing = missing_nodes[prefix_str]
        logger.info(f"Summary for prefix '{prefix_str}': Found {found} nodes, Missing {missing} nodes")

    if not node_dict:
        logger.warning("No roots or matching nodes found in the data")

    return result

# Xử lý dữ liệu từ file JSON
# Sửa lại để duyệt qua từng cấu hình trong mảng config

def process_file(file_path, config_list):
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    logger.info(f"Processing file: {file_path}")

    if "nodes" not in data:
        logger.error("No 'nodes' key in JSON data")
        return {}
    elif "document" not in data["nodes"]:
        logger.error("No 'document' key in nodes")
        return {}
    else:
        logger.debug(f"Data structure: nodes.document.name = {data['nodes'].get('document', {}).get('name', 'N/A')}")

    root_node = data["nodes"]["document"]
    logger.info("Scanning from nodes.document")
    
    # Kết quả tổng hợp từ nhiều cấu hình
    final_result = {}
    for config in config_list:
        result = collect_sorted_nodes(root_node, config["root_pattern"], config["sort_groups"])
        # Gộp kết quả vào final_result
        final_result.update(result)
    return final_result

# Main logic
def main():
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    
    # Chọn file đầu vào
    input_file = args.input or select_input_file()
    if not os.path.exists(input_file):
        logger.error(f"Input file not found: {input_file}")
        raise FileNotFoundError(f"Input file not found: {input_file}")
    
    # Chọn config
    config_file = args.config or select_config()
    with open(config_file, "r", encoding="utf-8") as f:
        naming_config = json.load(f)
    logger.info(f"Using config: {config_file}")
    
    # Xử lý và lưu kết quả
    mapping = process_file(input_file, naming_config)
    
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(mapping, f, ensure_ascii=False, indent=2)
    logger.info(f"Saved node mapping to {OUTPUT_PATH}")
    print(f"Node mapping saved to {OUTPUT_PATH}")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        logger.error(f"Script failed: {e}")
        print(f"Error: {e}")
import requests
import json
import os
import logging
import time
from datetime import datetime
import argparse

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

# Load config
CONFIG_PATH = os.path.join(BASE_DIR, "config", "get_file_data_config.json")
try:
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        config = json.load(f)
    logger.info(f"Loaded config from {CONFIG_PATH}")
except Exception as e:
    logger.error(f"Failed to load config: {e}")
    raise

# Figma API setup
token = config["figma_token"]
headers = {"X-Figma-Token": token}
raw_data_dir = config["raw_data_dir"]
os.makedirs(raw_data_dir, exist_ok=True)
MAX_REQUESTS = config.get("max_requests_per_minute", 60)
SYNC_FILE = os.path.join(raw_data_dir, "sync_data.json")
TIMEOUT = config.get("timeout", 30)
RETRY_DELAY = config.get("retry_delay", 5)

# Argument parser
parser = argparse.ArgumentParser(description="Fetch Figma file data")
parser.add_argument("--sync", action="store_true", help="Only sync file_keys and pages")
parser.add_argument("--fetch", action="store_true", help="Only fetch node data from synced data")
args = parser.parse_args()

# Hàm gọi API với retry
def fetch_api(url, retries=3, timeout=TIMEOUT, retry_delay=RETRY_DELAY):
    for attempt in range(retries):
        try:
            response = requests.get(url, headers=headers, timeout=timeout)
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 429:
                logger.warning(f"Rate limit hit for {url}, retrying after {retry_delay}s (attempt {attempt + 1})")
                time.sleep(retry_delay)
            elif response.status_code == 400:
                logger.error(f"Attempt {attempt + 1} failed for {url}: {response.status_code} - {response.text}")
                return {"error": "request_too_large", "message": response.text}
            else:
                logger.error(f"Attempt {attempt + 1} failed for {url}: {response.status_code} - {response.text}")
                return None
        except requests.Timeout:
            logger.error(f"Timeout on attempt {attempt + 1} for {url} after {timeout}s")
            time.sleep(retry_delay)
    logger.error(f"Failed to fetch {url} after {retries} retries")
    return None

# Sync file_keys và pages
def sync_files(file_keys):
    valid_files = {}
    request_count = 0
    
    total_files = len(file_keys)
    if total_files > MAX_REQUESTS:
        logger.warning(f"Number of file_keys ({total_files}) exceeds max requests ({MAX_REQUESTS})")
        print(f"Warning: {total_files} file_keys may take ~{total_files * 0.2} seconds. Proceed? (y/n): ")
        if input().strip().lower() != "y":
            raise KeyboardInterrupt("User stopped process")
    
    logger.info(f"Syncing {total_files} File_Keys...")
    print(f"Syncing {total_files} File_Keys...")
    for i, file_key in enumerate(file_keys, 1):
        if request_count >= MAX_REQUESTS:
            logger.warning(f"Reached request limit ({MAX_REQUESTS}) in sync")
            print(f"Warning: Reached request limit ({MAX_REQUESTS}). Stopping sync.")
            break
        
        # Thử fetch với depth=1 để chỉ lấy danh sách page
        url = f"https://api.figma.com/v1/files/{file_key}?depth=1"
        data = fetch_api(url)
        
        if data and "error" in data and data["error"] == "request_too_large":
            logger.warning(f"File {file_key} too large for full fetch. Please provide specific node IDs.")
            print(f"File {file_key} is too large. Provide node IDs (e.g., from Figma URL) to fetch specific pages.")
            node_ids = input("Enter node IDs (comma-separated, or 'skip' to skip): ").strip()
            if node_ids.lower() == "skip":
                logger.info(f"Skipped large file: {file_key} [{i}/{total_files}]")
                print(f"Skipped {file_key} ({i}/{total_files})")
                continue
            
            # Fetch từng node thay vì toàn bộ file
            url = f"https://api.figma.com/v1/files/{file_key}/nodes?ids={node_ids}"
            data = fetch_api(url)
            if data and "nodes" in data:
                file_name = data.get("name", f"Unnamed_{file_key[:8]}")
                pages = [{"name": node.get("name", f"Node_{nid}"), "id": nid} for nid, node in data["nodes"].items()]
                valid_files[file_name] = {"file_key": file_key, "pages": pages}
                logger.info(f"Synced {file_name} ({file_key}) with {len(pages)} nodes [{i}/{total_files}]")
                print(f"Synced {file_name} ({i}/{total_files})")
                request_count += 1
            else:
                logger.warning(f"Failed to fetch nodes for {file_key} [{i}/{total_files}]")
                print(f"Failed to fetch nodes for {file_key} ({i}/{total_files})")
        elif data and "document" in data:
            file_name = data.get("name", f"Unnamed_{file_key[:8]}")
            pages = [{"name": page["name"], "id": page["id"]} for page in data["document"]["children"]]
            valid_files[file_name] = {"file_key": file_key, "pages": pages}
            logger.info(f"Synced {file_name} ({file_key}) with {len(pages)} pages [{i}/{total_files}]")
            print(f"Synced {file_name} ({i}/{total_files})")
            request_count += 1
        else:
            logger.warning(f"File_Key invalid or failed to fetch: {file_key} [{i}/{total_files}]")
            print(f"Invalid or failed file_key: {file_key} ({i}/{total_files})")
        time.sleep(0.2)
    
    sync_data = {"timestamp": datetime.now().strftime("%Y%m%d_%H%M%S"), "files": valid_files}
    with open(SYNC_FILE, "w", encoding="utf-8") as f:
        json.dump(sync_data, f, ensure_ascii=False, indent=2)
    logger.info(f"Saved sync data to {SYNC_FILE}")
    print(f"Sync completed. Estimated time: {request_count * 0.2 + request_count} seconds. Data saved to {SYNC_FILE}")
    return sync_data, request_count

# Chọn file_name
def select_file(sync_data):
    files = sync_data["files"]
    if not files:
        logger.error("No valid files in sync data")
        raise ValueError("No valid files found")
    
    print(f"\nSynced files available ({len(files)} found):")
    file_list = list(files.keys())
    for i, file_name in enumerate(file_list, 1):
        print(f"{i}. {file_name}")
    print("0. All files")
    print("s. Stop process")
    
    choice = input("Select a file (number), 0 for all, or 's' to stop: ").strip().lower()
    if choice == "s":
        raise KeyboardInterrupt("User stopped process")
    elif choice == "0":
        return file_list
    try:
        idx = int(choice) - 1
        if 0 <= idx < len(file_list):
            return [file_list[idx]]
        raise ValueError
    except ValueError:
        logger.error(f"Invalid file selection: {choice}")
        raise ValueError(f"Invalid selection: {choice}")

# Chọn pages
def select_pages(sync_data, selected_files):
    selected_pages = {}
    for file_name in selected_files:
        pages = sync_data["files"][file_name]["pages"]
        if not pages:
            logger.warning(f"No pages found for {file_name}")
            print(f"No pages available for {file_name}")
            continue
        
        print(f"\nPages in {file_name} ({len(pages)} found):")
        for i, page in enumerate(pages, 1):
            print(f"{i}. {page['name']} (ID: {page['id']})")
        print("0. All pages")
        print("s. Stop process")
        
        choice = input("Select a page (number), 0 for all, or 's' to stop: ").strip().lower()
        if choice == "s":
            raise KeyboardInterrupt("User stopped process")
        elif choice == "0":
            selected_pages[file_name] = pages
        else:
            try:
                idx = int(choice) - 1
                if 0 <= idx < len(pages):
                    selected_pages[file_name] = [pages[idx]]
                else:
                    raise ValueError
            except ValueError:
                logger.error(f"Invalid page selection for {file_name}: {choice}")
                raise ValueError(f"Invalid page selection: {choice}")
    return selected_pages

# Fetch node data với naming theo page

def fetch_node_data(sync_data, selected_pages=None):
    pages_dir = os.path.join(raw_data_dir, "pages")
    os.makedirs(pages_dir, exist_ok=True)
    
    if selected_pages is None:
        selected_files = select_file(sync_data)
        selected_pages = select_pages(sync_data, selected_files)
    
    for file_name, pages in selected_pages.items():
        file_key = sync_data["files"][file_name]["file_key"]
        node_ids = [page["id"] for page in pages]
        url = f"https://api.figma.com/v1/files/{file_key}/nodes?ids={','.join(node_ids)}"
        data = fetch_api(url)
        if data and "error" not in data:
            for page in pages:
                page_name = page["name"].replace(" ", "_")
                output_file = os.path.join(pages_dir, f"{file_name}_{page_name}_Fetch-raw.json")
                if os.path.exists(output_file):
                    print(f"File {output_file} already exists. Overwrite? (y/n): ")
                    if input().strip().lower() != "y":
                        logger.info(f"Skipped overwriting {output_file}")
                        print(f"Skipped {output_file}")
                        continue
                output = {
                    "file_key": file_key,
                    "file_name": file_name,
                    "page": {"name": page["name"], "id": page["id"]},
                    "nodes": data["nodes"].get(page["id"], {})
                }
                with open(output_file, "w", encoding="utf-8") as f:
                    json.dump(output, f, ensure_ascii=False, indent=2)
                logger.info(f"Saved node data to {output_file} (Size: {os.path.getsize(output_file)} bytes)")
                print(f"Node data saved to {output_file}")
        else:
            logger.error(f"Failed to fetch nodes for {file_name}")
            print(f"Error fetching nodes for {file_name}")
        time.sleep(0.2)

# Menu lựa chọn sync
def sync_menu(file_keys):
    sync_data = {}
    if os.path.exists(SYNC_FILE):
        with open(SYNC_FILE, "r", encoding="utf-8") as f:
            sync_data = json.load(f)
        print(f"\nFound existing sync data from {sync_data['timestamp']}")
    
    print("\nSync options:")
    print("1. Sync file_keys (fetch new file and page list from API)")
    print("2. Use existing page data (from sync_data.json)")
    print("s. Stop process")
    
    choice = input("Select an option (1-2) or 's' to stop: ").strip().lower()
    if choice == "s":
        raise KeyboardInterrupt("User stopped process")
    elif choice == "1":
        sync_data, _ = sync_files(file_keys)
    elif choice == "2":
        if not sync_data:
            logger.error("No existing sync data found")
            raise ValueError("No existing sync data found. Please sync file_keys first.")
        print("Using existing sync data")
    else:
        logger.error(f"Invalid sync option: {choice}")
        raise ValueError(f"Invalid option: {choice}")
    return sync_data

# Main logic
def main():
    file_keys = config["file_keys"]
    
    if args.sync:
        sync_files(file_keys)
        logger.info("Sync process completed")
        print("Sync process completed")
        return
    
    if args.fetch:
        if not os.path.exists(SYNC_FILE):
            logger.error("No sync data found. Run with --sync first.")
            print("Error: No sync data found. Run 'python get_file_data.py --sync' first.")
            return
        with open(SYNC_FILE, "r", encoding="utf-8") as f:
            sync_data = json.load(f)
        fetch_node_data(sync_data)
        logger.info("Fetch process completed")
        print("Fetch process completed")
        return
    
    # Nếu không có argument, chạy menu tương tác
    sync_data = sync_menu(file_keys)
    fetch_node_data(sync_data)
    
    logger.info("Full process completed")
    print("Full process completed")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("Process stopped by user")
        print("\nProcess stopped by user")
    except Exception as e:
        logger.error(f"Script failed: {e}")
        print(f"Error: {e}")
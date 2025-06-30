import json
import os
import logging
import argparse
import time

# Setup logging
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOG_DIR = os.path.join(BASE_DIR, "logs")
os.makedirs(LOG_DIR, exist_ok=True)
logging.basicConfig(filename=os.path.join(LOG_DIR, "execution.log"), level=logging.INFO, 
                    format="%(asctime)s - %(levelname)s - %(message)s", force=True)
logger = logging.getLogger()

# Load config
CONFIG_PATH = os.path.join(BASE_DIR, "config", "process_data_config.json")
try:
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        config = json.load(f)
    logger.info(f"Loaded config from {CONFIG_PATH}")
except Exception as e:
    logger.error(f"Failed to load config: {e}")
    raise

# Command-line arguments
parser = argparse.ArgumentParser(description="Process Variables data")
parser.add_argument("--sheet", type=str, required=True, help="Spreadsheet name to process (e.g., 'Variables Sheet 1')")
parser.add_argument("--auto-push", action="store_true", help="Auto push data to processed_data.json without prompt")
parser.add_argument("--files", type=str, help="Comma-separated list of JSON files in local_data to process (optional)")
args = parser.parse_args()

# Select spreadsheet
spreadsheets = config["spreadsheets"]
selected_sheet = next((s for s in spreadsheets if s["name"] == args.sheet), None)
if not selected_sheet:
    logger.error(f"Spreadsheet name '{args.sheet}' not found in config")
    raise ValueError(f"Spreadsheet name '{args.sheet}' not found in config")

spreadsheet_id = selected_sheet["id"]
local_data_dir = config["local_data_dir"]

# Chọn file để xử lý
all_json_files = [f for f in os.listdir(local_data_dir) if f.endswith(".json")]
selected_files = []
if args.files:
    selected_files = [f.strip() for f in args.files.split(",") if f.strip() in all_json_files]
else:
    print("\nAvailable JSON files in local_data:")
    for idx, fname in enumerate(all_json_files, 1):
        print(f"{idx}. {fname}")
    file_input = input("Select files to process (e.g. 1,3,5 or leave empty for all): ").strip()
    if file_input:
        indices = [int(i)-1 for i in file_input.split(",") if i.strip().isdigit() and 0 < int(i) <= len(all_json_files)]
        selected_files = [all_json_files[i] for i in indices]
    else:
        selected_files = all_json_files

# Process Variables
start_time = time.time()
processed_variables = {}
for file_name in selected_files:
    file_path = os.path.join(local_data_dir, file_name)
    logger.info(f"[PROCESS] Start file: {file_name}")
    print(f"[PROCESS] Start file: {file_name}")
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            logger.info(f"[PROCESS] Reading file: {file_path}")
            data = json.load(f)
        variables = data.get("variables", [])
        logger.info(f"[PROCESS] Found {len(variables)} variables in {file_name}")
        collections = {v["collectionName"]: v["collectionId"] for v in variables}
        logger.info(f"[PROCESS] Collections in {file_name}: {list(collections.keys())}")
        for collection_name in collections.keys():
            logger.info(f"[PROCESS] Start collection: {collection_name} in {file_name}")
            modes = []
            for var in variables:
                if var["collectionName"] == collection_name:
                    modes = list(var["valuesByMode"].keys())
                    break
            logger.info(f"[PROCESS] Modes for collection {collection_name}: {modes}")
            header = ["name", "type", "VariableKey", "VariableID"]
            for mode in modes:
                header.append(mode)
                header.append(f"{mode}_Variable_Alias")
            sheet_data = [header]
            for var in variables:
                if var["collectionName"] == collection_name:
                    row = [var["name"], var["type"], var.get("key", ""), var["id"]]
                    for mode in modes:
                        value = var["valuesByMode"].get(mode, "")
                        is_alias = isinstance(value, dict) and value.get("type") == "VARIABLE_ALIAS"
                        if is_alias:
                            row.append(value["id"])
                            row.append(True)
                        else:
                            if isinstance(value, bool):
                                row.append(value)
                                row.append(False)
                            else:
                                row.append(value if value else "")
                                row.append(False)
                    sheet_data.append(row)
            logger.info(f"[PROCESS] Finished collection: {collection_name} in {file_name}, rows: {len(sheet_data)-1}")
            processed_variables[collection_name] = sheet_data
            print(f"Processed variables '{collection_name}' from {file_name}: {len(sheet_data)-1} variables")
    except Exception as e:
        logger.error(f"Failed to process file {file_path}: {e}")
        print(f"[ERROR] Failed to process file {file_path}: {e}")
        continue

# Save and push
if processed_variables:
    end_time = time.time()
    print("\nSummary of processed data:")
    logger.info("Summary of processed data:")
    for collection_name, sheet_data in processed_variables.items():
        summary = f" - Variables '{collection_name}': {len(sheet_data)-1} variables"
        print(summary)
        logger.info(summary)
    
    if args.auto_push:
        with open(os.path.join(BASE_DIR, "processed_data.json"), "w", encoding="utf-8") as f:
            json.dump({"variables": processed_variables, "spreadsheet_id": spreadsheet_id}, f, ensure_ascii=False, indent=2)
        logger.info(f"Auto-saved processed data to processed_data.json (Time: {end_time - start_time:.3f}s)")
        print("Processed data auto-saved for setup_sheets.py")
    else:
        choice = input("\nPush to Google Sheet? (y/n/adjust): ").lower()
        if choice == "y":
            with open(os.path.join(BASE_DIR, "processed_data.json"), "w", encoding="utf-8") as f:
                json.dump({"variables": processed_variables, "spreadsheet_id": spreadsheet_id}, f, ensure_ascii=False, indent=2)
            logger.info(f"Processed data saved for setup_sheets.py (Time: {end_time - start_time:.3f}s)")
            print("Processed data saved for setup_sheets.py")
        elif choice == "n":
            print("Data not pushed to Google Sheet")
            logger.info("Data not pushed to Google Sheet")
        elif choice == "adjust":
            print("Please adjust the JSON files in local_data/ and rerun the script")
            logger.info("User chose to adjust data")
        else:
            print("Invalid choice. Please enter 'y', 'n', or 'adjust'")
            logger.warning("Invalid choice entered by user")

logger.info(f"Script execution completed (Total time: {time.time() - start_time:.3f}s)")
print("Summary: Script execution completed")
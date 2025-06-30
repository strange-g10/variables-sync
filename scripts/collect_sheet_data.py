import json
import os
import logging
from google.oauth2 import service_account
from googleapiclient.discovery import build
import argparse

# Setup logging
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOG_DIR = os.path.join(BASE_DIR, "logs")
SHEET_DATA_DIR = os.path.join(BASE_DIR, "sheet_data")
CONFIG_DIR = os.path.join(BASE_DIR, "config")
os.makedirs(LOG_DIR, exist_ok=True)
os.makedirs(SHEET_DATA_DIR, exist_ok=True)
logging.basicConfig(
    filename=os.path.join(LOG_DIR, "sheet_execution.log"),
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger()

# Hàm xác thực Google Sheets API
def get_sheets_service():
    SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"]
    config_file = os.path.join(CONFIG_DIR, "sheet_config.json")
    with open(config_file, "r", encoding="utf-8") as f:
        config = json.load(f)
    credentials_file = config.get("credentials_file", "./credentials.json")
    
    credentials = service_account.Credentials.from_service_account_file(
        credentials_file, scopes=SCOPES
    )
    return build("sheets", "v4", credentials=credentials)

# Hàm đọc dữ liệu từ sheet
def get_sheet_data(service, spreadsheet_id, range_name):
    result = (
        service.spreadsheets()
        .values()
        .get(spreadsheetId=spreadsheet_id, range=range_name)
        .execute()
    )
    return result.get("values", [])

# Hàm xử lý Role Importer
def process_role_importer(service, scenario_config):
    spreadsheet_id = scenario_config["collect_spreadsheet"]
    sheet_name = scenario_config["collect_sheet"]
    mode_name = scenario_config["mode_name"]
    collection_name = scenario_config["collection_name"]
    
    # Lấy dữ liệu
    mode_data = {}
    for mode, range_info in mode_name.items():
        range_name = f"{sheet_name}!{range_info['first_cell']}:{range_info['last_cell']}"
        logger.info(f"Fetching data for {mode}: {range_name}")
        data = get_sheet_data(service, spreadsheet_id, range_name)
        if not data:
            logger.warning(f"No data found in range {range_name}")
            return None
        mode_data[mode] = data
    
    num_rows = min(len(mode_data["VN"]), len(mode_data["EN"]))
    logger.info(f"Total rows fetched: {num_rows}")
    block_height = 7
    block_width = 8
    nodes = []
    
    for block_start_row in range(0, num_rows, block_height):
        block_end_row = min(block_start_row + block_height, num_rows)
        block_idx = block_start_row // block_height + 1
        
        block_row_count = block_end_row - block_start_row
        if block_row_count < block_height and block_end_row == num_rows:
            missing_rows = block_height - block_row_count
            logger.warning(f"Block 'Role-Body-{block_idx}' is incomplete: Missing {missing_rows} rows")
        
        for row_idx in range(block_start_row, block_end_row):
            vn_row = mode_data["VN"][row_idx] + [""] * (block_width - len(mode_data["VN"][row_idx]))
            en_row = mode_data["EN"][row_idx] + [""] * (block_width - len(mode_data["EN"][row_idx]))
            
            row_num_base = (row_idx % block_height) + 1
            relative_row = row_idx - block_start_row
            
            for col_idx in range(block_width):
                if col_idx < 4:
                    col_num = col_idx + 1
                    row_num = row_num_base
                else:
                    col_num = (col_idx - 4) + 1
                    if relative_row >= 3:
                        continue
                    row_num = row_num_base + 7
                
                if row_num == 8 and col_num in [2, 3, 4]:
                    continue
                
                vn_value = vn_row[col_idx].strip() if col_idx < len(vn_row) else ""
                en_value = en_row[col_idx].strip() if col_idx < len(en_row) else ""
                
                block_name = f"Role-Body-{block_idx}"
                
                nodes.append({
                    "id": "",
                    "name": f"{block_name}/Row_{row_num}_Text_Col_{col_num}",
                    "type": "STRING",
                    "valuesByMode": {
                        "VN": vn_value if vn_value else " ",
                        "EN": en_value if en_value else " "
                    },
                    "collectionId": "",
                    "collectionName": collection_name
                })
                nodes.append({
                    "id": "",
                    "name": f"{block_name}/Row_{row_num}_Visible_Col_{col_num}",
                    "type": "BOOLEAN",
                    "valuesByMode": {
                        "VN": bool(vn_value),
                        "EN": bool(en_value)
                    },
                    "collectionId": "",
                    "collectionName": collection_name
                })
    
    # Lưu kết quả với cấu trúc mới
    output_file = os.path.join(SHEET_DATA_DIR, "Role Importer.json")
    output_data = {
        "variables": nodes
    }
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
    logger.info(f"Saved Role Importer data to {output_file}")
    return output_file

# Main logic
def main():
    parser = argparse.ArgumentParser(description="Collect data from Google Sheets")
    parser.add_argument("--scenario", help="Scenario to execute (e.g., 'Role Importer')")
    args = parser.parse_args()
    
    config_file = os.path.join(CONFIG_DIR, "sheet_config.json")
    with open(config_file, "r", encoding="utf-8") as f:
        config = json.load(f)
    
    scenarios = config["scenarios"]
    available_scenarios = list(scenarios.keys())
    
    if not args.scenario:
        print("Available scenarios:")
        for i, scenario in enumerate(available_scenarios):
            print(f"{i}. {scenario}")
        choice = input("Select a scenario (number): ")
        try:
            args.scenario = available_scenarios[int(choice)]
        except (ValueError, IndexError):
            logger.error(f"Invalid selection: {choice}")
            raise ValueError(f"Please select a valid number between 0 and {len(available_scenarios) - 1}")
    
    if args.scenario not in scenarios:
        logger.error(f"Invalid scenario: {args.scenario}")
        raise ValueError(f"Scenario must be one of: {', '.join(available_scenarios)}")
    
    service = get_sheets_service()
    
    for scenario_config in scenarios[args.scenario]:
        if args.scenario == "Role Importer":
            process_role_importer(service, scenario_config)
        # Thêm các scenario khác sau này (ví dụ: Table Importer)

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        logger.error(f"Script failed: {e}")
        print(f"Error: {e}")
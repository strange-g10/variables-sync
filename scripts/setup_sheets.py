import json
import os
from google.oauth2 import service_account
from googleapiclient.discovery import build
import logging

# Setup logging
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOG_DIR = os.path.join(BASE_DIR, "logs")
os.makedirs(LOG_DIR, exist_ok=True)
logging.basicConfig(filename=os.path.join(LOG_DIR, "execution.log"), level=logging.INFO, 
                    format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger()

# Load configs
PROCESS_CONFIG_PATH = os.path.join(BASE_DIR, "config", "process_data_config.json")
STYLE_CONFIG_PATH = os.path.join(BASE_DIR, "config", "sheet_styles.json")
PROCESSED_DATA_PATH = os.path.join(BASE_DIR, "processed_data.json")

with open(PROCESS_CONFIG_PATH, "r", encoding="utf-8") as f:
    process_config = json.load(f)
with open(STYLE_CONFIG_PATH, "r", encoding="utf-8") as f:
    style_config = json.load(f)
with open(PROCESSED_DATA_PATH, "r", encoding="utf-8") as f:
    processed_data = json.load(f)

# Google Sheet setup
creds = service_account.Credentials.from_service_account_file(process_config["credentials_path"])
service = build("sheets", "v4", credentials=creds)
spreadsheet_id = processed_data["spreadsheet_id"]

# Get existing sheets
sheet_metadata = service.spreadsheets().get(spreadsheetId=spreadsheet_id).execute()
existing_sheets = {s["properties"]["title"]: s["properties"]["sheetId"] for s in sheet_metadata["sheets"]}
max_sheet_id = max([s["properties"]["sheetId"] for s in sheet_metadata["sheets"]], default=-1) + 1

# Helper functions
def rgb_to_decimal(r, g, b):
    return {"red": r / 255, "green": g / 255, "blue": b / 255}

def get_user_entered_value(value):
    if isinstance(value, bool):
        return {"userEnteredValue": {"boolValue": value}}
    elif isinstance(value, (int, float)):
        return {"userEnteredValue": {"numberValue": value}}
    else:
        return {"userEnteredValue": {"stringValue": str(value) if value is not None else ""}}

def create_update_cells_requests(sheet_id, sheet_data, batch_size=500):
    requests = []
    total_rows = len(sheet_data)
    
    for start_idx in range(0, total_rows, batch_size):
        end_idx = min(start_idx + batch_size, total_rows)
        batch_data = sheet_data[start_idx:end_idx]
        
        requests.append({
            "updateCells": {
                "range": {
                    "sheetId": sheet_id,
                    "startRowIndex": start_idx,
                    "startColumnIndex": 0
                },
                "rows": [{"values": [get_user_entered_value(cell) for cell in row]} for row in batch_data],
                "fields": "userEnteredValue"
            }
        })
    
    return requests

# Batch request
requests = []
variable_styles = style_config["variables"]

for sheet_name, sheet_data in processed_data["variables"].items():
    logger.info(f"Processing sheet: {sheet_name} with {len(sheet_data)-1} variables")
    if sheet_name not in existing_sheets:
        sheet_id = max_sheet_id
        max_sheet_id += 1
        requests.append({"addSheet": {"properties": {"title": sheet_name, "sheetId": sheet_id}}})
    else:
        sheet_id = existing_sheets[sheet_name]
    
    # Resize sheet to accommodate all rows
    total_rows = len(sheet_data)
    requests.append({
        "updateSheetProperties": {
            "properties": {"sheetId": sheet_id, "gridProperties": {"rowCount": total_rows}},
            "fields": "gridProperties.rowCount"
        }
    })
    
    # Split data into batches and create updateCells requests
    batch_size = 500
    requests.extend(create_update_cells_requests(sheet_id, sheet_data, batch_size))
    
    # Apply styles and formatting
    requests.extend([
        {"updateDimensionProperties": {"range": {"sheetId": sheet_id, "dimension": "ROWS", "startIndex": 0, "endIndex": total_rows}, "properties": {"pixelSize": variable_styles["row_height"]}, "fields": "pixelSize"}},
        {"updateDimensionProperties": {"range": {"sheetId": sheet_id, "dimension": "COLUMNS", "startIndex": 0, "endIndex": 1}, "properties": {"pixelSize": variable_styles["column_a_width"]}, "fields": "pixelSize"}},
        {"updateDimensionProperties": {"range": {"sheetId": sheet_id, "dimension": "COLUMNS", "startIndex": 1, "endIndex": 2}, "properties": {"pixelSize": variable_styles["column_b_width"]}, "fields": "pixelSize"}},
        # Bổ sung width cho cột KEY (index 2) và ID (index 3)
        {"updateDimensionProperties": {"range": {"sheetId": sheet_id, "dimension": "COLUMNS", "startIndex": 2, "endIndex": 3}, "properties": {"pixelSize": variable_styles["key_column_width"]}, "fields": "pixelSize"}},
        {"updateDimensionProperties": {"range": {"sheetId": sheet_id, "dimension": "COLUMNS", "startIndex": 3, "endIndex": 4}, "properties": {"pixelSize": variable_styles["id_column_width"]}, "fields": "pixelSize"}},
        # Các cột còn lại (mode,...) giữ nguyên logic cũ
        {"updateDimensionProperties": {"range": {"sheetId": sheet_id, "dimension": "COLUMNS", "startIndex": 4, "endIndex": len(sheet_data[0])}, "properties": {"pixelSize": variable_styles["mode_column_width"]}, "fields": "pixelSize"}},
        {"addConditionalFormatRule": {"rule": {"ranges": [{"sheetId": sheet_id, "startRowIndex": 1, "endRowIndex": total_rows}], "booleanRule": {"condition": {"type": "CUSTOM_FORMULA", "values": [{"userEnteredValue": "=MOD(ROW(),2)=0"}]}, "format": {"backgroundColor": rgb_to_decimal(*variable_styles["even_row_color"])}}}, "index": 0}},
        {"addConditionalFormatRule": {"rule": {"ranges": [{"sheetId": sheet_id, "startRowIndex": 1, "endRowIndex": total_rows}], "booleanRule": {"condition": {"type": "CUSTOM_FORMULA", "values": [{"userEnteredValue": "=MOD(ROW(),2)=1"}]}, "format": {"backgroundColor": rgb_to_decimal(*variable_styles["odd_row_color"])}}}, "index": 1}},
        {"updateSheetProperties": {"properties": {"sheetId": sheet_id, "gridProperties": {"frozenRowCount": 1, "frozenColumnCount": 3}}, "fields": "gridProperties.frozenRowCount,gridProperties.frozenColumnCount"}},
        {"updateBorders": {"range": {"sheetId": sheet_id, "startRowIndex": 0, "endRowIndex": total_rows, "startColumnIndex": 0, "endColumnIndex": len(sheet_data[0])}, "top": {"style": "SOLID", "width": 1, "color": rgb_to_decimal(200, 200, 200)}, "bottom": {"style": "SOLID", "width": 1, "color": rgb_to_decimal(200, 200, 200)}, "left": {"style": "SOLID", "width": 1, "color": rgb_to_decimal(200, 200, 200)}, "right": {"style": "SOLID", "width": 1, "color": rgb_to_decimal(200, 200, 200)}, "innerHorizontal": {"style": "SOLID", "width": 1, "color": rgb_to_decimal(200, 200, 200)}, "innerVertical": {"style": "SOLID", "width": 1, "color": rgb_to_decimal(200, 200, 200)}}}
    ])

# Execute batch request
response = service.spreadsheets().batchUpdate(spreadsheetId=spreadsheet_id, body={"requests": requests}).execute()
logger.info(f"Updated {len(processed_data['variables'])} variable sheets with data and styles")
print("Updated variable sheets with data and styles")
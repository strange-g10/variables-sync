import json
import re
import logging
from googleapiclient.discovery import build
from google.oauth2 import service_account

# Thiết lập logging
with open('config/config.json', 'r', encoding='utf-8') as f:
    config = json.load(f)
logging.basicConfig(filename=config['log_file'], level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')

# Config Google Sheets API
SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
creds = service_account.Credentials.from_service_account_file(config['service_account_file'], scopes=SCOPES)
service = build('sheets', 'v4', credentials=creds)

# Đọc dữ liệu
logging.info("Đọc dữ liệu từ các file JSON")
with open(config['variable_file'], 'r', encoding='utf-8') as f:
    variable_data = json.load(f)
with open(config['layer_file'], 'r', encoding='utf-8') as f:
    layer_data = json.load(f)
with open(config['naming_config_file'], 'r', encoding='utf-8') as f:
    naming_config = json.load(f)

# Kiểm tra và lấy danh sách variables
logging.info(f"Cấu trúc variable_data: {type(variable_data)}")
if not isinstance(variable_data, dict) or 'variables' not in variable_data:
    logging.error("variable_data không chứa key 'variables': %s", variable_data)
    raise ValueError("File variable_file phải chứa key 'variables'")
variables = variable_data['variables']
logging.info(f"Tổng số variables: {len(variables)}")

# Chuẩn bị mapping
layer_dict = {}
for root, data in layer_data.items():
    for node in data['nodes']:
        layer_dict[(root, node['name'])] = node['id']

# Tạo rows cho sheet và theo dõi thống kê
headers = ['name', 'type', 'id', 'LayerID']
rows = [headers]
logging.info("Bắt đầu mapping variables với layers")

# Thống kê
block_counts = {}  # { "Role-Body-X": số node được map }
total_mapped_nodes = 0

# Lặp qua từng cấu hình trong naming_config
for config_item in naming_config:
    root_pattern = re.compile(config_item['root_pattern'])
    sort_groups = config_item['sort_groups']

    for var in variables:
        try:
            variable_name = var['name']
            variable_id = var['id']
            variable_type = var['type']
        except (TypeError, KeyError) as e:
            logging.error(f"Dữ liệu variable không hợp lệ: {var} - Lỗi: {e}")
            continue
        # Kiểm tra tên variable
        root_match = root_pattern.match(variable_name)
        if not root_match:
            continue
        root = root_match.group(0)
        suffix = variable_name[len(root)+1:]
        # Validate theo sort_groups
        is_valid = False
        for group in sort_groups:
            prefix = group['prefix']
            prefix_pattern = re.compile(prefix)
            if prefix_pattern.match(suffix):
                if 'range' in group:
                    row_col = re.findall(r'\d+', suffix)
                    if len(row_col) >= 2:
                        row_num, col_num = map(int, row_col[:2])
                        rows_range, cols_range = group['range']['rows'], group['range']['cols']
                        if rows_range[0] <= row_num <= rows_range[1] and cols_range[0] <= col_num <= cols_range[1]:
                            is_valid = True
                            break
                else:
                    is_valid = True
                    break
        if not is_valid:
            continue
        # Tìm LayerID
        layer_id = layer_dict.get((root, suffix), '')
        if not layer_id:
            continue
        rows.append([variable_name, variable_type, variable_id, layer_id])
        block_counts[root] = block_counts.get(root, 0) + 1
        total_mapped_nodes += 1

# Ghi thống kê vào log
logging.info(f"Số lượng block được map: {len(block_counts)}")
for block, count in block_counts.items():
    logging.info(f"Block {block}: {count} node được map")
logging.info(f"Tổng số node được map: {total_mapped_nodes}")

# In thống kê ra terminal
print("\n=== Kết quả mapping ===")
print(f"Số lượng block được map: {len(block_counts)}")
for block, count in block_counts.items():
    print(f"Block {block}: {count} node được map")
print(f"Tổng số node được map: {total_mapped_nodes}")
print("=====================\n")

# Kiểm tra và tạo sheet nếu chưa tồn tại
logging.info(f"Kiểm tra sheet: {config['sheet_name']}")
spreadsheet = service.spreadsheets().get(spreadsheetId=config['spreadsheet_id']).execute()
sheet_exists = any(sheet['properties']['title'] == config['sheet_name'] for sheet in spreadsheet['sheets'])
if not sheet_exists:
    logging.info(f"Sheet {config['sheet_name']} chưa tồn tại, đang tạo mới...")
    request = {
        "requests": [{
            "addSheet": {
                "properties": {
                    "title": config['sheet_name']
                }
            }
        }]
    }
    service.spreadsheets().batchUpdate(spreadsheetId=config['spreadsheet_id'], body=request).execute()
    logging.info(f"Đã tạo sheet: {config['sheet_name']}")

# Ghi lên sheet
logging.info(f"Ghi dữ liệu lên sheet: {config['sheet_name']}")
body = {'values': rows}
service.spreadsheets().values().update(
    spreadsheetId=config['spreadsheet_id'],
    range=f"{config['sheet_name']}!A1",
    valueInputOption='RAW',
    body=body
).execute()

logging.info(f"Hoàn tất mapping và ghi lên Google Sheet. Tổng số variables được ghi: {len(rows)-1}")
print(f"Sheet {config['sheet_name']} updated with {len(rows)-1} variables. Check {config['log_file']} for details.")
import subprocess
import os
import logging
import json

# Setup logging
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_DIR = os.path.join(BASE_DIR, "logs")
os.makedirs(LOG_DIR, exist_ok=True)
logging.basicConfig(
    filename=os.path.join(LOG_DIR, "execution.log"),
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    force=True
)
logger = logging.getLogger()

# Load configs
PROCESS_CONFIG_PATH = os.path.join(BASE_DIR, "config", "process_data_config.json")

try:
    with open(PROCESS_CONFIG_PATH, "r", encoding="utf-8") as f:
        process_config = json.load(f)
    logger.info(f"Loaded process_data config from {PROCESS_CONFIG_PATH}")
except Exception as e:
    logger.error(f"Failed to load process_data config: {e}")
    raise

# Hàm chạy script với output trực tiếp
def run_script(script_name, args=""):
    logger.info(f"Starting {script_name} with args: {args}")
    if script_name == "process_data.py":
        # Chạy process_data.py với terminal tương tác (không redirect)
        completed = subprocess.run(
            f"python scripts/{script_name} {args}",
            shell=True
        )
        if completed.returncode != 0:
            logger.error(f"{script_name} failed with return code {completed.returncode}")
            return False
        return True
    else:
        process = subprocess.Popen(
            f"python scripts/{script_name} {args}",
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        stdout, stderr = process.communicate()
        print(stdout)
        if stderr:
            print(stderr)
            logger.error(f"{script_name} failed: {stderr}")
        if process.returncode != 0:
            logger.error(f"{script_name} failed with return code {process.returncode}")
            return False
        return True

# Menu lựa chọn
def display_menu():
    print("\n=== Variables Sync Pipeline ===")
    print("1. Run process_data.py (Process Variables)")
    print("2. Run setup_sheets.py (Push to Google Sheets)")
    print("3. Run all (Process and Push)")
    print("4. Exit")
    print("Note: To sync/fetch Figma data, run 'python scripts/get_file_data.py' separately.")
    return input("Select an option (1-4): ")

# Hiển thị danh sách spreadsheet
def select_spreadsheet():
    spreadsheets = process_config["spreadsheets"]
    print("\nAvailable spreadsheets:")
    for i, s in enumerate(spreadsheets, 1):
        print(f"{i}. {s['name']} (ID: {s['id']})")
    choice = int(input("Select a spreadsheet (number): ")) - 1
    if 0 <= choice < len(spreadsheets):
        return spreadsheets[choice]["name"]
    else:
        logger.error(f"Invalid spreadsheet choice: {choice}")
        raise ValueError("Invalid spreadsheet selection")

# Main loop
while True:
    choice = display_menu()
    logger.info(f"User selected option: {choice}")

    if choice == "1":
        print("Running process_data.py...")
        sheet_name = select_spreadsheet()
        sheet_arg = f"--sheet \"{sheet_name}\""
        success = run_script("process_data.py", sheet_arg)
        if not success:
            print("Process failed. Check logs for details.")
            continue

    elif choice == "2":
        print("Running setup_sheets.py...")
        processed_data_path = os.path.join(BASE_DIR, "processed_data.json")
        if os.path.exists(processed_data_path):
            success = run_script("setup_sheets.py")
            if not success:
                print("Setup failed. Check logs for details.")
                continue
        else:
            logger.error("processed_data.json not found")
            print("Error: processed_data.json not found. Run process_data.py first.")

    elif choice == "3":
        print("Running all: process_data.py and setup_sheets.py...")
        sheet_name = select_spreadsheet()
        sheet_arg = f"--sheet \"{sheet_name}\" --auto-push"
        print("Step 1: Running process_data.py...")
        success = run_script("process_data.py", sheet_arg)
        if not success:
            print("Process failed. Check logs for details.")
            continue
        
        processed_data_path = os.path.join(BASE_DIR, "processed_data.json")
        if os.path.exists(processed_data_path):
            print("Step 2: Running setup_sheets.py...")
            success = run_script("setup_sheets.py")
            if not success:
                print("Setup failed. Check logs for details.")
                continue
        else:
            logger.error("processed_data.json not found after process_data.py")
            print("Error: processed_data.json not found after processing.")

    elif choice == "4":
        logger.info("User exited the pipeline")
        print("Exiting...")
        break

    else:
        logger.warning(f"Invalid option selected: {choice}")
        print("Invalid option. Please select 1-4.")

logger.info("Pipeline execution completed")
print("Pipeline execution completed")
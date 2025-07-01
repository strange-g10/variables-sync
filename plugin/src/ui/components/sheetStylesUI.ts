import { logToUI } from "../../utils/log";

interface SheetStylesConfig {
  row_height: number;
  column_a_width: number;
  column_b_width: number;
  mode_column_width: number;
  id_column_width: number;
  key_column_width: number;
  even_row_color: [number, number, number];
  odd_row_color: [number, number, number];
  ellipse: boolean;
}

export function initializeSheetStylesUI() {
  logToUI("Initializing Sheet Styles UI");
  
  const rowHeightInput = document.getElementById("row-height") as HTMLInputElement;
  const columnAWidthInput = document.getElementById("column-a-width") as HTMLInputElement;
  const columnBWidthInput = document.getElementById("column-b-width") as HTMLInputElement;
  const modeColumnWidthInput = document.getElementById("mode-column-width") as HTMLInputElement;
  const idColumnWidthInput = document.getElementById("id-column-width") as HTMLInputElement;
  const keyColumnWidthInput = document.getElementById("key-column-width") as HTMLInputElement;
  const evenRowColorInput = document.getElementById("even-row-color") as HTMLInputElement;
  const oddRowColorInput = document.getElementById("odd-row-color") as HTMLInputElement;
  const ellipseCheckbox = document.getElementById("ellipse") as HTMLInputElement;
  const saveStylesButton = document.getElementById("save-styles") as HTMLButtonElement;
  const resetStylesButton = document.getElementById("reset-styles") as HTMLButtonElement;

  // Tải config hiện tại
  loadCurrentConfig();

  // Xử lý sự kiện lưu cấu hình
  if (saveStylesButton) {
    saveStylesButton.addEventListener("click", saveStylesConfig);
  }

  // Xử lý sự kiện reset về mặc định
  if (resetStylesButton) {
    resetStylesButton.addEventListener("click", resetToDefault);
  }

  // Xử lý thay đổi realtime
  const inputs = [
    rowHeightInput,
    columnAWidthInput,
    columnBWidthInput,
    modeColumnWidthInput,
    idColumnWidthInput,
    keyColumnWidthInput,
    evenRowColorInput,
    oddRowColorInput,
    ellipseCheckbox
  ];

  inputs.forEach(input => {
    if (input) {
      input.addEventListener("change", updatePreview);
    }
  });

  async function loadCurrentConfig() {
    try {
      // Gửi message để lấy config hiện tại từ sheet_styles.json
      parent.postMessage({
        pluginMessage: {
          type: "get-sheet-styles-config"
        }
      }, "*");
    } catch (error) {
      logToUI(`Error loading config: ${error}`);
    }
  }

  function saveStylesConfig() {
    try {
      const config: SheetStylesConfig = {
        row_height: parseInt(rowHeightInput?.value || "30"),
        column_a_width: parseInt(columnAWidthInput?.value || "150"),
        column_b_width: parseInt(columnBWidthInput?.value || "100"),
        mode_column_width: parseInt(modeColumnWidthInput?.value || "200"),
        id_column_width: parseInt(idColumnWidthInput?.value || "200"),
        key_column_width: parseInt(keyColumnWidthInput?.value || "200"),
        even_row_color: hexToRgb(evenRowColorInput?.value || "#f0f0f0"),
        odd_row_color: hexToRgb(oddRowColorInput?.value || "#ffffff"),
        ellipse: ellipseCheckbox?.checked || true
      };

      // Gửi config mới đến backend
      parent.postMessage({
        pluginMessage: {
          type: "save-sheet-styles-config",
          sheetStylesConfig: config
        }
      }, "*");

      logToUI("Sheet styles configuration saved successfully");
    } catch (error) {
      logToUI(`Error saving config: ${error}`);
    }
  }

  function resetToDefault() {
    const defaultConfig: SheetStylesConfig = {
      row_height: 30,
      column_a_width: 150,
      column_b_width: 100,
      mode_column_width: 200,
      id_column_width: 200,
      key_column_width: 200,
      even_row_color: [240, 240, 240] as [number, number, number],
      odd_row_color: [255, 255, 255] as [number, number, number],
      ellipse: true
    };

    populateFields(defaultConfig);
    updatePreview();
  }

  function updatePreview() {
    // Cập nhật preview nếu cần
    logToUI("Preview updated");
  }

  function populateFields(config: SheetStylesConfig) {
    if (rowHeightInput) rowHeightInput.value = config.row_height.toString();
    if (columnAWidthInput) columnAWidthInput.value = config.column_a_width.toString();
    if (columnBWidthInput) columnBWidthInput.value = config.column_b_width.toString();
    if (modeColumnWidthInput) modeColumnWidthInput.value = config.mode_column_width.toString();
    if (idColumnWidthInput) idColumnWidthInput.value = config.id_column_width.toString();
    if (keyColumnWidthInput) keyColumnWidthInput.value = config.key_column_width.toString();
    if (evenRowColorInput) evenRowColorInput.value = rgbToHex(config.even_row_color);
    if (oddRowColorInput) oddRowColorInput.value = rgbToHex(config.odd_row_color);
    if (ellipseCheckbox) ellipseCheckbox.checked = config.ellipse;
  }

  // Xử lý Clear Log button
  const clearLogButton = document.getElementById("clear-log") as HTMLButtonElement;
  if (clearLogButton) {
    clearLogButton.addEventListener("click", () => {
      const logTextarea = document.getElementById("log") as HTMLTextAreaElement;
      if (logTextarea) {
        logTextarea.value = "";
        logToUI("Log cleared");
      }
    });
  }

  // Xử lý message từ backend
  window.addEventListener("message", (event) => {
    const { type, config } = event.data.pluginMessage || {};
    
    if (type === "sheet-styles-config-loaded") {
      populateFields(config.variables);
    } else if (type === "sheet-styles-config-saved") {
      logToUI("Configuration saved successfully");
      // Hiển thị thông báo thành công
      showSuccessMessage("Sheet styles configuration saved!");
    }
  });

  function hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [255, 255, 255];
  }

  function rgbToHex(rgb: [number, number, number]): string {
    return "#" + rgb.map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");
  }

  function showSuccessMessage(message: string) {
    // Tạo và hiển thị thông báo thành công
    const notification = document.createElement("div");
    notification.className = "success-notification";
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #4CAF50;
      color: white;
      padding: 10px 20px;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

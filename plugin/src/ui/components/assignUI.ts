import { config } from "../../config";
import { fetchSheetMetadata, fetchSheetData } from "../../features/import/fetch";

export function initializeAssignUI() {
  const assignSheetLink = document.getElementById("assign-sheet-link") as HTMLInputElement | null;
  const sheetSelect = document.getElementById("sheet-select") as HTMLSelectElement | null;
  const assignButton = document.getElementById("assign") as HTMLButtonElement | null;
  const forceAssignButton = document.getElementById("force-assign") as HTMLButtonElement | null;

  // --- Sheet Link Cache Helpers (Figma clientStorage via postMessage) ---
  function saveSheetLinkToCache(link: string) {
    parent.postMessage({ pluginMessage: { type: "saveSheetLink", link } }, "*");
  }
  function getSheetLinksFromCache() {
    parent.postMessage({ pluginMessage: { type: "getSheetLinks" } }, "*");
  }
  function renderSheetLinkCacheDropdown(links: string[]) {
    let dropdown = document.getElementById('sheet-link-cache') as HTMLSelectElement | null;
    if (!dropdown) {
      dropdown = document.createElement('select');
      dropdown.id = 'sheet-link-cache';
      dropdown.style.marginBottom = '8px';
      dropdown.innerHTML = '<option value="">Chọn link sheet đã dùng...</option>';
      assignSheetLink?.parentElement?.insertBefore(dropdown, assignSheetLink);
    }
    dropdown.innerHTML = '<option value="">Chọn link sheet đã dùng...</option>' +
      links.map(link => `<option value="${link}">${link}</option>`).join("");
    dropdown.onchange = () => {
      if (dropdown!.value && assignSheetLink) {
        assignSheetLink.value = dropdown!.value;
        assignSheetLink.dispatchEvent(new Event('input'));
      }
    };
  }
  // Listen for backend response
  window.addEventListener('message', (event) => {
    const msg = event.data.pluginMessage;
    if (msg && msg.type === 'sheetLinks') {
      renderSheetLinkCacheDropdown(msg.links || []);
    }
  });

  // DEBUG: Log element existence
  console.log("[DEBUG] assignSheetLink:", assignSheetLink);
  console.log("[DEBUG] sheetSelect:", sheetSelect);
  console.log("[DEBUG] assignButton:", assignButton);
  console.log("[DEBUG] forceAssignButton:", forceAssignButton);

  function logButtonStates() {
    console.log(`[DEBUG] Button states - sheetSelect: ${sheetSelect?.disabled}, assignButton: ${assignButton?.disabled}, forceAssignButton: ${forceAssignButton?.disabled}`);
  }

  if (assignSheetLink && sheetSelect && assignButton && forceAssignButton) {
    getSheetLinksFromCache(); // Gọi lấy cache khi UI load
    renderSheetLinkCacheDropdown([]);
    assignSheetLink.oninput = async () => {
      console.log("[DEBUG] oninput triggered");
      const link = assignSheetLink.value;
      const spreadsheetId = extractSpreadsheetId(link);
      logMessage(`[DEBUG] Input link: ${link}, Extracted spreadsheetId: ${spreadsheetId}`);
      if (spreadsheetId) {
        logMessage(`[DEBUG] About to call fetchSheetMetadata for spreadsheetId: ${spreadsheetId}`);
        try {
          const metadata = await fetchSheetMetadata(spreadsheetId, config.GOOGLE_SHEETS_API_KEY);
          console.log("[DEBUG] metadata.sheets length:", metadata.sheets?.length);
          console.log("[DEBUG] metadata.sheets titles:", metadata.sheets?.map(s => s.properties.title));
          if (metadata.sheets && Array.isArray(metadata.sheets)) {
            const sheets = metadata.sheets.map(sheet => sheet.properties.title);
            sheetSelect.innerHTML = sheets.map((sheet: string) => `<option value=\"${sheet}\">${sheet}</option>`).join("");
            sheetSelect.disabled = false;
            assignButton.disabled = false;
            forceAssignButton.disabled = false;
            logMessage(`Loaded ${sheets.length} sheets from ${spreadsheetId}`);
            logButtonStates();
            saveSheetLinkToCache(link); // Lưu cache khi fetch thành công
            getSheetLinksFromCache(); // Cập nhật lại dropdown
          } else {
            logMessage(`[DEBUG] Metadata missing 'sheets' or not an array: ${JSON.stringify(metadata)}`);
            sheetSelect.disabled = true;
            assignButton.disabled = true;
            forceAssignButton.disabled = true;
            logButtonStates();
          }
        } catch (e) {
          logMessage(`[DEBUG] fetchSheetMetadata threw error: ${(e as Error).message}`);
          logMessage(`Error loading sheets: ${(e as Error).message}`);
          sheetSelect.disabled = true;
          assignButton.disabled = true;
          forceAssignButton.disabled = true;
          logButtonStates();
        }
        logMessage(`[DEBUG] fetchSheetMetadata call finished`);
      } else {
        logMessage(`[DEBUG] Invalid or missing spreadsheetId, disabling controls.`);
        sheetSelect.innerHTML = "";
        sheetSelect.disabled = true;
        assignButton.disabled = true;
        forceAssignButton.disabled = true;
        logButtonStates();
      }
    };
    // DEBUG: Log event binding
    console.log("[DEBUG] assignSheetLink.oninput bound");

    assignButton.onclick = async () => {
      console.log("Assign clicked");
      const link = assignSheetLink.value;
      const spreadsheetId = extractSpreadsheetId(link);
      const sheetName = sheetSelect.value;
      logMessage(`[DEBUG] Assign clicked. spreadsheetId: ${spreadsheetId}, sheetName: ${sheetName}`);
      if (spreadsheetId && sheetName) {
        try {
          logMessage(`[DEBUG] Fetching sheet data for assign. spreadsheetId: ${spreadsheetId}, sheetName: ${sheetName}`);
          const data = await fetchSheetData(spreadsheetId, sheetName, config.GOOGLE_SHEETS_API_KEY);
          logMessage(`[DEBUG] Sheet data: ${JSON.stringify(data.slice(0,2))}...`);
          parent.postMessage({ pluginMessage: { type: "assign", data, forceBindAll: false } }, "*");
          logMessage(`Started assigning from sheet: ${sheetName}`);
        } catch (e) {
          logMessage(`[DEBUG] Error fetching sheet data: ${(e as Error).message}`);
          logMessage(`Error fetching sheet data: ${(e as Error).message}`);
        }
      }
    };

    forceAssignButton.onclick = async () => {
      console.log("Force Assign clicked");
      const link = assignSheetLink.value;
      const spreadsheetId = extractSpreadsheetId(link);
      const sheetName = sheetSelect.value;
      logMessage(`[DEBUG] Force Assign clicked. spreadsheetId: ${spreadsheetId}, sheetName: ${sheetName}`);
      if (spreadsheetId && sheetName) {
        try {
          logMessage(`[DEBUG] Fetching sheet data for force assign. spreadsheetId: ${spreadsheetId}, sheetName: ${sheetName}`);
          const data = await fetchSheetData(spreadsheetId, sheetName, config.GOOGLE_SHEETS_API_KEY);
          logMessage(`[DEBUG] Sheet data: ${JSON.stringify(data.slice(0,2))}...`);
          parent.postMessage({ pluginMessage: { type: "assign", data, forceBindAll: true } }, "*");
          logMessage(`Started force assigning from sheet: ${sheetName}`);
        } catch (e) {
          logMessage(`[DEBUG] Error fetching sheet data: ${(e as Error).message}`);
          logMessage(`Error fetching sheet data: ${(e as Error).message}`);
        }
      }
    };
  } else {
    console.log("[DEBUG] One or more assign UI elements not found in DOM");
  }
}

function extractSpreadsheetId(link: string): string {
  const trimmed = link.trim();
  const match = trimmed.match(/[-\w]{25,}/);
  console.log(`[DEBUG] extractSpreadsheetId input: '${link}', trimmed: '${trimmed}', match:`, match);
  return match ? match[0] : "";
}

function logMessage(message: string) {
  const log = document.getElementById("log") as HTMLTextAreaElement | null;
  if (log) {
    log.value += `${message}\n`;
    log.scrollTop = log.scrollHeight;
  }
}
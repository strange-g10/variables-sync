let isImporting = false;
let availableSheets: string[] = [];
let excludeSheets: string[] = [];

export function initializeImportUI() {
  const importButton = document.getElementById("import") as HTMLButtonElement | null;
  const fetchSheetsButton = document.getElementById("fetch-sheets") as HTMLButtonElement | null;
  const cancelButton = document.getElementById("cancel-import") as HTMLButtonElement | null;
  const sheetLinkInput = document.getElementById("sheet-link") as HTMLInputElement | null;
  const sheetListContainer = document.getElementById("sheet-list-container") as HTMLDivElement | null;
  const sheetListDiv = document.getElementById("sheet-list") as HTMLDivElement | null;

  if (fetchSheetsButton && importButton && cancelButton && sheetLinkInput && sheetListContainer && sheetListDiv) {
    fetchSheetsButton.onclick = () => {
      const link = sheetLinkInput.value;
      if (!link) {
        alert("Please enter a Google Sheet URL first.");
        return;
      }
      parent.postMessage({ pluginMessage: { type: "fetch-sheet-list", link } }, "*");
      fetchSheetsButton.disabled = true;
      importButton.disabled = true;
    };
    importButton.onclick = () => {
      const link = sheetLinkInput.value;
      excludeSheets = Array.from(sheetListDiv.querySelectorAll("input[type=checkbox]:checked")).map(
        (el: any) => el.value
      );
      parent.postMessage({ pluginMessage: { type: "import", link, excludeSheets } }, "*");
      isImporting = true;
      importButton.style.display = "none";
      cancelButton.style.display = "inline";
    };
    cancelButton.onclick = () => {
      parent.postMessage({ pluginMessage: { type: "cancel-import" } }, "*");
      isImporting = false;
      importButton.style.display = "inline";
      cancelButton.style.display = "none";
    };
  }
}

export function showSheetList(sheets: string[]) {
  availableSheets = sheets;
  const sheetListContainer = document.getElementById("sheet-list-container") as HTMLDivElement | null;
  const sheetListDiv = document.getElementById("sheet-list") as HTMLDivElement | null;
  const importButton = document.getElementById("import") as HTMLButtonElement | null;
  const fetchSheetsButton = document.getElementById("fetch-sheets") as HTMLButtonElement | null;
  if (sheetListContainer && sheetListDiv && importButton && fetchSheetsButton) {
    sheetListDiv.innerHTML = "";
    sheets.forEach(sheet => {
      const id = `sheet-exclude-${sheet}`;
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = sheet;
      checkbox.id = id;
      const label = document.createElement("label");
      label.htmlFor = id;
      label.innerText = sheet;
      const div = document.createElement("div");
      div.appendChild(checkbox);
      div.appendChild(label);
      sheetListDiv.appendChild(div);
    });
    sheetListContainer.style.display = "block";
    importButton.disabled = false;
    fetchSheetsButton.disabled = false;
  }
}

export function getIsImporting() {
  return isImporting;
}

export function setIsImporting(value: boolean) {
  isImporting = value;
}
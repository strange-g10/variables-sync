import { setProgress, logMessage } from "./components/logProgressUI";
import { getIsImporting, setIsImporting, showSheetList } from "./components/importUI";

interface PluginMessage {
  type: string;
  message?: string;
  collections?: string[];
  fileName: string;
  data?: any;
  stats?: { processed: number, total: number, created: number, updated: number, aliases: number };
  sheets?: string[];
}

export function handleMessages(event: MessageEvent) {
  const msg = event.data.pluginMessage as PluginMessage;
  if (!msg || !msg.type) {
    logMessage("Error: Invalid message received from plugin");
    return;
  }

  if (msg.type === "sheet-list") {
    // Show sheet list for exclude selection
    if (msg.sheets) showSheetList(msg.sheets);
    return;
  }

  if (msg.type === "progress" && !getIsImporting()) {
    setProgress("Import cancelled", msg.stats);
  } else if (msg.type === "log" && msg.message?.includes("Import completed")) {
    setIsImporting(false);
    const importButton = document.getElementById("import") as HTMLButtonElement | null;
    const cancelButton = document.getElementById("cancel-import") as HTMLButtonElement | null;
    if (importButton && cancelButton) {
      importButton.style.display = "inline";
      cancelButton.style.display = "none";
    }
  }

  if (msg.type === "exported") {
    const blob = new Blob([JSON.stringify(msg.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = msg.fileName;
    a.click();
    URL.revokeObjectURL(url);
  } else if (msg.type === "log") {
    logMessage(msg.message!);
  } else if (msg.type === "progress") {
    setProgress(msg.message, msg.stats);
  } else if (msg.type === "collections") {
    const collectionSelect = document.getElementById("collection-select") as HTMLSelectElement;
    collectionSelect.innerHTML = '<option value="All">All Collections</option>';
    msg.collections?.forEach((collection) => {
      const option = document.createElement("option");
      option.value = collection;
      option.text = collection;
      collectionSelect.appendChild(option);
    });
  }
}
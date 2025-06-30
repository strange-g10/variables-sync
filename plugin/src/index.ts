import { config } from "./config";
import { importVariables, cancel } from "./features/import";
import { importVariablesOptimized, cancelOptimizedImport } from "./features/import/optimized";
import { exportFull, exportIds } from "./features/export";
import { assignVariables } from "./features/assign";
import { clearCollections } from "./features/clear";
import { getCollections } from "./features/collections";
import { logToUI, showNotification, sendToUI } from "./utils/ui";
import { handleError, withErrorHandling, ValidationError } from "./utils/errorHandler";
import { registerMessageHandler, handleMessage, sendMessageToUI } from "./utils/messageHandler";
import { MCPManager } from "./mcp/mcpManager";
import { PluginMessage } from "./features/types";
import { SheetData } from "./features/import/types";

// Initialize plugin
figma.showUI(__html__, { width: 900, height: 700 });

let cachedMetadata: SheetData | null = null;

// Register message handlers
function initializeMessageHandlers() {
  // Sheet link cache handlers
  registerMessageHandler("saveSheetLink", async (msg) => {
    if (!msg.link) {
      throw new ValidationError("No link provided for saving");
    }
    
    let links = await figma.clientStorage.getAsync("sheetLinks") || [];
    if (!links.includes(msg.link)) {
      links.unshift(msg.link);
      if (links.length > 10) links = links.slice(0, 10);
      await figma.clientStorage.setAsync("sheetLinks", links);
    }
  });

  registerMessageHandler("getSheetLinks", async () => {
    const links = await figma.clientStorage.getAsync("sheetLinks") || [];
    sendToUI("sheetLinks", { links });
  });

  // Collections handlers
  registerMessageHandler("get-collections", async () => {
    const collections = getCollections();
    sendToUI("collections", { collections });
  });

  registerMessageHandler("clear-collections", async () => {
    clearCollections();
    showNotification("Collections cleared");
  });

  // Export handlers
  registerMessageHandler("export-full", async (msg) => {
    await exportFull(msg.collection);
  });

  registerMessageHandler("export-ids", async (msg) => {
    await exportIds(msg.collection);
  });

  // Sheet data handlers
  registerMessageHandler("fetch-sheet-list", async (msg) => {
    if (!msg.link) {
      throw new ValidationError("No Google Sheet link provided");
    }

    const match = msg.link.match(/[-\w]{25,}/);
    if (!match) {
      throw new ValidationError("Invalid Google Sheet link format");
    }

    const spreadsheetId = match[0];
    const metadata = await import("./features/import/fetch");
    const meta = await metadata.fetchSheetMetadata(spreadsheetId, config.GOOGLE_SHEETS_API_KEY);
    const sheets = meta.sheets?.map((s: any) => s.properties.title) || [];
    sendToUI("sheet-list", { sheets });
  });

  // Import handlers
  registerMessageHandler("import", async (msg) => {
    if (!msg.link) {
      throw new ValidationError("No Google Sheet link provided for import");
    }
    
    cachedMetadata = await importVariables(
      msg.link,
      msg.excludeSheets,
      config.GOOGLE_SHEETS_API_KEY,
      cachedMetadata
    );
    showNotification("Import completed successfully!");
  });

  registerMessageHandler("cancel-import", async () => {
    cancel();
    showNotification("Import cancelled");
  });

  // Assignment handlers
  registerMessageHandler("assign", async (msg) => {
    if (!msg.data) {
      throw new ValidationError("No data provided for assignment");
    }
    
    await assignVariables(msg.data, msg.forceBindAll || false);
    showNotification("Assignment completed successfully!");
  });
}

// Initialize handlers
initializeMessageHandlers();

// Main message handler
figma.ui.onmessage = async (msg: PluginMessage) => {
  await withErrorHandling(
    () => handleMessage(msg),
    { operation: "message-handling", details: { messageType: msg.type } }
  );
};

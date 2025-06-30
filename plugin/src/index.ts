import { config } from "./config";
import { importVariables, cancel } from "./features/import";
import { exportFull, exportIds } from "./features/export";
import { assignVariables } from "./features/assign";
import { clearCollections } from "./features/clear";
import { getCollections } from "./features/collections";
import { logToUI } from "./utils/log";
import { PluginMessage } from "./features/types";
import { SheetData } from "./features/import/types";

figma.showUI(__html__, { width: 900, height: 700 });

let cachedMetadata: SheetData | null = null;

figma.ui.onmessage = async (msg: PluginMessage) => {
  try {
    if (!msg.type) {
      logToUI("Error: Invalid message format");
      return;
    }
    // --- Sheet Link Cache Handlers ---
    if (msg.type === "saveSheetLink") {
      let links = await figma.clientStorage.getAsync("sheetLinks") || [];
      if (!links.includes(msg.link)) {
        links.unshift(msg.link);
        if (links.length > 10) links = links.slice(0, 10);
        await figma.clientStorage.setAsync("sheetLinks", links);
      }
      return;
    }
    if (msg.type === "getSheetLinks") {
      const links = await figma.clientStorage.getAsync("sheetLinks") || [];
      figma.ui.postMessage({ type: "sheetLinks", links });
      return;
    }

    switch (msg.type) {
      case "get-collections":
        const collections = getCollections();
        figma.ui.postMessage({ type: "collections", collections });
        break;
      case "export-full":
        await exportFull(msg.collection);
        break;
      case "export-ids":
        await exportIds(msg.collection);
        break;
      case "clear-collections":
        clearCollections();
        break;
      case "fetch-sheet-list": {
        // Extract spreadsheetId from link
        const match = msg.link?.match(/[-\w]{25,}/);
        if (!match) {
          logToUI("Error: Invalid Google Sheet link");
          break;
        }
        const spreadsheetId = match[0];
        const metadata = await import("./features/import/fetch");
        const meta = await metadata.fetchSheetMetadata(spreadsheetId, config.GOOGLE_SHEETS_API_KEY);
        const sheets = meta.sheets?.map((s: any) => s.properties.title) || [];
        figma.ui.postMessage({ type: "sheet-list", sheets });
        break;
      }
      case "import":
        if (!msg.link) {
          logToUI("Error: No Google Sheet link provided");
          break;
        }
        cachedMetadata = await importVariables(msg.link!, msg.excludeSheets, config.GOOGLE_SHEETS_API_KEY, cachedMetadata);
        break;
      case "assign":
        if (!msg.data) {
          logToUI("Error: No data provided for assignment");
          break;
        }
        await assignVariables(msg.data, msg.forceBindAll || false);
        figma.notify("Assignment completed!");
        break;
      case "cancel-import":
        cancel();
        break;
      default:
        logToUI(`Unknown message type: ${msg.type}`);
    }
  } catch (e) {
    logToUI(`Error: ${(e as Error).message}`);
  }
};
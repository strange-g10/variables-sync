import { config } from "./config";
import { importVariables, cancel } from "./features/import";
import { exportFull, exportIds, exportSelectedNodes } from "./features/export";
import { assignVariables } from "./features/assign";
import { clearCollections } from "./features/clear";
import { getCollections } from "./features/collections";
import { logToUI } from "./utils/log";
import { PluginMessage } from "./features/types";
import { SheetData } from "./features/import/types";
import { SimpleGoogleSheetsExportService } from "./services/simpleGoogleSheetsExport";

figma.showUI(__html__, { width: 900, height: 700 });

let cachedMetadata: SheetData | null = null;

// Handle Google Sheets export
async function handleSheetsExport(type: 'full' | 'ids', collection?: string, config?: {sheetsUrl: string, serviceAccount?: string}) {
  try {
    if (!config) {
      logToUI("Error: No Google Sheets configuration provided");
      figma.ui.postMessage({ type: "export-error", error: "Missing configuration" });
      return;
    }

    const { sheetsUrl, serviceAccount } = config;
    
    if (!serviceAccount) {
      logToUI("Error: Service Account credentials required");
      figma.ui.postMessage({ type: "export-error", error: "Service Account credentials required for Google Sheets export" });
      return;
    }
    
    // Progress callback
    const onProgress = (progress: number, status: string, details?: string) => {
      figma.ui.postMessage({ 
        type: "export-progress", 
        progress, 
        status,
        details 
      });
    };

    // Get variables data
    onProgress(5, "Getting variables data...");
    const variables = figma.variables.getLocalVariables();
    
    let filteredVariables = variables;
    if (collection && collection !== "All") {
      const targetCollection = figma.variables.getLocalVariableCollections().find(c => c.name === collection);
      if (targetCollection) {
        filteredVariables = variables.filter(v => v.variableCollectionId === targetCollection.id);
      }
    }

    // Convert to format expected by GoogleSheetsExportService
    const variablesData = filteredVariables.map(v => {
      const collectionObj = figma.variables.getVariableCollectionById(v.variableCollectionId);
      const modes = collectionObj?.modes || [];
      
      return {
        id: v.id,
        name: v.name,
        type: v.resolvedType,
        key: (typeof v.key === 'string') ? v.key : '',
        valuesByMode: Object.fromEntries(
          Object.entries(v.valuesByMode).map(([modeId, value]) => {
            const mode = modes.find(m => m.modeId === modeId);
            const modeName = mode ? mode.name : modeId;
            // Convert color values to hex if needed
            const exportedValue = v.resolvedType === "COLOR" ? 
              (typeof value === 'object' && 'r' in value ? 
                `#${Math.round(value.r * 255).toString(16).padStart(2, '0')}${Math.round(value.g * 255).toString(16).padStart(2, '0')}${Math.round(value.b * 255).toString(16).padStart(2, '0')}` : 
                value) : 
              value;
            return [modeName, exportedValue];
          })
        ),
        collectionId: v.variableCollectionId,
        collectionName: collectionObj?.name || 'Unknown Collection'
      };
    });

    if (type === 'ids') {
      // For IDs export, only include id and name
      variablesData.forEach(v => {
        v.valuesByMode = {}; // Clear values for IDs-only export
      });
    }

    onProgress(10, "Initializing Google Sheets service...");
    const exportService = new SimpleGoogleSheetsExportService(serviceAccount, sheetsUrl);
    
    await exportService.exportToSheets(variablesData, onProgress);
    
    figma.ui.postMessage({ type: "export-complete" });
    logToUI(`Successfully exported ${variablesData.length} variables to Google Sheets`);
    
  } catch (error) {
    logToUI(`Google Sheets export failed: ${error}`);
    figma.ui.postMessage({ type: "export-error", error: (error as Error).message });
  }
}

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
      case "export-selected-nodes":
        await exportSelectedNodes(msg.nodeConfig);
        break;
      case "check-selection":
        const selectionCount = figma.currentPage.selection.length;
        figma.ui.postMessage({ 
          type: "selection-status", 
          selectionCount,
          hasSelection: selectionCount > 0 
        });
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
      case "get-api-key":
        // Send API key from config to UI
        figma.ui.postMessage({ type: "api-key-loaded", apiKey: config.GOOGLE_SHEETS_API_KEY });
        break;
      case "export-full-sheets":
        await handleSheetsExport('full', msg.collection, msg.config);
        break;
      case "export-ids-sheets":
        await handleSheetsExport('ids', msg.collection, msg.config);
        break;
      case "cancel-export":
        // Handle export cancellation
        logToUI("Export cancelled by user");
        break;
      default:
        logToUI(`Unknown message type: ${msg.type}`);
    }
  } catch (e) {
    logToUI(`Error: ${(e as Error).message}`);
  }
};
import { config } from "../../config";
import { logToUI, updateProgress, ProgressData } from "../../utils/ui";
import { quotaManager } from "../../utils/quotaManager";
import { performanceOptimizer } from "../../utils/performanceOptimizer";
import { withErrorHandling, ImportError } from "../../utils/errorHandler";
import { fetchSheetMetadata, fetchSheetData } from "./fetch";
import { parseColor, toHexColor, areRGBAsEqual } from "../../utils/color";

export let shouldCancel = false;
export function cancel() {
  shouldCancel = true;
  logToUI("Import cancelled");
}

interface SheetRow {
  name: string;
  type: string;
  VariableID: string;
  [key: string]: string | boolean;
}

interface SheetData {
  spreadsheetId: string;
  sheetNames: string[];
}

interface Stats {
  processed: number;
  total: number;
  created: number;
  updated: number;
  aliases: number;
}

function isVariableAlias(value: VariableValue): value is VariableAlias {
  return typeof value === "object" && "type" in value && value.type === "VARIABLE_ALIAS";
}

const variableCache: { [id: string]: Variable | null } = {};
function getVariableById(id: string): Variable | null {
  if (variableCache[id] === undefined) {
    variableCache[id] = figma.variables.getVariableById(id);
  }
  return variableCache[id];
}

let apiCallCount = 0;
async function setValueWithRetry(variable: Variable, modeId: string, value: VariableValue, maxRetries: number = config.MAX_RETRIES) {
  apiCallCount++;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const startTime = Date.now();
      variable.setValueForMode(modeId, value);
      const endTime = Date.now();
      logToUI(`Set value for ${variable.name} in mode ${modeId} took ${endTime - startTime}ms`);
      logToUI(`Updated value for ${variable.name} in mode ${variable.valuesByMode[modeId] ? Object.keys(variable.valuesByMode[modeId])[0] : modeId} to ${JSON.stringify(value)}`);
      return;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      if (i === maxRetries - 1) {
        logToUI(`Failed to set value for ${variable.name} in mode ${modeId} after ${maxRetries} retries: ${errorMessage}`);
        throw new Error(errorMessage);
      }
      logToUI(`Error for ${variable.name} in mode ${modeId} (${errorMessage}), retrying after ${config.API_CALL_DELAY * (i + 1)}ms`);
      await new Promise(resolve => setTimeout(resolve, config.API_CALL_DELAY * (i + 1)));
    }
  }
}

async function processBatch(
  rows: SheetRow[],
  startIdx: number,
  batchSize: number,
  collection: VariableCollection,
  allVariables: { [id: string]: Variable },
  allAliases: { variable: Variable; modeId: string; aliasId: string; sheetName: string }[],
  sheetName: string,
  stats: Stats
): Promise<void> {
  const endIdx = Math.min(startIdx + batchSize, rows.length);
  const batchRows = rows.slice(startIdx, endIdx);

  updateProgress(`Processing ${sheetName}: ${startIdx + 1} - ${endIdx} of ${rows.length}`, stats);

  const modeColumns = Object.keys(batchRows[0] || {})
    .filter(h => !["name", "type", "VariableID"].includes(h) && !h.endsWith("_Variable_Alias") && !h.includes("$"))
    .filter(h => batchRows.some(row => row[h] && row[`${h}_Variable_Alias`]))
    .slice(0, 4);
  logToUI(`Detected modes for ${sheetName}: ${modeColumns.join(", ")}`);

  const existingModes = collection.modes;
  const modeMap: { [name: string]: string } = {};
  modeColumns.forEach((modeName, i) => {
    if (existingModes[i] && existingModes[i].name !== modeName) {
      collection.renameMode(existingModes[i].modeId, modeName);
      logToUI(`Renamed mode ${existingModes[i].name} to ${modeName} in ${sheetName}`);
    } else if (!existingModes[i] && collection.modes.length < 4) {
      const newModeId = collection.addMode(modeName);
      modeMap[modeName] = newModeId;
      logToUI(`Added mode ${modeName} to collection ${sheetName}`);
    }
    modeMap[modeName] = existingModes[i]?.modeId || modeMap[modeName];
  });

  const validTypes: VariableResolvedDataType[] = ["COLOR", "BOOLEAN", "FLOAT", "STRING"];

  for (const row of batchRows) {
    if (shouldCancel) {
      logToUI(`Batch processing stopped for ${sheetName} due to cancellation`);
      break;
    }
    try {
      let variable: Variable;
      const existingById = row.VariableID ? getVariableById(row.VariableID) : null;
      const existingByName = collection.variableIds
        .map(id => getVariableById(id))
        .find(v => v?.name === row.name);

      if (existingById) {
        variable = existingById;
      } else if (existingByName) {
        variable = existingByName;
      } else {
        if (!validTypes.includes(row.type as VariableResolvedDataType)) {
          logToUI(`Invalid type '${row.type}' for ${row.name} in ${sheetName}, using STRING`);
          row.type = "STRING";
        }
        variable = figma.variables.createVariable(row.name, collection.id, row.type as VariableResolvedDataType);
        stats.created++;
        logToUI(`Created variable ${row.name} in ${sheetName}`);
      }
      allVariables[variable.id] = variable;

      for (const modeName of modeColumns) {
        const value = row[modeName];
        const isAlias = row[`${modeName}_Variable_Alias`] === "TRUE";
        const modeId = modeMap[modeName];

        if (!isAlias) {
          let resolvedValue: VariableValue;
          switch (variable.resolvedType) {
            case "COLOR":
              if (typeof value !== "string" || !value.startsWith("#")) {
                logToUI(`Invalid COLOR value '${value}' for ${variable.name} in mode ${modeName}, skipping`);
                continue;
              }
              resolvedValue = parseColor(value);
              break;
            case "BOOLEAN":
              resolvedValue = String(value).toLowerCase() === "true";
              break;
            case "FLOAT":
              resolvedValue = parseFloat(value as string) || 0;
              break;
            case "STRING":
            default:
              resolvedValue = String(value || "");
          }
          const currentValue = variable.valuesByMode[modeId];
          if (variable.resolvedType === "COLOR" && typeof currentValue === "object" && "r" in currentValue) {
            const hexFromSheet = value as string;
            const currentHex = toHexColor(currentValue as RGBA);
            if (hexFromSheet === currentHex) {
              logToUI(`No update needed for ${variable.name} in mode ${modeName}: hex=${hexFromSheet}`);
              continue;
            }
            logToUI(`Comparing COLOR for ${variable.name} in mode ${modeName}: current=${JSON.stringify(currentValue)}, new=${JSON.stringify(resolvedValue)}`);
            if (!areRGBAsEqual(currentValue as RGBA, resolvedValue as RGBA, config.COLOR_EPSILON)) {
              await setValueWithRetry(variable, modeId, resolvedValue);
              stats.updated++;
            }
          } else if (variable.resolvedType === "STRING" && currentValue !== resolvedValue) {
            await setValueWithRetry(variable, modeId, resolvedValue);
            stats.updated++;
          } else if (variable.resolvedType !== "STRING" && JSON.stringify(currentValue) !== JSON.stringify(resolvedValue)) {
            await setValueWithRetry(variable, modeId, resolvedValue);
            stats.updated++;
          }
        } else if (typeof value === "string") {
          const currentValue = variable.valuesByMode[modeId];
          if (!isVariableAlias(currentValue) || currentValue.id !== value) {
            allAliases.push({ variable, modeId, aliasId: value, sheetName });
            stats.aliases++;
            logToUI(`Queued alias for ${variable.name} in mode ${modeName} to ${value}`);
          }
        } else {
          logToUI(`Invalid alias value '${value}' for ${variable.name} in mode ${modeName}, skipping`);
        }
      }
    } catch (e) {
      logToUI(`Error processing variable ${row.name} in sheet ${sheetName}: ${e}`);
    }
    stats.processed++;
    updateProgress(`Processing ${sheetName}: ${startIdx + 1} - ${endIdx} of ${rows.length}`, stats);
  }
}

async function importFromSheet(
  spreadsheetId: string,
  sheetName: string,
  apiKey: string,
  allVariables: { [id: string]: Variable },
  allAliases: { variable: Variable; modeId: string; aliasId: string; sheetName: string }[],
  totalStats: Stats
): Promise<void> {
  logToUI(`Starting import for sheet: ${sheetName}`);
  try {
    let rows: any[][];
    try {
      rows = await fetchSheetData(spreadsheetId, sheetName, apiKey);
    } catch (e) {
      logToUI(`Failed to fetch data for ${sheetName}: ${e}`);
      return;
    }
    if (!rows || rows.length < 2) {
      logToUI(`Sheet ${sheetName} is empty or has no data, skipping`);
      return;
    }

    const headers = rows[0].filter((h: string) => !h.startsWith("$"));
    const dataRows: SheetRow[] = rows.slice(1).map((row: any[]) =>
      headers.reduce((obj, header, i) => {
        obj[header] = row[i] || "";
        return obj;
      }, {} as SheetRow)
    );
    logToUI(`Processing ${dataRows.length} variables in ${sheetName}`);

    let collection = figma.variables.getLocalVariableCollections().find(c => c.name === sheetName);
    if (!collection) {
      collection = figma.variables.createVariableCollection(sheetName);
      logToUI(`Created new collection: ${sheetName}`);
    }

    const stats: Stats = { processed: 0, total: dataRows.length, created: 0, updated: 0, aliases: 0 };
    const batchSize = config.BATCH_SIZE;
    for (let i = 0; i < dataRows.length; i += batchSize) {
      if (shouldCancel) {
        logToUI(`Import stopped for ${sheetName}`);
        break;
      }
      await processBatch(dataRows, i, batchSize, collection, allVariables, allAliases, sheetName, stats);
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    totalStats.processed += stats.processed;
    totalStats.total += stats.total;
    totalStats.created += stats.created;
    totalStats.updated += stats.updated;
    totalStats.aliases += stats.aliases;

    logToUI(`Completed processing sheet: ${sheetName} with ${stats.processed}/${stats.total} variables, Created: ${stats.created}, Updated: ${stats.updated}, Aliases: ${stats.aliases}`);
  } catch (e) {
    logToUI(`Error processing sheet ${sheetName}: ${e}`);
  }
}

export async function importVariables(
  link: string,
  excludeSheets: string[] | undefined,
  apiKey: string,
  cachedMetadata: SheetData | null
): Promise<SheetData> {
  logToUI(`Starting importVariables with link: ${link}`);
  const startTime = Date.now();
  const totalStats: Stats = { processed: 0, total: 0, created: 0, updated: 0, aliases: 0 };
  try {
    const spreadsheetIdMatch = link.match(/[-\w]{25,}/);
    shouldCancel = false;
    if (!spreadsheetIdMatch) {
      logToUI("Invalid Google Sheet URL");
      throw new Error("Invalid Google Sheet URL");
    }
    const spreadsheetId = spreadsheetIdMatch[0];

    logToUI(`Fetching metadata for spreadsheet: ${spreadsheetId}`);
    const metadata = await fetchSheetMetadata(spreadsheetId, apiKey);
    let sheetNames = metadata.sheets.map(sheet => sheet.properties.title);
    if (excludeSheets && excludeSheets.length > 0) {
      sheetNames = sheetNames.filter(name => !excludeSheets.includes(name));
      logToUI(`Excluding sheets: ${excludeSheets.join(", ")}`);
    }

    const allVariables: { [id: string]: Variable } = {};
    const allAliases: { variable: Variable; modeId: string; aliasId: string; sheetName: string }[] = [];
    apiCallCount = 0;

    logToUI(`Processing ${Object.keys(allVariables).length} variables and ${allAliases.length} aliases`);

    for (const sheetName of sheetNames) {
      if (shouldCancel) {
        logToUI("Import cancelled by user");
        updateProgress("Import cancelled", totalStats);
        break;
      }
      await importFromSheet(spreadsheetId, sheetName, apiKey, allVariables, allAliases, totalStats);
    }

    updateProgress("Processing all aliases...", { processed: 0, total: allAliases.length, created: 0, updated: 0, aliases: 0 });
    let aliasStats = { processed: 0, total: allAliases.length, created: 0, updated: 0, aliases: 0 };
    for (const { variable, modeId, aliasId, sheetName } of allAliases) {
      if (shouldCancel) {
        logToUI("Alias processing stopped by user");
        updateProgress("Import cancelled during aliases", aliasStats);
        break;
      }
      const aliasVariable = getVariableById(aliasId);
      if (aliasVariable) {
        try {
          const currentValue = variable.valuesByMode[modeId];
          if (!isVariableAlias(currentValue) || currentValue.id !== aliasId) {
            await setValueWithRetry(variable, modeId, { type: "VARIABLE_ALIAS", id: aliasId });
            aliasStats.updated++;
            totalStats.updated++;
            logToUI(`Set alias for ${variable.name} in mode ${modeId} to ${aliasId} from sheet ${sheetName}`);
          }
        } catch (e) {
          logToUI(`Error setting alias for ${variable.name} in ${sheetName}: ${e}`);
        }
      } else {
        logToUI(`Warning: Missing alias ${aliasId} for ${variable.name} in ${sheetName}, skipping`);
      }
      aliasStats.processed++;
      totalStats.aliases = aliasStats.aliases;
      updateProgress("Processing aliases...", aliasStats);
      if (aliasStats.processed % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const endTime = Date.now();
    logToUI(`Import summary: Processed ${totalStats.processed}/${totalStats.total} variables, Created: ${totalStats.created}, Updated: ${totalStats.updated}, Aliases: ${totalStats.aliases}, API calls: ${apiCallCount}, Time: ${(endTime - startTime) / 1000}s`);
    updateProgress("Import completed", totalStats);
    logToUI(`Exiting importVariables with ${allAliases.length} aliases processed`);
    return { spreadsheetId, sheetNames };
  } catch (e) {
    logToUI(`Import error: ${e}`);
    updateProgress("Import failed due to error", totalStats);
    throw e;
  }
}
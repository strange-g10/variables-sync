/**
 * Optimized import functionality with performance improvements
 */

import { config } from "../../config";
import { logToUI, updateProgress, ProgressData } from "../../utils/ui";
import { quotaManager } from "../../utils/quotaManager";
import { performanceOptimizer } from "../../utils/performanceOptimizer";
import { withErrorHandling, ImportError } from "../../utils/errorHandler";
import { validateGoogleSheetsUrl, validateVariableName, validateVariableType } from "../../utils/validation";
import { fetchSheetMetadata, fetchSheetData } from "./fetch";
import { parseColor, toHexColor, areRGBAsEqual } from "../../utils/color";

export let shouldCancel = false;

export interface OptimizedImportOptions {
  link: string;
  excludeSheets?: string[];
  apiKey: string;
  enableBatching?: boolean;
  maxConcurrency?: number;
}

interface ProcessedVariable {
  variable: Variable;
  updates: { modeId: string; value: VariableValue }[];
  aliases: { modeId: string; aliasId: string }[];
}

interface ImportResult {
  spreadsheetId: string;
  sheetNames: string[];
  stats: {
    totalProcessed: number;
    created: number;
    updated: number;
    aliases: number;
    errors: number;
    duration: number;
  };
}

/**
 * Cancel current import operation
 */
export function cancelOptimizedImport(): void {
  shouldCancel = true;
  logToUI("Optimized import cancelled");
}

/**
 * Process a single sheet with optimized batching
 */
async function processSheetOptimized(
  spreadsheetId: string,
  sheetName: string,
  apiKey: string
): Promise<{
  variables: ProcessedVariable[];
  stats: { processed: number; created: number; updated: number; aliases: number; errors: number };
}> {
  
  const stats = { processed: 0, created: 0, updated: 0, aliases: 0, errors: 0 };
  
  return await withErrorHandling(async () => {
    // Fetch sheet data with quota management
    const rows = await quotaManager.executeWithQuota(
      () => fetchSheetData(spreadsheetId, sheetName, apiKey),
      'sheetsRead'
    );

    if (!rows || rows.length < 2) {
      logToUI(`Sheet ${sheetName} is empty or has no data, skipping`);
      return { variables: [], stats };
    }

    const headers = rows[0].filter((h: string) => !h.startsWith("$"));
    const dataRows = rows.slice(1).map((row: any[]) =>
      headers.reduce((obj, header, i) => {
        obj[header] = row[i] || "";
        return obj;
      }, {} as any)
    );

    logToUI(`Processing ${dataRows.length} variables in ${sheetName}`);

    // Get or create collection
    let collection = figma.variables.getLocalVariableCollections().find(c => c.name === sheetName);
    if (!collection) {
      collection = await quotaManager.executeWithQuota(
        () => Promise.resolve(figma.variables.createVariableCollection(sheetName)),
        'figmaOperation'
      );
      stats.created++;
      logToUI(`Created new collection: ${sheetName}`);
    }

    // Process variables using performance optimizer
    const processedVariables = await performanceOptimizer.processInBatches(
      dataRows,
      async (batch: any[], batchIndex: number) => {
        const batchResults: ProcessedVariable[] = [];
        
        for (const row of batch) {
          if (shouldCancel) break;
          
          try {
            // Validate input data
            validateVariableName(row.name);
            validateVariableType(row.type);

            const processedVar = await processVariableRow(row, collection!, sheetName);
            if (processedVar) {
              batchResults.push(processedVar);
              stats.processed++;
              
              if (processedVar.variable.id && !figma.variables.getVariableById(processedVar.variable.id)) {
                stats.created++;
              } else {
                stats.updated++;
              }
              
              stats.aliases += processedVar.aliases.length;
            }
          } catch (error) {
            stats.errors++;
            const errorMessage = error instanceof Error ? error.message : String(error);
            logToUI(`Error processing variable ${row.name}: ${errorMessage}`);
          }
        }
        
        return batchResults;
      },
      'import',
      (progress) => {
        updateProgress(`Processing ${sheetName}`, progress);
      }
    );

    return { variables: processedVariables.flat(), stats };
    
  }, { operation: "sheet-processing", details: { sheetName } }) || { variables: [], stats };
}

/**
 * Process a single variable row
 */
async function processVariableRow(
  row: any,
  collection: VariableCollection,
  sheetName: string
): Promise<ProcessedVariable | null> {
  
  // Find or create variable
  let variable: Variable;
  const existingById = row.VariableID ? figma.variables.getVariableById(row.VariableID) : null;
  const existingByName = collection.variableIds
    .map(id => figma.variables.getVariableById(id))
    .find(v => v?.name === row.name);

  if (existingById) {
    variable = existingById;
  } else if (existingByName) {
    variable = existingByName;
  } else {
    // Create new variable
    variable = await quotaManager.executeWithQuota(
      () => Promise.resolve(figma.variables.createVariable(
        row.name,
        collection.id,
        row.type as VariableResolvedDataType
      )),
      'figmaOperation'
    );
    logToUI(`Created variable ${row.name} in ${sheetName}`);
  }

  // Detect mode columns
  const modeColumns = Object.keys(row)
    .filter(h => !["name", "type", "VariableID"].includes(h) && !h.endsWith("_Variable_Alias") && !h.includes("$"))
    .filter(h => row[h] && row[`${h}_Variable_Alias`])
    .slice(0, 4);

  // Setup modes
  const modeMap = await setupCollectionModes(collection, modeColumns, sheetName);

  // Process values and aliases
  const updates: { modeId: string; value: VariableValue }[] = [];
  const aliases: { modeId: string; aliasId: string }[] = [];

  for (const modeName of modeColumns) {
    const value = row[modeName];
    const isAlias = row[`${modeName}_Variable_Alias`] === "TRUE";
    const modeId = modeMap[modeName];

    if (!modeId) continue;

    if (isAlias && typeof value === "string") {
      aliases.push({ modeId, aliasId: value });
    } else if (!isAlias) {
      const resolvedValue = resolveVariableValue(variable.resolvedType, value);
      if (resolvedValue !== null) {
        updates.push({ modeId, value: resolvedValue });
      }
    }
  }

  return { variable, updates, aliases };
}

/**
 * Setup collection modes
 */
async function setupCollectionModes(
  collection: VariableCollection,
  modeColumns: string[],
  sheetName: string
): Promise<{ [modeName: string]: string }> {
  
  const existingModes = collection.modes;
  const modeMap: { [name: string]: string } = {};

  for (let i = 0; i < modeColumns.length; i++) {
    const modeName = modeColumns[i];
    
    if (existingModes[i] && existingModes[i].name !== modeName) {
      // Rename existing mode
      await quotaManager.executeWithQuota(
        () => Promise.resolve(collection.renameMode(existingModes[i].modeId, modeName)),
        'figmaOperation'
      );
      logToUI(`Renamed mode ${existingModes[i].name} to ${modeName} in ${sheetName}`);
    } else if (!existingModes[i] && collection.modes.length < 4) {
      // Add new mode
      const newModeId = await quotaManager.executeWithQuota(
        () => Promise.resolve(collection.addMode(modeName)),
        'figmaOperation'
      );
      modeMap[modeName] = newModeId;
      logToUI(`Added mode ${modeName} to collection ${sheetName}`);
    }
    
    modeMap[modeName] = existingModes[i]?.modeId || modeMap[modeName];
  }

  return modeMap;
}

/**
 * Resolve variable value based on type
 */
function resolveVariableValue(type: VariableResolvedDataType, value: any): VariableValue | null {
  try {
    switch (type) {
      case "COLOR":
        if (typeof value !== "string" || !value.startsWith("#")) {
          throw new Error(`Invalid COLOR value: ${value}`);
        }
        return parseColor(value);
      case "BOOLEAN":
        return String(value).toLowerCase() === "true";
      case "FLOAT":
        const floatVal = parseFloat(value as string);
        if (isNaN(floatVal)) {
          throw new Error(`Invalid FLOAT value: ${value}`);
        }
        return floatVal;
      case "STRING":
      default:
        return String(value || "");
    }
  } catch (error) {
    logToUI(`Error resolving value for type ${type}: ${error}`);
    return null;
  }
}

/**
 * Apply updates to variables
 */
async function applyVariableUpdates(processedVariables: ProcessedVariable[]): Promise<void> {
  logToUI(`Applying updates to ${processedVariables.length} variables`);

  await performanceOptimizer.processInBatches(
    processedVariables,
    async (batch: ProcessedVariable[]) => {
      for (const { variable, updates } of batch) {
        if (shouldCancel) break;

        for (const { modeId, value } of updates) {
          try {
            // Check if update is needed
            const currentValue = variable.valuesByMode[modeId];
            const needsUpdate = shouldUpdateValue(variable.resolvedType, currentValue, value);

            if (needsUpdate) {
              await quotaManager.executeWithQuota(
                () => {
                  variable.setValueForMode(modeId, value);
                  return Promise.resolve();
                },
                'figmaOperation'
              );
              logToUI(`Updated ${variable.name} in mode ${modeId}`);
            }
          } catch (error) {
            logToUI(`Error updating ${variable.name}: ${error}`);
          }
        }
      }
      return batch;
    },
    'assign'
  );
}

/**
 * Apply aliases to variables
 */
async function applyVariableAliases(processedVariables: ProcessedVariable[]): Promise<void> {
  const allAliases = processedVariables.flatMap(pv => 
    pv.aliases.map(alias => ({ variable: pv.variable, ...alias }))
  );

  if (allAliases.length === 0) return;

  logToUI(`Applying ${allAliases.length} aliases`);

  await performanceOptimizer.processInBatches(
    allAliases,
    async (batch) => {
      for (const { variable, modeId, aliasId } of batch) {
        if (shouldCancel) break;

        try {
          const aliasVariable = figma.variables.getVariableById(aliasId);
          if (aliasVariable) {
            const currentValue = variable.valuesByMode[modeId];
            const needsUpdate = !isVariableAlias(currentValue) || currentValue.id !== aliasId;

            if (needsUpdate) {
              await quotaManager.executeWithQuota(
                () => {
                  variable.setValueForMode(modeId, { type: "VARIABLE_ALIAS", id: aliasId });
                  return Promise.resolve();
                },
                'figmaOperation'
              );
              logToUI(`Set alias for ${variable.name} to ${aliasId}`);
            }
          } else {
            logToUI(`Warning: Missing alias variable ${aliasId} for ${variable.name}`);
          }
        } catch (error) {
          logToUI(`Error setting alias for ${variable.name}: ${error}`);
        }
      }
      return batch;
    },
    'assign'
  );
}

/**
 * Check if variable value needs updating
 */
function shouldUpdateValue(type: VariableResolvedDataType, currentValue: any, newValue: any): boolean {
  if (type === "COLOR" && typeof currentValue === "object" && "r" in currentValue) {
    return !areRGBAsEqual(currentValue as RGBA, newValue as RGBA, config.COLOR_EPSILON);
  }
  
  return JSON.stringify(currentValue) !== JSON.stringify(newValue);
}

/**
 * Check if value is a variable alias
 */
function isVariableAlias(value: any): value is VariableAlias {
  return typeof value === "object" && "type" in value && value.type === "VARIABLE_ALIAS";
}

/**
 * Main optimized import function
 */
export async function importVariablesOptimized(options: OptimizedImportOptions): Promise<ImportResult> {
  const startTime = Date.now();
  shouldCancel = false;
  
  // Reset quota manager and performance optimizer
  quotaManager.reset();
  performanceOptimizer.reset();

  logToUI(`Starting optimized import with link: ${options.link}`);
  logToUI(quotaManager.getQuotaStatus());

  try {
    // Validate input
    const spreadsheetId = validateGoogleSheetsUrl(options.link);

    // Fetch metadata
    const metadata = await quotaManager.executeWithQuota(
      () => fetchSheetMetadata(spreadsheetId, options.apiKey),
      'sheetsRead'
    );

    let sheetNames = metadata.sheets.map((sheet: any) => sheet.properties.title);
    if (options.excludeSheets?.length) {
      sheetNames = sheetNames.filter(name => !options.excludeSheets!.includes(name));
      logToUI(`Excluding sheets: ${options.excludeSheets.join(", ")}`);
    }

    logToUI(`Processing ${sheetNames.length} sheets`);

    // Process all sheets
    const allProcessedVariables: ProcessedVariable[] = [];
    const totalStats = { processed: 0, created: 0, updated: 0, aliases: 0, errors: 0 };

    for (const sheetName of sheetNames) {
      if (shouldCancel) break;

      logToUI(`Processing sheet: ${sheetName}`);
      const { variables, stats } = await processSheetOptimized(spreadsheetId, sheetName, options.apiKey);
      
      allProcessedVariables.push(...variables);
      totalStats.processed += stats.processed;
      totalStats.created += stats.created;
      totalStats.updated += stats.updated;
      totalStats.aliases += stats.aliases;
      totalStats.errors += stats.errors;

      logToUI(`Completed sheet ${sheetName}: ${stats.processed} processed, ${stats.created} created, ${stats.updated} updated`);
    }

    if (!shouldCancel) {
      // Apply all updates
      await applyVariableUpdates(allProcessedVariables);
      
      // Apply all aliases
      await applyVariableAliases(allProcessedVariables);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    const result: ImportResult = {
      spreadsheetId,
      sheetNames,
      stats: {
        totalProcessed: totalStats.processed,
        created: totalStats.created,
        updated: totalStats.updated,
        aliases: totalStats.aliases,
        errors: totalStats.errors,
        duration,
      },
    };

    logToUI(`Import completed in ${duration}ms`);
    logToUI(`Final stats: ${JSON.stringify(result.stats)}`);
    logToUI(quotaManager.getQuotaStatus());

    return result;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logToUI(`Import failed: ${errorMessage}`);
    throw new ImportError(`Import failed: ${errorMessage}`, { link: options.link });
  }
}

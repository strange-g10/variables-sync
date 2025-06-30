import { config } from "../../config";
import { logToUI } from "../../utils/log";
import { quotaManager } from "../../utils/quotaManager";
import { performanceOptimizer } from "../../utils/performanceOptimizer";

interface Binding {
  variableId: string;
  property: string;
}

export async function assignVariables(data: any[][], forceBindAll: boolean = false) {
  const headers = data[0]; // ['name', 'type', 'id', 'LayerID']
  const rows = data.slice(1);
  const totalRows = rows.length;

  logToUI(`Starting assignment of ${totalRows} variables${forceBindAll ? " (Force Bind All)" : ""}`);

  // Load cache từ clientStorage
  const cachedBindings: Map<string, Binding> = (await figma.clientStorage.getAsync("bindings")) || new Map();
  const variableMap = new Map<string, Variable>();
  figma.variables.getLocalVariables().forEach(v => variableMap.set(v.id, v));

  // Tạo Map từ sheet data
  const sheetMap = new Map<string, { name: string; type: string; variableId: string }>();
  rows.forEach(row => sheetMap.set(row[3], { name: row[0], type: row[1], variableId: row[2] })); // layerId làm key

  // Delta detection (nếu không forceBindAll)
  let deltaRows: any[][] = [];
  if (!forceBindAll) {
    for (const [layerId, sheetData] of sheetMap) {
      const current = cachedBindings.get(layerId);
      if (!current || current.variableId !== sheetData.variableId) {
        deltaRows.push([sheetData.name, sheetData.type, sheetData.variableId, layerId]);
      }
    }
    // Xóa bindings không còn trong sheet
    for (const [layerId, current] of cachedBindings) {
      if (!sheetMap.has(layerId)) {
        const node = figma.getNodeById(layerId);
        if (node) {
          if (current.property === "characters" && node.type === "TEXT") {
            (node as TextNode).setBoundVariable("characters", null);
          } else if (current.property === "visible") {
            (node as any).setBoundVariable("visible", null);
          }
        }
        cachedBindings.delete(layerId);
      }
    }
  } else {
    deltaRows = rows; // Gán toàn bộ nếu forceBindAll
  }

  const deltaCount = deltaRows.length;
  logToUI(`Detected ${deltaCount} changes out of ${totalRows} variables`);

  if (deltaCount === 0 && !forceBindAll) {
    logToUI("No changes detected, skipping assignment");
    await figma.clientStorage.setAsync("bindings", cachedBindings);
    return;
  }

  // Xử lý batch
  const batchSize = config.BATCH_SIZE;
  let successfulCount = 0;

  async function processBatch(batchRows: any[]): Promise<number> {
    let batchSuccessCount = 0;
    for (let attempt = 1; attempt <= config.MAX_RETRIES; attempt++) {
      try {
        const promises = batchRows.map(async row => {
          const [name, type, variableId, layerId] = row;
          const node = figma.getNodeById(layerId);
          const variable = variableMap.get(variableId);

          if (!node || !variable) return;

          if (type === "STRING" && node.type === "TEXT") {
            const textNode = node as TextNode;
            await figma.loadFontAsync(textNode.fontName as FontName);
            textNode.setBoundVariable("characters", variable);
            cachedBindings.set(layerId, { variableId, property: "characters" });
            batchSuccessCount++;
          } else if (type === "BOOLEAN" && "visible" in node) {
            (node as any).setBoundVariable("visible", variable);
            cachedBindings.set(layerId, { variableId, property: "visible" });
            batchSuccessCount++;
          }
        });
        await Promise.all(promises);
        return batchSuccessCount;
      } catch (e) {
        if (attempt === config.MAX_RETRIES) {
          logToUI(`Batch failed after ${config.MAX_RETRIES} retries: ${(e as Error).message}`);
          return batchSuccessCount;
        }
        await new Promise(resolve => setTimeout(resolve, config.API_CALL_DELAY));
      }
    }
    return batchSuccessCount;
  }

  for (let i = 0; i < deltaCount; i += batchSize) {
    const batchRows = deltaRows.slice(i, Math.min(i + batchSize, deltaCount));
    const batchSuccess = await processBatch(batchRows);
    successfulCount += batchSuccess;
    updateProgress(`${i + batchSize} of ${deltaCount} changes`);
  }

  // Lưu cache sau khi hoàn thành
  await figma.clientStorage.setAsync("bindings", cachedBindings);
  logToUI(`Assignment completed: Processed ${deltaCount} changes, ${successfulCount} successful`);
}
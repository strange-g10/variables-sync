import { logToUI } from "../../utils/log";
import { toHexColor } from "../../utils/color";
import { quotaManager } from "../../utils/quotaManager";
import { performanceOptimizer } from "../../utils/performanceOptimizer";

export async function exportFull(collection?: string) {
  try {
    const fileName = `${figma.root.name}${collection ? "_" + collection : ""}_full.json`;
    const variables = figma.variables.getLocalVariables();
    logToUI(`Exporting full data for ${variables.length} variables`);
    let collections: string[];
    if (collection) {
      // Nếu collection là tên, tìm id
      const found = figma.variables.getLocalVariableCollections().find((c) => c.name === collection);
      collections = found ? [found.id] : [collection]; // fallback nếu truyền id
    } else {
      collections = [...new Set(variables.map((v) => v.variableCollectionId))];
    }
    const collectionNames = collections
      .map((id) => figma.variables.getVariableCollectionById(id)?.name || id)
      .filter(Boolean);
    const pages = figma.root.children.map((page) => page.name);

    const collectionModes: { [key: string]: { modeId: string; name: string }[] } = {};
    collections.forEach((collectionId) => {
      const collectionObj = figma.variables.getVariableCollectionById(collectionId);
      if (collectionObj) {
        collectionModes[collectionId] = collectionObj.modes.map((mode) => ({
          modeId: mode.modeId,
          name: mode.name,
        }));
      }
    });

    const data = {
      fileName: figma.root.name, // Trường fileName trong JSON luôn là tên file Figma gốc
      pages,
      collectionCount: collections.length,
      collectionNames,
      variables: variables
        .filter(
          (v) =>
            !collection ||
            collections.includes(v.variableCollectionId)
        )
        .map((v) => {
          const collectionObj = figma.variables.getVariableCollectionById(v.variableCollectionId);
          if (!collectionObj) return null;
          const modes = collectionModes[v.variableCollectionId] || [];
          return {
            id: v.id,
            name: v.name,
            type: v.resolvedType,
            key: (typeof v.key === 'string') ? v.key : '',
            valuesByMode: Object.fromEntries(
              Object.entries(v.valuesByMode).map(([modeId, value]) => {
                const mode = modes.find((m) => m.modeId === modeId);
                const modeName = mode ? mode.name : modeId;
                const exportedValue =
                  v.resolvedType === "COLOR" ? toHexColor(value) : value;
                return [modeName, exportedValue];
              })
            ),
            collectionId: v.variableCollectionId,
            collectionName: collectionObj.name,
          };
        })
        .filter((v): v is NonNullable<typeof v> => v !== null),
    };

    logToUI(`Exported JSON: ${JSON.stringify(data, null, 2).slice(0, 1000)}...`);
    figma.ui.postMessage({ type: "exported", data, fileName });
    logToUI(`Exported full data as ${fileName} with ${variables.length} variables`);
  } catch (e) {
    logToUI(`Export error: ${(e as Error).message}`);
  }
}
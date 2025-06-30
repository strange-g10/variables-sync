import { logToUI } from "../../utils/log";

export async function exportIds(collection?: string) {
  try {
    // Tên file lưu trên máy vẫn theo lựa chọn của người dùng
    const fileName = `${figma.root.name}${collection ? "_" + collection : ""}_ids.json`;
    const variables = figma.variables.getLocalVariables();
    logToUI(`Exporting IDs for ${variables.length} variables`);
    const data = {
      fileName: figma.root.name, // Trường fileName trong JSON luôn là tên file Figma gốc
      variables: variables
        .filter(
          (v) =>
            !collection ||
            v.variableCollectionId ===
              figma.variables.getLocalVariableCollections().find((c) => c.name === collection)?.id
        )
        .map((v) => ({ id: v.id, name: v.name })),
    };
    figma.ui.postMessage({ type: "exported", data, fileName });
    logToUI(`Exported Variable IDs as ${fileName} with ${variables.length} variables`);
  } catch (e) {
    logToUI(`Export error: ${(e as Error).message}`);
  }
}
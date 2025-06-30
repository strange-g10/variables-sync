import { logToUI } from "../../utils/log";

export function clearCollections() {
  try {
    const collections = figma.variables.getLocalVariableCollections();
    collections.forEach((collection) => {
      const variables = figma.variables.getLocalVariables().filter(
        (v) => v.variableCollectionId === collection.id
      );
      variables.forEach((v) => v.remove());
    });
    logToUI("Cleared all variables in collections");
  } catch (e) {
    logToUI(`Clear collections error: ${(e as Error).message}`);
  }
}
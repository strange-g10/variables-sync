import { logToUI } from "../../utils/log";
import { fetchSheetMetadata } from "./fetch";
import { SheetData } from "./types";

export async function detectDelta(
  spreadsheetId: string,
  apiKey: string,
  cachedMetadata: SheetData | null
): Promise<{ changedSheets: string[]; newSheets: string[] }> {
  const metadata = await fetchSheetMetadata(spreadsheetId, apiKey);
  const sheetNames = metadata.sheets.map(sheet => sheet.properties.title);

  const cached = cachedMetadata?.spreadsheetId === spreadsheetId
    ? cachedMetadata.sheetNames
    : [];
  const changedSheets = sheetNames.filter(name => !cached.includes(name));
  const newSheets = sheetNames.filter(name => !figma.variables.getLocalVariableCollections().some(c => c.name === name));

  logToUI(`Delta detection: ${changedSheets.length} changed, ${newSheets.length} new sheets`);
  return { changedSheets, newSheets };
}
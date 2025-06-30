import { config } from "../../config";
import { logToUI } from "../../utils/log";

export async function fetchWithRetry(url: string, maxRetries: number = config.MAX_RETRIES): Promise<Response> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`[DEBUG] fetchWithRetry: Fetching URL: ${url} (Attempt ${i + 1}/${maxRetries})`);
      const response = await fetch(url);
      console.log(`[DEBUG] fetchWithRetry: Response status: ${response.status}`);
      if (response.ok) {
        console.log(`[DEBUG] fetchWithRetry: Fetch successful`);
        return response;
      }
      if (response.status === 429) {
        console.log(`[DEBUG] fetchWithRetry: Quota error (429), retrying...`);
        await new Promise(resolve => setTimeout(resolve, config.API_CALL_DELAY * (i + 1)));
        continue;
      }
      const text = await response.text();
      console.log(`[DEBUG] fetchWithRetry: Fetch failed, status: ${response.status}, body: ${text}`);
      throw new Error(`Fetch failed: ${response.statusText}`);
    } catch (e) {
      console.log(`[DEBUG] fetchWithRetry: Exception:`, e);
      if (i === maxRetries - 1) {
        throw e;
      }
    } finally {
      console.log(`[DEBUG] fetchWithRetry: Attempt ${i + 1} finished`);
    }
  }
  throw new Error("Unreachable");
}

export async function fetchSheetMetadata(spreadsheetId: string, apiKey: string): Promise<{ sheets: { properties: { title: string } }[] }> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${apiKey}`;
  logToUI(`[LOG] fetchSheetMetadata: Fetching metadata for spreadsheetId=${spreadsheetId}, apiKey=${apiKey ? '[REDACTED]' : '[MISSING]'}`);
  const response = await fetchWithRetry(url);
  const data = await response.json();
  console.log("[DEBUG] fetchSheetMetadata: raw metadata object:", data);
  logToUI(`[LOG] fetchSheetMetadata: raw metadata object: ${JSON.stringify(data)}`);
  if (!data.sheets || !Array.isArray(data.sheets)) {
    console.log("[DEBUG] fetchSheetMetadata: data.sheets:", data.sheets);
    logToUI(`[LOG] fetchSheetMetadata: data.sheets is invalid: ${JSON.stringify(data.sheets)}`);
  } else {
    logToUI(`[LOG] fetchSheetMetadata: sheets count: ${data.sheets.length}`);
    data.sheets.forEach((sheet: any, idx: number) => {
      logToUI(`[LOG] fetchSheetMetadata: sheet[${idx}].properties.title: ${sheet.properties && sheet.properties.title}`);
    });
  }
  logToUI(`Fetched metadata for spreadsheet ${spreadsheetId}: ${data.sheets ? data.sheets.length : 0} sheets`);
  return data;
}

export async function fetchSheetData(spreadsheetId: string, sheetName: string, apiKey: string): Promise<any[][]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}?key=${apiKey}`;
  logToUI(`[LOG] fetchSheetData: Fetching data for spreadsheetId=${spreadsheetId}, sheetName=${sheetName}, apiKey=${apiKey ? '[REDACTED]' : '[MISSING]'}`);
  const response = await fetchWithRetry(url);
  const data = await response.json();
  console.log(`[DEBUG] fetchSheetData: raw data for sheet '${sheetName}':`, data);
  logToUI(`[LOG] fetchSheetData: raw data for sheet '${sheetName}': ${JSON.stringify(data)}`);
  if (!data.values || !Array.isArray(data.values)) {
    logToUI(`Invalid sheet data for ${sheetName}`);
    throw new Error(`Invalid sheet data for ${sheetName}`);
  }
  logToUI(`Fetched ${data.values.length} rows for sheet ${sheetName}`);
  console.log(`[DEBUG] fetchSheetData: parsed values for sheet '${sheetName}':`, data.values);
  return data.values;
}
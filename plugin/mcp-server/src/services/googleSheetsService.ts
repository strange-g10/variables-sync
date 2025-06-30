import { ConfigService } from './configService.js';

export interface SheetMetadata {
  sheets: Array<{
    properties: {
      title: string;
      sheetId: number;
      index: number;
    };
  }>;
}

export class GoogleSheetsService {
  private configService: ConfigService;

  constructor(configService: ConfigService) {
    this.configService = configService;
  }

  private extractSpreadsheetId(url: string): string {
    const match = url.match(/[-\w]{25,}/);
    if (!match) {
      throw new Error('Invalid Google Sheets URL format');
    }
    return match[0];
  }

  async fetchSheetMetadata(spreadsheetId: string): Promise<SheetMetadata> {
    const apiKey = this.configService.getGoogleSheetsApiKey();
    if (!apiKey) {
      throw new Error('Google Sheets API key not configured');
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${apiKey}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Google Sheets API error: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`);
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch sheet metadata: ${error.message}`);
      }
      throw new Error('Failed to fetch sheet metadata: Unknown error');
    }
  }

  async fetchSheetList(sheetUrl: string): Promise<string[]> {
    const spreadsheetId = this.extractSpreadsheetId(sheetUrl);
    const metadata = await this.fetchSheetMetadata(spreadsheetId);
    
    return metadata.sheets?.map(sheet => sheet.properties.title) || [];
  }

  async fetchSheetData(sheetUrl: string, sheetName?: string, range?: string): Promise<any[][]> {
    const spreadsheetId = this.extractSpreadsheetId(sheetUrl);
    const apiKey = this.configService.getGoogleSheetsApiKey();
    
    if (!apiKey) {
      throw new Error('Google Sheets API key not configured');
    }

    // Build the range string
    let fullRange = sheetName || 'Sheet1';
    if (range) {
      fullRange = `${fullRange}!${range}`;
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(fullRange)}?key=${apiKey}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Google Sheets API error: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`);
      }
      
      const data = await response.json();
      return data.values || [];
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch sheet data: ${error.message}`);
      }
      throw new Error('Failed to fetch sheet data: Unknown error');
    }
  }

  async fetchMultipleSheets(sheetUrl: string, sheetNames: string[]): Promise<Record<string, any[][]>> {
    const results: Record<string, any[][]> = {};
    
    for (const sheetName of sheetNames) {
      try {
        results[sheetName] = await this.fetchSheetData(sheetUrl, sheetName);
      } catch (error) {
        console.warn(`Failed to fetch sheet "${sheetName}":`, error);
        results[sheetName] = [];
      }
    }
    
    return results;
  }

  async fetchAllSheets(sheetUrl: string, excludeSheets: string[] = []): Promise<Record<string, any[][]>> {
    // First get all sheet names
    const allSheetNames = await this.fetchSheetList(sheetUrl);
    
    // Filter out excluded sheets
    const sheetsToFetch = allSheetNames.filter(name => !excludeSheets.includes(name));
    
    return this.fetchMultipleSheets(sheetUrl, sheetsToFetch);
  }

  // Utility method to check if the service is properly configured
  isConfigured(): boolean {
    return this.configService.validateGoogleSheetsConfig();
  }

  // Get configuration info for debugging
  getConfigInfo() {
    const config = this.configService.getConfig();
    return {
      hasApiKey: !!config.googleSheets.apiKey,
      hasCredentials: !!config.googleSheets.credentials,
      batchSize: config.batch.size,
      maxRetries: config.batch.maxRetries,
      apiCallDelay: config.batch.apiCallDelay,
    };
  }
}

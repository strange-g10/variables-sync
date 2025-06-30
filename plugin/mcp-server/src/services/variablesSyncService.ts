import { GoogleSheetsService } from './googleSheetsService.js';

export interface VariableCollection {
  id: string;
  name: string;
  modes: Array<{
    modeId: string;
    name: string;
  }>;
  variables: Array<{
    id: string;
    name: string;
    type: string;
    values: Record<string, any>;
  }>;
}

export interface ExportResult {
  collection: string;
  format: 'full' | 'ids';
  data: any;
  timestamp: string;
}

export interface ImportResult {
  sheetsProcessed: string[];
  variablesCreated: number;
  variablesUpdated: number;
  errors: string[];
  timestamp: string;
}

export interface AssignmentResult {
  assignmentsCompleted: number;
  assignmentsFailed: number;
  errors: string[];
  timestamp: string;
}

export class VariablesSyncService {
  private googleSheetsService: GoogleSheetsService;

  constructor(googleSheetsService: GoogleSheetsService) {
    this.googleSheetsService = googleSheetsService;
  }

  async getCollections(): Promise<VariableCollection[]> {
    // This would typically interface with Figma API or plugin data
    // For now, return mock data - in real implementation this would
    // communicate with the Figma plugin or use Figma API
    
    return [
      {
        id: 'collection-1',
        name: 'Design Tokens',
        modes: [
          { modeId: 'mode-1', name: 'Light' },
          { modeId: 'mode-2', name: 'Dark' }
        ],
        variables: [
          {
            id: 'var-1',
            name: 'primary-color',
            type: 'COLOR',
            values: {
              'mode-1': { r: 0.2, g: 0.5, b: 1.0, a: 1.0 },
              'mode-2': { r: 0.3, g: 0.6, b: 1.0, a: 1.0 }
            }
          }
        ]
      }
    ];
  }

  async exportVariables(collectionName: string, format: 'full' | 'ids'): Promise<ExportResult> {
    const collections = await this.getCollections();
    const collection = collections.find(c => c.name === collectionName);
    
    if (!collection) {
      throw new Error(`Collection "${collectionName}" not found`);
    }

    let exportData: any;
    
    if (format === 'full') {
      exportData = {
        collection: collection,
        metadata: {
          exportDate: new Date().toISOString(),
          totalVariables: collection.variables.length,
          modes: collection.modes.length
        }
      };
    } else {
      exportData = {
        collectionId: collection.id,
        variableIds: collection.variables.map(v => v.id),
        modeIds: collection.modes.map(m => m.modeId)
      };
    }

    return {
      collection: collectionName,
      format,
      data: exportData,
      timestamp: new Date().toISOString()
    };
  }

  async importVariables(sheetUrl: string, excludeSheets: string[] = []): Promise<ImportResult> {
    try {
      // Fetch data from Google Sheets
      const sheetsData = await this.googleSheetsService.fetchAllSheets(sheetUrl, excludeSheets);
      
      let variablesCreated = 0;
      let variablesUpdated = 0;
      const errors: string[] = [];
      const sheetsProcessed = Object.keys(sheetsData);

      for (const [sheetName, data] of Object.entries(sheetsData)) {
        try {
          // Process each sheet's data
          const result = await this.processSheetData(sheetName, data);
          variablesCreated += result.created;
          variablesUpdated += result.updated;
        } catch (error) {
          const errorMsg = `Error processing sheet "${sheetName}": ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMsg);
        }
      }

      return {
        sheetsProcessed,
        variablesCreated,
        variablesUpdated,
        errors,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Import failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async assignVariables(sheetUrl: string, sheetName?: string, forceBindAll: boolean = false): Promise<AssignmentResult> {
    try {
      let assignmentData: any[][];
      
      if (sheetName) {
        assignmentData = await this.googleSheetsService.fetchSheetData(sheetUrl, sheetName);
      } else {
        // Use first sheet if no specific sheet name provided
        const sheets = await this.googleSheetsService.fetchSheetList(sheetUrl);
        if (sheets.length === 0) {
          throw new Error('No sheets found in the document');
        }
        assignmentData = await this.googleSheetsService.fetchSheetData(sheetUrl, sheets[0]);
      }

      const result = await this.processAssignmentData(assignmentData, forceBindAll);
      
      return {
        assignmentsCompleted: result.completed,
        assignmentsFailed: result.failed,
        errors: result.errors,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Assignment failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async clearCollections(): Promise<void> {
    // This would interface with Figma API to clear collections
    // For now, this is a placeholder
    console.log('Clearing all variable collections...');
    
    // In real implementation, this would:
    // 1. Get all collections
    // 2. Delete all variables in each collection
    // 3. Optionally delete the collections themselves
  }

  private async processSheetData(sheetName: string, data: any[][]): Promise<{ created: number; updated: number }> {
    // Process sheet data and convert to Figma variables
    // This is a simplified implementation
    
    if (data.length === 0) {
      return { created: 0, updated: 0 };
    }

    // Assume first row is headers
    const headers = data[0];
    const rows = data.slice(1);
    
    let created = 0;
    let updated = 0;

    for (const row of rows) {
      if (row.length === 0) continue;
      
      // Parse variable data from row
      const variableData = this.parseVariableFromRow(headers, row);
      
      if (variableData) {
        // Check if variable exists (simplified)
        const exists = await this.variableExists(variableData.name);
        
        if (exists) {
          // Update existing variable
          await this.updateVariable(variableData);
          updated++;
        } else {
          // Create new variable
          await this.createVariable(variableData);
          created++;
        }
      }
    }

    return { created, updated };
  }

  private async processAssignmentData(data: any[][], forceBindAll: boolean): Promise<{ completed: number; failed: number; errors: string[] }> {
    // Process assignment data to bind variables to Figma elements
    
    if (data.length === 0) {
      return { completed: 0, failed: 0, errors: [] };
    }

    const headers = data[0];
    const rows = data.slice(1);
    
    let completed = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const row of rows) {
      if (row.length === 0) continue;
      
      try {
        const assignmentData = this.parseAssignmentFromRow(headers, row);
        
        if (assignmentData) {
          await this.assignVariableToElement(assignmentData, forceBindAll);
          completed++;
        }
      } catch (error) {
        failed++;
        errors.push(`Row ${rows.indexOf(row) + 2}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return { completed, failed, errors };
  }

  private parseVariableFromRow(headers: string[], row: string[]): any | null {
    // Parse variable data from spreadsheet row
    const variableData: any = {};
    
    headers.forEach((header, index) => {
      if (row[index] !== undefined) {
        variableData[header.toLowerCase().replace(/\s+/g, '_')] = row[index];
      }
    });

    // Validate required fields
    if (!variableData.name) {
      return null;
    }

    return variableData;
  }

  private parseAssignmentFromRow(headers: string[], row: string[]): any | null {
    // Parse assignment data from spreadsheet row
    const assignmentData: any = {};
    
    headers.forEach((header, index) => {
      if (row[index] !== undefined) {
        assignmentData[header.toLowerCase().replace(/\s+/g, '_')] = row[index];
      }
    });

    // Validate required fields for assignment
    if (!assignmentData.element_id || !assignmentData.variable_name) {
      return null;
    }

    return assignmentData;
  }

  private async variableExists(name: string): Promise<boolean> {
    // Check if variable exists in Figma
    // This is a placeholder - would use Figma API
    return false;
  }

  private async createVariable(data: any): Promise<void> {
    // Create variable in Figma
    // This is a placeholder - would use Figma API
    console.log(`Creating variable: ${data.name}`);
  }

  private async updateVariable(data: any): Promise<void> {
    // Update existing variable in Figma
    // This is a placeholder - would use Figma API
    console.log(`Updating variable: ${data.name}`);
  }

  private async assignVariableToElement(data: any, forceBindAll: boolean): Promise<void> {
    // Assign variable to Figma element
    // This is a placeholder - would use Figma API
    console.log(`Assigning variable ${data.variable_name} to element ${data.element_id}`);
  }

  // Utility methods
  isGoogleSheetsConfigured(): boolean {
    return this.googleSheetsService.isConfigured();
  }

  getServiceInfo() {
    return {
      googleSheets: this.googleSheetsService.getConfigInfo(),
      isReady: this.isGoogleSheetsConfigured()
    };
  }
}

// Simplified Google Sheets Export Service using Service Account
// This service will store the Service Account JSON and use it via the existing scripts approach

import { logToUI } from "../utils/log";

interface Variable {
  id: string;
  name: string;
  type: string;
  key: string;
  valuesByMode: Record<string, any>;
  collectionId: string;
  collectionName: string;
}

interface ServiceAccountCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

interface SheetData {
  [collectionName: string]: any[][];
}

export class SimpleGoogleSheetsExportService {
  private spreadsheetId: string;
  private serviceAccountCredentials: ServiceAccountCredentials;

  constructor(credentials: ServiceAccountCredentials | string, sheetsUrl: string) {
    if (typeof credentials === 'string') {
      try {
        this.serviceAccountCredentials = JSON.parse(credentials);
      } catch (error) {
        throw new Error('Invalid Service Account credentials JSON');
      }
    } else {
      this.serviceAccountCredentials = credentials;
    }
    this.spreadsheetId = this.extractSpreadsheetId(sheetsUrl);
  }

  private extractSpreadsheetId(url: string): string {
    const match = url.match(/[-\w]{25,}/);
    if (!match) {
      throw new Error('Invalid Google Sheets URL format');
    }
    return match[0];
  }

  /**
   * Process variables data similar to process_data.py
   */
  private processVariablesData(variables: Variable[]): SheetData {
    const processedVariables: SheetData = {};
    
    // Group variables by collection
    const collections = [...new Set(variables.map(v => v.collectionName))];
    
    for (const collectionName of collections) {
      logToUI(`Processing collection: ${collectionName}`);
      
      const collectionVars = variables.filter(v => v.collectionName === collectionName);
      if (collectionVars.length === 0) continue;

      // Get all modes from the first variable in collection
      const modes = Object.keys(collectionVars[0].valuesByMode);
      logToUI(`Found modes for ${collectionName}: ${modes.join(', ')}`);

      // Create header row: name, type, VariableKey, VariableID, then modes and aliases
      const header = ["name", "type", "VariableKey", "VariableID"];
      for (const mode of modes) {
        header.push(mode);
        header.push(`${mode}_Variable_Alias`);
      }

      const sheetData = [header];

      // Process each variable
      for (const variable of collectionVars) {
        const row = [
          variable.name,
          variable.type,
          variable.key || "",
          variable.id
        ];

        // Add mode values and alias flags
        for (const mode of modes) {
          const value = variable.valuesByMode[mode];
          const isAlias = typeof value === 'object' && value?.type === 'VARIABLE_ALIAS';
          
          if (isAlias) {
            row.push(value.id);
            row.push("true");
          } else {
            if (typeof value === 'boolean') {
              row.push(value.toString());
              row.push("false");
            } else {
              row.push(value || "");
              row.push("false");
            }
          }
        }

        sheetData.push(row);
      }

      processedVariables[collectionName] = sheetData;
      logToUI(`Processed ${collectionName}: ${sheetData.length - 1} variables`);
    }

    return processedVariables;
  }

  /**
   * Export to Google Sheets using MCP server as proxy
   */
  async exportToSheets(variables: Variable[], onProgress?: (progress: number, status: string) => void): Promise<void> {
    try {
      onProgress?.(10, "Processing variables data...");
      const processedData = this.processVariablesData(variables);

      onProgress?.(30, "Preparing data for export...");
      
      // Create the data structure that matches what the Python scripts expect
      const exportData = {
        variables: processedData,
        spreadsheet_id: this.spreadsheetId,
        service_account: this.serviceAccountCredentials
      };

      onProgress?.(50, "Sending to MCP server...");
      
      // Send data to MCP server endpoint
      const mcpServerUrl = 'http://localhost:3000/export-to-sheets'; // Adjust if needed
      
      logToUI(`Connecting to MCP server at: ${mcpServerUrl}`);
      
      const response = await fetch(mcpServerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportData)
      });

      logToUI(`MCP Server response status: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.text();
        logToUI(`MCP Server error response: ${errorData}`);
        throw new Error(`MCP Server error: ${response.status} - ${errorData}`);
      }

      onProgress?.(90, "Finalizing export...");
      
      // Check content type before parsing
      const contentType = response.headers.get('content-type');
      logToUI(`Response content-type: ${contentType}`);
      
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        logToUI(`Non-JSON response: ${textResponse}`);
        throw new Error(`Expected JSON response but got: ${contentType}`);
      }
      
      const result = await response.json();
      logToUI(`MCP Server response: ${JSON.stringify(result)}`);
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown error from MCP server');
      }

      onProgress?.(100, "Export completed successfully!");
      
      const collectionNames = Object.keys(processedData);
      const totalVariables = Object.values(processedData).reduce((sum, data) => sum + (data.length - 1), 0);
      
      logToUI(`Successfully exported ${totalVariables} variables across ${collectionNames.length} collections: ${collectionNames.join(', ')}`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logToUI(`Export failed: ${errorMessage}`);
      
      // If MCP server is not available, provide instructions
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('MCP server not running. Please start the MCP server or use the Python scripts directly.');
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Alternative: Export as JSON files that can be processed by Python scripts
   */
  async exportAsProcessedJSON(variables: Variable[]): Promise<{processedData: SheetData, spreadsheetId: string}> {
    const processedData = this.processVariablesData(variables);
    
    return {
      processedData,
      spreadsheetId: this.spreadsheetId
    };
  }

  /**
   * Validate Service Account credentials
   */
  static validateServiceAccount(credentials: string): boolean {
    try {
      const parsed = JSON.parse(credentials);
      return !!(
        parsed.type === 'service_account' &&
        parsed.client_email &&
        parsed.private_key &&
        parsed.project_id
      );
    } catch {
      return false;
    }
  }

  /**
   * Get Service Account info for display
   */
  getServiceAccountInfo(): {email: string, project: string} {
    return {
      email: this.serviceAccountCredentials.client_email,
      project: this.serviceAccountCredentials.project_id
    };
  }
}

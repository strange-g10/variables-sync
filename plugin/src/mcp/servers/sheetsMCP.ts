/**
 * Google Sheets MCP Server
 * Handles Google Sheets integration and data management
 */

import { z } from "zod";
import { BaseMCPServer, MCPScope, MCPResource, MCPTool } from "../base/mcpServer.js";
import { fetchSheetMetadata, fetchSheetData } from "../../features/import/fetch.js";
import { config } from "../../config/index.js";

export class SheetsMCPServer extends BaseMCPServer {
  private sheetCache: Map<string, any> = new Map();
  private metadataCache: Map<string, any> = new Map();

  constructor() {
    const scope: MCPScope = {
      name: "Google Sheets Integration",
      namespace: "sheets",
      priority: 90, // Lower priority than variables
      description: "Manages Google Sheets data integration and synchronization",
    };

    super(scope);
  }

  protected async initialize(): Promise<void> {
    // Add resources
    this.addSheetsResources();
    
    // Add tools
    this.addSheetsTools();
    
    console.log("Google Sheets MCP Server initialized");
  }

  private addSheetsResources(): void {
    // Sheet metadata resource
    this.addResource({
      uri: "sheets://metadata/{spreadsheetId}",
      name: "Sheet Metadata",
      description: "Metadata for a specific Google Sheets document",
      mimeType: "application/json",
    });

    // Sheet data resource
    this.addResource({
      uri: "sheets://data/{spreadsheetId}/{sheetName}",
      name: "Sheet Data",
      description: "Data from a specific sheet within a Google Sheets document",
      mimeType: "application/json",
    });

    // Cached sheets resource
    this.addResource({
      uri: "sheets://cache/list",
      name: "Cached Sheets",
      description: "List of currently cached sheet data",
      mimeType: "application/json",
    });
  }

  private addSheetsTools(): void {
    // Fetch sheet metadata tool
    this.addTool({
      name: "fetch_sheet_metadata",
      description: "Fetch metadata for a Google Sheets document",
      inputSchema: z.object({
        spreadsheetId: z.string().min(1, "Spreadsheet ID is required"),
        apiKey: z.string().min(1, "API key is required").optional(),
      }),
      handler: async (args) => {
        const apiKey = args.apiKey || config.GOOGLE_SHEETS_API_KEY;
        const metadata = await fetchSheetMetadata(args.spreadsheetId, apiKey);
        
        // Cache the metadata
        this.metadataCache.set(args.spreadsheetId, metadata);
        
        return metadata;
      },
    });

    // Fetch sheet data tool
    this.addTool({
      name: "fetch_sheet_data",
      description: "Fetch data from a specific sheet",
      inputSchema: z.object({
        spreadsheetId: z.string().min(1, "Spreadsheet ID is required"),
        sheetName: z.string().min(1, "Sheet name is required"),
        apiKey: z.string().min(1, "API key is required").optional(),
        useCache: z.boolean().default(true),
      }),
      handler: async (args) => {
        const cacheKey = `${args.spreadsheetId}:${args.sheetName}`;
        
        // Check cache first if enabled
        if (args.useCache && this.sheetCache.has(cacheKey)) {
          return {
            data: this.sheetCache.get(cacheKey),
            fromCache: true,
          };
        }

        const apiKey = args.apiKey || config.GOOGLE_SHEETS_API_KEY;
        const data = await fetchSheetData(args.spreadsheetId, args.sheetName, apiKey);
        
        // Cache the data
        this.sheetCache.set(cacheKey, data);
        
        return {
          data,
          fromCache: false,
        };
      },
    });

    // List sheets tool
    this.addTool({
      name: "list_sheets",
      description: "List all sheets in a Google Sheets document",
      inputSchema: z.object({
        spreadsheetId: z.string().min(1, "Spreadsheet ID is required"),
        apiKey: z.string().min(1, "API key is required").optional(),
      }),
      handler: async (args) => {
        const apiKey = args.apiKey || config.GOOGLE_SHEETS_API_KEY;
        const metadata = await fetchSheetMetadata(args.spreadsheetId, apiKey);
        
        return {
          spreadsheetId: args.spreadsheetId,
          title: metadata.properties?.title,
          sheets: metadata.sheets?.map((sheet: any) => ({
            sheetId: sheet.properties.sheetId,
            title: sheet.properties.title,
            index: sheet.properties.index,
            sheetType: sheet.properties.sheetType,
            gridProperties: sheet.properties.gridProperties,
          })) || [],
        };
      },
    });

    // Validate sheet URL tool
    this.addTool({
      name: "validate_sheet_url",
      description: "Validate and extract information from a Google Sheets URL",
      inputSchema: z.object({
        url: z.string().url("Must be a valid URL"),
      }),
      handler: async (args) => {
        const match = args.url.match(/[-\\w]{25,}/);
        if (!match) {
          throw new Error("Invalid Google Sheets URL format");
        }

        const spreadsheetId = match[0];
        
        // Try to fetch metadata to validate
        try {
          const metadata = await fetchSheetMetadata(spreadsheetId, config.GOOGLE_SHEETS_API_KEY);
          return {
            isValid: true,
            spreadsheetId,
            title: metadata.properties?.title,
            url: args.url,
          };
        } catch (error) {
          return {
            isValid: false,
            spreadsheetId,
            error: error instanceof Error ? error.message : String(error),
            url: args.url,
          };
        }
      },
    });

    // Clear cache tool
    this.addTool({
      name: "clear_cache",
      description: "Clear cached sheet data",
      inputSchema: z.object({
        spreadsheetId: z.string().optional(),
        sheetName: z.string().optional(),
      }),
      handler: async (args) => {
        let clearedCount = 0;

        if (args.spreadsheetId && args.sheetName) {
          // Clear specific sheet
          const key = `${args.spreadsheetId}:${args.sheetName}`;
          if (this.sheetCache.delete(key)) {
            clearedCount = 1;
          }
        } else if (args.spreadsheetId) {
          // Clear all sheets for a spreadsheet
          for (const key of this.sheetCache.keys()) {
            if (key.startsWith(`${args.spreadsheetId}:`)) {
              this.sheetCache.delete(key);
              clearedCount++;
            }
          }
          // Also clear metadata
          this.metadataCache.delete(args.spreadsheetId);
        } else {
          // Clear all cache
          clearedCount = this.sheetCache.size + this.metadataCache.size;
          this.sheetCache.clear();
          this.metadataCache.clear();
        }

        return {
          clearedCount,
          message: `Cleared ${clearedCount} cached items`,
        };
      },
    });

    // Analyze sheet structure tool
    this.addTool({
      name: "analyze_sheet_structure",
      description: "Analyze the structure and format of sheet data",
      inputSchema: z.object({
        spreadsheetId: z.string().min(1, "Spreadsheet ID is required"),
        sheetName: z.string().min(1, "Sheet name is required"),
        apiKey: z.string().min(1, "API key is required").optional(),
      }),
      handler: async (args) => {
        const apiKey = args.apiKey || config.GOOGLE_SHEETS_API_KEY;
        const data = await fetchSheetData(args.spreadsheetId, args.sheetName, apiKey);
        
        return this.analyzeSheetStructure(data, args.sheetName);
      },
    });
  }

  protected async readResource(resource: MCPResource): Promise<{
    contents: Array<{ uri: string; mimeType?: string; text?: string; blob?: string }>;
  }> {
    const uri = resource.uri;

    if (uri === "sheets://cache/list") {
      return this.getCachedSheetsList();
    }

    // Handle dynamic URIs
    const metadataMatch = uri.match(/^sheets:\/\/metadata\/(.+)$/);
    if (metadataMatch) {
      const spreadsheetId = metadataMatch[1];
      return this.getSheetMetadata(spreadsheetId);
    }

    const dataMatch = uri.match(/^sheets:\/\/data\/([^\/]+)\/(.+)$/);
    if (dataMatch) {
      const [, spreadsheetId, sheetName] = dataMatch;
      return this.getSheetData(spreadsheetId, sheetName);
    }

    throw new Error(`Unknown resource: ${uri}`);
  }

  private async getCachedSheetsList(): Promise<{
    contents: Array<{ uri: string; mimeType?: string; text?: string; blob?: string }>;
  }> {
    const cachedSheets = Array.from(this.sheetCache.keys()).map(key => {
      const [spreadsheetId, sheetName] = key.split(":");
      return { spreadsheetId, sheetName, key };
    });

    const cachedMetadata = Array.from(this.metadataCache.keys()).map(spreadsheetId => ({
      spreadsheetId,
      type: "metadata",
    }));

    return {
      contents: [{
        uri: "sheets://cache/list",
        mimeType: "application/json",
        text: JSON.stringify({
          cachedSheets,
          cachedMetadata,
          totalCached: cachedSheets.length + cachedMetadata.length,
        }, null, 2),
      }],
    };
  }

  private async getSheetMetadata(spreadsheetId: string): Promise<{
    contents: Array<{ uri: string; mimeType?: string; text?: string; blob?: string }>;
  }> {
    let metadata = this.metadataCache.get(spreadsheetId);
    
    if (!metadata) {
      // Fetch if not cached
      metadata = await fetchSheetMetadata(spreadsheetId, config.GOOGLE_SHEETS_API_KEY);
      this.metadataCache.set(spreadsheetId, metadata);
    }

    return {
      contents: [{
        uri: `sheets://metadata/${spreadsheetId}`,
        mimeType: "application/json",
        text: JSON.stringify(metadata, null, 2),
      }],
    };
  }

  private async getSheetData(spreadsheetId: string, sheetName: string): Promise<{
    contents: Array<{ uri: string; mimeType?: string; text?: string; blob?: string }>;
  }> {
    const cacheKey = `${spreadsheetId}:${sheetName}`;
    let data = this.sheetCache.get(cacheKey);
    
    if (!data) {
      // Fetch if not cached
      data = await fetchSheetData(spreadsheetId, sheetName, config.GOOGLE_SHEETS_API_KEY);
      this.sheetCache.set(cacheKey, data);
    }

    return {
      contents: [{
        uri: `sheets://data/${spreadsheetId}/${sheetName}`,
        mimeType: "application/json",
        text: JSON.stringify(data, null, 2),
      }],
    };
  }

  private analyzeSheetStructure(data: any[][], sheetName: string) {
    if (!data || data.length === 0) {
      return {
        sheetName,
        isEmpty: true,
        rowCount: 0,
        columnCount: 0,
      };
    }

    const headers = data[0] || [];
    const dataRows = data.slice(1);
    
    // Analyze column types
    const columnAnalysis = headers.map((header, index) => {
      const values = dataRows.map(row => row[index]).filter(v => v !== undefined && v !== "");
      const types = this.analyzeColumnTypes(values);
      
      return {
        name: header,
        index,
        sampleValues: values.slice(0, 5),
        totalValues: values.length,
        emptyCount: dataRows.length - values.length,
        detectedTypes: types,
      };
    });

    // Check for variable-like structure
    const hasVariableStructure = this.checkVariableStructure(headers);

    return {
      sheetName,
      isEmpty: false,
      rowCount: data.length,
      columnCount: headers.length,
      dataRows: dataRows.length,
      headers,
      columnAnalysis,
      hasVariableStructure,
      recommendations: this.generateRecommendations(columnAnalysis, hasVariableStructure),
    };
  }

  private analyzeColumnTypes(values: any[]) {
    const types = {
      string: 0,
      number: 0,
      boolean: 0,
      color: 0,
      variable: 0,
    };

    values.forEach(value => {
      const str = String(value).trim();
      
      if (str.match(/^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/)) {
        types.color++;
      } else if (str.toLowerCase() === "true" || str.toLowerCase() === "false") {
        types.boolean++;
      } else if (!isNaN(Number(str)) && str !== "") {
        types.number++;
      } else if (str.match(/^[a-zA-Z0-9_-]{25,}$/)) {
        types.variable++;
      } else {
        types.string++;
      }
    });

    return types;
  }

  private checkVariableStructure(headers: string[]) {
    const requiredHeaders = ["name", "type"];
    const hasRequired = requiredHeaders.every(h => 
      headers.some(header => header.toLowerCase().includes(h.toLowerCase()))
    );

    const hasModes = headers.some(h => 
      !["name", "type", "variableid"].includes(h.toLowerCase()) && 
      !h.includes("$") && 
      !h.endsWith("_Variable_Alias")
    );

    return {
      hasRequiredHeaders: hasRequired,
      hasModeColumns: hasModes,
      isVariableSheet: hasRequired && hasModes,
      headers,
    };
  }

  private generateRecommendations(columnAnalysis: any[], variableStructure: any) {
    const recommendations: string[] = [];

    if (!variableStructure.isVariableSheet) {
      recommendations.push("This sheet doesn't appear to follow the expected variable structure");
      
      if (!variableStructure.hasRequiredHeaders) {
        recommendations.push("Add 'name' and 'type' columns for variable definitions");
      }
      
      if (!variableStructure.hasModeColumns) {
        recommendations.push("Add mode columns (e.g., 'Light', 'Dark') for variable values");
      }
    }

    // Check for common issues
    const emptyColumns = columnAnalysis.filter(col => col.totalValues === 0);
    if (emptyColumns.length > 0) {
      recommendations.push(`Remove empty columns: ${emptyColumns.map(c => c.name).join(", ")}`);
    }

    const inconsistentTypes = columnAnalysis.filter(col => {
      const types = Object.values(col.detectedTypes) as number[];
      const maxType = Math.max(...types);
      const totalValues = types.reduce((a, b) => a + b, 0);
      return maxType / totalValues < 0.8 && totalValues > 0;
    });

    if (inconsistentTypes.length > 0) {
      recommendations.push(`Check data consistency in columns: ${inconsistentTypes.map(c => c.name).join(", ")}`);
    }

    return recommendations;
  }
}

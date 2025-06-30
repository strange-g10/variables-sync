/**
 * Variables MCP Server
 * Handles Figma variables management operations
 */

import { z } from "zod";
import { BaseMCPServer, MCPScope, MCPResource, MCPTool } from "../base/mcpServer.js";
import { exportFull, exportIds } from "../../features/export/index.js";
import { importVariablesOptimized } from "../../features/import/optimized.js";
import { assignVariables } from "../../features/assign/index.js";
import { clearCollections } from "../../features/clear/index.js";
import { getCollections } from "../../features/collections/index.js";

export class VariablesMCPServer extends BaseMCPServer {
  constructor() {
    const scope: MCPScope = {
      name: "Figma Variables Management",
      namespace: "variables",
      priority: 100, // High priority for core functionality
      description: "Manages Figma variables including import, export, and assignment operations",
    };

    super(scope);
  }

  protected async initialize(): Promise<void> {
    // Add resources
    this.addVariableResources();
    
    // Add tools
    this.addVariableTools();
    
    console.log("Variables MCP Server initialized");
  }

  private addVariableResources(): void {
    // Current variables in Figma
    this.addResource({
      uri: "figma://variables/current",
      name: "Current Variables",
      description: "All variables currently in the Figma file",
      mimeType: "application/json",
    });

    // Variable collections
    this.addResource({
      uri: "figma://collections/current",
      name: "Current Collections",
      description: "All variable collections in the current Figma file",
      mimeType: "application/json",
    });

    // Variable usage in document
    this.addResource({
      uri: "figma://variables/usage",
      name: "Variable Usage",
      description: "Information about how variables are used in the document",
      mimeType: "application/json",
    });
  }

  private addVariableTools(): void {
    // Import variables tool
    this.addTool({
      name: "import_variables",
      description: "Import variables from Google Sheets",
      inputSchema: z.object({
        googleSheetsUrl: z.string().url("Must be a valid Google Sheets URL"),
        excludeSheets: z.array(z.string()).optional(),
        apiKey: z.string().min(1, "API key is required"),
        enableBatching: z.boolean().default(true),
        maxConcurrency: z.number().min(1).max(10).default(3),
      }),
      handler: async (args) => {
        return await importVariablesOptimized({
          link: args.googleSheetsUrl,
          excludeSheets: args.excludeSheets,
          apiKey: args.apiKey,
          enableBatching: args.enableBatching,
          maxConcurrency: args.maxConcurrency,
        });
      },
    });

    // Export variables tool
    this.addTool({
      name: "export_variables",
      description: "Export variables to JSON format",
      inputSchema: z.object({
        collection: z.string().optional(),
        format: z.enum(["full", "ids"]).default("full"),
      }),
      handler: async (args) => {
        if (args.format === "full") {
          return await exportFull(args.collection);
        } else {
          return await exportIds(args.collection);
        }
      },
    });

    // Assign variables tool
    this.addTool({
      name: "assign_variables",
      description: "Assign variables to design elements",
      inputSchema: z.object({
        data: z.array(z.array(z.string())),
        forceBindAll: z.boolean().default(false),
      }),
      handler: async (args) => {
        return await assignVariables(args.data, args.forceBindAll);
      },
    });

    // Clear collections tool
    this.addTool({
      name: "clear_collections",
      description: "Clear all variable collections",
      inputSchema: z.object({}),
      handler: async () => {
        return await clearCollections();
      },
    });

    // Get collections tool
    this.addTool({
      name: "get_collections",
      description: "Get list of all variable collections",
      inputSchema: z.object({}),
      handler: async () => {
        return getCollections();
      },
    });

    // Analyze variables tool
    this.addTool({
      name: "analyze_variables",
      description: "Analyze variable usage and provide insights",
      inputSchema: z.object({
        includeUsage: z.boolean().default(true),
        includeDuplicates: z.boolean().default(true),
        includeUnused: z.boolean().default(true),
      }),
      handler: async (args) => {
        return await this.analyzeVariables(args);
      },
    });
  }

  protected async readResource(resource: MCPResource): Promise<{
    contents: Array<{ uri: string; mimeType?: string; text?: string; blob?: string }>;
  }> {
    switch (resource.uri) {
      case "figma://variables/current":
        return this.getCurrentVariables();
      
      case "figma://collections/current":
        return this.getCurrentCollections();
      
      case "figma://variables/usage":
        return this.getVariableUsage();
      
      default:
        throw new Error(`Unknown resource: ${resource.uri}`);
    }
  }

  private async getCurrentVariables(): Promise<{
    contents: Array<{ uri: string; mimeType?: string; text?: string; blob?: string }>;
  }> {
    const variables = figma.variables.getLocalVariables();
    const variableData = variables.map(variable => ({
      id: variable.id,
      name: variable.name,
      type: variable.resolvedType,
      collectionId: variable.variableCollectionId,
      key: variable.key,
      valuesByMode: variable.valuesByMode,
    }));

    return {
      contents: [{
        uri: "figma://variables/current",
        mimeType: "application/json",
        text: JSON.stringify(variableData, null, 2),
      }],
    };
  }

  private async getCurrentCollections(): Promise<{
    contents: Array<{ uri: string; mimeType?: string; text?: string; blob?: string }>;
  }> {
    const collections = figma.variables.getLocalVariableCollections();
    const collectionData = collections.map(collection => ({
      id: collection.id,
      name: collection.name,
      modes: collection.modes,
      variableIds: collection.variableIds,
    }));

    return {
      contents: [{
        uri: "figma://collections/current",
        mimeType: "application/json",
        text: JSON.stringify(collectionData, null, 2),
      }],
    };
  }

  private async getVariableUsage(): Promise<{
    contents: Array<{ uri: string; mimeType?: string; text?: string; blob?: string }>;
  }> {
    // This would require scanning the document for variable usage
    // Implementation would depend on specific needs
    const usageData = {
      message: "Variable usage analysis not yet implemented",
      totalVariables: figma.variables.getLocalVariables().length,
      totalCollections: figma.variables.getLocalVariableCollections().length,
    };

    return {
      contents: [{
        uri: "figma://variables/usage",
        mimeType: "application/json",
        text: JSON.stringify(usageData, null, 2),
      }],
    };
  }

  private async analyzeVariables(options: {
    includeUsage: boolean;
    includeDuplicates: boolean;
    includeUnused: boolean;
  }) {
    const variables = figma.variables.getLocalVariables();
    const collections = figma.variables.getLocalVariableCollections();

    const analysis = {
      summary: {
        totalVariables: variables.length,
        totalCollections: collections.length,
        variablesByType: this.groupVariablesByType(variables),
        variablesByCollection: this.groupVariablesByCollection(variables, collections),
      },
      duplicates: options.includeDuplicates ? this.findDuplicateVariables(variables) : null,
      unused: options.includeUnused ? this.findUnusedVariables(variables) : null,
      usage: options.includeUsage ? this.analyzeVariableUsage(variables) : null,
    };

    return analysis;
  }

  private groupVariablesByType(variables: Variable[]) {
    const groups: { [key: string]: number } = {};
    variables.forEach(variable => {
      groups[variable.resolvedType] = (groups[variable.resolvedType] || 0) + 1;
    });
    return groups;
  }

  private groupVariablesByCollection(variables: Variable[], collections: VariableCollection[]) {
    const groups: { [key: string]: { name: string; count: number } } = {};
    
    collections.forEach(collection => {
      const count = variables.filter(v => v.variableCollectionId === collection.id).length;
      groups[collection.id] = {
        name: collection.name,
        count,
      };
    });
    
    return groups;
  }

  private findDuplicateVariables(variables: Variable[]) {
    const nameGroups: { [key: string]: Variable[] } = {};
    
    variables.forEach(variable => {
      if (!nameGroups[variable.name]) {
        nameGroups[variable.name] = [];
      }
      nameGroups[variable.name].push(variable);
    });

    const duplicates = Object.entries(nameGroups)
      .filter(([, vars]) => vars.length > 1)
      .map(([name, vars]) => ({
        name,
        count: vars.length,
        variables: vars.map(v => ({ id: v.id, collectionId: v.variableCollectionId })),
      }));

    return duplicates;
  }

  private findUnusedVariables(variables: Variable[]) {
    // This would require scanning the document for variable usage
    // For now, return a placeholder
    return {
      message: "Unused variable detection not yet implemented",
      totalVariables: variables.length,
    };
  }

  private analyzeVariableUsage(variables: Variable[]) {
    // This would require scanning the document for variable usage
    // For now, return a placeholder
    return {
      message: "Variable usage analysis not yet implemented",
      totalVariables: variables.length,
    };
  }
}

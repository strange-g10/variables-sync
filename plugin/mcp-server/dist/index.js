#!/usr/bin/env node
"use strict";
/**
 * Standalone MCP Server for Claude Desktop Integration
 * This server provides Figma Variables Sync functionality to Claude
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FigmaVariablesMCPServer = void 0;
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
class FigmaVariablesMCPServer {
    server;
    workingDirectory;
    constructor() {
        this.workingDirectory = process.cwd();
        this.server = new index_js_1.Server({
            name: "figma-variables-sync",
            version: "1.0.0",
        }, {
            capabilities: {
                resources: {},
                tools: {},
            },
        });
        this.setupHandlers();
    }
    setupHandlers() {
        // List available resources
        this.server.setRequestHandler(types_js_1.ListResourcesRequestSchema, async () => {
            const resources = [
                {
                    uri: "figma://variables/export",
                    name: "Figma Variables Export",
                    description: "Export Figma variables to JSON format",
                    mimeType: "application/json",
                },
                {
                    uri: "figma://variables/template",
                    name: "Google Sheets Template",
                    description: "Template for Google Sheets variable import",
                    mimeType: "text/csv",
                },
                {
                    uri: "figma://config/example",
                    name: "Configuration Example",
                    description: "Example configuration for Figma Variables Sync",
                    mimeType: "application/json",
                },
            ];
            return { resources };
        });
        // Read specific resource
        this.server.setRequestHandler(types_js_1.ReadResourceRequestSchema, async (request) => {
            const { uri } = request.params;
            switch (uri) {
                case "figma://variables/export":
                    return await this.getVariablesExport();
                case "figma://variables/template":
                    return await this.getGoogleSheetsTemplate();
                case "figma://config/example":
                    return await this.getConfigExample();
                default:
                    throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, `Resource not found: ${uri}`);
            }
        });
        // List available tools
        this.server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
            const tools = [
                {
                    name: "analyze_figma_file",
                    description: "Analyze a Figma file and extract variable information",
                    inputSchema: {
                        type: "object",
                        properties: {
                            filePath: {
                                type: "string",
                                description: "Path to the Figma file or exported JSON",
                            },
                        },
                        required: ["filePath"],
                    },
                },
                {
                    name: "create_import_template",
                    description: "Create a Google Sheets template for importing variables",
                    inputSchema: {
                        type: "object",
                        properties: {
                            variables: {
                                type: "array",
                                description: "List of variables to include in template",
                                items: {
                                    type: "object",
                                    properties: {
                                        name: { type: "string" },
                                        type: { type: "string" },
                                        defaultValue: { type: "string" },
                                    },
                                },
                            },
                            outputPath: {
                                type: "string",
                                description: "Path where to save the template file",
                            },
                        },
                        required: ["variables"],
                    },
                },
                {
                    name: "validate_google_sheet",
                    description: "Validate a Google Sheets URL and analyze its structure",
                    inputSchema: {
                        type: "object",
                        properties: {
                            url: {
                                type: "string",
                                description: "Google Sheets URL to validate",
                            },
                            apiKey: {
                                type: "string",
                                description: "Google Sheets API key (optional)",
                            },
                        },
                        required: ["url"],
                    },
                },
                {
                    name: "generate_figma_plugin_config",
                    description: "Generate configuration for the Figma Variables Sync plugin",
                    inputSchema: {
                        type: "object",
                        properties: {
                            googleSheetsUrl: {
                                type: "string",
                                description: "Google Sheets URL for sync",
                            },
                            apiKey: {
                                type: "string",
                                description: "Google Sheets API key",
                            },
                            excludeSheets: {
                                type: "array",
                                items: { type: "string" },
                                description: "Sheet names to exclude from import",
                            },
                        },
                        required: ["googleSheetsUrl"],
                    },
                },
                {
                    name: "convert_csv_to_figma_format",
                    description: "Convert CSV data to Figma variables format",
                    inputSchema: {
                        type: "object",
                        properties: {
                            csvPath: {
                                type: "string",
                                description: "Path to CSV file",
                            },
                            outputPath: {
                                type: "string",
                                description: "Path for output JSON file",
                            },
                        },
                        required: ["csvPath"],
                    },
                },
            ];
            return { tools };
        });
        // Execute tool
        this.server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                let result;
                switch (name) {
                    case "analyze_figma_file":
                        result = await this.analyzeFigmaFile(args);
                        break;
                    case "create_import_template":
                        result = await this.createImportTemplate(args);
                        break;
                    case "validate_google_sheet":
                        result = await this.validateGoogleSheet(args);
                        break;
                    case "generate_figma_plugin_config":
                        result = await this.generatePluginConfig(args);
                        break;
                    case "convert_csv_to_figma_format":
                        result = await this.convertCsvToFigmaFormat(args);
                        break;
                    default:
                        throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, `Tool not found: ${name}`);
                }
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            catch (error) {
                throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }
    async getVariablesExport() {
        const exampleExport = {
            fileName: "Design System",
            variables: [
                {
                    id: "var_123",
                    name: "primary-color",
                    type: "COLOR",
                    valuesByMode: {
                        Light: "#007AFF",
                        Dark: "#0A84FF",
                    },
                    collection: "Colors",
                },
                {
                    id: "var_456",
                    name: "base-spacing",
                    type: "FLOAT",
                    valuesByMode: {
                        Default: 8,
                    },
                    collection: "Spacing",
                },
            ],
        };
        return {
            contents: [
                {
                    uri: "figma://variables/export",
                    mimeType: "application/json",
                    text: JSON.stringify(exampleExport, null, 2),
                },
            ],
        };
    }
    async getGoogleSheetsTemplate() {
        const template = `name,type,VariableID,Light,Dark,Light_Variable_Alias,Dark_Variable_Alias
primary-color,COLOR,,#007AFF,#0A84FF,FALSE,FALSE
secondary-color,COLOR,,#34C759,#32D74B,FALSE,FALSE
text-primary,COLOR,,#000000,#FFFFFF,FALSE,FALSE
spacing-xs,FLOAT,,4,4,FALSE,FALSE
spacing-sm,FLOAT,,8,8,FALSE,FALSE
spacing-md,FLOAT,,16,16,FALSE,FALSE
font-size-body,FLOAT,,16,16,FALSE,FALSE
font-size-heading,FLOAT,,24,24,FALSE,FALSE`;
        return {
            contents: [
                {
                    uri: "figma://variables/template",
                    mimeType: "text/csv",
                    text: template,
                },
            ],
        };
    }
    async getConfigExample() {
        const config = {
            googleSheetsUrl: "https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit",
            apiKey: "YOUR_GOOGLE_SHEETS_API_KEY",
            excludeSheets: ["Archive", "Templates"],
            batchSize: 50,
            enableCaching: true,
            maxConcurrency: 3,
        };
        return {
            contents: [
                {
                    uri: "figma://config/example",
                    mimeType: "application/json",
                    text: JSON.stringify(config, null, 2),
                },
            ],
        };
    }
    async analyzeFigmaFile(args) {
        try {
            const filePath = path.resolve(this.workingDirectory, args.filePath);
            const fileContent = await fs.readFile(filePath, "utf-8");
            const data = JSON.parse(fileContent);
            const analysis = {
                fileName: data.fileName || "Unknown",
                totalVariables: data.variables?.length || 0,
                collections: this.groupByCollection(data.variables || []),
                variableTypes: this.groupByType(data.variables || []),
                modes: this.extractModes(data.variables || []),
                recommendations: this.generateRecommendations(data.variables || []),
            };
            return {
                success: true,
                analysis,
                message: `Analyzed ${analysis.totalVariables} variables from ${analysis.fileName}`,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                message: "Failed to analyze Figma file",
            };
        }
    }
    async createImportTemplate(args) {
        try {
            const { variables, outputPath } = args;
            // Create CSV header
            const modes = ["Light", "Dark"]; // Default modes
            const headers = [
                "name",
                "type",
                "VariableID",
                ...modes,
                ...modes.map(mode => `${mode}_Variable_Alias`),
            ];
            // Create CSV rows
            const rows = variables.map(variable => [
                variable.name,
                variable.type || "STRING",
                "", // Empty VariableID for new variables
                variable.defaultValue || "",
                variable.defaultValue || "", // Same value for both modes initially
                "FALSE",
                "FALSE",
            ]);
            const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
            if (outputPath) {
                const fullPath = path.resolve(this.workingDirectory, outputPath);
                await fs.writeFile(fullPath, csv, "utf-8");
                return {
                    success: true,
                    message: `Template created at ${fullPath}`,
                    path: fullPath,
                    variableCount: variables.length,
                };
            }
            return {
                success: true,
                template: csv,
                variableCount: variables.length,
                message: "Template generated successfully",
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                message: "Failed to create import template",
            };
        }
    }
    async validateGoogleSheet(args) {
        try {
            const { url } = args;
            // Extract spreadsheet ID from URL
            const match = url.match(/[-\w]{25,}/);
            if (!match) {
                return {
                    success: false,
                    error: "Invalid Google Sheets URL format",
                    suggestions: [
                        "Make sure the URL is a valid Google Sheets URL",
                        "Example: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit",
                    ],
                };
            }
            const spreadsheetId = match[0];
            return {
                success: true,
                spreadsheetId,
                url,
                message: "URL format is valid",
                nextSteps: [
                    "Add your Google Sheets API key to fetch actual data",
                    "Use the Figma plugin to import variables from this sheet",
                    "Ensure the sheet follows the expected variable format",
                ],
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                message: "Failed to validate Google Sheet URL",
            };
        }
    }
    async generatePluginConfig(args) {
        try {
            const config = {
                googleSheetsUrl: args.googleSheetsUrl,
                apiKey: args.apiKey || "YOUR_API_KEY_HERE",
                excludeSheets: args.excludeSheets || [],
                enableBatching: true,
                maxConcurrency: 3,
                batchSize: 50,
                enableCaching: true,
                conflictResolution: "priority",
            };
            return {
                success: true,
                config,
                instructions: [
                    "1. Copy this configuration to your .env file",
                    "2. Replace YOUR_API_KEY_HERE with your actual Google Sheets API key",
                    "3. Open Figma and run the Variables Sync plugin",
                    "4. Paste the Google Sheets URL in the import tab",
                    "5. Configure any sheets to exclude if needed",
                ],
                message: "Plugin configuration generated successfully",
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                message: "Failed to generate plugin configuration",
            };
        }
    }
    async convertCsvToFigmaFormat(args) {
        try {
            const csvPath = path.resolve(this.workingDirectory, args.csvPath);
            const csvContent = await fs.readFile(csvPath, "utf-8");
            // Parse CSV
            const lines = csvContent.split("\n").filter(line => line.trim());
            const headers = lines[0].split(",");
            const rows = lines.slice(1).map(line => line.split(","));
            // Convert to Figma format
            const variables = rows.map((row, index) => {
                const variable = {};
                headers.forEach((header, i) => {
                    variable[header.trim()] = row[i]?.trim() || "";
                });
                return {
                    id: variable.VariableID || `generated_${index}`,
                    name: variable.name,
                    type: variable.type || "STRING",
                    valuesByMode: this.extractModeValues(variable, headers),
                    collection: variable.collection || "Default",
                };
            });
            const figmaData = {
                fileName: "Imported Variables",
                variables,
                totalVariables: variables.length,
                collections: this.groupByCollection(variables),
            };
            if (args.outputPath) {
                const outputPath = path.resolve(this.workingDirectory, args.outputPath);
                await fs.writeFile(outputPath, JSON.stringify(figmaData, null, 2), "utf-8");
                return {
                    success: true,
                    message: `Converted ${variables.length} variables to Figma format`,
                    outputPath,
                    data: figmaData,
                };
            }
            return {
                success: true,
                message: `Converted ${variables.length} variables to Figma format`,
                data: figmaData,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                message: "Failed to convert CSV to Figma format",
            };
        }
    }
    // Helper methods
    groupByCollection(variables) {
        const collections = {};
        variables.forEach(variable => {
            const collection = variable.collection || variable.collectionName || "Default";
            collections[collection] = (collections[collection] || 0) + 1;
        });
        return collections;
    }
    groupByType(variables) {
        const types = {};
        variables.forEach(variable => {
            const type = variable.type || "UNKNOWN";
            types[type] = (types[type] || 0) + 1;
        });
        return types;
    }
    extractModes(variables) {
        const modes = new Set();
        variables.forEach(variable => {
            if (variable.valuesByMode) {
                Object.keys(variable.valuesByMode).forEach(mode => modes.add(mode));
            }
        });
        return Array.from(modes);
    }
    extractModeValues(variable, headers) {
        const modeValues = {};
        headers.forEach(header => {
            if (!["name", "type", "VariableID", "collection"].includes(header) &&
                !header.endsWith("_Variable_Alias")) {
                modeValues[header] = variable[header];
            }
        });
        return modeValues;
    }
    generateRecommendations(variables) {
        const recommendations = [];
        if (variables.length === 0) {
            recommendations.push("No variables found in the file");
            return recommendations;
        }
        const collections = this.groupByCollection(variables);
        if (Object.keys(collections).length === 1) {
            recommendations.push("Consider organizing variables into multiple collections");
        }
        const types = this.groupByType(variables);
        if (!types.COLOR && !types.FLOAT) {
            recommendations.push("Consider adding color and spacing variables for better design consistency");
        }
        return recommendations;
    }
    async start() {
        const transport = new stdio_js_1.StdioServerTransport();
        await this.server.connect(transport);
        console.error("Figma Variables Sync MCP Server started");
    }
}
exports.FigmaVariablesMCPServer = FigmaVariablesMCPServer;
// Start the server
async function main() {
    const server = new FigmaVariablesMCPServer();
    await server.start();
}
if (require.main === module) {
    main().catch((error) => {
        console.error("Failed to start server:", error);
        process.exit(1);
    });
}
//# sourceMappingURL=index.js.map
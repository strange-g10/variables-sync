#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { VariablesSyncService } from './services/variablesSyncService.js';
import { GoogleSheetsService } from './services/googleSheetsService.js';
import { ConfigService } from './services/configService.js';

class FigmaVariablesSyncMCPServer {
  private server: Server;
  private variablesSyncService: VariablesSyncService;
  private googleSheetsService: GoogleSheetsService;
  private configService: ConfigService;

  constructor() {
    this.server = new Server(
      {
        name: 'figma-variables-sync',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.configService = new ConfigService();
    this.googleSheetsService = new GoogleSheetsService(this.configService);
    this.variablesSyncService = new VariablesSyncService(this.googleSheetsService);

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'export_variables',
            description: 'Export Figma variables to various formats',
            inputSchema: {
              type: 'object',
              properties: {
                collection: {
                  type: 'string',
                  description: 'Variable collection name to export',
                },
                format: {
                  type: 'string',
                  enum: ['full', 'ids'],
                  description: 'Export format: full data or just IDs',
                },
              },
              required: ['collection', 'format'],
            },
          },
          {
            name: 'import_variables',
            description: 'Import variables from Google Sheets',
            inputSchema: {
              type: 'object',
              properties: {
                sheetUrl: {
                  type: 'string',
                  description: 'Google Sheets URL to import from',
                },
                excludeSheets: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Sheet names to exclude from import',
                  default: [],
                },
              },
              required: ['sheetUrl'],
            },
          },
          {
            name: 'assign_variables',
            description: 'Assign variables to Figma elements based on mapping data',
            inputSchema: {
              type: 'object',
              properties: {
                sheetUrl: {
                  type: 'string',
                  description: 'Google Sheets URL with assignment data',
                },
                sheetName: {
                  type: 'string',
                  description: 'Specific sheet name for assignment data',
                },
                forceBindAll: {
                  type: 'boolean',
                  description: 'Force bind all variables regardless of existing bindings',
                  default: false,
                },
              },
              required: ['sheetUrl'],
            },
          },
          {
            name: 'get_collections',
            description: 'Get list of available variable collections',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'clear_collections',
            description: 'Clear all variable collections',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'fetch_sheet_list',
            description: 'Fetch list of sheets from Google Sheets document',
            inputSchema: {
              type: 'object',
              properties: {
                sheetUrl: {
                  type: 'string',
                  description: 'Google Sheets URL to fetch sheet list from',
                },
              },
              required: ['sheetUrl'],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'export_variables':
            return await this.handleExportVariables(args);
          case 'import_variables':
            return await this.handleImportVariables(args);
          case 'assign_variables':
            return await this.handleAssignVariables(args);
          case 'get_collections':
            return await this.handleGetCollections();
          case 'clear_collections':
            return await this.handleClearCollections();
          case 'fetch_sheet_list':
            return await this.handleFetchSheetList(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error executing tool ${name}: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    });

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'config://variables-sync/config',
            mimeType: 'application/json',
            name: 'Variables Sync Configuration',
            description: 'Current configuration for the Variables Sync plugin',
          },
          {
            uri: 'data://variables-sync/collections',
            mimeType: 'application/json',
            name: 'Variable Collections',
            description: 'Current Figma variable collections',
          },
        ],
      };
    });

    // Handle resource reads
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      switch (uri) {
        case 'config://variables-sync/config':
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(this.configService.getConfig(), null, 2),
              },
            ],
          };
        case 'data://variables-sync/collections':
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(await this.variablesSyncService.getCollections(), null, 2),
              },
            ],
          };
        default:
          throw new Error(`Unknown resource: ${uri}`);
      }
    });
  }

  private async handleExportVariables(args: any) {
    const result = await this.variablesSyncService.exportVariables(args.collection, args.format);
    return {
      content: [
        {
          type: 'text',
          text: `Variables exported successfully. Format: ${args.format}, Collection: ${args.collection}`,
        },
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleImportVariables(args: any) {
    const result = await this.variablesSyncService.importVariables(
      args.sheetUrl,
      args.excludeSheets || []
    );
    return {
      content: [
        {
          type: 'text',
          text: `Variables imported successfully from: ${args.sheetUrl}`,
        },
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleAssignVariables(args: any) {
    const result = await this.variablesSyncService.assignVariables(
      args.sheetUrl,
      args.sheetName,
      args.forceBindAll || false
    );
    return {
      content: [
        {
          type: 'text',
          text: `Variables assigned successfully. Sheet: ${args.sheetName}, Force bind: ${args.forceBindAll}`,
        },
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleGetCollections() {
    const collections = await this.variablesSyncService.getCollections();
    return {
      content: [
        {
          type: 'text',
          text: `Found ${collections.length} variable collections`,
        },
        {
          type: 'text',
          text: JSON.stringify(collections, null, 2),
        },
      ],
    };
  }

  private async handleClearCollections() {
    await this.variablesSyncService.clearCollections();
    return {
      content: [
        {
          type: 'text',
          text: 'All variable collections cleared successfully',
        },
      ],
    };
  }

  private async handleFetchSheetList(args: any) {
    const sheets = await this.googleSheetsService.fetchSheetList(args.sheetUrl);
    return {
      content: [
        {
          type: 'text',
          text: `Found ${sheets.length} sheets in document`,
        },
        {
          type: 'text',
          text: JSON.stringify(sheets, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Figma Variables Sync MCP Server running on stdio');
  }
}

const server = new FigmaVariablesSyncMCPServer();
server.run().catch(console.error);

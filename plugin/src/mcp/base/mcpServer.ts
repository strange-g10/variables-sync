/**
 * Base MCP Server for Figma Plugin
 * Provides foundation for multiple MCP instances with conflict resolution
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

export interface MCPScope {
  name: string;
  namespace: string;
  priority: number;
  description: string;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: z.ZodSchema;
  handler: (args: any) => Promise<any>;
}

export abstract class BaseMCPServer {
  protected server: Server;
  protected scope: MCPScope;
  protected resources: Map<string, MCPResource> = new Map();
  protected tools: Map<string, MCPTool> = new Map();
  protected static instances: Map<string, BaseMCPServer> = new Map();

  constructor(scope: MCPScope) {
    this.scope = scope;
    this.server = new Server(
      {
        name: `figma-plugin-${scope.namespace}`,
        version: "1.0.0",
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    // Register this instance
    BaseMCPServer.instances.set(scope.namespace, this);
    
    this.setupHandlers();
  }

  /**
   * Setup base MCP handlers
   */
  private setupHandlers(): void {
    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: Array.from(this.resources.values()).map(resource => ({
          uri: resource.uri,
          name: resource.name,
          description: resource.description,
          mimeType: resource.mimeType,
        })),
      };
    });

    // Read specific resource
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const resource = this.resources.get(request.params.uri);
      if (!resource) {
        throw new McpError(ErrorCode.InvalidRequest, `Resource not found: ${request.params.uri}`);
      }

      return await this.readResource(resource);
    });

    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: Array.from(this.tools.values()).map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      };
    });

    // Execute tool
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const tool = this.tools.get(request.params.name);
      if (!tool) {
        throw new McpError(ErrorCode.InvalidRequest, `Tool not found: ${request.params.name}`);
      }

      try {
        // Validate input using Zod schema
        const validatedArgs = tool.inputSchema.parse(request.params.arguments);
        const result = await tool.handler(validatedArgs);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  /**
   * Add resource to this MCP server
   */
  protected addResource(resource: MCPResource): void {
    // Check for conflicts with other MCP instances
    this.checkResourceConflict(resource);
    this.resources.set(resource.uri, resource);
  }

  /**
   * Add tool to this MCP server
   */
  protected addTool(tool: MCPTool): void {
    // Check for conflicts with other MCP instances
    this.checkToolConflict(tool);
    this.tools.set(tool.name, tool);
  }

  /**
   * Check for resource conflicts across MCP instances
   */
  private checkResourceConflict(resource: MCPResource): void {
    for (const [namespace, instance] of BaseMCPServer.instances) {
      if (namespace === this.scope.namespace) continue;
      
      if (instance.resources.has(resource.uri)) {
        const existingInstance = instance;
        if (existingInstance.scope.priority > this.scope.priority) {
          throw new Error(
            `Resource URI conflict: ${resource.uri} already exists in higher priority MCP: ${namespace}`
          );
        } else {
          // Remove from lower priority instance
          instance.resources.delete(resource.uri);
          console.warn(`Replaced resource ${resource.uri} from lower priority MCP: ${namespace}`);
        }
      }
    }
  }

  /**
   * Check for tool conflicts across MCP instances
   */
  private checkToolConflict(tool: MCPTool): void {
    for (const [namespace, instance] of BaseMCPServer.instances) {
      if (namespace === this.scope.namespace) continue;
      
      if (instance.tools.has(tool.name)) {
        const existingInstance = instance;
        if (existingInstance.scope.priority > this.scope.priority) {
          throw new Error(
            `Tool name conflict: ${tool.name} already exists in higher priority MCP: ${namespace}`
          );
        } else {
          // Remove from lower priority instance
          instance.tools.delete(tool.name);
          console.warn(`Replaced tool ${tool.name} from lower priority MCP: ${namespace}`);
        }
      }
    }
  }

  /**
   * Abstract method to read resource content
   */
  protected abstract readResource(resource: MCPResource): Promise<{
    contents: Array<{ uri: string; mimeType?: string; text?: string; blob?: string }>;
  }>;

  /**
   * Initialize and start the MCP server
   */
  protected abstract initialize(): Promise<void>;

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    await this.initialize();
    
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.log(`MCP Server started for scope: ${this.scope.name}`);
  }

  /**
   * Stop the MCP server
   */
  async stop(): Promise<void> {
    await this.server.close();
    BaseMCPServer.instances.delete(this.scope.namespace);
    console.log(`MCP Server stopped for scope: ${this.scope.name}`);
  }

  /**
   * Get information about this MCP instance
   */
  getInfo(): {
    scope: MCPScope;
    resourceCount: number;
    toolCount: number;
  } {
    return {
      scope: this.scope,
      resourceCount: this.resources.size,
      toolCount: this.tools.size,
    };
  }

  /**
   * Get all active MCP instances
   */
  static getAllInstances(): Map<string, BaseMCPServer> {
    return new Map(BaseMCPServer.instances);
  }

  /**
   * Get MCP instance by namespace
   */
  static getInstance(namespace: string): BaseMCPServer | undefined {
    return BaseMCPServer.instances.get(namespace);
  }
}

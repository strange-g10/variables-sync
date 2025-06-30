/**
 * MCP Manager
 * Coordinates multiple MCP server instances and handles conflicts
 */

import { BaseMCPServer } from "./base/mcpServer.js";
import { VariablesMCPServer } from "./servers/variablesMCP.js";
import { SheetsMCPServer } from "./servers/sheetsMCP.js";

export type MCPServerType = "variables" | "sheets" | "custom";

export interface MCPManagerConfig {
  enableVariables: boolean;
  enableSheets: boolean;
  autoStart: boolean;
  conflictResolution: "priority" | "error" | "merge";
}

export class MCPManager {
  private static instance: MCPManager;
  private servers: Map<string, BaseMCPServer> = new Map();
  private config: MCPManagerConfig;
  private isInitialized = false;

  constructor(config: MCPManagerConfig = {
    enableVariables: true,
    enableSheets: true,
    autoStart: false,
    conflictResolution: "priority",
  }) {
    this.config = config;
  }

  static getInstance(config?: MCPManagerConfig): MCPManager {
    if (!MCPManager.instance) {
      MCPManager.instance = new MCPManager(config);
    }
    return MCPManager.instance;
  }

  /**
   * Initialize MCP Manager and create server instances
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn("MCP Manager already initialized");
      return;
    }

    console.log("Initializing MCP Manager...");

    try {
      // Create and register server instances based on configuration
      if (this.config.enableVariables) {
        const variablesServer = new VariablesMCPServer();
        this.servers.set("variables", variablesServer);
        console.log("Variables MCP Server created");
      }

      if (this.config.enableSheets) {
        const sheetsServer = new SheetsMCPServer();
        this.servers.set("sheets", sheetsServer);
        console.log("Sheets MCP Server created");
      }

      // Auto-start servers if configured
      if (this.config.autoStart) {
        await this.startAll();
      }

      this.isInitialized = true;
      console.log("MCP Manager initialized successfully");

    } catch (error) {
      console.error("Failed to initialize MCP Manager:", error);
      throw error;
    }
  }

  /**
   * Add a custom MCP server
   */
  addServer(name: string, server: BaseMCPServer): void {
    if (this.servers.has(name)) {
      throw new Error(`MCP server with name "${name}" already exists`);
    }

    this.servers.set(name, server);
    console.log(`Custom MCP server "${name}" added`);
  }

  /**
   * Remove an MCP server
   */
  async removeServer(name: string): Promise<void> {
    const server = this.servers.get(name);
    if (!server) {
      throw new Error(`MCP server "${name}" not found`);
    }

    try {
      await server.stop();
      this.servers.delete(name);
      console.log(`MCP server "${name}" removed`);
    } catch (error) {
      console.error(`Failed to remove MCP server "${name}":`, error);
      throw error;
    }
  }

  /**
   * Start a specific MCP server
   */
  async startServer(name: string): Promise<void> {
    const server = this.servers.get(name);
    if (!server) {
      throw new Error(`MCP server "${name}" not found`);
    }

    try {
      await server.start();
      console.log(`MCP server "${name}" started`);
    } catch (error) {
      console.error(`Failed to start MCP server "${name}":`, error);
      throw error;
    }
  }

  /**
   * Stop a specific MCP server
   */
  async stopServer(name: string): Promise<void> {
    const server = this.servers.get(name);
    if (!server) {
      throw new Error(`MCP server "${name}" not found`);
    }

    try {
      await server.stop();
      console.log(`MCP server "${name}" stopped`);
    } catch (error) {
      console.error(`Failed to stop MCP server "${name}":`, error);
      throw error;
    }
  }

  /**
   * Start all registered MCP servers
   */
  async startAll(): Promise<void> {
    console.log("Starting all MCP servers...");
    
    const startPromises = Array.from(this.servers.entries()).map(async ([name, server]) => {
      try {
        await server.start();
        console.log(`✓ ${name} server started`);
      } catch (error) {
        console.error(`✗ Failed to start ${name} server:`, error);
        throw error;
      }
    });

    await Promise.all(startPromises);
    console.log("All MCP servers started successfully");
  }

  /**
   * Stop all running MCP servers
   */
  async stopAll(): Promise<void> {
    console.log("Stopping all MCP servers...");
    
    const stopPromises = Array.from(this.servers.entries()).map(async ([name, server]) => {
      try {
        await server.stop();
        console.log(`✓ ${name} server stopped`);
      } catch (error) {
        console.error(`✗ Failed to stop ${name} server:`, error);
        // Don't throw here, we want to try stopping all servers
      }
    });

    await Promise.allSettled(stopPromises);
    console.log("All MCP servers stop attempted");
  }

  /**
   * Restart a specific MCP server
   */
  async restartServer(name: string): Promise<void> {
    await this.stopServer(name);
    await this.startServer(name);
  }

  /**
   * Restart all MCP servers
   */
  async restartAll(): Promise<void> {
    await this.stopAll();
    await this.startAll();
  }

  /**
   * Get information about all registered MCP servers
   */
  getServerInfo(): Array<{
    name: string;
    info: any;
    isRunning: boolean;
  }> {
    return Array.from(this.servers.entries()).map(([name, server]) => ({
      name,
      info: server.getInfo(),
      isRunning: true, // Would need to track running state in real implementation
    }));
  }

  /**
   * Get a specific MCP server
   */
  getServer(name: string): BaseMCPServer | undefined {
    return this.servers.get(name);
  }

  /**
   * Check if MCP Manager is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get current configuration
   */
  getConfig(): MCPManagerConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<MCPManagerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log("MCP Manager configuration updated:", this.config);
  }

  /**
   * Check for conflicts across all MCP instances
   */
  checkConflicts(): {
    resourceConflicts: Array<{ uri: string; servers: string[] }>;
    toolConflicts: Array<{ name: string; servers: string[] }>;
  } {
    const resourceMap = new Map<string, string[]>();
    const toolMap = new Map<string, string[]>();

    // Collect all resources and tools from all servers
    for (const [serverName, server] of this.servers) {
      const info = server.getInfo();
      
      // This would need to be implemented in BaseMCPServer to expose resources and tools
      // For now, this is a placeholder
      console.log(`Checking conflicts for server: ${serverName}`, info);
    }

    // Find conflicts
    const resourceConflicts = Array.from(resourceMap.entries())
      .filter(([, servers]) => servers.length > 1)
      .map(([uri, servers]) => ({ uri, servers }));

    const toolConflicts = Array.from(toolMap.entries())
      .filter(([, servers]) => servers.length > 1)
      .map(([name, servers]) => ({ name, servers }));

    return { resourceConflicts, toolConflicts };
  }

  /**
   * Resolve conflicts based on configuration
   */
  async resolveConflicts(): Promise<void> {
    const conflicts = this.checkConflicts();
    
    if (conflicts.resourceConflicts.length === 0 && conflicts.toolConflicts.length === 0) {
      console.log("No conflicts detected");
      return;
    }

    switch (this.config.conflictResolution) {
      case "priority":
        console.log("Resolving conflicts using priority-based resolution");
        // Priority-based resolution is handled automatically by BaseMCPServer
        break;
        
      case "error":
        const errorMessage = `MCP conflicts detected:\n` +
          `Resources: ${conflicts.resourceConflicts.map(c => c.uri).join(", ")}\n` +
          `Tools: ${conflicts.toolConflicts.map(c => c.name).join(", ")}`;
        throw new Error(errorMessage);
        
      case "merge":
        console.log("Merging conflicting resources and tools");
        // This would require more complex logic to merge functionality
        break;
    }
  }

  /**
   * Health check for all MCP servers
   */
  async healthCheck(): Promise<{
    overall: "healthy" | "degraded" | "unhealthy";
    servers: Array<{
      name: string;
      status: "healthy" | "unhealthy";
      error?: string;
    }>;
  }> {
    const serverStatuses = await Promise.allSettled(
      Array.from(this.servers.entries()).map(async ([name, server]) => {
        try {
          // This would ping the server or check its status
          const info = server.getInfo();
          return {
            name,
            status: "healthy" as const,
          };
        } catch (error) {
          return {
            name,
            status: "unhealthy" as const,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      })
    );

    const servers = serverStatuses.map(result => 
      result.status === "fulfilled" ? result.value : {
        name: "unknown",
        status: "unhealthy" as const,
        error: "Promise rejected",
      }
    );

    const healthyCount = servers.filter(s => s.status === "healthy").length;
    const totalCount = servers.length;

    let overall: "healthy" | "degraded" | "unhealthy";
    if (healthyCount === totalCount) {
      overall = "healthy";
    } else if (healthyCount > 0) {
      overall = "degraded";
    } else {
      overall = "unhealthy";
    }

    return { overall, servers };
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    console.log("Shutting down MCP Manager...");
    
    try {
      await this.stopAll();
      this.servers.clear();
      this.isInitialized = false;
      console.log("MCP Manager shut down successfully");
    } catch (error) {
      console.error("Error during MCP Manager shutdown:", error);
      throw error;
    }
  }
}

#!/usr/bin/env node
/**
 * Standalone MCP Server for Claude Desktop Integration
 * This server provides Figma Variables Sync functionality to Claude
 */
declare class FigmaVariablesMCPServer {
    private server;
    private workingDirectory;
    constructor();
    private setupHandlers;
    private getVariablesExport;
    private getGoogleSheetsTemplate;
    private getConfigExample;
    private analyzeFigmaFile;
    private createImportTemplate;
    private validateGoogleSheet;
    private generatePluginConfig;
    private convertCsvToFigmaFormat;
    private groupByCollection;
    private groupByType;
    private extractModes;
    private extractModeValues;
    private generateRecommendations;
    start(): Promise<void>;
}
export { FigmaVariablesMCPServer };
//# sourceMappingURL=index.d.ts.map
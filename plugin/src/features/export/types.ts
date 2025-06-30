export interface ExportMessage {
    type: "export-full" | "export-ids" | "export-selected-nodes";
    collection?: string;
    nodeConfig?: NodeExportConfig;
  }

  export interface NodeExportConfig {
    rootPattern: string;
    sortGroups: SortGroup[];
  }

  export interface SortGroup {
    prefix: string;
    range?: {
      rows: [number, number];
      cols: [number, number];
    };
  }
  
  export interface ExportedData {
    type: "exported";
    data: any;
    fileName: string;
  }
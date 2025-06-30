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

  export interface PluginMessage {
    type: string;
    fileName?: string;
    message?: string;
    data?: any;
    collections?: string[];
    existingCollections?: string[];
    newCollections?: string[];
    collection?: string;
    link?: string;
    forceBindAll?: boolean;
    excludeSheets?: string[];
    nodeConfig?: NodeExportConfig;
  }

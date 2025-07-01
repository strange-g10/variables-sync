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

export interface SheetStylesConfig {
    row_height: number;
    column_a_width: number;
    column_b_width: number;
    mode_column_width: number;
    id_column_width: number;
    key_column_width: number;
    even_row_color: [number, number, number];
    odd_row_color: [number, number, number];
    ellipse: boolean;
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
    config?: {
      sheetsUrl: string;
      apiKey?: string;
      serviceAccount?: string;
    };
    sheetStylesConfig?: SheetStylesConfig;
  }

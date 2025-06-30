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
  }
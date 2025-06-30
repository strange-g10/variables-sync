export interface SheetRow {
    name: string;
    type: string;
    VariableID: string;
    [key: string]: string | boolean;
  }
  
  export interface SheetData {
    spreadsheetId: string;
    sheetNames: string[];
  }
  
  export interface Stats {
    processed: number;
    total: number;
    created: number;
    updated: number;
    aliases: number;
  }
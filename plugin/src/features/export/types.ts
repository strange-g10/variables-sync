export interface ExportMessage {
    type: "export-full" | "export-ids";
    collection?: string;
  }
  
  export interface ExportedData {
    type: "exported";
    data: any;
    fileName: string;
  }
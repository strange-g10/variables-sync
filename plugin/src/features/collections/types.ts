export interface CollectionsMessage {
    type: "get-collections";
  }
  
  export interface CollectionsResult {
    type: "collections";
    collections: string[];
  }
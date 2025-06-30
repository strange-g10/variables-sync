export interface AssignMessage {
    type: "assign";
    data: any[][];
    forceBindAll: boolean;
  }
  
  export interface Binding {
    variableId: string;
    property: string;
  }
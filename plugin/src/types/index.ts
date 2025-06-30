// src/types/index.ts
export interface RGBA {
    r: number;
    g: number;
    b: number;
    a: number;
  }
  
  export interface Variable {
    id: string;
    name: string;
    resolvedType: VariableResolvedDataType;
    valuesByMode: { [modeId: string]: VariableValue };
    setValueForMode(modeId: string, value: VariableValue): void;
  }
  
  export interface VariableCollection {
    id: string;
    name: string;
    modes: { modeId: string; name: string }[];
    variableIds: string[];
    addMode(name: string): string;
    renameMode(modeId: string, newName: string): void;
  }
  
  export interface VariableAlias {
    type: "VARIABLE_ALIAS";
    id: string;
  }
  
  export type VariableValue = string | number | boolean | RGBA | VariableAlias;
  export type VariableResolvedDataType = "COLOR" | "BOOLEAN" | "FLOAT" | "STRING";
// Basic Figma Plugin API types
declare global {
  const figma: PluginAPI;
  const __html__: string;
}

interface PluginAPI {
  readonly clientStorage: ClientStorageAPI;
  readonly variables: VariablesAPI;
  readonly ui: UIAPI;
  readonly currentPage: PageNode;
  readonly root: DocumentNode;
  showUI(html: string, options?: ShowUIOptions): void;
  notify(message: string, options?: NotificationOptions): NotificationHandler;
  loadFontAsync(fontName: FontName): Promise<void>;
  getNodeById(id: string): BaseNode | null;
}

interface ShowUIOptions {
  width?: number;
  height?: number;
  title?: string;
}

interface NotificationOptions {
  timeout?: number;
}

interface NotificationHandler {
  cancel(): void;
}

interface ClientStorageAPI {
  getAsync(key: string): Promise<any>;
  setAsync(key: string, value: any): Promise<void>;
}

interface VariablesAPI {
  getLocalVariables(): Variable[];
  getLocalVariableCollections(): VariableCollection[];
  getVariableById(id: string): Variable | null;
  getVariableCollectionById(id: string): VariableCollection | null;
  createVariable(name: string, collectionId: string, type: VariableResolvedDataType): Variable;
  createVariableCollection(name: string): VariableCollection;
}

interface UIAPI {
  postMessage(message: any): void;
  onmessage: ((message: any) => void) | undefined;
}

interface Variable {
  readonly id: string;
  readonly name: string;
  readonly key?: string;
  readonly variableCollectionId: string;
  readonly resolvedType: VariableResolvedDataType;
  readonly valuesByMode: { [modeId: string]: VariableValue };
  setValueForMode(modeId: string, value: VariableValue): void;
  remove(): void;
}

interface VariableCollection {
  readonly id: string;
  readonly name: string;
  readonly modes: Mode[];
}

interface Mode {
  readonly modeId: string;
  readonly name: string;
}

interface BaseNode {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly visible: boolean;
  setBoundVariable(field: string, variable: Variable | null): void;
}

interface SceneNode extends BaseNode {
  readonly children?: readonly SceneNode[];
}

interface TextNode extends SceneNode {
  readonly type: "TEXT";
  readonly characters: string;
  readonly fontName: FontName;
}

interface PageNode extends BaseNode {
  readonly type: "PAGE";
  readonly selection: readonly SceneNode[];
  readonly children: readonly SceneNode[];
}

interface DocumentNode extends BaseNode {
  readonly type: "DOCUMENT";
  readonly children: readonly PageNode[];
}

interface FontName {
  readonly family: string;
  readonly style: string;
}

interface RGBA {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a: number;
}

interface VariableAlias {
  readonly type: "VARIABLE_ALIAS";
  readonly id: string;
}

type VariableValue = boolean | string | number | RGBA | VariableAlias;

type VariableResolvedDataType = "BOOLEAN" | "FLOAT" | "STRING" | "COLOR";

export {};

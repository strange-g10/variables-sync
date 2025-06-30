export function getCollections(): string[] {
    return figma.variables
      .getLocalVariableCollections()
      .map(c => c.name)
      .sort();
  }
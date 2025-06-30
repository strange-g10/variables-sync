/**
 * Validation utilities for plugin data
 */

import { ValidationError } from "./errorHandler";

/**
 * Validate Google Sheets URL
 */
export function validateGoogleSheetsUrl(url: string): string {
  if (!url || typeof url !== "string") {
    throw new ValidationError("Google Sheets URL is required");
  }

  const match = url.match(/[-\w]{25,}/);
  if (!match) {
    throw new ValidationError("Invalid Google Sheets URL format");
  }

  return match[0]; // Return spreadsheet ID
}

/**
 * Validate variable name
 */
export function validateVariableName(name: string): void {
  if (!name || typeof name !== "string") {
    throw new ValidationError("Variable name is required");
  }

  if (name.trim().length === 0) {
    throw new ValidationError("Variable name cannot be empty");
  }

  // Check for invalid characters
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(name)) {
    throw new ValidationError("Variable name contains invalid characters");
  }
}

/**
 * Validate variable type
 */
export function validateVariableType(type: string): VariableResolvedDataType {
  const validTypes: VariableResolvedDataType[] = ["COLOR", "BOOLEAN", "FLOAT", "STRING"];
  
  if (!validTypes.includes(type as VariableResolvedDataType)) {
    throw new ValidationError(`Invalid variable type: ${type}. Must be one of: ${validTypes.join(", ")}`);
  }

  return type as VariableResolvedDataType;
}

/**
 * Validate color hex value
 */
export function validateColorHex(hex: string): void {
  if (!hex || typeof hex !== "string") {
    throw new ValidationError("Color hex value is required");
  }

  if (!hex.startsWith("#")) {
    throw new ValidationError("Color hex value must start with #");
  }

  const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/;
  if (!hexPattern.test(hex)) {
    throw new ValidationError("Invalid color hex format. Must be #RRGGBB or #RRGGBBAA");
  }
}

/**
 * Validate boolean value
 */
export function validateBoolean(value: any): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const lowerValue = value.toLowerCase().trim();
    if (lowerValue === "true" || lowerValue === "1" || lowerValue === "yes") {
      return true;
    }
    if (lowerValue === "false" || lowerValue === "0" || lowerValue === "no") {
      return false;
    }
  }

  throw new ValidationError(`Invalid boolean value: ${value}. Must be true/false, 1/0, or yes/no`);
}

/**
 * Validate float value
 */
export function validateFloat(value: any): number {
  if (typeof value === "number" && !isNaN(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }

  throw new ValidationError(`Invalid float value: ${value}. Must be a valid number`);
}

/**
 * Validate collection name
 */
export function validateCollectionName(name: string): void {
  if (!name || typeof name !== "string") {
    throw new ValidationError("Collection name is required");
  }

  if (name.trim().length === 0) {
    throw new ValidationError("Collection name cannot be empty");
  }

  if (name.length > 255) {
    throw new ValidationError("Collection name is too long (max 255 characters)");
  }
}

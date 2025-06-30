/**
 * Centralized error handling utilities
 */

import { logToUI, showNotification } from "./ui";

export interface ErrorContext {
  operation: string;
  details?: any;
  shouldNotify?: boolean;
}

/**
 * Custom error types for better error handling
 */
export class PluginError extends Error {
  public readonly context: ErrorContext;
  
  constructor(message: string, context: ErrorContext) {
    super(message);
    this.name = "PluginError";
    this.context = context;
  }
}

export class ValidationError extends PluginError {
  constructor(message: string, details?: any) {
    super(message, { operation: "validation", details });
    this.name = "ValidationError";
  }
}

export class APIError extends PluginError {
  constructor(message: string, details?: any) {
    super(message, { operation: "api", details, shouldNotify: true });
    this.name = "APIError";
  }
}

export class ImportError extends PluginError {
  constructor(message: string, details?: any) {
    super(message, { operation: "import", details, shouldNotify: true });
    this.name = "ImportError";
  }
}

export class ExportError extends PluginError {
  constructor(message: string, details?: any) {
    super(message, { operation: "export", details, shouldNotify: true });
    this.name = "ExportError";
  }
}

/**
 * Handle errors in a consistent way
 */
export function handleError(error: Error | PluginError, fallbackMessage?: string): void {
  const message = error.message || fallbackMessage || "An unknown error occurred";
  
  // Log the error
  logToUI(`Error: ${message}`);
  
  if (error instanceof PluginError) {
    // Log additional context
    logToUI(`Operation: ${error.context.operation}`);
    if (error.context.details) {
      logToUI(`Details: ${JSON.stringify(error.context.details)}`);
    }
    
    // Show notification if requested
    if (error.context.shouldNotify) {
      showNotification(message, { error: true });
    }
  }
  
  // Log to console for debugging
  console.error("[Plugin Error]", error);
}

/**
 * Wrap async operations with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: ErrorContext
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    const pluginError = error instanceof PluginError 
      ? error 
      : new PluginError(
          error instanceof Error ? error.message : String(error),
          context
        );
    
    handleError(pluginError);
    return null;
  }
}

/**
 * Retry an operation with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries - 1) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      logToUI(`Operation failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

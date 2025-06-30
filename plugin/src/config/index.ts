// Environment-based configuration
const getEnvVar = (key: string, defaultValue?: string): string => {
  // In Figma plugin context, we'll read from stored settings
  // For now, we'll use a fallback approach
  return defaultValue || '';
};

// This should be moved to environment variables or secure storage
const FALLBACK_API_KEY = "AIzaSyAUOdEsD93MkvtUl_UbwoKhECWEkWendoI";

export const config = {
    // TODO: Replace with secure environment variable access
    GOOGLE_SHEETS_API_KEY: getEnvVar('GOOGLE_SHEETS_API_KEY', FALLBACK_API_KEY),
    BATCH_SIZE: parseInt(getEnvVar('BATCH_SIZE', '50'), 10),
    COLOR_EPSILON: parseFloat(getEnvVar('COLOR_EPSILON', '0.002')),
    MAX_RETRIES: parseInt(getEnvVar('MAX_RETRIES', '3'), 10),
    API_CALL_DELAY: parseInt(getEnvVar('API_CALL_DELAY', '1000'), 10),
};

// Configuration validation
export const validateConfig = () => {
  const errors: string[] = [];
  
  if (!config.GOOGLE_SHEETS_API_KEY) {
    errors.push('GOOGLE_SHEETS_API_KEY is required');
  }
  
  if (config.BATCH_SIZE <= 0) {
    errors.push('BATCH_SIZE must be greater than 0');
  }
  
  if (config.MAX_RETRIES < 0) {
    errors.push('MAX_RETRIES must be non-negative');
  }
  
  return errors;
};

// Get configuration status for debugging
export const getConfigStatus = () => {
  return {
    hasApiKey: !!config.GOOGLE_SHEETS_API_KEY,
    batchSize: config.BATCH_SIZE,
    colorEpsilon: config.COLOR_EPSILON,
    maxRetries: config.MAX_RETRIES,
    apiCallDelay: config.API_CALL_DELAY,
    validationErrors: validateConfig(),
  };
};

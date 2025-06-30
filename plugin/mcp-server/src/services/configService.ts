import { z } from 'zod';
import { readFileSync } from 'fs';
import { join } from 'path';

// Configuration schema validation
const ConfigSchema = z.object({
  googleSheets: z.object({
    apiKey: z.string().min(1, 'Google Sheets API key is required'),
    credentials: z.string().optional(), // Path to service account credentials
  }),
  figma: z.object({
    token: z.string().optional(),
    fileId: z.string().optional(),
  }),
  server: z.object({
    port: z.number().default(3000),
    host: z.string().default('localhost'),
  }),
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    file: z.string().optional(),
  }),
  batch: z.object({
    size: z.number().default(50),
    maxRetries: z.number().default(3),
    apiCallDelay: z.number().default(1000),
  }),
  color: z.object({
    epsilon: z.number().default(0.002),
  }),
});

export type Config = z.infer<typeof ConfigSchema>;

export class ConfigService {
  private config: Config;
  private configPath: string;

  constructor(configPath?: string) {
    this.configPath = configPath || this.findConfigFile();
    this.config = this.loadConfig();
  }

  private findConfigFile(): string {
    // Try different config file locations
    const possiblePaths = [
      join(process.cwd(), '.env.json'),
      join(process.cwd(), 'config.json'),
      join(process.cwd(), '..', '..', 'config', 'config.json'),
      join(process.cwd(), '..', 'config', 'config.json'),
    ];

    for (const path of possiblePaths) {
      try {
        readFileSync(path);
        return path;
      } catch {
        // Continue to next path
      }
    }

    // Fallback to environment variables only
    return '';
  }

  private loadConfig(): Config {
    let fileConfig: any = {};

    // Load from config file if exists
    if (this.configPath) {
      try {
        const configData = readFileSync(this.configPath, 'utf-8');
        fileConfig = JSON.parse(configData);
      } catch (error) {
        console.warn(`Failed to load config file ${this.configPath}:`, error);
      }
    }

    // Merge with environment variables (env vars take precedence)
    const envConfig = {
      googleSheets: {
        apiKey: process.env.GOOGLE_SHEETS_API_KEY || fileConfig.google_sheets_api_key || '',
        credentials: process.env.GOOGLE_CREDENTIALS_PATH || fileConfig.service_account_file,
      },
      figma: {
        token: process.env.FIGMA_TOKEN || fileConfig.figma_token,
        fileId: process.env.FIGMA_FILE_ID || fileConfig.figma_file_id,
      },
      server: {
        port: parseInt(process.env.SERVER_PORT || '3000', 10),
        host: process.env.SERVER_HOST || 'localhost',
      },
      logging: {
        level: (process.env.LOG_LEVEL as any) || 'info',
        file: process.env.LOG_FILE || fileConfig.log_file,
      },
      batch: {
        size: parseInt(process.env.BATCH_SIZE || '50', 10),
        maxRetries: parseInt(process.env.MAX_RETRIES || '3', 10),
        apiCallDelay: parseInt(process.env.API_CALL_DELAY || '1000', 10),
      },
      color: {
        epsilon: parseFloat(process.env.COLOR_EPSILON || '0.002'),
      },
    };

    try {
      return ConfigSchema.parse(envConfig);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Configuration validation failed:');
        for (const issue of error.issues) {
          console.error(`  ${issue.path.join('.')}: ${issue.message}`);
        }
        throw new Error('Invalid configuration. Please check your environment variables or config file.');
      }
      throw error;
    }
  }

  getConfig(): Config {
    return this.config;
  }

  getGoogleSheetsApiKey(): string {
    return this.config.googleSheets.apiKey;
  }

  getGoogleCredentialsPath(): string | undefined {
    return this.config.googleSheets.credentials;
  }

  getFigmaToken(): string | undefined {
    return this.config.figma.token;
  }

  getBatchConfig() {
    return this.config.batch;
  }

  getColorConfig() {
    return this.config.color;
  }

  getLoggingConfig() {
    return this.config.logging;
  }

  // Reload config (useful for hot-reloading)
  reloadConfig(): void {
    this.config = this.loadConfig();
  }

  // Validate specific config sections
  validateGoogleSheetsConfig(): boolean {
    return !!this.config.googleSheets.apiKey;
  }

  validateFigmaConfig(): boolean {
    return !!this.config.figma.token;
  }

  // Get environment info for debugging
  getEnvironmentInfo() {
    return {
      configPath: this.configPath,
      hasApiKey: !!this.config.googleSheets.apiKey,
      hasCredentials: !!this.config.googleSheets.credentials,
      hasFigmaToken: !!this.config.figma.token,
      batchSize: this.config.batch.size,
      logLevel: this.config.logging.level,
    };
  }
}

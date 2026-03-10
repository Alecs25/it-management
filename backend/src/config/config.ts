import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

const ConfigSchema = z.object({
  app: z.object({
    name: z.string().default('IT Credential Management App'),
    version: z.string().default('0.1.0'),
    environment: z.enum(['development', 'staging', 'production']).default('development'),
    timezone: z.string().default('UTC'),
  }),
  server: z.object({
    port: z.number().default(3000),
    host: z.string().default('0.0.0.0'),
    nodeEnv: z.enum(['development', 'staging', 'production']).default('development'),
  }),
  database: z.object({
    type: z.enum(['mysql', 'postgres']).default('mysql'),
    host: z.string(),
    port: z.number().default(3306),
    username: z.string(),
    password: z.string().default(''),
    database: z.string(),
    synchronize: z.boolean().default(false),
    logging: z.boolean().default(false),
  }),
  jwt: z.object({
    secret: z.string().min(32, 'JWT secret must be at least 32 characters'),
    expiresIn: z.string().default('1h'),
    refreshExpiresIn: z.string().default('7d'),
  }),
  mfa: z.object({
    window: z.number().default(1),
    issuer: z.string().default('ITCredentialManagement'),
    appName: z.string().default('IT-Management'),
  }),
  security: z.object({
    passwordHashRounds: z.number().default(12),
    pinHashRounds: z.number().default(12),
    mfaCodeLength: z.number().default(6),
    mfaWindowMs: z.number().default(30000),
    revealTtlSeconds: z.number().default(30),
    rateLimitWindowMs: z.number().default(900000),
    rateLimitMaxRequests: z.number().default(100),
  }),
  crypto: z.object({
    algorithm: z.string().default('aes-256-gcm'),
    kmsStubKey: z.string().default(''),
  }),
  audit: z.object({
    enableAppendOnly: z.boolean().default(true),
    enableHmacSigning: z.boolean().default(true),
  }),
  cors: z.object({
    origin: z.string().default('http://localhost:4200'),
    credentials: z.boolean().default(true),
  }),
  log: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    format: z.enum(['json', 'text']).default('json'),
  }),
});

export type Config = z.infer<typeof ConfigSchema>;

class ConfigLoader {
  private config: Config;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): Config {
    // Load from default.cfg
    const defaultConfigPath = path.join(process.cwd(), 'default.cfg');
    const envConfigPath = path.join(process.cwd(), `${process.env.NODE_ENV || 'development'}.cfg`);

    let configData = this.parseIniFile(defaultConfigPath);

    // Override with environment-specific .cfg if exists
    if (fs.existsSync(envConfigPath)) {
      const envConfigData = this.parseIniFile(envConfigPath);
      configData = { ...configData, ...envConfigData };
    }

    // Override with environment variables
    const envVars = this.loadEnvVars();
    configData = { ...configData, ...envVars };

    // Validate and parse with Zod
    const validated = ConfigSchema.parse(configData);
    return validated;
  }

  private parseIniFile(filePath: string): Record<string, any> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const result: Record<string, any> = {};
      let currentSection = '';

      content.split('\n').forEach((line) => {
        line = line.trim();

        // Skip comments and empty lines
        if (line.startsWith('#') || line.startsWith(';') || !line) return;

        // Section header
        if (line.startsWith('[') && line.endsWith(']')) {
          currentSection = line.slice(1, -1);
          result[currentSection] = {};
          return;
        }

        // Key-value pair
        if (currentSection && line.includes('=')) {
          const [key, value] = line.split('=', 2);
          const cleanKey = key.trim();
          const cleanValue = value.trim();

          if (!result[currentSection]) {
            result[currentSection] = {};
          }

          // Type coercion
          if (cleanValue === 'true') result[currentSection][cleanKey] = true;
          else if (cleanValue === 'false') result[currentSection][cleanKey] = false;
          else if (!isNaN(Number(cleanValue)) && cleanValue !== '') result[currentSection][cleanKey] = Number(cleanValue);
          else result[currentSection][cleanKey] = cleanValue;
        }
      });

      return result;
    } catch (err) {
      console.warn(`Warning: Could not read config file ${filePath}:`, (err as any).message);
      return {};
    }
  }

  private loadEnvVars(): Record<string, any> {
    return {
      database: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
      },
      jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN,
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
      },
      server: {
        port: process.env.SERVER_PORT ? Number(process.env.SERVER_PORT) : undefined,
        host: process.env.SERVER_HOST,
      },
      log: {
        level: process.env.LOG_LEVEL,
      },
      cors: {
        origin: process.env.CORS_ORIGIN,
      },
    };
  }

  public getConfig(): Config {
    return this.config;
  }

  public get<K extends keyof Config>(key: K): Config[K] {
    return this.config[key];
  }
}

export const configLoader = new ConfigLoader();
export const appConfig = configLoader.getConfig();

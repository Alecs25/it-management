import { z } from "zod";

const configSchema = z.object({
  jwt: z.object({
    secret: z.string().min(1),
    expiresIn: z.string().default("1h"),
    refreshExpiresIn: z.string().default("7d"),
  }),
  mfa: z.object({
    window: z.number().default(1),
    issuer: z.string().default("ITCredentialManagement"),
    appName: z.string().default("IT-Management"),
  }),
  security: z.object({
    passwordHashRounds: z.number().default(12),
    mfaCodeLength: z.number().default(6),
    pinHashRounds: z.number().default(12),
    revelTtlSeconds: z.number().default(30),
    rateLimitWindowMs: z.number().default(900000),
    rateLimitMaxRequests: z.number().default(100),
  }),
  crypto: z.object({
    algorithm: z.string().default("aes-256-gcm"),
    kmsStubKey: z.string().min(1),
  }),
  audit: z.object({
    enableAppendOnly: z.boolean().default(true),
    enableHmacSigning: z.boolean().default(true),
  }),
  app: z.object({
    name: z.string().default("IT Credential Management App"),
    nodeEnv: z.string().default("development"),
  }),
});

export type AppConfig = z.infer<typeof configSchema>;

function loadConfig(): AppConfig {
  return configSchema.parse({
    jwt: {
      secret: process.env.JWT_SECRET ?? "CHANGE_ME_IN_PRODUCTION",
      expiresIn: process.env.JWT_EXPIRES_IN ?? "1h",
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
    },
    mfa: {
      window: parseInt(process.env.MFA_WINDOW ?? "1", 10),
      issuer: process.env.MFA_ISSUER ?? "ITCredentialManagement",
      appName: process.env.MFA_APP_NAME ?? "IT-Management",
    },
    security: {
      passwordHashRounds: parseInt(process.env.PASSWORD_HASH_ROUNDS ?? "12", 10),
      mfaCodeLength: parseInt(process.env.MFA_CODE_LENGTH ?? "6", 10),
      pinHashRounds: parseInt(process.env.PIN_HASH_ROUNDS ?? "12", 10),
      revelTtlSeconds: parseInt(process.env.REVEL_TTL_SECONDS ?? "30", 10),
      rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "900000", 10),
      rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? "100", 10),
    },
    crypto: {
      algorithm: process.env.CRYPTO_ALGORITHM ?? "aes-256-gcm",
      kmsStubKey: process.env.KMS_STUB_KEY ?? "STUB_KEY_DEVELOPMENT_ONLY",
    },
    audit: {
      enableAppendOnly: process.env.AUDIT_ENABLE_APPEND_ONLY === "true",
      enableHmacSigning: process.env.AUDIT_ENABLE_HMAC_SIGNING === "true",
    },
    app: {
      name: process.env.APP_NAME ?? "IT Credential Management App",
      nodeEnv: process.env.NODE_ENV ?? "development",
    },
  });
}

export const appConfig: AppConfig = loadConfig();

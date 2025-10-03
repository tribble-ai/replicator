/**
 * Configuration management for exceedra integration
 */

import { config as loadEnv } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

// Load environment variables
loadEnv();

export interface exceedraConfig {
  // exceedra API settings
  exceedra: {
    baseUrl: string;
    clientId: string;
    clientSecret: string;
    tokenEndpoint: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  };

  // Tribble settings
  tribble: {
    apiKey: string;
    brainUrl: string;
    ingestUrl: string;
  };

  // Sync settings
  sync: {
    schedule: string;
    sources: string[];
    batchSize: number;
    maxRetries: number;
    checkpointFile: string;
    enableCheckpointPersistence: boolean;
  };

  // Optional rate limiting
  rateLimit?: {
    requestsPerSecond: number;
  };

  // Advanced settings
  advanced: {
    debugLogging: boolean;
  };
}

/**
 * Validate required environment variables
 */
function validateConfig(): void {
  const required = [
    'exceedra_BASE_URL',
    'exceedra_CLIENT_ID',
    'exceedra_CLIENT_SECRET',
    'exceedra_TOKEN_ENDPOINT',
    'TRIBBLE_API_KEY',
    'TRIBBLE_BRAIN_URL',
    'TRIBBLE_INGEST_URL',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please copy .env.example to .env and fill in the values.'
    );
  }
}

/**
 * Parse sync sources from environment variable
 */
function parseSyncSources(sources: string = 'documents'): string[] {
  const parsed = sources.split(',').map((s) => s.trim());

  if (parsed.includes('all')) {
    return ['documents', 'products', 'retailers'];
  }

  return parsed;
}

/**
 * Load and validate configuration from environment variables
 */
export function loadConfig(): exceedraConfig {
  validateConfig();

  return {
    exceedra: {
      baseUrl: process.env.exceedra_BASE_URL!.replace(/\/$/, ''),
      clientId: process.env.exceedra_CLIENT_ID!,
      clientSecret: process.env.exceedra_CLIENT_SECRET!,
      tokenEndpoint: process.env.exceedra_TOKEN_ENDPOINT!,
      accessToken: process.env.exceedra_ACCESS_TOKEN,
      refreshToken: process.env.exceedra_REFRESH_TOKEN,
      expiresAt: process.env.exceedra_TOKEN_EXPIRES_AT
        ? parseInt(process.env.exceedra_TOKEN_EXPIRES_AT, 10)
        : undefined,
    },

    tribble: {
      apiKey: process.env.TRIBBLE_API_KEY!,
      brainUrl: process.env.TRIBBLE_BRAIN_URL!.replace(/\/$/, ''),
      ingestUrl: process.env.TRIBBLE_INGEST_URL!.replace(/\/$/, ''),
    },

    sync: {
      schedule: process.env.SYNC_SCHEDULE || '0 */6 * * *',
      sources: parseSyncSources(process.env.SYNC_SOURCES),
      batchSize: parseInt(process.env.SYNC_BATCH_SIZE || '100', 10),
      maxRetries: parseInt(process.env.SYNC_MAX_RETRIES || '3', 10),
      checkpointFile: process.env.SYNC_CHECKPOINT_FILE || '.exceedra-checkpoint.json',
      enableCheckpointPersistence:
        process.env.ENABLE_CHECKPOINT_PERSISTENCE !== 'false',
    },

    rateLimit: process.env.RATE_LIMIT_REQUESTS_PER_SECOND
      ? {
          requestsPerSecond: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_SECOND, 10),
        }
      : undefined,

    advanced: {
      debugLogging: process.env.ENABLE_DEBUG_LOGGING === 'true',
    },
  };
}

/**
 * Get singleton config instance
 */
let configInstance: exceedraConfig | null = null;

export function getConfig(): exceedraConfig {
  if (!configInstance) {
    configInstance = loadConfig();
  }
  return configInstance;
}

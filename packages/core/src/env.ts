export interface EnvConfig {
  chatBaseUrl: string;
  baseUrl: string; // documents/api base
}

export type EnvName = 'dev' | 'staging' | 'prod';

const DEFAULTS: Record<EnvName, EnvConfig> = {
  dev: { chatBaseUrl: 'https://tribble-chat.dev.tribble.ai/api/external', baseUrl: 'https://dev.tribble.ai' },
  staging: { chatBaseUrl: 'https://tribble-chat.staging.tribble.ai/api/external', baseUrl: 'https://staging.tribble.ai' },
  prod: { chatBaseUrl: 'https://tribble-chat.tribble.ai/api/external', baseUrl: 'https://my.tribble.ai' },
};

export function resolveEnv(env: EnvName, overrides?: Partial<EnvConfig>): EnvConfig {
  return { ...DEFAULTS[env], ...(overrides || {}) };
}


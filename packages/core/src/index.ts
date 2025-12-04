export interface TribbleConfig {
  agent: { baseUrl: string; token: string; email: string; defaultHeaders?: Record<string, string> };
  ingest?: { baseUrl: string; tokenProvider: () => Promise<string>; defaultHeaders?: Record<string, string> };
  workflows?: { endpoint: string; signingSecret: string; defaultHeaders?: Record<string, string> };
  telemetry?: { serviceName?: string; propagateTraceHeader?: string };
}

export type HeadersInitRecord = Record<string, string>;

export { HttpClient, type HttpClientOptions } from './http';
export { createRequestId, sleep, nowSeconds, toBase64, subtleCrypto } from './util';
export { resolveEnv, type EnvConfig } from './env';
export {
  TribbleError,
  AuthError,
  RateLimitError,
  ValidationError,
  ServerError,
  NetworkError,
  TimeoutError,
} from './errors';

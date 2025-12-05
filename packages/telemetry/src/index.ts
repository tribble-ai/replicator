import { createRequestId } from '@tribble/sdk-core';

// ==================== Types ====================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface SpanContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
}

export interface Span {
  name: string;
  context: SpanContext;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'ok' | 'error' | 'unset';
  attributes: Record<string, any>;
  events: SpanEvent[];
}

export interface SpanEvent {
  name: string;
  timestamp: number;
  attributes?: Record<string, any>;
}

export interface Metric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram';
  value: number;
  labels: Record<string, string>;
  timestamp: number;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  traceId?: string;
  spanId?: string;
  attributes?: Record<string, any>;
}

// ==================== Exporters ====================

export interface SpanExporter {
  export(spans: Span[]): Promise<void>;
}

export interface MetricExporter {
  export(metrics: Metric[]): Promise<void>;
}

export interface LogExporter {
  export(logs: LogEntry[]): Promise<void>;
}

/**
 * Console exporter for development.
 */
export class ConsoleExporter implements SpanExporter, MetricExporter, LogExporter {
  async export(items: Span[] | Metric[] | LogEntry[]): Promise<void> {
    for (const item of items) {
      console.log(JSON.stringify(item, null, 2));
    }
  }
}

/**
 * OTLP HTTP exporter for OpenTelemetry collectors (traces).
 */
export class OTLPExporter implements SpanExporter {
  private readonly endpoint: string;
  private readonly headers: Record<string, string>;

  constructor(opts: { endpoint: string; headers?: Record<string, string> }) {
    this.endpoint = opts.endpoint;
    this.headers = opts.headers || {};
  }

  async export(spans: Span[]): Promise<void> {
    const payload = {
      resourceSpans: [{
        resource: { attributes: [] },
        scopeSpans: [{
          scope: { name: '@tribble/sdk' },
          spans: spans.map(s => this.toOTLP(s)),
        }],
      }],
    };

    await fetch(`${this.endpoint}/v1/traces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.headers,
      },
      body: JSON.stringify(payload),
    });
  }

  private toOTLP(span: Span): any {
    return {
      traceId: span.context.traceId,
      spanId: span.context.spanId,
      parentSpanId: span.context.parentSpanId,
      name: span.name,
      startTimeUnixNano: span.startTime * 1_000_000,
      endTimeUnixNano: (span.endTime || Date.now()) * 1_000_000,
      status: { code: span.status === 'error' ? 2 : span.status === 'ok' ? 1 : 0 },
      attributes: Object.entries(span.attributes).map(([key, value]) => ({
        key,
        value: { stringValue: String(value) },
      })),
      events: span.events.map(e => ({
        name: e.name,
        timeUnixNano: e.timestamp * 1_000_000,
        attributes: Object.entries(e.attributes || {}).map(([key, value]) => ({
          key,
          value: { stringValue: String(value) },
        })),
      })),
    };
  }
}

/**
 * Batching exporter wrapper for efficient export.
 */
export class BatchExporter<T> {
  private buffer: T[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly exporter: { export: (items: T[]) => Promise<void> };
  private readonly batchSize: number;
  private readonly flushInterval: number;

  constructor(
    exporter: { export: (items: T[]) => Promise<void> },
    opts: { batchSize?: number; flushIntervalMs?: number } = {}
  ) {
    this.exporter = exporter;
    this.batchSize = opts.batchSize || 100;
    this.flushInterval = opts.flushIntervalMs || 5000;
  }

  add(item: T): void {
    this.buffer.push(item);

    if (this.buffer.length >= this.batchSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.flushInterval);
    }
  }

  async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.buffer.length === 0) return;

    const items = this.buffer;
    this.buffer = [];

    try {
      await this.exporter.export(items);
    } catch (e) {
      console.error('Failed to export telemetry:', e);
      // Re-add failed items to buffer (with limit)
      if (this.buffer.length < this.batchSize * 2) {
        this.buffer.unshift(...items);
      }
    }
  }
}

// ==================== Tracer ====================

export interface TracerOptions {
  /** Service name for identification */
  serviceName: string;
  /** Span exporter */
  exporter?: SpanExporter;
  /** Sample rate (0-1) */
  sampleRate?: number;
  /** Fields to redact from attributes */
  redactFields?: string[];
}

/**
 * Distributed tracing implementation.
 */
export class Tracer {
  private readonly serviceName: string;
  private readonly exporter: BatchExporter<Span>;
  private readonly sampleRate: number;
  private readonly redactFields: Set<string>;
  private currentSpan: Span | null = null;

  constructor(opts: TracerOptions) {
    this.serviceName = opts.serviceName;
    this.sampleRate = opts.sampleRate ?? 1.0;
    this.redactFields = new Set(opts.redactFields || ['token', 'password', 'secret', 'key', 'authorization']);

    const exporter = opts.exporter || new ConsoleExporter();
    this.exporter = new BatchExporter(exporter);
  }

  /**
   * Start a new span.
   */
  startSpan(name: string, attributes: Record<string, any> = {}): SpanHandle {
    // Sampling
    if (Math.random() > this.sampleRate) {
      return new NoopSpanHandle();
    }

    const span: Span = {
      name,
      context: {
        traceId: this.currentSpan?.context.traceId || createRequestId(),
        spanId: createRequestId().slice(0, 16),
        parentSpanId: this.currentSpan?.context.spanId,
      },
      startTime: Date.now(),
      status: 'unset',
      attributes: this.redact({
        'service.name': this.serviceName,
        ...attributes,
      }),
      events: [],
    };

    const previousSpan = this.currentSpan;
    this.currentSpan = span;

    return new ActiveSpanHandle(span, () => {
      span.endTime = Date.now();
      span.duration = span.endTime - span.startTime;
      this.currentSpan = previousSpan;
      this.exporter.add(span);
    });
  }

  /**
   * Get current span context for propagation.
   */
  getCurrentContext(): SpanContext | null {
    return this.currentSpan?.context || null;
  }

  /**
   * Create a context from incoming headers (for distributed tracing).
   */
  extractContext(headers: Record<string, string>): SpanContext | null {
    // Support W3C Trace Context format
    const traceparent = headers['traceparent'] || headers['Traceparent'];
    if (traceparent) {
      const parts = traceparent.split('-');
      if (parts.length >= 4) {
        return {
          traceId: parts[1],
          spanId: parts[2],
        };
      }
    }

    // Support Tribble custom header
    const tribbleHeader = headers['x-tribble-trace'] || headers['X-Tribble-Trace'];
    if (tribbleHeader) {
      const [traceId, spanId] = tribbleHeader.split(':');
      return { traceId, spanId };
    }

    return null;
  }

  /**
   * Inject context into outgoing headers.
   */
  injectContext(headers: Record<string, string>): void {
    const ctx = this.getCurrentContext();
    if (ctx) {
      // W3C Trace Context
      headers['traceparent'] = `00-${ctx.traceId}-${ctx.spanId}-01`;
      // Tribble custom header
      headers['x-tribble-trace'] = `${ctx.traceId}:${ctx.spanId}`;
    }
  }

  /**
   * Run a function within a span.
   */
  async trace<T>(
    name: string,
    fn: (span: SpanHandle) => Promise<T>,
    attributes: Record<string, any> = {}
  ): Promise<T> {
    const span = this.startSpan(name, attributes);
    try {
      const result = await fn(span);
      span.setStatus('ok');
      return result;
    } catch (e) {
      span.setStatus('error');
      span.recordException(e);
      throw e;
    } finally {
      span.end();
    }
  }

  /**
   * Flush all pending spans.
   */
  async flush(): Promise<void> {
    await this.exporter.flush();
  }

  private redact(attributes: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(attributes)) {
      const lowerKey = key.toLowerCase();
      if (this.redactFields.has(lowerKey) || Array.from(this.redactFields).some(f => lowerKey.includes(f))) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = value;
      }
    }
    return result;
  }
}

export interface SpanHandle {
  setAttribute(key: string, value: any): void;
  addEvent(name: string, attributes?: Record<string, any>): void;
  setStatus(status: 'ok' | 'error'): void;
  recordException(error: unknown): void;
  end(): void;
}

class ActiveSpanHandle implements SpanHandle {
  constructor(private span: Span, private onEnd: () => void) {}

  setAttribute(key: string, value: any): void {
    this.span.attributes[key] = value;
  }

  addEvent(name: string, attributes?: Record<string, any>): void {
    this.span.events.push({ name, timestamp: Date.now(), attributes });
  }

  setStatus(status: 'ok' | 'error'): void {
    this.span.status = status;
  }

  recordException(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    this.addEvent('exception', { message, stack });
    this.span.attributes['error.message'] = message;
    if (stack) this.span.attributes['error.stack'] = stack;
  }

  end(): void {
    this.onEnd();
  }
}

class NoopSpanHandle implements SpanHandle {
  setAttribute(): void {}
  addEvent(): void {}
  setStatus(): void {}
  recordException(): void {}
  end(): void {}
}

// ==================== Metrics ====================

export interface MetricsOptions {
  /** Service name for identification */
  serviceName: string;
  /** Metric exporter */
  exporter?: MetricExporter;
  /** Default labels for all metrics */
  defaultLabels?: Record<string, string>;
}

/**
 * Metrics collection and reporting.
 */
export class MetricsCollector {
  private readonly serviceName: string;
  private readonly exporter: BatchExporter<Metric>;
  private readonly defaultLabels: Record<string, string>;
  private counters = new Map<string, number>();
  private gauges = new Map<string, number>();
  private histogramData = new Map<string, number[]>();

  constructor(opts: MetricsOptions) {
    this.serviceName = opts.serviceName;
    this.defaultLabels = opts.defaultLabels || {};

    const exporter = opts.exporter || new ConsoleExporter();
    this.exporter = new BatchExporter(exporter);
  }

  /**
   * Increment a counter.
   */
  increment(name: string, value = 1, labels: Record<string, string> = {}): void {
    const key = this.metricKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);

    this.exporter.add({
      name,
      type: 'counter',
      value: current + value,
      labels: { ...this.defaultLabels, ...labels },
      timestamp: Date.now(),
    });
  }

  /**
   * Set a gauge value.
   */
  gauge(name: string, value: number, labels: Record<string, string> = {}): void {
    const key = this.metricKey(name, labels);
    this.gauges.set(key, value);

    this.exporter.add({
      name,
      type: 'gauge',
      value,
      labels: { ...this.defaultLabels, ...labels },
      timestamp: Date.now(),
    });
  }

  /**
   * Record a histogram value.
   */
  histogram(name: string, value: number, labels: Record<string, string> = {}): void {
    const key = this.metricKey(name, labels);
    const data = this.histogramData.get(key) || [];
    data.push(value);
    this.histogramData.set(key, data);

    this.exporter.add({
      name,
      type: 'histogram',
      value,
      labels: { ...this.defaultLabels, ...labels },
      timestamp: Date.now(),
    });
  }

  /**
   * Time a function and record as histogram.
   */
  async time<T>(
    name: string,
    fn: () => Promise<T>,
    labels: Record<string, string> = {}
  ): Promise<T> {
    const start = Date.now();
    try {
      return await fn();
    } finally {
      this.histogram(name, Date.now() - start, labels);
    }
  }

  /**
   * Get current counter value.
   */
  getCounter(name: string, labels: Record<string, string> = {}): number {
    return this.counters.get(this.metricKey(name, labels)) || 0;
  }

  /**
   * Get current gauge value.
   */
  getGauge(name: string, labels: Record<string, string> = {}): number {
    return this.gauges.get(this.metricKey(name, labels)) || 0;
  }

  /**
   * Get histogram statistics.
   */
  getHistogramStats(name: string, labels: Record<string, string> = {}): {
    count: number;
    sum: number;
    avg: number;
    min: number;
    max: number;
    p50: number;
    p90: number;
    p99: number;
  } | null {
    const data = this.histogramData.get(this.metricKey(name, labels));
    if (!data || data.length === 0) return null;

    const sorted = [...data].sort((a, b) => a - b);
    const sum = data.reduce((a, b) => a + b, 0);

    return {
      count: data.length,
      sum,
      avg: sum / data.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p90: sorted[Math.floor(sorted.length * 0.9)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  /**
   * Flush all pending metrics.
   */
  async flush(): Promise<void> {
    await this.exporter.flush();
  }

  private metricKey(name: string, labels: Record<string, string>): string {
    const labelStr = Object.entries(labels).sort().map(([k, v]) => `${k}=${v}`).join(',');
    return `${name}{${labelStr}}`;
  }
}

// ==================== Logger ====================

export interface LoggerOptions {
  /** Minimum log level */
  level?: LogLevel;
  /** Log exporter */
  exporter?: LogExporter;
  /** Tracer for correlation */
  tracer?: Tracer;
  /** Fields to redact */
  redactFields?: string[];
  /** Service name */
  serviceName?: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Structured logger with tracing integration.
 */
export class Logger {
  private readonly level: number;
  private readonly exporter: BatchExporter<LogEntry>;
  private readonly tracer?: Tracer;
  private readonly redactFields: Set<string>;
  private readonly serviceName?: string;

  constructor(opts: LoggerOptions = {}) {
    this.level = LOG_LEVELS[opts.level || 'info'];
    this.tracer = opts.tracer;
    this.serviceName = opts.serviceName;
    this.redactFields = new Set(opts.redactFields || ['token', 'password', 'secret', 'key', 'authorization']);

    const exporter = opts.exporter || new ConsoleExporter();
    this.exporter = new BatchExporter(exporter);
  }

  debug(message: string, attributes?: Record<string, any>): void {
    this.log('debug', message, attributes);
  }

  info(message: string, attributes?: Record<string, any>): void {
    this.log('info', message, attributes);
  }

  warn(message: string, attributes?: Record<string, any>): void {
    this.log('warn', message, attributes);
  }

  error(message: string, attributes?: Record<string, any>): void {
    this.log('error', message, attributes);
  }

  private log(level: LogLevel, message: string, attributes?: Record<string, any>): void {
    if (LOG_LEVELS[level] < this.level) return;

    const ctx = this.tracer?.getCurrentContext();

    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      traceId: ctx?.traceId,
      spanId: ctx?.spanId,
      attributes: this.redact({
        'service.name': this.serviceName,
        ...attributes,
      }),
    };

    this.exporter.add(entry);

    // Also log to console in development
    const consoleMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    consoleMethod(`[${level.toUpperCase()}] ${message}`, attributes || '');
  }

  private redact(attributes?: Record<string, any>): Record<string, any> | undefined {
    if (!attributes) return undefined;

    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(attributes)) {
      const lowerKey = key.toLowerCase();
      if (this.redactFields.has(lowerKey) || Array.from(this.redactFields).some(f => lowerKey.includes(f))) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  async flush(): Promise<void> {
    await this.exporter.flush();
  }
}

// ==================== Usage Tracking ====================

export interface UsageRecord {
  requestId: string;
  operation: string;
  tokensInput?: number;
  tokensOutput?: number;
  latencyMs: number;
  success: boolean;
  error?: string;
  timestamp: number;
}

/**
 * Track API usage for cost estimation and monitoring.
 */
export class UsageTracker {
  private records: UsageRecord[] = [];
  private readonly maxRecords: number;

  constructor(opts: { maxRecords?: number } = {}) {
    this.maxRecords = opts.maxRecords || 10000;
  }

  record(usage: Omit<UsageRecord, 'timestamp'>): void {
    this.records.push({
      ...usage,
      timestamp: Date.now(),
    });

    // Trim old records
    if (this.records.length > this.maxRecords) {
      this.records = this.records.slice(-this.maxRecords);
    }
  }

  /**
   * Get usage summary for a time period.
   */
  getSummary(since?: number): {
    requests: number;
    tokensInput: number;
    tokensOutput: number;
    totalTokens: number;
    avgLatencyMs: number;
    errorRate: number;
    estimatedCost: number;
  } {
    const cutoff = since || 0;
    const filtered = this.records.filter(r => r.timestamp >= cutoff);

    if (filtered.length === 0) {
      return {
        requests: 0,
        tokensInput: 0,
        tokensOutput: 0,
        totalTokens: 0,
        avgLatencyMs: 0,
        errorRate: 0,
        estimatedCost: 0,
      };
    }

    const tokensInput = filtered.reduce((sum, r) => sum + (r.tokensInput || 0), 0);
    const tokensOutput = filtered.reduce((sum, r) => sum + (r.tokensOutput || 0), 0);
    const totalLatency = filtered.reduce((sum, r) => sum + r.latencyMs, 0);
    const errors = filtered.filter(r => !r.success).length;

    // Rough cost estimate (adjust based on actual pricing)
    const inputCost = (tokensInput / 1000) * 0.001;  // $0.001 per 1K input tokens
    const outputCost = (tokensOutput / 1000) * 0.002; // $0.002 per 1K output tokens

    return {
      requests: filtered.length,
      tokensInput,
      tokensOutput,
      totalTokens: tokensInput + tokensOutput,
      avgLatencyMs: totalLatency / filtered.length,
      errorRate: errors / filtered.length,
      estimatedCost: inputCost + outputCost,
    };
  }

  /**
   * Get usage summary for the current month.
   */
  thisMonth(): ReturnType<typeof this.getSummary> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return this.getSummary(startOfMonth);
  }

  /**
   * Get usage summary for today.
   */
  today(): ReturnType<typeof this.getSummary> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return this.getSummary(startOfDay);
  }

  /**
   * Get all records.
   */
  getRecords(since?: number): UsageRecord[] {
    const cutoff = since || 0;
    return this.records.filter(r => r.timestamp >= cutoff);
  }

  /**
   * Clear all records.
   */
  clear(): void {
    this.records = [];
  }
}

// ==================== Factory Functions ====================

export interface TelemetryOptions {
  serviceName: string;
  tracing?: {
    exporter?: SpanExporter;
    sampleRate?: number;
  };
  metrics?: {
    exporter?: MetricExporter;
    defaultLabels?: Record<string, string>;
  };
  logging?: {
    level?: LogLevel;
    exporter?: LogExporter;
  };
  redactFields?: string[];
}

export interface Telemetry {
  tracer: Tracer;
  metrics: MetricsCollector;
  logger: Logger;
  usage: UsageTracker;
  flush(): Promise<void>;
}

/**
 * Create a complete telemetry setup.
 */
export function createTelemetry(opts: TelemetryOptions): Telemetry {
  const tracer = new Tracer({
    serviceName: opts.serviceName,
    exporter: opts.tracing?.exporter,
    sampleRate: opts.tracing?.sampleRate,
    redactFields: opts.redactFields,
  });

  const metrics = new MetricsCollector({
    serviceName: opts.serviceName,
    exporter: opts.metrics?.exporter,
    defaultLabels: opts.metrics?.defaultLabels,
  });

  const logger = new Logger({
    level: opts.logging?.level,
    exporter: opts.logging?.exporter,
    tracer,
    redactFields: opts.redactFields,
    serviceName: opts.serviceName,
  });

  const usage = new UsageTracker();

  return {
    tracer,
    metrics,
    logger,
    usage,
    flush: async () => {
      await Promise.all([
        tracer.flush(),
        metrics.flush(),
        logger.flush(),
      ]);
    },
  };
}

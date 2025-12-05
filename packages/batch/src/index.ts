import { sleep, createRequestId } from '@tribble/sdk-core';

// ==================== Types ====================

export interface BatchItem<TInput, TOutput> {
  id: string;
  input: TInput;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: TOutput;
  error?: Error;
  startedAt?: number;
  completedAt?: number;
  attempts: number;
}

export interface BatchOptions {
  /** Maximum concurrent operations (default: 5) */
  concurrency?: number;
  /** Maximum retries per item (default: 3) */
  maxRetries?: number;
  /** Base delay between retries in ms (default: 1000) */
  retryDelay?: number;
  /** Progress callback */
  onProgress?: (completed: number, total: number, item: BatchItem<any, any>) => void;
  /** Error callback (return true to continue, false to abort) */
  onError?: (error: Error, item: BatchItem<any, any>) => boolean;
  /** Abort signal */
  signal?: AbortSignal;
}

export interface BatchResult<TOutput> {
  /** Successfully completed results */
  results: TOutput[];
  /** Failed items */
  failures: Array<{ id: string; error: Error; input: any }>;
  /** Total execution time in ms */
  duration: number;
  /** Statistics */
  stats: {
    total: number;
    completed: number;
    failed: number;
    retries: number;
  };
}

// ==================== Rate Limiter ====================

export interface RateLimitConfig {
  /** Maximum requests per window */
  limit: number;
  /** Window size in milliseconds */
  window: number;
}

/**
 * Token bucket rate limiter.
 */
export class RateLimiter {
  private tokens: number;
  private readonly maxTokens: number;
  private readonly refillRate: number;
  private lastRefill: number;
  private queue: Array<{ resolve: () => void; reject: (e: Error) => void }> = [];

  constructor(config: RateLimitConfig) {
    this.maxTokens = config.limit;
    this.tokens = config.limit;
    this.refillRate = config.limit / config.window; // tokens per ms
    this.lastRefill = Date.now();
  }

  /**
   * Wait for a token to become available.
   */
  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens--;
      return;
    }

    // Wait for token
    return new Promise((resolve, reject) => {
      this.queue.push({ resolve, reject });
      this.scheduleRefill();
    });
  }

  /**
   * Check if a token is immediately available.
   */
  tryAcquire(): boolean {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens--;
      return true;
    }

    return false;
  }

  /**
   * Get current available tokens.
   */
  available(): number {
    this.refill();
    return Math.floor(this.tokens);
  }

  /**
   * Reset the rate limiter.
   */
  reset(): void {
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
    this.queue = [];
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const newTokens = elapsed * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + newTokens);
    this.lastRefill = now;

    // Process waiting requests
    while (this.queue.length > 0 && this.tokens >= 1) {
      const { resolve } = this.queue.shift()!;
      this.tokens--;
      resolve();
    }
  }

  private scheduleRefill(): void {
    if (this.queue.length === 0) return;

    const msPerToken = 1 / this.refillRate;
    setTimeout(() => this.refill(), msPerToken);
  }
}

/**
 * Parse rate limit string (e.g., "100/minute", "10/second").
 */
export function parseRateLimit(limit: string): RateLimitConfig {
  const match = limit.match(/^(\d+)\s*\/\s*(second|minute|hour|day|s|m|h|d)$/i);
  if (!match) {
    throw new Error(`Invalid rate limit format: ${limit}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  const windows: Record<string, number> = {
    second: 1000,
    s: 1000,
    minute: 60000,
    m: 60000,
    hour: 3600000,
    h: 3600000,
    day: 86400000,
    d: 86400000,
  };

  return {
    limit: value,
    window: windows[unit],
  };
}

// ==================== Batch Processor ====================

/**
 * Process items in parallel batches with rate limiting and retries.
 *
 * @example
 * ```typescript
 * const processor = new BatchProcessor<string, Result>(
 *   async (prompt) => await agent.chat({ message: prompt }),
 *   { concurrency: 5, rateLimit: '100/minute' }
 * );
 *
 * const results = await processor.process([
 *   'Question 1?',
 *   'Question 2?',
 *   'Question 3?',
 * ]);
 *
 * console.log(`Processed ${results.stats.completed} items`);
 * ```
 */
export class BatchProcessor<TInput, TOutput> {
  private readonly fn: (input: TInput) => Promise<TOutput>;
  private readonly concurrency: number;
  private readonly maxRetries: number;
  private readonly retryDelay: number;
  private readonly rateLimiter?: RateLimiter;

  constructor(
    fn: (input: TInput) => Promise<TOutput>,
    opts: BatchOptions & { rateLimit?: string | RateLimitConfig } = {}
  ) {
    this.fn = fn;
    this.concurrency = opts.concurrency || 5;
    this.maxRetries = opts.maxRetries || 3;
    this.retryDelay = opts.retryDelay || 1000;

    if (opts.rateLimit) {
      const config = typeof opts.rateLimit === 'string'
        ? parseRateLimit(opts.rateLimit)
        : opts.rateLimit;
      this.rateLimiter = new RateLimiter(config);
    }
  }

  /**
   * Process all items.
   */
  async process(
    inputs: TInput[],
    opts: BatchOptions = {}
  ): Promise<BatchResult<TOutput>> {
    const startTime = Date.now();
    const items: BatchItem<TInput, TOutput>[] = inputs.map(input => ({
      id: createRequestId(),
      input,
      status: 'pending',
      attempts: 0,
    }));

    let completed = 0;
    let failed = 0;
    let retries = 0;
    const concurrency = opts.concurrency || this.concurrency;

    // Process in parallel with concurrency limit
    const queue = [...items];
    const running: Promise<void>[] = [];

    const processItem = async (item: BatchItem<TInput, TOutput>): Promise<void> => {
      // Rate limiting
      if (this.rateLimiter) {
        await this.rateLimiter.acquire();
      }

      // Check for abort
      if (opts.signal?.aborted) {
        item.status = 'failed';
        item.error = new Error('Aborted');
        return;
      }

      item.status = 'running';
      item.startedAt = Date.now();
      item.attempts++;

      try {
        item.output = await this.fn(item.input);
        item.status = 'completed';
        item.completedAt = Date.now();
        completed++;
        opts.onProgress?.(completed, items.length, item);
      } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e));

        if (item.attempts < (opts.maxRetries || this.maxRetries)) {
          // Retry
          retries++;
          const delay = (opts.retryDelay || this.retryDelay) * Math.pow(2, item.attempts - 1);
          await sleep(delay);
          item.status = 'pending';
          queue.push(item);
        } else {
          // Final failure
          item.status = 'failed';
          item.error = error;
          item.completedAt = Date.now();
          failed++;

          const shouldContinue = opts.onError?.(error, item) ?? true;
          if (!shouldContinue) {
            // Abort remaining items
            for (const remaining of queue) {
              remaining.status = 'failed';
              remaining.error = new Error('Batch aborted');
            }
            queue.length = 0;
          }
        }
      }
    };

    // Main processing loop
    while (queue.length > 0 || running.length > 0) {
      // Start new tasks up to concurrency limit
      while (queue.length > 0 && running.length < concurrency) {
        const item = queue.shift()!;
        const promise = processItem(item).finally(() => {
          const idx = running.indexOf(promise);
          if (idx >= 0) running.splice(idx, 1);
        });
        running.push(promise);
      }

      // Wait for at least one to complete
      if (running.length > 0) {
        await Promise.race(running);
      }
    }

    const results = items
      .filter(item => item.status === 'completed')
      .map(item => item.output!);

    const failures = items
      .filter(item => item.status === 'failed')
      .map(item => ({
        id: item.id,
        error: item.error!,
        input: item.input,
      }));

    return {
      results,
      failures,
      duration: Date.now() - startTime,
      stats: {
        total: items.length,
        completed,
        failed,
        retries,
      },
    };
  }

  /**
   * Process items with streaming results.
   */
  async *stream(
    inputs: TInput[],
    opts: BatchOptions = {}
  ): AsyncGenerator<{ item: BatchItem<TInput, TOutput>; completed: number; total: number }, void, void> {
    const items: BatchItem<TInput, TOutput>[] = inputs.map(input => ({
      id: createRequestId(),
      input,
      status: 'pending',
      attempts: 0,
    }));

    let completed = 0;
    const concurrency = opts.concurrency || this.concurrency;
    const queue = [...items];
    const running = new Map<string, Promise<BatchItem<TInput, TOutput>>>();

    const processItem = async (item: BatchItem<TInput, TOutput>): Promise<BatchItem<TInput, TOutput>> => {
      if (this.rateLimiter) {
        await this.rateLimiter.acquire();
      }

      item.status = 'running';
      item.startedAt = Date.now();
      item.attempts++;

      try {
        item.output = await this.fn(item.input);
        item.status = 'completed';
        item.completedAt = Date.now();
      } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e));

        if (item.attempts < (opts.maxRetries || this.maxRetries)) {
          const delay = (opts.retryDelay || this.retryDelay) * Math.pow(2, item.attempts - 1);
          await sleep(delay);
          item.status = 'pending';
          queue.push(item);
        } else {
          item.status = 'failed';
          item.error = error;
          item.completedAt = Date.now();
        }
      }

      return item;
    };

    while (queue.length > 0 || running.size > 0) {
      // Start new tasks
      while (queue.length > 0 && running.size < concurrency) {
        const item = queue.shift()!;
        running.set(item.id, processItem(item));
      }

      if (running.size > 0) {
        // Wait for any to complete
        const completedItem = await Promise.race(running.values());
        running.delete(completedItem.id);

        if (completedItem.status === 'completed' || completedItem.status === 'failed') {
          completed++;
          yield { item: completedItem, completed, total: items.length };
        }
      }
    }
  }
}

// ==================== Debouncer ====================

export interface DebouncerOptions {
  /** Delay in milliseconds */
  delay: number;
  /** Maximum wait time (for leading edge calls) */
  maxWait?: number;
  /** Execute on leading edge */
  leading?: boolean;
  /** Execute on trailing edge (default: true) */
  trailing?: boolean;
}

/**
 * Debounce function calls.
 */
export class Debouncer<T extends (...args: any[]) => any> {
  private readonly fn: T;
  private readonly delay: number;
  private readonly maxWait?: number;
  private readonly leading: boolean;
  private readonly trailing: boolean;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private lastCallTime: number | null = null;
  private lastInvokeTime = 0;
  private lastArgs: Parameters<T> | null = null;
  private result: ReturnType<T> | undefined;

  constructor(fn: T, opts: DebouncerOptions) {
    this.fn = fn;
    this.delay = opts.delay;
    this.maxWait = opts.maxWait;
    this.leading = opts.leading ?? false;
    this.trailing = opts.trailing ?? true;
  }

  /**
   * Call the debounced function.
   */
  call(...args: Parameters<T>): ReturnType<T> | undefined {
    const time = Date.now();
    const isInvoking = this.shouldInvoke(time);

    this.lastArgs = args;
    this.lastCallTime = time;

    if (isInvoking) {
      if (this.timer === null) {
        return this.leadingEdge(time);
      }
      if (this.maxWait !== undefined) {
        this.timer = setTimeout(() => this.timerExpired(), this.delay);
        return this.invokeFunc(time);
      }
    }

    if (this.timer === null) {
      this.timer = setTimeout(() => this.timerExpired(), this.delay);
    }

    return this.result;
  }

  /**
   * Cancel pending invocation.
   */
  cancel(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
    }
    this.lastInvokeTime = 0;
    this.lastArgs = null;
    this.lastCallTime = null;
    this.timer = null;
  }

  /**
   * Immediately invoke if pending.
   */
  flush(): ReturnType<T> | undefined {
    if (this.timer !== null) {
      return this.trailingEdge(Date.now());
    }
    return this.result;
  }

  /**
   * Check if there's a pending invocation.
   */
  pending(): boolean {
    return this.timer !== null;
  }

  private shouldInvoke(time: number): boolean {
    const timeSinceLastCall = this.lastCallTime === null ? 0 : time - this.lastCallTime;
    const timeSinceLastInvoke = time - this.lastInvokeTime;

    return (
      this.lastCallTime === null ||
      timeSinceLastCall >= this.delay ||
      timeSinceLastCall < 0 ||
      (this.maxWait !== undefined && timeSinceLastInvoke >= this.maxWait)
    );
  }

  private leadingEdge(time: number): ReturnType<T> | undefined {
    this.lastInvokeTime = time;
    this.timer = setTimeout(() => this.timerExpired(), this.delay);

    if (this.leading) {
      return this.invokeFunc(time);
    }
    return this.result;
  }

  private trailingEdge(time: number): ReturnType<T> | undefined {
    this.timer = null;

    if (this.trailing && this.lastArgs !== null) {
      return this.invokeFunc(time);
    }

    this.lastArgs = null;
    return this.result;
  }

  private timerExpired(): void {
    const time = Date.now();
    if (this.shouldInvoke(time)) {
      this.trailingEdge(time);
    } else {
      const timeSinceLastCall = this.lastCallTime === null ? 0 : time - this.lastCallTime;
      const remaining = this.delay - timeSinceLastCall;
      this.timer = setTimeout(() => this.timerExpired(), remaining);
    }
  }

  private invokeFunc(time: number): ReturnType<T> {
    const args = this.lastArgs!;
    this.lastArgs = null;
    this.lastInvokeTime = time;
    const result = this.fn(...args);
    this.result = result;
    return result;
  }
}

// ==================== Throttler ====================

/**
 * Throttle function calls.
 */
export class Throttler<T extends (...args: any[]) => any> {
  private readonly fn: T;
  private readonly limit: number;
  private lastCallTime = 0;
  private timeout: ReturnType<typeof setTimeout> | null = null;
  private lastArgs: Parameters<T> | null = null;

  constructor(fn: T, limitMs: number) {
    this.fn = fn;
    this.limit = limitMs;
  }

  /**
   * Call the throttled function.
   */
  call(...args: Parameters<T>): ReturnType<T> | undefined {
    const now = Date.now();
    const remaining = this.limit - (now - this.lastCallTime);

    this.lastArgs = args;

    if (remaining <= 0) {
      if (this.timeout) {
        clearTimeout(this.timeout);
        this.timeout = null;
      }
      this.lastCallTime = now;
      return this.fn(...args);
    }

    if (!this.timeout) {
      this.timeout = setTimeout(() => {
        this.lastCallTime = Date.now();
        this.timeout = null;
        if (this.lastArgs) {
          this.fn(...this.lastArgs);
        }
      }, remaining);
    }

    return undefined;
  }

  /**
   * Cancel pending invocation.
   */
  cancel(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    this.lastArgs = null;
  }
}

// ==================== Semaphore ====================

/**
 * Semaphore for limiting concurrent operations.
 */
export class Semaphore {
  private permits: number;
  private readonly maxPermits: number;
  private readonly waiting: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
    this.maxPermits = permits;
  }

  /**
   * Acquire a permit, waiting if necessary.
   */
  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }

    return new Promise(resolve => {
      this.waiting.push(resolve);
    });
  }

  /**
   * Try to acquire a permit without waiting.
   */
  tryAcquire(): boolean {
    if (this.permits > 0) {
      this.permits--;
      return true;
    }
    return false;
  }

  /**
   * Release a permit.
   */
  release(): void {
    if (this.waiting.length > 0) {
      const next = this.waiting.shift()!;
      next();
    } else {
      this.permits = Math.min(this.permits + 1, this.maxPermits);
    }
  }

  /**
   * Get available permits.
   */
  available(): number {
    return this.permits;
  }

  /**
   * Run a function with a permit.
   */
  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

// ==================== Circuit Breaker ====================

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerOptions {
  /** Number of failures before opening circuit */
  failureThreshold?: number;
  /** Time to wait before trying again (ms) */
  resetTimeout?: number;
  /** Number of successful calls in half-open to close circuit */
  successThreshold?: number;
  /** Callback when state changes */
  onStateChange?: (state: CircuitState) => void;
}

/**
 * Circuit breaker for fault tolerance.
 */
export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures = 0;
  private successes = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  private readonly successThreshold: number;
  private readonly onStateChange?: (state: CircuitState) => void;

  constructor(opts: CircuitBreakerOptions = {}) {
    this.failureThreshold = opts.failureThreshold ?? 5;
    this.resetTimeout = opts.resetTimeout ?? 30000;
    this.successThreshold = opts.successThreshold ?? 2;
    this.onStateChange = opts.onStateChange;
  }

  /**
   * Execute a function through the circuit breaker.
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      // Check if we should try half-open
      if (Date.now() - this.lastFailureTime >= this.resetTimeout) {
        this.transition('half-open');
      } else {
        throw new CircuitOpenError('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (e) {
      this.recordFailure();
      throw e;
    }
  }

  /**
   * Get current state.
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Manually reset the circuit.
   */
  reset(): void {
    this.transition('closed');
    this.failures = 0;
    this.successes = 0;
  }

  private recordSuccess(): void {
    this.failures = 0;

    if (this.state === 'half-open') {
      this.successes++;
      if (this.successes >= this.successThreshold) {
        this.transition('closed');
      }
    }
  }

  private recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    this.successes = 0;

    if (this.state === 'half-open') {
      this.transition('open');
    } else if (this.failures >= this.failureThreshold) {
      this.transition('open');
    }
  }

  private transition(newState: CircuitState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.onStateChange?.(newState);
    }
  }
}

export class CircuitOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitOpenError';
  }
}

// ==================== Factory Functions ====================

/**
 * Create a batch processor.
 */
export function createBatchProcessor<TInput, TOutput>(
  fn: (input: TInput) => Promise<TOutput>,
  opts?: BatchOptions & { rateLimit?: string | RateLimitConfig }
): BatchProcessor<TInput, TOutput> {
  return new BatchProcessor(fn, opts);
}

/**
 * Create a rate limiter.
 */
export function createRateLimiter(config: string | RateLimitConfig): RateLimiter {
  const parsed = typeof config === 'string' ? parseRateLimit(config) : config;
  return new RateLimiter(parsed);
}

/**
 * Create a debounced function.
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  opts: DebouncerOptions
): Debouncer<T> {
  return new Debouncer(fn, opts);
}

/**
 * Create a throttled function.
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limitMs: number
): Throttler<T> {
  return new Throttler(fn, limitMs);
}

/**
 * Create a semaphore.
 */
export function createSemaphore(permits: number): Semaphore {
  return new Semaphore(permits);
}

/**
 * Create a circuit breaker.
 */
export function createCircuitBreaker(opts?: CircuitBreakerOptions): CircuitBreaker {
  return new CircuitBreaker(opts);
}

/**
 * Utility: Process items with rate limiting and progress.
 */
export async function processWithLimit<TInput, TOutput>(
  inputs: TInput[],
  fn: (input: TInput) => Promise<TOutput>,
  opts: {
    concurrency?: number;
    rateLimit?: string;
    onProgress?: (completed: number, total: number) => void;
  } = {}
): Promise<TOutput[]> {
  const processor = createBatchProcessor(fn, {
    concurrency: opts.concurrency,
    rateLimit: opts.rateLimit,
  });

  const result = await processor.process(inputs, {
    onProgress: (completed, total) => opts.onProgress?.(completed, total),
  });

  if (result.failures.length > 0) {
    throw new Error(`${result.failures.length} items failed`);
  }

  return result.results;
}

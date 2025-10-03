/**
 * Retry utilities for handling transient failures
 */

export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxRetries?: number;

  /** Initial backoff delay in milliseconds */
  backoffMs?: number;

  /** Maximum backoff delay in milliseconds */
  maxBackoffMs?: number;

  /** Backoff multiplier */
  backoffMultiplier?: number;

  /** Whether to add jitter to backoff */
  jitter?: boolean;

  /** Function to determine if error is retryable */
  shouldRetry?: (error: any, attempt: number) => boolean;

  /** Callback called before each retry */
  onRetry?: (error: any, attempt: number, delayMs: number) => void;
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    backoffMs = 1000,
    maxBackoffMs = 30000,
    backoffMultiplier = 2,
    jitter = true,
    shouldRetry = () => true,
    onRetry,
  } = options;

  let lastError: any;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      attempt++;

      // Check if we should retry
      if (attempt > maxRetries || !shouldRetry(error, attempt)) {
        throw error;
      }

      // Calculate backoff delay
      let delayMs = Math.min(
        backoffMs * Math.pow(backoffMultiplier, attempt - 1),
        maxBackoffMs
      );

      // Add jitter
      if (jitter) {
        delayMs = delayMs * (0.5 + Math.random() * 0.5);
      }

      // Call onRetry callback
      if (onRetry) {
        onRetry(error, attempt, delayMs);
      }

      // Wait before retrying
      await sleep(delayMs);
    }
  }

  throw lastError;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if error is retryable based on common patterns
 */
export function isRetryableError(error: any): boolean {
  // Network errors
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
    return true;
  }

  // HTTP status codes
  if (error.status) {
    // Rate limit
    if (error.status === 429) {
      return true;
    }

    // Server errors
    if (error.status >= 500) {
      return true;
    }
  }

  // Integration-specific errors
  if (error.retryable === true) {
    return true;
  }

  return false;
}

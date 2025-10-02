export class TribbleError extends Error {
  readonly code: string;
  readonly status?: number;
  readonly requestId?: string;
  constructor(message: string, code: string, opts?: { status?: number; cause?: unknown; requestId?: string }) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.status = opts?.status;
    this.requestId = opts?.requestId;
    if (opts?.cause) (this as any).cause = opts.cause;
  }
}

export class AuthError extends TribbleError {
  constructor(message = 'Authentication failed', opts?: { status?: number; cause?: unknown; requestId?: string }) {
    super(message, 'AUTH_ERROR', opts);
  }
}

export class RateLimitError extends TribbleError {
  constructor(message = 'Rate limit exceeded', opts?: { status?: number; cause?: unknown; requestId?: string }) {
    super(message, 'RATE_LIMIT', opts);
  }
}

export class ValidationError extends TribbleError {
  constructor(message = 'Validation error', opts?: { status?: number; cause?: unknown; requestId?: string }) {
    super(message, 'VALIDATION_ERROR', opts);
  }
}

export class ServerError extends TribbleError {
  constructor(message = 'Server error', opts?: { status?: number; cause?: unknown; requestId?: string }) {
    super(message, 'SERVER_ERROR', opts);
  }
}

export class NetworkError extends TribbleError {
  constructor(message = 'Network error', opts?: { cause?: unknown; requestId?: string }) {
    super(message, 'NETWORK_ERROR', { cause: opts?.cause, requestId: opts?.requestId });
  }
}

export class TimeoutError extends TribbleError {
  constructor(message = 'Request timed out', opts?: { requestId?: string }) {
    super(message, 'TIMEOUT', { requestId: opts?.requestId });
  }
}


/**
 * Webhook transport for receiving real-time events
 */

import { createHmac, timingSafeEqual } from 'crypto';
import type { Transport, WebhookConfig, WebhookPayload } from '../types';
import { TransportError, AuthenticationError } from '../types';

export type WebhookHandler = (payload: WebhookPayload, headers: Record<string, string>) => Promise<void>;

export interface WebhookRequest {
  body: any;
  headers: Record<string, string>;
  rawBody?: string | Buffer;
}

/**
 * Webhook transport for handling real-time events
 *
 * This is a passive transport that validates and processes incoming webhook requests.
 * It doesn't establish an active connection like other transports.
 */
export class WebhookTransport implements Transport {
  readonly type = 'webhook' as const;
  private connected: boolean = false;
  private handler: WebhookHandler | null = null;

  constructor(private readonly config: WebhookConfig) {}

  async connect(): Promise<void> {
    // Webhook transport doesn't need active connection
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.handler = null;
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Register a handler for webhook events
   */
  onWebhook(handler: WebhookHandler): void {
    if (!this.connected) {
      throw new TransportError('Transport not connected', false);
    }
    this.handler = handler;
  }

  /**
   * Process an incoming webhook request
   */
  async processRequest(request: WebhookRequest): Promise<void> {
    if (!this.connected) {
      throw new TransportError('Transport not connected', false);
    }

    if (!this.handler) {
      throw new TransportError('No webhook handler registered', false);
    }

    // Verify signature if secret is configured
    if (this.config.secret) {
      this.verifySignature(request);
    }

    // Parse webhook payload
    const payload = this.parsePayload(request);

    // Call handler
    await this.handler(payload, request.headers);
  }

  /**
   * Verify webhook signature
   */
  private verifySignature(request: WebhookRequest): void {
    if (!this.config.secret) {
      return;
    }

    const signatureHeader = this.config.signatureHeader || 'X-Webhook-Signature';
    const signature = request.headers[signatureHeader] || request.headers[signatureHeader.toLowerCase()];

    if (!signature) {
      throw new AuthenticationError('Missing webhook signature', {
        header: signatureHeader,
      });
    }

    // Get raw body
    const rawBody = request.rawBody || JSON.stringify(request.body);

    // Compute expected signature
    const algorithm = this.config.signatureAlgorithm || 'sha256';
    const hmac = createHmac(algorithm, this.config.secret);
    hmac.update(rawBody);
    const expectedSignature = hmac.digest('hex');

    // Support both plain signatures and prefixed signatures (e.g., "sha256=...")
    const actualSignature = signature.includes('=') ? signature.split('=')[1] : signature;

    // Timing-safe comparison
    try {
      const expectedBuffer = Buffer.from(expectedSignature, 'hex');
      const actualBuffer = Buffer.from(actualSignature, 'hex');

      if (expectedBuffer.length !== actualBuffer.length || !timingSafeEqual(expectedBuffer, actualBuffer)) {
        throw new AuthenticationError('Invalid webhook signature');
      }
    } catch (error) {
      throw new AuthenticationError('Invalid webhook signature', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Parse webhook payload
   */
  private parsePayload(request: WebhookRequest): WebhookPayload {
    const body = request.body;

    // Try to extract standard webhook fields
    const event = body.event || body.type || body.event_type || 'webhook';
    const data = body.data || body.payload || body;
    const timestamp = body.timestamp
      ? new Date(body.timestamp)
      : body.created_at
      ? new Date(body.created_at)
      : new Date();
    const source = body.source || this.config.endpoint || 'webhook';
    const eventId = body.id || body.event_id || body.uuid;

    return {
      event,
      data,
      timestamp,
      source,
      eventId,
    };
  }

  /**
   * Generate a signature for outgoing webhook (if you need to send webhooks)
   */
  static generateSignature(payload: any, secret: string, algorithm: 'sha256' | 'sha512' = 'sha256'): string {
    const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const hmac = createHmac(algorithm, secret);
    hmac.update(body);
    return `${algorithm}=${hmac.digest('hex')}`;
  }

  /**
   * Validate webhook payload structure (override for custom validation)
   */
  protected validatePayload(payload: WebhookPayload): void {
    if (!payload.event) {
      throw new TransportError('Invalid webhook payload: missing event type', false);
    }
  }
}

/**
 * Create a webhook transport instance
 */
export function createWebhookTransport(config: WebhookConfig): WebhookTransport {
  return new WebhookTransport(config);
}

/**
 * Express middleware factory for webhook handling
 *
 * Usage:
 * ```typescript
 * const transport = createWebhookTransport({ ... });
 * app.post('/webhook', createWebhookMiddleware(transport));
 * ```
 */
export function createWebhookMiddleware(transport: WebhookTransport) {
  return async (req: any, res: any, next: any) => {
    try {
      await transport.processRequest({
        body: req.body,
        headers: req.headers,
        rawBody: req.rawBody, // Requires raw body parser
      });

      res.status(200).json({ success: true });
    } catch (error: any) {
      if (error instanceof AuthenticationError) {
        res.status(401).json({ error: error.message });
      } else if (error instanceof TransportError) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };
}

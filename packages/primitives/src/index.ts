import { ControlPlaneClient, ControlPlaneConfig, createControlPlaneClient } from '@tribble/sdk-control';

// ==================== CUDA-like Primitives ====================

/**
 * Upload operation result.
 */
export interface UploadResult {
  /** Upload ID */
  id: string;
  /** File name */
  filename: string;
  /** Content type */
  contentType: string;
  /** File size in bytes */
  sizeBytes: number;
  /** Upload status */
  status: 'pending' | 'processing' | 'completed' | 'failed';
  /** Processing progress (0-100) */
  progress?: number;
  /** Completion timestamp */
  completedAt?: Date;
  /** Error message if failed */
  error?: string;
}

/**
 * Batch operation definition.
 */
export interface BatchOperation<T = unknown, R = unknown> {
  /** Operation type */
  type: 'upload' | 'ingest' | 'transform' | 'export' | 'custom';
  /** Input data */
  data: T;
  /** Operation options */
  options?: Record<string, unknown>;
  /** Callback when complete */
  onComplete?: (result: R) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

/**
 * Batch execution result.
 */
export interface BatchResult<R = unknown> {
  /** Batch ID */
  batchId: string;
  /** Total operations */
  total: number;
  /** Completed operations */
  completed: number;
  /** Failed operations */
  failed: number;
  /** Individual results */
  results: Array<{
    index: number;
    status: 'success' | 'failed';
    result?: R;
    error?: string;
  }>;
  /** Execution time in milliseconds */
  durationMs: number;
}

/**
 * Stream chunk for uploads.
 */
export interface StreamChunk {
  /** Chunk index */
  index: number;
  /** Chunk data */
  data: ArrayBuffer | Uint8Array;
  /** Total chunks (if known) */
  totalChunks?: number;
  /** Is this the last chunk? */
  isLast: boolean;
}

// ==================== Upload Client ====================

/**
 * UploadClient - High-performance file upload with chunking, resumption, and parallel uploads.
 *
 * @example
 * ```typescript
 * const uploader = new UploadClient(controlPlane);
 *
 * // Simple upload
 * const result = await uploader.upload(file, {
 *   onProgress: (progress) => console.log(`${progress}%`),
 * });
 *
 * // Chunked upload for large files
 * const largeResult = await uploader.uploadChunked(largeFile, {
 *   chunkSize: 5 * 1024 * 1024, // 5MB chunks
 *   parallelChunks: 3,
 * });
 *
 * // Resume interrupted upload
 * const resumed = await uploader.resumeUpload(uploadId);
 * ```
 */
export class UploadClient {
  private controlPlane: ControlPlaneClient;
  private defaultChunkSize = 5 * 1024 * 1024; // 5MB

  constructor(controlPlane: ControlPlaneClient) {
    this.controlPlane = controlPlane;
  }

  /** Simple file upload */
  async upload(
    file: File | Blob | ArrayBuffer | Uint8Array,
    options?: UploadOptions
  ): Promise<UploadResult> {
    let data: ArrayBuffer;
    if (file instanceof File || file instanceof Blob) {
      data = await file.arrayBuffer();
    } else if (file instanceof Uint8Array) {
      data = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer;
    } else {
      data = file;
    }
    const filename = file instanceof File ? file.name : options?.filename || 'file';
    const contentType = file instanceof File ? file.type : options?.contentType || 'application/octet-stream';

    const formData = new FormData();
    formData.append('file', new Blob([data]), filename);

    if (options?.metadata) {
      formData.append('metadata', JSON.stringify(options.metadata));
    }

    const response = await this.request<UploadResult>('/upload', {
      method: 'POST',
      body: formData,
    });

    // Poll for completion if needed
    if (options?.waitForProcessing && response.status === 'processing') {
      return this.waitForUpload(response.id, options.onProgress);
    }

    return response;
  }

  /** Chunked upload for large files */
  async uploadChunked(
    file: File | Blob | ArrayBuffer | Uint8Array,
    options?: ChunkedUploadOptions
  ): Promise<UploadResult> {
    const data = file instanceof File || file instanceof Blob ? await file.arrayBuffer() : file;
    const dataView = new Uint8Array(data);
    const chunkSize = options?.chunkSize || this.defaultChunkSize;
    const parallelChunks = options?.parallelChunks || 3;

    const totalChunks = Math.ceil(dataView.length / chunkSize);
    const filename = file instanceof File ? file.name : options?.filename || 'file';
    const contentType = file instanceof File ? file.type : options?.contentType || 'application/octet-stream';

    // Initialize upload session
    const session = await this.initializeUploadSession({
      filename,
      contentType,
      totalSize: dataView.length,
      totalChunks,
      metadata: options?.metadata,
    });

    // Upload chunks with parallelism
    const chunks: StreamChunk[] = [];
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, dataView.length);
      chunks.push({
        index: i,
        data: dataView.slice(start, end),
        totalChunks,
        isLast: i === totalChunks - 1,
      });
    }

    let completedChunks = 0;
    const uploadChunk = async (chunk: StreamChunk): Promise<void> => {
      await this.uploadChunkToSession(session.id, chunk);
      completedChunks++;
      options?.onProgress?.(Math.round((completedChunks / totalChunks) * 100));
    };

    // Process chunks in batches
    for (let i = 0; i < chunks.length; i += parallelChunks) {
      const batch = chunks.slice(i, i + parallelChunks);
      await Promise.all(batch.map(uploadChunk));

      // Check for abort signal
      if (options?.signal?.aborted) {
        throw new Error('Upload aborted');
      }
    }

    // Finalize upload
    return this.finalizeUploadSession(session.id);
  }

  /** Resume an interrupted upload */
  async resumeUpload(uploadId: string, options?: ResumeUploadOptions): Promise<UploadResult> {
    const status = await this.getUploadStatus(uploadId);

    if (status.status === 'completed') {
      return status;
    }

    if (status.status === 'failed') {
      throw new Error(`Upload failed: ${status.error}`);
    }

    // Get remaining chunks to upload
    const remainingChunks = await this.getRemainingChunks(uploadId);

    if (remainingChunks.length === 0) {
      return this.finalizeUploadSession(uploadId);
    }

    // Upload remaining chunks
    let completedChunks = 0;
    for (const chunk of remainingChunks) {
      await this.uploadChunkToSession(uploadId, chunk);
      completedChunks++;
      options?.onProgress?.(Math.round((completedChunks / remainingChunks.length) * 100));
    }

    return this.finalizeUploadSession(uploadId);
  }

  /** Get upload status */
  async getUploadStatus(uploadId: string): Promise<UploadResult> {
    return this.request<UploadResult>(`/upload/${uploadId}`);
  }

  /** Cancel an upload */
  async cancelUpload(uploadId: string): Promise<void> {
    await this.request(`/upload/${uploadId}`, { method: 'DELETE' });
  }

  // ==================== Private Methods ====================

  private async initializeUploadSession(params: {
    filename: string;
    contentType: string;
    totalSize: number;
    totalChunks: number;
    metadata?: Record<string, unknown>;
  }): Promise<{ id: string }> {
    return this.request<{ id: string }>('/upload/session', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  private async uploadChunkToSession(sessionId: string, chunk: StreamChunk): Promise<void> {
    const formData = new FormData();
    // Convert Uint8Array to ArrayBuffer for Blob
    const chunkData = chunk.data instanceof Uint8Array
      ? chunk.data.buffer.slice(chunk.data.byteOffset, chunk.data.byteOffset + chunk.data.byteLength)
      : chunk.data;
    formData.append('chunk', new Blob([chunkData as ArrayBuffer]));
    formData.append('index', String(chunk.index));
    formData.append('isLast', String(chunk.isLast));

    await this.request(`/upload/session/${sessionId}/chunk`, {
      method: 'POST',
      body: formData,
    });
  }

  private async finalizeUploadSession(sessionId: string): Promise<UploadResult> {
    return this.request<UploadResult>(`/upload/session/${sessionId}/finalize`, {
      method: 'POST',
    });
  }

  private async getRemainingChunks(uploadId: string): Promise<StreamChunk[]> {
    return this.request<StreamChunk[]>(`/upload/${uploadId}/remaining-chunks`);
  }

  private async waitForUpload(uploadId: string, onProgress?: (progress: number) => void): Promise<UploadResult> {
    const maxAttempts = 120; // 2 minutes max
    const pollInterval = 1000; // 1 second

    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.getUploadStatus(uploadId);

      if (status.progress !== undefined) {
        onProgress?.(status.progress);
      }

      if (status.status === 'completed') {
        return status;
      }

      if (status.status === 'failed') {
        throw new Error(`Upload failed: ${status.error}`);
      }

      await this.sleep(pollInterval);
    }

    throw new Error('Upload timed out');
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    // Delegate to control plane for now - in real implementation would have dedicated upload endpoints
    const response = await fetch(`https://api.tribble.ai/v1${path}`, {
      ...options,
      headers: {
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.statusText}`);
    }

    return response.json();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export interface UploadOptions {
  filename?: string;
  contentType?: string;
  metadata?: Record<string, unknown>;
  waitForProcessing?: boolean;
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
}

export interface ChunkedUploadOptions extends UploadOptions {
  chunkSize?: number;
  parallelChunks?: number;
}

export interface ResumeUploadOptions {
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
}

// ==================== Batch Executor ====================

/**
 * BatchExecutor - Execute operations in parallel with rate limiting and error handling.
 *
 * @example
 * ```typescript
 * const executor = new BatchExecutor({ concurrency: 10, rateLimit: 100 });
 *
 * const results = await executor.execute([
 *   { type: 'upload', data: file1 },
 *   { type: 'upload', data: file2 },
 *   { type: 'transform', data: { sourceId: '123' } },
 * ]);
 * ```
 */
export class BatchExecutor {
  private concurrency: number;
  private rateLimit: number;
  private requestCount: number = 0;
  private lastResetTime: number = Date.now();

  constructor(options?: BatchExecutorOptions) {
    this.concurrency = options?.concurrency || 10;
    this.rateLimit = options?.rateLimit || 100;
  }

  /** Execute a batch of operations */
  async execute<T, R>(
    operations: BatchOperation<T, R>[],
    handler: (op: BatchOperation<T, R>) => Promise<R>
  ): Promise<BatchResult<R>> {
    const startTime = Date.now();
    const results: BatchResult<R>['results'] = [];
    const batchId = this.generateBatchId();

    // Process in batches based on concurrency
    for (let i = 0; i < operations.length; i += this.concurrency) {
      const batch = operations.slice(i, i + this.concurrency);

      // Apply rate limiting
      await this.applyRateLimit(batch.length);

      const batchResults = await Promise.allSettled(
        batch.map(async (op, batchIndex) => {
          const index = i + batchIndex;
          try {
            const result = await handler(op);
            op.onComplete?.(result);
            return { index, status: 'success' as const, result };
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            op.onError?.(err);
            return { index, status: 'failed' as const, error: err.message };
          }
        })
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        }
      }
    }

    return {
      batchId,
      total: operations.length,
      completed: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failed').length,
      results,
      durationMs: Date.now() - startTime,
    };
  }

  /** Execute with streaming results */
  async *stream<T, R>(
    operations: BatchOperation<T, R>[],
    handler: (op: BatchOperation<T, R>) => Promise<R>
  ): AsyncGenerator<{ index: number; status: 'success' | 'failed'; result?: R; error?: string }> {
    for (let i = 0; i < operations.length; i += this.concurrency) {
      const batch = operations.slice(i, i + this.concurrency);
      await this.applyRateLimit(batch.length);

      const batchResults = await Promise.allSettled(
        batch.map(async (op, batchIndex) => {
          const index = i + batchIndex;
          try {
            const result = await handler(op);
            return { index, status: 'success' as const, result };
          } catch (error) {
            return {
              index,
              status: 'failed' as const,
              error: error instanceof Error ? error.message : String(error),
            };
          }
        })
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          yield result.value;
        }
      }
    }
  }

  private async applyRateLimit(count: number): Promise<void> {
    const now = Date.now();

    // Reset counter every minute
    if (now - this.lastResetTime > 60000) {
      this.requestCount = 0;
      this.lastResetTime = now;
    }

    // Check if we'd exceed rate limit
    if (this.requestCount + count > this.rateLimit) {
      const waitTime = 60000 - (now - this.lastResetTime);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.requestCount = 0;
      this.lastResetTime = Date.now();
    }

    this.requestCount += count;
  }

  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }
}

export interface BatchExecutorOptions {
  /** Maximum concurrent operations */
  concurrency?: number;
  /** Rate limit (operations per minute) */
  rateLimit?: number;
}

// ==================== Orchestrator ====================

/**
 * Orchestrator - Coordinate complex multi-step workflows.
 *
 * @example
 * ```typescript
 * const orchestrator = new Orchestrator(controlPlane);
 *
 * const workflow = orchestrator
 *   .step('upload', async (ctx) => {
 *     return await uploader.upload(ctx.input.file);
 *   })
 *   .step('ingest', async (ctx) => {
 *     return await ingest(ctx.results.upload.id);
 *   })
 *   .step('notify', async (ctx) => {
 *     await sendNotification(ctx.results.ingest);
 *   });
 *
 * const result = await workflow.execute({ file: myFile });
 * ```
 */
export class Orchestrator {
  private controlPlane: ControlPlaneClient;
  private steps: Array<{
    name: string;
    handler: (ctx: WorkflowContext) => Promise<unknown>;
    options?: StepOptions;
  }> = [];

  constructor(controlPlane: ControlPlaneClient) {
    this.controlPlane = controlPlane;
  }

  /** Add a step to the workflow */
  step<R>(
    name: string,
    handler: (ctx: WorkflowContext) => Promise<R>,
    options?: StepOptions
  ): this {
    this.steps.push({ name, handler, options });
    return this;
  }

  /** Execute the workflow */
  async execute(input: unknown): Promise<WorkflowResult> {
    const workflowId = this.generateWorkflowId();
    const results: Record<string, unknown> = {};
    const errors: Record<string, string> = {};
    const startTime = Date.now();

    for (const step of this.steps) {
      const ctx: WorkflowContext = {
        workflowId,
        stepName: step.name,
        input,
        results,
        controlPlane: this.controlPlane,
      };

      try {
        const result = await this.executeStep(step, ctx);
        results[step.name] = result;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors[step.name] = message;

        if (step.options?.critical !== false) {
          return {
            workflowId,
            status: 'failed',
            results,
            errors,
            failedStep: step.name,
            durationMs: Date.now() - startTime,
          };
        }
      }
    }

    return {
      workflowId,
      status: Object.keys(errors).length > 0 ? 'completed_with_errors' : 'completed',
      results,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
      durationMs: Date.now() - startTime,
    };
  }

  private async executeStep(
    step: { name: string; handler: (ctx: WorkflowContext) => Promise<unknown>; options?: StepOptions },
    ctx: WorkflowContext
  ): Promise<unknown> {
    const maxRetries = step.options?.retries || 0;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await step.handler(ctx);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    throw lastError;
  }

  private generateWorkflowId(): string {
    return `wf_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }
}

export interface WorkflowContext {
  workflowId: string;
  stepName: string;
  input: unknown;
  results: Record<string, unknown>;
  controlPlane: ControlPlaneClient;
}

export interface StepOptions {
  /** Number of retries on failure */
  retries?: number;
  /** If false, workflow continues on failure */
  critical?: boolean;
  /** Timeout in milliseconds */
  timeoutMs?: number;
}

export interface WorkflowResult {
  workflowId: string;
  status: 'completed' | 'completed_with_errors' | 'failed';
  results: Record<string, unknown>;
  errors?: Record<string, string>;
  failedStep?: string;
  durationMs: number;
}

// ==================== Factory Functions ====================

/**
 * Create primitives from control plane client.
 */
export function createPrimitives(controlPlane: ControlPlaneClient) {
  return {
    upload: new UploadClient(controlPlane),
    batch: new BatchExecutor(),
    orchestrate: new Orchestrator(controlPlane),
  };
}

/**
 * Create primitives from environment variables.
 */
export function createPrimitivesFromEnv() {
  const controlPlane = createControlPlaneClient();
  return createPrimitives(controlPlane);
}

// ==================== Exports ====================

export { ControlPlaneClient, createControlPlaneClient } from '@tribble/sdk-control';

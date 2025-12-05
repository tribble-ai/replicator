import { createRequestId } from '@tribble/sdk-core';

// ==================== Storage Adapters ====================

/**
 * Generic storage adapter interface for offline data persistence.
 */
export interface StorageAdapter {
  get<T = any>(key: string): Promise<T | null>;
  set<T = any>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(prefix?: string): Promise<string[]>;
  has(key: string): Promise<boolean>;
}

/**
 * In-memory storage adapter. Data is lost on restart.
 * Good for development and testing.
 */
export class MemoryStorage implements StorageAdapter {
  private store = new Map<string, { value: any; expires?: number }>();

  async get<T = any>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expires && Date.now() > entry.expires) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set<T = any>(key: string, value: T, ttlMs?: number): Promise<void> {
    this.store.set(key, {
      value,
      expires: ttlMs ? Date.now() + ttlMs : undefined,
    });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  async keys(prefix?: string): Promise<string[]> {
    const allKeys = Array.from(this.store.keys());
    return prefix ? allKeys.filter(k => k.startsWith(prefix)) : allKeys;
  }

  async has(key: string): Promise<boolean> {
    return this.store.has(key);
  }
}

/**
 * File-based storage adapter for Node.js environments.
 * Persists data to a JSON file on disk.
 */
export class FileStorage implements StorageAdapter {
  private cache: Map<string, { value: any; expires?: number }> = new Map();
  private loaded = false;

  constructor(private readonly path: string) {}

  private async load(): Promise<void> {
    if (this.loaded) return;
    try {
      // @ts-ignore - avoid requiring Node types
      const fs = await import('node:fs/promises');
      const data = await fs.readFile(this.path, 'utf8');
      const parsed = JSON.parse(data);
      this.cache = new Map(Object.entries(parsed));
    } catch {
      this.cache = new Map();
    }
    this.loaded = true;
  }

  private async save(): Promise<void> {
    // @ts-ignore - avoid requiring Node types
    const fs = await import('node:fs/promises');
    const obj = Object.fromEntries(this.cache);
    await fs.writeFile(this.path, JSON.stringify(obj, null, 2));
  }

  async get<T = any>(key: string): Promise<T | null> {
    await this.load();
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (entry.expires && Date.now() > entry.expires) {
      this.cache.delete(key);
      await this.save();
      return null;
    }
    return entry.value as T;
  }

  async set<T = any>(key: string, value: T, ttlMs?: number): Promise<void> {
    await this.load();
    this.cache.set(key, {
      value,
      expires: ttlMs ? Date.now() + ttlMs : undefined,
    });
    await this.save();
  }

  async delete(key: string): Promise<void> {
    await this.load();
    this.cache.delete(key);
    await this.save();
  }

  async clear(): Promise<void> {
    this.cache = new Map();
    await this.save();
  }

  async keys(prefix?: string): Promise<string[]> {
    await this.load();
    const allKeys = Array.from(this.cache.keys());
    return prefix ? allKeys.filter(k => k.startsWith(prefix)) : allKeys;
  }

  async has(key: string): Promise<boolean> {
    await this.load();
    return this.cache.has(key);
  }
}

/**
 * IndexedDB storage adapter for browser environments.
 * Persists data in browser's IndexedDB.
 */
export class IndexedDBStorage implements StorageAdapter {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private readonly storeName = 'tribble_cache';

  constructor(private readonly dbName: string = 'tribble_offline') {}

  private async getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };
    });

    return this.dbPromise;
  }

  async get<T = any>(key: string): Promise<T | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const entry = request.result;
        if (!entry) {
          resolve(null);
          return;
        }
        if (entry.expires && Date.now() > entry.expires) {
          this.delete(key).catch(() => {});
          resolve(null);
          return;
        }
        resolve(entry.value as T);
      };
    });
  }

  async set<T = any>(key: string, value: T, ttlMs?: number): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.put({
        key,
        value,
        expires: ttlMs ? Date.now() + ttlMs : undefined,
      });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async delete(key: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async keys(prefix?: string): Promise<string[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.getAllKeys();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const allKeys = request.result as string[];
        resolve(prefix ? allKeys.filter(k => k.startsWith(prefix)) : allKeys);
      };
    });
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }
}

// ==================== Cache Manager ====================

export interface CacheOptions {
  /** Time-to-live in milliseconds or duration string (e.g., '1h', '30m', '7d') */
  ttl?: number | string;
  /** Whether to return stale data while revalidating */
  staleWhileRevalidate?: boolean;
  /** Maximum age of stale data that can be returned */
  maxStale?: number | string;
  /** Tags for cache invalidation */
  tags?: string[];
}

export interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  expiresAt?: number;
  tags?: string[];
  stale: boolean;
}

/**
 * Cache manager with TTL, stale-while-revalidate, and tag-based invalidation.
 */
export class CacheManager {
  private readonly storage: StorageAdapter;
  private readonly prefix: string;
  private revalidating = new Set<string>();

  constructor(storage: StorageAdapter, prefix = 'cache:') {
    this.storage = storage;
    this.prefix = prefix;
  }

  /**
   * Get a cached value, optionally with stale-while-revalidate.
   */
  async get<T>(
    key: string,
    opts: CacheOptions = {}
  ): Promise<CacheEntry<T> | null> {
    const fullKey = this.prefix + key;
    const entry = await this.storage.get<{
      data: T;
      cachedAt: number;
      expiresAt?: number;
      tags?: string[];
    }>(fullKey);

    if (!entry) return null;

    const now = Date.now();
    const expired = entry.expiresAt ? now > entry.expiresAt : false;

    if (expired) {
      const maxStaleMs = parseDuration(opts.maxStale);
      const staleCutoff = entry.expiresAt! + (maxStaleMs || 0);

      if (now > staleCutoff) {
        // Too stale, delete and return null
        await this.storage.delete(fullKey);
        return null;
      }

      // Stale but within acceptable range
      return {
        ...entry,
        stale: true,
      };
    }

    return {
      ...entry,
      stale: false,
    };
  }

  /**
   * Set a cached value with optional TTL.
   */
  async set<T>(key: string, data: T, opts: CacheOptions = {}): Promise<void> {
    const fullKey = this.prefix + key;
    const ttlMs = parseDuration(opts.ttl);

    await this.storage.set(
      fullKey,
      {
        data,
        cachedAt: Date.now(),
        expiresAt: ttlMs ? Date.now() + ttlMs : undefined,
        tags: opts.tags,
      },
      ttlMs
    );
  }

  /**
   * Get or fetch a value, using cache with automatic revalidation.
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    opts: CacheOptions = {}
  ): Promise<{ data: T; fromCache: boolean; stale: boolean }> {
    const cached = await this.get<T>(key, opts);

    if (cached && !cached.stale) {
      return { data: cached.data, fromCache: true, stale: false };
    }

    if (cached && cached.stale && opts.staleWhileRevalidate) {
      // Return stale data immediately, revalidate in background
      if (!this.revalidating.has(key)) {
        this.revalidating.add(key);
        fetcher()
          .then(data => this.set(key, data, opts))
          .finally(() => this.revalidating.delete(key));
      }
      return { data: cached.data, fromCache: true, stale: true };
    }

    // Fetch fresh data
    const data = await fetcher();
    await this.set(key, data, opts);
    return { data, fromCache: false, stale: false };
  }

  /**
   * Invalidate cache entries by key or tag.
   */
  async invalidate(keyOrTag: string): Promise<number> {
    const keys = await this.storage.keys(this.prefix);
    let count = 0;

    for (const fullKey of keys) {
      const key = fullKey.slice(this.prefix.length);

      // Direct key match
      if (key === keyOrTag) {
        await this.storage.delete(fullKey);
        count++;
        continue;
      }

      // Tag match
      const entry = await this.storage.get<{ tags?: string[] }>(fullKey);
      if (entry?.tags?.includes(keyOrTag)) {
        await this.storage.delete(fullKey);
        count++;
      }
    }

    return count;
  }

  /**
   * Clear all cached entries.
   */
  async clear(): Promise<void> {
    const keys = await this.storage.keys(this.prefix);
    for (const key of keys) {
      await this.storage.delete(key);
    }
  }
}

// ==================== Sync Queue ====================

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface QueuedOperation<T = any> {
  id: string;
  type: string;
  payload: T;
  status: SyncStatus;
  createdAt: number;
  attempts: number;
  lastAttempt?: number;
  lastError?: string;
  priority: number;
}

export interface SyncQueueOptions {
  /** Maximum retry attempts (default: 5) */
  maxRetries?: number;
  /** Base delay between retries in ms (default: 1000) */
  retryDelay?: number;
  /** Maximum delay between retries in ms (default: 60000) */
  maxRetryDelay?: number;
  /** Concurrency limit for sync operations (default: 3) */
  concurrency?: number;
  /** Auto-start syncing when online (default: true) */
  autoSync?: boolean;
}

export type SyncHandler<T = any> = (operation: QueuedOperation<T>) => Promise<void>;

type SyncEventType = 'enqueued' | 'syncing' | 'synced' | 'failed' | 'online' | 'offline';
type SyncEventHandler = (event: { type: SyncEventType; operation?: QueuedOperation }) => void;

/**
 * Sync queue for offline-first operations.
 * Queues operations when offline, syncs when online.
 */
export class SyncQueue {
  private readonly storage: StorageAdapter;
  private readonly prefix: string;
  private readonly opts: Required<SyncQueueOptions>;
  private readonly handlers = new Map<string, SyncHandler>();
  private readonly eventHandlers: SyncEventHandler[] = [];
  private syncing = false;
  private online = true;

  constructor(storage: StorageAdapter, opts: SyncQueueOptions = {}) {
    this.storage = storage;
    this.prefix = 'sync:';
    this.opts = {
      maxRetries: opts.maxRetries ?? 5,
      retryDelay: opts.retryDelay ?? 1000,
      maxRetryDelay: opts.maxRetryDelay ?? 60000,
      concurrency: opts.concurrency ?? 3,
      autoSync: opts.autoSync ?? true,
    };

    // Set up online/offline detection
    if (typeof window !== 'undefined') {
      this.online = navigator.onLine;
      window.addEventListener('online', () => {
        this.online = true;
        this.emit({ type: 'online' });
        if (this.opts.autoSync) this.sync();
      });
      window.addEventListener('offline', () => {
        this.online = false;
        this.emit({ type: 'offline' });
      });
    }
  }

  /**
   * Check if currently online.
   */
  isOnline(): boolean {
    return this.online;
  }

  /**
   * Register a handler for a specific operation type.
   */
  registerHandler<T = any>(type: string, handler: SyncHandler<T>): void {
    this.handlers.set(type, handler as SyncHandler);
  }

  /**
   * Add an event listener.
   */
  on(handler: SyncEventHandler): () => void {
    this.eventHandlers.push(handler);
    return () => {
      const idx = this.eventHandlers.indexOf(handler);
      if (idx >= 0) this.eventHandlers.splice(idx, 1);
    };
  }

  private emit(event: { type: SyncEventType; operation?: QueuedOperation }): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(event);
      } catch {
        // Ignore handler errors
      }
    }
  }

  /**
   * Enqueue an operation for sync.
   */
  async enqueue<T = any>(
    type: string,
    payload: T,
    opts: { priority?: number } = {}
  ): Promise<QueuedOperation<T>> {
    const operation: QueuedOperation<T> = {
      id: createRequestId(),
      type,
      payload,
      status: 'pending',
      createdAt: Date.now(),
      attempts: 0,
      priority: opts.priority ?? 0,
    };

    await this.storage.set(this.prefix + operation.id, operation);
    this.emit({ type: 'enqueued', operation });

    // Try to sync immediately if online
    if (this.online && this.opts.autoSync) {
      this.sync();
    }

    return operation;
  }

  /**
   * Get all pending operations.
   */
  async getPending(): Promise<QueuedOperation[]> {
    const keys = await this.storage.keys(this.prefix);
    const operations: QueuedOperation[] = [];

    for (const key of keys) {
      const op = await this.storage.get<QueuedOperation>(key);
      if (op && (op.status === 'pending' || op.status === 'failed')) {
        operations.push(op);
      }
    }

    // Sort by priority (higher first) then by creation time (older first)
    return operations.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return a.createdAt - b.createdAt;
    });
  }

  /**
   * Get operation by ID.
   */
  async get(id: string): Promise<QueuedOperation | null> {
    return this.storage.get(this.prefix + id);
  }

  /**
   * Sync all pending operations.
   */
  async sync(): Promise<{ synced: number; failed: number }> {
    if (this.syncing || !this.online) {
      return { synced: 0, failed: 0 };
    }

    this.syncing = true;
    let synced = 0;
    let failed = 0;

    try {
      const pending = await this.getPending();

      // Process in batches based on concurrency
      for (let i = 0; i < pending.length; i += this.opts.concurrency) {
        const batch = pending.slice(i, i + this.opts.concurrency);

        const results = await Promise.allSettled(
          batch.map(op => this.syncOperation(op))
        );

        for (const result of results) {
          if (result.status === 'fulfilled' && result.value) {
            synced++;
          } else {
            failed++;
          }
        }
      }
    } finally {
      this.syncing = false;
    }

    return { synced, failed };
  }

  private async syncOperation(operation: QueuedOperation): Promise<boolean> {
    const handler = this.handlers.get(operation.type);
    if (!handler) {
      console.warn(`No handler registered for operation type: ${operation.type}`);
      return false;
    }

    // Update status to syncing
    operation.status = 'syncing';
    operation.attempts++;
    operation.lastAttempt = Date.now();
    await this.storage.set(this.prefix + operation.id, operation);
    this.emit({ type: 'syncing', operation });

    try {
      await handler(operation);

      // Success - mark as synced and remove
      operation.status = 'synced';
      await this.storage.delete(this.prefix + operation.id);
      this.emit({ type: 'synced', operation });
      return true;
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      operation.lastError = error;

      if (operation.attempts >= this.opts.maxRetries) {
        operation.status = 'failed';
        await this.storage.set(this.prefix + operation.id, operation);
        this.emit({ type: 'failed', operation });
        return false;
      }

      // Will retry on next sync
      operation.status = 'pending';
      await this.storage.set(this.prefix + operation.id, operation);
      return false;
    }
  }

  /**
   * Retry a failed operation.
   */
  async retry(id: string): Promise<boolean> {
    const operation = await this.get(id);
    if (!operation || operation.status !== 'failed') {
      return false;
    }

    operation.status = 'pending';
    operation.attempts = 0;
    await this.storage.set(this.prefix + id, operation);

    if (this.online) {
      const result = await this.syncOperation(operation);
      return result;
    }

    return true;
  }

  /**
   * Remove an operation from the queue.
   */
  async remove(id: string): Promise<void> {
    await this.storage.delete(this.prefix + id);
  }

  /**
   * Clear all operations.
   */
  async clear(): Promise<void> {
    const keys = await this.storage.keys(this.prefix);
    for (const key of keys) {
      await this.storage.delete(key);
    }
  }
}

// ==================== Offline-Enabled Client Wrapper ====================

export interface OfflineOptions {
  /** Storage adapter for caching and sync queue */
  storage: StorageAdapter;
  /** Default cache TTL */
  defaultTTL?: number | string;
  /** Whether to serve stale data when offline */
  serveStale?: boolean;
  /** Maximum age of stale data */
  maxStale?: number | string;
}

/**
 * Wrapper that adds offline capabilities to any async function.
 */
export function withOffline<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  cacheKey: (...args: Parameters<T>) => string,
  opts: OfflineOptions & CacheOptions
): T {
  const cache = new CacheManager(opts.storage);

  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const key = cacheKey(...args);

    const result = await cache.getOrFetch(
      key,
      () => fn(...args),
      {
        ttl: opts.ttl ?? opts.defaultTTL,
        staleWhileRevalidate: opts.serveStale ?? true,
        maxStale: opts.maxStale,
        tags: opts.tags,
      }
    );

    return result.data;
  }) as T;
}

// ==================== Utility Functions ====================

/**
 * Parse a duration string (e.g., '1h', '30m', '7d') to milliseconds.
 */
export function parseDuration(duration?: number | string): number | undefined {
  if (typeof duration === 'number') return duration;
  if (!duration) return undefined;

  const match = duration.match(/^(\d+)(ms|s|m|h|d|w)$/);
  if (!match) return undefined;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 'ms': return value;
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    case 'w': return value * 7 * 24 * 60 * 60 * 1000;
    default: return undefined;
  }
}

/**
 * Check if running in a browser environment.
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined';
}

/**
 * Check if running in a Node.js environment.
 */
export function isNode(): boolean {
  return typeof process !== 'undefined' && process.versions?.node !== undefined;
}

/**
 * Create the appropriate storage adapter for the current environment.
 */
export function createStorage(opts: { path?: string; dbName?: string } = {}): StorageAdapter {
  if (isBrowser()) {
    return new IndexedDBStorage(opts.dbName);
  }
  if (isNode() && opts.path) {
    return new FileStorage(opts.path);
  }
  return new MemoryStorage();
}

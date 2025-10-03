/**
 * File system watcher transport
 *
 * Monitors a directory for new files and processes them.
 */

import { watch } from 'fs';
import { readdir, stat, readFile } from 'fs/promises';
import { join } from 'path';
import type { Transport, FileWatcherConfig } from '../types';
import { TransportError } from '../types';

export interface FileEvent {
  type: 'added' | 'modified' | 'deleted';
  path: string;
  filename: string;
  size: number;
  modifiedAt: Date;
}

export type FileEventHandler = (event: FileEvent, data: Uint8Array | null) => Promise<void>;

/**
 * File system watcher transport
 */
export class FileWatcherTransport implements Transport {
  readonly type = 'file' as const;
  private watcher: ReturnType<typeof watch> | null = null;
  private connected: boolean = false;
  private handler: FileEventHandler | null = null;
  private processedFiles = new Set<string>();
  private pollTimer: NodeJS.Timeout | null = null;

  constructor(private readonly config: FileWatcherConfig) {}

  async connect(): Promise<void> {
    // Validate watch path exists
    try {
      const stats = await stat(this.config.watchPath);
      if (!stats.isDirectory()) {
        throw new TransportError('Watch path must be a directory', false);
      }
    } catch (error: any) {
      throw new TransportError(`Watch path invalid: ${error.message}`, false, {
        watchPath: this.config.watchPath,
      });
    }

    this.connected = true;

    // If polling is configured, start polling instead of watching
    if (this.config.pollInterval && this.config.pollInterval > 0) {
      this.startPolling();
    }
  }

  async disconnect(): Promise<void> {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }

    this.handler = null;
    this.connected = false;
    this.processedFiles.clear();
  }

  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Start watching for file changes
   */
  watch(handler: FileEventHandler): void {
    if (!this.connected) {
      throw new TransportError('Transport not connected', false);
    }

    this.handler = handler;

    // If using polling, the handler will be called from poll loop
    if (this.config.pollInterval && this.config.pollInterval > 0) {
      return;
    }

    // Use native fs.watch
    this.watcher = watch(
      this.config.watchPath,
      { recursive: this.config.recursive ?? false },
      async (eventType, filename) => {
        if (!filename) return;

        const fullPath = join(this.config.watchPath, filename);

        // Check if file matches pattern
        if (!this.matchesPattern(filename)) {
          return;
        }

        try {
          const stats = await stat(fullPath);

          if (stats.isDirectory()) {
            return;
          }

          const event: FileEvent = {
            type: eventType === 'rename' ? 'added' : 'modified',
            path: fullPath,
            filename,
            size: stats.size,
            modifiedAt: stats.mtime,
          };

          // Read file data
          const data = await readFile(fullPath);

          // Call handler with Uint8Array
          if (this.handler) {
            await this.handler(event, new Uint8Array(data));
          }

          // Mark as processed
          this.processedFiles.add(fullPath);
        } catch (error) {
          // File might have been deleted or moved
          if (this.handler) {
            await this.handler(
              {
                type: 'deleted',
                path: fullPath,
                filename,
                size: 0,
                modifiedAt: new Date(),
              },
              null
            );
          }
        }
      }
    );
  }

  /**
   * Get list of files currently in watch directory
   */
  async scan(): Promise<Array<{ path: string; filename: string; size: number; modifiedAt: Date }>> {
    if (!this.connected) {
      throw new TransportError('Transport not connected', false);
    }

    return this.scanDirectory(this.config.watchPath);
  }

  /**
   * Process all existing files in the watch directory
   */
  async processExisting(): Promise<void> {
    if (!this.connected || !this.handler) {
      throw new TransportError('Transport not connected or no handler set', false);
    }

    const files = await this.scan();

    for (const file of files) {
      if (this.processedFiles.has(file.path)) {
        continue;
      }

      try {
        const data = await readFile(file.path);

        const event: FileEvent = {
          type: 'added',
          path: file.path,
          filename: file.filename,
          size: file.size,
          modifiedAt: file.modifiedAt,
        };

        await this.handler(event, new Uint8Array(data));
        this.processedFiles.add(file.path);
      } catch (error: any) {
        throw new TransportError(`Failed to process file: ${error.message}`, true, {
          path: file.path,
        });
      }
    }
  }

  // ==================== Private Methods ====================

  private startPolling(): void {
    const pollInterval = this.config.pollInterval || 5000;

    this.pollTimer = setInterval(async () => {
      if (!this.handler) return;

      try {
        const files = await this.scan();

        for (const file of files) {
          // Skip if already processed
          if (this.processedFiles.has(file.path)) {
            continue;
          }

          try {
            const data = await readFile(file.path);

            const event: FileEvent = {
              type: 'added',
              path: file.path,
              filename: file.filename,
              size: file.size,
              modifiedAt: file.modifiedAt,
            };

            if (this.handler) {
              await this.handler(event, new Uint8Array(data));
            }

            this.processedFiles.add(file.path);
          } catch (error) {
            // File might have been deleted, ignore
          }
        }
      } catch (error) {
        // Ignore scanning errors during polling
      }
    }, pollInterval);
  }

  private async scanDirectory(
    dirPath: string
  ): Promise<Array<{ path: string; filename: string; size: number; modifiedAt: Date }>> {
    const results: Array<{ path: string; filename: string; size: number; modifiedAt: Date }> = [];

    try {
      const entries = await readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);

        if (entry.isDirectory()) {
          if (this.config.recursive) {
            const subResults = await this.scanDirectory(fullPath);
            results.push(...subResults);
          }
          continue;
        }

        if (!this.matchesPattern(entry.name)) {
          continue;
        }

        const stats = await stat(fullPath);

        results.push({
          path: fullPath,
          filename: entry.name,
          size: stats.size,
          modifiedAt: stats.mtime,
        });
      }
    } catch (error) {
      // Ignore errors (directory might not be accessible)
    }

    return results;
  }

  private matchesPattern(filename: string): boolean {
    if (!this.config.pattern) {
      return true;
    }

    if (typeof this.config.pattern === 'string') {
      // Simple glob-like matching (*.csv, *.json, etc.)
      const pattern = this.config.pattern.replace(/\./g, '\\.').replace(/\*/g, '.*');
      return new RegExp(`^${pattern}$`).test(filename);
    }

    return this.config.pattern.test(filename);
  }
}

/**
 * Create a file watcher transport instance
 */
export function createFileWatcher(config: FileWatcherConfig): FileWatcherTransport {
  return new FileWatcherTransport(config);
}

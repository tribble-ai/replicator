/**
 * FTP/SFTP transport layer
 *
 * Note: This is a lightweight abstraction. For production use, you'll need to install
 * external libraries like 'ssh2-sftp-client' for SFTP or 'basic-ftp' for FTP.
 *
 * Example installation:
 * ```bash
 * npm install ssh2-sftp-client basic-ftp
 * ```
 */

import type { Transport, FtpTransportConfig } from '../types';
import { TransportError } from '../types';

export interface FtpFile {
  name: string;
  path: string;
  size: number;
  modifiedAt: Date;
  isDirectory: boolean;
}

export interface FtpListOptions {
  path?: string;
  pattern?: string | RegExp;
  recursive?: boolean;
}

export interface FtpDownloadOptions {
  remotePath: string;
  signal?: AbortSignal;
}

/**
 * FTP/SFTP transport abstraction
 *
 * This implementation provides a clean interface that can be backed by
 * different FTP/SFTP client libraries based on your needs.
 */
export class FtpTransport implements Transport {
  readonly type: 'ftp' | 'sftp';
  private client: any; // Will be the actual FTP/SFTP client instance
  private connected: boolean = false;

  constructor(private readonly config: FtpTransportConfig) {
    this.type = config.secure ? 'sftp' : 'ftp';
  }

  async connect(): Promise<void> {
    try {
      if (this.config.secure) {
        await this.connectSftp();
      } else {
        await this.connectFtp();
      }
      this.connected = true;
    } catch (error: any) {
      throw new TransportError(`FTP connection failed: ${error.message}`, true, {
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
      });
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        if (this.config.secure) {
          // SFTP disconnect
          await this.client.end?.();
        } else {
          // FTP disconnect
          await this.client.close?.();
        }
      } catch (error) {
        // Ignore disconnect errors
      }
      this.client = null;
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  /**
   * List files in a directory
   */
  async list(options: FtpListOptions = {}): Promise<FtpFile[]> {
    if (!this.connected) {
      throw new TransportError('Transport not connected', false);
    }

    try {
      const path = options.path || this.config.rootPath || '/';
      const files = await this.listDirectory(path);

      // Filter by pattern if provided
      let filteredFiles = files;
      if (options.pattern) {
        const regex = typeof options.pattern === 'string' ? new RegExp(options.pattern) : options.pattern;
        filteredFiles = files.filter((f) => regex.test(f.name));
      }

      // Handle recursive listing
      if (options.recursive) {
        const allFiles: FtpFile[] = [...filteredFiles];
        const directories = filteredFiles.filter((f) => f.isDirectory);

        for (const dir of directories) {
          const subFiles = await this.list({
            path: dir.path,
            pattern: options.pattern,
            recursive: true,
          });
          allFiles.push(...subFiles);
        }

        return allFiles;
      }

      return filteredFiles;
    } catch (error: any) {
      throw new TransportError(`FTP list failed: ${error.message}`, true, {
        path: options.path,
      });
    }
  }

  /**
   * Download a file
   */
  async download(options: FtpDownloadOptions): Promise<Uint8Array> {
    if (!this.connected) {
      throw new TransportError('Transport not connected', false);
    }

    try {
      if (this.config.secure) {
        // SFTP download - returns Buffer, convert to Uint8Array
        const buffer = await this.client.get(options.remotePath);
        return new Uint8Array(buffer);
      } else {
        // FTP download
        const stream = await this.client.downloadTo(options.remotePath);
        return this.streamToUint8Array(stream);
      }
    } catch (error: any) {
      throw new TransportError(`FTP download failed: ${error.message}`, true, {
        remotePath: options.remotePath,
      });
    }
  }

  /**
   * Download multiple files matching a pattern
   */
  async *downloadBatch(
    options: FtpListOptions = {}
  ): AsyncGenerator<{ file: FtpFile; data: Uint8Array }, void, void> {
    const files = await this.list(options);
    const dataFiles = files.filter((f) => !f.isDirectory);

    for (const file of dataFiles) {
      const data = await this.download({ remotePath: file.path });
      yield { file, data };
    }
  }

  /**
   * Delete a file (optional - use with caution)
   */
  async delete(remotePath: string): Promise<void> {
    if (!this.connected) {
      throw new TransportError('Transport not connected', false);
    }

    try {
      if (this.config.secure) {
        await this.client.delete(remotePath);
      } else {
        await this.client.remove(remotePath);
      }
    } catch (error: any) {
      throw new TransportError(`FTP delete failed: ${error.message}`, true, {
        remotePath,
      });
    }
  }

  // ==================== Private Methods ====================

  private async connectSftp(): Promise<void> {
    // This is where you'd initialize the SFTP client
    // Example with ssh2-sftp-client:
    //
    // const Client = require('ssh2-sftp-client');
    // this.client = new Client();
    // await this.client.connect({
    //   host: this.config.host,
    //   port: this.config.port || 22,
    //   username: this.config.username,
    //   password: this.config.password,
    //   privateKey: this.config.privateKey,
    //   passphrase: this.config.passphrase,
    // });

    throw new TransportError(
      'SFTP support requires ssh2-sftp-client package. Install it with: npm install ssh2-sftp-client',
      false
    );
  }

  private async connectFtp(): Promise<void> {
    // This is where you'd initialize the FTP client
    // Example with basic-ftp:
    //
    // const { Client } = require('basic-ftp');
    // this.client = new Client();
    // await this.client.access({
    //   host: this.config.host,
    //   port: this.config.port || 21,
    //   user: this.config.username,
    //   password: this.config.password,
    //   secure: false,
    // });

    throw new TransportError(
      'FTP support requires basic-ftp package. Install it with: npm install basic-ftp',
      false
    );
  }

  private async listDirectory(path: string): Promise<FtpFile[]> {
    // Implementation depends on the FTP library being used
    // Example with ssh2-sftp-client (SFTP):
    //
    // const list = await this.client.list(path);
    // return list.map((item) => ({
    //   name: item.name,
    //   path: `${path}/${item.name}`,
    //   size: item.size,
    //   modifiedAt: new Date(item.modifyTime),
    //   isDirectory: item.type === 'd',
    // }));

    throw new TransportError('FTP client not initialized', false);
  }

  private streamToUint8Array(stream: any): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const chunks: Uint8Array[] = [];
      stream.on('data', (chunk: Uint8Array) => chunks.push(chunk));
      stream.on('end', () => {
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
          result.set(chunk, offset);
          offset += chunk.length;
        }
        resolve(result);
      });
      stream.on('error', reject);
    });
  }
}

/**
 * Create an FTP transport instance
 */
export function createFtpTransport(config: FtpTransportConfig): FtpTransport {
  return new FtpTransport(config);
}

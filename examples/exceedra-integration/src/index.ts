#!/usr/bin/env node
/**
 * exceedra Integration Main Entry Point
 *
 * Demonstrates production-ready integration with exceedra REST API using Tribble SDK.
 * Supports:
 * - Manual sync (one-time execution)
 * - Scheduled sync (cron-based)
 * - Full sync and incremental sync modes
 * - Configuration validation
 */

import { TribbleClient } from '@tribble/sdk-core';
import { IngestClient } from '@tribble/sdk-ingest';
import { createScheduler, describeCronSchedule } from '@tribble/sdk-integrations';
import { createexceedraConnector, type exceedraDataSource } from './exceedra-connector.js';
import { getConfig, type exceedraConfig } from './config.js';

/**
 * Create Tribble client from configuration
 */
function createTribbleClient(config: exceedraConfig): TribbleClient {
  return new TribbleClient({
    brain: {
      baseUrl: config.tribble.brainUrl,
      tokenProvider: async () => config.tribble.apiKey,
    },
    ingest: {
      baseUrl: config.tribble.ingestUrl,
      tokenProvider: async () => config.tribble.apiKey,
    },
  });
}

/**
 * Run a sync operation
 */
async function runSync(options: {
  fullSync?: boolean;
  incremental?: boolean;
  sources?: exceedraDataSource[];
}) {
  const config = getConfig();

  console.log('🚀 Starting exceedra integration...\n');

  // Display configuration
  console.log('Configuration:');
  console.log(`  exceedra API: ${config.exceedra.baseUrl}`);
  console.log(`  Tribble Brain: ${config.tribble.brainUrl}`);
  console.log(`  Tribble Ingest: ${config.tribble.ingestUrl}`);
  console.log(`  Data Sources: ${options.sources?.join(', ') || config.sync.sources.join(', ')}`);
  console.log(`  Batch Size: ${config.sync.batchSize}`);
  console.log(`  Max Retries: ${config.sync.maxRetries}`);
  console.log(`  Checkpoint File: ${config.sync.checkpointFile}`);
  console.log(`  Sync Mode: ${options.fullSync ? 'Full' : 'Incremental'}\n`);

  // Create Tribble client
  const tribbleClient = createTribbleClient(config);

  // Create exceedra connector
  const connector = createexceedraConnector(
    {
      baseUrl: config.exceedra.baseUrl,
      clientId: config.exceedra.clientId,
      clientSecret: config.exceedra.clientSecret,
      tokenEndpoint: config.exceedra.tokenEndpoint,
      accessToken: config.exceedra.accessToken,
      refreshToken: config.exceedra.refreshToken,
      expiresAt: config.exceedra.expiresAt,
    },
    {
      sources: options.sources || config.sync.sources as exceedraDataSource[],
      batchSize: config.sync.batchSize,
      maxRetries: config.sync.maxRetries,
      checkpointFile: config.sync.checkpointFile,
      enableCheckpointPersistence: config.sync.enableCheckpointPersistence,
      rateLimit: config.rateLimit?.requestsPerSecond,
    }
  );

  // Initialize connector
  await connector.initialize({
    tribble: {
      ingest: tribbleClient.ingest,
    },
    config: {
      debugLogging: config.advanced.debugLogging,
    },
    logger: {
      debug: (msg, meta) => {
        if (config.advanced.debugLogging) {
          console.debug(`[DEBUG] ${msg}`, meta || '');
        }
      },
      info: (msg, meta) => console.log(`[INFO] ${msg}`, meta || ''),
      warn: (msg, meta) => console.warn(`[WARN] ${msg}`, meta || ''),
      error: (msg, error, meta) => console.error(`[ERROR] ${msg}`, error, meta || ''),
    },
  });

  // Run sync
  console.log('🔄 Starting sync operation...\n');

  const startTime = Date.now();
  const result = await connector.pull({
    fullSync: options.fullSync || false,
  });
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  // Display results
  console.log('\n✅ Sync completed!\n');
  console.log('Results:');
  console.log(`  Documents Processed: ${result.documentsProcessed}`);
  console.log(`  Documents Uploaded: ${result.documentsUploaded}`);
  console.log(`  Errors: ${result.errors}`);
  console.log(`  Duration: ${duration}s`);

  if (result.checkpoint) {
    console.log(`  Checkpoint: ${result.checkpoint}`);
  }

  if (result.errorDetails && result.errorDetails.length > 0) {
    console.log('\nErrors:');
    result.errorDetails.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error.message}`);
      if (error.context && config.advanced.debugLogging) {
        console.log(`     Context:`, error.context);
      }
    });
  }

  // Disconnect
  await connector.disconnect();

  console.log('\n👋 Integration completed successfully!');

  // Exit with error code if there were errors
  if (result.errors > 0) {
    process.exit(1);
  }
}

/**
 * Run scheduled sync
 */
async function runScheduled() {
  const config = getConfig();

  console.log('⏰ Starting scheduled exceedra integration...\n');
  console.log('Configuration:');
  console.log(`  Schedule: ${config.sync.schedule} (${describeCronSchedule(config.sync.schedule)})`);
  console.log(`  Data Sources: ${config.sync.sources.join(', ')}`);
  console.log(`  Batch Size: ${config.sync.batchSize}`);
  console.log(`  Checkpoint File: ${config.sync.checkpointFile}\n`);

  // Create Tribble client
  const tribbleClient = createTribbleClient(config);

  // Create exceedra connector
  const connector = createexceedraConnector(
    {
      baseUrl: config.exceedra.baseUrl,
      clientId: config.exceedra.clientId,
      clientSecret: config.exceedra.clientSecret,
      tokenEndpoint: config.exceedra.tokenEndpoint,
      accessToken: config.exceedra.accessToken,
      refreshToken: config.exceedra.refreshToken,
      expiresAt: config.exceedra.expiresAt,
    },
    {
      sources: config.sync.sources as exceedraDataSource[],
      batchSize: config.sync.batchSize,
      maxRetries: config.sync.maxRetries,
      checkpointFile: config.sync.checkpointFile,
      enableCheckpointPersistence: config.sync.enableCheckpointPersistence,
      rateLimit: config.rateLimit?.requestsPerSecond,
    }
  );

  // Initialize connector
  await connector.initialize({
    tribble: {
      ingest: tribbleClient.ingest,
    },
    config: {
      debugLogging: config.advanced.debugLogging,
    },
    logger: {
      debug: (msg, meta) => {
        if (config.advanced.debugLogging) {
          console.debug(`[DEBUG] ${msg}`, meta || '');
        }
      },
      info: (msg, meta) => console.log(`[INFO] ${msg}`, meta || ''),
      warn: (msg, meta) => console.warn(`[WARN] ${msg}`, meta || ''),
      error: (msg, error, meta) => console.error(`[ERROR] ${msg}`, error, meta || ''),
    },
  });

  // Create scheduler
  const scheduler = createScheduler({
    schedule: config.sync.schedule,
    timezone: 'UTC',
  });

  // Register sync task
  scheduler.on('tick', async () => {
    console.log(`\n🔄 [${new Date().toISOString()}] Starting scheduled sync...\n`);

    try {
      const startTime = Date.now();
      const result = await connector.pull({ fullSync: false });
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log(`\n✅ [${new Date().toISOString()}] Sync completed!`);
      console.log(`  Processed: ${result.documentsProcessed}, Uploaded: ${result.documentsUploaded}, Errors: ${result.errors}, Duration: ${duration}s`);

      if (result.errors > 0 && result.errorDetails) {
        console.log(`  Error details: ${result.errorDetails.length} errors occurred`);
      }
    } catch (error: any) {
      console.error(`\n❌ [${new Date().toISOString()}] Sync failed:`, error.message);
    }
  });

  // Handle shutdown gracefully
  const shutdown = async () => {
    console.log('\n\n🛑 Shutting down...');
    scheduler.stop();
    await connector.disconnect();
    console.log('👋 Shutdown complete');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Start scheduler
  scheduler.start();

  console.log('✅ Scheduler started. Press Ctrl+C to stop.\n');
  console.log(`Next sync will run: ${describeCronSchedule(config.sync.schedule)}`);
}

/**
 * Validate configuration and API connectivity
 */
async function validate() {
  const config = getConfig();

  console.log('🔍 Validating exceedra integration configuration...\n');

  // Validate configuration
  console.log('✅ Configuration loaded successfully');
  console.log(`  exceedra API: ${config.exceedra.baseUrl}`);
  console.log(`  Token Endpoint: ${config.exceedra.tokenEndpoint}`);
  console.log(`  Data Sources: ${config.sync.sources.join(', ')}`);

  // Create Tribble client
  const tribbleClient = createTribbleClient(config);

  // Create exceedra connector
  const connector = createexceedraConnector(
    {
      baseUrl: config.exceedra.baseUrl,
      clientId: config.exceedra.clientId,
      clientSecret: config.exceedra.clientSecret,
      tokenEndpoint: config.exceedra.tokenEndpoint,
      accessToken: config.exceedra.accessToken,
      refreshToken: config.exceedra.refreshToken,
      expiresAt: config.exceedra.expiresAt,
    },
    {
      sources: config.sync.sources as exceedraDataSource[],
      batchSize: config.sync.batchSize,
      maxRetries: config.sync.maxRetries,
      checkpointFile: config.sync.checkpointFile,
      enableCheckpointPersistence: config.sync.enableCheckpointPersistence,
      rateLimit: config.rateLimit?.requestsPerSecond,
    }
  );

  // Initialize connector
  await connector.initialize({
    tribble: {
      ingest: tribbleClient.ingest,
    },
    config: {},
  });

  // Validate API connectivity
  console.log('\n🔄 Testing API connectivity...');
  const isValid = await connector.validate();

  await connector.disconnect();

  if (isValid) {
    console.log('\n✅ Validation successful! All systems operational.');
    process.exit(0);
  } else {
    console.log('\n❌ Validation failed. Please check your configuration and API credentials.');
    process.exit(1);
  }
}

/**
 * Display help message
 */
function displayHelp() {
  console.log(`
exceedra Integration - Tribble SDK Example

Usage:
  npm run dev                       Run one-time incremental sync
  npm run sync                      Run one-time incremental sync
  npm run sync:full                 Run one-time full sync
  npm run sync:incremental          Run one-time incremental sync
  npm run validate                  Validate configuration and API connectivity

Commands:
  sync [options]                    Run a sync operation
    --full                          Run full sync (ignore checkpoints)
    --incremental                   Run incremental sync (default)
    --sources <sources>             Comma-separated list of sources (documents,products,retailers)

  schedule                          Run scheduled syncs based on cron configuration
  validate                          Validate configuration and API connectivity
  help                              Display this help message

Examples:
  npm run sync                                     # Incremental sync
  npm run sync:full                                # Full sync
  tsx src/index.ts sync --sources documents        # Sync only documents
  tsx src/index.ts schedule                        # Start scheduled syncs

Environment Variables:
  See .env.example for required configuration variables.

For more information, see README.md
`);
}

/**
 * Main CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'sync';

  try {
    switch (command) {
      case 'sync': {
        const fullSync = args.includes('--full');
        const incremental = args.includes('--incremental');
        const sourcesIndex = args.indexOf('--sources');
        const sources =
          sourcesIndex !== -1 && args[sourcesIndex + 1]
            ? (args[sourcesIndex + 1].split(',') as exceedraDataSource[])
            : undefined;

        await runSync({ fullSync, incremental, sources });
        break;
      }

      case 'schedule':
        await runScheduled();
        break;

      case 'validate':
        await validate();
        break;

      case 'help':
      case '--help':
      case '-h':
        displayHelp();
        break;

      default:
        console.error(`Unknown command: ${command}`);
        displayHelp();
        process.exit(1);
    }
  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { runSync, runScheduled, validate };

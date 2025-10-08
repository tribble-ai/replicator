import { defineConnector } from '@tribble/sdk-connectors'

export default defineConnector({
  name: 'csv-local',
  syncStrategy: 'pull',
  async pull(ctx, { since }) {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const file = ctx.config.file || 'data.csv';
    const full = path.resolve(file);
    const content = await fs.readFile(full);
    await ctx.tribble.ingest.uploadStructuredData({
      data: content,
      format: 'csv',
      filename: path.basename(full),
      metadata: { source: 'local-csv', since }
    })
    return { processed: 1, total: 1 }
  }
})


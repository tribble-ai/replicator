# exceedra Integration - Quick Start Guide

Get up and running with the exceedra integration in 5 minutes.

## 1. Prerequisites

- Node.js 18+ installed
- Tribble API key
- exceedra API credentials

## 2. Setup

```bash
# Navigate to example directory
cd examples/exceedra-integration

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

## 3. Configure

Edit `.env` with your credentials:

```bash
# exceedra API
exceedra_BASE_URL=https://api.exceedra.com
exceedra_CLIENT_ID=your-client-id
exceedra_CLIENT_SECRET=your-client-secret
exceedra_TOKEN_ENDPOINT=https://auth.exceedra.com/oauth/token

# Tribble
TRIBBLE_API_KEY=your-api-key
TRIBBLE_BRAIN_URL=https://brain.tribble.ai
TRIBBLE_INGEST_URL=https://ingest.tribble.ai

# What to sync (comma-separated)
SYNC_SOURCES=documents,products
```

## 4. Validate

Test your configuration:

```bash
npm run validate
```

You should see:
```
✅ Configuration loaded successfully
✅ Validation successful! All systems operational.
```

## 5. Run Your First Sync

```bash
npm run sync
```

You should see:
```
🚀 Starting exceedra integration...
🔄 Starting sync operation...
✅ Sync completed!

Results:
  Documents Processed: 150
  Documents Uploaded: 150
  Errors: 0
  Duration: 12.34s
```

## 6. Enable Scheduled Syncs

For continuous syncs every 6 hours:

```bash
npm run schedule
```

Stop with `Ctrl+C`.

## Common Commands

```bash
# One-time sync (incremental)
npm run sync

# Full sync (re-sync everything)
npm run sync:full

# Sync only documents
tsx src/index.ts sync --sources documents

# Validate configuration
npm run validate

# Run tests
npm test
```

## Troubleshooting

### "Missing required environment variables"
- Copy `.env.example` to `.env`
- Fill in all required values

### "Authentication validation failed"
- Check your `exceedra_CLIENT_ID` and `exceedra_CLIENT_SECRET`
- Verify `exceedra_TOKEN_ENDPOINT` is correct

### "Upload failed"
- Verify `TRIBBLE_API_KEY` is valid
- Check `TRIBBLE_INGEST_URL` is accessible

### Rate limiting errors
- Reduce `RATE_LIMIT_REQUESTS_PER_SECOND` in `.env`
- Contact exceedra support for higher limits

## Next Steps

1. Review the full [README.md](./README.md) for detailed documentation
2. Customize transformers in `src/transformers.ts`
3. Adjust sync schedule in `.env`: `SYNC_SCHEDULE=0 */6 * * *`
4. Add monitoring and alerting
5. Deploy to production (Docker, Kubernetes, Lambda)

## Getting Help

- Read the [README.md](./README.md) for comprehensive documentation
- Check the [test/integration.test.ts](./test/integration.test.ts) for examples
- Review Tribble SDK documentation
- Contact Tribble support

---

**Ready to sync!** 🚀

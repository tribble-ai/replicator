# exceedra Integration Example - File Index

Complete reference to all files in this example.

## Quick Navigation

| Document | Purpose | Size |
|----------|---------|------|
| [QUICKSTART.md](./QUICKSTART.md) | Get started in 5 minutes | 2.6 KB |
| [README.md](./README.md) | Comprehensive guide | 17 KB |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Design patterns & architecture | 22 KB |
| [SUMMARY.md](./SUMMARY.md) | Overview & checklist | 6 KB |

## Directory Structure

```
examples/exceedra-integration/
│
├── 📚 Documentation
│   ├── INDEX.md                 (this file - file guide)
│   ├── QUICKSTART.md            (5-minute getting started)
│   ├── README.md                (comprehensive documentation)
│   ├── ARCHITECTURE.md          (design patterns & architecture)
│   └── SUMMARY.md               (overview & checklist)
│
├── 🔧 Configuration
│   ├── package.json             (dependencies & scripts)
│   ├── tsconfig.json            (TypeScript configuration)
│   ├── .env.example             (environment variable template)
│   └── .gitignore               (git ignore rules)
│
├── 💻 Source Code (src/)
│   ├── index.ts                 (CLI entry point - 399 lines)
│   ├── config.ts                (configuration management - 146 lines)
│   ├── exceedra-connector.ts     (core integration logic - 533 lines)
│   └── transformers.ts          (data transformation - 268 lines)
│
└── 🧪 Tests (test/)
    └── integration.test.ts      (integration tests - 278 lines)
```

## File Descriptions

### 📚 Documentation Files

#### QUICKSTART.md
**Purpose**: Get up and running in 5 minutes
**Contents**:
- Prerequisites
- Setup steps (5 steps)
- Validation
- First sync
- Common commands
- Troubleshooting

**When to use**: First time using this integration

---

#### README.md
**Purpose**: Comprehensive documentation
**Contents**:
- Overview & features
- Architecture diagram
- Installation & configuration
- Usage examples
- Code structure
- Key concepts
- Testing
- Deployment options
- Best practices
- Troubleshooting
- Extension guide

**When to use**: Deep dive, reference, troubleshooting

---

#### ARCHITECTURE.md
**Purpose**: Architectural patterns and design decisions
**Contents**:
- High-level architecture
- Component responsibilities
- Design patterns (Template Method, Strategy, Factory, Adapter)
- Data flow diagrams
- Checkpointing strategy
- Rate limiting strategy
- Retry strategy
- Testing strategy
- Performance considerations
- Security considerations
- Extension points

**When to use**: Understanding design, extending functionality

---

#### SUMMARY.md
**Purpose**: Quick overview and checklist
**Contents**:
- Feature summary
- SDK primitives used
- Architecture highlights
- Usage examples
- Deployment options
- Extension points
- Customer checklist

**When to use**: Quick reference, checklist for your integration

---

### 🔧 Configuration Files

#### package.json
**Purpose**: NPM package configuration
**Contents**:
- Package name and version
- Dependencies (Tribble SDK packages)
- Scripts (build, dev, sync, test)
- TypeScript and testing tools

**Scripts available**:
```bash
npm run build              # Compile TypeScript
npm run dev                # Run in development
npm run sync               # Run incremental sync
npm run sync:full          # Run full sync
npm run validate           # Validate configuration
npm test                   # Run tests
```

---

#### tsconfig.json
**Purpose**: TypeScript compiler configuration
**Contents**:
- Compilation options (ESNext, ES2022)
- Output directory (dist/)
- Source directory (src/)
- Type checking settings

---

#### .env.example
**Purpose**: Environment variable template
**Contents**:
- exceedra API configuration
- OAuth2 credentials
- Tribble configuration
- Sync settings (schedule, batch size, sources)
- Optional settings (rate limiting, debug logging)

**Usage**:
```bash
cp .env.example .env
# Edit .env with your credentials
```

---

#### .gitignore
**Purpose**: Git ignore rules
**Contents**:
- Node modules
- Build output
- Environment files
- Checkpoint files
- Logs and temporary files

---

### 💻 Source Code Files

#### src/index.ts (399 lines)
**Purpose**: CLI entry point and application orchestration

**Key Functions**:
- `main()` - CLI entry point
- `runSync()` - Execute one-time sync
- `runScheduled()` - Execute scheduled syncs
- `validate()` - Validate configuration
- `displayHelp()` - Show help message

**Responsibilities**:
- Parse command-line arguments
- Load configuration
- Create Tribble client
- Initialize connector
- Display results
- Handle errors

**CLI Commands**:
```bash
tsx src/index.ts sync [--full|--incremental] [--sources <list>]
tsx src/index.ts schedule
tsx src/index.ts validate
tsx src/index.ts help
```

---

#### src/config.ts (146 lines)
**Purpose**: Configuration management with validation

**Key Functions**:
- `loadConfig()` - Load and validate configuration
- `getConfig()` - Get singleton instance
- `validateConfig()` - Validate required variables
- `parseSyncSources()` - Parse sources from string

**Configuration Structure**:
```typescript
interface exceedraConfig {
  exceedra: {
    baseUrl, clientId, clientSecret, tokenEndpoint
  };
  tribble: {
    apiKey, brainUrl, ingestUrl
  };
  sync: {
    schedule, sources, batchSize, maxRetries, checkpointFile
  };
  rateLimit?: { requestsPerSecond };
  advanced: { debugLogging };
}
```

---

#### src/exceedra-connector.ts (533 lines)
**Purpose**: Core integration logic

**Key Classes**:
- `exceedraConnector` - Main connector (extends BaseConnector)
- `exceedraTransformer` - Custom transformer

**Key Methods**:
- `pull()` - Main sync operation
- `validate()` - Validate API connectivity
- `syncDataSource()` - Sync single source
- `rateLimitedRequest()` - Rate-limited API call
- `loadCheckpoints()` / `saveCheckpoints()` - Checkpoint management

**Features Implemented**:
- OAuth2 authentication
- Pagination handling
- Rate limiting
- Retry with backoff
- Checkpoint persistence
- Error handling
- Multi-source sync

---

#### src/transformers.ts (268 lines)
**Purpose**: Data transformation functions

**Key Interfaces**:
- `exceedraDocument` - Document API response
- `exceedraProduct` - Product API response
- `exceedraRetailer` - Retailer API response

**Key Functions**:
- `transformDocuments()` - Transform documents
- `transformProducts()` - Transform products
- `transformRetailers()` - Transform retailers
- `transformexceedraData()` - Generic router

**Transformation Pattern**:
```typescript
exceedraFormat → {
  data: enrichedContent,
  metadata: searchableMetadata,
  filename: generatedFilename,
  contentType: 'application/json'
}
```

---

### 🧪 Test Files

#### test/integration.test.ts (278 lines)
**Purpose**: Integration tests for transformers and connector

**Test Suites**:
1. **Document Transformation**
   - Single document transform
   - Multiple documents
   - Metadata extraction

2. **Product Transformation**
   - Product with specifications
   - Searchable summary generation
   - Metadata extraction

3. **Retailer Transformation**
   - Retailer with contact info
   - Address formatting
   - Product associations

4. **Error Handling**
   - Unknown data types
   - Invalid inputs

5. **Connector Integration** (TODO)
   - OAuth2 authentication
   - Pagination
   - Rate limiting
   - Checkpointing

**Run Tests**:
```bash
npm test                  # Run once
npm run test:watch        # Watch mode
```

---

## Usage Workflows

### First-Time Setup
```
1. Read QUICKSTART.md
2. Copy .env.example → .env
3. Edit .env with credentials
4. Run: npm run validate
5. Run: npm run sync
```

### Daily Usage
```
1. npm run sync           (manual sync)
2. npm run schedule       (continuous)
```

### Customization
```
1. Read ARCHITECTURE.md
2. Modify src/transformers.ts
3. Update src/config.ts
4. Test: npm test
5. Deploy
```

### Troubleshooting
```
1. Check README.md troubleshooting section
2. Enable debug: ENABLE_DEBUG_LOGGING=true npm run sync
3. Check logs and error messages
4. Review .exceedra-checkpoint.json
```

## Learning Path

### Beginner
1. **Start here**: QUICKSTART.md
2. **Follow steps**: Setup → Validate → Sync
3. **Read**: README.md overview and usage sections

### Intermediate
1. **Read**: README.md key concepts
2. **Review**: src/index.ts and src/config.ts
3. **Understand**: How configuration flows to connector

### Advanced
1. **Read**: ARCHITECTURE.md
2. **Study**: src/exceedra-connector.ts
3. **Understand**: Design patterns, error handling, checkpointing
4. **Customize**: src/transformers.ts for your needs

### Expert
1. **Extend**: Add new data sources
2. **Optimize**: Performance tuning
3. **Deploy**: Production deployment patterns
4. **Monitor**: Add metrics and alerts

## Related Resources

### Tribble SDK Packages
- `@tribble/sdk-core` - Core client ([docs](../../packages/core/))
- `@tribble/sdk-ingest` - Ingestion ([docs](../../packages/ingest/))
- `@tribble/sdk-integrations` - Integration primitives ([docs](../../packages/integrations/))

### External Documentation
- exceedra API: (your exceedra API documentation)
- OAuth2 RFC: https://www.rfc-editor.org/rfc/rfc6749
- Cron expressions: https://crontab.guru

## Support

### Documentation
- Start with QUICKSTART.md for basic setup
- Refer to README.md for comprehensive guide
- Check ARCHITECTURE.md for design patterns
- Use SUMMARY.md as quick reference

### Code Examples
- Check test/ for usage examples
- Review src/index.ts for CLI patterns
- Study src/exceedra-connector.ts for integration patterns

### Getting Help
1. Review documentation thoroughly
2. Check error messages and logs
3. Enable debug logging
4. Contact Tribble support

---

**Navigation Tips**:
- 📚 = Documentation
- 🔧 = Configuration
- 💻 = Source Code
- 🧪 = Tests

**File Sizes**:
- Documentation: ~47 KB
- Source Code: ~1,400 lines
- Tests: ~280 lines
- Total: Production-ready reference implementation

---

Last Updated: 2024-10-03

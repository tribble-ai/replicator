#!/usr/bin/env node
import { createTribble } from '@tribble/sdk';

function usage() {
  console.log(`
tribble - Tribble Platform CLI

Usage:
  tribble <command> [subcommand] [options]

Commands:
  ext init [name]           Initialize a new extension project
  ext validate              Validate extension manifest and code
  ext plan                  Show execution plan for extension
  ext test                  Run extension tests
  ext publish               Publish extension to platform
  ext promote               Promote extension to next environment
  ext freeze                Freeze extension version
  ext migrate               Migrate extension to new platform version

  upload <file>             Upload a document to the brain
  connectors list           List available connectors
  connectors status         Check connector health
  runner                    Run extension locally

  workflows trigger <slug>  Trigger a workflow (legacy)
  ingest upload             Upload a document (legacy)

Extension Options:
  --name <name>             Extension name
  --version <version>       Extension version
  --env <env>               Target environment (development|staging|production)
  --policy <policy>         Policy to validate against (enterprise|development|sandbox)
  --dry-run                 Show what would happen without making changes

Upload Options:
  --base-url <url>          Ingest API base URL
  --token <token>           Authentication token
  --metadata <json>         Metadata as JSON string

Environment Variables:
  TRIBBLE_API_TOKEN         Bearer token for platform authentication
  TRIBBLE_API_URL           Platform API URL (default: https://app.tribble.ai/api)

Examples:
  # Initialize a new extension
  tribble ext init my-sales-kit

  # Validate extension
  tribble ext validate --policy enterprise

  # Test extension locally
  tribble ext test

  # Publish to development
  tribble ext publish --env development

  # Upload a document
  tribble upload ./data.pdf --base-url https://ingest.tribble.ai --token $TOKEN

  # Run extension locally
  tribble runner
`);
}

async function main() {
  const [cmd, subcmd, ...rest] = process.argv.slice(2);

  if (!cmd || cmd === '--help' || cmd === '-h') {
    return usage();
  }

  const args = parseArgs(rest);

  // Extension commands
  if (cmd === 'ext') {
    switch (subcmd) {
      case 'init':
        return extInit(rest, args);
      case 'validate':
        return extValidate(args);
      case 'plan':
        return extPlan(args);
      case 'test':
        return extTest(args);
      case 'publish':
        return extPublish(args);
      case 'promote':
        return extPromote(args);
      case 'freeze':
        return extFreeze(args);
      case 'migrate':
        return extMigrate(args);
      default:
        console.error(`Unknown ext command: ${subcmd}`);
        return usage();
    }
  }

  // Upload command
  if (cmd === 'upload') {
    return uploadDocument(subcmd, args);
  }

  // Connectors commands
  if (cmd === 'connectors') {
    switch (subcmd) {
      case 'list':
        return connectorsList(args);
      case 'status':
        return connectorsStatus(args);
      default:
        console.error(`Unknown connectors command: ${subcmd}`);
        return usage();
    }
  }

  // Runner command
  if (cmd === 'runner') {
    return runExtension(args);
  }

  // Legacy: workflows trigger
  if (cmd === 'workflows' && subcmd === 'trigger') {
    const endpoint = args['--endpoint'];
    const secret = args['--secret'];
    const slug = rest.find((a) => !a.startsWith('--'));
    const input = args['--input'] ? JSON.parse(args['--input']) : {};

    if (!endpoint || !secret || !slug) {
      console.error('Error: Missing required arguments for workflows trigger');
      console.error('Required: --endpoint, --secret, and workflow slug');
      process.exit(1);
    }

    const tribble = createTribble({
      agent: { baseUrl: 'https://placeholder', token: 'x', email: 'cli@tribble' },
      workflows: { endpoint, signingSecret: secret },
    });

    const res = await tribble.workflows.trigger({ slug, input });
    console.log(JSON.stringify(res, null, 2));
    return;
  }

  // Legacy: ingest upload
  if (cmd === 'ingest' && subcmd === 'upload') {
    const baseUrl = args['--base-url'];
    const token = args['--token'];
    const file = args['--file'];
    const metadata = args['--metadata'] ? JSON.parse(args['--metadata']) : {};

    if (!baseUrl || !token || !file) {
      console.error('Error: Missing required arguments for ingest upload');
      console.error('Required: --base-url, --token, --file');
      process.exit(1);
    }

    const fs = await import('node:fs/promises');
    const data = await fs.readFile(file);
    const filename = file.split('/').pop() || 'file.pdf';

    const tribble = createTribble({
      agent: { baseUrl: 'https://placeholder', token: 'x', email: 'cli@tribble' },
      ingest: { baseUrl, tokenProvider: async () => token },
    });

    const res = await tribble.ingest.uploadPDF({ file: data, filename, metadata });
    console.log(JSON.stringify(res, null, 2));
    return;
  }

  console.error(`Unknown command: ${cmd}`);
  usage();
  process.exit(1);
}

// ==================== Extension Commands ====================

async function extInit(positional: string[], args: Record<string, string>) {
  const name = positional.find(a => !a.startsWith('--')) || args['--name'] || 'my-extension';
  const fs = await import('node:fs/promises');
  const path = await import('node:path');

  console.log(`\n Initializing Tribble extension: ${name}\n`);

  const extDir = path.resolve(process.cwd(), name);

  // Create directory structure
  await fs.mkdir(extDir, { recursive: true });
  await fs.mkdir(path.join(extDir, 'src'), { recursive: true });
  await fs.mkdir(path.join(extDir, 'src/tools'), { recursive: true });
  await fs.mkdir(path.join(extDir, 'src/integrations'), { recursive: true });
  await fs.mkdir(path.join(extDir, 'src/cartridges'), { recursive: true });
  await fs.mkdir(path.join(extDir, 'tests'), { recursive: true });

  // Create package.json
  const packageJson = {
    name: `@company/${name}`,
    version: '0.1.0',
    description: `Tribble extension: ${name}`,
    type: 'module',
    main: 'dist/index.js',
    types: 'dist/index.d.ts',
    scripts: {
      build: 'tsup src/index.ts --format esm --dts --clean',
      test: 'tribble ext test',
      validate: 'tribble ext validate',
      publish: 'tribble ext publish',
    },
    dependencies: {
      '@tribble/sdk-extensions': '^0.1.0',
      zod: '^3.23.0',
    },
    devDependencies: {
      '@tribble/sdk-test': '^0.1.0',
      '@tribble/sdk-runner': '^0.1.0',
      tsup: '^8.0.0',
      typescript: '^5.0.0',
    },
  };
  await fs.writeFile(path.join(extDir, 'package.json'), JSON.stringify(packageJson, null, 2));

  // Create tsconfig.json
  const tsconfig = {
    compilerOptions: {
      target: 'ES2022',
      module: 'ES2020',
      moduleResolution: 'Bundler',
      lib: ['ES2022'],
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      outDir: 'dist',
      declaration: true,
    },
    include: ['src'],
  };
  await fs.writeFile(path.join(extDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));

  // Create main index.ts
  const indexTs = `import { z } from 'zod';
import { ToolBuilder, IntegrationBuilder, CartridgeBuilder, ExtensionBundle } from '@tribble/sdk-extensions';

// ==================== Tools ====================

const exampleTool = new ToolBuilder('example_search')
  .description('Search for example data')
  .parameter('query', z.string(), 'Search query')
  .parameter('limit', z.number().optional(), 'Maximum results to return')
  .category('search')
  .handler(async (args, ctx) => {
    ctx.services.logger.info('Executing example search', { query: args.query });

    // Use brain search
    const results = await ctx.services.brain.search(args.query, { limit: args.limit });

    return {
      content: JSON.stringify(results, null, 2),
      citations: results.flatMap(r => r.citations || []),
    };
  })
  .build();

// ==================== Integrations ====================

// Add your integrations here
// const myIntegration = new IntegrationBuilder('my-integration')
//   .displayName('My Integration')
//   .oauth2({ ... })
//   .build();

// ==================== Cartridges ====================

const exampleCartridge = new CartridgeBuilder('example-assistant')
  .displayName('Example Assistant')
  .description('A helpful assistant for example tasks')
  .model('gpt-4o')
  .tools(['example_search'])
  .promptTemplate(\`
You are a helpful assistant.

Use the available tools to help the user with their request.
Always provide accurate and helpful information.
  \`)
  .build();

// ==================== Extension Bundle ====================

const extension = new ExtensionBundle({
  name: '${name}',
  version: '0.1.0',
  description: 'My Tribble extension',
  author: 'Company Name',
  platformVersion: '>=2.0.0',
})
  .addTool(exampleTool)
  .addCartridge(exampleCartridge);

export default extension.build();
`;
  await fs.writeFile(path.join(extDir, 'src/index.ts'), indexTs);

  // Create test file
  const testTs = `import { ExtensionTestSuite } from '@tribble/sdk-test';
import extension from '../src/index';

const suite = new ExtensionTestSuite(extension);

suite.test('example_search returns results', async (ctx) => {
  const tool = ctx.getTool('example_search');

  // Mock brain search results
  // tool.withContext(c => c.brain(mockBrain));

  const result = await tool.invoke({ query: 'test query' });

  tool.assertSuccess(result);
});

suite.test('extension validates successfully', async (ctx) => {
  // Extension validation is automatic
  console.log('Extension:', ctx.manifest.name, ctx.manifest.version);
});

// Run tests
suite.run().then(results => {
  console.log(suite.formatResults(results));
  process.exit(results.failed > 0 ? 1 : 0);
});
`;
  await fs.writeFile(path.join(extDir, 'tests/extension.test.ts'), testTs);

  // Create README
  const readme = `# ${name}

A Tribble platform extension.

## Getting Started

\`\`\`bash
# Install dependencies
npm install

# Build the extension
npm run build

# Validate the extension
npm run validate

# Run tests
npm run test

# Publish to Tribble platform
npm run publish
\`\`\`

## Structure

- \`src/index.ts\` - Main extension entry point
- \`src/tools/\` - Custom tools
- \`src/integrations/\` - Custom integrations
- \`src/cartridges/\` - Custom cartridges
- \`tests/\` - Extension tests

## Development

See the [Tribble SDK documentation](https://docs.tribble.ai/sdk) for more information.
`;
  await fs.writeFile(path.join(extDir, 'README.md'), readme);

  console.log('Created files:');
  console.log(`  ${name}/package.json`);
  console.log(`  ${name}/tsconfig.json`);
  console.log(`  ${name}/src/index.ts`);
  console.log(`  ${name}/tests/extension.test.ts`);
  console.log(`  ${name}/README.md`);
  console.log('\nNext steps:');
  console.log(`  cd ${name}`);
  console.log('  npm install');
  console.log('  npm run build');
  console.log('  npm run validate');
}

async function extValidate(args: Record<string, string>) {
  const policy = args['--policy'] || 'development';

  console.log(`\n Validating extension (policy: ${policy})\n`);

  try {
    // Try to load extension from current directory
    const path = await import('node:path');
    const extPath = path.resolve(process.cwd(), 'dist/index.js');

    let extension;
    try {
      const module = await import(extPath);
      extension = module.default;
    } catch {
      console.error('Error: Could not load extension from dist/index.js');
      console.error('Make sure to run "npm run build" first.');
      process.exit(1);
    }

    // Import validation utilities
    const { ContractValidator } = await import('@tribble/sdk-test');
    const { PolicyValidator, ENTERPRISE_POLICY, DEVELOPMENT_POLICY, SANDBOX_POLICY } = await import('@tribble/sdk-policy');

    // Contract validation
    console.log('Contract validation...');
    const contractValidator = new ContractValidator(extension);
    const contractResult = contractValidator.validate();

    if (!contractResult.valid) {
      console.log('[FAIL] Contract validation failed:');
      for (const error of contractResult.errors) {
        console.log(`  - ${error}`);
      }
    } else {
      console.log('[PASS] Contract validation passed');
    }

    // Policy validation
    console.log(`\nPolicy validation (${policy})...`);
    const policies: Record<string, unknown> = {
      enterprise: ENTERPRISE_POLICY,
      development: DEVELOPMENT_POLICY,
      sandbox: SANDBOX_POLICY,
    };
    const selectedPolicy = policies[policy] || DEVELOPMENT_POLICY;

    const policyValidator = new PolicyValidator(selectedPolicy as any);
    const policyResult = policyValidator.validate(extension.manifest);

    if (!policyResult.valid) {
      console.log('[FAIL] Policy validation failed:');
      for (const violation of policyResult.violations) {
        console.log(`  - [${violation.severity.toUpperCase()}] ${violation.message}`);
        if (violation.suggestion) {
          console.log(`    Suggestion: ${violation.suggestion}`);
        }
      }
    } else {
      console.log('[PASS] Policy validation passed');
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log(`Extension: ${extension.manifest.name} v${extension.manifest.version}`);
    console.log(`Tools: ${extension.tools?.length || 0}`);
    console.log(`Integrations: ${extension.integrations?.length || 0}`);
    console.log(`Cartridges: ${extension.cartridges?.length || 0}`);
    console.log(`Ingest Adapters: ${extension.ingestAdapters?.length || 0}`);

    const valid = contractResult.valid && policyResult.valid;
    console.log(`\nOverall: ${valid ? 'VALID' : 'INVALID'}`);

    process.exit(valid ? 0 : 1);
  } catch (error) {
    console.error('Validation error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function extPlan(args: Record<string, string>) {
  const env = args['--env'] || 'development';

  console.log(`\n Execution plan for environment: ${env}\n`);

  try {
    const path = await import('node:path');
    const extPath = path.resolve(process.cwd(), 'dist/index.js');

    const module = await import(extPath);
    const extension = module.default;

    console.log('Extension:', extension.manifest.name, 'v' + extension.manifest.version);
    console.log('\nComponents to deploy:');

    if (extension.tools?.length > 0) {
      console.log('\nTools:');
      for (const tool of extension.tools) {
        console.log(`  + ${tool.manifest.name}`);
        console.log(`    ${tool.manifest.description}`);
      }
    }

    if (extension.integrations?.length > 0) {
      console.log('\nIntegrations:');
      for (const integration of extension.integrations) {
        console.log(`  + ${integration.manifest.name} (${integration.manifest.type})`);
      }
    }

    if (extension.cartridges?.length > 0) {
      console.log('\nCartridges:');
      for (const cartridge of extension.cartridges) {
        console.log(`  + ${cartridge.manifest.name}`);
        console.log(`    Model: ${cartridge.manifest.model}`);
        console.log(`    Tools: ${cartridge.manifest.availableTools.join(', ')}`);
      }
    }

    if (extension.ingestAdapters?.length > 0) {
      console.log('\nIngest Adapters:');
      for (const adapter of extension.ingestAdapters) {
        console.log(`  + ${adapter.manifest.name}`);
        console.log(`    Extensions: ${adapter.manifest.extensions.join(', ')}`);
      }
    }

    console.log('\nRequired capabilities:', extension.manifest.capabilities?.join(', ') || 'none');
    console.log('Target platform version:', extension.manifest.platformVersion);
  } catch (error) {
    console.error('Plan error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function extTest(args: Record<string, string>) {
  console.log('\n Running extension tests\n');

  try {
    const path = await import('node:path');
    const glob = await import('node:fs/promises');

    // Find test files
    const testDir = path.resolve(process.cwd(), 'tests');
    const files = await glob.readdir(testDir);
    const testFiles = files.filter(f => f.endsWith('.test.ts') || f.endsWith('.test.js'));

    if (testFiles.length === 0) {
      console.log('No test files found in tests/ directory');
      return;
    }

    console.log(`Found ${testFiles.length} test file(s)\n`);

    // Run each test file
    for (const file of testFiles) {
      console.log(`Running ${file}...`);
      const testPath = path.join(testDir, file);

      // Import and run tests
      try {
        await import(testPath);
      } catch (error) {
        console.error(`  Error in ${file}:`, error instanceof Error ? error.message : error);
      }
    }
  } catch (error) {
    console.error('Test error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function extPublish(args: Record<string, string>) {
  const dryRun = '--dry-run' in args;

  console.log(`\n Publishing extension${dryRun ? ' (dry run)' : ''}\n`);

  // Validate first
  console.log('Step 1: Validating extension...');
  await extValidate({ '--policy': 'development' });

  try {
    const { createControlPlaneClient } = await import('@tribble/sdk-control');
    const path = await import('node:path');

    const extPath = path.resolve(process.cwd(), 'dist/index.js');
    const module = await import(extPath);
    const extension = module.default;

    const client = createControlPlaneClient();

    // Check platform capabilities
    console.log('\nStep 2: Checking platform capabilities...');
    const capabilities = await client.getCapabilities();
    console.log(`  Platform version: ${capabilities.platformVersion}`);
    console.log(`  Supported handler types: ${capabilities.supportedHandlerTypes.join(', ')}`);

    // Validate manifest with platform
    console.log('\nStep 3: Validating manifest with platform...');
    const validation = await client.validateManifest(extension.manifest);

    if (!validation.valid) {
      console.log('\n[FAIL] Platform validation failed:');
      for (const error of validation.errors) {
        console.log(`  - ${error}`);
      }
      process.exit(1);
    }

    if (validation.warnings.length > 0) {
      console.log('\nWarnings:');
      for (const warning of validation.warnings) {
        console.log(`  - ${warning}`);
      }
    }

    console.log('[PASS] Platform validation passed');

    if (dryRun) {
      console.log('\nDry run complete. Use without --dry-run to publish.');
      return;
    }

    // Register extension
    console.log('\nStep 4: Registering extension...');
    const registration = await client.registerExtension(extension.manifest);

    console.log('\n' + '='.repeat(50));
    console.log('Publish complete!');
    console.log('='.repeat(50));
    console.log(`  Extension ID: ${registration.id}`);
    console.log(`  Name: ${registration.name}`);
    console.log(`  Version: ${registration.version}`);
    console.log(`  Status: ${registration.status}`);
    console.log(`  Handler URL: ${registration.handlerUrl || 'not configured'}`);
    console.log(`  Handler Type: ${registration.handlerType || 'http'}`);
    console.log('\nYour extension is now registered and active on the platform.');
    console.log('Tools from this extension will be available in conversations.');
  } catch (error) {
    console.error('\nPublish error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function extPromote(args: Record<string, string>) {
  const fromEnv = args['--from'] || 'development';
  const toEnv = args['--to'] || (fromEnv === 'development' ? 'staging' : 'production');

  console.log(`\n Promoting extension from ${fromEnv} to ${toEnv}\n`);
  console.log('(Not yet implemented - requires control plane connection)');
}

async function extFreeze(args: Record<string, string>) {
  const version = args['--version'];

  console.log(`\n Freezing extension version${version ? ': ' + version : ''}\n`);
  console.log('(Not yet implemented - requires control plane connection)');
}

async function extMigrate(args: Record<string, string>) {
  const targetVersion = args['--target'] || 'latest';

  console.log(`\n Migrating extension to platform version: ${targetVersion}\n`);
  console.log('(Not yet implemented - requires control plane connection)');
}

// ==================== Upload Commands ====================

async function uploadDocument(file: string, args: Record<string, string>) {
  const baseUrl = args['--base-url'] || process.env.TRIBBLE_INGEST_URL;
  const token = args['--token'] || process.env.TRIBBLE_API_KEY;
  const metadata = args['--metadata'] ? JSON.parse(args['--metadata']) : {};

  if (!file || file.startsWith('--')) {
    console.error('Error: File path required');
    console.error('Usage: tribble upload <file> [options]');
    process.exit(1);
  }

  if (!baseUrl || !token) {
    console.error('Error: Missing base-url or token');
    console.error('Set TRIBBLE_INGEST_URL and TRIBBLE_API_KEY environment variables');
    process.exit(1);
  }

  const fs = await import('node:fs/promises');
  const path = await import('node:path');

  console.log(`\n Uploading: ${file}\n`);

  const data = await fs.readFile(file);
  const filename = path.basename(file);
  const ext = path.extname(file).toLowerCase();

  // Determine document type
  const typeMap: Record<string, string> = {
    '.pdf': 'pdf',
    '.html': 'html',
    '.htm': 'html',
    '.txt': 'text',
    '.csv': 'csv',
    '.json': 'json',
    '.xlsx': 'spreadsheet',
    '.xls': 'spreadsheet',
  };
  const documentType = typeMap[ext] || 'text';

  const tribble = createTribble({
    agent: { baseUrl: 'https://placeholder', token: 'x', email: 'cli@tribble' },
    ingest: { baseUrl, tokenProvider: async () => token },
  });

  const result = await tribble.ingest.uploadDocument({
    file: data,
    filename,
    documentType: documentType as any,
    metadata,
  });

  console.log('Upload complete!');
  console.log(JSON.stringify(result, null, 2));
}

// ==================== Connector Commands ====================

async function connectorsList(args: Record<string, string>) {
  console.log('\n Available Connectors\n');
  console.log('Pre-built integrations:');
  console.log('  - salesforce       Salesforce CRM');
  console.log('  - dynamics365      Microsoft Dynamics 365');
  console.log('  - sap              SAP ERP');
  console.log('  - oracle           Oracle ERP Cloud');
  console.log('  - snowflake        Snowflake Data Warehouse');
  console.log('  - databricks       Databricks Lakehouse');
  console.log('  - sharepoint       Microsoft SharePoint');
  console.log('  - google-drive     Google Drive');
  console.log('  - slack            Slack');
  console.log('  - teams            Microsoft Teams');
  console.log('\nUse "tribble connectors status" to check connector health');
}

async function connectorsStatus(args: Record<string, string>) {
  console.log('\n Connector Status\n');
  console.log('(Requires platform connection to check status)');
  console.log('Set TRIBBLE_API_KEY environment variable to enable');
}

// ==================== Runner Command ====================

async function runExtension(args: Record<string, string>) {
  console.log('\n Tribble Extension Runner\n');

  try {
    const { createRunner } = await import('@tribble/sdk-runner');
    const path = await import('node:path');

    const extPath = path.resolve(process.cwd(), 'dist/index.js');
    const module = await import(extPath);
    const extension = module.default;

    const runner = createRunner(extension, { debug: true });
    await runner.interactive();
  } catch (error) {
    console.error('Runner error:', error instanceof Error ? error.message : error);
    console.error('\nMake sure to run "npm run build" first.');
    process.exit(1);
  }
}

// ==================== Helpers ====================

function parseArgs(args: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  let key: string | null = null;

  for (const a of args) {
    if (a.startsWith('--')) {
      key = a;
      out[key] = '';
    } else if (key) {
      out[key] = a;
      key = null;
    }
  }

  return out;
}

main().catch((e) => {
  console.error('Error:', e?.message || e);
  process.exit(1);
});

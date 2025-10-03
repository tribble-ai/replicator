#!/usr/bin/env node

/**
 * Tribble ServiceNow CLI
 * Command-line tool for building and deploying Tribble apps to ServiceNow
 */

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { ServiceNowClient } from './client';
import { AppBuilder, createDefaultApp } from './builder';
import { ConfigManager } from './config';
import type { ServiceNowConfig, ServiceNowApp, DeploymentOptions } from './types/index';

const program = new Command();

program
  .name('tribble-snow')
  .description('Tribble ServiceNow deployment CLI')
  .version('0.1.0');

/**
 * Initialize new ServiceNow app
 */
program
  .command('init')
  .description('Initialize a new Tribble ServiceNow application')
  .option('-n, --name <name>', 'Application name')
  .option('-s, --scope <scope>', 'Application scope (e.g., x_tribble_myapp)')
  .option('-v, --version <version>', 'Application version', '1.0.0')
  .option('-d, --dir <directory>', 'Output directory', './servicenow-app')
  .action(async (options) => {
    try {
      console.log('🚀 Initializing Tribble ServiceNow application...');

      const name = options.name || 'Tribble App';
      const scope = options.scope || 'x_tribble_app';
      const version = options.version;
      const dir = path.resolve(options.dir);

      // Validate scope
      if (!/^x_[a-z0-9_]+$/.test(scope)) {
        console.error('❌ Error: Scope must start with x_ and contain only lowercase letters, numbers, and underscores');
        process.exit(1);
      }

      // Create directory structure
      fs.mkdirSync(dir, { recursive: true });
      fs.mkdirSync(path.join(dir, 'config'), { recursive: true });
      fs.mkdirSync(path.join(dir, 'build'), { recursive: true });

      // Create default app
      const app = createDefaultApp(name, scope, version);

      // Save app configuration
      fs.writeFileSync(
        path.join(dir, 'app.json'),
        JSON.stringify(app, null, 2)
      );

      // Create config template
      const configTemplate = {
        instanceUrl: 'https://your-instance.service-now.com',
        auth: {
          type: 'basic',
          username: 'your-username',
          password: 'your-password',
        },
        tribble: {
          baseUrl: 'https://api.tribble.ai',
          apiToken: 'your-tribble-token',
          email: 'your-email@example.com',
          defaultAgentId: 'your-agent-id',
        },
        scopePrefix: scope,
      };

      fs.writeFileSync(
        path.join(dir, 'config', 'config.json'),
        JSON.stringify(configTemplate, null, 2)
      );

      // Create .env template
      const envTemplate = `# ServiceNow Configuration
SNOW_INSTANCE_URL=https://your-instance.service-now.com
SNOW_AUTH_TYPE=basic
SNOW_USERNAME=your-username
SNOW_PASSWORD=your-password
SNOW_SCOPE_PREFIX=${scope}

# Tribble Configuration
TRIBBLE_BASE_URL=https://api.tribble.ai
TRIBBLE_API_TOKEN=your-tribble-token
TRIBBLE_EMAIL=your-email@example.com
TRIBBLE_DEFAULT_AGENT_ID=your-agent-id
`;

      fs.writeFileSync(path.join(dir, '.env.example'), envTemplate);

      // Create README
      const readme = generateReadme(name, scope);
      fs.writeFileSync(path.join(dir, 'README.md'), readme);

      console.log('✅ Application initialized successfully!');
      console.log(`📁 Location: ${dir}`);
      console.log(`\n📝 Next steps:`);
      console.log(`   1. cd ${options.dir}`);
      console.log(`   2. Copy .env.example to .env and fill in your credentials`);
      console.log(`   3. Edit config/config.json with your settings`);
      console.log(`   4. Run 'tribble-snow build' to build the application`);
      console.log(`   5. Run 'tribble-snow deploy' to deploy to ServiceNow`);
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

/**
 * Build ServiceNow app
 */
program
  .command('build')
  .description('Build Tribble ServiceNow application')
  .option('-c, --config <path>', 'Path to config file', './config/config.json')
  .option('-a, --app <path>', 'Path to app.json', './app.json')
  .option('-o, --output <path>', 'Output directory', './build')
  .action(async (options) => {
    try {
      console.log('🔨 Building Tribble ServiceNow application...');

      // Load app configuration
      const appPath = path.resolve(options.app);
      if (!fs.existsSync(appPath)) {
        console.error(`❌ Error: App configuration not found at ${appPath}`);
        process.exit(1);
      }

      const app: ServiceNowApp = JSON.parse(
        fs.readFileSync(appPath, 'utf-8')
      );

      // Create builder
      const builder = new AppBuilder({
        sourceDir: process.cwd(),
        outputDir: path.resolve(options.output),
        app,
      });

      // Validate app
      const validation = builder.validate();
      if (!validation.valid) {
        console.error('❌ Validation errors:');
        validation.errors.forEach((err) => console.error(`   - ${err}`));
        process.exit(1);
      }

      // Build app
      const { updateSetXml, files } = await builder.build();

      // Create output directory
      const outputDir = path.resolve(options.output);
      fs.mkdirSync(outputDir, { recursive: true });

      // Write update set XML
      const updateSetPath = path.join(
        outputDir,
        `${app.scope}_v${app.version}.xml`
      );
      fs.writeFileSync(updateSetPath, updateSetXml);

      // Write individual files
      for (const [filename, content] of files.entries()) {
        const filePath = path.join(outputDir, filename);
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, content);
      }

      console.log('✅ Build completed successfully!');
      console.log(`📦 Update set: ${updateSetPath}`);
      console.log(`📁 Output directory: ${outputDir}`);
      console.log(`📄 Files generated: ${files.size}`);
    } catch (error) {
      console.error('❌ Build error:', error);
      process.exit(1);
    }
  });

/**
 * Deploy to ServiceNow
 */
program
  .command('deploy')
  .description('Deploy Tribble application to ServiceNow instance')
  .option('-c, --config <path>', 'Path to config file', './config/config.json')
  .option('-u, --update-set <path>', 'Path to update set XML')
  .option('--dry-run', 'Perform a dry run without actual deployment')
  .action(async (options) => {
    try {
      console.log('🚀 Deploying to ServiceNow...');

      // Load configuration
      const configPath = path.resolve(options.config);
      if (!fs.existsSync(configPath)) {
        console.error(`❌ Error: Config file not found at ${configPath}`);
        process.exit(1);
      }

      const config: ServiceNowConfig = JSON.parse(
        fs.readFileSync(configPath, 'utf-8')
      );

      // Create client
      const client = new ServiceNowClient(config);

      // Test connection
      console.log('🔌 Testing connection...');
      const connected = await client.testConnection();
      if (!connected) {
        console.error('❌ Failed to connect to ServiceNow instance');
        process.exit(1);
      }
      console.log('✅ Connected successfully');

      if (options.dryRun) {
        console.log('ℹ️  Dry run mode - no changes will be made');
        return;
      }

      // Load update set
      if (options.updateSet) {
        const updateSetPath = path.resolve(options.updateSet);
        if (!fs.existsSync(updateSetPath)) {
          console.error(`❌ Error: Update set not found at ${updateSetPath}`);
          process.exit(1);
        }

        const updateSetXml = fs.readFileSync(updateSetPath, 'utf-8');

        console.log('📤 Uploading update set...');
        const result = await client.uploadApplication(
          path.basename(updateSetPath),
          updateSetXml
        );

        console.log('✅ Deployment completed successfully!');
        console.log(`📝 Update set sys_id: ${result.sys_id}`);
      } else {
        console.error('❌ Error: Update set path is required');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Deployment error:', error);
      process.exit(1);
    }
  });

/**
 * Test connection to ServiceNow
 */
program
  .command('test')
  .description('Test connection to ServiceNow instance')
  .option('-c, --config <path>', 'Path to config file', './config/config.json')
  .action(async (options) => {
    try {
      console.log('🔌 Testing ServiceNow connection...');

      // Load configuration
      const configPath = path.resolve(options.config);
      if (!fs.existsSync(configPath)) {
        console.error(`❌ Error: Config file not found at ${configPath}`);
        process.exit(1);
      }

      const config: ServiceNowConfig = JSON.parse(
        fs.readFileSync(configPath, 'utf-8')
      );

      // Create client
      const client = new ServiceNowClient(config);

      // Test connection
      const connected = await client.testConnection();
      if (connected) {
        console.log('✅ Connection successful!');

        // Get instance info
        const info = await client.getInstanceInfo();
        console.log(`\n📊 Instance Information:`);
        console.log(`   Version: ${info.version}`);
        console.log(`   Build Date: ${info.build_date}`);
        console.log(`   Build Tag: ${info.build_tag}`);
      } else {
        console.error('❌ Connection failed');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Connection error:', error);
      process.exit(1);
    }
  });

/**
 * Validate app configuration
 */
program
  .command('validate')
  .description('Validate application configuration')
  .option('-a, --app <path>', 'Path to app.json', './app.json')
  .action((options) => {
    try {
      console.log('🔍 Validating application configuration...');

      // Load app configuration
      const appPath = path.resolve(options.app);
      if (!fs.existsSync(appPath)) {
        console.error(`❌ Error: App configuration not found at ${appPath}`);
        process.exit(1);
      }

      const app: ServiceNowApp = JSON.parse(
        fs.readFileSync(appPath, 'utf-8')
      );

      // Create builder for validation
      const builder = new AppBuilder({
        sourceDir: process.cwd(),
        outputDir: './build',
        app,
      });

      const validation = builder.validate();

      if (validation.valid) {
        console.log('✅ Configuration is valid!');
        console.log(`\n📦 Application Details:`);
        console.log(`   Name: ${app.name}`);
        console.log(`   Scope: ${app.scope}`);
        console.log(`   Version: ${app.version}`);
        console.log(`   Components: ${app.components.length}`);
      } else {
        console.error('❌ Validation errors:');
        validation.errors.forEach((err) => console.error(`   - ${err}`));
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Validation error:', error);
      process.exit(1);
    }
  });

/**
 * Generate README content
 */
function generateReadme(name: string, scope: string): string {
  return `# ${name}

ServiceNow application powered by Tribble AI platform.

## Overview

This application integrates Tribble's AI capabilities into your ServiceNow instance, providing:

- 🤖 AI-powered chat interface
- 📄 Intelligent document processing
- 🔍 Smart knowledge base search
- 🎯 Automated incident analysis
- 🔗 Seamless integration with Tribble platform

## Installation

### Prerequisites

- ServiceNow instance (Orlando or later)
- Tribble platform account and API token
- Node.js 18+ (for CLI tools)

### Configuration

1. Copy \`.env.example\` to \`.env\` and fill in your credentials:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

2. Edit \`config/config.json\` with your ServiceNow and Tribble settings

3. Ensure your scope prefix matches: \`${scope}\`

### Building

Build the application for deployment:

\`\`\`bash
tribble-snow build
\`\`\`

This generates an update set XML file in the \`build/\` directory.

### Deployment

Deploy to your ServiceNow instance:

\`\`\`bash
tribble-snow deploy --update-set ./build/${scope}_v1.0.0.xml
\`\`\`

Or manually:
1. Navigate to **System Update Sets > Retrieved Update Sets**
2. Upload the XML file from \`build/\` directory
3. Preview and commit the update set

## Components

### Service Portal Widgets

- **Tribble AI Chat** - Interactive chat widget for user assistance
- **Document Upload** - Upload and ingest documents into Tribble
- **Agent Dashboard** - Monitor and manage AI agents
- **Knowledge Search** - AI-powered knowledge base search

### Script Includes

- **TribbleAPIClient** - Core API client for Tribble platform
- **TribbleIngestService** - Document ingestion service
- **TribbleAgentService** - Agent interaction service

### Scripted REST API

Access endpoints at: \`/api/${scope}/\`

- \`POST /chat/message\` - Send chat messages
- \`POST /ingest/document\` - Ingest documents
- \`POST /agent/execute\` - Execute agent actions
- \`GET /status\` - Check integration status

## Configuration

System properties are available at:
**System Properties > ${scope}**

Required properties:
- \`${scope}.tribble.base_url\` - Tribble API URL
- \`${scope}.tribble.api_token\` - API authentication token
- \`${scope}.tribble.email\` - User email for Tribble
- \`${scope}.tribble.default_agent_id\` - Default agent ID

## Usage

### Adding Chat Widget to Service Portal

1. Open Service Portal page in Portal Designer
2. Add widget: **Tribble AI Chat**
3. Configure widget options (title, agent ID, etc.)
4. Save and publish

### Ingesting Documents

Use the Document Upload widget or the REST API:

\`\`\`javascript
var ingestService = new TribbleIngestService();
var result = ingestService.ingestAttachment(attachmentSysId);
\`\`\`

### Using AI Agents

\`\`\`javascript
var agentService = new TribbleAgentService();
var result = agentService.processIncident(incidentSysId, agentId);
\`\`\`

## Development

### Project Structure

\`\`\`
.
├── app.json              # Application metadata
├── config/
│   └── config.json       # Configuration file
├── build/                # Built artifacts
└── README.md            # This file
\`\`\`

### CLI Commands

\`\`\`bash
tribble-snow init         # Initialize new app
tribble-snow build        # Build application
tribble-snow deploy       # Deploy to ServiceNow
tribble-snow test         # Test connection
tribble-snow validate     # Validate configuration
\`\`\`

## Support

For issues and questions:
- Tribble Platform: https://docs.tribble.ai
- ServiceNow Integration: See documentation in Service Portal

## License

UNLICENSED - Proprietary Tribble SDK
`;
}

// Parse command line arguments
program.parse();

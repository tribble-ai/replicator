#!/usr/bin/env node

/**
 * Tribble SAP CLI
 *
 * Command-line interface for scaffolding, building, and deploying
 * Tribble applications to SAP S/4HANA and SAP BTP.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import prompts from 'prompts';
import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';
import {
  generateManifest,
  generateComponent,
  generateIndexHTML,
  generateAppView,
  generateAppController,
  generateChatView,
  generateChatController,
  generateUploadView,
} from '../ui5';
import {
  ODataMetadataGenerator,
  createTribbleChatService,
  createTribbleIngestService,
  createTribbleAgentService,
} from '../odata';
import {
  generateTribbleAPIClient,
  generateTribbleChatClass,
  generateTribbleIngestClass,
  generateTribbleAgentClass,
  generateABAPTypes,
  generateABAPExceptionClass,
} from '../abap';
import { generateXSAppConfig, generateBTPManifest } from '../config';
import type { FioriAppType, ScaffoldOptions, BuildOptions, DeployOptions } from '../types';

const program = new Command();

program
  .name('tribble-sap')
  .description('CLI for Tribble SAP S/4HANA integration')
  .version('0.1.0');

/**
 * Scaffold command - Create new SAP Fiori app
 */
program
  .command('scaffold')
  .description('Scaffold a new SAP Fiori application with Tribble integration')
  .option('-n, --name <name>', 'Application name')
  .option('-t, --type <type>', 'Application type (chat, upload, agent, freestyle)', 'freestyle')
  .option('-o, --output <path>', 'Output directory', './fiori-app')
  .option('--namespace <namespace>', 'Application namespace', 'com.tribble.app')
  .option('--sample-data', 'Include sample data', false)
  .action(async (options) => {
    const spinner = ora('Scaffolding Fiori application...').start();

    try {
      // Prompt for missing options
      if (!options.name) {
        const response = await prompts({
          type: 'text',
          name: 'name',
          message: 'Application name:',
          initial: 'TribbleApp',
        });
        options.name = response.name;
      }

      const appType = options.type as FioriAppType;
      const outputDir = path.resolve(options.output);

      // Create directory structure
      const dirs = [
        outputDir,
        path.join(outputDir, 'webapp'),
        path.join(outputDir, 'webapp', 'view'),
        path.join(outputDir, 'webapp', 'controller'),
        path.join(outputDir, 'webapp', 'i18n'),
        path.join(outputDir, 'webapp', 'css'),
        path.join(outputDir, 'webapp', 'model'),
        path.join(outputDir, 'webapp', 'localService'),
      ];

      dirs.forEach((dir) => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      });

      // Generate manifest.json
      const manifest = generateManifest({
        appId: options.namespace,
        appName: options.name,
        description: `Tribble-powered ${appType} application`,
        version: '1.0.0',
        namespace: options.namespace,
        odataService: '/sap/odata/tribble/',
        appType,
      });

      fs.writeFileSync(
        path.join(outputDir, 'webapp', 'manifest.json'),
        JSON.stringify(manifest, null, 2)
      );

      // Generate Component.js
      fs.writeFileSync(
        path.join(outputDir, 'webapp', 'Component.js'),
        generateComponent(options.namespace)
      );

      // Generate index.html
      fs.writeFileSync(
        path.join(outputDir, 'webapp', 'index.html'),
        generateIndexHTML({
          appId: options.namespace,
          title: options.name,
        })
      );

      // Generate App view and controller
      fs.writeFileSync(
        path.join(outputDir, 'webapp', 'view', 'App.view.xml'),
        generateAppView(options.namespace)
      );

      fs.writeFileSync(
        path.join(outputDir, 'webapp', 'controller', 'App.controller.js'),
        generateAppController(options.namespace)
      );

      // Generate app-specific views based on type
      if (appType === 'chat' || appType === 'freestyle') {
        fs.writeFileSync(
          path.join(outputDir, 'webapp', 'view', 'TribbleChat.view.xml'),
          generateChatView(options.namespace)
        );

        fs.writeFileSync(
          path.join(outputDir, 'webapp', 'controller', 'TribbleChat.controller.js'),
          generateChatController(options.namespace)
        );
      }

      if (appType === 'upload' || appType === 'freestyle') {
        fs.writeFileSync(
          path.join(outputDir, 'webapp', 'view', 'TribbleUpload.view.xml'),
          generateUploadView(options.namespace)
        );
      }

      // Generate i18n file
      const i18nContent = `# App Descriptor
appTitle=${options.name}
appDescription=Tribble-powered ${appType} application

# Common
agent=Agent
collection=Collection
upload=Upload
refresh=Refresh
save=Save
cancel=Cancel

# Chat
chatTitle=Tribble Chat
messagePlaceholder=Type your message...

# Upload
uploadTitle=Document Upload
uploadTooltip=Upload document to Tribble
selectFile=Select File
chooseFile=Choose a file to upload
documents=Documents
filename=Filename
size=Size
status=Status
uploadedAt=Uploaded At
actions=Actions
`;

      fs.writeFileSync(path.join(outputDir, 'webapp', 'i18n', 'i18n.properties'), i18nContent);

      // Generate package.json
      const packageJson = {
        name: options.name.toLowerCase().replace(/\s+/g, '-'),
        version: '1.0.0',
        description: `Tribble-powered ${appType} application`,
        scripts: {
          start: 'ui5 serve',
          build: 'ui5 build --all',
          'build:opt': 'ui5 build --all --clean-dest',
        },
        devDependencies: {
          '@ui5/cli': '^3.0.0',
        },
      };

      fs.writeFileSync(
        path.join(outputDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      // Generate ui5.yaml
      const ui5Yaml = `specVersion: '3.0'
metadata:
  name: ${options.namespace}
type: application
framework:
  name: OpenUI5
  version: '1.120.0'
  libraries:
    - name: sap.m
    - name: sap.ui.core
    - name: sap.ui.layout
    - name: sap.ui.unified
`;

      fs.writeFileSync(path.join(outputDir, 'ui5.yaml'), ui5Yaml);

      spinner.succeed(
        chalk.green(`Fiori application scaffolded successfully at ${outputDir}`)
      );

      console.log('\n' + chalk.cyan('Next steps:'));
      console.log(chalk.white(`  1. cd ${outputDir}`));
      console.log(chalk.white('  2. npm install'));
      console.log(chalk.white('  3. npm start'));
      console.log(
        chalk.white(
          '  4. Deploy to SAP with: tribble-sap deploy --target on-premise|btp\n'
        )
      );
    } catch (error: any) {
      spinner.fail(chalk.red('Scaffolding failed'));
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

/**
 * Generate OData command
 */
program
  .command('generate-odata')
  .description('Generate OData service metadata for Tribble integration')
  .option('-s, --service <type>', 'Service type (chat, ingest, agent, all)', 'all')
  .option('-o, --output <path>', 'Output directory', './odata')
  .action(async (options) => {
    const spinner = ora('Generating OData services...').start();

    try {
      const outputDir = path.resolve(options.output);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const services = options.service === 'all'
        ? ['chat', 'ingest', 'agent']
        : [options.service];

      for (const service of services) {
        let config;
        let filename;

        switch (service) {
          case 'chat':
            config = createTribbleChatService();
            filename = 'TribbleChat_metadata.xml';
            break;
          case 'ingest':
            config = createTribbleIngestService();
            filename = 'TribbleIngest_metadata.xml';
            break;
          case 'agent':
            config = createTribbleAgentService();
            filename = 'TribbleAgent_metadata.xml';
            break;
          default:
            continue;
        }

        const generator = new ODataMetadataGenerator(config);
        const metadata = generator.generate();

        fs.writeFileSync(path.join(outputDir, filename), metadata);
        spinner.text = `Generated ${filename}`;
      }

      spinner.succeed(chalk.green(`OData services generated at ${outputDir}`));
    } catch (error: any) {
      spinner.fail(chalk.red('OData generation failed'));
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

/**
 * Generate ABAP command
 */
program
  .command('generate-abap')
  .description('Generate ABAP classes for Tribble integration')
  .option('-o, --output <path>', 'Output directory', './abap')
  .action(async (options) => {
    const spinner = ora('Generating ABAP classes...').start();

    try {
      const outputDir = path.resolve(options.output);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const config = {
        apiUrl: 'https://api.tribble.ai',
        apiKey: 'YOUR_API_KEY',
      };

      // Generate ABAP classes
      const classes = [
        { name: 'ZCL_TRIBBLE_API_CLIENT', content: generateTribbleAPIClient(config) },
        { name: 'ZCL_TRIBBLE_CHAT', content: generateTribbleChatClass() },
        { name: 'ZCL_TRIBBLE_INGEST', content: generateTribbleIngestClass() },
        { name: 'ZCL_TRIBBLE_AGENT', content: generateTribbleAgentClass() },
      ];

      for (const cls of classes) {
        fs.writeFileSync(path.join(outputDir, `${cls.name}.abap`), cls.content);
        spinner.text = `Generated ${cls.name}.abap`;
      }

      // Generate type definitions
      fs.writeFileSync(
        path.join(outputDir, 'ZTRIBBLE_TYPES.abap'),
        generateABAPTypes()
      );

      // Generate exception class
      fs.writeFileSync(
        path.join(outputDir, 'CX_TRIBBLE_API_ERROR.abap'),
        generateABAPExceptionClass()
      );

      spinner.succeed(chalk.green(`ABAP classes generated at ${outputDir}`));

      console.log('\n' + chalk.cyan('Next steps:'));
      console.log(chalk.white('  1. Import ABAP files to your SAP system using SE80 or ADT'));
      console.log(chalk.white('  2. Configure RFC destination ZTRIBBLE_API in SM59'));
      console.log(chalk.white('  3. Set up authorization objects for Tribble access\n'));
    } catch (error: any) {
      spinner.fail(chalk.red('ABAP generation failed'));
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

/**
 * Build command
 */
program
  .command('build')
  .description('Build Fiori application for deployment')
  .option('-s, --source <path>', 'Source directory', './webapp')
  .option('-o, --output <path>', 'Output directory', './dist')
  .option('--minify', 'Minify JavaScript and CSS', false)
  .option('--target <target>', 'Target platform (on-premise|btp)', 'on-premise')
  .action(async (options) => {
    const spinner = ora('Building Fiori application...').start();

    try {
      const sourceDir = path.resolve(options.source);
      const outputDir = path.resolve(options.output);

      if (!fs.existsSync(sourceDir)) {
        throw new Error(`Source directory not found: ${sourceDir}`);
      }

      // Create output directory
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Copy files
      copyRecursiveSync(sourceDir, outputDir);

      // Generate xs-app.json for BTP
      if (options.target === 'btp') {
        const xsAppConfig = generateXSAppConfig({
          apiUrl: 'https://api.tribble.ai',
          apiKey: process.env.TRIBBLE_API_KEY || '',
        });

        fs.writeFileSync(
          path.join(outputDir, 'xs-app.json'),
          JSON.stringify(xsAppConfig, null, 2)
        );
      }

      spinner.succeed(chalk.green(`Application built successfully at ${outputDir}`));
    } catch (error: any) {
      spinner.fail(chalk.red('Build failed'));
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

/**
 * Deploy command
 */
program
  .command('deploy')
  .description('Deploy Fiori application to SAP')
  .option('-t, --target <target>', 'Target platform (on-premise|btp)', 'on-premise')
  .option('-p, --package <path>', 'Package path', './dist')
  .option('--system-id <id>', 'SAP system ID')
  .option('--client <client>', 'SAP client', '100')
  .option('--force', 'Force deployment', false)
  .action(async (options) => {
    const spinner = ora('Deploying to SAP...').start();

    try {
      if (options.target === 'btp') {
        spinner.text = 'Deploying to SAP BTP...';

        // Generate manifest.yml for Cloud Foundry
        const manifest = generateBTPManifest({
          appName: 'tribble-app',
          org: process.env.CF_ORG || '',
          space: process.env.CF_SPACE || '',
          apiEndpoint: process.env.CF_API || '',
          memory: '256M',
          diskQuota: '512M',
          instances: 1,
        });

        const packagePath = path.resolve(options.package);
        fs.writeFileSync(
          path.join(packagePath, 'manifest.yml'),
          JSON.stringify(manifest, null, 2)
        );

        spinner.succeed(chalk.green('BTP deployment package prepared'));
        console.log(
          chalk.cyan('\nTo deploy, run: cf push -f ' + path.join(packagePath, 'manifest.yml'))
        );
      } else {
        spinner.succeed(chalk.green('On-premise deployment package prepared'));
        console.log(chalk.cyan('\nNext steps for on-premise deployment:'));
        console.log(chalk.white('  1. Create transport request in SE80'));
        console.log(chalk.white('  2. Upload BSP application using /UI5/UI5_REPOSITORY_LOAD'));
        console.log(chalk.white('  3. Assign app to Fiori Launchpad catalog'));
        console.log(chalk.white('  4. Configure OData services in /IWFND/MAINT_SERVICE\n'));
      }
    } catch (error: any) {
      spinner.fail(chalk.red('Deployment failed'));
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

/**
 * Helper function to copy directory recursively
 */
function copyRecursiveSync(src: string, dest: string): void {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats && stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

program.parse();

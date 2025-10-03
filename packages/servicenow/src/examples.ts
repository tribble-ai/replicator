/**
 * Usage examples for @tribble/sdk-servicenow
 */

import { ServiceNowClient } from './client';
import { AppBuilder, createDefaultApp } from './builder';
import { ConfigManager } from './config';
import type { ServiceNowConfig } from './types/index';

/**
 * Example 1: Creating and testing a ServiceNow connection
 */
export async function example1_TestConnection() {
  const config: ServiceNowConfig = {
    instanceUrl: 'https://dev12345.service-now.com',
    auth: {
      type: 'basic',
      username: 'admin',
      password: 'password',
    },
    tribble: {
      baseUrl: 'https://api.tribble.ai',
      apiToken: 'your-tribble-token',
      email: 'admin@company.com',
      defaultAgentId: 'agent-123',
    },
    scopePrefix: 'x_tribble_app',
  };

  const client = new ServiceNowClient(config);

  // Test connection
  const connected = await client.testConnection();
  console.log('Connected:', connected);

  if (connected) {
    // Get instance information
    const info = await client.getInstanceInfo();
    console.log('Instance:', info);
  }
}

/**
 * Example 2: Building a ServiceNow application
 */
export async function example2_BuildApp() {
  // Create a default app
  const app = createDefaultApp('My AI App', 'x_tribble_myapp', '1.0.0');

  // Create builder
  const builder = new AppBuilder({
    sourceDir: './src',
    outputDir: './build',
    app,
  });

  // Validate configuration
  const validation = builder.validate();
  if (!validation.valid) {
    console.error('Validation errors:', validation.errors);
    return;
  }

  // Build the app
  const { updateSetXml, files } = await builder.build();

  console.log('Update Set XML length:', updateSetXml.length);
  console.log('Files generated:', files.size);

  // List generated files
  for (const [filename] of files.entries()) {
    console.log('  -', filename);
  }
}

/**
 * Example 3: Deploying to ServiceNow
 */
export async function example3_DeployApp() {
  const config: ServiceNowConfig = {
    instanceUrl: 'https://dev12345.service-now.com',
    auth: {
      type: 'basic',
      username: 'admin',
      password: 'password',
    },
    tribble: {
      baseUrl: 'https://api.tribble.ai',
      apiToken: 'your-tribble-token',
      email: 'admin@company.com',
    },
    scopePrefix: 'x_tribble_myapp',
  };

  const client = new ServiceNowClient(config);

  // Create update set
  const updateSet = await client.createUpdateSet(
    'Tribble App v1.0.0',
    'Initial deployment of Tribble AI integration'
  );

  console.log('Update set created:', updateSet.sys_id);

  // Set as current
  await client.setCurrentUpdateSet(updateSet.sys_id);

  // Deploy components
  // (In real implementation, you would deploy widgets, script includes, etc.)

  // Complete the update set
  await client.completeUpdateSet(updateSet.sys_id);

  console.log('Deployment completed!');
}

/**
 * Example 4: Creating ServiceNow widgets programmatically
 */
export async function example4_CreateWidgets() {
  const config: ServiceNowConfig = {
    instanceUrl: 'https://dev12345.service-now.com',
    auth: {
      type: 'basic',
      username: 'admin',
      password: 'password',
    },
    tribble: {
      baseUrl: 'https://api.tribble.ai',
      apiToken: 'your-tribble-token',
      email: 'admin@company.com',
    },
    scopePrefix: 'x_tribble_myapp',
  };

  const client = new ServiceNowClient(config);

  // Create a custom chat widget
  const widget = await client.createWidget({
    name: 'Custom Tribble Chat',
    id: 'custom_tribble_chat',
    description: 'Custom AI chat widget',
    script: `
      (function() {
        var tribbleClient = new TribbleAPIClient();
        data.title = options.title || 'AI Chat';
      })();
    `,
    client_script: `
      function() {
        var c = this;
        c.sendMessage = function() {
          c.server.get({ message: c.message });
        };
      }
    `,
    template: '<div>{{data.title}}</div>',
    css: '.custom-chat { color: blue; }',
  });

  console.log('Widget created:', widget.sys_id);
}

/**
 * Example 5: Creating Script Includes
 */
export async function example5_CreateScriptIncludes() {
  const config: ServiceNowConfig = {
    instanceUrl: 'https://dev12345.service-now.com',
    auth: {
      type: 'basic',
      username: 'admin',
      password: 'password',
    },
    tribble: {
      baseUrl: 'https://api.tribble.ai',
      apiToken: 'your-tribble-token',
      email: 'admin@company.com',
    },
    scopePrefix: 'x_tribble_myapp',
  };

  const client = new ServiceNowClient(config);

  // Create custom script include
  const scriptInclude = await client.createScriptInclude({
    name: 'CustomTribbleHelper',
    api_name: 'x_tribble_myapp.CustomTribbleHelper',
    description: 'Custom helper for Tribble integration',
    access: 'public',
    script: `
      var CustomTribbleHelper = Class.create();
      CustomTribbleHelper.prototype = {
        initialize: function() {
          this.client = new TribbleAPIClient();
        },

        processRecord: function(recordId) {
          // Custom processing logic
          return this.client.executeAgentAction(
            'default-agent',
            'process_record',
            { recordId: recordId }
          );
        },

        type: 'CustomTribbleHelper'
      };
    `,
  });

  console.log('Script Include created:', scriptInclude.sys_id);
}

/**
 * Example 6: Creating Business Rules
 */
export async function example6_CreateBusinessRules() {
  const config: ServiceNowConfig = {
    instanceUrl: 'https://dev12345.service-now.com',
    auth: {
      type: 'basic',
      username: 'admin',
      password: 'password',
    },
    tribble: {
      baseUrl: 'https://api.tribble.ai',
      apiToken: 'your-tribble-token',
      email: 'admin@company.com',
    },
    scopePrefix: 'x_tribble_myapp',
  };

  const client = new ServiceNowClient(config);

  // Create business rule for automatic incident analysis
  const rule = await client.createBusinessRule({
    name: 'Tribble Auto Analyze Incident',
    table: 'incident',
    when: 'after',
    order: 100,
    active: true,
    script: `
      (function executeRule(current, previous) {
        // Only process high-priority incidents
        if (current.priority.toString() === '1' || current.priority.toString() === '2') {
          var agentService = new TribbleAgentService();
          var agentId = gs.getProperty('x_tribble_myapp.tribble.default_agent_id');

          var result = agentService.processIncident(
            current.sys_id.toString(),
            agentId
          );

          if (result.success) {
            gs.info('Tribble: Successfully analyzed incident ' + current.number);
          }
        }
      })(current, previous);
    `,
  });

  console.log('Business Rule created:', rule.sys_id);
}

/**
 * Example 7: Configuration management
 */
export function example7_ConfigManagement() {
  // Load from environment variables
  const configManager = ConfigManager.fromEnv();

  // Get Tribble configuration
  const tribbleConfig = configManager.getTribbleConfig();
  console.log('Tribble Base URL:', tribbleConfig.baseUrl);

  // Export as system properties
  const sysProps = configManager.toSystemProperties();
  console.log('System properties:', sysProps.length);

  // Update configuration at runtime
  configManager.updateConfig({
    timeout: 60000, // Increase timeout to 60 seconds
  });
}

/**
 * Example 8: Query ServiceNow records
 */
export async function example8_QueryRecords() {
  const config: ServiceNowConfig = {
    instanceUrl: 'https://dev12345.service-now.com',
    auth: {
      type: 'basic',
      username: 'admin',
      password: 'password',
    },
    tribble: {
      baseUrl: 'https://api.tribble.ai',
      apiToken: 'your-tribble-token',
      email: 'admin@company.com',
    },
    scopePrefix: 'x_tribble_myapp',
  };

  const client = new ServiceNowClient(config);

  // Query high-priority open incidents
  const incidents = await client.query(
    'incident',
    'priority=1^active=true',
    ['number', 'short_description', 'priority', 'state']
  );

  console.log('Found incidents:', incidents.length);

  for (const incident of incidents) {
    console.log(`  - ${incident.number}: ${incident.short_description}`);
  }
}

/**
 * Example 9: OAuth2 authentication
 */
export async function example9_OAuth2Auth() {
  const config: ServiceNowConfig = {
    instanceUrl: 'https://dev12345.service-now.com',
    auth: {
      type: 'oauth2',
      clientId: 'your-client-id',
      clientSecret: 'your-client-secret',
      tokenUrl: 'https://dev12345.service-now.com/oauth_token.do',
    },
    tribble: {
      baseUrl: 'https://api.tribble.ai',
      apiToken: 'your-tribble-token',
      email: 'admin@company.com',
    },
    scopePrefix: 'x_tribble_myapp',
  };

  const client = new ServiceNowClient(config);

  // Authentication happens automatically on first request
  const connected = await client.testConnection();
  console.log('OAuth2 connection:', connected);
}

/**
 * Example 10: Complete deployment workflow
 */
export async function example10_CompleteWorkflow() {
  console.log('=== Tribble ServiceNow Deployment Workflow ===\n');

  // Step 1: Create app configuration
  console.log('Step 1: Creating app configuration...');
  const app = createDefaultApp('Complete AI App', 'x_tribble_complete', '1.0.0');
  console.log(`  Created app: ${app.name} (${app.scope})\n`);

  // Step 2: Build the application
  console.log('Step 2: Building application...');
  const builder = new AppBuilder({
    sourceDir: './src',
    outputDir: './build',
    app,
  });

  const validation = builder.validate();
  if (!validation.valid) {
    console.error('  Validation failed:', validation.errors);
    return;
  }
  console.log('  Validation passed\n');

  const { updateSetXml, files } = await builder.build();
  console.log(`  Build complete: ${files.size} files generated\n`);

  // Step 3: Test ServiceNow connection
  console.log('Step 3: Testing ServiceNow connection...');
  const config: ServiceNowConfig = {
    instanceUrl: 'https://dev12345.service-now.com',
    auth: {
      type: 'basic',
      username: 'admin',
      password: 'password',
    },
    tribble: {
      baseUrl: 'https://api.tribble.ai',
      apiToken: 'your-tribble-token',
      email: 'admin@company.com',
    },
    scopePrefix: 'x_tribble_complete',
  };

  const client = new ServiceNowClient(config);
  const connected = await client.testConnection();

  if (!connected) {
    console.error('  Connection failed!');
    return;
  }
  console.log('  Connection successful\n');

  // Step 4: Deploy application
  console.log('Step 4: Deploying application...');
  const updateSet = await client.createUpdateSet(
    `${app.name} v${app.version}`,
    app.description
  );
  console.log(`  Update set created: ${updateSet.sys_id}`);

  // Upload would happen here in real implementation
  console.log('  Deployment complete!\n');

  console.log('=== Workflow Complete ===');
}

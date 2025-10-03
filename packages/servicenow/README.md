# @tribble/sdk-servicenow

ServiceNow deployment module for Tribble SDK - Deploy AI-powered applications into ServiceNow's ecosystem.

## Overview

The ServiceNow module enables Tribble applications to run natively within ServiceNow as scoped applications, providing seamless integration between Tribble's AI platform and ServiceNow's ITSM/ITOM capabilities. This is critical for enterprises standardized on ServiceNow for IT operations.

## Features

- 🎯 **Native ServiceNow Integration** - Deploy as scoped applications
- 🤖 **AI-Powered Widgets** - Service Portal widgets with Tribble AI
- 🔌 **REST API Integration** - Scripted REST APIs for Tribble communication
- 📄 **Document Ingestion** - Automatic document processing into Tribble
- 🔍 **Smart Knowledge Base** - AI-powered knowledge article search
- 🎨 **UI Components** - Pre-built chat, upload, and agent widgets
- 🛠️ **CLI Tools** - Command-line tools for build and deployment
- 📦 **Update Sets** - Automatic generation of ServiceNow update sets

## Installation

```bash
npm install @tribble/sdk-servicenow
```

## Quick Start

### 1. Initialize a New Application

```bash
npx tribble-snow init --name "My AI App" --scope x_tribble_myapp
```

This creates a project structure:

```
servicenow-app/
├── app.json              # Application metadata
├── config/
│   └── config.json       # Configuration file
├── build/                # Built artifacts
├── .env.example          # Environment template
└── README.md            # Documentation
```

### 2. Configure Your Environment

Copy `.env.example` to `.env` and configure:

```env
# ServiceNow Configuration
SNOW_INSTANCE_URL=https://dev12345.service-now.com
SNOW_USERNAME=admin
SNOW_PASSWORD=your-password
SNOW_SCOPE_PREFIX=x_tribble_myapp

# Tribble Configuration
TRIBBLE_BASE_URL=https://api.tribble.ai
TRIBBLE_API_TOKEN=your-tribble-token
TRIBBLE_EMAIL=admin@company.com
TRIBBLE_DEFAULT_AGENT_ID=agent-123
```

### 3. Build the Application

```bash
npx tribble-snow build
```

This generates:
- Update set XML file
- Widget definitions
- Script includes
- System properties
- Business rules

### 4. Deploy to ServiceNow

```bash
npx tribble-snow deploy --update-set ./build/x_tribble_myapp_v1.0.0.xml
```

Or manually upload the update set through ServiceNow UI.

## Architecture

### Components

#### Service Portal Widgets

**Tribble AI Chat**
- Interactive chat interface
- Real-time AI responses
- Session management
- Context-aware conversations

**Document Upload**
- Drag-and-drop file upload
- Automatic ingestion to Tribble
- Progress tracking
- Multiple file support

**Agent Dashboard**
- Monitor AI agents
- View agent status
- Test agent connections
- Manage agent configurations

**Knowledge Search**
- AI-powered search
- Relevance scoring
- Natural language queries
- Instant results

#### Script Includes

**TribbleAPIClient**
```javascript
var client = new TribbleAPIClient();
var result = client.sendChatMessage('Hello AI', sessionId, agentId);
```

**TribbleIngestService**
```javascript
var ingestService = new TribbleIngestService();
var result = ingestService.ingestAttachment(attachmentSysId);
```

**TribbleAgentService**
```javascript
var agentService = new TribbleAgentService();
var result = agentService.processIncident(incidentSysId, agentId);
```

#### Scripted REST API

Base path: `/api/x_tribble/`

Endpoints:
- `POST /chat/message` - Send chat messages
- `POST /ingest/document` - Ingest documents
- `POST /agent/execute` - Execute agent actions
- `GET /status` - Check integration status

### Data Flow

```
ServiceNow UI → Widget → Server Script → TribbleAPIClient → Tribble Platform
                   ↓
              ServiceNow Data
                   ↓
           Business Rules → TribbleIngestService → Tribble Ingest
```

## CLI Commands

### init

Initialize a new ServiceNow application:

```bash
tribble-snow init [options]

Options:
  -n, --name <name>         Application name
  -s, --scope <scope>       Application scope (e.g., x_tribble_myapp)
  -v, --version <version>   Application version (default: "1.0.0")
  -d, --dir <directory>     Output directory (default: "./servicenow-app")
```

### build

Build the application for deployment:

```bash
tribble-snow build [options]

Options:
  -c, --config <path>   Path to config file (default: "./config/config.json")
  -a, --app <path>      Path to app.json (default: "./app.json")
  -o, --output <path>   Output directory (default: "./build")
```

### deploy

Deploy to ServiceNow instance:

```bash
tribble-snow deploy [options]

Options:
  -c, --config <path>      Path to config file
  -u, --update-set <path>  Path to update set XML
  --dry-run                Perform dry run without deployment
```

### test

Test connection to ServiceNow:

```bash
tribble-snow test [options]

Options:
  -c, --config <path>  Path to config file
```

### validate

Validate application configuration:

```bash
tribble-snow validate [options]

Options:
  -a, --app <path>  Path to app.json
```

## Programmatic API

### Creating a ServiceNow Client

```typescript
import { ServiceNowClient } from '@tribble/sdk-servicenow';

const client = new ServiceNowClient({
  instanceUrl: 'https://dev12345.service-now.com',
  auth: {
    type: 'basic',
    username: 'admin',
    password: 'password',
  },
  tribble: {
    baseUrl: 'https://api.tribble.ai',
    apiToken: 'your-token',
    email: 'admin@company.com',
  },
  scopePrefix: 'x_tribble_myapp',
});

// Test connection
const connected = await client.testConnection();

// Get instance info
const info = await client.getInstanceInfo();
```

### Building Applications

```typescript
import { AppBuilder, createDefaultApp } from '@tribble/sdk-servicenow';

const app = createDefaultApp('My AI App', 'x_tribble_myapp', '1.0.0');

const builder = new AppBuilder({
  sourceDir: './src',
  outputDir: './build',
  app,
});

// Validate
const validation = builder.validate();
if (!validation.valid) {
  console.error(validation.errors);
}

// Build
const { updateSetXml, files } = await builder.build();

// Package
const packageBuffer = await builder.package();
```

### Generating Update Sets

```typescript
import { UpdateSetGenerator } from '@tribble/sdk-servicenow';

const generator = new UpdateSetGenerator(app);

const updateSetXml = await generator.generate({
  scriptIncludes: [
    { name: 'TribbleAPIClient', script: clientScript },
  ],
  widgets: [chatWidget, uploadWidget],
  systemProperties: systemProps,
});
```

## Configuration

### ServiceNow Configuration

```typescript
interface ServiceNowConfig {
  instanceUrl: string;           // ServiceNow instance URL
  auth: {
    type: 'basic' | 'oauth2';
    username?: string;
    password?: string;
    clientId?: string;
    clientSecret?: string;
  };
  tribble: {
    baseUrl: string;             // Tribble API URL
    apiToken: string;            // API token
    email: string;               // User email
    defaultAgentId?: string;     // Default agent
    ingestUrl?: string;          // Ingest endpoint
  };
  scopePrefix: string;           // App scope (e.g., x_tribble_app)
  apiVersion?: string;           // API version
  timeout?: number;              // Request timeout (ms)
}
```

### System Properties

The module creates these system properties in ServiceNow:

| Property | Description | Type |
|----------|-------------|------|
| `{scope}.tribble.base_url` | Tribble API base URL | string |
| `{scope}.tribble.api_token` | API authentication token | password |
| `{scope}.tribble.email` | User email for Tribble | string |
| `{scope}.tribble.default_agent_id` | Default agent ID | string |
| `{scope}.tribble.ingest_url` | Ingest endpoint URL | string |
| `{scope}.api.timeout` | API timeout (ms) | integer |
| `{scope}.auto_process_incidents` | Auto-process incidents | boolean |

## Usage Examples

### Adding Chat Widget to Service Portal

1. Open Service Portal page in Portal Designer
2. Click "Add Widget"
3. Search for "Tribble AI Chat"
4. Configure options:
   - Title: "AI Assistant"
   - Welcome Message: "How can I help you?"
   - Agent ID: Your agent ID
5. Save and publish

### Processing Incidents with AI

```javascript
// Business Rule on incident table
(function executeRule(current, previous) {
  var agentService = new TribbleAgentService();
  var agentId = gs.getProperty('x_tribble.tribble.default_agent_id');

  var result = agentService.processIncident(
    current.sys_id.toString(),
    agentId
  );

  if (result.success && result.data.recommendations) {
    current.work_notes = 'AI Analysis: ' + result.data.recommendations;
    current.update();
  }
})(current, previous);
```

### Ingesting Knowledge Articles

```javascript
// Scheduled Job
var ingestService = new TribbleIngestService();
var kb = new GlideRecord('kb_knowledge');
kb.addQuery('workflow_state', 'published');
kb.addQuery('sys_updated_on', '>', gs.daysAgoStart(1));
kb.query();

while (kb.next()) {
  ingestService.ingestKnowledgeArticle(kb.sys_id.toString());
}
```

### Custom REST API Integration

```javascript
// Scripted REST Resource
(function process(request, response) {
  var tribbleClient = new TribbleAPIClient();
  var requestBody = request.body.data;

  var result = tribbleClient.sendChatMessage(
    requestBody.message,
    requestBody.sessionId,
    requestBody.agentId
  );

  if (result.success) {
    response.setStatus(200);
    response.setBody(result.data);
  } else {
    response.setStatus(500);
    response.setBody({ error: result.error });
  }
})(request, response);
```

## Best Practices

### Security

1. **Use OAuth2** for production environments
2. **Store API tokens** in system properties (password type)
3. **Implement rate limiting** on REST endpoints
4. **Validate all inputs** before sending to Tribble
5. **Use ACLs** to restrict access to sensitive operations

### Performance

1. **Cache responses** where appropriate
2. **Use async processing** for long-running operations
3. **Implement connection pooling** for REST calls
4. **Monitor API usage** and set appropriate timeouts
5. **Batch operations** when processing multiple records

### Development

1. **Use source control** for all customizations
2. **Test in sub-production** before deploying to production
3. **Version your update sets** consistently
4. **Document custom modifications** thoroughly
5. **Follow ServiceNow naming conventions**

## Troubleshooting

### Connection Issues

**Problem**: Cannot connect to Tribble API

**Solution**:
1. Verify `tribble.base_url` system property
2. Check API token validity
3. Ensure network connectivity from ServiceNow
4. Review MID Server configuration if on-premise

### Widget Not Loading

**Problem**: Widget shows error or doesn't render

**Solution**:
1. Check browser console for JavaScript errors
2. Verify widget is properly configured
3. Ensure script includes are activated
4. Check Service Portal cache

### Authentication Failures

**Problem**: 401 Unauthorized errors

**Solution**:
1. Verify API token in system properties
2. Check token hasn't expired
3. Ensure email is correctly configured
4. Review Tribble platform permissions

## API Reference

See TypeScript definitions in `src/types/index.ts` for complete API documentation.

## Support

- **Documentation**: [Tribble ServiceNow Integration Guide]
- **Issues**: Report issues on GitHub
- **Community**: Join Tribble developer community

## License

UNLICENSED - Proprietary Tribble SDK

## Version History

### 0.1.0 (Current)

- Initial release
- Service Portal widgets (Chat, Upload, Agent, Knowledge)
- Script Includes (APIClient, IngestService, AgentService)
- CLI tools for build and deployment
- Update set generation
- REST API integration
- System properties configuration
- Business rules support
- Documentation and examples

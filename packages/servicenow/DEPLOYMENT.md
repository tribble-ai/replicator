# ServiceNow Deployment Guide

Complete guide for deploying Tribble-powered applications to ServiceNow.

## Package Structure

```
@tribble/sdk-servicenow/
├── src/
│   ├── index.ts                    # Main entry point
│   ├── config.ts                   # Configuration management
│   ├── client.ts                   # ServiceNow API client
│   ├── builder.ts                  # Application builder
│   ├── generator.ts                # Update set XML generator
│   ├── cli.ts                      # CLI tool
│   ├── examples.ts                 # Usage examples
│   ├── types/
│   │   └── index.ts               # TypeScript type definitions
│   ├── ui/
│   │   ├── index.ts               # UI component exports
│   │   └── widgets.ts             # Additional widgets
│   ├── scripts/
│   │   ├── index.ts               # Server-side scripts
│   │   └── api-resources.ts       # REST API resources
│   └── templates/
│       └── index.ts               # ServiceNow templates
├── package.json
├── tsconfig.json
├── README.md
└── DEPLOYMENT.md                   # This file
```

## Components Overview

### 1. Service Portal Widgets (4)

**Tribble AI Chat Widget**
- Real-time AI chat interface
- Session management
- Context-aware responses
- Customizable appearance

**Tribble Document Upload Widget**
- Drag-and-drop interface
- Multiple file support
- Progress tracking
- Automatic ingestion to Tribble

**Tribble Agent Dashboard Widget**
- Monitor AI agents
- View agent status
- Test connections
- Manage configurations

**Tribble Knowledge Search Widget**
- AI-powered search
- Relevance scoring
- Natural language queries
- Instant results

### 2. Script Includes (3)

**TribbleAPIClient**
- Core API client for Tribble platform
- Handles authentication
- Manages HTTP requests
- Error handling

**TribbleIngestService**
- Document ingestion service
- Attachment processing
- Knowledge article sync
- Bulk operations

**TribbleAgentService**
- Agent interaction service
- Incident processing
- Response generation
- Knowledge suggestions

### 3. Scripted REST API (1)

**Tribble API** (`/api/x_tribble/`)
- `POST /chat/message` - Chat messages
- `POST /ingest/document` - Document ingestion
- `POST /agent/execute` - Agent actions
- `GET /status` - Integration status

### 4. Business Rules (1)

**Auto-process Incidents**
- Triggers on incident creation
- Analyzes with AI
- Updates work notes
- Configurable via system property

### 5. System Properties (7)

Configuration properties for Tribble integration:
- Base URL
- API Token (encrypted)
- Email
- Default Agent ID
- Ingest URL
- Timeout
- Auto-process flag

## Installation Methods

### Method 1: CLI Installation (Recommended)

```bash
# Install CLI globally
npm install -g @tribble/sdk-servicenow

# Initialize new project
tribble-snow init --name "My App" --scope x_tribble_myapp

# Configure
cd servicenow-app
cp .env.example .env
# Edit .env with your credentials

# Build
tribble-snow build

# Deploy
tribble-snow deploy --update-set ./build/x_tribble_myapp_v1.0.0.xml
```

### Method 2: Manual Installation

1. **Build Update Set**
   ```bash
   npm run build
   ```

2. **Upload to ServiceNow**
   - Navigate to **System Update Sets > Retrieved Update Sets**
   - Click **Import Update Set from XML**
   - Select the XML file from `build/` directory
   - Click **Upload**

3. **Preview and Commit**
   - Open the uploaded update set
   - Click **Preview Update Set**
   - Review for conflicts
   - Click **Commit Update Set**

4. **Configure System Properties**
   - Navigate to **System Properties**
   - Filter by your scope prefix
   - Update Tribble configuration values

### Method 3: Programmatic Deployment

```typescript
import { ServiceNowClient, AppBuilder, createDefaultApp } from '@tribble/sdk-servicenow';

// Create app
const app = createDefaultApp('My App', 'x_tribble_myapp');

// Build
const builder = new AppBuilder({
  sourceDir: './src',
  outputDir: './build',
  app,
});

const { updateSetXml } = await builder.build();

// Deploy
const client = new ServiceNowClient(config);
await client.uploadApplication('myapp.xml', updateSetXml);
```

## Configuration

### Environment Variables

```env
# ServiceNow Configuration
SNOW_INSTANCE_URL=https://dev12345.service-now.com
SNOW_AUTH_TYPE=basic
SNOW_USERNAME=admin
SNOW_PASSWORD=your-password
SNOW_SCOPE_PREFIX=x_tribble_myapp

# For OAuth2
SNOW_AUTH_TYPE=oauth2
SNOW_CLIENT_ID=your-client-id
SNOW_CLIENT_SECRET=your-client-secret
SNOW_TOKEN_URL=https://dev12345.service-now.com/oauth_token.do

# Tribble Configuration
TRIBBLE_BASE_URL=https://api.tribble.ai
TRIBBLE_API_TOKEN=your-tribble-token
TRIBBLE_EMAIL=admin@company.com
TRIBBLE_DEFAULT_AGENT_ID=agent-123
TRIBBLE_INGEST_URL=https://ingest.tribble.ai

# Optional
SNOW_API_VERSION=v1
SNOW_TIMEOUT=30000
```

### Configuration File

```json
{
  "instanceUrl": "https://dev12345.service-now.com",
  "auth": {
    "type": "basic",
    "username": "admin",
    "password": "password"
  },
  "tribble": {
    "baseUrl": "https://api.tribble.ai",
    "apiToken": "your-token",
    "email": "admin@company.com",
    "defaultAgentId": "agent-123"
  },
  "scopePrefix": "x_tribble_myapp"
}
```

## Post-Installation Steps

### 1. Verify Installation

```bash
tribble-snow test --config ./config/config.json
```

Or in ServiceNow:
- Navigate to **System Applications > Applications**
- Find your Tribble app
- Verify all components are installed

### 2. Configure System Properties

Navigate to **System Properties** and set:
1. `x_tribble_myapp.tribble.base_url`
2. `x_tribble_myapp.tribble.api_token`
3. `x_tribble_myapp.tribble.email`
4. `x_tribble_myapp.tribble.default_agent_id`

### 3. Add Widgets to Service Portal

1. Open **Service Portal > Service Portal Configuration**
2. Select your portal
3. Edit a page in Portal Designer
4. Add Tribble widgets from widget library
5. Configure widget options
6. Save and publish

### 4. Test Integration

**Test Chat Widget:**
1. Navigate to Service Portal page with chat widget
2. Send a test message
3. Verify AI response

**Test Document Upload:**
1. Upload a test document
2. Check Tribble platform for ingested document
3. Verify metadata

**Test Agent Processing:**
1. Create a test incident
2. Check if business rule triggers
3. Review work notes for AI analysis

## Usage Examples

### Using Chat Widget

```html
<!-- Add to Service Portal page -->
<widget id="tribble_chat_widget" options='{
  "title": "AI Assistant",
  "welcomeMessage": "Hello! How can I help?",
  "agentId": "agent-123"
}'></widget>
```

### Using API Client in Scripts

```javascript
// In Script Include or Business Rule
var client = new TribbleAPIClient();

var result = client.sendChatMessage(
  'Analyze this incident',
  'session-123',
  'agent-456',
  { incidentNumber: 'INC0001234' }
);

if (result.success) {
  gs.info('Response: ' + result.data.message);
}
```

### Ingesting Documents

```javascript
// Auto-ingest attachments
var ingestService = new TribbleIngestService();

var gr = new GlideRecord('sys_attachment');
gr.addQuery('table_name', 'incident');
gr.addQuery('sys_created_on', '>', gs.daysAgoStart(1));
gr.query();

while (gr.next()) {
  ingestService.ingestAttachment(gr.sys_id.toString());
}
```

### Processing Incidents with AI

```javascript
// In Business Rule
var agentService = new TribbleAgentService();
var result = agentService.processIncident(
  current.sys_id.toString(),
  gs.getProperty('x_tribble_myapp.tribble.default_agent_id')
);

if (result.success) {
  current.work_notes = 'AI Analysis:\n' + result.data.recommendations;
  current.update();
}
```

## Troubleshooting

### Connection Issues

**Problem:** Cannot connect to Tribble API

**Solutions:**
1. Verify `tribble.base_url` is correct
2. Check API token validity
3. Ensure network connectivity
4. Review firewall rules
5. Check MID Server if on-premise

**Debugging:**
```javascript
var client = new TribbleAPIClient();
gs.info('Base URL: ' + client.baseUrl);
gs.info('Has Token: ' + !!client.apiToken);
```

### Widget Not Loading

**Problem:** Widget shows blank or error

**Solutions:**
1. Check browser console for errors
2. Verify widget dependencies
3. Clear Service Portal cache
4. Check widget configuration
5. Verify script includes are active

**Clear Cache:**
```
/sp_admin?id=sp_config
Clear Cache > Clear Service Portal Cache
```

### Authentication Failures

**Problem:** 401 Unauthorized errors

**Solutions:**
1. Verify API token in system properties
2. Check token hasn't expired
3. Ensure email is configured
4. Review Tribble platform permissions

**Test Authentication:**
```javascript
var client = new TribbleAPIClient();
var status = client.getAgentStatus('test-agent');
gs.info('Auth Status: ' + JSON.stringify(status));
```

### Performance Issues

**Problem:** Slow response times

**Solutions:**
1. Increase timeout in system properties
2. Check network latency
3. Review Tribble API rate limits
4. Optimize query patterns
5. Use async processing for bulk operations

**Adjust Timeout:**
```
System Properties > x_tribble_myapp.api.timeout
Value: 60000 (60 seconds)
```

## Best Practices

### Security

1. **Use Encrypted Properties**
   - Store API tokens in password-type properties
   - Never log sensitive data
   - Use ACLs to restrict access

2. **Implement Rate Limiting**
   - Add throttling to REST endpoints
   - Use queue for bulk operations
   - Monitor API usage

3. **Validate Inputs**
   - Sanitize all user inputs
   - Validate before API calls
   - Use GlideStringUtil for encoding

### Performance

1. **Cache Responses**
   - Cache agent responses
   - Use GlideCache for session data
   - Implement TTL for cache entries

2. **Async Processing**
   - Use scheduled jobs for bulk operations
   - Process large datasets in batches
   - Implement job queues

3. **Optimize Queries**
   - Use indexed fields
   - Limit record fetching
   - Use GlideAggregate for counts

### Development

1. **Version Control**
   - Use Git for customizations
   - Tag releases
   - Maintain changelog

2. **Testing**
   - Test in sub-production first
   - Create test data
   - Automate testing where possible

3. **Documentation**
   - Document customizations
   - Maintain API documentation
   - Update README for changes

## Support and Resources

### Documentation
- [ServiceNow Integration Guide](https://docs.tribble.ai/servicenow)
- [API Reference](https://api.tribble.ai/docs)
- [Best Practices](https://docs.tribble.ai/best-practices)

### Community
- [Developer Forum](https://community.tribble.ai)
- [GitHub Issues](https://github.com/tribble/sdk/issues)
- [Discord Channel](https://discord.gg/tribble)

### Enterprise Support
- Email: support@tribble.ai
- Portal: https://support.tribble.ai
- Phone: 1-800-TRIBBLE

## Version History

### 0.1.0 (Current)
- Initial release
- 4 Service Portal widgets
- 3 Script Includes
- Scripted REST API
- Business Rules support
- CLI tools
- Update set generation
- Complete documentation

## License

UNLICENSED - Proprietary Tribble SDK

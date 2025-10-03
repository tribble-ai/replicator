# @tribble/sdk-sap

SAP S/4HANA deployment module for Tribble SDK. Build and deploy AI-powered Fiori applications integrated with Tribble platform.

## Overview

The Tribble SAP SDK enables seamless integration between Tribble AI platform and SAP S/4HANA ecosystem. Deploy Tribble capabilities as native Fiori applications in SAP Launchpad, with full support for both on-premise S/4HANA and SAP BTP (Business Technology Platform).

### Key Features

- **Fiori Application Scaffolding** - Generate production-ready SAPUI5/Fiori apps
- **OData Service Generation** - Create OData v2/v4 services that proxy to Tribble APIs
- **ABAP Integration Classes** - Pre-built ABAP classes for Tribble API communication
- **SAP BTP Support** - Deploy to Cloud Foundry with one command
- **On-Premise Deployment** - Full support for on-premise S/4HANA systems
- **Fiori Launchpad Integration** - Configure apps for SAP Launchpad and Mobile Start
- **CLI Tools** - Command-line interface for build and deployment workflows

## Installation

```bash
npm install @tribble/sdk-sap
```

## Quick Start

### 1. Initialize Configuration

```typescript
import { initializeSAPSDK } from '@tribble/sdk-sap';

const configManager = initializeSAPSDK({
  sapConfig: {
    systemId: 'S4H',
    client: '100',
    baseUrl: 'https://s4h.example.com',
    target: 'on-premise',
    language: 'EN',
  },
  tribbleConfig: {
    apiUrl: 'https://api.tribble.ai',
    apiKey: 'your-api-key',
  },
});
```

### 2. Scaffold a Fiori Application

Using CLI:

```bash
npx tribble-sap scaffold \
  --name "TribbleChat" \
  --type chat \
  --output ./my-fiori-app \
  --namespace com.company.tribble
```

Using TypeScript:

```typescript
import { generateManifest, generateComponent } from '@tribble/sdk-sap';

const manifest = generateManifest({
  appId: 'com.company.tribble.chat',
  appName: 'Tribble Chat',
  description: 'AI-powered chat for SAP',
  version: '1.0.0',
  namespace: 'com.company.tribble.chat',
  odataService: '/sap/odata/tribble/chat/',
  appType: 'chat',
});
```

### 3. Generate OData Services

```bash
npx tribble-sap generate-odata --service all --output ./odata
```

Or programmatically:

```typescript
import {
  createTribbleChatService,
  ODataMetadataGenerator,
} from '@tribble/sdk-sap';

const service = createTribbleChatService();
const generator = new ODataMetadataGenerator(service);
const metadata = generator.generate();

// Deploy to SAP Gateway
```

### 4. Generate ABAP Classes

```bash
npx tribble-sap generate-abap --output ./abap
```

This generates:
- `ZCL_TRIBBLE_API_CLIENT.abap` - Main API client
- `ZCL_TRIBBLE_CHAT.abap` - Chat integration
- `ZCL_TRIBBLE_INGEST.abap` - Document ingestion
- `ZCL_TRIBBLE_AGENT.abap` - Agent execution
- `ZTRIBBLE_TYPES.abap` - Type definitions
- `CX_TRIBBLE_API_ERROR.abap` - Exception class

### 5. Build and Deploy

#### For SAP BTP (Cloud Foundry):

```bash
npx tribble-sap build --target btp
npx tribble-sap deploy --target btp
```

#### For On-Premise S/4HANA:

```bash
npx tribble-sap build --target on-premise
npx tribble-sap deploy --target on-premise
```

## Architecture

### Component Overview

```
┌─────────────────────────────────────────────────┐
│         SAP Fiori Launchpad                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Tribble  │  │ Tribble  │  │ Tribble  │      │
│  │   Chat   │  │  Upload  │  │  Agent   │      │
│  └──────────┘  └──────────┘  └──────────┘      │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│           OData Services (Gateway)              │
│  ┌──────────────────────────────────────────┐  │
│  │  TribbleChatService (CRUD operations)    │  │
│  │  TribbleIngestService (Document upload)  │  │
│  │  TribbleAgentService (Agent execution)   │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│              ABAP Layer (S/4HANA)               │
│  ┌──────────────────────────────────────────┐  │
│  │  ZCL_TRIBBLE_API_CLIENT                  │  │
│  │  - HTTP client configuration             │  │
│  │  - Authentication handling               │  │
│  │  - Request/response processing           │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │  Business Logic Classes                  │  │
│  │  - ZCL_TRIBBLE_CHAT                      │  │
│  │  - ZCL_TRIBBLE_INGEST                    │  │
│  │  - ZCL_TRIBBLE_AGENT                     │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│         RFC/HTTP Destination (SM59)             │
│  Name: ZTRIBBLE_API                             │
│  Type: HTTP Connection to External Server       │
│  Target: https://api.tribble.ai                 │
│  Auth: API Key / OAuth2                         │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│            Tribble AI Platform                  │
│  - Chat & Agents                                │
│  - Document Ingestion                           │
│  - RAG & Knowledge Base                         │
└─────────────────────────────────────────────────┘
```

## Application Types

### 1. Tribble Chat

AI-powered chat interface integrated into SAP.

```typescript
import { generateChatView, generateChatController } from '@tribble/sdk-sap';

// Generated files include:
// - TribbleChat.view.xml (SAPUI5 view)
// - TribbleChat.controller.js (Controller logic)
// - OData service binding for conversations
```

**Features:**
- Agent selection dropdown
- Real-time message streaming
- Conversation history
- SAP user context integration

### 2. Tribble Document Upload

Document ingestion for RAG and knowledge base.

```typescript
import { generateUploadView } from '@tribble/sdk-sap';

// Generated files include:
// - TribbleUpload.view.xml
// - File upload component
// - Collection management
// - Processing status tracking
```

**Features:**
- Collection selection
- Multi-file upload
- Processing status
- SAP document integration

### 3. Tribble Agent Interface

Execute Tribble agents with SAP business context.

```typescript
import { generateTribbleAgentClass } from '@tribble/sdk-sap';

// ABAP class for agent execution
// - Context enrichment with SAP data
// - Streaming responses
// - Error handling
```

**Features:**
- Agent execution with SAP context
- Business data enrichment
- Workflow integration
- Authorization checks

## OData Services

### TribbleChat Service

```xml
<EntityType Name="Conversation">
  <Key>
    <PropertyRef Name="id"/>
  </Key>
  <Property Name="id" Type="Edm.String" Nullable="false"/>
  <Property Name="title" Type="Edm.String" MaxLength="255"/>
  <Property Name="agentId" Type="Edm.String" MaxLength="100"/>
  <Property Name="userId" Type="Edm.String" MaxLength="100"/>
  <Property Name="createdAt" Type="Edm.DateTime" Nullable="false"/>
  <Property Name="status" Type="Edm.String" MaxLength="50"/>
</EntityType>
```

### TribbleIngest Service

```xml
<EntityType Name="Document">
  <Key>
    <PropertyRef Name="id"/>
  </Key>
  <Property Name="id" Type="Edm.String" Nullable="false"/>
  <Property Name="collectionId" Type="Edm.String" Nullable="false"/>
  <Property Name="filename" Type="Edm.String" MaxLength="500"/>
  <Property Name="status" Type="Edm.String" MaxLength="50"/>
  <Property Name="uploadedAt" Type="Edm.DateTime" Nullable="false"/>
</EntityType>
```

### TribbleAgent Service

```xml
<EntityType Name="AgentExecution">
  <Key>
    <PropertyRef Name="id"/>
  </Key>
  <Property Name="id" Type="Edm.String" Nullable="false"/>
  <Property Name="agentId" Type="Edm.String" Nullable="false"/>
  <Property Name="input" Type="Edm.String"/>
  <Property Name="output" Type="Edm.String"/>
  <Property Name="status" Type="Edm.String" MaxLength="50"/>
</EntityType>
```

## ABAP Integration

### API Client Usage

```abap
DATA: lo_client TYPE REF TO zcl_tribble_api_client,
      lv_response TYPE string,
      lv_agent_id TYPE string,
      lv_message TYPE string.

" Create API client
CREATE OBJECT lo_client
  EXPORTING
    iv_api_url = 'https://api.tribble.ai'
    iv_api_key = 'your-api-key'.

" Send message to agent
lv_agent_id = 'agent-123'.
lv_message = 'What is the status of sales order 12345?'.

TRY.
    lo_client->send_message(
      EXPORTING
        iv_agent_id = lv_agent_id
        iv_message = lv_message
      RECEIVING
        rv_response = lv_response
    ).

    " Process response
    WRITE: / 'Agent response:', lv_response.

  CATCH cx_tribble_api_error INTO DATA(lx_error).
    WRITE: / 'Error:', lx_error->get_text( ).
ENDTRY.
```

### Document Upload

```abap
DATA: lo_ingest TYPE REF TO zcl_tribble_ingest,
      lv_document_id TYPE string,
      lv_content TYPE xstring.

" Create ingest client
CREATE OBJECT lo_ingest.

" Upload document
TRY.
    lo_ingest->upload_file(
      EXPORTING
        iv_collection_id = 'col-123'
        iv_filename = 'sales_report.pdf'
        iv_content = lv_content
        iv_mime_type = 'application/pdf'
      RECEIVING
        rv_document_id = lv_document_id
    ).

    WRITE: / 'Document uploaded:', lv_document_id.

  CATCH cx_tribble_api_error INTO DATA(lx_error).
    WRITE: / 'Upload failed:', lx_error->get_text( ).
ENDTRY.
```

### Agent Execution

```abap
DATA: lo_agent TYPE REF TO zcl_tribble_agent,
      lv_output TYPE string,
      ls_context TYPE ts_context.

" Prepare SAP context
ls_context-user_id = sy-uname.
ls_context-session_id = sy-sessn.
ls_context-language = sy-langu.

" Create agent client
CREATE OBJECT lo_agent.

" Execute agent with context
TRY.
    lo_agent->execute(
      EXPORTING
        iv_agent_id = 'agent-123'
        iv_input = 'Analyze Q4 sales performance'
        is_context = ls_context
      RECEIVING
        rv_output = lv_output
    ).

    WRITE: / 'Agent output:', lv_output.

  CATCH cx_tribble_api_error INTO DATA(lx_error).
    WRITE: / 'Execution failed:', lx_error->get_text( ).
ENDTRY.
```

## SAP Configuration

### 1. RFC Destination Setup (SM59)

```
Destination Name: ZTRIBBLE_API
Connection Type: G (HTTP to External Server)
Description: Tribble AI Platform API

Technical Settings:
- Target Host: api.tribble.ai
- Port: 443
- Path Prefix: /api/v1

Logon & Security:
- SSL: Active
- Authentication: API Key (in header)
- Header: X-API-Key: your-api-key-here
```

### 2. OData Service Registration (/IWFND/MAINT_SERVICE)

```
Service Name: TRIBBLE_CHAT_SRV
External Service Name: TribbleChat
Technical Model: ZTRIBBLE_CHAT_MDL
Technical Service: ZTRIBBLE_CHAT_SRV
```

### 3. Fiori Launchpad Configuration

```
Catalog: ZTRIBBLE_CATALOG
Group: TRIBBLE_AI
Tile:
  - Type: Static
  - Title: Tribble Chat
  - Subtitle: AI Assistant
  - Icon: sap-icon://message-popup
  - Target Mapping: tribble-display
```

## SAP BTP Deployment

### 1. Prerequisites

```bash
# Install Cloud Foundry CLI
brew install cloudfoundry/tap/cf-cli

# Login to SAP BTP
cf login -a https://api.cf.us10.hana.ondemand.com
```

### 2. Configure xs-app.json

```json
{
  "welcomeFile": "index.html",
  "authenticationMethod": "route",
  "routes": [
    {
      "source": "^/tribble/(.*)$",
      "target": "$1",
      "destination": "tribble-api",
      "authenticationType": "none"
    },
    {
      "source": "^(.*)$",
      "target": "$1",
      "localDir": "webapp",
      "authenticationType": "xsuaa"
    }
  ]
}
```

### 3. Deploy to BTP

```bash
# Build application
npx tribble-sap build --target btp

# Deploy to Cloud Foundry
cf push -f manifest.yml
```

### 4. Bind Services

```bash
# Create destination service
cf create-service destination lite tribble-destination

# Bind to application
cf bind-service tribble-app tribble-destination

# Restage application
cf restage tribble-app
```

## On-Premise Deployment

### 1. Transport Management

```
1. Create transport request (SE10)
2. Package: ZTRIBBLE
3. Add ABAP classes
4. Add OData services
5. Release transport
6. Import to target system
```

### 2. BSP Application Upload

```
Transaction: /UI5/UI5_REPOSITORY_LOAD
BSP Application: ZTRIBBLE_CHAT
Local Path: ./dist/webapp
```

### 3. Gateway Service Activation

```
Transaction: /IWFND/MAINT_SERVICE
1. Add Service
2. System Alias: LOCAL
3. Technical Service Name: ZTRIBBLE_CHAT_SRV
4. Activate
```

## CLI Reference

### scaffold

Create new Fiori application:

```bash
tribble-sap scaffold [options]

Options:
  -n, --name <name>           Application name
  -t, --type <type>           App type (chat|upload|agent|freestyle)
  -o, --output <path>         Output directory
  --namespace <namespace>     Application namespace
  --sample-data              Include sample data
```

### generate-odata

Generate OData service metadata:

```bash
tribble-sap generate-odata [options]

Options:
  -s, --service <type>        Service type (chat|ingest|agent|all)
  -o, --output <path>         Output directory
```

### generate-abap

Generate ABAP integration classes:

```bash
tribble-sap generate-abap [options]

Options:
  -o, --output <path>         Output directory
```

### build

Build Fiori application:

```bash
tribble-sap build [options]

Options:
  -s, --source <path>         Source directory
  -o, --output <path>         Output directory
  --minify                    Minify JS and CSS
  --target <target>           Target (on-premise|btp)
```

### deploy

Deploy to SAP:

```bash
tribble-sap deploy [options]

Options:
  -t, --target <target>       Target (on-premise|btp)
  -p, --package <path>        Package path
  --system-id <id>           SAP system ID
  --force                     Force deployment
```

## Environment Variables

```bash
# SAP Configuration
SAP_SYSTEM_ID=S4H
SAP_CLIENT=100
SAP_BASE_URL=https://s4h.example.com
SAP_TARGET=on-premise
SAP_LANGUAGE=EN

# Tribble Configuration
TRIBBLE_API_URL=https://api.tribble.ai
TRIBBLE_API_KEY=your-api-key

# OAuth2 (optional)
TRIBBLE_OAUTH_TOKEN_ENDPOINT=https://auth.tribble.ai/token
TRIBBLE_OAUTH_CLIENT_ID=client-id
TRIBBLE_OAUTH_CLIENT_SECRET=client-secret
TRIBBLE_OAUTH_SCOPE=api:read api:write

# BTP Configuration
CF_ORG=your-org
CF_SPACE=dev
CF_API=https://api.cf.us10.hana.ondemand.com
```

## Best Practices

### 1. Security

- **Never hardcode API keys** - Use environment variables or secure storage
- **Enable SSL/TLS** - Always use HTTPS for Tribble API calls
- **Implement authorization** - Check SAP authorization objects before API calls
- **Audit logging** - Log all Tribble API interactions

### 2. Performance

- **Connection pooling** - Reuse HTTP connections in ABAP
- **Caching** - Cache agent responses when appropriate
- **Batch processing** - Use batch uploads for multiple documents
- **Async processing** - Use background jobs for long-running operations

### 3. Error Handling

- **Retry logic** - Implement exponential backoff for transient errors
- **Graceful degradation** - Handle Tribble API unavailability
- **User feedback** - Show meaningful error messages in Fiori apps
- **Monitoring** - Set up alerts for API failures

### 4. Data Integration

- **Context enrichment** - Include SAP business context in agent calls
- **Metadata mapping** - Map SAP fields to Tribble document metadata
- **Change tracking** - Sync SAP data changes to Tribble collections
- **Access control** - Respect SAP authorization in Tribble queries

## Troubleshooting

### Common Issues

#### 1. RFC Destination Connection Failed

```
Error: Connection to Tribble API failed
Solution:
- Verify host and port in SM59
- Check SSL certificate
- Test connection from ABAP
- Verify firewall rules
```

#### 2. OData Service Not Found

```
Error: Service TRIBBLE_CHAT_SRV not found
Solution:
- Register service in /IWFND/MAINT_SERVICE
- Activate service
- Clear ICF cache (/IWFND/CACHE_CLEANUP)
- Restart ICF service
```

#### 3. Authentication Failed

```
Error: 401 Unauthorized
Solution:
- Verify API key is correct
- Check OAuth token validity
- Ensure proper header format
- Test with Postman/curl first
```

#### 4. CORS Issues (BTP)

```
Error: CORS policy blocked request
Solution:
- Configure destination in BTP cockpit
- Add proper CORS headers
- Use destination service
- Check xs-app.json routing
```

## Examples

See the `/examples` directory for complete working examples:

- **chat-app** - Full-featured AI chat application
- **document-upload** - Document ingestion workflow
- **agent-workflow** - Agent execution with SAP data
- **btp-deployment** - Cloud Foundry deployment example
- **on-premise** - On-premise S/4HANA integration

## API Reference

Full API documentation: [https://docs.tribble.ai/sap](https://docs.tribble.ai/sap)

## Support

- Documentation: [https://docs.tribble.ai](https://docs.tribble.ai)
- Issues: [GitHub Issues](https://github.com/tribble/sdk/issues)
- Community: [Tribble Community Forum](https://community.tribble.ai)
- Enterprise Support: support@tribble.ai

## License

UNLICENSED - Proprietary software

## Contributing

This is a proprietary SDK. For feature requests or bug reports, please contact the Tribble team.

---

Built with ❤️ by Tribble for SAP developers

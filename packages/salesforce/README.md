# @tribble/sdk-salesforce

Salesforce deployment module for Tribble SDK. Deploy Tribble AI capabilities directly into Salesforce as unmanaged packages with Lightning Web Components and Apex integration.

## Overview

This package enables Tribble apps to live natively inside Salesforce, providing:

- **Lightning Web Components** for chat, document upload, and AI agent interaction
- **Apex Classes** as API proxies to Tribble platform
- **Custom Metadata Types** for configuration management
- **Remote Site Settings** for secure API communication
- **Production-ready** components following Salesforce best practices

## Features

### Lightning Web Components

1. **TribbleChat** - Real-time chat interface with AI agents
   - Conversation management
   - Streaming responses support
   - Message history
   - Export chat functionality

2. **TribbleUpload** - Document upload to Tribble platform
   - Multiple file format support (PDF, HTML, CSV, JSON, XLSX)
   - Metadata tagging
   - Progress tracking
   - Integration with Salesforce Files

### Apex Classes

1. **TribbleAPIClient** - Core HTTP client
   - Configurable authentication (API Key, OAuth, Named Credentials)
   - Request/response handling
   - Debug logging
   - Error handling

2. **TribbleAgentService** - Agent interaction service
   - Chat messaging
   - Conversation management
   - JSON parsing utilities

3. **TribbleIngestService** - Document ingestion service
   - File upload handling
   - Multiple format support
   - Salesforce Files integration
   - Metadata management

## Installation

### Prerequisites

- Salesforce org (Sandbox or Production)
- Salesforce CLI installed (`npm install -g @salesforce/cli`)
- Node.js 18+ for build tools
- Tribble API credentials

### Step 1: Build the Package

```bash
cd packages/salesforce
npm install
npm run build
npm run build:salesforce
```

### Step 2: Configure Remote Site Settings

Before deployment, you need to add Tribble API endpoints to Remote Site Settings in Salesforce:

1. Navigate to **Setup > Security > Remote Site Settings**
2. Click **New Remote Site**
3. Add the following:

**Production:**
- Remote Site Name: `Tribble_API_Production`
- Remote Site URL: `https://api.tribble.ai`
- Active: ✓

**Staging (Optional):**
- Remote Site Name: `Tribble_API_Staging`
- Remote Site URL: `https://api-staging.tribble.ai`
- Active: ✓ (if using staging)

### Step 3: Deploy to Salesforce

#### Option A: Using npm scripts

```bash
# Validate deployment (recommended first)
npm run deploy:validate

# Deploy to sandbox
sf org login web --alias my-sandbox
npm run deploy:test

# Deploy to production
sf org login web --alias my-production
npm run deploy:prod
```

#### Option B: Using Salesforce CLI directly

```bash
# Login to your org
sf org login web --alias my-org

# Validate deployment
sf project deploy validate \
  --manifest src/salesforce-package/manifest/package.xml \
  --target-org my-org

# Deploy
sf project deploy start \
  --manifest src/salesforce-package/manifest/package.xml \
  --target-org my-org \
  --test-level RunLocalTests
```

#### Option C: Using Workbench

1. Build the package: `npm run build:salesforce`
2. Navigate to [Workbench](https://workbench.developerforce.com)
3. Login to your org
4. Go to **migration > Deploy**
5. Upload the ZIP file from `dist/salesforce-package`
6. Configure deployment options
7. Deploy

### Step 4: Configure Tribble Settings

After deployment, configure the Tribble API connection:

1. Navigate to **Setup > Custom Metadata Types**
2. Click **Manage Records** next to **Tribble Configuration**
3. Click **New** to create a configuration record:
   - **Label**: `Default Config`
   - **Tribble Configuration Name**: `Default_Config`
   - **API Endpoint**: `https://api.tribble.ai`
   - **Authentication Method**: `api-key` (or `oauth`, `named-credentials`)
   - **API Key**: Your Tribble API key
   - **Enable Debug Logs**: ✓ (for development)

## Usage

### Adding Components to Lightning Pages

1. Navigate to a Lightning App, Record, or Home page
2. Click the gear icon and select **Edit Page**
3. Drag **Tribble AI Chat** or **Upload to Tribble** from the component list
4. Configure component properties
5. Save and activate

### Chat Component Example

```javascript
// The component automatically uses the current user's email
// and Custom Metadata configuration

// Optional: Pass a conversation ID to continue a chat
<c-tribble-chat conversation-id="conv-123"></c-tribble-chat>

// Custom configuration
<c-tribble-chat
    placeholder="Ask Tribble anything..."
    max-message-length="5000"
    show-typing-indicator="true">
</c-tribble-chat>
```

### Upload Component Example

```javascript
// Basic usage
<c-tribble-upload></c-tribble-upload>

// Custom configuration
<c-tribble-upload
    accepted-formats=".pdf,.docx,.txt"
    max-file-size-m-b="25"
    allow-multiple="true"
    auto-upload="false">
</c-tribble-upload>
```

### Using Apex in Custom Code

#### Chat Example

```apex
// Send a chat message
TribbleAgentService.ChatResponse response =
    TribbleAgentService.sendMessage('What is the status of my order?');

if (response.success) {
    System.debug('Response: ' + response.message);
    System.debug('Conversation ID: ' + response.conversationId);
}

// Continue a conversation
TribbleAgentService.ChatResponse followUp =
    TribbleAgentService.sendMessage(
        'Can you provide more details?',
        response.conversationId
    );
```

#### Upload Example

```apex
// Upload a PDF
TribbleIngestService.FileMetadata metadata = new TribbleIngestService.FileMetadata();
metadata.title = 'Invoice Q4 2024';
metadata.author = 'Finance Team';
metadata.category = 'invoices';
metadata.tags = new List<String>{'q4', '2024', 'finance'};

// From base64 content
TribbleIngestService.UploadResponse response =
    TribbleIngestService.uploadPDF('invoice.pdf', base64Content, metadata);

if (response.success) {
    System.debug('Uploaded document IDs: ' + response.documentIds);
}

// Upload from ContentVersion (Salesforce Files)
TribbleIngestService.UploadResponse cvResponse =
    TribbleIngestService.uploadFromContentVersion(contentVersionId, metadata);

// Upload from Attachment
TribbleIngestService.UploadResponse attResponse =
    TribbleIngestService.uploadFromAttachment(attachmentId, metadata);
```

## Configuration

### Authentication Methods

#### API Key (Recommended for Development)

```apex
// Set in Custom Metadata Type
Authentication Method: api-key
API Key: your-tribble-api-key
```

#### OAuth (Recommended for Production)

```apex
// Set in Custom Metadata Type
Authentication Method: oauth
OAuth Client ID: your-oauth-client-id
```

#### Named Credentials (Enterprise)

1. Create a Named Credential in Salesforce:
   - **Label**: `Tribble API`
   - **Name**: `Tribble_API`
   - **URL**: `https://api.tribble.ai`
   - **Identity Type**: Named Principal or Per User
   - **Authentication Protocol**: OAuth 2.0 or Password Authentication

2. Configure Custom Metadata:
```apex
Authentication Method: named-credentials
Named Credential: Tribble_API
```

### Custom Settings

Modify timeout and other settings in the Custom Metadata Type:

- **Timeout (ms)**: HTTP callout timeout (default: 120000)
- **Enable Debug Logs**: Enable verbose logging for troubleshooting
- **User Email Override**: Override the current user's email for testing

## Architecture

### Component Flow

```
Lightning Web Component (UI)
    ↓
Apex Controller
    ↓
TribbleAPIClient (HTTP)
    ↓
Remote Site Settings
    ↓
Tribble API
```

### Security

- **API Keys**: Stored securely in Custom Metadata (encrypted at rest)
- **Named Credentials**: OAuth tokens managed by Salesforce
- **Remote Site Settings**: Whitelist only necessary endpoints
- **Sharing Rules**: Components respect Salesforce sharing and security
- **Field-Level Security**: Enforce FLS in Apex with `with sharing`

### Mobile Support

All Lightning Web Components are mobile-responsive and work with:
- Salesforce Mobile App
- Mobile browsers
- Tablet devices

## Development

### TypeScript Types

```typescript
import type {
  SalesforceConfig,
  ApexChatResponse,
  ApexUploadResponse,
  LWCChatProps,
  LWCUploadProps
} from '@tribble/sdk-salesforce';

// Use types in your TypeScript code
const config: SalesforceConfig = {
  apiBaseUrl: 'https://api.tribble.ai',
  authMethod: 'api-key',
  apiKey: process.env.TRIBBLE_API_KEY
};
```

### Building Custom Components

```typescript
import { PackageBuilder } from '@tribble/sdk-salesforce';

const builder = new PackageBuilder('My Custom Package', '1.0.0');

builder
  .addApexClass('MyCustomService', apexCode)
  .addLWC('myComponent', jsCode, metadata)
  .addRemoteSiteSetting({
    fullName: 'My_API',
    url: 'https://api.example.com',
    isActive: true,
    description: 'Custom API'
  });

const manifest = builder.generateManifest();
```

### Testing

Create test classes in Salesforce:

```apex
@isTest
private class TribbleAgentServiceTest {
    @isTest
    static void testSendMessage() {
        Test.setMock(HttpCalloutMock.class, new TribbleMockResponse());

        Test.startTest();
        TribbleAgentService.ChatResponse response =
            TribbleAgentService.sendMessage('Hello Tribble');
        Test.stopTest();

        System.assert(response.success);
        System.assertNotEquals(null, response.message);
    }
}
```

## Troubleshooting

### Common Issues

**Error: "Remote site settings do not allow callout"**
- Solution: Add Tribble API URLs to Remote Site Settings

**Error: "Unauthorized"**
- Solution: Verify API key in Custom Metadata Type
- Check that the API key is valid in Tribble dashboard

**Error: "Maximum callout size exceeded"**
- Solution: Reduce file size or split into chunks
- Check maxFileSizeMB setting on upload component

**Components not appearing in Lightning App Builder**
- Solution: Ensure components are marked as `isExposed="true"`
- Refresh Lightning App Builder page

### Debug Logging

Enable debug logs in Custom Metadata:
1. Set **Enable Debug Logs** to `true`
2. Check logs in **Setup > Debug Logs**
3. Filter for `TribbleAPIClient`, `TribbleAgentService`, `TribbleIngestService`

## API Reference

### TribbleAPIClient

- `executeCallout(HTTPRequestWrapper)` - Execute HTTP callout
- `parseJSON(String)` - Parse JSON response
- `toJSON(Object)` - Serialize object to JSON
- `getCurrentUserEmail()` - Get current user's email
- `generateRequestId()` - Generate unique request ID

### TribbleAgentService

- `sendMessage(String message)` - Send chat message
- `sendMessage(String message, String conversationId)` - Continue conversation
- `formatInstructions(Object payload, String suffix)` - Format agent instructions
- `parseJSONFromText(String text)` - Extract JSON from text
- `getConversationHistory(String conversationId)` - Get conversation messages

### TribbleIngestService

- `uploadFile(String fileName, String fileContent, FileMetadata metadata)` - Upload file
- `uploadPDF(String fileName, String fileContent, FileMetadata metadata)` - Upload PDF
- `uploadHTML(String fileName, String htmlContent, FileMetadata metadata)` - Upload HTML
- `uploadStructuredData(String fileName, String content, String format, FileMetadata metadata)` - Upload CSV/JSON
- `uploadFromContentVersion(Id contentVersionId, FileMetadata metadata)` - Upload from Salesforce Files
- `uploadFromAttachment(Id attachmentId, FileMetadata metadata)` - Upload from Attachment

## Deployment Checklist

- [ ] Remote Site Settings configured
- [ ] Custom Metadata Type configured with API credentials
- [ ] Package built successfully (`npm run build:salesforce`)
- [ ] Validation passed (`npm run deploy:validate`)
- [ ] Test classes written and passing
- [ ] Components added to Lightning pages
- [ ] User permissions configured
- [ ] Production deployment scheduled
- [ ] Rollback plan documented

## License

See the main Tribble SDK license.

## Support

For issues and questions:
- GitHub Issues: [tribble-sdk](https://github.com/tribble/sdk)
- Documentation: [docs.tribble.ai](https://docs.tribble.ai)
- Email: support@tribble.ai

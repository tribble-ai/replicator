# Tribble SDK for Salesforce - Quick Start Guide

Get Tribble AI running in your Salesforce org in 15 minutes.

## Prerequisites

- Salesforce org (Sandbox recommended for testing)
- Tribble API key ([Get one here](https://tribble.ai/signup))
- Salesforce CLI installed: `npm install -g @salesforce/cli`

## 5-Step Installation

### Step 1: Build the Package

```bash
cd packages/salesforce
npm install
npm run build
npm run build:salesforce
```

### Step 2: Login to Salesforce

```bash
sf org login web --alias my-sandbox
```

This opens a browser window to authenticate with your Salesforce org.

### Step 3: Add Remote Site Settings

**Option A: Via Salesforce UI**

1. Go to **Setup** → **Security** → **Remote Site Settings**
2. Click **New Remote Site**
3. Enter:
   - Name: `Tribble_API_Production`
   - URL: `https://api.tribble.ai`
   - Active: ✓
4. Click **Save**

**Option B: Deploy with package** (Remote Site Settings are included in package.xml)

### Step 4: Deploy to Salesforce

```bash
sf project deploy start \
  --manifest src/salesforce-package/manifest/package.xml \
  --target-org my-sandbox
```

Wait for deployment to complete (usually 2-3 minutes).

### Step 5: Configure Tribble Settings

1. Go to **Setup** → **Custom Metadata Types**
2. Click **Manage Records** next to **Tribble Configuration**
3. Click **New**
4. Fill in:
   - **Label**: `Default Config`
   - **Tribble Configuration Name**: `Default_Config`
   - **API Endpoint**: `https://api.tribble.ai`
   - **Authentication Method**: `api-key`
   - **API Key**: `[Your Tribble API Key]`
   - **Enable Debug Logs**: ✓ (for testing)
5. Click **Save**

## Using the Components

### Add to Lightning Page

1. Navigate to any Lightning App, Record, or Home page
2. Click the gear icon → **Edit Page**
3. Find **Tribble AI Assistant** in the component list
4. Drag it onto the page
5. Configure properties (optional)
6. Click **Save** → **Activate**

### Test the Chat

1. Go to the page where you added the component
2. Type a message: "Hello Tribble!"
3. Press Send or hit Enter
4. You should receive a response from the AI

### Test Document Upload

1. Click the **Upload** tab in the Tribble AI Assistant
2. Click **Choose Files** and select a PDF or document
3. Optionally add metadata (title, tags, etc.)
4. Click **Upload to Tribble**
5. Wait for upload to complete

## Quick Examples

### Example 1: Chat in Apex

```apex
// Send a message
TribbleAgentService.ChatResponse response =
    TribbleAgentService.sendMessage('What are my recent opportunities?');

if (response.success) {
    System.debug('AI Response: ' + response.message);
}
```

### Example 2: Upload in Apex

```apex
// Upload a document from ContentVersion
TribbleIngestService.FileMetadata metadata = new TribbleIngestService.FileMetadata();
metadata.title = 'Q4 Report';
metadata.category = 'reports';

TribbleIngestService.UploadResponse uploadResp =
    TribbleIngestService.uploadFromContentVersion(contentVersionId, metadata);

if (uploadResp.success) {
    System.debug('Uploaded! Document IDs: ' + uploadResp.documentIds);
}
```

### Example 3: Custom Lightning Component

```javascript
// In your custom LWC
import { LightningElement } from 'lwc';
import sendMessage from '@salesforce/apex/TribbleAgentService.sendMessage';

export default class MyComponent extends LightningElement {
    async askTribble() {
        const result = await sendMessage({
            message: 'Summarize my pipeline',
            conversationId: null
        });

        console.log('Tribble says:', result.message);
    }
}
```

## Troubleshooting

### "Remote site settings do not allow callout"

**Solution:**
- Go to Setup → Security → Remote Site Settings
- Ensure `Tribble_API_Production` is Active
- URL should be `https://api.tribble.ai`

### "Unauthorized" Error

**Solution:**
- Check your API key in Custom Metadata Type
- Verify the key is valid at [tribble.ai/dashboard](https://tribble.ai/dashboard)
- Make sure Authentication Method is set to `api-key`

### Components Not Showing in App Builder

**Solution:**
- Refresh the Lightning App Builder page
- Check that components have `isExposed="true"` in metadata XML
- Clear browser cache

### Chat Not Responding

**Solution:**
1. Enable Debug Logs in Custom Metadata
2. Open Debug Logs: Setup → Debug Logs
3. Click **New** and add your user
4. Try chatting again
5. Check logs for error details

## Next Steps

### Customize Components

Edit component properties in Lightning App Builder:
- Chat placeholder text
- Max message length
- Upload file size limits
- Accepted file formats

### Add to Record Pages

Add Tribble AI to specific record pages:
1. Navigate to Account, Opportunity, or Case
2. Click Setup icon → Edit Page
3. Add Tribble AI Assistant component
4. Configure to show relevant context

### Create Workflows

Use Process Builder or Flow to:
- Auto-upload attachments to Tribble
- Send notifications to Tribble on record changes
- Trigger AI analysis on specific events

### Monitor Usage

Track API usage:
1. Check Debug Logs for API calls
2. Monitor Tribble dashboard for request counts
3. Set up alerts for errors

## Advanced Configuration

### Using Named Credentials

For enterprise deployments with OAuth:

1. Create Named Credential: Setup → Named Credentials
2. Configure OAuth 2.0 settings
3. Update Custom Metadata Type:
   - Authentication Method: `named-credentials`
   - Named Credential: `Tribble_API`

### Multi-Environment Setup

Create separate configurations for dev/staging/prod:

1. Duplicate Custom Metadata record
2. Name: `Production_Config`, `Staging_Config`
3. Update code to use appropriate config based on org

### Custom Error Handling

Implement custom error handling in Apex:

```apex
try {
    TribbleAgentService.ChatResponse response =
        TribbleAgentService.sendMessage('test');
} catch (Exception e) {
    // Log to custom object
    // Send email notification
    // Display user-friendly message
}
```

## Support Resources

- **Documentation**: [docs.tribble.ai](https://docs.tribble.ai)
- **API Reference**: [api.tribble.ai/docs](https://api.tribble.ai/docs)
- **Community**: [community.tribble.ai](https://community.tribble.ai)
- **Email Support**: support@tribble.ai

## What's Next?

- [Full README](./README.md) - Complete documentation
- [API Reference](#) - Detailed API documentation
- [Example Apps](#) - Sample applications
- [Best Practices](#) - Production deployment guide

---

**Need help?** Open an issue on GitHub or contact support@tribble.ai

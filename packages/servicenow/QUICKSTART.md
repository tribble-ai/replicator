# Quick Start Guide

Get your Tribble-powered ServiceNow app running in 5 minutes.

## Prerequisites

- Node.js 18 or higher
- ServiceNow instance (Orlando or later)
- Tribble platform account with API token
- Admin access to ServiceNow instance

## Step 1: Install CLI

```bash
npm install -g @tribble/sdk-servicenow
```

## Step 2: Initialize Project

```bash
tribble-snow init \
  --name "My AI App" \
  --scope x_tribble_myapp \
  --dir ./my-tribble-app

cd my-tribble-app
```

## Step 3: Configure Credentials

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# ServiceNow
SNOW_INSTANCE_URL=https://YOUR-INSTANCE.service-now.com
SNOW_USERNAME=admin
SNOW_PASSWORD=your-password
SNOW_SCOPE_PREFIX=x_tribble_myapp

# Tribble
TRIBBLE_BASE_URL=https://api.tribble.ai
TRIBBLE_API_TOKEN=your-tribble-token
TRIBBLE_EMAIL=your-email@company.com
TRIBBLE_DEFAULT_AGENT_ID=your-agent-id
```

## Step 4: Test Connection

```bash
tribble-snow test
```

Expected output:
```
✅ Connection successful!

📊 Instance Information:
   Version: San Diego
   Build Date: 2024-01-15
```

## Step 5: Build Application

```bash
tribble-snow build
```

Expected output:
```
✅ Build completed successfully!
📦 Update set: ./build/x_tribble_myapp_v1.0.0.xml
📁 Output directory: ./build
📄 Files generated: 12
```

## Step 6: Deploy to ServiceNow

### Option A: Automated Deployment

```bash
tribble-snow deploy --update-set ./build/x_tribble_myapp_v1.0.0.xml
```

### Option B: Manual Deployment

1. Log into ServiceNow
2. Navigate to: **System Update Sets > Retrieved Update Sets**
3. Click **Import Update Set from XML**
4. Select: `./build/x_tribble_myapp_v1.0.0.xml`
5. Click **Upload**
6. Click **Preview Update Set**
7. Click **Commit Update Set**

## Step 7: Configure System Properties

1. Navigate to: **System Properties > System**
2. Filter by: `x_tribble_myapp`
3. Set these properties:
   - `x_tribble_myapp.tribble.base_url` = `https://api.tribble.ai`
   - `x_tribble_myapp.tribble.api_token` = Your Tribble API token
   - `x_tribble_myapp.tribble.email` = Your email
   - `x_tribble_myapp.tribble.default_agent_id` = Your agent ID

## Step 8: Add Widget to Service Portal

1. Navigate to: **Service Portal > Service Portal Configuration**
2. Select your portal (e.g., "Employee Self-Service")
3. Click **Edit** on homepage
4. Click **Add Widget**
5. Search for: "Tribble AI Chat"
6. Drag widget to page
7. Click widget settings icon
8. Configure:
   - Title: "AI Assistant"
   - Welcome Message: "Hello! How can I help you?"
9. Save and close Portal Designer

## Step 9: Test the Integration

### Test Chat Widget

1. Navigate to your Service Portal
2. Find the AI Chat widget
3. Type: "Hello"
4. Verify you get a response from Tribble AI

### Test Document Upload

1. Add the Upload widget to a page
2. Drag and drop a test PDF
3. Check Tribble platform for the ingested document

### Test Incident Processing

1. Create a new incident
2. Check work notes for AI analysis (if auto-processing is enabled)

## Step 10: Verify Installation

```bash
tribble-snow validate
```

Expected output:
```
✅ Configuration is valid!

📦 Application Details:
   Name: My AI App
   Scope: x_tribble_myapp
   Version: 1.0.0
   Components: 8
```

## What You Just Installed

### Service Portal Widgets
- ✅ Tribble AI Chat - Interactive chat interface
- ✅ Document Upload - File ingestion to Tribble
- ✅ Agent Dashboard - Monitor AI agents
- ✅ Knowledge Search - AI-powered search

### Server-Side Components
- ✅ TribbleAPIClient - API integration
- ✅ TribbleIngestService - Document processing
- ✅ TribbleAgentService - Agent interactions

### REST API
- ✅ `/api/x_tribble_myapp/chat/message`
- ✅ `/api/x_tribble_myapp/ingest/document`
- ✅ `/api/x_tribble_myapp/agent/execute`
- ✅ `/api/x_tribble_myapp/status`

### Business Rules
- ✅ Auto-process incidents with AI (disabled by default)

## Common Customizations

### Enable Auto-Processing of Incidents

1. Navigate to: **System Properties**
2. Find: `x_tribble_myapp.auto_process_incidents`
3. Set to: `true`
4. Save

Now all new incidents will be automatically analyzed by AI.

### Customize Chat Widget Appearance

1. Navigate to: **Service Portal > Widgets**
2. Search: "Tribble AI Chat"
3. Edit CSS:

```css
.tribble-chat-header {
  background: linear-gradient(135deg, #your-color 0%, #your-color 100%);
}
```

### Add Custom Business Logic

1. Navigate to: **System Definition > Script Includes**
2. Create new: "CustomTribbleHelper"
3. Extend TribbleAPIClient:

```javascript
var CustomTribbleHelper = Class.create();
CustomTribbleHelper.prototype = Object.extendsObject(TribbleAPIClient, {
    customMethod: function() {
        // Your custom logic
        return this.sendChatMessage('custom message', null, null);
    }
});
```

## Next Steps

### Explore Advanced Features

- **Scheduled Document Sync** - Auto-sync knowledge articles
- **Flow Integration** - Use Tribble in Flow Designer
- **Custom Widgets** - Build your own AI-powered widgets
- **MID Server Integration** - Connect on-premise data

### Learn More

- 📚 Read [Full Documentation](./README.md)
- 🚀 Review [Deployment Guide](./DEPLOYMENT.md)
- 💡 Check [Usage Examples](./src/examples.ts)
- 🔧 Browse [API Reference](./src/types/index.ts)

### Get Help

- 💬 [Community Forum](https://community.tribble.ai)
- 📧 Email: support@tribble.ai
- 📖 [Knowledge Base](https://docs.tribble.ai)

## Troubleshooting Quick Fixes

### "Cannot connect to ServiceNow"
```bash
# Check credentials
tribble-snow test

# Verify URL format
echo $SNOW_INSTANCE_URL
# Should be: https://instance.service-now.com
```

### "Widget not showing"
```javascript
// Clear Service Portal cache
// Navigate to: /sp_admin?id=sp_config
// Click: Clear Service Portal Cache
```

### "401 Unauthorized"
```bash
# Verify API token
# In ServiceNow: System Properties > x_tribble_myapp
# Check: tribble.api_token is set correctly
```

## Quick Commands Reference

```bash
# Initialize new app
tribble-snow init --name "App Name" --scope x_scope

# Test connection
tribble-snow test

# Build app
tribble-snow build

# Deploy app
tribble-snow deploy --update-set ./build/app.xml

# Validate config
tribble-snow validate

# Get help
tribble-snow --help
```

## Success Checklist

- [ ] CLI installed
- [ ] Project initialized
- [ ] Credentials configured
- [ ] Connection tested
- [ ] App built successfully
- [ ] Update set deployed
- [ ] System properties set
- [ ] Widget added to portal
- [ ] Chat tested and working
- [ ] Integration verified

## You're Ready!

Your Tribble-powered ServiceNow app is now live! 🎉

Start building AI-powered experiences for your users.

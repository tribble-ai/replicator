# SAP Deployment Guide

Complete guide for deploying Tribble applications to SAP S/4HANA and SAP BTP.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [On-Premise S/4HANA Deployment](#on-premise-s4hana-deployment)
3. [SAP BTP Deployment](#sap-btp-deployment)
4. [Configuration](#configuration)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Access

- **SAP GUI Access** (On-Premise)
  - Transaction SE80 (Object Navigator)
  - Transaction SM59 (RFC Destinations)
  - Transaction /IWFND/MAINT_SERVICE (OData Service Maintenance)
  - Transaction /UI5/UI5_REPOSITORY_LOAD (BSP Upload)
  - Transport creation rights

- **SAP BTP Access** (Cloud)
  - Cloud Foundry Space Developer role
  - Destination Service access
  - XSUAA Service access
  - HTML5 Application Repository access

### Required Tools

```bash
# Node.js and npm
node --version  # v18 or higher
npm --version   # v9 or higher

# SAP Cloud Foundry CLI (for BTP)
cf --version

# Tribble SAP CLI
npm install -g @tribble/sdk-sap
tribble-sap --version
```

### Tribble API Access

- API endpoint URL
- API key or OAuth2 credentials
- Collection IDs and Agent IDs

## On-Premise S/4HANA Deployment

### Step 1: Generate ABAP Classes

```bash
# Generate all ABAP integration classes
tribble-sap generate-abap --output ./abap

# Files generated:
# - ZCL_TRIBBLE_API_CLIENT.abap
# - ZCL_TRIBBLE_CHAT.abap
# - ZCL_TRIBBLE_INGEST.abap
# - ZCL_TRIBBLE_AGENT.abap
# - ZTRIBBLE_TYPES.abap
# - CX_TRIBBLE_API_ERROR.abap
```

### Step 2: Import ABAP Classes

#### Using SE80 (SAP GUI)

1. Open transaction **SE80**
2. Select **Package** and create package **ZTRIBBLE**
3. For each ABAP file:
   - Right-click package → Create → Class Library → Class
   - Enter class name (e.g., ZCL_TRIBBLE_API_CLIENT)
   - Copy content from .abap file
   - Activate class (Ctrl+F3)

#### Using ABAP Development Tools (Eclipse)

1. Open ABAP Development Tools
2. Connect to your SAP system
3. Right-click package **ZTRIBBLE** → New → ABAP Class
4. Paste code from .abap file
5. Save and activate (Ctrl+F3)

### Step 3: Configure RFC Destination

1. Open transaction **SM59**
2. Click **Create** (F5)
3. Enter destination name: **ZTRIBBLE_API**
4. Select connection type: **G** (HTTP Connection to External Server)
5. Click **Continue**

#### Technical Settings Tab

```
Target Host: api.tribble.ai
Service No: 443
Path Prefix: /api/v1
```

#### Logon & Security Tab

```
☑ SSL: Active
Status of Secure Protocol: HTTPS (SSL)

Security Method: Basic Authentication
User: (leave empty)
Password: (leave empty)
```

#### Special Options Tab

Add HTTP Header Fields:

```
Name         | Value
-------------|---------------------------
X-API-Key    | your-tribble-api-key-here
Content-Type | application/json
```

#### Test Connection

1. Click **Connection Test** button
2. Should see: "Connection to destination ZTRIBBLE_API OK"
3. Click **HTTP Test** to verify API access
4. Save destination

### Step 4: Generate OData Services

```bash
# Generate OData metadata
tribble-sap generate-odata --service all --output ./odata

# Files generated:
# - TribbleChat_metadata.xml
# - TribbleIngest_metadata.xml
# - TribbleAgent_metadata.xml
```

### Step 5: Register OData Services in Gateway

1. Open transaction **/IWFND/MAINT_SERVICE**
2. Click **Add Service**
3. Enter System Alias: **LOCAL**
4. Click **Get Services**

For each service (Chat, Ingest, Agent):

1. Click **Add Selected Services**
2. Enter:
   - External Service Name: TRIBBLE_CHAT_SRV
   - Package Assignment: ZTRIBBLE
3. Confirm transport request
4. Service is now active

#### Import Metadata Manually

If auto-registration fails:

1. Transaction **/IWFND/MAINT_SERVICE**
2. Click **Service Catalog** → **Import**
3. Select metadata.xml file
4. Enter service name and namespace
5. Assign to package ZTRIBBLE
6. Activate service

### Step 6: Build Fiori Application

```bash
# Scaffold Fiori app
tribble-sap scaffold \
  --name "Tribble Chat" \
  --type chat \
  --output ./fiori-chat \
  --namespace com.company.tribble.chat

# Build for on-premise
cd fiori-chat
npm install
tribble-sap build --target on-premise --output ../deploy/chat
```

### Step 7: Upload BSP Application

1. Open transaction **/UI5/UI5_REPOSITORY_LOAD**
2. Enter:
   - Application Name: **ZTRIBBLE_CHAT**
   - Description: Tribble Chat Application
   - Package: **ZTRIBBLE**
3. Click **Next**
4. Select import source: **ZIP File**
5. Browse to deployment package
6. Upload and activate

Alternative using ADT:

1. Right-click package → New → BSP Application
2. Name: ZTRIBBLE_CHAT
3. Upload files from webapp/ directory
4. Activate application

### Step 8: Configure Fiori Launchpad

#### Create Catalog

1. Transaction **/UI2/FLPD_CONF**
2. Create new catalog: **ZTRIBBLE_CATALOG**
3. Add tile:
   - Type: Static
   - Title: Tribble Chat
   - Subtitle: AI Assistant
   - Icon: sap-icon://message-popup

#### Create Target Mapping

```
Semantic Object: tribble
Action: display
App UI Technology: SAPUI5
SAPUI5 Component: com.company.tribble.chat
```

#### Assign to Launchpad Group

1. Create group: **TRIBBLE_AI**
2. Add catalog tiles to group
3. Assign group to users/roles

### Step 9: Transport to Production

1. Create transport request
2. Add all objects:
   - Package ZTRIBBLE
   - RFC Destination ZTRIBBLE_API
   - OData Services
   - BSP Application
   - Fiori Catalog
3. Release transport
4. Import to QA/Production
5. Reconfigure RFC destination in target system

## SAP BTP Deployment

### Step 1: Setup BTP Subaccount

1. Login to **SAP BTP Cockpit**
2. Navigate to your subaccount
3. Enable Cloud Foundry
4. Create Cloud Foundry Space (e.g., "dev")

### Step 2: Install Required Services

```bash
# Login to Cloud Foundry
cf login -a https://api.cf.us10.hana.ondemand.com

# Create destination service
cf create-service destination lite tribble-destination

# Create XSUAA service
cf create-service xsuaa application tribble-xsuaa -c xsuaa-config.json

# Create HTML5 app repository
cf create-service html5-apps-repo app-host tribble-html5-repo
```

#### xsuaa-config.json

```json
{
  "xsappname": "tribble-app",
  "tenant-mode": "dedicated",
  "scopes": [
    {
      "name": "$XSAPPNAME.Display",
      "description": "Display Tribble data"
    },
    {
      "name": "$XSAPPNAME.Admin",
      "description": "Administer Tribble"
    }
  ],
  "role-templates": [
    {
      "name": "Viewer",
      "description": "Tribble Viewer",
      "scope-references": ["$XSAPPNAME.Display"]
    },
    {
      "name": "Administrator",
      "description": "Tribble Administrator",
      "scope-references": ["$XSAPPNAME.Display", "$XSAPPNAME.Admin"]
    }
  ]
}
```

### Step 3: Configure Destination

1. In BTP Cockpit → Connectivity → Destinations
2. Click **New Destination**
3. Enter:

```
Name: tribble-api
Type: HTTP
URL: https://api.tribble.ai
Proxy Type: Internet
Authentication: NoAuthentication

Additional Properties:
- WebIDEEnabled: true
- WebIDEUsage: odata_gen
- HTML5.DynamicDestination: true
```

4. Add header:
```
X-API-Key: your-tribble-api-key
```

### Step 4: Build for BTP

```bash
# Generate Fiori app
tribble-sap scaffold \
  --name "Tribble Chat" \
  --type chat \
  --output ./fiori-chat-btp \
  --namespace com.company.tribble.chat

cd fiori-chat-btp
npm install

# Build for BTP
tribble-sap build --target btp --output ./dist
```

### Step 5: Configure Deployment Files

#### manifest.yml

```yaml
---
applications:
  - name: tribble-chat
    path: dist
    memory: 256M
    disk_quota: 512M
    instances: 1
    buildpacks:
      - https://github.com/cloudfoundry/staticfile-buildpack
    env:
      TRIBBLE_API_URL: https://api.tribble.ai
    services:
      - tribble-destination
      - tribble-xsuaa
      - tribble-html5-repo
    routes:
      - route: tribble-chat.cfapps.us10.hana.ondemand.com
```

#### xs-app.json

```json
{
  "welcomeFile": "index.html",
  "authenticationMethod": "route",
  "sessionTimeout": 30,
  "routes": [
    {
      "source": "^/tribble/(.*)$",
      "target": "$1",
      "destination": "tribble-api",
      "authenticationType": "none",
      "csrfProtection": false
    },
    {
      "source": "^(.*)$",
      "target": "$1",
      "localDir": "webapp",
      "authenticationType": "xsuaa"
    }
  ],
  "logout": {
    "logoutEndpoint": "/do/logout"
  }
}
```

### Step 6: Deploy to BTP

```bash
# Deploy application
cf push -f manifest.yml

# Check deployment status
cf apps

# View logs
cf logs tribble-chat --recent

# Get app URL
cf app tribble-chat
```

### Step 7: Configure Launchpad

1. In BTP Cockpit → HTML5 Applications
2. Find **tribble-chat** app
3. Create Launchpad site
4. Add app to Launchpad content
5. Assign roles to users

### Step 8: Setup Role Collections

1. BTP Cockpit → Security → Role Collections
2. Create role collection: **TribbleUser**
3. Add roles:
   - tribble-app.Display
   - tribble-app.Admin (for admins)
4. Assign to users

## Configuration

### Environment Variables

Create `.env` file:

```bash
# SAP Configuration
SAP_SYSTEM_ID=S4H
SAP_CLIENT=100
SAP_BASE_URL=https://s4h.example.com
SAP_TARGET=on-premise
SAP_LANGUAGE=EN

# Tribble Configuration
TRIBBLE_API_URL=https://api.tribble.ai
TRIBBLE_API_KEY=your-api-key-here

# OAuth2 (Alternative)
TRIBBLE_OAUTH_TOKEN_ENDPOINT=https://auth.tribble.ai/token
TRIBBLE_OAUTH_CLIENT_ID=your-client-id
TRIBBLE_OAUTH_CLIENT_SECRET=your-client-secret
TRIBBLE_OAUTH_SCOPE=api:read api:write

# BTP Configuration (for Cloud)
CF_ORG=your-org
CF_SPACE=dev
CF_API=https://api.cf.us10.hana.ondemand.com
```

### Load Configuration

```typescript
import { configManager } from '@tribble/sdk-sap';

// Load from environment
configManager.loadFromEnv();

// Or configure manually
configManager.loadSAPConfig({
  systemId: 'S4H',
  client: '100',
  baseUrl: 'https://s4h.example.com',
  target: 'on-premise',
});

configManager.loadTribbleConfig({
  apiUrl: 'https://api.tribble.ai',
  apiKey: process.env.TRIBBLE_API_KEY!,
});
```

## Testing

### Test ABAP Connection

```abap
REPORT z_test_tribble_connection.

DATA: lo_client TYPE REF TO zcl_tribble_api_client,
      lv_response TYPE string.

START-OF-SELECTION.
  TRY.
      CREATE OBJECT lo_client
        EXPORTING
          iv_api_url = 'https://api.tribble.ai'
          iv_api_key = 'test-key'.

      lv_response = lo_client->send_message(
        iv_agent_id = 'test-agent'
        iv_message = 'Hello from SAP!'
      ).

      WRITE: / 'Success:', lv_response.

    CATCH cx_tribble_api_error INTO DATA(lx_error).
      WRITE: / 'Error:', lx_error->get_text( ).
  ENDTRY.
```

### Test OData Service

```bash
# Test from command line
curl -X GET "https://s4h.example.com/sap/odata/tribble/chat/Conversations" \
  -H "Authorization: Basic base64encodedcreds" \
  -H "Accept: application/json"
```

### Test Fiori App

1. Open Launchpad
2. Click Tribble Chat tile
3. Select an agent
4. Send test message
5. Verify response

### Load Testing

```bash
# Install artillery
npm install -g artillery

# Create test scenario (artillery.yml)
artillery run artillery.yml
```

**artillery.yml**:
```yaml
config:
  target: "https://s4h.example.com"
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Chat test"
    flow:
      - post:
          url: "/sap/odata/tribble/chat/Messages"
          json:
            conversationId: "test-123"
            role: "user"
            content: "Test message"
```

## Troubleshooting

### Issue: RFC Destination Connection Failed

**Symptom**: Error connecting to Tribble API from ABAP

**Solutions**:
1. Test destination in SM59
2. Check firewall rules
3. Verify SSL certificate
4. Check API key in headers
5. Review system log (SM21)

### Issue: OData Service Not Found

**Symptom**: 404 when accessing OData service

**Solutions**:
1. Verify service is registered in /IWFND/MAINT_SERVICE
2. Check service is activated
3. Clear ICF cache: /IWFND/CACHE_CLEANUP
4. Restart ICF service: SICF
5. Check error log: /IWFND/ERROR_LOG

### Issue: Fiori App Not Loading

**Symptom**: Blank screen or loading error

**Solutions**:
1. Check browser console for errors
2. Verify BSP application exists: SE80
3. Check manifest.json syntax
4. Clear browser cache
5. Test with Chrome DevTools Network tab

### Issue: Authentication Failed (BTP)

**Symptom**: 401/403 errors in BTP

**Solutions**:
1. Verify XSUAA service binding
2. Check role assignments
3. Review xs-app.json routes
4. Test destination connectivity
5. Check JWT token validity

### Issue: CORS Errors (BTP)

**Symptom**: CORS policy blocking requests

**Solutions**:
1. Configure destination with CORS headers
2. Use BTP destination service
3. Add WebIDEEnabled property
4. Check xs-app.json routing
5. Verify authentication type

### Common Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 401 | Unauthorized | Check API key or OAuth token |
| 403 | Forbidden | Verify authorization in SAP |
| 404 | Not Found | Check service registration |
| 429 | Rate Limited | Implement retry logic |
| 500 | Server Error | Check ABAP logs (ST22) |
| 503 | Service Unavailable | Check Tribble API status |

## Monitoring

### ABAP Application Log

```abap
" View logs
Transaction: SLG1
Object: ZTRIBBLE
Subobject: API
```

### BTP Application Logs

```bash
# Stream logs
cf logs tribble-chat

# View recent logs
cf logs tribble-chat --recent

# Download log archive
cf logs tribble-chat > app.log
```

### Performance Monitoring

**On-Premise**:
- Transaction ST03 (Workload)
- Transaction ST05 (SQL Trace)
- Transaction SAT (Runtime Analysis)

**BTP**:
- Application Metrics in BTP Cockpit
- Cloud Foundry Metrics
- Application Logging Service

## Support

For deployment issues:
- Check SAP Notes: 0002534714 (Fiori), 0002446629 (Gateway)
- Review SAP Community: https://community.sap.com
- Contact Tribble Support: support@tribble.ai
- Enterprise Support Portal: https://support.tribble.ai

## Next Steps

After successful deployment:

1. **Configure monitoring** - Set up alerts and dashboards
2. **Train users** - Provide Fiori app training
3. **Document processes** - Create runbooks
4. **Plan scaling** - Configure autoscaling (BTP)
5. **Set up CI/CD** - Automate deployments

---

**Last Updated**: 2025-10-03
**SAP SDK Version**: 0.1.0

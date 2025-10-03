# Fiori Application Templates

Pre-built templates for Tribble-powered Fiori applications.

## Available Templates

### 1. Chat Application (`chat/`)
- Full-featured AI chat interface
- Agent selection
- Conversation history
- Real-time messaging
- SAP user context integration

### 2. Upload Application (`upload/`)
- Document upload interface
- Collection management
- Progress tracking
- Status monitoring
- File type validation

### 3. Agent Application (`agent/`)
- Agent execution interface
- Business context integration
- Result visualization
- Workflow integration

## Usage

Templates are automatically used by the `tribble-sap scaffold` command:

```bash
tribble-sap scaffold --type chat --name MyApp
```

## Customization

Templates use placeholder values that are replaced during scaffolding:

- `{{APP_NAME}}` - Application name
- `{{APP_ID}}` - Application ID
- `{{NAMESPACE}}` - Application namespace
- `{{DESCRIPTION}}` - Application description
- `{{ODATA_SERVICE}}` - OData service URL

## Structure

Each template contains:
- `manifest.json` - App descriptor
- `Component.js` - Component controller
- `view/` - XML views
- `controller/` - JS controllers
- `i18n/` - Internationalization
- `css/` - Stylesheets
- `model/` - Data models

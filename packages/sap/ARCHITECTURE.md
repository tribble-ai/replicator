# SAP Integration Architecture

Technical architecture documentation for @tribble/sdk-sap.

## Overview

The Tribble SAP SDK provides a comprehensive integration layer between Tribble AI Platform and SAP S/4HANA, supporting both on-premise and cloud deployments.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     SAP Fiori Frontend                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                │
│  │  Chat UI   │  │ Upload UI  │  │  Agent UI  │   SAPUI5/Fiori │
│  │ (SAPUI5)   │  │ (SAPUI5)   │  │ (SAPUI5)   │                │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘                │
└────────┼───────────────┼───────────────┼─────────────────────────┘
         │               │               │
         │      OData v2/v4 Protocol     │
         │               │               │
┌────────▼───────────────▼───────────────▼─────────────────────────┐
│                   SAP Gateway / OData Layer                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Service Registration & Metadata                         │   │
│  │  - TribbleChatService    (Conversations, Messages)       │   │
│  │  - TribbleIngestService  (Documents, Collections)        │   │
│  │  - TribbleAgentService   (Agents, Executions)            │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────┬─────────────────────────────────────────────────────────┘
         │
         │  ABAP Function Calls
         │
┌────────▼─────────────────────────────────────────────────────────┐
│                      ABAP Integration Layer                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  ZCL_TRIBBLE_API_CLIENT (Base HTTP Client)              │   │
│  │  - execute_http_request()                                │   │
│  │  - initialize_client()                                   │   │
│  │  - Connection pooling & retry logic                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Business Logic Classes                                  │   │
│  │                                                           │   │
│  │  ZCL_TRIBBLE_CHAT          ZCL_TRIBBLE_INGEST            │   │
│  │  - create_conversation()    - upload_file()              │   │
│  │  - send_message()          - upload_text()               │   │
│  │  - get_history()           - get_status()                │   │
│  │                                                           │   │
│  │  ZCL_TRIBBLE_AGENT                                       │   │
│  │  - execute()                                             │   │
│  │  - execute_streaming()                                   │   │
│  │  - get_agent_info()                                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  SAP Context Enrichment                                  │   │
│  │  - User info (sy-uname, sy-langu)                        │   │
│  │  - Business context (company code, plant, etc)           │   │
│  │  - Authorization checks                                  │   │
│  │  - Transaction context                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────┬─────────────────────────────────────────────────────────┘
         │
         │  HTTPS/REST
         │
┌────────▼─────────────────────────────────────────────────────────┐
│              RFC/HTTP Destination (SM59)                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Destination: ZTRIBBLE_API                               │   │
│  │  - Host: api.tribble.ai                                  │   │
│  │  - Port: 443 (HTTPS)                                     │   │
│  │  - Authentication: API Key / OAuth2                      │   │
│  │  - Headers: X-API-Key, Content-Type                      │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────┬─────────────────────────────────────────────────────────┘
         │
         │  HTTPS (TLS 1.2+)
         │
┌────────▼─────────────────────────────────────────────────────────┐
│                   Tribble AI Platform                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  API Gateway & Authentication                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Core Services                                           │   │
│  │  - Chat & Conversation Management                        │   │
│  │  - Document Ingestion & Processing                       │   │
│  │  - Agent Orchestration & Execution                       │   │
│  │  - RAG & Knowledge Base                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Frontend Layer (SAPUI5/Fiori)

**Technology Stack:**
- SAPUI5 1.120+
- JavaScript/TypeScript
- XML Views
- JSON Models

**Key Components:**
```javascript
// manifest.json - App descriptor
{
  "sap.app": {
    "id": "com.company.tribble.chat",
    "type": "application",
    "dataSources": {
      "mainService": {
        "uri": "/sap/odata/tribble/chat/",
        "type": "OData"
      }
    }
  }
}

// Component.js - Root component
sap.ui.define([
  "sap/ui/core/UIComponent",
  "sap/ui/model/json/JSONModel"
], function(UIComponent, JSONModel) {
  return UIComponent.extend("com.company.tribble.chat.Component", {
    init: function() {
      UIComponent.prototype.init.apply(this, arguments);
      this._initializeTribble();
      this.getRouter().initialize();
    }
  });
});
```

### 2. OData Service Layer

**OData Version Support:**
- OData v2.0 (default for on-premise)
- OData v4.0 (for BTP and modern apps)

**Service Structure:**

```xml
<!-- TribbleChatService Metadata -->
<edmx:Edmx Version="1.0">
  <edmx:DataServices>
    <Schema Namespace="com.tribble.chat">
      <EntityType Name="Conversation">
        <Key>
          <PropertyRef Name="id"/>
        </Key>
        <Property Name="id" Type="Edm.String" Nullable="false"/>
        <Property Name="title" Type="Edm.String"/>
        <Property Name="agentId" Type="Edm.String"/>
        <NavigationProperty Name="Messages"
                          Relationship="ConversationMessages"/>
      </EntityType>

      <EntityType Name="Message">
        <Key>
          <PropertyRef Name="id"/>
        </Key>
        <Property Name="id" Type="Edm.String" Nullable="false"/>
        <Property Name="conversationId" Type="Edm.String"/>
        <Property Name="role" Type="Edm.String"/>
        <Property Name="content" Type="Edm.String"/>
      </EntityType>
    </Schema>
  </edmx:DataServices>
</edmx:Edmx>
```

### 3. ABAP Integration Layer

**Class Hierarchy:**

```
ZCL_TRIBBLE_API_CLIENT (Base Class)
├── Methods:
│   ├── constructor(iv_api_url, iv_api_key)
│   ├── execute_http_request(iv_method, iv_path, iv_body)
│   └── initialize_client()
│
├── ZCL_TRIBBLE_CHAT (Inherits base)
│   ├── create_conversation(iv_agent_id, iv_title)
│   ├── send_message(iv_conversation_id, iv_message)
│   └── get_conversation_history(iv_conversation_id)
│
├── ZCL_TRIBBLE_INGEST (Inherits base)
│   ├── upload_file(iv_collection_id, iv_filename, iv_content)
│   ├── upload_text(iv_collection_id, iv_text, iv_title)
│   └── get_document_status(iv_document_id)
│
└── ZCL_TRIBBLE_AGENT (Inherits base)
    ├── execute(iv_agent_id, iv_input, is_context)
    ├── execute_streaming(iv_agent_id, iv_input, io_handler)
    └── get_agent_info(iv_agent_id)
```

**Type Definitions:**

```abap
" ZTRIBBLE_TYPES
TYPES: BEGIN OF ts_message,
         id TYPE string,
         conversation_id TYPE string,
         role TYPE string,
         content TYPE string,
         timestamp TYPE timestampl,
       END OF ts_message.

TYPES: tt_messages TYPE STANDARD TABLE OF ts_message.

TYPES: BEGIN OF ts_context,
         user_id TYPE string,
         session_id TYPE string,
         language TYPE string,
         metadata TYPE string,
       END OF ts_context.
```

### 4. Authentication & Security

**Authentication Methods:**

1. **API Key Authentication**
```abap
" Set in RFC Destination (SM59)
Header Field: X-API-Key
Value: your-api-key-here
```

2. **OAuth2 Authentication**
```abap
" OAuth2 Configuration
Token Endpoint: https://auth.tribble.ai/token
Client ID: your-client-id
Client Secret: your-client-secret
Grant Type: client_credentials
```

3. **SAP Authorization**
```abap
" Authorization Object Z_TRIBBLE
AUTHORITY-CHECK OBJECT 'Z_TRIBBLE'
  ID 'ACTVT' FIELD '03'    " Activity (01=Create, 02=Change, 03=Display)
  ID 'AGENT' FIELD lv_agent_id
  ID 'COLL' FIELD lv_collection_id.
```

### 5. Data Flow

**Request Flow (Chat Example):**

```
1. User Input (Fiori UI)
   ↓
2. SAPUI5 Controller
   oDataModel.create("/Messages", {
     conversationId: "123",
     role: "user",
     content: "Hello"
   })
   ↓
3. OData Gateway
   Receives POST /sap/odata/tribble/chat/Messages
   ↓
4. ABAP DPC (Data Provider Class)
   /IWBEP/CL_MGW_PUSH_ABS_DATA~CREATE_ENTITY
   ↓
5. Business Logic
   lo_chat = NEW zcl_tribble_chat( ).
   lv_response = lo_chat->send_message(
     iv_conversation_id = '123'
     iv_message = 'Hello'
   ).
   ↓
6. HTTP Client
   POST https://api.tribble.ai/chat/messages
   Headers: X-API-Key, Content-Type
   Body: {"conversationId":"123","message":"Hello"}
   ↓
7. Tribble API Processing
   - Validate request
   - Execute agent
   - Generate response
   ↓
8. Response Flow (Reverse)
   JSON Response → ABAP → OData → SAPUI5 → User
```

### 6. Error Handling

**Error Hierarchy:**

```
CX_TRIBBLE_API_ERROR (Base Exception)
├── Attributes:
│   ├── mv_error_message (string)
│   ├── mv_status_code (integer)
│   └── mv_details (string)
│
├── Error Codes:
│   ├── 400 - Bad Request
│   ├── 401 - Unauthorized
│   ├── 403 - Forbidden
│   ├── 404 - Not Found
│   ├── 429 - Rate Limited
│   ├── 500 - Server Error
│   └── 503 - Service Unavailable
```

**Error Handling Pattern:**

```abap
TRY.
    DATA(lv_result) = lo_agent->execute(
      iv_agent_id = 'test'
      iv_input = 'test'
    ).

  CATCH cx_tribble_api_error INTO DATA(lx_error).
    " Log error
    CALL FUNCTION 'BAL_LOG_MSG_ADD'
      EXPORTING
        i_s_msg = VALUE #(
          msgty = 'E'
          msgno = '001'
          msgv1 = lx_error->mv_error_message
        ).

    " Handle based on error code
    CASE lx_error->mv_status_code.
      WHEN 401.
        " Re-authenticate
      WHEN 429.
        " Implement backoff
      WHEN OTHERS.
        " Generic error handling
    ENDCASE.
ENDTRY.
```

### 7. Performance Optimization

**Connection Pooling:**

```abap
CLASS zcl_tribble_api_client DEFINITION.
  PRIVATE SECTION.
    CLASS-DATA: gt_client_pool TYPE STANDARD TABLE OF REF TO if_http_client.

    METHODS: get_pooled_client
      RETURNING VALUE(ro_client) TYPE REF TO if_http_client.
ENDCLASS.

CLASS zcl_tribble_api_client IMPLEMENTATION.
  METHOD get_pooled_client.
    " Reuse existing connection if available
    IF gt_client_pool IS NOT INITIAL.
      ro_client = gt_client_pool[ 1 ].
      DELETE gt_client_pool INDEX 1.
    ELSE.
      " Create new connection
      CALL METHOD cl_http_client=>create_by_destination
        EXPORTING
          destination = 'ZTRIBBLE_API'
        IMPORTING
          client = ro_client.

      " Set keep-alive
      ro_client->request->set_header_field(
        name = 'Connection'
        value = 'keep-alive'
      ).
    ENDIF.
  ENDMETHOD.
ENDCLASS.
```

**Caching Strategy:**

```abap
" Cache agent metadata
DATA: gt_agent_cache TYPE HASHED TABLE OF ts_agent_info
                      WITH UNIQUE KEY id.

METHOD get_agent_info.
  " Check cache first
  TRY.
      rs_agent_info = gt_agent_cache[ id = iv_agent_id ].
      RETURN.
    CATCH cx_sy_itab_line_not_found.
      " Not in cache, fetch from API
  ENDTRY.

  " Fetch from API
  rs_agent_info = super->get_agent_info( iv_agent_id ).

  " Update cache
  INSERT rs_agent_info INTO TABLE gt_agent_cache.
ENDMETHOD.
```

### 8. SAP BTP Architecture

**Cloud Foundry Stack:**

```yaml
# manifest.yml
applications:
  - name: tribble-chat
    memory: 256M
    buildpacks:
      - staticfile_buildpack
    services:
      - tribble-destination    # Destination service
      - tribble-xsuaa         # Authentication
      - tribble-html5-repo    # HTML5 app hosting
    env:
      TRIBBLE_API_URL: https://api.tribble.ai
```

**Destination Service:**

```json
{
  "Name": "tribble-api",
  "Type": "HTTP",
  "URL": "https://api.tribble.ai",
  "Authentication": "NoAuthentication",
  "ProxyType": "Internet",
  "HTML5.DynamicDestination": true,
  "WebIDEEnabled": true
}
```

**xs-app.json Routing:**

```json
{
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

## Deployment Patterns

### Pattern 1: On-Premise Integration

```
SAP S/4HANA → Gateway → ABAP → RFC Destination → Tribble API
```

### Pattern 2: BTP Cloud Native

```
BTP (CF) → Destination Service → Tribble API
```

### Pattern 3: Hybrid Deployment

```
SAP S/4HANA ←→ SAP BTP ←→ Tribble API
```

## Monitoring & Observability

**Monitoring Points:**

1. **ABAP Layer**
   - Transaction ST05 (SQL Trace)
   - Transaction SAT (Runtime Analysis)
   - Application Log (SLG1)

2. **Gateway Layer**
   - /IWFND/ERROR_LOG (OData errors)
   - /IWFND/CACHE_CLEANUP (Cache monitoring)

3. **BTP Layer**
   - Application Logging Service
   - Cloud Foundry Metrics
   - Health Check Endpoints

## Security Considerations

**Data Protection:**
- SSL/TLS 1.2+ for all communications
- API key rotation every 90 days
- Encryption at rest for sensitive data
- Audit logging for all API calls

**Access Control:**
- SAP authorization objects
- Role-based access control
- IP whitelisting (if required)
- Rate limiting per user/session

## Scalability

**Horizontal Scaling:**
- BTP: Auto-scaling in Cloud Foundry
- On-Premise: Multiple application servers

**Vertical Scaling:**
- Increase work processes (SM50)
- Increase memory allocation
- Optimize ABAP code

## Best Practices

1. **Connection Management**
   - Reuse HTTP clients
   - Implement connection pooling
   - Set appropriate timeouts

2. **Error Handling**
   - Implement retry logic
   - Graceful degradation
   - Detailed error logging

3. **Performance**
   - Cache frequently accessed data
   - Use batch operations
   - Async processing for long operations

4. **Security**
   - Never hardcode credentials
   - Use secure storage (SECSTORE)
   - Regular security audits

---

**Architecture Version:** 1.0
**Last Updated:** 2025-10-03
**SAP SDK Version:** 0.1.0

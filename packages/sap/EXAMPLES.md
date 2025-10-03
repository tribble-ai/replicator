# SAP Integration Examples

Practical examples for using @tribble/sdk-sap in various scenarios.

## Table of Contents

1. [Basic Setup](#basic-setup)
2. [Chat Application](#chat-application)
3. [Document Upload](#document-upload)
4. [Agent Execution](#agent-execution)
5. [ABAP Integration](#abap-integration)
6. [Advanced Scenarios](#advanced-scenarios)

## Basic Setup

### Initialize SDK

```typescript
import { initializeSAPSDK } from '@tribble/sdk-sap';

// Load from environment variables
const configManager = initializeSAPSDK({
  autoLoadEnv: true,
});

// Or configure manually
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
    apiKey: process.env.TRIBBLE_API_KEY!,
  },
});
```

### Quick Start

```typescript
import { quickStart } from '@tribble/sdk-sap';

const result = await quickStart({
  appName: 'TribbleChat',
  appType: 'chat',
  outputDir: './my-fiori-app',
  sapConfig: {
    systemId: 'S4H',
    client: '100',
    baseUrl: 'https://s4h.example.com',
    target: 'on-premise',
  },
  tribbleConfig: {
    apiUrl: 'https://api.tribble.ai',
    apiKey: 'your-api-key',
  },
});

console.log('Generated files:', result.files);
```

## Chat Application

### Generate Chat App

```typescript
import {
  generateManifest,
  generateChatView,
  generateChatController,
} from '@tribble/sdk-sap';

// Generate manifest
const manifest = generateManifest({
  appId: 'com.company.tribble.chat',
  appName: 'Tribble Chat',
  description: 'AI-powered chat for SAP',
  version: '1.0.0',
  namespace: 'com.company.tribble.chat',
  odataService: '/sap/odata/tribble/chat/',
  appType: 'chat',
});

// Generate view
const chatView = generateChatView('com.company.tribble.chat');

// Generate controller
const chatController = generateChatController('com.company.tribble.chat');

// Save files
import fs from 'fs';
fs.writeFileSync('manifest.json', JSON.stringify(manifest, null, 2));
fs.writeFileSync('TribbleChat.view.xml', chatView);
fs.writeFileSync('TribbleChat.controller.js', chatController);
```

### Create OData Service for Chat

```typescript
import {
  createTribbleChatService,
  ODataMetadataGenerator,
} from '@tribble/sdk-sap';

const service = createTribbleChatService();
const generator = new ODataMetadataGenerator(service);
const metadata = generator.generate();

// Save metadata.xml
fs.writeFileSync('metadata.xml', metadata);

// Service includes:
// - Conversation entity (id, title, agentId, userId, status)
// - Message entity (id, conversationId, role, content, timestamp)
```

### ABAP Chat Integration

```abap
REPORT z_tribble_chat_example.

DATA: lo_chat TYPE REF TO zcl_tribble_chat,
      lv_conv_id TYPE string,
      lv_response TYPE string,
      lt_messages TYPE tt_messages.

START-OF-SELECTION.
  TRY.
      " Initialize chat client
      CREATE OBJECT lo_chat.

      " Create new conversation
      lv_conv_id = lo_chat->create_conversation(
        iv_agent_id = 'sales-assistant'
        iv_title = 'Sales Order Query'
      ).

      WRITE: / 'Conversation created:', lv_conv_id.

      " Send message
      lv_response = lo_chat->send_message(
        iv_conversation_id = lv_conv_id
        iv_message = 'Show me all orders for customer 1000 in Q4 2024'
      ).

      WRITE: / 'Agent response:', lv_response.

      " Get conversation history
      lt_messages = lo_chat->get_conversation_history(
        iv_conversation_id = lv_conv_id
      ).

      LOOP AT lt_messages INTO DATA(ls_message).
        WRITE: / ls_message-role, ':', ls_message-content.
      ENDLOOP.

    CATCH cx_tribble_api_error INTO DATA(lx_error).
      WRITE: / 'Error:', lx_error->get_text( ).
  ENDTRY.
```

## Document Upload

### Generate Upload App

```typescript
import { generateUploadView } from '@tribble/sdk-sap';

const uploadView = generateUploadView('com.company.tribble.upload');

// Save view
fs.writeFileSync('TribbleUpload.view.xml', uploadView);
```

### Create OData Service for Upload

```typescript
import {
  createTribbleIngestService,
  ODataMetadataGenerator,
} from '@tribble/sdk-sap';

const service = createTribbleIngestService();
const generator = new ODataMetadataGenerator(service);
const metadata = generator.generate();

fs.writeFileSync('ingest_metadata.xml', metadata);

// Service includes:
// - Document entity (id, collectionId, filename, status)
// - Collection entity (id, name, documentCount)
```

### ABAP Document Upload

```abap
REPORT z_tribble_upload_example.

DATA: lo_ingest TYPE REF TO zcl_tribble_ingest,
      lv_doc_id TYPE string,
      lv_content TYPE xstring,
      lv_filename TYPE string,
      lv_status TYPE string.

PARAMETERS: p_file TYPE rlgrap-filename OBLIGATORY,
            p_coll TYPE string DEFAULT 'sales-documents'.

START-OF-SELECTION.
  " Read file from application server
  OPEN DATASET p_file FOR INPUT IN BINARY MODE.
  IF sy-subrc <> 0.
    MESSAGE 'File not found' TYPE 'E'.
  ENDIF.

  READ DATASET p_file INTO lv_content.
  CLOSE DATASET p_file.

  " Get filename
  SPLIT p_file AT '/' INTO TABLE DATA(lt_parts).
  READ TABLE lt_parts INDEX lines( lt_parts ) INTO lv_filename.

  TRY.
      " Initialize ingest client
      CREATE OBJECT lo_ingest.

      " Upload file
      lv_doc_id = lo_ingest->upload_file(
        iv_collection_id = p_coll
        iv_filename = lv_filename
        iv_content = lv_content
        iv_mime_type = 'application/pdf'
      ).

      WRITE: / 'Document uploaded:', lv_doc_id.

      " Wait for processing
      DO 10 TIMES.
        WAIT UP TO 2 SECONDS.

        lv_status = lo_ingest->get_document_status(
          iv_document_id = lv_doc_id
        ).

        WRITE: / 'Status:', lv_status.

        IF lv_status = 'processed'.
          EXIT.
        ENDIF.
      ENDDO.

    CATCH cx_tribble_api_error INTO DATA(lx_error).
      WRITE: / 'Upload failed:', lx_error->get_text( ).
  ENDTRY.
```

### Batch Upload from SAP Table

```abap
REPORT z_tribble_batch_upload.

DATA: lo_ingest TYPE REF TO zcl_tribble_ingest,
      lt_docs TYPE STANDARD TABLE OF ts_document.

" Select documents from custom table
SELECT * FROM ztribble_docs
  INTO TABLE @DATA(lt_sap_docs)
  WHERE status = 'NEW'.

TRY.
    CREATE OBJECT lo_ingest.

    LOOP AT lt_sap_docs INTO DATA(ls_doc).
      " Upload each document
      DATA(lv_doc_id) = lo_ingest->upload_text(
        iv_collection_id = 'sap-data'
        iv_text = ls_doc-content
        iv_title = ls_doc-title
      ).

      " Update status in SAP
      UPDATE ztribble_docs
        SET status = 'UPLOADED'
            tribble_id = lv_doc_id
        WHERE id = ls_doc-id.

      " Commit every 50 records
      IF sy-tabix MOD 50 = 0.
        COMMIT WORK.
        WRITE: / 'Uploaded', sy-tabix, 'documents'.
      ENDIF.
    ENDLOOP.

    COMMIT WORK.
    WRITE: / 'Batch upload complete'.

  CATCH cx_tribble_api_error INTO DATA(lx_error).
    ROLLBACK WORK.
    WRITE: / 'Batch upload failed:', lx_error->get_text( ).
ENDTRY.
```

## Agent Execution

### Generate Agent Service

```typescript
import {
  createTribbleAgentService,
  ODataMetadataGenerator,
} from '@tribble/sdk-sap';

const service = createTribbleAgentService();
const generator = new ODataMetadataGenerator(service);
const metadata = generator.generate();

fs.writeFileSync('agent_metadata.xml', metadata);
```

### ABAP Agent Execution

```abap
REPORT z_tribble_agent_example.

DATA: lo_agent TYPE REF TO zcl_tribble_agent,
      lv_output TYPE string,
      ls_context TYPE ts_context.

PARAMETERS: p_agent TYPE string DEFAULT 'data-analyst',
            p_input TYPE string LOWER CASE DEFAULT 'Analyze sales'.

START-OF-SELECTION.
  " Build SAP context
  ls_context-user_id = sy-uname.
  ls_context-session_id = sy-sessn.
  ls_context-language = sy-langu.

  " Add business context as JSON
  DATA(lv_metadata) = |{
    "company_code": "{ sy-mandt }",
    "user_role": "{ sy-tcode }",
    "date": "{ sy-datum }",
    "time": "{ sy-uzeit }"
  }|.
  ls_context-metadata = lv_metadata.

  TRY.
      " Initialize agent client
      CREATE OBJECT lo_agent.

      " Execute agent with SAP context
      lv_output = lo_agent->execute(
        iv_agent_id = p_agent
        iv_input = p_input
        is_context = ls_context
      ).

      WRITE: / 'Agent Output:'.
      WRITE: / lv_output.

    CATCH cx_tribble_api_error INTO DATA(lx_error).
      WRITE: / 'Execution failed:', lx_error->get_text( ).
  ENDTRY.
```

### Agent with Streaming Response

```abap
REPORT z_tribble_streaming_agent.

" Define streaming handler interface
INTERFACE if_tribble_stream.
  METHODS: on_chunk
    IMPORTING iv_chunk TYPE string.
ENDINTERFACE.

" Implement streaming handler
CLASS lcl_stream_handler DEFINITION.
  PUBLIC SECTION.
    INTERFACES if_tribble_stream.
ENDCLASS.

CLASS lcl_stream_handler IMPLEMENTATION.
  METHOD if_tribble_stream~on_chunk.
    WRITE: / iv_chunk.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA: lo_agent TYPE REF TO zcl_tribble_agent,
        lo_handler TYPE REF TO lcl_stream_handler.

  TRY.
      CREATE OBJECT lo_agent.
      CREATE OBJECT lo_handler.

      " Execute with streaming
      lo_agent->execute_streaming(
        iv_agent_id = 'analyst'
        iv_input = 'Generate comprehensive sales report'
        io_stream_handler = lo_handler
      ).

    CATCH cx_tribble_api_error INTO DATA(lx_error).
      WRITE: / 'Error:', lx_error->get_text( ).
  ENDTRY.
```

## Advanced Scenarios

### Sales Order Analysis Workflow

```abap
REPORT z_tribble_so_analysis.

DATA: lo_agent TYPE REF TO zcl_tribble_agent,
      lo_ingest TYPE REF TO zcl_tribble_ingest,
      lt_orders TYPE STANDARD TABLE OF vbak,
      lv_analysis TYPE string.

PARAMETERS: p_kunnr TYPE kunnr.

START-OF-SELECTION.
  " Get sales orders
  SELECT * FROM vbak
    INTO TABLE lt_orders
    WHERE kunnr = p_kunnr
      AND audat >= '20240101'.

  " Convert to JSON
  DATA(lv_orders_json) = /ui2/cl_json=>serialize(
    data = lt_orders
    compress = abap_false
    pretty_name = /ui2/cl_json=>pretty_mode-low_case
  ).

  TRY.
      " Upload order data to Tribble
      CREATE OBJECT lo_ingest.
      DATA(lv_doc_id) = lo_ingest->upload_text(
        iv_collection_id = 'sales-analysis'
        iv_text = lv_orders_json
        iv_title = |Orders for customer { p_kunnr }|
      ).

      " Wait for processing
      WAIT UP TO 5 SECONDS.

      " Analyze with agent
      CREATE OBJECT lo_agent.
      lv_analysis = lo_agent->execute(
        iv_agent_id = 'sales-analyst'
        iv_input = |Analyze sales orders for customer { p_kunnr }.
                     Focus on: trends, top products, and recommendations.|
        is_context = VALUE #(
          user_id = sy-uname
          metadata = |{{"document_id":"{ lv_doc_id }"}}|
        )
      ).

      " Display analysis
      WRITE: / 'Sales Analysis:'.
      WRITE: / lv_analysis.

      " Store analysis in custom table
      INSERT INTO ztribble_analysis VALUES (
        id = cl_system_uuid=>create_uuid_x16_static( )
        customer = p_kunnr
        analysis = lv_analysis
        created_at = sy-datum
        created_by = sy-uname
      ).

      COMMIT WORK.

    CATCH cx_tribble_api_error INTO DATA(lx_error).
      WRITE: / 'Analysis failed:', lx_error->get_text( ).
  ENDTRY.
```

### Real-time Inventory Assistant

```abap
REPORT z_tribble_inventory_bot.

DATA: lo_chat TYPE REF TO zcl_tribble_chat,
      lv_conv_id TYPE string,
      lv_response TYPE string.

PARAMETERS: p_msg TYPE string LOWER CASE OBLIGATORY.

START-OF-SELECTION.
  TRY.
      CREATE OBJECT lo_chat.

      " Get or create conversation
      IF p_conv_id IS INITIAL.
        lv_conv_id = lo_chat->create_conversation(
          iv_agent_id = 'inventory-assistant'
          iv_title = 'Inventory Query'
        ).
      ELSE.
        lv_conv_id = p_conv_id.
      ENDIF.

      " Get current inventory data
      SELECT matnr, maktx, labst, meins
        FROM mara INNER JOIN makt ON mara~matnr = makt~matnr
        INNER JOIN mard ON mara~matnr = mard~matnr
        INTO TABLE @DATA(lt_inventory)
        UP TO 100 ROWS.

      " Convert to JSON context
      DATA(lv_inventory_json) = /ui2/cl_json=>serialize(
        data = lt_inventory
        compress = abap_false
      ).

      " Enhance message with SAP context
      DATA(lv_enhanced_msg) = |{ p_msg }

Context: Current inventory data
{ lv_inventory_json }|.

      " Send to agent
      lv_response = lo_chat->send_message(
        iv_conversation_id = lv_conv_id
        iv_message = lv_enhanced_msg
      ).

      WRITE: / 'Assistant:', lv_response.
      WRITE: / 'Conversation ID:', lv_conv_id.

    CATCH cx_tribble_api_error INTO DATA(lx_error).
      WRITE: / 'Error:', lx_error->get_text( ).
  ENDTRY.
```

### Document Intelligence for Invoices

```abap
REPORT z_tribble_invoice_ai.

DATA: lo_ingest TYPE REF TO zcl_tribble_ingest,
      lo_agent TYPE REF TO zcl_tribble_agent,
      lv_pdf_content TYPE xstring,
      lv_doc_id TYPE string,
      lv_extraction TYPE string.

PARAMETERS: p_file TYPE string OBLIGATORY.

START-OF-SELECTION.
  " Read PDF invoice
  CALL FUNCTION 'GUI_UPLOAD'
    EXPORTING
      filename = p_file
      filetype = 'BIN'
    IMPORTING
      filelength = DATA(lv_length)
    TABLES
      data_tab = DATA(lt_binary).

  " Convert to xstring
  CALL FUNCTION 'SCMS_BINARY_TO_XSTRING'
    EXPORTING
      input_length = lv_length
    IMPORTING
      buffer = lv_pdf_content
    TABLES
      binary_tab = lt_binary.

  TRY.
      " Upload invoice to Tribble
      CREATE OBJECT lo_ingest.
      lv_doc_id = lo_ingest->upload_file(
        iv_collection_id = 'invoices'
        iv_filename = 'invoice.pdf'
        iv_content = lv_pdf_content
        iv_mime_type = 'application/pdf'
      ).

      WRITE: / 'Invoice uploaded:', lv_doc_id.

      " Wait for processing
      DO 10 TIMES.
        WAIT UP TO 2 SECONDS.
        DATA(lv_status) = lo_ingest->get_document_status(
          iv_document_id = lv_doc_id
        ).
        IF lv_status = 'processed'.
          EXIT.
        ENDIF.
      ENDDO.

      " Extract invoice data with AI
      CREATE OBJECT lo_agent.
      lv_extraction = lo_agent->execute(
        iv_agent_id = 'invoice-extractor'
        iv_input = |Extract all fields from invoice:
                     { lv_doc_id }. Return as JSON.|
      ).

      " Parse JSON response
      DATA: lo_json TYPE REF TO /ui2/cl_json,
            ls_invoice TYPE zst_invoice.

      /ui2/cl_json=>deserialize(
        EXPORTING
          json = lv_extraction
        CHANGING
          data = ls_invoice
      ).

      " Create invoice in SAP
      CALL FUNCTION 'BAPI_INVOICE_CREATE'
        EXPORTING
          invoice_header = VALUE #(
            invoice_number = ls_invoice-invoice_number
            vendor = ls_invoice-vendor_id
            invoice_date = ls_invoice-invoice_date
            amount = ls_invoice-total_amount
          ).

      COMMIT WORK.
      WRITE: / 'Invoice created in SAP'.

    CATCH cx_tribble_api_error INTO DATA(lx_error).
      WRITE: / 'Processing failed:', lx_error->get_text( ).
  ENDTRY.
```

### Background Job for Periodic Analysis

```abap
REPORT z_tribble_batch_job.

DATA: lo_agent TYPE REF TO zcl_tribble_agent,
      lv_jobname TYPE btcjob,
      lv_jobcount TYPE btcjobcnt.

" Schedule job
CALL FUNCTION 'JOB_OPEN'
  EXPORTING
    jobname = 'TRIBBLE_ANALYSIS'
  IMPORTING
    jobcount = lv_jobcount.

" Add program step
SUBMIT z_tribble_daily_analysis
  VIA JOB 'TRIBBLE_ANALYSIS' NUMBER lv_jobcount
  AND RETURN.

" Schedule for daily execution
CALL FUNCTION 'JOB_CLOSE'
  EXPORTING
    jobcount = lv_jobcount
    jobname = 'TRIBBLE_ANALYSIS'
    sdlstrtdt = sy-datum
    sdlstrttm = '060000'  " 6 AM
    periodic_granularity = 'D'  " Daily
    periodic_value = 1.

WRITE: / 'Job scheduled:', lv_jobcount.

" Job program (z_tribble_daily_analysis)
REPORT z_tribble_daily_analysis.

START-OF-SELECTION.
  DATA: lo_agent TYPE REF TO zcl_tribble_agent.

  TRY.
      CREATE OBJECT lo_agent.

      " Run daily analysis
      DATA(lv_report) = lo_agent->execute(
        iv_agent_id = 'daily-analyst'
        iv_input = |Generate daily business intelligence report for {
          sy-datum DATE = USER }|
      ).

      " Email report
      CALL FUNCTION 'SO_NEW_DOCUMENT_ATT_SEND_API1'
        EXPORTING
          document_data = VALUE #(
            obj_name = 'Daily AI Report'
            obj_descr = 'Daily Business Intelligence'
          )
        TABLES
          contents_txt = VALUE #(
            ( line = lv_report )
          )
          receivers = VALUE #(
            ( rcv_type = 'U' rcv_name = sy-uname )
          ).

    CATCH cx_tribble_api_error INTO DATA(lx_error).
      " Log error
      CALL FUNCTION 'BAL_LOG_MSG_ADD'
        EXPORTING
          i_s_msg = VALUE #(
            msgty = 'E'
            msgid = 'ZTRIBBLE'
            msgno = '001'
            msgv1 = lx_error->get_text( )
          ).
  ENDTRY.
```

## TypeScript/Node.js Examples

### Build and Deploy Pipeline

```typescript
import {
  generateManifest,
  generateComponent,
  ODataMetadataGenerator,
  createTribbleChatService,
} from '@tribble/sdk-sap';
import * as fs from 'fs';
import * as path from 'path';

async function buildAndDeploy() {
  const outputDir = './dist/fiori-app';

  // Create directory structure
  fs.mkdirSync(path.join(outputDir, 'webapp'), { recursive: true });

  // Generate Fiori app
  const manifest = generateManifest({
    appId: 'com.company.tribble.chat',
    appName: 'Tribble Chat',
    description: 'AI Chat for SAP',
    version: '1.0.0',
    namespace: 'com.company.tribble.chat',
    odataService: '/sap/odata/tribble/chat/',
    appType: 'chat',
  });

  fs.writeFileSync(
    path.join(outputDir, 'webapp', 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  const component = generateComponent('com.company.tribble.chat');
  fs.writeFileSync(
    path.join(outputDir, 'webapp', 'Component.js'),
    component
  );

  // Generate OData service
  const service = createTribbleChatService();
  const generator = new ODataMetadataGenerator(service);
  const metadata = generator.generate();

  fs.mkdirSync(path.join(outputDir, 'odata'), { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'odata', 'metadata.xml'), metadata);

  console.log('Build complete!');
  console.log(`Output: ${outputDir}`);

  // Deploy to SAP (example)
  // await deploySAP(outputDir);
}

buildAndDeploy().catch(console.error);
```

---

For more examples, see the [README.md](./README.md) and [DEPLOYMENT.md](./DEPLOYMENT.md).

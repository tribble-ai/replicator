# ABAP Classes for Tribble Integration

This directory contains pre-generated ABAP classes for integrating SAP S/4HANA with Tribble AI Platform.

## Files

- **ZCL_TRIBBLE_API_CLIENT.abap** - Main HTTP client for Tribble API
- **ZCL_TRIBBLE_CHAT.abap** - Chat conversation management
- **ZCL_TRIBBLE_INGEST.abap** - Document ingestion and upload
- **ZCL_TRIBBLE_AGENT.abap** - Agent execution and streaming
- **ZTRIBBLE_TYPES.abap** - Type definitions
- **CX_TRIBBLE_API_ERROR.abap** - Exception class

## Installation

### Method 1: Using SAP GUI (SE80)

1. Open transaction SE80
2. Select "Class" from the dropdown
3. Copy the class definition from the .abap file
4. Create new class with the same name
5. Paste the code
6. Activate the class

### Method 2: Using ABAP Development Tools (ADT/Eclipse)

1. Right-click on your package
2. New > ABAP Class
3. Enter class name (e.g., ZCL_TRIBBLE_API_CLIENT)
4. Copy code from .abap file
5. Save and activate

### Method 3: Using abapGit

1. Install abapGit (https://abapgit.org)
2. Clone this repository
3. Pull objects to your system
4. Activate all objects

## Configuration

### 1. Create RFC Destination (SM59)

```
Destination: ZTRIBBLE_API
Type: G (HTTP Connection to External Server)
Host: api.tribble.ai
Port: 443
Path: /api/v1
SSL: Active
```

### 2. Set Authentication

Add to HTTP Header Fields:
```
Name: X-API-Key
Value: your-tribble-api-key
```

Or configure OAuth2:
```
OAuth 2.0 Settings:
- Token Endpoint: https://auth.tribble.ai/token
- Client ID: your-client-id
- Client Secret: your-client-secret
```

### 3. Test Connection

```abap
DATA: lo_client TYPE REF TO zcl_tribble_api_client.

CREATE OBJECT lo_client
  EXPORTING
    iv_api_url = 'https://api.tribble.ai'
    iv_api_key = 'your-api-key'.

" Test connection
TRY.
    DATA(lv_response) = lo_client->send_message(
      iv_agent_id = 'test-agent'
      iv_message = 'Hello, Tribble!'
    ).

    WRITE: / 'Success:', lv_response.

  CATCH cx_tribble_api_error INTO DATA(lx_error).
    WRITE: / 'Error:', lx_error->get_text( ).
ENDTRY.
```

## Usage Examples

### Chat Integration

```abap
" Initialize chat client
DATA: lo_chat TYPE REF TO zcl_tribble_chat,
      lv_conv_id TYPE string,
      lv_response TYPE string.

CREATE OBJECT lo_chat.

" Create conversation
lv_conv_id = lo_chat->create_conversation(
  iv_agent_id = 'sales-assistant'
  iv_title = 'Sales Order Query'
).

" Send message
lv_response = lo_chat->send_message(
  iv_conversation_id = lv_conv_id
  iv_message = 'Show me orders from customer 1000'
).

WRITE: / 'Agent:', lv_response.
```

### Document Upload

```abap
" Initialize ingest client
DATA: lo_ingest TYPE REF TO zcl_tribble_ingest,
      lv_doc_id TYPE string,
      lv_content TYPE xstring.

CREATE OBJECT lo_ingest.

" Read file content
CALL FUNCTION 'GUI_UPLOAD'
  EXPORTING
    filename = 'C:\temp\document.pdf'
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
    buffer = lv_content
  TABLES
    binary_tab = lt_binary.

" Upload to Tribble
lv_doc_id = lo_ingest->upload_file(
  iv_collection_id = 'sales-docs'
  iv_filename = 'sales_report.pdf'
  iv_content = lv_content
  iv_mime_type = 'application/pdf'
).

WRITE: / 'Uploaded:', lv_doc_id.
```

### Agent Execution

```abap
" Initialize agent client
DATA: lo_agent TYPE REF TO zcl_tribble_agent,
      lv_output TYPE string,
      ls_context TYPE ts_context.

CREATE OBJECT lo_agent.

" Set SAP context
ls_context-user_id = sy-uname.
ls_context-session_id = sy-sessn.
ls_context-language = sy-langu.

" Add business context as JSON
DATA(lv_metadata) = '{"company_code":"1000","plant":"1010"}'.
ls_context-metadata = lv_metadata.

" Execute agent
lv_output = lo_agent->execute(
  iv_agent_id = 'data-analyst'
  iv_input = 'Analyze sales performance for Q4 2024'
  is_context = ls_context
).

WRITE: / 'Analysis:', lv_output.
```

## Authorization

Create authorization object Z_TRIBBLE with fields:

- **ACTVT** (Activity): 01 (Create), 02 (Change), 03 (Display)
- **AGENT** (Agent ID): Agent identifier
- **COLL** (Collection): Collection identifier

Check authorization before API calls:

```abap
AUTHORITY-CHECK OBJECT 'Z_TRIBBLE'
  ID 'ACTVT' FIELD '03'
  ID 'AGENT' FIELD lv_agent_id.

IF sy-subrc <> 0.
  MESSAGE 'Not authorized' TYPE 'E'.
ENDIF.
```

## Error Handling

All classes raise exception CX_TRIBBLE_API_ERROR:

```abap
TRY.
    " Your Tribble API call

  CATCH cx_tribble_api_error INTO DATA(lx_error).
    " Get error details
    DATA(lv_message) = lx_error->get_text( ).
    DATA(lv_status) = lx_error->mv_status_code.

    " Log error
    CALL FUNCTION 'BAL_LOG_MSG_ADD'
      EXPORTING
        i_s_msg = VALUE #(
          msgty = 'E'
          msgid = 'ZTRIBBLE'
          msgno = '001'
          msgv1 = lv_message
        ).

    " Handle based on status code
    CASE lv_status.
      WHEN 401.
        MESSAGE 'Authentication failed' TYPE 'E'.
      WHEN 429.
        MESSAGE 'Rate limit exceeded' TYPE 'E'.
      WHEN 500.
        MESSAGE 'Server error' TYPE 'E'.
      WHEN OTHERS.
        MESSAGE lv_message TYPE 'E'.
    ENDCASE.
ENDTRY.
```

## Performance Tips

1. **Reuse HTTP Client**
   ```abap
   " Bad: Creates new client for each call
   CREATE OBJECT lo_client.
   lo_client->send_message( ... ).

   " Good: Reuse client instance
   IF lo_client IS INITIAL.
     CREATE OBJECT lo_client.
   ENDIF.
   lo_client->send_message( ... ).
   ```

2. **Connection Pooling**
   ```abap
   " Keep HTTP client alive
   lo_http_client->set_keep_alive( abap_true ).
   ```

3. **Batch Operations**
   ```abap
   " Upload multiple documents in batch
   LOOP AT lt_documents INTO DATA(ls_doc).
     lo_ingest->upload_file( ... ).

     " Commit every 50 documents
     IF sy-tabix MOD 50 = 0.
       COMMIT WORK.
       WAIT UP TO 1 SECONDS.
     ENDIF.
   ENDLOOP.
   ```

4. **Background Processing**
   ```abap
   " For large operations, use background job
   CALL FUNCTION 'JOB_OPEN'
     EXPORTING
       jobname = 'TRIBBLE_UPLOAD'
     IMPORTING
       jobcount = DATA(lv_jobcount).

   SUBMIT z_tribble_upload_batch
     VIA JOB 'TRIBBLE_UPLOAD' NUMBER lv_jobcount
     WITH p_coll = 'my-collection'.

   CALL FUNCTION 'JOB_CLOSE'.
   ```

## Monitoring

### Application Log

```abap
" Create application log
CALL FUNCTION 'BAL_LOG_CREATE'
  EXPORTING
    i_s_log = VALUE #(
      object = 'ZTRIBBLE'
      subobject = 'API'
      extnumber = sy-uname
    )
  IMPORTING
    e_log_handle = DATA(lv_log_handle).

" Add messages
CALL FUNCTION 'BAL_LOG_MSG_ADD'
  EXPORTING
    i_log_handle = lv_log_handle
    i_s_msg = VALUE #(
      msgty = 'I'
      msgid = 'ZTRIBBLE'
      msgno = '002'
      msgv1 = 'API call successful'
    ).

" Save log
CALL FUNCTION 'BAL_DB_SAVE'.
```

### Performance Trace

```abap
" Start trace
CALL FUNCTION 'SAT_START_TRACE_TOOL'.

" Your Tribble API calls
...

" Stop trace
CALL FUNCTION 'SAT_STOP_TRACE_TOOL'.
```

## Troubleshooting

### Issue: Connection Timeout

```abap
" Increase timeout
lo_http_client->set_timeout( timeout = 300 ). " 5 minutes
```

### Issue: SSL Certificate Error

```abap
" Disable SSL verification (dev only!)
lo_http_client->ssl_client_pse->set_ssl_config(
  i_ssl_config = VALUE #(
    sslapplic = 'ANONYM'
  )
).
```

### Issue: Large Response Handling

```abap
" Stream large responses
DATA: lv_chunk TYPE xstring,
      lv_offset TYPE i.

DO.
  lo_http_client->response->get_data(
    EXPORTING
      offset = lv_offset
      length = 1024 * 1024  " 1MB chunks
    IMPORTING
      data = lv_chunk
  ).

  IF lv_chunk IS INITIAL.
    EXIT.
  ENDIF.

  " Process chunk
  lv_offset = lv_offset + xstrlen( lv_chunk ).
ENDDO.
```

## Support

For ABAP-specific issues:
- Check transaction ST22 (ABAP dumps)
- Check transaction SM21 (System log)
- Check transaction SLG1 (Application log)
- Review trace in transaction SAT

For Tribble API issues:
- Visit https://docs.tribble.ai
- Contact support@tribble.ai

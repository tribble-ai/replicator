/**
 * ABAP Integration Layer
 *
 * TypeScript representations of ABAP classes and utilities for generating
 * ABAP code for Tribble integration.
 */

import type {
  ABAPMethod,
  ABAPParameter,
  ABAPHttpRequest,
  ABAPHttpResponse,
  TribbleConnectionConfig,
} from '../types';

/**
 * ABAP class generator for Tribble API client
 */
export class ABAPClassGenerator {
  /**
   * Generate ABAP class definition
   */
  static generateClass(
    className: string,
    description: string,
    methods: ABAPMethod[]
  ): string {
    return `*&---------------------------------------------------------------------*
*& Class ${className}
*&---------------------------------------------------------------------*
*& ${description}
*&---------------------------------------------------------------------*
CLASS ${className} DEFINITION
  PUBLIC
  FINAL
  CREATE PUBLIC.

  PUBLIC SECTION.
    ${methods.map(m => this.generateMethodSignature(m)).join('\n    ')}

  PROTECTED SECTION.
    METHODS: execute_http_request
      IMPORTING
        iv_method TYPE string
        iv_path TYPE string
        iv_body TYPE string OPTIONAL
      EXPORTING
        ev_response TYPE string
        ev_status_code TYPE i
      RAISING
        cx_http_client_exception.

  PRIVATE SECTION.
    DATA: mv_api_url TYPE string,
          mv_api_key TYPE string,
          mo_http_client TYPE REF TO if_http_client.

    METHODS: initialize_client
      RAISING cx_http_client_exception.

ENDCLASS.

CLASS ${className} IMPLEMENTATION.

  ${methods.map(m => this.generateMethodImplementation(className, m)).join('\n\n  ')}

  METHOD execute_http_request.
    DATA: lv_url TYPE string,
          lv_response_text TYPE string.

    " Build full URL
    CONCATENATE mv_api_url iv_path INTO lv_url.

    " Create HTTP client if needed
    IF mo_http_client IS INITIAL.
      CALL METHOD initialize_client.
    ENDIF.

    " Set request method
    CALL METHOD mo_http_client->request->set_method(
      method = iv_method ).

    " Set request URI
    CALL METHOD mo_http_client->request->set_header_field(
      name  = '~request_uri'
      value = iv_path ).

    " Set API key header
    IF mv_api_key IS NOT INITIAL.
      CALL METHOD mo_http_client->request->set_header_field(
        name  = 'X-API-Key'
        value = mv_api_key ).
    ENDIF.

    " Set content type
    CALL METHOD mo_http_client->request->set_header_field(
      name  = 'Content-Type'
      value = 'application/json' ).

    " Set request body
    IF iv_body IS NOT INITIAL.
      CALL METHOD mo_http_client->request->set_cdata(
        data = iv_body ).
    ENDIF.

    " Send request
    CALL METHOD mo_http_client->send
      EXCEPTIONS
        http_communication_failure = 1
        http_invalid_state = 2
        http_processing_failed = 3
        OTHERS = 4.

    IF sy-subrc <> 0.
      RAISE EXCEPTION TYPE cx_http_client_exception.
    ENDIF.

    " Receive response
    CALL METHOD mo_http_client->receive
      EXCEPTIONS
        http_communication_failure = 1
        http_invalid_state = 2
        http_processing_failed = 3
        OTHERS = 4.

    IF sy-subrc <> 0.
      RAISE EXCEPTION TYPE cx_http_client_exception.
    ENDIF.

    " Get response status
    CALL METHOD mo_http_client->response->get_status(
      IMPORTING
        code = ev_status_code ).

    " Get response body
    ev_response = mo_http_client->response->get_cdata( ).

  ENDMETHOD.

  METHOD initialize_client.
    CALL METHOD cl_http_client=>create_by_url(
      EXPORTING
        url = mv_api_url
      IMPORTING
        client = mo_http_client
      EXCEPTIONS
        argument_not_found = 1
        plugin_not_active = 2
        internal_error = 3
        OTHERS = 4 ).

    IF sy-subrc <> 0.
      RAISE EXCEPTION TYPE cx_http_client_exception.
    ENDIF.

    " Set timeout (30 seconds)
    CALL METHOD mo_http_client->set_timeout(
      timeout = 30 ).

  ENDMETHOD.

ENDCLASS.`;
  }

  /**
   * Generate method signature
   */
  private static generateMethodSignature(method: ABAPMethod): string {
    const params = method.parameters
      .map(p => `      ${p.name} TYPE ${p.type}${p.optional ? ' OPTIONAL' : ''}`)
      .join('\n');

    const returning = method.returning
      ? `\n    RETURNING\n      VALUE(${method.returning.name}) TYPE ${method.returning.type}`
      : '';

    const exceptions = method.exceptions
      ? `\n    RAISING\n      ${method.exceptions.join('\n      ')}`
      : '';

    return `METHODS ${method.name}
    IMPORTING
${params}${returning}${exceptions}.`;
  }

  /**
   * Generate method implementation skeleton
   */
  private static generateMethodImplementation(className: string, method: ABAPMethod): string {
    return `METHOD ${method.name}.
    " TODO: Implement ${method.description}
    " This method should call execute_http_request with appropriate parameters
  ENDMETHOD.`;
  }
}

/**
 * Generate ZCL_TRIBBLE_API_CLIENT ABAP class
 */
export function generateTribbleAPIClient(config: TribbleConnectionConfig): string {
  const methods: ABAPMethod[] = [
    {
      name: 'constructor',
      description: 'Constructor - Initialize API client',
      parameters: [
        { name: 'iv_api_url', type: 'string', kind: 'importing' },
        { name: 'iv_api_key', type: 'string', kind: 'importing', optional: true },
      ],
    },
    {
      name: 'send_message',
      description: 'Send message to Tribble chat agent',
      parameters: [
        { name: 'iv_agent_id', type: 'string', kind: 'importing' },
        { name: 'iv_message', type: 'string', kind: 'importing' },
        { name: 'iv_conversation_id', type: 'string', kind: 'importing', optional: true },
      ],
      returning: { name: 'rv_response', type: 'string', kind: 'returning' },
      exceptions: ['cx_tribble_api_error'],
    },
    {
      name: 'upload_document',
      description: 'Upload document to Tribble for ingestion',
      parameters: [
        { name: 'iv_collection_id', type: 'string', kind: 'importing' },
        { name: 'iv_filename', type: 'string', kind: 'importing' },
        { name: 'iv_content', type: 'xstring', kind: 'importing' },
      ],
      returning: { name: 'rv_document_id', type: 'string', kind: 'returning' },
      exceptions: ['cx_tribble_api_error'],
    },
    {
      name: 'execute_agent',
      description: 'Execute Tribble agent with input',
      parameters: [
        { name: 'iv_agent_id', type: 'string', kind: 'importing' },
        { name: 'iv_input', type: 'string', kind: 'importing' },
      ],
      returning: { name: 'rv_output', type: 'string', kind: 'returning' },
      exceptions: ['cx_tribble_api_error'],
    },
  ];

  return ABAPClassGenerator.generateClass(
    'ZCL_TRIBBLE_API_CLIENT',
    'Tribble AI Platform API Client',
    methods
  );
}

/**
 * Generate ZCL_TRIBBLE_CHAT ABAP class
 */
export function generateTribbleChatClass(): string {
  const methods: ABAPMethod[] = [
    {
      name: 'create_conversation',
      description: 'Create new chat conversation',
      parameters: [
        { name: 'iv_agent_id', type: 'string', kind: 'importing' },
        { name: 'iv_title', type: 'string', kind: 'importing', optional: true },
      ],
      returning: { name: 'rv_conversation_id', type: 'string', kind: 'returning' },
      exceptions: ['cx_tribble_api_error'],
    },
    {
      name: 'send_message',
      description: 'Send message in conversation',
      parameters: [
        { name: 'iv_conversation_id', type: 'string', kind: 'importing' },
        { name: 'iv_message', type: 'string', kind: 'importing' },
      ],
      returning: { name: 'rv_response', type: 'string', kind: 'returning' },
      exceptions: ['cx_tribble_api_error'],
    },
    {
      name: 'get_conversation_history',
      description: 'Get conversation message history',
      parameters: [{ name: 'iv_conversation_id', type: 'string', kind: 'importing' }],
      returning: { name: 'rt_messages', type: 'tt_messages', kind: 'returning' },
      exceptions: ['cx_tribble_api_error'],
    },
  ];

  return ABAPClassGenerator.generateClass(
    'ZCL_TRIBBLE_CHAT',
    'Tribble Chat Integration',
    methods
  );
}

/**
 * Generate ZCL_TRIBBLE_INGEST ABAP class
 */
export function generateTribbleIngestClass(): string {
  const methods: ABAPMethod[] = [
    {
      name: 'upload_file',
      description: 'Upload file to Tribble collection',
      parameters: [
        { name: 'iv_collection_id', type: 'string', kind: 'importing' },
        { name: 'iv_filename', type: 'string', kind: 'importing' },
        { name: 'iv_content', type: 'xstring', kind: 'importing' },
        { name: 'iv_mime_type', type: 'string', kind: 'importing', optional: true },
      ],
      returning: { name: 'rv_document_id', type: 'string', kind: 'returning' },
      exceptions: ['cx_tribble_api_error'],
    },
    {
      name: 'upload_text',
      description: 'Upload text content to Tribble collection',
      parameters: [
        { name: 'iv_collection_id', type: 'string', kind: 'importing' },
        { name: 'iv_text', type: 'string', kind: 'importing' },
        { name: 'iv_title', type: 'string', kind: 'importing', optional: true },
      ],
      returning: { name: 'rv_document_id', type: 'string', kind: 'returning' },
      exceptions: ['cx_tribble_api_error'],
    },
    {
      name: 'get_document_status',
      description: 'Get document processing status',
      parameters: [{ name: 'iv_document_id', type: 'string', kind: 'importing' }],
      returning: { name: 'rv_status', type: 'string', kind: 'returning' },
      exceptions: ['cx_tribble_api_error'],
    },
  ];

  return ABAPClassGenerator.generateClass(
    'ZCL_TRIBBLE_INGEST',
    'Tribble Document Ingestion',
    methods
  );
}

/**
 * Generate ZCL_TRIBBLE_AGENT ABAP class
 */
export function generateTribbleAgentClass(): string {
  const methods: ABAPMethod[] = [
    {
      name: 'execute',
      description: 'Execute agent with input',
      parameters: [
        { name: 'iv_agent_id', type: 'string', kind: 'importing' },
        { name: 'iv_input', type: 'string', kind: 'importing' },
        { name: 'is_context', type: 'ts_context', kind: 'importing', optional: true },
      ],
      returning: { name: 'rv_output', type: 'string', kind: 'returning' },
      exceptions: ['cx_tribble_api_error'],
    },
    {
      name: 'execute_streaming',
      description: 'Execute agent with streaming response',
      parameters: [
        { name: 'iv_agent_id', type: 'string', kind: 'importing' },
        { name: 'iv_input', type: 'string', kind: 'importing' },
        { name: 'io_stream_handler', type: 'REF TO if_tribble_stream', kind: 'importing' },
      ],
      exceptions: ['cx_tribble_api_error'],
    },
    {
      name: 'get_agent_info',
      description: 'Get agent information',
      parameters: [{ name: 'iv_agent_id', type: 'string', kind: 'importing' }],
      returning: { name: 'rs_agent_info', type: 'ts_agent_info', kind: 'returning' },
      exceptions: ['cx_tribble_api_error'],
    },
  ];

  return ABAPClassGenerator.generateClass(
    'ZCL_TRIBBLE_AGENT',
    'Tribble Agent Execution',
    methods
  );
}

/**
 * Generate ABAP type definitions
 */
export function generateABAPTypes(): string {
  return `*&---------------------------------------------------------------------*
*& Type Definitions for Tribble Integration
*&---------------------------------------------------------------------*

" Message structure
TYPES: BEGIN OF ts_message,
         id TYPE string,
         conversation_id TYPE string,
         role TYPE string,
         content TYPE string,
         timestamp TYPE timestampl,
       END OF ts_message.

TYPES: tt_messages TYPE STANDARD TABLE OF ts_message WITH DEFAULT KEY.

" Agent info structure
TYPES: BEGIN OF ts_agent_info,
         id TYPE string,
         name TYPE string,
         description TYPE string,
         model TYPE string,
         status TYPE string,
       END OF ts_agent_info.

" Context structure for agent execution
TYPES: BEGIN OF ts_context,
         user_id TYPE string,
         session_id TYPE string,
         language TYPE string,
         metadata TYPE string,
       END OF ts_context.

" Document structure
TYPES: BEGIN OF ts_document,
         id TYPE string,
         collection_id TYPE string,
         filename TYPE string,
         mime_type TYPE string,
         size TYPE i,
         status TYPE string,
         uploaded_at TYPE timestampl,
       END OF ts_document.

" API response structure
TYPES: BEGIN OF ts_api_response,
         status_code TYPE i,
         success TYPE abap_bool,
         data TYPE string,
         error TYPE string,
       END OF ts_api_response.`;
}

/**
 * Generate ABAP exception class
 */
export function generateABAPExceptionClass(): string {
  return `*&---------------------------------------------------------------------*
*& Exception Class CX_TRIBBLE_API_ERROR
*&---------------------------------------------------------------------*
CLASS cx_tribble_api_error DEFINITION
  PUBLIC
  INHERITING FROM cx_static_check
  FINAL
  CREATE PUBLIC.

  PUBLIC SECTION.
    INTERFACES if_t100_message.
    INTERFACES if_t100_dyn_msg.

    CONSTANTS:
      BEGIN OF api_error,
        msgid TYPE symsgid VALUE 'ZTRIBBLE',
        msgno TYPE symsgno VALUE '001',
        attr1 TYPE scx_attrname VALUE 'MV_ERROR_MESSAGE',
        attr2 TYPE scx_attrname VALUE '',
        attr3 TYPE scx_attrname VALUE '',
        attr4 TYPE scx_attrname VALUE '',
      END OF api_error.

    DATA mv_error_message TYPE string.
    DATA mv_status_code TYPE i.

    METHODS constructor
      IMPORTING
        textid LIKE if_t100_message=>t100key OPTIONAL
        previous LIKE previous OPTIONAL
        mv_error_message TYPE string OPTIONAL
        mv_status_code TYPE i OPTIONAL.

ENDCLASS.

CLASS cx_tribble_api_error IMPLEMENTATION.

  METHOD constructor ##ADT_SUPPRESS_GENERATION.
    CALL METHOD super->constructor
      EXPORTING
        previous = previous.

    me->mv_error_message = mv_error_message.
    me->mv_status_code = mv_status_code.

    CLEAR me->textid.
    IF textid IS INITIAL.
      if_t100_message~t100key = api_error.
    ELSE.
      if_t100_message~t100key = textid.
    ENDIF.
  ENDMETHOD.

ENDCLASS.`;
}

/**
 * Export all ABAP utilities
 */
export { ABAPMethod, ABAPParameter, ABAPHttpRequest, ABAPHttpResponse } from '../types';

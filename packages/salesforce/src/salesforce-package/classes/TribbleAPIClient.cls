/**
 * @description Main API client for Tribble platform integration
 * Handles HTTP callouts to Tribble API endpoints with authentication
 * @author Tribble SDK
 * @version 1.0
 */
public with sharing class TribbleAPIClient {

    // Configuration
    private static final String DEFAULT_TIMEOUT = '120000';
    private static final String CONTENT_TYPE_JSON = 'application/json';

    // Custom Metadata Type for configuration
    private static Tribble_Config__mdt config {
        get {
            if (config == null) {
                config = [
                    SELECT API_Endpoint__c, Auth_Method__c, API_Key__c,
                           Named_Credential__c, Enable_Debug_Logs__c
                    FROM Tribble_Config__mdt
                    WHERE DeveloperName = 'Default_Config'
                    LIMIT 1
                ];
            }
            return config;
        }
        set;
    }

    /**
     * @description HTTP request wrapper
     */
    public class HTTPRequestWrapper {
        public String endpoint;
        public String method;
        public Map<String, String> headers;
        public String body;
        public Integer timeout;

        public HTTPRequestWrapper() {
            this.headers = new Map<String, String>();
            this.timeout = Integer.valueOf(DEFAULT_TIMEOUT);
        }
    }

    /**
     * @description HTTP response wrapper
     */
    public class HTTPResponseWrapper {
        public Integer statusCode;
        public String status;
        public String body;
        public Map<String, String> headers;
        public Boolean success;
        public String errorMessage;

        public HTTPResponseWrapper() {
            this.headers = new Map<String, String>();
            this.success = false;
        }
    }

    /**
     * @description Execute HTTP callout to Tribble API
     * @param requestWrapper Request configuration
     * @return HTTPResponseWrapper Response details
     */
    public static HTTPResponseWrapper executeCallout(HTTPRequestWrapper requestWrapper) {
        HTTPResponseWrapper responseWrapper = new HTTPResponseWrapper();

        try {
            // Build HTTP request
            HttpRequest request = new HttpRequest();

            // Set endpoint
            String fullEndpoint = buildEndpoint(requestWrapper.endpoint);
            request.setEndpoint(fullEndpoint);
            request.setMethod(requestWrapper.method);
            request.setTimeout(requestWrapper.timeout);

            // Set headers
            setAuthenticationHeader(request);
            request.setHeader('Content-Type', CONTENT_TYPE_JSON);

            // Add custom headers
            if (requestWrapper.headers != null) {
                for (String key : requestWrapper.headers.keySet()) {
                    request.setHeader(key, requestWrapper.headers.get(key));
                }
            }

            // Set body for POST/PUT/PATCH
            if (requestWrapper.body != null &&
                (requestWrapper.method == 'POST' || requestWrapper.method == 'PUT' || requestWrapper.method == 'PATCH')) {
                request.setBody(requestWrapper.body);
            }

            // Log request if debug is enabled
            if (config.Enable_Debug_Logs__c) {
                System.debug('Tribble API Request: ' + request.toString());
                System.debug('Request Body: ' + requestWrapper.body);
            }

            // Execute callout
            Http http = new Http();
            HttpResponse response = http.send(request);

            // Parse response
            responseWrapper.statusCode = response.getStatusCode();
            responseWrapper.status = response.getStatus();
            responseWrapper.body = response.getBody();
            responseWrapper.success = (response.getStatusCode() >= 200 && response.getStatusCode() < 300);

            // Log response if debug is enabled
            if (config.Enable_Debug_Logs__c) {
                System.debug('Tribble API Response: ' + response.toString());
                System.debug('Response Body: ' + response.getBody());
            }

            if (!responseWrapper.success) {
                responseWrapper.errorMessage = 'HTTP ' + response.getStatusCode() + ': ' + response.getStatus();
            }

        } catch (Exception e) {
            responseWrapper.success = false;
            responseWrapper.errorMessage = e.getMessage();
            System.debug(LoggingLevel.ERROR, 'Tribble API Error: ' + e.getMessage());
            System.debug(LoggingLevel.ERROR, 'Stack Trace: ' + e.getStackTraceString());
        }

        return responseWrapper;
    }

    /**
     * @description Build full endpoint URL
     * @param path API path
     * @return Full endpoint URL
     */
    private static String buildEndpoint(String path) {
        String baseUrl = config.API_Endpoint__c;
        if (baseUrl.endsWith('/') && path.startsWith('/')) {
            return baseUrl + path.substring(1);
        } else if (!baseUrl.endsWith('/') && !path.startsWith('/')) {
            return baseUrl + '/' + path;
        }
        return baseUrl + path;
    }

    /**
     * @description Set authentication header based on config
     * @param request HTTP request to modify
     */
    private static void setAuthenticationHeader(HttpRequest request) {
        if (config.Auth_Method__c == 'api-key') {
            // API Key authentication
            request.setHeader('Authorization', 'Bearer ' + config.API_Key__c);
        } else if (config.Auth_Method__c == 'named-credentials') {
            // Named Credentials (authentication handled by Salesforce)
            // Endpoint will use callout:NamedCredentialName format
        }
        // OAuth would be implemented separately with token refresh logic
    }

    /**
     * @description Parse JSON response to Map
     * @param jsonString JSON string to parse
     * @return Parsed map
     */
    public static Map<String, Object> parseJSON(String jsonString) {
        try {
            return (Map<String, Object>) JSON.deserializeUntyped(jsonString);
        } catch (Exception e) {
            System.debug(LoggingLevel.ERROR, 'JSON Parse Error: ' + e.getMessage());
            return new Map<String, Object>();
        }
    }

    /**
     * @description Convert object to JSON string
     * @param obj Object to serialize
     * @return JSON string
     */
    public static String toJSON(Object obj) {
        try {
            return JSON.serialize(obj);
        } catch (Exception e) {
            System.debug(LoggingLevel.ERROR, 'JSON Serialize Error: ' + e.getMessage());
            return '{}';
        }
    }

    /**
     * @description Get current user email for Tribble requests
     * @return User email
     */
    public static String getCurrentUserEmail() {
        return UserInfo.getUserEmail();
    }

    /**
     * @description Generate unique request ID for tracing
     * @return Request ID
     */
    public static String generateRequestId() {
        return 'sfdc-' + UserInfo.getOrganizationId() + '-' + System.now().getTime() + '-' +
               Math.round(Math.random() * 1000000);
    }
}

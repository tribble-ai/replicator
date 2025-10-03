/**
 * @description Test class for TribbleAPIClient
 * @author Tribble SDK
 * @version 1.0
 */
@isTest
private class TribbleAPIClientTest {

    /**
     * Mock HTTP response for testing
     */
    private class TribbleMockHttpResponse implements HttpCalloutMock {
        private Integer statusCode;
        private String responseBody;

        public TribbleMockHttpResponse(Integer statusCode, String responseBody) {
            this.statusCode = statusCode;
            this.responseBody = responseBody;
        }

        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(this.statusCode);
            res.setStatus(this.statusCode == 200 ? 'OK' : 'Error');
            res.setBody(this.responseBody);
            res.setHeader('Content-Type', 'application/json');
            return res;
        }
    }

    @isTest
    static void testSuccessfulCallout() {
        // Set up mock response
        String mockResponse = '{"success": true, "data": "test"}';
        Test.setMock(HttpCalloutMock.class, new TribbleMockHttpResponse(200, mockResponse));

        // Create request
        TribbleAPIClient.HTTPRequestWrapper request = new TribbleAPIClient.HTTPRequestWrapper();
        request.endpoint = '/test';
        request.method = 'GET';

        Test.startTest();
        TribbleAPIClient.HTTPResponseWrapper response = TribbleAPIClient.executeCallout(request);
        Test.stopTest();

        // Assertions
        System.assert(response.success, 'Callout should be successful');
        System.assertEquals(200, response.statusCode, 'Status code should be 200');
        System.assertEquals(mockResponse, response.body, 'Response body should match');
    }

    @isTest
    static void testFailedCallout() {
        // Set up mock response
        String mockResponse = '{"error": "Not found"}';
        Test.setMock(HttpCalloutMock.class, new TribbleMockHttpResponse(404, mockResponse));

        // Create request
        TribbleAPIClient.HTTPRequestWrapper request = new TribbleAPIClient.HTTPRequestWrapper();
        request.endpoint = '/notfound';
        request.method = 'GET';

        Test.startTest();
        TribbleAPIClient.HTTPResponseWrapper response = TribbleAPIClient.executeCallout(request);
        Test.stopTest();

        // Assertions
        System.assert(!response.success, 'Callout should fail');
        System.assertEquals(404, response.statusCode, 'Status code should be 404');
        System.assertNotEquals(null, response.errorMessage, 'Error message should be set');
    }

    @isTest
    static void testPostRequest() {
        // Set up mock response
        String mockResponse = '{"success": true, "id": 123}';
        Test.setMock(HttpCalloutMock.class, new TribbleMockHttpResponse(200, mockResponse));

        // Create request
        TribbleAPIClient.HTTPRequestWrapper request = new TribbleAPIClient.HTTPRequestWrapper();
        request.endpoint = '/create';
        request.method = 'POST';
        request.body = '{"name": "Test"}';

        Test.startTest();
        TribbleAPIClient.HTTPResponseWrapper response = TribbleAPIClient.executeCallout(request);
        Test.stopTest();

        // Assertions
        System.assert(response.success, 'POST request should be successful');
    }

    @isTest
    static void testParseJSON() {
        String jsonString = '{"key": "value", "number": 123}';

        Test.startTest();
        Map<String, Object> parsed = TribbleAPIClient.parseJSON(jsonString);
        Test.stopTest();

        System.assertEquals('value', parsed.get('key'), 'Should parse string value');
        System.assertEquals(123, parsed.get('number'), 'Should parse number value');
    }

    @isTest
    static void testToJSON() {
        Map<String, Object> data = new Map<String, Object>{
            'name' => 'Test',
            'count' => 5
        };

        Test.startTest();
        String json = TribbleAPIClient.toJSON(data);
        Test.stopTest();

        System.assert(json.contains('"name"'), 'JSON should contain name field');
        System.assert(json.contains('Test'), 'JSON should contain name value');
    }

    @isTest
    static void testGetCurrentUserEmail() {
        Test.startTest();
        String email = TribbleAPIClient.getCurrentUserEmail();
        Test.stopTest();

        System.assertNotEquals(null, email, 'Should return user email');
        System.assertEquals(UserInfo.getUserEmail(), email, 'Should match UserInfo email');
    }

    @isTest
    static void testGenerateRequestId() {
        Test.startTest();
        String requestId1 = TribbleAPIClient.generateRequestId();
        String requestId2 = TribbleAPIClient.generateRequestId();
        Test.stopTest();

        System.assertNotEquals(null, requestId1, 'Should generate request ID');
        System.assertNotEquals(requestId1, requestId2, 'Request IDs should be unique');
        System.assert(requestId1.startsWith('sfdc-'), 'Request ID should have sfdc prefix');
    }
}

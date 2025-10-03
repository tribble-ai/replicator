/**
 * Scripted REST API Resources for Tribble integration
 */

export const TRIBBLE_CHAT_API_RESOURCE = `
/**
 * POST /api/x_tribble/chat/message
 * Send chat message to Tribble agent
 */
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    try {
        var requestBody = request.body.data;

        if (!requestBody.message) {
            response.setStatus(400);
            response.setBody({
                error: 'Message is required'
            });
            return;
        }

        var tribbleClient = new TribbleAPIClient();
        var result = tribbleClient.sendChatMessage(
            requestBody.message,
            requestBody.sessionId,
            requestBody.agentId,
            requestBody.metadata
        );

        if (result.success) {
            response.setStatus(200);
            response.setBody(result.data);
        } else {
            response.setStatus(500);
            response.setBody({
                error: result.error
            });
        }

    } catch (e) {
        response.setStatus(500);
        response.setBody({
            error: e.message
        });
    }

})(request, response);
`;

export const TRIBBLE_INGEST_API_RESOURCE = `
/**
 * POST /api/x_tribble/ingest/attachment
 * Ingest attachment into Tribble
 */
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    try {
        var requestBody = request.body.data;

        if (!requestBody.attachmentSysId) {
            response.setStatus(400);
            response.setBody({
                error: 'Attachment sys_id is required'
            });
            return;
        }

        var ingestService = new TribbleIngestService();
        var result = ingestService.ingestAttachment(
            requestBody.attachmentSysId,
            requestBody.metadata
        );

        if (result.success) {
            response.setStatus(200);
            response.setBody({
                documentId: result.documentId
            });
        } else {
            response.setStatus(500);
            response.setBody({
                error: result.error
            });
        }

    } catch (e) {
        response.setStatus(500);
        response.setBody({
            error: e.message
        });
    }

})(request, response);
`;

export const TRIBBLE_AGENT_API_RESOURCE = `
/**
 * POST /api/x_tribble/agent/execute
 * Execute agent action
 */
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    try {
        var requestBody = request.body.data;

        if (!requestBody.agentId || !requestBody.action) {
            response.setStatus(400);
            response.setBody({
                error: 'Agent ID and action are required'
            });
            return;
        }

        var agentService = new TribbleAgentService();
        var tribbleClient = new TribbleAPIClient();

        var result = tribbleClient.executeAgentAction(
            requestBody.agentId,
            requestBody.action,
            requestBody.input || {}
        );

        if (result.success) {
            response.setStatus(200);
            response.setBody(result.data);
        } else {
            response.setStatus(500);
            response.setBody({
                error: result.error
            });
        }

    } catch (e) {
        response.setStatus(500);
        response.setBody({
            error: e.message
        });
    }

})(request, response);
`;

export const TRIBBLE_STATUS_API_RESOURCE = `
/**
 * GET /api/x_tribble/status
 * Get Tribble integration status
 */
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    try {
        var tribbleClient = new TribbleAPIClient();

        var config = {
            baseUrl: tribbleClient.baseUrl,
            email: tribbleClient.email,
            hasApiToken: !!tribbleClient.apiToken,
            defaultAgentId: gs.getProperty('x_tribble.tribble.default_agent_id')
        };

        response.setStatus(200);
        response.setBody({
            status: 'configured',
            config: config,
            timestamp: new GlideDateTime().toString()
        });

    } catch (e) {
        response.setStatus(500);
        response.setBody({
            status: 'error',
            error: e.message
        });
    }

})(request, response);
`;

export const TRIBBLE_KNOWLEDGE_SEARCH_API_RESOURCE = `
/**
 * POST /api/x_tribble/knowledge/search
 * Search knowledge using Tribble AI
 */
(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    try {
        var requestBody = request.body.data;

        if (!requestBody.query) {
            response.setStatus(400);
            response.setBody({
                error: 'Search query is required'
            });
            return;
        }

        var agentService = new TribbleAgentService();
        var agentId = requestBody.agentId || gs.getProperty('x_tribble.tribble.default_agent_id');

        var result = agentService.suggestKnowledge(requestBody.query, agentId);

        if (result.success) {
            response.setStatus(200);
            response.setBody(result.data);
        } else {
            response.setStatus(500);
            response.setBody({
                error: result.error
            });
        }

    } catch (e) {
        response.setStatus(500);
        response.setBody({
            error: e.message
        });
    }

})(request, response);
`;

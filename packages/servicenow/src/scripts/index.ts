/**
 * ServiceNow server-side scripts for Tribble integration
 * These scripts run within ServiceNow's server-side JavaScript environment
 */

export const TRIBBLE_API_CLIENT_SCRIPT = `
/**
 * TribbleAPIClient - Script Include
 * Handles communication with Tribble AI platform from ServiceNow
 */
var TribbleAPIClient = Class.create();
TribbleAPIClient.prototype = {
    initialize: function() {
        this.baseUrl = gs.getProperty('x_tribble.tribble.base_url');
        this.apiToken = gs.getProperty('x_tribble.tribble.api_token');
        this.email = gs.getProperty('x_tribble.tribble.email');
        this.timeout = parseInt(gs.getProperty('x_tribble.api.timeout', '30000'));
    },

    /**
     * Send chat message to Tribble agent
     */
    sendChatMessage: function(message, sessionId, agentId, metadata) {
        try {
            var endpoint = this.baseUrl + '/agent/chat';
            var payload = {
                message: message,
                sessionId: sessionId || this._generateSessionId(),
                agentId: agentId || gs.getProperty('x_tribble.tribble.default_agent_id'),
                email: this.email,
                metadata: metadata || {}
            };

            var response = this._makeRequest('POST', endpoint, payload);
            return {
                success: true,
                data: response
            };
        } catch (e) {
            gs.error('TribbleAPIClient: Chat error - ' + e.message);
            return {
                success: false,
                error: e.message
            };
        }
    },

    /**
     * Ingest document into Tribble
     */
    ingestDocument: function(fileName, fileContent, metadata) {
        try {
            var ingestUrl = gs.getProperty('x_tribble.tribble.ingest_url') || this.baseUrl + '/ingest';
            var endpoint = ingestUrl + '/documents';

            var payload = {
                fileName: fileName,
                content: fileContent,
                metadata: metadata || {},
                uploadedBy: this.email
            };

            var response = this._makeRequest('POST', endpoint, payload);
            return {
                success: true,
                documentId: response.documentId
            };
        } catch (e) {
            gs.error('TribbleAPIClient: Ingest error - ' + e.message);
            return {
                success: false,
                error: e.message
            };
        }
    },

    /**
     * Execute agent action
     */
    executeAgentAction: function(agentId, action, input) {
        try {
            var endpoint = this.baseUrl + '/agent/' + agentId + '/execute';
            var payload = {
                action: action,
                input: input,
                email: this.email
            };

            var response = this._makeRequest('POST', endpoint, payload);
            return {
                success: true,
                data: response
            };
        } catch (e) {
            gs.error('TribbleAPIClient: Agent action error - ' + e.message);
            return {
                success: false,
                error: e.message
            };
        }
    },

    /**
     * Get agent status
     */
    getAgentStatus: function(agentId) {
        try {
            var endpoint = this.baseUrl + '/agent/' + agentId + '/status';
            var response = this._makeRequest('GET', endpoint);
            return {
                success: true,
                data: response
            };
        } catch (e) {
            gs.error('TribbleAPIClient: Status error - ' + e.message);
            return {
                success: false,
                error: e.message
            };
        }
    },

    /**
     * Make HTTP request to Tribble API
     */
    _makeRequest: function(method, endpoint, payload) {
        var request = new sn_ws.RESTMessageV2();
        request.setHttpMethod(method);
        request.setEndpoint(endpoint);
        request.setRequestHeader('Authorization', 'Bearer ' + this.apiToken);
        request.setRequestHeader('Content-Type', 'application/json');
        request.setRequestHeader('X-Tribble-Source', 'servicenow');

        if (payload) {
            request.setRequestBody(JSON.stringify(payload));
        }

        var response = request.execute();
        var httpStatus = response.getStatusCode();

        if (httpStatus < 200 || httpStatus >= 300) {
            throw new Error('HTTP ' + httpStatus + ': ' + response.getBody());
        }

        var body = response.getBody();
        return body ? JSON.parse(body) : {};
    },

    /**
     * Generate unique session ID
     */
    _generateSessionId: function() {
        return 'snow-' + gs.generateGUID();
    },

    type: 'TribbleAPIClient'
};
`;

export const TRIBBLE_INGEST_SERVICE_SCRIPT = `
/**
 * TribbleIngestService - Script Include
 * Handles document ingestion from ServiceNow to Tribble
 */
var TribbleIngestService = Class.create();
TribbleIngestService.prototype = {
    initialize: function() {
        this.tribbleClient = new TribbleAPIClient();
    },

    /**
     * Ingest attachment from ServiceNow record
     */
    ingestAttachment: function(attachmentSysId, metadata) {
        try {
            var ga = new GlideRecord('sys_attachment');
            if (!ga.get(attachmentSysId)) {
                throw new Error('Attachment not found: ' + attachmentSysId);
            }

            var fileName = ga.file_name.toString();
            var contentType = ga.content_type.toString();
            var fileSize = parseInt(ga.size_bytes.toString());

            // Get attachment content
            var gsa = new GlideSysAttachment();
            var attachmentData = gsa.getBytes(ga);
            var base64Content = GlideStringUtil.base64Encode(attachmentData);

            // Prepare metadata
            var enrichedMetadata = metadata || {};
            enrichedMetadata.sourceSysId = attachmentSysId;
            enrichedMetadata.sourceTable = ga.table_name.toString();
            enrichedMetadata.sourceRecord = ga.table_sys_id.toString();
            enrichedMetadata.contentType = contentType;
            enrichedMetadata.fileSize = fileSize;
            enrichedMetadata.uploadedAt = new GlideDateTime().toString();

            // Ingest to Tribble
            var result = this.tribbleClient.ingestDocument(
                fileName,
                base64Content,
                enrichedMetadata
            );

            if (result.success) {
                // Update attachment with Tribble document ID
                ga.setValue('u_tribble_doc_id', result.documentId);
                ga.update();
            }

            return result;
        } catch (e) {
            gs.error('TribbleIngestService: Attachment ingest error - ' + e.message);
            return {
                success: false,
                error: e.message
            };
        }
    },

    /**
     * Ingest knowledge article
     */
    ingestKnowledgeArticle: function(articleSysId) {
        try {
            var kb = new GlideRecord('kb_knowledge');
            if (!kb.get(articleSysId)) {
                throw new Error('Knowledge article not found: ' + articleSysId);
            }

            var content = kb.text.toString() || '';
            var title = kb.short_description.toString();
            var metadata = {
                type: 'knowledge_article',
                sourceSysId: articleSysId,
                title: title,
                number: kb.number.toString(),
                category: kb.kb_category.getDisplayValue(),
                author: kb.sys_created_by.toString(),
                createdAt: kb.sys_created_on.toString(),
                updatedAt: kb.sys_updated_on.toString()
            };

            return this.tribbleClient.ingestDocument(
                'kb_' + kb.number.toString() + '.html',
                GlideStringUtil.base64Encode(content),
                metadata
            );
        } catch (e) {
            gs.error('TribbleIngestService: Knowledge article ingest error - ' + e.message);
            return {
                success: false,
                error: e.message
            };
        }
    },

    /**
     * Bulk ingest multiple documents
     */
    bulkIngest: function(attachmentSysIds) {
        var results = [];
        for (var i = 0; i < attachmentSysIds.length; i++) {
            var result = this.ingestAttachment(attachmentSysIds[i]);
            results.push({
                sysId: attachmentSysIds[i],
                result: result
            });
        }
        return results;
    },

    type: 'TribbleIngestService'
};
`;

export const TRIBBLE_AGENT_SERVICE_SCRIPT = `
/**
 * TribbleAgentService - Script Include
 * Handles agent interactions and workflow automation
 */
var TribbleAgentService = Class.create();
TribbleAgentService.prototype = {
    initialize: function() {
        this.tribbleClient = new TribbleAPIClient();
    },

    /**
     * Process incident with AI agent
     */
    processIncident: function(incidentSysId, agentId) {
        try {
            var inc = new GlideRecord('incident');
            if (!inc.get(incidentSysId)) {
                throw new Error('Incident not found: ' + incidentSysId);
            }

            var input = {
                number: inc.number.toString(),
                shortDescription: inc.short_description.toString(),
                description: inc.description.toString(),
                priority: inc.priority.toString(),
                category: inc.category.toString(),
                state: inc.state.toString(),
                caller: inc.caller_id.getDisplayValue()
            };

            var result = this.tribbleClient.executeAgentAction(
                agentId,
                'analyze_incident',
                input
            );

            if (result.success && result.data.recommendations) {
                // Update incident with AI recommendations
                inc.work_notes = 'AI Analysis:\\n' + result.data.recommendations;
                inc.update();
            }

            return result;
        } catch (e) {
            gs.error('TribbleAgentService: Incident processing error - ' + e.message);
            return {
                success: false,
                error: e.message
            };
        }
    },

    /**
     * Generate automated response
     */
    generateResponse: function(context, agentId) {
        try {
            var result = this.tribbleClient.executeAgentAction(
                agentId,
                'generate_response',
                context
            );

            return result;
        } catch (e) {
            gs.error('TribbleAgentService: Response generation error - ' + e.message);
            return {
                success: false,
                error: e.message
            };
        }
    },

    /**
     * Suggest knowledge articles
     */
    suggestKnowledge: function(query, agentId) {
        try {
            var result = this.tribbleClient.executeAgentAction(
                agentId,
                'suggest_knowledge',
                { query: query }
            );

            return result;
        } catch (e) {
            gs.error('TribbleAgentService: Knowledge suggestion error - ' + e.message);
            return {
                success: false,
                error: e.message
            };
        }
    },

    type: 'TribbleAgentService'
};
`;

export const TRIBBLE_BUSINESS_RULE_SCRIPT = `
/**
 * Business Rule: Auto-process incidents with Tribble AI
 * When: after, insert
 * Table: incident
 */
(function executeRule(current, previous /*null when async*/) {

    // Check if auto-processing is enabled
    var autoProcess = gs.getProperty('x_tribble.auto_process_incidents', 'false');
    if (autoProcess !== 'true') {
        return;
    }

    // Get default agent ID
    var agentId = gs.getProperty('x_tribble.tribble.default_agent_id');
    if (!agentId) {
        gs.warn('TribbleBusinessRule: No default agent ID configured');
        return;
    }

    // Process incident asynchronously
    var agentService = new TribbleAgentService();
    var result = agentService.processIncident(current.sys_id.toString(), agentId);

    if (result.success) {
        gs.info('TribbleBusinessRule: Incident ' + current.number + ' processed successfully');
    } else {
        gs.error('TribbleBusinessRule: Failed to process incident ' + current.number + ': ' + result.error);
    }

})(current, previous);
`;

export * from './api-resources';

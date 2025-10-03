/**
 * ServiceNow deployment templates
 */

export const UPDATE_SET_TEMPLATE = `<?xml version="1.0" encoding="UTF-8"?>
<unload unload_date="{{timestamp}}">
  <sys_remote_update_set action="INSERT_OR_UPDATE">
    <sys_id>{{updateSetId}}</sys_id>
    <name>{{appName}} - v{{version}}</name>
    <description>{{description}}</description>
    <application>{{scope}}</application>
    <state>complete</state>
    <sys_created_by>admin</sys_created_by>
    <sys_created_on>{{timestamp}}</sys_created_on>
  </sys_remote_update_set>
</unload>`;

export const SCOPED_APP_TEMPLATE = {
  name: '',
  scope: '',
  version: '1.0.0',
  short_description: '',
  description: '',
  vendor: 'Tribble',
  vendor_prefix: 'tribble',
  logo: '',
  dependencies: [],
  components: [],
};

export const REST_MESSAGE_TEMPLATE = {
  name: 'Tribble API Connection',
  endpoint: 'https://api.tribble.ai',
  authentication: 'bearer',
  headers: {
    'Content-Type': 'application/json',
    'X-Tribble-Source': 'servicenow',
  },
  methods: [
    {
      name: 'Send Chat Message',
      http_method: 'POST',
      endpoint: '/agent/chat',
      headers: {},
    },
    {
      name: 'Ingest Document',
      http_method: 'POST',
      endpoint: '/ingest/documents',
      headers: {},
    },
    {
      name: 'Execute Agent',
      http_method: 'POST',
      endpoint: '/agent/:agentId/execute',
      headers: {},
    },
  ],
};

export const OAUTH_CONFIG_TEMPLATE = {
  name: 'Tribble OAuth Provider',
  client_id: '',
  client_secret: '',
  default_grant_type: 'client_credentials',
  token_url: 'https://api.tribble.ai/oauth/token',
  authorization_url: 'https://api.tribble.ai/oauth/authorize',
  scope: 'api:read api:write',
};

export const UI_PAGE_TEMPLATE = `<?xml version="1.0" encoding="utf-8" ?>
<j:jelly trim="false" xmlns:j="jelly:core" xmlns:g="glide" xmlns:j2="null" xmlns:g2="null">
  <g:ui_page>
    <g:name>tribble_admin</g:name>
    <g:title>Tribble Administration</g:title>
    <g:html><![CDATA[
      <!DOCTYPE html>
      <html>
        <head>
          <title>Tribble Administration</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                     color: white; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
            .section { background: white; padding: 20px; border-radius: 8px;
                      box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px; }
            .status-badge { display: inline-block; padding: 5px 15px; border-radius: 12px;
                           font-size: 12px; font-weight: bold; }
            .status-success { background: #d4edda; color: #155724; }
            .status-error { background: #f8d7da; color: #721c24; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Tribble AI Platform Integration</h1>
            <p>Manage your Tribble integration settings</p>
          </div>

          <div class="section">
            <h2>Configuration Status</h2>
            <div id="status-container">
              <span class="status-badge status-success">Connected</span>
            </div>
          </div>

          <div class="section">
            <h2>System Properties</h2>
            <p>Configure Tribble integration settings in System Properties</p>
            <button onclick="window.location.href='sys_properties_list.do?sysparm_query=nameSTARTSWITHx_tribble'">
              View Properties
            </button>
          </div>

          <div class="section">
            <h2>Components</h2>
            <ul>
              <li>Service Portal Widgets (4)</li>
              <li>Script Includes (3)</li>
              <li>Scripted REST API (1)</li>
              <li>Business Rules (1)</li>
            </ul>
          </div>
        </body>
      </html>
    ]]></g:html>
  </g:ui_page>
</j:jelly>`;

export const BUSINESS_RULE_TEMPLATE = {
  name: 'Tribble Auto Process',
  table: 'incident',
  when: 'after',
  order: 100,
  active: true,
  advanced: true,
  condition: '',
  script: `// Auto-process incident with Tribble AI
(function executeRule(current, previous) {
  var enabled = gs.getProperty('x_tribble.auto_process_incidents', 'false');
  if (enabled !== 'true') return;

  var agentService = new TribbleAgentService();
  var agentId = gs.getProperty('x_tribble.tribble.default_agent_id');

  if (agentId) {
    agentService.processIncident(current.sys_id.toString(), agentId);
  }
})(current, previous);`,
};

export const CLIENT_SCRIPT_TEMPLATE = {
  name: 'Tribble Chat Helper',
  type: 'onLoad',
  table: 'incident',
  script: `function onLoad() {
  // Initialize Tribble chat on incident form
  if (typeof TribbleChatWidget !== 'undefined') {
    var chatWidget = new TribbleChatWidget({
      containerId: 'tribble-chat-container',
      agentId: g_form.getValue('u_assigned_agent'),
      context: {
        recordId: g_form.getUniqueValue(),
        table: 'incident',
        number: g_form.getValue('number')
      }
    });
    chatWidget.initialize();
  }
}`,
};

export const SCHEDULED_JOB_TEMPLATE = {
  name: 'Tribble Sync Knowledge Base',
  description: 'Synchronize knowledge articles with Tribble platform',
  active: false,
  run_as: 'system',
  run_dayofweek: '',
  run_period: '86400', // Daily
  script: `// Sync knowledge articles to Tribble
var ingestService = new TribbleIngestService();
var kb = new GlideRecord('kb_knowledge');
kb.addQuery('workflow_state', 'published');
kb.addQuery('sys_updated_on', '>', gs.daysAgoStart(1));
kb.query();

var count = 0;
while (kb.next() && count < 100) {
  try {
    ingestService.ingestKnowledgeArticle(kb.sys_id.toString());
    count++;
  } catch (e) {
    gs.error('Failed to ingest article: ' + kb.number + ' - ' + e.message);
  }
}

gs.info('Tribble KB Sync: Processed ' + count + ' articles');`,
};

export const FLOW_TEMPLATE = {
  name: 'Tribble AI Incident Analysis',
  description: 'Analyze incident using Tribble AI agent',
  trigger: {
    table: 'incident',
    when: 'created',
  },
  actions: [
    {
      name: 'Call Tribble Agent',
      type: 'script',
      script: `var tribbleClient = new TribbleAPIClient();
var result = tribbleClient.executeAgentAction(
  inputs.agentId,
  'analyze_incident',
  {
    number: inputs.incident_number,
    description: inputs.description,
    category: inputs.category
  }
);
outputs.analysis = result.data;`,
    },
    {
      name: 'Update Incident',
      type: 'update_record',
      table: 'incident',
      fields: {
        work_notes: '{{outputs.analysis}}',
        assignment_group: '{{outputs.suggested_group}}',
      },
    },
  ],
};

export const SERVICE_CATALOG_ITEM_TEMPLATE = {
  name: 'Request Tribble AI Assistant',
  short_description: 'Get AI-powered assistance from Tribble',
  description:
    'Request access to Tribble AI assistant for automated support and analysis',
  category: 'Self Service',
  variables: [
    {
      name: 'use_case',
      question: 'What do you need help with?',
      type: 'multi_line_text',
      mandatory: true,
    },
    {
      name: 'preferred_agent',
      question: 'Preferred AI Agent',
      type: 'reference',
      reference: 'x_tribble_agent',
    },
  ],
  workflow: 'Tribble AI Request Fulfillment',
};

/**
 * Template utilities
 */
export function renderTemplate(
  template: string,
  variables: Record<string, any>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, String(value));
  }
  return result;
}

export function getDefaultTemplateVariables(scope: string) {
  return {
    scope,
    appName: 'Tribble App',
    version: '1.0.0',
    description: 'Tribble AI integration for ServiceNow',
    timestamp: new Date().toISOString(),
    vendor: 'Tribble',
    vendorPrefix: 'tribble',
  };
}

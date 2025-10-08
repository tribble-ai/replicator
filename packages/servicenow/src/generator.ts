/**
 * Update Set XML Generator for ServiceNow
 * Generates ServiceNow update set XML from Tribble app components
 */

import type { ServiceNowApp, ServiceNowWidget, SystemProperty } from './types/index';

export class UpdateSetGenerator {
  private app: ServiceNowApp;

  constructor(app: ServiceNowApp) {
    this.app = app;
  }

  /**
   * Generate complete update set XML
   */
  async generate(components: {
    scriptIncludes?: Array<{ name: string; script: string }>;
    widgets?: ServiceNowWidget[];
    systemProperties?: SystemProperty[];
    businessRules?: Array<{ name: string; script: string; table: string }>;
  }): Promise<string> {
    const updates: string[] = [];

    // Generate script includes
    if (components.scriptIncludes) {
      for (const scriptInclude of components.scriptIncludes) {
        updates.push(this.generateScriptInclude(scriptInclude));
      }
    }

    // Generate widgets
    if (components.widgets) {
      for (const widget of components.widgets) {
        updates.push(this.generateWidget(widget));
      }
    }

    // Generate system properties
    if (components.systemProperties) {
      for (const prop of components.systemProperties) {
        updates.push(this.generateSystemProperty(prop));
      }
    }

    // Generate business rules
    if (components.businessRules) {
      for (const rule of components.businessRules) {
        updates.push(this.generateBusinessRule(rule));
      }
    }

    return this.wrapInUpdateSet(updates);
  }

  /**
   * Generate script include XML
   */
  private generateScriptInclude(scriptInclude: {
    name: string;
    script: string;
  }): string {
    const sysId = this.generateSysId();
    const now = this.getTimestamp();

    return `
    <sys_script_include action="INSERT_OR_UPDATE">
      <sys_id>${sysId}</sys_id>
      <name>${this.escapeXml(scriptInclude.name)}</name>
      <api_name>${this.app.scope}.${scriptInclude.name}</api_name>
      <script><![CDATA[${scriptInclude.script}]]></script>
      <active>true</active>
      <access>public</access>
      <client_callable>false</client_callable>
      <description>Tribble integration - ${scriptInclude.name}</description>
      <sys_scope>${this.app.scope}</sys_scope>
      <sys_created_by>admin</sys_created_by>
      <sys_created_on>${now}</sys_created_on>
      <sys_updated_by>admin</sys_updated_by>
      <sys_updated_on>${now}</sys_updated_on>
    </sys_script_include>`;
  }

  /**
   * Generate Service Portal widget XML
   */
  private generateWidget(widget: ServiceNowWidget): string {
    const sysId = this.generateSysId();
    const now = this.getTimestamp();

    return `
    <sp_widget action="INSERT_OR_UPDATE">
      <sys_id>${sysId}</sys_id>
      <id>${widget.id}</id>
      <name>${this.escapeXml(widget.name)}</name>
      <description>${this.escapeXml(widget.description)}</description>
      <script><![CDATA[${widget.script ?? widget.serverScript ?? ''}]]></script>
      <client_script><![CDATA[${widget.clientScript}]]></client_script>
      <template><![CDATA[${widget.template}]]></template>
      <css>${this.escapeXml(widget.css)}</css>
      <option_schema>${widget.optionSchema ? JSON.stringify(widget.optionSchema) : ''}</option_schema>
      <public>true</public>
      <roles></roles>
      <sys_scope>${this.app.scope}</sys_scope>
      <sys_created_by>admin</sys_created_by>
      <sys_created_on>${now}</sys_created_on>
      <sys_updated_by>admin</sys_updated_by>
      <sys_updated_on>${now}</sys_updated_on>
    </sp_widget>`;
  }

  /**
   * Generate system property XML
   */
  private generateSystemProperty(prop: SystemProperty): string {
    const sysId = this.generateSysId();
    const now = this.getTimestamp();

    return `
    <sys_properties action="INSERT_OR_UPDATE">
      <sys_id>${sysId}</sys_id>
      <name>${this.escapeXml(prop.name)}</name>
      <value>${this.escapeXml(prop.value)}</value>
      <description>${this.escapeXml(prop.description)}</description>
      <type>${prop.type}</type>
      <is_private>${prop.isPrivate || false}</is_private>
      <suffix>${this.app.scope}</suffix>
      <sys_created_by>admin</sys_created_by>
      <sys_created_on>${now}</sys_created_on>
      <sys_updated_by>admin</sys_updated_by>
      <sys_updated_on>${now}</sys_updated_on>
    </sys_properties>`;
  }

  /**
   * Generate business rule XML
   */
  private generateBusinessRule(rule: {
    name: string;
    script: string;
    table: string;
  }): string {
    const sysId = this.generateSysId();
    const now = this.getTimestamp();

    return `
    <sys_script action="INSERT_OR_UPDATE">
      <sys_id>${sysId}</sys_id>
      <name>${this.escapeXml(rule.name)}</name>
      <collection>${rule.table}</collection>
      <script><![CDATA[${rule.script}]]></script>
      <when>after</when>
      <order>100</order>
      <active>true</active>
      <filter_condition></filter_condition>
      <description>Tribble integration - ${rule.name}</description>
      <sys_scope>${this.app.scope}</sys_scope>
      <sys_created_by>admin</sys_created_by>
      <sys_created_on>${now}</sys_created_on>
      <sys_updated_by>admin</sys_updated_by>
      <sys_updated_on>${now}</sys_updated_on>
    </sys_script>`;
  }

  /**
   * Wrap updates in update set XML structure
   */
  private wrapInUpdateSet(updates: string[]): string {
    const updateSetId = this.generateSysId();
    const now = this.getTimestamp();

    return `<?xml version="1.0" encoding="UTF-8"?>
<unload unload_date="${now}">
  <sys_remote_update_set action="INSERT_OR_UPDATE">
    <sys_id>${updateSetId}</sys_id>
    <name>${this.escapeXml(this.app.name)} - v${this.app.version}</name>
    <description>${this.escapeXml(this.app.description)}</description>
    <application>${this.app.scope}</application>
    <state>complete</state>
    <sys_created_by>admin</sys_created_by>
    <sys_created_on>${now}</sys_created_on>
    <sys_updated_by>admin</sys_updated_by>
    <sys_updated_on>${now}</sys_updated_on>
  </sys_remote_update_set>

  <sys_update_xml action="INSERT_OR_UPDATE">
    ${updates.join('\n    ')}
  </sys_update_xml>
</unload>`;
  }

  /**
   * Generate ServiceNow sys_id (32-character hex string)
   */
  private generateSysId(): string {
    return Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  /**
   * Get ServiceNow timestamp format
   */
  private getTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Generate REST Message configuration
   */
  generateRestMessage(config: {
    name: string;
    endpoint: string;
    authType: string;
  }): string {
    const sysId = this.generateSysId();
    const now = this.getTimestamp();

    return `
    <sys_rest_message action="INSERT_OR_UPDATE">
      <sys_id>${sysId}</sys_id>
      <name>${this.escapeXml(config.name)}</name>
      <rest_endpoint>${this.escapeXml(config.endpoint)}</rest_endpoint>
      <authentication_type>${config.authType}</authentication_type>
      <description>Tribble API integration endpoint</description>
      <sys_scope>${this.app.scope}</sys_scope>
      <sys_created_by>admin</sys_created_by>
      <sys_created_on>${now}</sys_created_on>
      <sys_updated_by>admin</sys_updated_by>
      <sys_updated_on>${now}</sys_updated_on>
    </sys_rest_message>`;
  }

  /**
   * Generate Scripted REST API definition
   */
  generateScriptedRestAPI(config: {
    name: string;
    apiId: string;
    basePath: string;
  }): string {
    const sysId = this.generateSysId();
    const now = this.getTimestamp();

    return `
    <sys_ws_definition action="INSERT_OR_UPDATE">
      <sys_id>${sysId}</sys_id>
      <name>${this.escapeXml(config.name)}</name>
      <api_id>${config.apiId}</api_id>
      <base_uri>${this.escapeXml(config.basePath)}</base_uri>
      <namespace>${this.app.scope}</namespace>
      <active>true</active>
      <enforce_acl>false</enforce_acl>
      <sys_scope>${this.app.scope}</sys_scope>
      <sys_created_by>admin</sys_created_by>
      <sys_created_on>${now}</sys_created_on>
      <sys_updated_by>admin</sys_updated_by>
      <sys_updated_on>${now}</sys_updated_on>
    </sys_ws_definition>`;
  }
}

/**
 * Export utility functions
 */
export function generateUpdateSetName(
  appName: string,
  version: string,
  timestamp?: Date
): string {
  const ts = timestamp || new Date();
  const dateStr = ts.toISOString().split('T')[0];
  return `${appName}_v${version}_${dateStr}`;
}

export function validateUpdateSetXml(xml: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!xml.includes('<?xml version="1.0"')) {
    errors.push('Missing XML declaration');
  }

  if (!xml.includes('<unload')) {
    errors.push('Missing unload element');
  }

  if (!xml.includes('</unload>')) {
    errors.push('Missing closing unload element');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

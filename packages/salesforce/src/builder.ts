/**
 * Package builder for Salesforce deployments
 */

import type {
  PackageBuilderConfig,
  PackageComponent,
  RemoteSiteSetting,
  SalesforceConfig,
} from './types';

/**
 * Salesforce package builder
 */
export class PackageBuilder {
  private config: Partial<PackageBuilderConfig> = {
    apiVersion: '59.0',
    components: [],
  };

  constructor(name: string, version: string = '0.1.0') {
    this.config.name = name;
    this.config.version = version;
  }

  /**
   * Set API version
   */
  setApiVersion(version: string): this {
    this.config.apiVersion = version;
    return this;
  }

  /**
   * Add Apex class component
   */
  addApexClass(name: string, content: string, dependencies: string[] = []): this {
    this.config.components!.push({
      type: 'ApexClass',
      name,
      content,
      dependencies,
    });
    return this;
  }

  /**
   * Add Lightning Web Component
   */
  addLWC(name: string, content: string, metadata: any, dependencies: string[] = []): this {
    this.config.components!.push({
      type: 'LightningComponentBundle',
      name,
      content,
      metadata,
      dependencies,
    });
    return this;
  }

  /**
   * Add Remote Site Setting
   */
  addRemoteSiteSetting(setting: RemoteSiteSetting): this {
    this.config.components!.push({
      type: 'RemoteSiteSetting',
      name: setting.fullName,
      metadata: setting,
    });
    return this;
  }

  /**
   * Add Custom Metadata Type
   */
  addCustomMetadata(name: string, metadata: any): this {
    this.config.components!.push({
      type: 'CustomMetadata',
      name,
      metadata,
    });
    return this;
  }

  /**
   * Build package configuration
   */
  build(): PackageBuilderConfig {
    if (!this.config.name) {
      throw new Error('Package name is required');
    }
    return this.config as PackageBuilderConfig;
  }

  /**
   * Generate package.xml manifest
   */
  generateManifest(): string {
    const components = this.config.components || [];
    const grouped = this.groupComponentsByType(components);

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<Package xmlns="http://soap.sforce.com/2006/04/metadata">\n';

    for (const [type, members] of Object.entries(grouped)) {
      xml += '  <types>\n';
      for (const member of members) {
        xml += `    <members>${member}</members>\n`;
      }
      xml += `    <name>${type}</name>\n`;
      xml += '  </types>\n';
    }

    xml += `  <version>${this.config.apiVersion}</version>\n`;
    xml += '</Package>\n';

    return xml;
  }

  /**
   * Group components by type for manifest
   */
  private groupComponentsByType(components: PackageComponent[]): Record<string, string[]> {
    const grouped: Record<string, string[]> = {};

    for (const component of components) {
      const type = this.getMetadataType(component.type);
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(component.name);
    }

    return grouped;
  }

  /**
   * Get Salesforce metadata type name
   */
  private getMetadataType(componentType: PackageComponent['type']): string {
    switch (componentType) {
      case 'ApexClass':
        return 'ApexClass';
      case 'ApexTrigger':
        return 'ApexTrigger';
      case 'LightningComponentBundle':
        return 'LightningComponentBundle';
      case 'CustomObject':
        return 'CustomObject';
      case 'CustomMetadata':
        return 'CustomMetadata';
      case 'RemoteSiteSetting':
        return 'RemoteSiteSetting';
      case 'NamedCredential':
        return 'NamedCredential';
      default:
        return 'CustomObject';
    }
  }
}

/**
 * Template generator for Salesforce components
 */
export class TemplateGenerator {
  /**
   * Generate Apex class template
   */
  static apexClass(className: string, methods: string[] = []): string {
    return `public with sharing class ${className} {
    ${methods.map(m => `    ${m}`).join('\n    ')}
}`;
  }

  /**
   * Generate Apex test class template
   */
  static apexTestClass(className: string, testMethods: string[] = []): string {
    return `@isTest
private class ${className} {
    ${testMethods.map(m => `    ${m}`).join('\n    ')}
}`;
  }

  /**
   * Generate LWC JavaScript template
   */
  static lwcJavaScript(componentName: string): string {
    return `import { LightningElement, track } from 'lwc';

export default class ${componentName} extends LightningElement {
    @track data;

    connectedCallback() {
        // Component initialization
    }

    handleAction(event) {
        // Handle user actions
    }
}`;
  }

  /**
   * Generate LWC HTML template
   */
  static lwcHtml(componentName: string): string {
    return `<template>
    <lightning-card title="${componentName}">
        <div class="slds-m-around_medium">
            <!-- Component content -->
        </div>
    </lightning-card>
</template>`;
  }

  /**
   * Generate LWC CSS template
   */
  static lwcCss(): string {
    return `:host {
    display: block;
}

.container {
    padding: 1rem;
}`;
  }

  /**
   * Generate LWC metadata XML
   */
  static lwcMetadataXml(apiVersion: string = '59.0', isExposed: boolean = true): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>${apiVersion}</apiVersion>
    <isExposed>${isExposed}</isExposed>
    <targets>
        <target>lightning__AppPage</target>
        <target>lightning__RecordPage</target>
        <target>lightning__HomePage</target>
    </targets>
</LightningComponentBundle>`;
  }

  /**
   * Generate Remote Site Setting XML
   */
  static remoteSiteSettingXml(setting: RemoteSiteSetting): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<RemoteSiteSetting xmlns="http://soap.sforce.com/2006/04/metadata">
    <disableProtocolSecurity>${setting.disableProtocolSecurity || false}</disableProtocolSecurity>
    <isActive>${setting.isActive}</isActive>
    <url>${setting.url}</url>
    <description>${setting.description}</description>
</RemoteSiteSetting>`;
  }

  /**
   * Generate Custom Metadata Type XML
   */
  static customMetadataTypeXml(
    fullName: string,
    label: string,
    pluralLabel: string,
    fields: Array<{ fullName: string; label: string; type: string; required: boolean }>
  ): string {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
    <label>${label}</label>
    <pluralLabel>${pluralLabel}</pluralLabel>
    <visibility>Public</visibility>\n`;

    for (const field of fields) {
      xml += `    <fields>
        <fullName>${field.fullName}</fullName>
        <label>${field.label}</label>
        <type>${field.type}</type>
        <required>${field.required}</required>
    </fields>\n`;
    }

    xml += '</CustomObject>\n';
    return xml;
  }
}

/**
 * Package validator
 */
export class PackageValidator {
  /**
   * Validate package configuration
   */
  static validatePackage(config: PackageBuilderConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.name) {
      errors.push('Package name is required');
    }

    if (!config.version) {
      errors.push('Package version is required');
    }

    if (!config.apiVersion) {
      errors.push('API version is required');
    }

    if (!config.components || config.components.length === 0) {
      errors.push('Package must contain at least one component');
    }

    // Validate component dependencies
    const componentNames = new Set(config.components.map(c => c.name));
    for (const component of config.components) {
      if (component.dependencies) {
        for (const dep of component.dependencies) {
          if (!componentNames.has(dep)) {
            errors.push(`Component ${component.name} depends on missing component: ${dep}`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate component naming conventions
   */
  static validateComponentName(name: string, type: PackageComponent['type']): boolean {
    // Salesforce API name rules: start with letter, alphanumeric + underscore, max 40 chars
    const nameRegex = /^[a-zA-Z][a-zA-Z0-9_]{0,39}$/;

    if (!nameRegex.test(name)) {
      return false;
    }

    // Additional validation based on type
    if (type === 'ApexClass' || type === 'ApexTrigger') {
      // Apex names should use PascalCase
      return /^[A-Z][a-zA-Z0-9_]*$/.test(name);
    }

    if (type === 'LightningComponentBundle') {
      // LWC names should use camelCase
      return /^[a-z][a-zA-Z0-9]*$/.test(name);
    }

    return true;
  }
}

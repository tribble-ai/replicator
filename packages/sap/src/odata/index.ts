/**
 * OData Service Generation for Tribble Integration
 *
 * Generates OData v2/v4 service definitions that proxy to Tribble APIs.
 */

import type {
  ODataServiceConfig,
  ODataEntityType,
  ODataEntitySet,
  ODataProperty,
  ODataAnnotation,
} from '../types';

/**
 * OData metadata generator
 */
export class ODataMetadataGenerator {
  constructor(private config: ODataServiceConfig) {}

  /**
   * Generate complete OData metadata XML
   */
  generate(): string {
    const version = this.config.version === '4.0' ? '4.0' : '2.0';

    return `<?xml version="1.0" encoding="utf-8"?>
<edmx:Edmx Version="${version === '4.0' ? '4.0' : '1.0'}" xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx">
  <edmx:DataServices>
    <Schema Namespace="${this.config.namespace}" xmlns="http://docs.oasis-open.org/odata/ns/edm">
      ${this.generateEntityTypes()}
      ${this.generateEntityContainer()}
    </Schema>
  </edmx:DataServices>
</edmx:Edmx>`;
  }

  /**
   * Generate entity type definitions
   */
  private generateEntityTypes(): string {
    return this.config.entities
      .map(entity => this.generateEntityType(entity))
      .join('\n      ');
  }

  /**
   * Generate single entity type
   */
  private generateEntityType(entity: ODataEntityType): string {
    const properties = entity.properties
      .map(prop => this.generateProperty(prop))
      .join('\n        ');

    const keys = entity.keys.map(key => `<PropertyRef Name="${key}"/>`).join('\n          ');

    const navProps = entity.navigationProperties
      ? entity.navigationProperties
          .map(
            nav =>
              `<NavigationProperty Name="${nav.name}" Type="${nav.targetType}" ${
                nav.multiplicity === '*' ? '' : `Multiplicity="${nav.multiplicity}"`
              }/>`
          )
          .join('\n        ')
      : '';

    return `<EntityType Name="${entity.name}">
        <Key>
          ${keys}
        </Key>
        ${properties}
        ${navProps}
      </EntityType>`;
  }

  /**
   * Generate property definition
   */
  private generateProperty(prop: ODataProperty): string {
    const attrs: string[] = [`Name="${prop.name}"`, `Type="${prop.type}"`];

    if (prop.nullable !== undefined) {
      attrs.push(`Nullable="${prop.nullable}"`);
    }
    if (prop.maxLength) {
      attrs.push(`MaxLength="${prop.maxLength}"`);
    }
    if (prop.precision) {
      attrs.push(`Precision="${prop.precision}"`);
    }
    if (prop.scale !== undefined) {
      attrs.push(`Scale="${prop.scale}"`);
    }
    if (prop.defaultValue) {
      attrs.push(`DefaultValue="${prop.defaultValue}"`);
    }

    return `<Property ${attrs.join(' ')}/>`;
  }

  /**
   * Generate entity container
   */
  private generateEntityContainer(): string {
    const entitySets = this.config.entitySets
      .map(set => this.generateEntitySet(set))
      .join('\n        ');

    return `<EntityContainer Name="${this.config.name}Container">
        ${entitySets}
      </EntityContainer>`;
  }

  /**
   * Generate entity set definition
   */
  private generateEntitySet(entitySet: ODataEntitySet): string {
    return `<EntitySet Name="${entitySet.name}" EntityType="${this.config.namespace}.${entitySet.entityType}"/>`;
  }
}

/**
 * Generate OData annotations for Fiori Elements
 */
export class ODataAnnotationGenerator {
  /**
   * Generate UI annotations for list page
   */
  static generateListPageAnnotations(entitySet: string): string {
    return `<Annotations Target="${entitySet}" xmlns="http://docs.oasis-open.org/odata/ns/edm">
  <Annotation Term="UI.LineItem">
    <Collection>
      <Record Type="UI.DataField">
        <PropertyValue Property="Value" Path="id"/>
        <PropertyValue Property="Label" String="ID"/>
      </Record>
      <Record Type="UI.DataField">
        <PropertyValue Property="Value" Path="name"/>
        <PropertyValue Property="Label" String="Name"/>
      </Record>
      <Record Type="UI.DataField">
        <PropertyValue Property="Value" Path="status"/>
        <PropertyValue Property="Label" String="Status"/>
      </Record>
    </Collection>
  </Annotation>
</Annotations>`;
  }

  /**
   * Generate UI annotations for object page
   */
  static generateObjectPageAnnotations(entitySet: string): string {
    return `<Annotations Target="${entitySet}" xmlns="http://docs.oasis-open.org/odata/ns/edm">
  <Annotation Term="UI.HeaderInfo">
    <Record Type="UI.HeaderInfoType">
      <PropertyValue Property="TypeName" String="Item"/>
      <PropertyValue Property="TypeNamePlural" String="Items"/>
      <PropertyValue Property="Title">
        <Record Type="UI.DataField">
          <PropertyValue Property="Value" Path="name"/>
        </Record>
      </PropertyValue>
    </Record>
  </Annotation>
  <Annotation Term="UI.Facets">
    <Collection>
      <Record Type="UI.ReferenceFacet">
        <PropertyValue Property="Label" String="General Information"/>
        <PropertyValue Property="Target" AnnotationPath="@UI.FieldGroup#GeneralInfo"/>
      </Record>
    </Collection>
  </Annotation>
  <Annotation Term="UI.FieldGroup" Qualifier="GeneralInfo">
    <Record Type="UI.FieldGroupType">
      <PropertyValue Property="Data">
        <Collection>
          <Record Type="UI.DataField">
            <PropertyValue Property="Value" Path="id"/>
            <PropertyValue Property="Label" String="ID"/>
          </Record>
          <Record Type="UI.DataField">
            <PropertyValue Property="Value" Path="description"/>
            <PropertyValue Property="Label" String="Description"/>
          </Record>
        </Collection>
      </PropertyValue>
    </Record>
  </Annotation>
</Annotations>`;
  }
}

/**
 * Tribble-specific OData service configurations
 */

/**
 * Generate OData service for Tribble Chat
 */
export function createTribbleChatService(): ODataServiceConfig {
  return {
    name: 'TribbleChat',
    namespace: 'com.tribble.chat',
    version: '2.0',
    entities: [
      {
        name: 'Conversation',
        namespace: 'com.tribble.chat',
        keys: ['id'],
        properties: [
          { name: 'id', type: 'Edm.String', nullable: false },
          { name: 'title', type: 'Edm.String', maxLength: 255 },
          { name: 'agentId', type: 'Edm.String', maxLength: 100 },
          { name: 'userId', type: 'Edm.String', maxLength: 100 },
          { name: 'createdAt', type: 'Edm.DateTime', nullable: false },
          { name: 'updatedAt', type: 'Edm.DateTime', nullable: false },
          { name: 'status', type: 'Edm.String', maxLength: 50 },
        ],
      },
      {
        name: 'Message',
        namespace: 'com.tribble.chat',
        keys: ['id'],
        properties: [
          { name: 'id', type: 'Edm.String', nullable: false },
          { name: 'conversationId', type: 'Edm.String', nullable: false },
          { name: 'role', type: 'Edm.String', maxLength: 50 },
          { name: 'content', type: 'Edm.String' },
          { name: 'timestamp', type: 'Edm.DateTime', nullable: false },
          { name: 'metadata', type: 'Edm.String' },
        ],
      },
    ],
    entitySets: [
      {
        name: 'Conversations',
        entityType: 'Conversation',
        updatable: true,
        deletable: true,
        insertable: true,
      },
      {
        name: 'Messages',
        entityType: 'Message',
        updatable: false,
        deletable: false,
        insertable: true,
      },
    ],
  };
}

/**
 * Generate OData service for Tribble Document Ingestion
 */
export function createTribbleIngestService(): ODataServiceConfig {
  return {
    name: 'TribbleIngest',
    namespace: 'com.tribble.ingest',
    version: '2.0',
    entities: [
      {
        name: 'Document',
        namespace: 'com.tribble.ingest',
        keys: ['id'],
        properties: [
          { name: 'id', type: 'Edm.String', nullable: false },
          { name: 'collectionId', type: 'Edm.String', nullable: false },
          { name: 'filename', type: 'Edm.String', maxLength: 500 },
          { name: 'mimeType', type: 'Edm.String', maxLength: 100 },
          { name: 'size', type: 'Edm.Int64' },
          { name: 'status', type: 'Edm.String', maxLength: 50 },
          { name: 'uploadedAt', type: 'Edm.DateTime', nullable: false },
          { name: 'processedAt', type: 'Edm.DateTime' },
          { name: 'userId', type: 'Edm.String', maxLength: 100 },
          { name: 'metadata', type: 'Edm.String' },
        ],
      },
      {
        name: 'Collection',
        namespace: 'com.tribble.ingest',
        keys: ['id'],
        properties: [
          { name: 'id', type: 'Edm.String', nullable: false },
          { name: 'name', type: 'Edm.String', maxLength: 255 },
          { name: 'description', type: 'Edm.String' },
          { name: 'documentCount', type: 'Edm.Int32' },
          { name: 'createdAt', type: 'Edm.DateTime', nullable: false },
        ],
      },
    ],
    entitySets: [
      {
        name: 'Documents',
        entityType: 'Document',
        updatable: false,
        deletable: true,
        insertable: true,
      },
      {
        name: 'Collections',
        entityType: 'Collection',
        updatable: true,
        deletable: true,
        insertable: true,
      },
    ],
  };
}

/**
 * Generate OData service for Tribble Agents
 */
export function createTribbleAgentService(): ODataServiceConfig {
  return {
    name: 'TribbleAgent',
    namespace: 'com.tribble.agent',
    version: '2.0',
    entities: [
      {
        name: 'Agent',
        namespace: 'com.tribble.agent',
        keys: ['id'],
        properties: [
          { name: 'id', type: 'Edm.String', nullable: false },
          { name: 'name', type: 'Edm.String', maxLength: 255 },
          { name: 'description', type: 'Edm.String' },
          { name: 'model', type: 'Edm.String', maxLength: 100 },
          { name: 'systemPrompt', type: 'Edm.String' },
          { name: 'status', type: 'Edm.String', maxLength: 50 },
          { name: 'createdAt', type: 'Edm.DateTime', nullable: false },
          { name: 'updatedAt', type: 'Edm.DateTime', nullable: false },
        ],
      },
      {
        name: 'AgentExecution',
        namespace: 'com.tribble.agent',
        keys: ['id'],
        properties: [
          { name: 'id', type: 'Edm.String', nullable: false },
          { name: 'agentId', type: 'Edm.String', nullable: false },
          { name: 'input', type: 'Edm.String' },
          { name: 'output', type: 'Edm.String' },
          { name: 'status', type: 'Edm.String', maxLength: 50 },
          { name: 'startedAt', type: 'Edm.DateTime', nullable: false },
          { name: 'completedAt', type: 'Edm.DateTime' },
          { name: 'duration', type: 'Edm.Int32' },
        ],
      },
    ],
    entitySets: [
      {
        name: 'Agents',
        entityType: 'Agent',
        updatable: true,
        deletable: true,
        insertable: true,
      },
      {
        name: 'AgentExecutions',
        entityType: 'AgentExecution',
        updatable: false,
        deletable: false,
        insertable: true,
      },
    ],
  };
}

/**
 * Export all OData utilities
 */
export {
  ODataServiceConfig,
  ODataEntityType,
  ODataEntitySet,
  ODataProperty,
  ODataAnnotation,
} from '../types';

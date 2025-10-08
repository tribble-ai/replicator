/**
 * @tribble/sdk-sap
 *
 * SAP S/4HANA deployment module for Tribble SDK.
 * Provides tools for building and deploying Fiori applications
 * integrated with Tribble AI platform.
 *
 * @example Basic Setup
 * ```typescript
 * import { SAPConfigManager, createTribbleDestination } from '@tribble/sdk-sap';
 *
 * const configManager = new SAPConfigManager();
 *
 * // Configure SAP system
 * configManager.loadSAPConfig({
 *   systemId: 'S4H',
 *   client: '100',
 *   baseUrl: 'https://s4h.example.com',
 *   target: 'on-premise',
 *   language: 'EN',
 * });
 *
 * // Configure Tribble connection
 * configManager.loadTribbleConfig({
 *   apiUrl: 'https://api.tribble.ai',
 *   apiKey: 'your-api-key',
 * });
 *
 * // Create RFC destination
 * const destination = createTribbleDestination(configManager.getTribbleConfig());
 * configManager.registerDestination(destination);
 * ```
 *
 * @example Generate OData Service
 * ```typescript
 * import {
 *   createTribbleChatService,
 *   ODataMetadataGenerator,
 * } from '@tribble/sdk-sap';
 *
 * const service = createTribbleChatService();
 * const generator = new ODataMetadataGenerator(service);
 * const metadata = generator.generate();
 *
 * // Save metadata.xml for SAP Gateway
 * fs.writeFileSync('metadata.xml', metadata);
 * ```
 *
 * @example Generate ABAP Classes
 * ```typescript
 * import { generateTribbleAPIClient } from '@tribble/sdk-sap';
 *
 * const abapCode = generateTribbleAPIClient({
 *   apiUrl: 'https://api.tribble.ai',
 *   apiKey: 'your-api-key',
 * });
 *
 * fs.writeFileSync('ZCL_TRIBBLE_API_CLIENT.abap', abapCode);
 * ```
 *
 * @example Build Fiori Application
 * ```typescript
 * import { generateManifest, generateComponent } from '@tribble/sdk-sap';
 *
 * const manifest = generateManifest({
 *   appId: 'com.tribble.chat',
 *   appName: 'Tribble Chat',
 *   description: 'AI-powered chat for SAP',
 *   version: '1.0.0',
 *   namespace: 'com.tribble.chat',
 *   odataService: '/sap/odata/tribble/chat/',
 * });
 *
 * const component = generateComponent('com.tribble.chat');
 * ```
 *
 * @packageDocumentation
 */

import { configManager } from './config';
import type {
  SAPSystemConfig,
  TribbleConnectionConfig,
  FioriAppType,
} from './types';

// ==================== Core Types ====================
export type {
  SAPDeploymentTarget,
  SAPSystemConfig,
  TribbleConnectionConfig,
  RFCDestinationConfig,
  ODataEntityType,
  ODataEntitySet,
  ODataProperty,
  ODataNavigationProperty,
  ODataServiceConfig,
  ODataAnnotation,
  ABAPMethod,
  ABAPParameter,
  ABAPHttpRequest,
  ABAPHttpResponse,
  FioriAppType,
  FioriManifest,
  FioriDataSource,
  FioriModel,
  FioriRouting,
  FioriRoute,
  FioriTarget,
  FioriInbound,
  FioriOutbound,
  BTPDeploymentConfig,
  XSAppConfig,
  XSAppRoute,
  TribbleAgentSAPConfig,
  TribbleIngestSAPConfig,
  SAPUserContext,
  SAPBusinessContext,
  CLICommand,
  CLIOption,
  ScaffoldOptions,
  BuildOptions,
  DeployOptions,
  DeepPartial,
  RequiredFields,
} from './types';

// ==================== Error Types ====================
export {
  SAPIntegrationError,
  ODataServiceError,
  ABAPExecutionError,
  FioriDeploymentError,
} from './types';

// ==================== Configuration ====================
export {
  SAPConfigManager,
  DEFAULT_SAP_CONFIG,
  DEFAULT_TRIBBLE_CONFIG,
  createTribbleDestination,
  generateXSAppConfig,
  generateBTPManifest,
  configManager,
} from './config';

// ==================== OData Services ====================
export {
  ODataMetadataGenerator,
  ODataAnnotationGenerator,
  createTribbleChatService,
  createTribbleIngestService,
  createTribbleAgentService,
} from './odata';

// ==================== ABAP Integration ====================
export {
  ABAPClassGenerator,
  generateTribbleAPIClient,
  generateTribbleChatClass,
  generateTribbleIngestClass,
  generateTribbleAgentClass,
  generateABAPTypes,
  generateABAPExceptionClass,
} from './abap';

// ==================== UI5/Fiori ====================
export {
  generateManifest,
  generateComponent,
  generateIndexHTML,
  generateAppView,
  generateAppController,
  generateChatView,
  generateChatController,
  generateUploadView,
} from './ui5';

// ==================== Utilities ====================
export {
  parseSAPUserContext,
  parseSAPBusinessContext,
  formatSAPDate,
  toSAPDate,
  formatSAPTime,
  toSAPTime,
  formatSAPAmount,
  toSAPAmount,
  createTribbleRequest,
  parseABAPResponse,
  validateSAPConfig,
  validateTribbleConfig,
  generateSAPGUID,
  escapeABAPString,
  createODataFilter,
  createODataOrderBy,
  chunkArray,
  retryWithBackoff,
  sapTableToJSON,
  jsonToSAPTable,
  formatTransactionCode,
  checkSAPAvailability,
  getSAPSystemInfo,
} from './utils';

// ==================== Package Information ====================
export const SAP_SDK_VERSION = '0.1.0';
export const SUPPORTED_UI5_VERSIONS = ['1.120.0', '1.121.0', '1.122.0'];
export const SUPPORTED_ODATA_VERSIONS = ['2.0', '4.0'];
export const SUPPORTED_SAP_SYSTEMS = ['S/4HANA', 'ECC', 'BTP'];

/**
 * Initialize SAP SDK with default configuration
 */
export function initializeSAPSDK(config?: {
  sapConfig?: Partial<SAPSystemConfig>;
  tribbleConfig?: Partial<TribbleConnectionConfig>;
  autoLoadEnv?: boolean;
}) {
  if (config?.autoLoadEnv !== false) {
    try {
      require('dotenv').config();
      configManager.loadFromEnv();
    } catch {
      // Dotenv not available or no env vars
    }
  }

  if (config?.sapConfig) {
    configManager.loadSAPConfig(config.sapConfig as SAPSystemConfig);
  }

  if (config?.tribbleConfig) {
    configManager.loadTribbleConfig(config.tribbleConfig as TribbleConnectionConfig);
  }

  return configManager;
}

/**
 * Quick start helper for creating a basic Tribble-SAP integration
 */
export async function quickStart(options: {
  appName: string;
  appType: FioriAppType;
  outputDir: string;
  sapConfig: SAPSystemConfig;
  tribbleConfig: TribbleConnectionConfig;
}) {
  const { generateManifest, generateComponent, generateIndexHTML } = require('./ui5');
  const { createTribbleChatService, ODataMetadataGenerator } = require('./odata');
  const { generateTribbleAPIClient } = require('./abap');
  const fs = require('fs');
  const path = require('path');

  // Create directory structure
  const dirs = [
    options.outputDir,
    path.join(options.outputDir, 'webapp'),
    path.join(options.outputDir, 'odata'),
    path.join(options.outputDir, 'abap'),
  ];

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Generate Fiori app
  const manifest = generateManifest({
    appId: `com.tribble.${options.appName.toLowerCase()}`,
    appName: options.appName,
    description: `Tribble-powered ${options.appType} application`,
    version: '1.0.0',
    namespace: `com.tribble.${options.appName.toLowerCase()}`,
    appType: options.appType,
  });

  fs.writeFileSync(
    path.join(options.outputDir, 'webapp', 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  // Generate OData service
  const service = createTribbleChatService();
  const generator = new ODataMetadataGenerator(service);
  fs.writeFileSync(
    path.join(options.outputDir, 'odata', 'metadata.xml'),
    generator.generate()
  );

  // Generate ABAP classes
  const abapCode = generateTribbleAPIClient(options.tribbleConfig);
  fs.writeFileSync(
    path.join(options.outputDir, 'abap', 'ZCL_TRIBBLE_API_CLIENT.abap'),
    abapCode
  );

  return {
    success: true,
    outputDir: options.outputDir,
    files: {
      manifest: path.join(options.outputDir, 'webapp', 'manifest.json'),
      odata: path.join(options.outputDir, 'odata', 'metadata.xml'),
      abap: path.join(options.outputDir, 'abap', 'ZCL_TRIBBLE_API_CLIENT.abap'),
    },
  };
}

/**
 * Default export
 */
export default {
  version: SAP_SDK_VERSION,
  initializeSAPSDK,
  quickStart,
  configManager,
};

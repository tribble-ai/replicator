import { z } from 'zod';

// ==================== Capability Registry ====================

/**
 * Platform capability definition.
 * Capabilities represent features/services that extensions can depend on.
 */
export interface Capability {
  /** Capability identifier (e.g., "brain.search") */
  name: string;
  /** Human-readable description */
  description: string;
  /** Minimum platform version that includes this capability */
  minPlatformVersion: string;
  /** Whether this capability is deprecated */
  deprecated?: boolean;
  /** Replacement capability if deprecated */
  replacedBy?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Capability version info.
 */
export interface CapabilityVersion {
  /** Capability name */
  capability: string;
  /** Available since version */
  since: string;
  /** Breaking changes in this version */
  breaking?: string[];
  /** New features in this version */
  features?: string[];
}

/**
 * Platform capabilities registry.
 * This is seeded from the platform and updated with each release.
 */
export const PLATFORM_CAPABILITIES: Record<string, Capability> = {
  // Core capabilities
  'brain.search': {
    name: 'brain.search',
    description: 'Vector search across ingested documents',
    minPlatformVersion: '1.0.0',
  },
  'brain.ingest': {
    name: 'brain.ingest',
    description: 'Document ingestion and processing',
    minPlatformVersion: '1.0.0',
  },
  'brain.autoTag': {
    name: 'brain.autoTag',
    description: 'Automatic document tagging',
    minPlatformVersion: '1.5.0',
  },

  // Agent capabilities
  'agent.chat': {
    name: 'agent.chat',
    description: 'Conversational AI agent',
    minPlatformVersion: '1.0.0',
  },
  'agent.stream': {
    name: 'agent.stream',
    description: 'Streaming agent responses',
    minPlatformVersion: '1.0.0',
  },
  'agent.tools': {
    name: 'agent.tools',
    description: 'Tool/function calling support',
    minPlatformVersion: '1.0.0',
  },
  'agent.handoff': {
    name: 'agent.handoff',
    description: 'Agent handoff between cartridges',
    minPlatformVersion: '1.5.0',
  },

  // Integration capabilities
  'integrations.oauth2': {
    name: 'integrations.oauth2',
    description: 'OAuth2 authentication flow support',
    minPlatformVersion: '1.0.0',
  },
  'integrations.apiKey': {
    name: 'integrations.apiKey',
    description: 'API key authentication support',
    minPlatformVersion: '1.0.0',
  },
  'integrations.healthCheck': {
    name: 'integrations.healthCheck',
    description: 'Integration health monitoring',
    minPlatformVersion: '1.2.0',
  },
  'integrations.credentials': {
    name: 'integrations.credentials',
    description: 'Secure credential storage',
    minPlatformVersion: '1.0.0',
  },

  // Workflow capabilities
  'workflows.trigger': {
    name: 'workflows.trigger',
    description: 'Trigger background workflows',
    minPlatformVersion: '1.0.0',
  },
  'workflows.schedule': {
    name: 'workflows.schedule',
    description: 'Schedule recurring workflows',
    minPlatformVersion: '1.3.0',
  },
  'workflows.durable': {
    name: 'workflows.durable',
    description: 'Durable function orchestration',
    minPlatformVersion: '2.0.0',
  },

  // Extension capabilities
  'extensions.tools': {
    name: 'extensions.tools',
    description: 'Custom tool registration',
    minPlatformVersion: '2.0.0',
  },
  'extensions.integrations': {
    name: 'extensions.integrations',
    description: 'Custom integration registration',
    minPlatformVersion: '2.0.0',
  },
  'extensions.cartridges': {
    name: 'extensions.cartridges',
    description: 'Custom cartridge registration',
    minPlatformVersion: '2.0.0',
  },
  'extensions.ingestAdapters': {
    name: 'extensions.ingestAdapters',
    description: 'Custom ingest adapter registration',
    minPlatformVersion: '2.0.0',
  },

  // Data capabilities
  'data.structured': {
    name: 'data.structured',
    description: 'Structured data storage and querying',
    minPlatformVersion: '1.5.0',
  },
  'data.embeddings': {
    name: 'data.embeddings',
    description: 'Vector embeddings storage',
    minPlatformVersion: '1.0.0',
  },
  'data.citations': {
    name: 'data.citations',
    description: 'Source citation extraction',
    minPlatformVersion: '1.0.0',
  },

  // Analytics capabilities
  'analytics.telemetry': {
    name: 'analytics.telemetry',
    description: 'Usage and performance telemetry',
    minPlatformVersion: '1.2.0',
  },
  'analytics.feedback': {
    name: 'analytics.feedback',
    description: 'User feedback collection',
    minPlatformVersion: '1.3.0',
  },
};

/**
 * CapabilityRegistry - Check and resolve platform capabilities.
 *
 * @example
 * ```typescript
 * const registry = new CapabilityRegistry('2.0.0');
 *
 * // Check if capability is available
 * if (registry.has('brain.search')) {
 *   // Use brain search
 * }
 *
 * // Check extension compatibility
 * const compat = registry.checkExtensionCompatibility(extension);
 * if (!compat.compatible) {
 *   console.log('Missing capabilities:', compat.missing);
 * }
 * ```
 */
export class CapabilityRegistry {
  private platformVersion: string;
  private capabilities: Map<string, Capability>;

  constructor(platformVersion: string, customCapabilities?: Record<string, Capability>) {
    this.platformVersion = platformVersion;
    this.capabilities = new Map();

    // Load platform capabilities
    for (const [name, cap] of Object.entries(PLATFORM_CAPABILITIES)) {
      if (this.versionSatisfies(platformVersion, cap.minPlatformVersion)) {
        this.capabilities.set(name, cap);
      }
    }

    // Add custom capabilities
    if (customCapabilities) {
      for (const [name, cap] of Object.entries(customCapabilities)) {
        this.capabilities.set(name, cap);
      }
    }
  }

  /** Check if a capability is available */
  has(name: string): boolean {
    return this.capabilities.has(name);
  }

  /** Get capability info */
  get(name: string): Capability | undefined {
    return this.capabilities.get(name);
  }

  /** List all available capabilities */
  list(): Capability[] {
    return [...this.capabilities.values()];
  }

  /** List capabilities by category */
  listByCategory(category: string): Capability[] {
    return this.list().filter(c => c.name.startsWith(`${category}.`));
  }

  /** Check if multiple capabilities are available */
  hasAll(names: string[]): boolean {
    return names.every(name => this.has(name));
  }

  /** Check extension compatibility */
  checkExtensionCompatibility(extension: {
    manifest: { capabilities?: string[]; platformVersion: string };
  }): CapabilityCompatibility {
    const required = extension.manifest.capabilities || [];
    const missing: string[] = [];
    const deprecated: Array<{ name: string; replacedBy?: string }> = [];

    for (const name of required) {
      const cap = this.capabilities.get(name);
      if (!cap) {
        missing.push(name);
      } else if (cap.deprecated) {
        deprecated.push({ name, replacedBy: cap.replacedBy });
      }
    }

    // Check platform version requirement
    const platformCompatible = this.versionSatisfies(
      this.platformVersion,
      extension.manifest.platformVersion.replace('>=', '')
    );

    return {
      compatible: missing.length === 0 && platformCompatible,
      platformVersion: this.platformVersion,
      requiredPlatformVersion: extension.manifest.platformVersion,
      platformCompatible,
      missing,
      deprecated,
    };
  }

  private versionSatisfies(current: string, required: string): boolean {
    const [curMajor, curMinor, curPatch] = current.split('.').map(Number);
    const [reqMajor, reqMinor, reqPatch] = required.split('.').map(Number);

    if (curMajor > reqMajor) return true;
    if (curMajor < reqMajor) return false;

    if (curMinor > reqMinor) return true;
    if (curMinor < reqMinor) return false;

    return curPatch >= reqPatch;
  }
}

export interface CapabilityCompatibility {
  compatible: boolean;
  platformVersion: string;
  requiredPlatformVersion: string;
  platformCompatible: boolean;
  missing: string[];
  deprecated: Array<{ name: string; replacedBy?: string }>;
}

// ==================== Feature Flags ====================

/**
 * Feature flag definition.
 */
export interface FeatureFlag {
  name: string;
  description: string;
  defaultValue: boolean;
  /** Capability required to use this feature */
  requiredCapability?: string;
}

/**
 * Feature flags for SDK behavior.
 */
export const SDK_FEATURE_FLAGS: Record<string, FeatureFlag> = {
  'structured.autoRetry': {
    name: 'structured.autoRetry',
    description: 'Automatically retry on validation failure',
    defaultValue: true,
  },
  'offline.backgroundSync': {
    name: 'offline.backgroundSync',
    description: 'Sync in background when online',
    defaultValue: true,
  },
  'telemetry.autoTrace': {
    name: 'telemetry.autoTrace',
    description: 'Automatically trace all operations',
    defaultValue: false,
    requiredCapability: 'analytics.telemetry',
  },
  'extensions.hotReload': {
    name: 'extensions.hotReload',
    description: 'Hot reload extensions in development',
    defaultValue: false,
  },
};

/**
 * FeatureFlagManager - Manage SDK feature flags.
 */
export class FeatureFlagManager {
  private flags: Map<string, boolean>;
  private registry?: CapabilityRegistry;

  constructor(registry?: CapabilityRegistry) {
    this.flags = new Map();
    this.registry = registry;

    // Initialize with defaults
    for (const [name, flag] of Object.entries(SDK_FEATURE_FLAGS)) {
      this.flags.set(name, flag.defaultValue);
    }
  }

  /** Get flag value */
  isEnabled(name: string): boolean {
    const flag = SDK_FEATURE_FLAGS[name];
    if (!flag) return false;

    // Check capability requirement
    if (flag.requiredCapability && this.registry && !this.registry.has(flag.requiredCapability)) {
      return false;
    }

    return this.flags.get(name) ?? flag.defaultValue;
  }

  /** Set flag value */
  setFlag(name: string, value: boolean): void {
    if (SDK_FEATURE_FLAGS[name]) {
      this.flags.set(name, value);
    }
  }

  /** Reset to defaults */
  reset(): void {
    for (const [name, flag] of Object.entries(SDK_FEATURE_FLAGS)) {
      this.flags.set(name, flag.defaultValue);
    }
  }

  /** Get all flags */
  getAll(): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    for (const name of Object.keys(SDK_FEATURE_FLAGS)) {
      result[name] = this.isEnabled(name);
    }
    return result;
  }
}

// ==================== Version Utils ====================

/**
 * Parse semantic version string.
 */
export function parseVersion(version: string): { major: number; minor: number; patch: number } {
  const [major, minor, patch] = version.replace(/^[>=<^~]+/, '').split('.').map(Number);
  return { major: major || 0, minor: minor || 0, patch: patch || 0 };
}

/**
 * Compare two versions.
 * Returns: -1 if a < b, 0 if a == b, 1 if a > b
 */
export function compareVersions(a: string, b: string): number {
  const va = parseVersion(a);
  const vb = parseVersion(b);

  if (va.major !== vb.major) return va.major > vb.major ? 1 : -1;
  if (va.minor !== vb.minor) return va.minor > vb.minor ? 1 : -1;
  if (va.patch !== vb.patch) return va.patch > vb.patch ? 1 : -1;

  return 0;
}

/**
 * Check if version satisfies requirement.
 */
export function satisfiesVersion(version: string, requirement: string): boolean {
  if (requirement.startsWith('>=')) {
    return compareVersions(version, requirement.slice(2)) >= 0;
  }
  if (requirement.startsWith('>')) {
    return compareVersions(version, requirement.slice(1)) > 0;
  }
  if (requirement.startsWith('<=')) {
    return compareVersions(version, requirement.slice(2)) <= 0;
  }
  if (requirement.startsWith('<')) {
    return compareVersions(version, requirement.slice(1)) < 0;
  }
  if (requirement.startsWith('^')) {
    // Compatible with (same major version)
    const vReq = parseVersion(requirement.slice(1));
    const vVer = parseVersion(version);
    return vVer.major === vReq.major && compareVersions(version, requirement.slice(1)) >= 0;
  }
  if (requirement.startsWith('~')) {
    // Approximately equivalent (same major.minor)
    const vReq = parseVersion(requirement.slice(1));
    const vVer = parseVersion(version);
    return vVer.major === vReq.major && vVer.minor === vReq.minor && compareVersions(version, requirement.slice(1)) >= 0;
  }

  // Exact match
  return compareVersions(version, requirement) === 0;
}

// ==================== Exports ====================

export { z } from 'zod';

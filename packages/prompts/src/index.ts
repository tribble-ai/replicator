import type { StorageAdapter } from '@tribble/sdk-offline';
import { MemoryStorage } from '@tribble/sdk-offline';
import { createRequestId } from '@tribble/sdk-core';

// ==================== Types ====================

export interface PromptVersion {
  /** Version identifier (e.g., 'v1', 'v2') */
  version: string;
  /** The prompt template */
  template: string;
  /** When this version was created */
  createdAt: number;
  /** Optional description of changes */
  description?: string;
  /** Optional metadata */
  metadata?: Record<string, any>;
}

export interface PromptDefinition {
  /** Unique name for this prompt */
  name: string;
  /** All versions of this prompt */
  versions: Record<string, PromptVersion>;
  /** Current active version */
  currentVersion: string;
  /** Tags for organization */
  tags?: string[];
  /** Optional description */
  description?: string;
}

export interface ExperimentConfig {
  /** Experiment identifier */
  id: string;
  /** Prompt name this experiment applies to */
  promptName: string;
  /** Control version */
  control: string;
  /** Treatment version(s) */
  treatments: string[];
  /** Traffic allocation (0-1 for each treatment) */
  allocation: Record<string, number>;
  /** Start timestamp */
  startedAt: number;
  /** End timestamp (optional) */
  endedAt?: number;
  /** Whether experiment is active */
  active: boolean;
}

export interface ExperimentAssignment {
  experimentId: string;
  variant: 'control' | string;
  version: string;
  assignedAt: number;
}

export interface PromptGetOptions {
  /** Variable substitutions */
  variables?: Record<string, any>;
  /** Specific version to use (overrides current) */
  version?: string;
  /** Experiment configuration */
  experiment?: {
    id: string;
    /** User/session identifier for consistent assignment */
    identifier: string;
  };
}

export interface PromptResult {
  /** The rendered prompt */
  prompt: string;
  /** Version used */
  version: string;
  /** Experiment assignment if applicable */
  experiment?: ExperimentAssignment;
}

// ==================== Prompt Registry ====================

export interface PromptRegistryOptions {
  /** Storage adapter for persistence */
  storage?: StorageAdapter;
  /** Remote endpoint for prompt syncing */
  remoteEndpoint?: string;
  /** Auth token for remote sync */
  authToken?: string;
}

/**
 * Registry for managing prompt templates with versioning and A/B testing.
 *
 * @example
 * ```typescript
 * const registry = new PromptRegistry();
 *
 * // Register a prompt with versions
 * registry.register('visit-prep', {
 *   v1: 'Generate a visit prep brief for store {{storeId}}',
 *   v2: 'You are a field sales AI. Create a detailed visit prep for {{storeId}}...',
 * }, { current: 'v2' });
 *
 * // Get prompt with variable substitution
 * const { prompt } = registry.get('visit-prep', { variables: { storeId: 'STORE-123' } });
 *
 * // A/B test prompts
 * const { prompt, experiment } = registry.get('visit-prep', {
 *   variables: { storeId: 'STORE-123' },
 *   experiment: { id: 'visit-prep-v3-test', identifier: userId },
 * });
 * ```
 */
export class PromptRegistry {
  private readonly storage: StorageAdapter;
  private readonly remoteEndpoint?: string;
  private readonly authToken?: string;
  private prompts = new Map<string, PromptDefinition>();
  private experiments = new Map<string, ExperimentConfig>();
  private assignments = new Map<string, ExperimentAssignment>();

  constructor(opts: PromptRegistryOptions = {}) {
    this.storage = opts.storage || new MemoryStorage();
    this.remoteEndpoint = opts.remoteEndpoint;
    this.authToken = opts.authToken;
  }

  /**
   * Register a new prompt or update existing versions.
   */
  register(
    name: string,
    versions: Record<string, string>,
    opts: { current?: string; description?: string; tags?: string[] } = {}
  ): void {
    const existing = this.prompts.get(name);
    const now = Date.now();

    const versionEntries: Record<string, PromptVersion> = {};
    for (const [version, template] of Object.entries(versions)) {
      versionEntries[version] = {
        version,
        template,
        createdAt: existing?.versions[version]?.createdAt || now,
      };
    }

    const definition: PromptDefinition = {
      name,
      versions: { ...(existing?.versions || {}), ...versionEntries },
      currentVersion: opts.current || existing?.currentVersion || Object.keys(versions)[0],
      description: opts.description || existing?.description,
      tags: opts.tags || existing?.tags,
    };

    this.prompts.set(name, definition);
  }

  /**
   * Get a prompt with optional variable substitution and A/B testing.
   */
  get(name: string, opts: PromptGetOptions = {}): PromptResult {
    const definition = this.prompts.get(name);
    if (!definition) {
      throw new Error(`Prompt not found: ${name}`);
    }

    // Determine which version to use
    let version = opts.version || definition.currentVersion;
    let experimentAssignment: ExperimentAssignment | undefined;

    // Check for experiment
    if (opts.experiment) {
      const assignment = this.getExperimentAssignment(
        opts.experiment.id,
        opts.experiment.identifier,
        name
      );
      if (assignment) {
        version = assignment.version;
        experimentAssignment = assignment;
      }
    }

    const promptVersion = definition.versions[version];
    if (!promptVersion) {
      throw new Error(`Version not found: ${name}@${version}`);
    }

    // Render template with variables
    let prompt = promptVersion.template;
    if (opts.variables) {
      prompt = this.renderTemplate(prompt, opts.variables);
    }

    return {
      prompt,
      version,
      experiment: experimentAssignment,
    };
  }

  /**
   * Check if a prompt exists.
   */
  has(name: string): boolean {
    return this.prompts.has(name);
  }

  /**
   * List all registered prompts.
   */
  list(): PromptDefinition[] {
    return Array.from(this.prompts.values());
  }

  /**
   * Get a specific prompt definition.
   */
  getDefinition(name: string): PromptDefinition | undefined {
    return this.prompts.get(name);
  }

  /**
   * Set the current version for a prompt.
   */
  setCurrentVersion(name: string, version: string): void {
    const definition = this.prompts.get(name);
    if (!definition) {
      throw new Error(`Prompt not found: ${name}`);
    }
    if (!definition.versions[version]) {
      throw new Error(`Version not found: ${name}@${version}`);
    }
    definition.currentVersion = version;
  }

  /**
   * Remove a prompt.
   */
  remove(name: string): boolean {
    return this.prompts.delete(name);
  }

  /**
   * Remove a specific version.
   */
  removeVersion(name: string, version: string): boolean {
    const definition = this.prompts.get(name);
    if (!definition || !definition.versions[version]) {
      return false;
    }

    delete definition.versions[version];

    // Update current version if needed
    if (definition.currentVersion === version) {
      const versions = Object.keys(definition.versions);
      definition.currentVersion = versions[versions.length - 1] || '';
    }

    return true;
  }

  // ==================== Experiments ====================

  /**
   * Create a new A/B test experiment.
   */
  createExperiment(config: Omit<ExperimentConfig, 'startedAt' | 'active'>): ExperimentConfig {
    const experiment: ExperimentConfig = {
      ...config,
      startedAt: Date.now(),
      active: true,
    };

    // Validate prompt exists
    const prompt = this.prompts.get(config.promptName);
    if (!prompt) {
      throw new Error(`Prompt not found: ${config.promptName}`);
    }

    // Validate versions exist
    if (!prompt.versions[config.control]) {
      throw new Error(`Control version not found: ${config.control}`);
    }
    for (const treatment of config.treatments) {
      if (!prompt.versions[treatment]) {
        throw new Error(`Treatment version not found: ${treatment}`);
      }
    }

    // Validate allocation sums to <= 1
    const totalAllocation = Object.values(config.allocation).reduce((a, b) => a + b, 0);
    if (totalAllocation > 1) {
      throw new Error('Total allocation cannot exceed 1');
    }

    this.experiments.set(config.id, experiment);
    return experiment;
  }

  /**
   * Get experiment assignment for a user.
   */
  private getExperimentAssignment(
    experimentId: string,
    identifier: string,
    promptName: string
  ): ExperimentAssignment | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || !experiment.active || experiment.promptName !== promptName) {
      return null;
    }

    // Check for existing assignment
    const assignmentKey = `${experimentId}:${identifier}`;
    const existing = this.assignments.get(assignmentKey);
    if (existing) {
      return existing;
    }

    // Deterministic assignment based on identifier hash
    const hash = this.hashString(assignmentKey);
    const bucket = hash % 100 / 100;

    let cumulative = 0;
    let assignedVersion = experiment.control;
    let variant: string = 'control';

    for (const [version, allocation] of Object.entries(experiment.allocation)) {
      cumulative += allocation;
      if (bucket < cumulative) {
        assignedVersion = version;
        variant = version === experiment.control ? 'control' : version;
        break;
      }
    }

    const assignment: ExperimentAssignment = {
      experimentId,
      variant,
      version: assignedVersion,
      assignedAt: Date.now(),
    };

    this.assignments.set(assignmentKey, assignment);
    return assignment;
  }

  /**
   * Stop an experiment.
   */
  stopExperiment(experimentId: string): void {
    const experiment = this.experiments.get(experimentId);
    if (experiment) {
      experiment.active = false;
      experiment.endedAt = Date.now();
    }
  }

  /**
   * Get experiment results (assignment counts).
   */
  getExperimentResults(experimentId: string): Record<string, number> {
    const results: Record<string, number> = {};

    for (const [key, assignment] of this.assignments.entries()) {
      if (assignment.experimentId === experimentId) {
        results[assignment.variant] = (results[assignment.variant] || 0) + 1;
      }
    }

    return results;
  }

  /**
   * List all experiments.
   */
  listExperiments(): ExperimentConfig[] {
    return Array.from(this.experiments.values());
  }

  // ==================== Persistence ====================

  /**
   * Save registry to storage.
   */
  async save(): Promise<void> {
    await this.storage.set('prompts:registry', {
      prompts: Object.fromEntries(this.prompts),
      experiments: Object.fromEntries(this.experiments),
      assignments: Object.fromEntries(this.assignments),
    });
  }

  /**
   * Load registry from storage.
   */
  async load(): Promise<void> {
    const data = await this.storage.get<{
      prompts: Record<string, PromptDefinition>;
      experiments: Record<string, ExperimentConfig>;
      assignments: Record<string, ExperimentAssignment>;
    }>('prompts:registry');

    if (data) {
      this.prompts = new Map(Object.entries(data.prompts || {}));
      this.experiments = new Map(Object.entries(data.experiments || {}));
      this.assignments = new Map(Object.entries(data.assignments || {}));
    }
  }

  /**
   * Sync prompts from remote endpoint.
   */
  async sync(): Promise<{ added: number; updated: number }> {
    if (!this.remoteEndpoint) {
      throw new Error('No remote endpoint configured');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const response = await fetch(this.remoteEndpoint, { headers });
    if (!response.ok) {
      throw new Error(`Failed to sync prompts: ${response.status}`);
    }

    const remote = await response.json() as {
      prompts: Array<{
        name: string;
        versions: Record<string, string>;
        current: string;
        description?: string;
        tags?: string[];
      }>;
    };

    let added = 0;
    let updated = 0;

    for (const prompt of remote.prompts || []) {
      const existing = this.prompts.has(prompt.name);
      this.register(prompt.name, prompt.versions, {
        current: prompt.current,
        description: prompt.description,
        tags: prompt.tags,
      });

      if (existing) {
        updated++;
      } else {
        added++;
      }
    }

    await this.save();
    return { added, updated };
  }

  // ==================== Template Rendering ====================

  /**
   * Render a template with variable substitution.
   * Supports {{variable}} and {{variable | default}} syntax.
   */
  private renderTemplate(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, expr) => {
      const [name, defaultValue] = expr.split('|').map((s: string) => s.trim());

      const value = this.getNestedValue(variables, name);
      if (value !== undefined && value !== null) {
        return String(value);
      }

      if (defaultValue !== undefined) {
        return defaultValue;
      }

      return match; // Keep original if no value or default
    });
  }

  /**
   * Get a nested value from an object using dot notation.
   */
  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Simple string hash for deterministic assignment.
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // ==================== Utility Methods ====================

  /**
   * Export all prompts as JSON.
   */
  export(): { prompts: PromptDefinition[]; experiments: ExperimentConfig[] } {
    return {
      prompts: this.list(),
      experiments: this.listExperiments(),
    };
  }

  /**
   * Import prompts from JSON.
   */
  import(data: { prompts?: PromptDefinition[]; experiments?: ExperimentConfig[] }): void {
    for (const prompt of data.prompts || []) {
      const versions: Record<string, string> = {};
      for (const [version, def] of Object.entries(prompt.versions)) {
        versions[version] = def.template;
      }
      this.register(prompt.name, versions, {
        current: prompt.currentVersion,
        description: prompt.description,
        tags: prompt.tags,
      });
    }

    for (const experiment of data.experiments || []) {
      this.experiments.set(experiment.id, experiment);
    }
  }

  /**
   * Clear all prompts and experiments.
   */
  clear(): void {
    this.prompts.clear();
    this.experiments.clear();
    this.assignments.clear();
  }
}

// ==================== Prompt Builder ====================

/**
 * Fluent builder for constructing complex prompts.
 *
 * @example
 * ```typescript
 * const prompt = new PromptBuilder()
 *   .system('You are a helpful assistant.')
 *   .context({ userName: 'John', role: 'Admin' })
 *   .instruction('Answer the following question:')
 *   .user('What is the meaning of life?')
 *   .format('JSON')
 *   .build();
 * ```
 */
export class PromptBuilder {
  private parts: string[] = [];
  private contextData: Record<string, any> = {};
  private formatHint?: string;

  /**
   * Add a system prompt section.
   */
  system(content: string): this {
    this.parts.push(`System: ${content}`);
    return this;
  }

  /**
   * Add context data.
   */
  context(data: Record<string, any>): this {
    this.contextData = { ...this.contextData, ...data };
    return this;
  }

  /**
   * Add an instruction.
   */
  instruction(content: string): this {
    this.parts.push(`Instructions: ${content}`);
    return this;
  }

  /**
   * Add the user's message/query.
   */
  user(content: string): this {
    this.parts.push(`User: ${content}`);
    return this;
  }

  /**
   * Add example input/output.
   */
  example(input: string, output: string): this {
    this.parts.push(`Example:\nInput: ${input}\nOutput: ${output}`);
    return this;
  }

  /**
   * Add multiple examples.
   */
  examples(examples: Array<{ input: string; output: string }>): this {
    for (const ex of examples) {
      this.example(ex.input, ex.output);
    }
    return this;
  }

  /**
   * Specify output format.
   */
  format(format: 'JSON' | 'Markdown' | 'Plain' | string): this {
    this.formatHint = format;
    return this;
  }

  /**
   * Add custom section.
   */
  section(title: string, content: string): this {
    this.parts.push(`${title}:\n${content}`);
    return this;
  }

  /**
   * Add raw text.
   */
  raw(content: string): this {
    this.parts.push(content);
    return this;
  }

  /**
   * Build the final prompt.
   */
  build(): string {
    const sections: string[] = [];

    // Add parts
    sections.push(...this.parts);

    // Add context if present
    if (Object.keys(this.contextData).length > 0) {
      sections.push(`Context:\n${JSON.stringify(this.contextData, null, 2)}`);
    }

    // Add format hint if present
    if (this.formatHint) {
      if (this.formatHint === 'JSON') {
        sections.push('Respond with valid JSON only. Do not include any text before or after the JSON.');
      } else if (this.formatHint === 'Markdown') {
        sections.push('Format your response using Markdown.');
      } else {
        sections.push(`Output format: ${this.formatHint}`);
      }
    }

    return sections.join('\n\n');
  }

  /**
   * Reset the builder.
   */
  reset(): this {
    this.parts = [];
    this.contextData = {};
    this.formatHint = undefined;
    return this;
  }
}

// ==================== Factory Functions ====================

/**
 * Create a new prompt registry.
 */
export function createPromptRegistry(opts?: PromptRegistryOptions): PromptRegistry {
  return new PromptRegistry(opts);
}

/**
 * Create a new prompt builder.
 */
export function createPromptBuilder(): PromptBuilder {
  return new PromptBuilder();
}

// ==================== Common Prompt Templates ====================

export const CommonPrompts = {
  /** JSON extraction prompt */
  jsonExtraction: (schema: string) => `
Extract the following information from the provided text and return as valid JSON.

Expected JSON structure:
${schema}

Text to analyze:
{{text}}

Respond with valid JSON only.
`,

  /** Summarization prompt */
  summarize: (style: 'brief' | 'detailed' | 'bullet' = 'brief') => `
Summarize the following content in a ${style === 'bullet' ? 'bullet point format' : style === 'detailed' ? 'detailed manner' : 'concise manner'}.

Content:
{{content}}

${style === 'bullet' ? 'Use bullet points for each key point.' : ''}
`,

  /** Q&A prompt */
  qa: `
Answer the following question based on the provided context.

Context:
{{context}}

Question: {{question}}

If the answer cannot be determined from the context, say "I cannot determine this from the provided information."
`,

  /** Classification prompt */
  classify: (categories: string[]) => `
Classify the following text into one of these categories: ${categories.join(', ')}

Text: {{text}}

Respond with JSON:
{
  "category": "<selected category>",
  "confidence": <0-1>,
  "reasoning": "<brief explanation>"
}
`,

  /** Translation prompt */
  translate: `
Translate the following text to {{targetLanguage}}.

Original text:
{{text}}

Translation:
`,
};

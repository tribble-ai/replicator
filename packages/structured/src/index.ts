import { z, ZodSchema, ZodError } from 'zod';
import type { AgentClient, ChatOptions } from '@tribble/sdk-agent';

// ==================== Types ====================

export interface StructuredOptions<T extends ZodSchema> {
  /** The prompt to send to the agent */
  prompt: string;
  /** Zod schema that defines the expected response structure */
  schema: T;
  /** Number of retries if output doesn't validate (default: 3) */
  retries?: number;
  /** Behavior when validation fails after all retries */
  fallback?: 'throw' | 'partial' | 'raw';
  /** Conversation ID for multi-turn conversations */
  conversationId?: string;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
  /** Custom system prompt to guide JSON output */
  systemPrompt?: string;
  /** Temperature for response (if supported by backend) */
  temperature?: number;
}

export interface StructuredResult<T> {
  /** The validated, typed data */
  data: T;
  /** Raw response from the agent */
  raw: string;
  /** Number of attempts it took to get valid output */
  attempts: number;
  /** Conversation ID for follow-up */
  conversationId: string;
  /** Validation errors from failed attempts (if any) */
  validationHistory?: Array<{
    attempt: number;
    error: string;
    raw: string;
  }>;
}

export interface PartialResult<T> {
  /** Partially validated data (may have undefined fields) */
  data: Partial<T>;
  /** Fields that failed validation */
  errors: Array<{ path: string; message: string }>;
  /** Raw response from the agent */
  raw: string;
  /** Whether the result is complete */
  complete: false;
}

export type StructuredOutput<T> = StructuredResult<T> | PartialResult<T>;

// ==================== StructuredAgent Class ====================

/**
 * Wraps an AgentClient to provide structured output with Zod validation.
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import { StructuredAgent } from '@tribble/sdk-structured';
 *
 * const structured = new StructuredAgent(agentClient);
 *
 * const TaskSchema = z.object({
 *   title: z.string(),
 *   priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
 *   dueDate: z.string().optional(),
 * });
 *
 * const result = await structured.generate({
 *   prompt: 'Create a task for reviewing Q4 sales',
 *   schema: TaskSchema,
 * });
 *
 * console.log(result.data.priority); // Type-safe access
 * ```
 */
export class StructuredAgent {
  private readonly agent: AgentClient;

  constructor(agent: AgentClient) {
    this.agent = agent;
  }

  /**
   * Generate a structured response that conforms to the provided Zod schema.
   * Automatically retries if the LLM output doesn't validate.
   */
  async generate<T extends ZodSchema>(
    opts: StructuredOptions<T>
  ): Promise<StructuredResult<z.infer<T>>> {
    const maxRetries = opts.retries ?? 3;
    const fallback = opts.fallback ?? 'throw';
    const validationHistory: Array<{ attempt: number; error: string; raw: string }> = [];

    let lastRaw = '';
    let lastError: ZodError | null = null;
    let conversationId = opts.conversationId;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      // Build the prompt with JSON instructions
      const prompt = this.buildPrompt(opts.prompt, opts.schema, attempt, lastError, opts.systemPrompt);

      // Call the agent
      const response = await this.agent.chat({
        message: prompt,
        conversationId,
        signal: opts.signal,
      });

      conversationId = response.conversationId;
      lastRaw = response.message;

      // Try to extract and parse JSON
      try {
        const json = this.extractJSON(response.message);
        const parsed = opts.schema.parse(json);

        return {
          data: parsed,
          raw: response.message,
          attempts: attempt,
          conversationId,
          validationHistory: validationHistory.length > 0 ? validationHistory : undefined,
        };
      } catch (e) {
        if (e instanceof ZodError) {
          lastError = e;
          validationHistory.push({
            attempt,
            error: this.formatZodError(e),
            raw: response.message,
          });
        } else if (e instanceof Error) {
          validationHistory.push({
            attempt,
            error: e.message,
            raw: response.message,
          });
        }
      }
    }

    // All retries exhausted
    if (fallback === 'partial') {
      return this.buildPartialResult(lastRaw, opts.schema, conversationId!, maxRetries, validationHistory);
    }

    if (fallback === 'raw') {
      // Return whatever we can parse, even if it doesn't match schema
      try {
        const json = this.extractJSON(lastRaw);
        return {
          data: json as z.infer<T>,
          raw: lastRaw,
          attempts: maxRetries,
          conversationId: conversationId!,
          validationHistory,
        };
      } catch {
        // Fall through to throw
      }
    }

    // Default: throw
    const errorMessages = validationHistory.map(v => `Attempt ${v.attempt}: ${v.error}`).join('\n');
    throw new StructuredOutputError(
      `Failed to generate valid structured output after ${maxRetries} attempts:\n${errorMessages}`,
      { validationHistory, lastRaw }
    );
  }

  /**
   * Stream a structured response, yielding partial results as they arrive.
   * Final yield will be the complete validated result.
   */
  async *stream<T extends ZodSchema>(
    opts: StructuredOptions<T>
  ): AsyncGenerator<{ partial: string; complete: false } | StructuredResult<z.infer<T>>, void, void> {
    const prompt = this.buildPrompt(opts.prompt, opts.schema, 1, null, opts.systemPrompt);
    let accumulated = '';

    for await (const chunk of this.agent.stream({
      message: prompt,
      conversationId: opts.conversationId,
      signal: opts.signal,
    })) {
      accumulated += chunk.delta;
      yield { partial: accumulated, complete: false };
    }

    // Try to validate final result
    try {
      const json = this.extractJSON(accumulated);
      const parsed = opts.schema.parse(json);
      yield {
        data: parsed,
        raw: accumulated,
        attempts: 1,
        conversationId: opts.conversationId || '',
      };
    } catch (e) {
      // If streaming fails validation, fall back to non-streaming with retries
      const result = await this.generate(opts);
      yield result;
    }
  }

  /**
   * Validate an existing string against a schema without calling the agent.
   */
  validate<T extends ZodSchema>(
    input: string,
    schema: T
  ): { success: true; data: z.infer<T> } | { success: false; errors: Array<{ path: string; message: string }> } {
    try {
      const json = this.extractJSON(input);
      const parsed = schema.parse(json);
      return { success: true, data: parsed };
    } catch (e) {
      if (e instanceof ZodError) {
        return {
          success: false,
          errors: e.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        };
      }
      return {
        success: false,
        errors: [{ path: '_root', message: e instanceof Error ? e.message : 'Unknown error' }],
      };
    }
  }

  // ==================== Private Methods ====================

  private buildPrompt(
    userPrompt: string,
    schema: ZodSchema,
    attempt: number,
    lastError: ZodError | null,
    customSystemPrompt?: string
  ): string {
    const schemaDescription = this.describeSchema(schema);

    let prompt = customSystemPrompt || '';
    prompt += `\n\n${userPrompt}\n\n`;
    prompt += `IMPORTANT: Respond with ONLY a valid JSON object matching this exact structure:\n`;
    prompt += '```json\n';
    prompt += schemaDescription;
    prompt += '\n```\n\n';
    prompt += 'Do not include any text before or after the JSON. Do not wrap in markdown code blocks in your response.';

    if (attempt > 1 && lastError) {
      prompt += `\n\nYour previous response had validation errors:\n${this.formatZodError(lastError)}`;
      prompt += '\nPlease fix these errors and provide a valid JSON response.';
    }

    return prompt;
  }

  private describeSchema(schema: ZodSchema): string {
    // Generate a JSON example from the schema
    const example = this.generateExample(schema);
    return JSON.stringify(example, null, 2);
  }

  private generateExample(schema: ZodSchema): any {
    // Access internal Zod type via type assertion (not part of public API)
    const def = schema._def as { typeName?: string };
    const typeName = def.typeName;

    if (typeName === 'ZodObject') {
      const shape = (schema as z.ZodObject<any>).shape;
      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(shape)) {
        result[key] = this.generateExample(value as ZodSchema);
      }
      return result;
    }

    if (typeName === 'ZodArray') {
      const innerSchema = (schema as z.ZodArray<any>).element;
      return [this.generateExample(innerSchema)];
    }

    if (typeName === 'ZodString') {
      return '<string>';
    }

    if (typeName === 'ZodNumber') {
      return '<number>';
    }

    if (typeName === 'ZodBoolean') {
      return '<boolean>';
    }

    if (typeName === 'ZodEnum') {
      const values = (schema as z.ZodEnum<any>).options;
      return `<${values.join('|')}>`;
    }

    if (typeName === 'ZodOptional') {
      const inner = (schema as z.ZodOptional<any>).unwrap();
      return `${this.generateExample(inner)} (optional)`;
    }

    if (typeName === 'ZodNullable') {
      const inner = (schema as z.ZodNullable<any>).unwrap();
      return `${this.generateExample(inner)} | null`;
    }

    if (typeName === 'ZodUnion') {
      const options = (schema as z.ZodUnion<any>).options;
      return options.map((o: ZodSchema) => this.generateExample(o)).join(' | ');
    }

    if (typeName === 'ZodLiteral') {
      return (schema as z.ZodLiteral<any>).value;
    }

    if (typeName === 'ZodRecord') {
      return { '<key>': '<value>' };
    }

    if (typeName === 'ZodDate') {
      return '<ISO date string>';
    }

    return '<any>';
  }

  private extractJSON(text: string): any {
    // Try to parse the entire response as JSON first
    try {
      return JSON.parse(text.trim());
    } catch {
      // Continue to extraction
    }

    // Try to find JSON in code blocks
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1].trim());
      } catch {
        // Continue
      }
    }

    // Try to find the first JSON object or array
    const jsonMatch = text.match(/[\[{][\s\S]*[\]}]/);
    if (jsonMatch) {
      // Try progressively smaller substrings
      const candidate = jsonMatch[0];
      for (let end = candidate.length; end > 0; end--) {
        try {
          return JSON.parse(candidate.slice(0, end));
        } catch {
          // Continue
        }
      }
    }

    throw new Error('No valid JSON found in response');
  }

  private formatZodError(error: ZodError): string {
    return error.errors
      .map(e => `- ${e.path.join('.')}: ${e.message}`)
      .join('\n');
  }

  private buildPartialResult<T extends ZodSchema>(
    raw: string,
    schema: T,
    conversationId: string,
    attempts: number,
    validationHistory: Array<{ attempt: number; error: string; raw: string }>
  ): StructuredResult<z.infer<T>> {
    try {
      const json = this.extractJSON(raw);
      // Use safeParse to get what we can
      const result = schema.safeParse(json);

      if (result.success) {
        return {
          data: result.data,
          raw,
          attempts,
          conversationId,
          validationHistory,
        };
      }

      // Return partial data with defaults for missing fields
      return {
        data: json as z.infer<T>,
        raw,
        attempts,
        conversationId,
        validationHistory,
      };
    } catch {
      return {
        data: {} as z.infer<T>,
        raw,
        attempts,
        conversationId,
        validationHistory,
      };
    }
  }
}

// ==================== Error Classes ====================

export class StructuredOutputError extends Error {
  readonly validationHistory: Array<{ attempt: number; error: string; raw: string }>;
  readonly lastRaw: string;

  constructor(
    message: string,
    opts: { validationHistory: Array<{ attempt: number; error: string; raw: string }>; lastRaw: string }
  ) {
    super(message);
    this.name = 'StructuredOutputError';
    this.validationHistory = opts.validationHistory;
    this.lastRaw = opts.lastRaw;
  }
}

// ==================== Helper Functions ====================

/**
 * Create a structured agent from an AgentClient.
 */
export function createStructuredAgent(agent: AgentClient): StructuredAgent {
  return new StructuredAgent(agent);
}

/**
 * Common schemas for typical use cases.
 */
export const CommonSchemas = {
  /** Schema for a list of action items */
  ActionItems: z.object({
    items: z.array(z.object({
      action: z.string(),
      priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
      assignee: z.string().optional(),
      dueDate: z.string().optional(),
    })),
  }),

  /** Schema for a summary with key points */
  Summary: z.object({
    title: z.string(),
    summary: z.string(),
    keyPoints: z.array(z.string()),
    sentiment: z.enum(['POSITIVE', 'NEUTRAL', 'NEGATIVE']).optional(),
  }),

  /** Schema for entity extraction */
  Entities: z.object({
    people: z.array(z.object({
      name: z.string(),
      role: z.string().optional(),
    })),
    organizations: z.array(z.object({
      name: z.string(),
      type: z.string().optional(),
    })),
    locations: z.array(z.string()),
    dates: z.array(z.string()),
  }),

  /** Schema for Q&A responses */
  QAResponse: z.object({
    answer: z.string(),
    confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
    sources: z.array(z.object({
      title: z.string(),
      relevance: z.string(),
    })).optional(),
    followUpQuestions: z.array(z.string()).optional(),
  }),

  /** Schema for classification */
  Classification: z.object({
    category: z.string(),
    confidence: z.number().min(0).max(1),
    reasoning: z.string(),
    alternativeCategories: z.array(z.object({
      category: z.string(),
      confidence: z.number(),
    })).optional(),
  }),
};

// Re-export zod for convenience
export { z, ZodSchema, ZodError } from 'zod';

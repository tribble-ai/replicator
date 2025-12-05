import type { AgentClient, ChatResult, StreamToken } from '@tribble/sdk-agent';
import type { StorageAdapter } from '@tribble/sdk-offline';
import { MemoryStorage } from '@tribble/sdk-offline';
import { createRequestId } from '@tribble/sdk-core';

// ==================== Types ====================

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface ConversationOptions {
  /** Unique identifier for this conversation */
  id?: string;
  /** System prompt to set context */
  systemPrompt?: string;
  /** Context data injected into prompts */
  context?: Record<string, any>;
  /** Storage adapter for persistence */
  storage?: StorageAdapter;
  /** Maximum tokens before auto-summarization */
  maxTokens?: number;
  /** Persistence mode */
  persistence?: 'memory' | 'session' | 'permanent';
  /** Custom metadata for this conversation */
  metadata?: Record<string, any>;
}

export interface SendOptions {
  /** Additional context for this message only */
  context?: Record<string, any>;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
  /** Message metadata */
  metadata?: Record<string, any>;
}

export interface ConversationState {
  id: string;
  messages: Message[];
  systemPrompt?: string;
  context: Record<string, any>;
  metadata: Record<string, any>;
  createdAt: number;
  updatedAt: number;
  tokenEstimate: number;
}

export interface ConversationSummary {
  id: string;
  summary: string;
  keyTopics: string[];
  messageCount: number;
  createdAt: number;
  updatedAt: number;
}

// ==================== Conversation Class ====================

/**
 * Manages a single conversation with context, history, and auto-summarization.
 *
 * @example
 * ```typescript
 * const conversation = new Conversation(agent, {
 *   id: 'user:123:session:456',
 *   systemPrompt: 'You are a helpful assistant.',
 *   context: { userName: 'John', role: 'Admin' },
 * });
 *
 * const response = await conversation.send('What can you help me with?');
 * console.log(response.message);
 *
 * // Continue the conversation - context is maintained
 * const followUp = await conversation.send('Tell me more about the first option.');
 * ```
 */
export class Conversation {
  readonly id: string;
  private readonly agent: AgentClient;
  private readonly storage: StorageAdapter;
  private readonly maxTokens: number;
  private readonly persistence: 'memory' | 'session' | 'permanent';

  private state: ConversationState;
  private serverConversationId?: string;
  private loaded = false;

  constructor(agent: AgentClient, opts: ConversationOptions = {}) {
    this.agent = agent;
    this.id = opts.id || createRequestId();
    this.storage = opts.storage || new MemoryStorage();
    this.maxTokens = opts.maxTokens || 8000;
    this.persistence = opts.persistence || 'memory';

    this.state = {
      id: this.id,
      messages: [],
      systemPrompt: opts.systemPrompt,
      context: opts.context || {},
      metadata: opts.metadata || {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tokenEstimate: 0,
    };
  }

  /**
   * Load conversation state from storage.
   */
  async load(): Promise<void> {
    if (this.persistence === 'memory' || this.loaded) return;

    const key = this.storageKey();
    const saved = await this.storage.get<ConversationState>(key);

    if (saved) {
      this.state = saved;
    }

    this.loaded = true;
  }

  /**
   * Save conversation state to storage.
   */
  async save(): Promise<void> {
    if (this.persistence === 'memory') return;

    const key = this.storageKey();
    this.state.updatedAt = Date.now();
    await this.storage.set(key, this.state);
  }

  private storageKey(): string {
    return `conversation:${this.id}`;
  }

  /**
   * Send a message and get a response.
   */
  async send(message: string, opts: SendOptions = {}): Promise<ChatResult & { history: Message[] }> {
    await this.load();

    // Create user message
    const userMessage: Message = {
      id: createRequestId(),
      role: 'user',
      content: message,
      timestamp: Date.now(),
      metadata: opts.metadata,
    };

    this.state.messages.push(userMessage);

    // Build the full prompt with context
    const prompt = this.buildPrompt(message, opts.context);

    // Check if we need to summarize
    if (this.shouldSummarize()) {
      await this.summarizeHistory();
    }

    // Send to agent
    const response = await this.agent.chat({
      message: prompt,
      conversationId: this.serverConversationId,
      signal: opts.signal,
    });

    this.serverConversationId = response.conversationId;

    // Create assistant message
    const assistantMessage: Message = {
      id: createRequestId(),
      role: 'assistant',
      content: response.message,
      timestamp: Date.now(),
    };

    this.state.messages.push(assistantMessage);
    this.state.tokenEstimate += this.estimateTokens(message + response.message);

    await this.save();

    return {
      ...response,
      history: [...this.state.messages],
    };
  }

  /**
   * Stream a response.
   */
  async *stream(message: string, opts: SendOptions = {}): AsyncGenerator<StreamToken | { complete: true; history: Message[] }, void, void> {
    await this.load();

    // Create user message
    const userMessage: Message = {
      id: createRequestId(),
      role: 'user',
      content: message,
      timestamp: Date.now(),
      metadata: opts.metadata,
    };

    this.state.messages.push(userMessage);

    // Build the full prompt with context
    const prompt = this.buildPrompt(message, opts.context);

    // Check if we need to summarize
    if (this.shouldSummarize()) {
      await this.summarizeHistory();
    }

    // Stream from agent
    let fullResponse = '';
    for await (const chunk of this.agent.stream({
      message: prompt,
      conversationId: this.serverConversationId,
      signal: opts.signal,
    })) {
      fullResponse += chunk.delta;
      yield chunk;
    }

    // Create assistant message
    const assistantMessage: Message = {
      id: createRequestId(),
      role: 'assistant',
      content: fullResponse,
      timestamp: Date.now(),
    };

    this.state.messages.push(assistantMessage);
    this.state.tokenEstimate += this.estimateTokens(message + fullResponse);

    await this.save();

    yield { complete: true, history: [...this.state.messages] };
  }

  /**
   * Build the full prompt with system prompt and context.
   */
  private buildPrompt(userMessage: string, additionalContext?: Record<string, any>): string {
    const parts: string[] = [];

    // Add system prompt
    if (this.state.systemPrompt) {
      parts.push(`System: ${this.state.systemPrompt}`);
    }

    // Add context
    const fullContext = { ...this.state.context, ...additionalContext };
    if (Object.keys(fullContext).length > 0) {
      parts.push(`Context:\n${JSON.stringify(fullContext, null, 2)}`);
    }

    // Add conversation history (last N messages for context)
    const recentMessages = this.state.messages.slice(-10);
    if (recentMessages.length > 1) { // More than just the current user message
      const historyText = recentMessages
        .slice(0, -1) // Exclude the message we just added
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n\n');
      parts.push(`Conversation history:\n${historyText}`);
    }

    // Add current message
    parts.push(`User: ${userMessage}`);

    return parts.join('\n\n');
  }

  /**
   * Check if we should summarize history to stay under token limit.
   */
  private shouldSummarize(): boolean {
    return this.state.tokenEstimate > this.maxTokens * 0.8;
  }

  /**
   * Summarize conversation history to reduce token count.
   */
  private async summarizeHistory(): Promise<void> {
    if (this.state.messages.length < 4) return;

    // Keep only the last 2 messages, summarize the rest
    const toSummarize = this.state.messages.slice(0, -2);
    const toKeep = this.state.messages.slice(-2);

    const summaryPrompt = `Summarize this conversation concisely, preserving key information and context:

${toSummarize.map(m => `${m.role}: ${m.content}`).join('\n\n')}

Provide a brief summary that captures the main points discussed.`;

    const response = await this.agent.chat({
      message: summaryPrompt,
      conversationId: this.serverConversationId,
    });

    // Create a system message with the summary
    const summaryMessage: Message = {
      id: createRequestId(),
      role: 'system',
      content: `[Previous conversation summary: ${response.message}]`,
      timestamp: Date.now(),
      metadata: { isSummary: true },
    };

    // Replace history with summary + recent messages
    this.state.messages = [summaryMessage, ...toKeep];
    this.state.tokenEstimate = this.estimateTokens(
      this.state.messages.map(m => m.content).join('')
    );

    await this.save();
  }

  /**
   * Estimate token count (rough approximation).
   */
  private estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Get conversation history.
   */
  async getHistory(): Promise<Message[]> {
    await this.load();
    return [...this.state.messages];
  }

  /**
   * Clear conversation history.
   */
  async clear(): Promise<void> {
    this.state.messages = [];
    this.state.tokenEstimate = 0;
    this.serverConversationId = undefined;
    await this.save();
  }

  /**
   * Update conversation context.
   */
  async updateContext(context: Record<string, any>): Promise<void> {
    await this.load();
    this.state.context = { ...this.state.context, ...context };
    await this.save();
  }

  /**
   * Get a summary of this conversation.
   */
  async summarize(): Promise<ConversationSummary> {
    await this.load();

    if (this.state.messages.length === 0) {
      return {
        id: this.id,
        summary: 'No messages in conversation.',
        keyTopics: [],
        messageCount: 0,
        createdAt: this.state.createdAt,
        updatedAt: this.state.updatedAt,
      };
    }

    const prompt = `Analyze this conversation and provide:
1. A brief summary (2-3 sentences)
2. Key topics discussed (list of keywords)

Conversation:
${this.state.messages.map(m => `${m.role}: ${m.content}`).join('\n\n')}

Respond in JSON format:
{
  "summary": "...",
  "keyTopics": ["topic1", "topic2", ...]
}`;

    const response = await this.agent.chat({ message: prompt });

    try {
      const parsed = JSON.parse(response.message);
      return {
        id: this.id,
        summary: parsed.summary || 'Unable to generate summary.',
        keyTopics: parsed.keyTopics || [],
        messageCount: this.state.messages.length,
        createdAt: this.state.createdAt,
        updatedAt: this.state.updatedAt,
      };
    } catch {
      return {
        id: this.id,
        summary: response.message.slice(0, 200),
        keyTopics: [],
        messageCount: this.state.messages.length,
        createdAt: this.state.createdAt,
        updatedAt: this.state.updatedAt,
      };
    }
  }

  /**
   * Create a branch of this conversation for "what if" scenarios.
   */
  async branch(newId?: string): Promise<Conversation> {
    await this.load();

    const branchId = newId || `${this.id}:branch:${createRequestId().slice(0, 8)}`;
    const branch = new Conversation(this.agent, {
      id: branchId,
      systemPrompt: this.state.systemPrompt,
      context: { ...this.state.context },
      storage: this.storage,
      maxTokens: this.maxTokens,
      persistence: this.persistence,
      metadata: { ...this.state.metadata, branchedFrom: this.id },
    });

    // Copy messages
    branch.state.messages = [...this.state.messages];
    branch.state.tokenEstimate = this.state.tokenEstimate;
    branch.serverConversationId = undefined; // New server conversation

    await branch.save();
    return branch;
  }

  /**
   * Export conversation to a portable format.
   */
  async export(): Promise<ConversationState> {
    await this.load();
    return { ...this.state };
  }

  /**
   * Import conversation from a portable format.
   */
  async import(state: ConversationState): Promise<void> {
    this.state = { ...state, id: this.id };
    await this.save();
  }

  /**
   * Delete this conversation from storage.
   */
  async delete(): Promise<void> {
    if (this.persistence !== 'memory') {
      await this.storage.delete(this.storageKey());
    }
  }
}

// ==================== Conversation Manager ====================

/**
 * Manages multiple conversations for a user or application.
 */
export class ConversationManager {
  private readonly agent: AgentClient;
  private readonly storage: StorageAdapter;
  private readonly defaultOpts: Partial<ConversationOptions>;
  private conversations = new Map<string, Conversation>();

  constructor(
    agent: AgentClient,
    storage: StorageAdapter,
    defaultOpts: Partial<ConversationOptions> = {}
  ) {
    this.agent = agent;
    this.storage = storage;
    this.defaultOpts = defaultOpts;
  }

  /**
   * Create a new conversation.
   */
  create(opts: ConversationOptions = {}): Conversation {
    const conversation = new Conversation(this.agent, {
      ...this.defaultOpts,
      ...opts,
      storage: this.storage,
    });

    this.conversations.set(conversation.id, conversation);
    return conversation;
  }

  /**
   * Get an existing conversation by ID.
   */
  async get(id: string): Promise<Conversation | null> {
    // Check in-memory cache first
    if (this.conversations.has(id)) {
      return this.conversations.get(id)!;
    }

    // Try to load from storage
    const conversation = new Conversation(this.agent, {
      ...this.defaultOpts,
      id,
      storage: this.storage,
    });

    await conversation.load();

    // Check if conversation exists in storage
    const history = await conversation.getHistory();
    if (history.length === 0) {
      // Check if there's saved state
      const key = `conversation:${id}`;
      const exists = await this.storage.has(key);
      if (!exists) return null;
    }

    this.conversations.set(id, conversation);
    return conversation;
  }

  /**
   * Get or create a conversation.
   */
  async getOrCreate(id: string, opts: ConversationOptions = {}): Promise<Conversation> {
    const existing = await this.get(id);
    if (existing) return existing;

    return this.create({ ...opts, id });
  }

  /**
   * List all conversation IDs.
   */
  async list(): Promise<string[]> {
    const keys = await this.storage.keys('conversation:');
    return keys.map(k => k.replace('conversation:', ''));
  }

  /**
   * Delete a conversation.
   */
  async delete(id: string): Promise<void> {
    const conversation = await this.get(id);
    if (conversation) {
      await conversation.delete();
      this.conversations.delete(id);
    }
  }

  /**
   * Get summaries of all conversations.
   */
  async listSummaries(): Promise<ConversationSummary[]> {
    const ids = await this.list();
    const summaries: ConversationSummary[] = [];

    for (const id of ids) {
      const conversation = await this.get(id);
      if (conversation) {
        summaries.push(await conversation.summarize());
      }
    }

    return summaries.sort((a, b) => b.updatedAt - a.updatedAt);
  }
}

// ==================== Factory Functions ====================

/**
 * Create a conversation manager.
 */
export function createConversationManager(
  agent: AgentClient,
  storage?: StorageAdapter,
  defaultOpts?: Partial<ConversationOptions>
): ConversationManager {
  return new ConversationManager(
    agent,
    storage || new MemoryStorage(),
    defaultOpts
  );
}

/**
 * Create a single conversation.
 */
export function createConversation(
  agent: AgentClient,
  opts?: ConversationOptions
): Conversation {
  return new Conversation(agent, opts);
}

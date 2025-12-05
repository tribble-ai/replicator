import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import type { AgentClient, StreamToken } from '@tribble/sdk-agent';
import type { Conversation, Message } from '@tribble/sdk-conversations';
import type { StorageAdapter, CacheManager, CacheOptions } from '@tribble/sdk-offline';
import { MemoryStorage, CacheManager as CacheMgr, parseDuration } from '@tribble/sdk-offline';
import { StructuredAgent, type StructuredOptions } from '@tribble/sdk-structured';
import type { ZodSchema } from 'zod';

// ==================== Context ====================

export interface TribbleContextValue {
  agent: AgentClient | null;
  storage: StorageAdapter;
  cache: CacheManager;
  structured: StructuredAgent | null;
}

const TribbleContext = createContext<TribbleContextValue | null>(null);

export interface TribbleProviderProps {
  agent: AgentClient;
  storage?: StorageAdapter;
  children: React.ReactNode;
}

/**
 * Provider component that makes Tribble SDK available to all child components.
 *
 * @example
 * ```tsx
 * import { TribbleProvider } from '@tribble/sdk-react';
 *
 * function App() {
 *   return (
 *     <TribbleProvider agent={agent}>
 *       <MyApp />
 *     </TribbleProvider>
 *   );
 * }
 * ```
 */
export function TribbleProvider({ agent, storage, children }: TribbleProviderProps): React.ReactElement {
  const storageInstance = useMemo(() => storage || new MemoryStorage(), [storage]);
  const cache = useMemo(() => new CacheMgr(storageInstance), [storageInstance]);
  const structured = useMemo(() => new StructuredAgent(agent), [agent]);

  const value: TribbleContextValue = {
    agent,
    storage: storageInstance,
    cache,
    structured,
  };

  return React.createElement(TribbleContext.Provider, { value }, children);
}

/**
 * Hook to access Tribble context.
 */
export function useTribble(): TribbleContextValue {
  const context = useContext(TribbleContext);
  if (!context) {
    throw new Error('useTribble must be used within a TribbleProvider');
  }
  return context;
}

// ==================== Hooks ====================

export interface UseChatOptions {
  /** Conversation ID for multi-turn chats */
  conversationId?: string;
  /** System prompt for context */
  systemPrompt?: string;
  /** Initial context data */
  context?: Record<string, any>;
  /** Callback when response is received */
  onResponse?: (message: string) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

export interface UseChatReturn {
  messages: Array<{ role: 'user' | 'assistant'; content: string; id: string }>;
  isLoading: boolean;
  error: Error | null;
  send: (message: string) => Promise<void>;
  clear: () => void;
  stop: () => void;
}

/**
 * Hook for chat functionality with streaming support.
 *
 * @example
 * ```tsx
 * function ChatComponent() {
 *   const { messages, isLoading, send } = useChat({
 *     conversationId: 'user-session-123',
 *   });
 *
 *   return (
 *     <div>
 *       {messages.map(m => (
 *         <div key={m.id}>{m.role}: {m.content}</div>
 *       ))}
 *       <input onKeyPress={e => e.key === 'Enter' && send(e.target.value)} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useChat(opts: UseChatOptions = {}): UseChatReturn {
  const { agent } = useTribble();
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; id: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const conversationIdRef = useRef<string | undefined>(opts.conversationId);

  const send = useCallback(async (message: string) => {
    if (!agent || !message.trim()) return;

    setIsLoading(true);
    setError(null);

    // Add user message
    const userMsgId = `user-${Date.now()}`;
    setMessages(prev => [...prev, { role: 'user', content: message, id: userMsgId }]);

    // Create abort controller
    abortRef.current = new AbortController();

    // Add placeholder for assistant message
    const assistantMsgId = `assistant-${Date.now()}`;
    setMessages(prev => [...prev, { role: 'assistant', content: '', id: assistantMsgId }]);

    try {
      let fullContent = '';

      // Build prompt with context
      let prompt = message;
      if (opts.systemPrompt) {
        prompt = `${opts.systemPrompt}\n\n${message}`;
      }
      if (opts.context) {
        prompt = `Context: ${JSON.stringify(opts.context)}\n\n${prompt}`;
      }

      // Stream response
      for await (const chunk of agent.stream({
        message: prompt,
        conversationId: conversationIdRef.current,
        signal: abortRef.current.signal,
      })) {
        fullContent += chunk.delta;
        setMessages(prev =>
          prev.map(m => m.id === assistantMsgId ? { ...m, content: fullContent } : m)
        );
      }

      opts.onResponse?.(fullContent);
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      if (error.name !== 'AbortError') {
        setError(error);
        opts.onError?.(error);
      }
      // Remove empty assistant message on error
      setMessages(prev => prev.filter(m => m.id !== assistantMsgId || m.content));
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [agent, opts]);

  const clear = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { messages, isLoading, error, send, clear, stop };
}

export interface UseStructuredOptions<T extends ZodSchema> extends Omit<StructuredOptions<T>, 'prompt' | 'schema'> {
  /** Cache key for response */
  cacheKey?: string;
  /** Cache TTL */
  cacheTTL?: string | number;
}

export interface UseStructuredReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching structured data with schema validation.
 *
 * @example
 * ```tsx
 * const TaskSchema = z.object({ title: z.string(), priority: z.enum(['HIGH', 'MEDIUM', 'LOW']) });
 *
 * function TaskList() {
 *   const { data, isLoading } = useStructured(
 *     'List the top 3 tasks for today',
 *     z.array(TaskSchema),
 *     { cacheKey: 'daily-tasks', cacheTTL: '1h' }
 *   );
 *
 *   if (isLoading) return <Spinner />;
 *   return <ul>{data?.map(t => <li key={t.title}>{t.title}</li>)}</ul>;
 * }
 * ```
 */
export function useStructured<T extends ZodSchema>(
  prompt: string,
  schema: T,
  opts: UseStructuredOptions<T> = {}
): UseStructuredReturn<import('zod').infer<T>> {
  const { structured, cache } = useTribble();
  const [data, setData] = useState<import('zod').infer<T> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    if (!structured) return;

    setIsLoading(true);
    setError(null);

    try {
      // Check cache first
      if (opts.cacheKey) {
        const cached = await cache.get<import('zod').infer<T>>(opts.cacheKey);
        if (cached && !cached.stale) {
          setData(cached.data);
          setIsLoading(false);
          return;
        }
      }

      const result = await structured.generate({
        prompt,
        schema,
        retries: opts.retries,
        fallback: opts.fallback,
      });

      setData(result.data);

      // Cache result
      if (opts.cacheKey) {
        await cache.set(opts.cacheKey, result.data, {
          ttl: opts.cacheTTL,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsLoading(false);
    }
  }, [structured, cache, prompt, schema, opts]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}

export interface UseCachedOptions extends CacheOptions {
  /** Interval to refetch in ms or duration string */
  refetchInterval?: string | number;
}

/**
 * Hook for fetching data with caching and automatic refresh.
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const { data, isLoading } = useCached(
 *     'metrics',
 *     async () => await fetchMetrics(),
 *     { ttl: '5m', refetchInterval: '1m' }
 *   );
 *
 *   if (isLoading) return <Spinner />;
 *   return <MetricsDisplay data={data} />;
 * }
 * ```
 */
export function useCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  opts: UseCachedOptions = {}
): { data: T | null; isLoading: boolean; error: Error | null; refetch: () => Promise<void> } {
  const { cache } = useTribble();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await cache.getOrFetch(key, fetcher, opts);
      setData(result.data);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsLoading(false);
    }
  }, [cache, key, fetcher, opts]);

  useEffect(() => {
    fetch();

    // Set up refetch interval
    if (opts.refetchInterval) {
      const interval = parseDuration(opts.refetchInterval) || 60000;
      const timer = setInterval(fetch, interval);
      return () => clearInterval(timer);
    }
  }, [fetch, opts.refetchInterval]);

  return { data, isLoading, error, refetch: fetch };
}

// ==================== Components ====================

export interface TribbleChatProps {
  /** Conversation ID */
  conversationId?: string;
  /** Placeholder text for input */
  placeholder?: string;
  /** System prompt */
  systemPrompt?: string;
  /** Context data */
  context?: Record<string, any>;
  /** Show loading indicator */
  showLoading?: boolean;
  /** Callback on message send */
  onSend?: (message: string) => void;
  /** Callback on response */
  onResponse?: (message: string) => void;
  /** Custom className */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
}

/**
 * Pre-built chat component with streaming support.
 *
 * @example
 * ```tsx
 * function ChatPage() {
 *   return (
 *     <TribbleChat
 *       conversationId="user-123"
 *       placeholder="Ask me anything..."
 *       systemPrompt="You are a helpful assistant."
 *     />
 *   );
 * }
 * ```
 */
export function TribbleChat({
  conversationId,
  placeholder = 'Type a message...',
  systemPrompt,
  context,
  showLoading = true,
  onSend,
  onResponse,
  className,
  style,
}: TribbleChatProps): React.ReactElement {
  const { messages, isLoading, error, send, clear } = useChat({
    conversationId,
    systemPrompt,
    context,
    onResponse,
  });
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input;
    setInput('');
    onSend?.(message);
    await send(message);
  };

  return React.createElement('div', {
    className: `tribble-chat ${className || ''}`,
    style: { display: 'flex', flexDirection: 'column', height: '100%', ...style },
  }, [
    // Messages container
    React.createElement('div', {
      key: 'messages',
      className: 'tribble-chat-messages',
      style: { flex: 1, overflow: 'auto', padding: '16px' },
    }, [
      ...messages.map(m => React.createElement('div', {
        key: m.id,
        className: `tribble-chat-message tribble-chat-message-${m.role}`,
        style: {
          marginBottom: '12px',
          padding: '12px',
          borderRadius: '8px',
          backgroundColor: m.role === 'user' ? '#e3f2fd' : '#f5f5f5',
          marginLeft: m.role === 'user' ? '20%' : '0',
          marginRight: m.role === 'assistant' ? '20%' : '0',
        },
      }, m.content)),
      showLoading && isLoading && React.createElement('div', {
        key: 'loading',
        className: 'tribble-chat-loading',
        style: { padding: '12px', color: '#666' },
      }, 'Thinking...'),
      error && React.createElement('div', {
        key: 'error',
        className: 'tribble-chat-error',
        style: { padding: '12px', color: '#d32f2f' },
      }, `Error: ${error.message}`),
      React.createElement('div', { key: 'end', ref: messagesEndRef }),
    ]),

    // Input form
    React.createElement('form', {
      key: 'form',
      onSubmit: handleSubmit,
      className: 'tribble-chat-input',
      style: {
        display: 'flex',
        padding: '16px',
        borderTop: '1px solid #e0e0e0',
        gap: '8px',
      },
    }, [
      React.createElement('input', {
        key: 'input',
        type: 'text',
        value: input,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value),
        placeholder,
        disabled: isLoading,
        style: {
          flex: 1,
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          fontSize: '16px',
        },
      }),
      React.createElement('button', {
        key: 'submit',
        type: 'submit',
        disabled: isLoading || !input.trim(),
        style: {
          padding: '12px 24px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: '#1976d2',
          color: 'white',
          fontSize: '16px',
          cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
          opacity: isLoading || !input.trim() ? 0.6 : 1,
        },
      }, 'Send'),
    ]),
  ]);
}

export interface TribbleInsightProps<T extends ZodSchema> {
  /** Prompt to generate insight */
  prompt: string;
  /** Zod schema for structured output */
  schema: T;
  /** Cache key */
  cacheKey?: string;
  /** Cache TTL */
  cacheTTL?: string | number;
  /** Refresh interval */
  refreshInterval?: string | number;
  /** Render function for the data */
  render: (data: import('zod').infer<T>) => React.ReactNode;
  /** Fallback while loading */
  fallback?: React.ReactNode;
  /** Error render function */
  renderError?: (error: Error) => React.ReactNode;
  /** Custom className */
  className?: string;
}

/**
 * Component for displaying AI-generated structured insights.
 *
 * @example
 * ```tsx
 * const MetricsSchema = z.object({
 *   revenue: z.string(),
 *   growth: z.string(),
 *   alerts: z.array(z.string()),
 * });
 *
 * function Dashboard() {
 *   return (
 *     <TribbleInsight
 *       prompt="Summarize today's key metrics"
 *       schema={MetricsSchema}
 *       cacheKey="daily-metrics"
 *       cacheTTL="5m"
 *       render={data => (
 *         <div>
 *           <h2>Revenue: {data.revenue}</h2>
 *           <p>Growth: {data.growth}</p>
 *         </div>
 *       )}
 *       fallback={<Spinner />}
 *     />
 *   );
 * }
 * ```
 */
export function TribbleInsight<T extends ZodSchema>({
  prompt,
  schema,
  cacheKey,
  cacheTTL,
  refreshInterval,
  render,
  fallback,
  renderError,
  className,
}: TribbleInsightProps<T>): React.ReactElement {
  const { data, isLoading, error, refetch } = useStructured(prompt, schema, {
    cacheKey,
    cacheTTL,
  });

  // Set up refresh interval
  useEffect(() => {
    if (refreshInterval) {
      const interval = parseDuration(refreshInterval) || 60000;
      const timer = setInterval(refetch, interval);
      return () => clearInterval(timer);
    }
  }, [refreshInterval, refetch]);

  if (isLoading && !data) {
    return React.createElement('div', { className: `tribble-insight-loading ${className || ''}` },
      fallback || 'Loading...'
    );
  }

  if (error && !data) {
    return React.createElement('div', { className: `tribble-insight-error ${className || ''}` },
      renderError ? renderError(error) : `Error: ${error.message}`
    );
  }

  if (!data) {
    return React.createElement('div', { className: `tribble-insight-empty ${className || ''}` },
      'No data available'
    );
  }

  return React.createElement('div', { className: `tribble-insight ${className || ''}` },
    render(data)
  );
}

export interface TribbleDataCardProps {
  /** Title of the card */
  title?: string;
  /** Query/prompt to fetch data */
  query: string;
  /** Cache key */
  cacheKey?: string;
  /** Cache TTL */
  cacheTTL?: string | number;
  /** Custom render function */
  render?: (data: any) => React.ReactNode;
  /** Custom className */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
}

/**
 * Simple data card component for displaying query results.
 *
 * @example
 * ```tsx
 * function OverviewPage() {
 *   return (
 *     <div className="cards">
 *       <TribbleDataCard
 *         title="Revenue"
 *         query="What was our revenue this month?"
 *         cacheKey="monthly-revenue"
 *       />
 *       <TribbleDataCard
 *         title="Top Product"
 *         query="What was our best selling product?"
 *         cacheKey="top-product"
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export function TribbleDataCard({
  title,
  query,
  cacheKey,
  cacheTTL = '5m',
  render,
  className,
  style,
}: TribbleDataCardProps): React.ReactElement {
  const { agent, cache } = useTribble();
  const [data, setData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetch = async () => {
      if (!agent) return;

      setIsLoading(true);
      setError(null);

      try {
        const key = cacheKey || `data-card:${query}`;
        const result = await cache.getOrFetch(
          key,
          async () => {
            const response = await agent.chat({ message: query });
            return response.message;
          },
          { ttl: cacheTTL }
        );

        setData(result.data);
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        setIsLoading(false);
      }
    };

    fetch();
  }, [agent, cache, query, cacheKey, cacheTTL]);

  return React.createElement('div', {
    className: `tribble-data-card ${className || ''}`,
    style: {
      padding: '16px',
      borderRadius: '8px',
      backgroundColor: '#fff',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      ...style,
    },
  }, [
    title && React.createElement('h3', {
      key: 'title',
      style: { margin: '0 0 12px 0', fontSize: '14px', color: '#666' },
    }, title),
    React.createElement('div', {
      key: 'content',
      className: 'tribble-data-card-content',
    },
      isLoading ? 'Loading...' :
      error ? `Error: ${error.message}` :
      render ? render(data) :
      React.createElement('p', { style: { margin: 0 } }, data)
    ),
  ]);
}

// ==================== Utility Components ====================

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
}

/**
 * Skeleton loading placeholder.
 */
export function Skeleton({ width = '100%', height = '20px', borderRadius = '4px', className }: SkeletonProps): React.ReactElement {
  return React.createElement('div', {
    className: `tribble-skeleton ${className || ''}`,
    style: {
      width,
      height,
      borderRadius,
      backgroundColor: '#e0e0e0',
      animation: 'tribble-skeleton-pulse 1.5s ease-in-out infinite',
    },
  });
}

export interface ErrorBoundaryProps {
  fallback: React.ReactNode | ((error: Error) => React.ReactNode);
  children: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary for Tribble components.
 */
export class TribbleErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.props.onError?.(error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError && this.state.error) {
      const { fallback } = this.props;
      return typeof fallback === 'function' ? fallback(this.state.error) : fallback;
    }

    return this.props.children;
  }
}

// ==================== CSS Injection ====================

const styleId = 'tribble-sdk-react-styles';

function injectStyles(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes tribble-skeleton-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .tribble-chat {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    }

    .tribble-chat-message {
      white-space: pre-wrap;
      word-break: break-word;
    }

    .tribble-chat-input input:focus {
      outline: none;
      border-color: #1976d2;
    }

    .tribble-data-card {
      transition: box-shadow 0.2s ease;
    }

    .tribble-data-card:hover {
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }
  `;
  document.head.appendChild(style);
}

// Inject styles on module load (client-side only)
if (typeof window !== 'undefined') {
  injectStyles();
}

// ==================== Re-exports ====================

export type { AgentClient, StreamToken } from '@tribble/sdk-agent';
export type { Conversation, Message } from '@tribble/sdk-conversations';
export type { StorageAdapter, CacheOptions } from '@tribble/sdk-offline';
export type { StructuredOptions } from '@tribble/sdk-structured';

import { HttpClient } from '@tribble/sdk-core';
import type { TribbleConfig } from '@tribble/sdk-core';

export interface ChatOptions {
  conversationId?: string;
  message: string;
  signal?: AbortSignal;
}

export interface ChatResult {
  conversationId: string;
  message: string;
}

export interface StreamToken {
  delta: string;
  done?: boolean;
}

export class AgentClient {
  private readonly cfg: TribbleConfig['agent'];
  private readonly http: HttpClient;
  private readonly baseUrl: string;
  private readonly defaultHeaders: Record<string, string>;

  constructor(cfg: TribbleConfig['agent']) {
    this.cfg = cfg;
    this.baseUrl = cfg.baseUrl.replace(/\/$/, '');
    this.defaultHeaders = {
      Authorization: `Bearer ${cfg.token}`,
      'Content-Type': 'application/json',
      ...(cfg.defaultHeaders || {}),
    };
    this.http = new HttpClient({ defaultHeaders: this.defaultHeaders });
  }

  async chat(opts: ChatOptions): Promise<ChatResult> {
    const url = `${this.baseUrl}/chat`;
    const body = JSON.stringify({
      email: this.cfg.email,
      conversation_id: opts.conversationId,
      message: opts.message,
      streaming: false,
    });
    const { data } = await this.http.request<any>(url, { method: 'POST', body, signal: opts.signal });
    // Normalize tribble-chat shape { success, response: { message, conversation_id } }
    if (data && data.response && typeof data.response.message === 'string') {
      return { conversationId: String(data.response.conversation_id), message: data.response.message };
    }
    // Fallback if server already matches our shape
    if (data && typeof data.message === 'string' && data.conversationId) {
      return { conversationId: String(data.conversationId), message: data.message } as ChatResult;
    }
    // Last resort: try to coerce
    return { conversationId: String(opts.conversationId || ''), message: String(data ?? '') };
  }

  async *stream(opts: ChatOptions): AsyncGenerator<StreamToken, void, void> {
    // tribble-chat streams via POST /external/chat with { streaming: true }
    const url = `${this.baseUrl}/chat`;
    const payload = {
      email: this.cfg.email,
      conversation_id: opts.conversationId,
      message: opts.message,
      streaming: true,
    };
    let last = '';
    for await (const evt of this.http.sse(url, { method: 'POST', body: JSON.stringify(payload), signal: opts.signal })) {
      if (!evt?.data) continue;
      try {
        const parsed = JSON.parse(evt.data);
        // Support delta-first protocols
        if (typeof parsed?.delta === 'string') {
          yield { delta: parsed.delta, done: !!parsed.done };
          continue;
        }
        // tribble-chat shape: { success, response: { message, conversation_id } }
        const msg = parsed?.response?.message;
        if (typeof msg === 'string') {
          const delta = msg.startsWith(last) ? msg.slice(last.length) : msg;
          last = msg;
          if (delta) yield { delta };
          continue;
        }
        // If server sends plain string as data
        if (typeof parsed === 'string') {
          yield { delta: parsed };
          continue;
        }
      } catch {
        // Non-JSON event payload, emit raw
        yield { delta: evt.data };
        continue;
      }
    }
  }

  instructions(payload: unknown, suffix?: string): string {
    const content = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return suffix ? `${content}\n\n${suffix}` : content;
  }

  parseJSON(text: string): any {
    // Extract first JSON object/array from arbitrary text
    const start = text.search(/[\{\[]/);
    if (start === -1) throw new Error('No JSON found in message');
    for (let end = text.length; end > start; end--) {
      const chunk = text.slice(start, end);
      try {
        return JSON.parse(chunk);
      } catch {}
    }
    throw new Error('Failed to parse JSON from message');
  }
}

export type { TribbleConfig };

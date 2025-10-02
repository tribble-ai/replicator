import { hmacSignature } from '@tribble/sdk-workflows';

export interface WebhookAppOptions {
  signingSecret: string;
  toleranceSec?: number; // default 5 minutes
}

export interface WebhookEvent<T = any> {
  type: string;
  data: T;
  ts: number;
}

type Handler<T = any> = (evt: WebhookEvent<T>) => Promise<void> | void;

export async function verifySignature(opts: { secret: string; header: string | null; rawBody: string; toleranceSec?: number }): Promise<boolean> {
  const { secret, header, rawBody } = opts;
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(',').map((kv) => {
      const [k, v] = kv.split('=');
      return [k.trim(), (v || '').trim()];
    })
  ) as any;
  const t = Number(parts.t);
  const v1 = String(parts.v1 || '');
  if (!t || !v1) return false;
  const now = Math.floor(Date.now() / 1000);
  const tolerance = opts.toleranceSec ?? 300;
  if (Math.abs(now - t) > tolerance) return false;
  return constantTimeEqPromise(v1, hmacSignature(secret, rawBody, t));
}

async function constantTimeEqPromise(a: string, bPromise: Promise<string>): Promise<boolean> {
  const b = await bPromise;
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export function createWebhookApp(opts: WebhookAppOptions) {
  const handlers = new Map<string, Handler[]>();

  function on<T = any>(type: string, handler: Handler<T>) {
    const arr = handlers.get(type) || [];
    arr.push(handler as Handler);
    handlers.set(type, arr);
    return api;
  }

  async function dispatch(evt: WebhookEvent) {
    const arr = handlers.get(evt.type) || [];
    for (const h of arr) await h(evt);
  }

  async function handle(req: Request): Promise<Response> {
    const raw = await req.text();
    const sig = req.headers.get('x-tribble-signature');
    const ok = await verifySignature({ secret: opts.signingSecret, header: sig, rawBody: raw, toleranceSec: opts.toleranceSec });
    if (!ok) return new Response('Invalid signature', { status: 401 });
    let evt: WebhookEvent;
    try {
      evt = JSON.parse(raw);
    } catch {
      return new Response('Bad payload', { status: 400 });
    }
    await dispatch(evt);
    return new Response('ok');
  }

  async function listen(port = 8080) {
    // Node-only helper server for local dev
    // @ts-ignore - avoid requiring Node types for dts
    const { createServer } = await import('node:http');
    const server = createServer(async (req: any, res: any) => {
      if (!req) return;
      let data = '';
      req.on('data', (c: any) => (data += c));
      req.on('end', async () => {
        const sig = req.headers['x-tribble-signature'] as string | undefined || null;
        const ok = await verifySignature({ secret: opts.signingSecret, header: sig, rawBody: data, toleranceSec: opts.toleranceSec });
        if (!ok) {
          res.statusCode = 401;
          res.end('Invalid signature');
          return;
        }
        try {
          const evt = JSON.parse(data);
          await dispatch(evt);
          res.end('ok');
        } catch {
          res.statusCode = 400;
          res.end('Bad payload');
        }
      });
    });
    await new Promise<void>((resolve) => server.listen(port, resolve));
    return server;
  }

  const api = { on, handle, listen };
  return api;
}

type Fn<T> = () => Promise<T> | T;

export type QueueEvent = 'enqueue' | 'start' | 'progress' | 'retry' | 'success' | 'failed' | 'drain';

export interface QueueOptions {
  concurrency?: number;
  maxRetries?: number;
  backoffMs?: number;
  maxBackoffMs?: number;
  storage?: {
    load: () => Promise<SerializedJob[]> | SerializedJob[];
    save: (jobs: SerializedJob[]) => Promise<void> | void;
  };
}

export interface JobMeta { id?: string; [k: string]: any }
export interface EnqueueOptions { meta?: JobMeta }

export interface SerializedJob { id: string; status: 'pending'|'running'|'done'|'failed'; retries: number; meta?: JobMeta }

export class UploadQueue<T = unknown> {
  private readonly opts: Required<QueueOptions>;
  private running = 0;
  private queue: Array<{ id: string; fn: Fn<T>; meta?: JobMeta; retries: number } > = [];
  private listeners = new Map<QueueEvent, Array<(...args: any[]) => void>>();

  constructor(opts: QueueOptions = {}) {
    this.opts = {
      concurrency: opts.concurrency ?? 1,
      maxRetries: opts.maxRetries ?? 3,
      backoffMs: opts.backoffMs ?? 300,
      maxBackoffMs: opts.maxBackoffMs ?? 3000,
      storage: opts.storage ?? { load: () => [], save: () => {} },
    };
  }

  async restore(mapper: (job: SerializedJob) => Fn<T>): Promise<void> {
    const jobs = await this.opts.storage.load();
    for (const sj of jobs) {
      if (sj.status === 'done') continue;
      const fn = mapper(sj);
      this.queue.push({ id: sj.id, fn, meta: sj.meta, retries: sj.retries });
    }
  }

  on(event: QueueEvent, handler: (...args: any[]) => void) {
    const arr = this.listeners.get(event) || [];
    arr.push(handler);
    this.listeners.set(event, arr);
    return this;
  }

  private emit(event: QueueEvent, ...args: any[]) {
    const arr = this.listeners.get(event) || [];
    for (const h of arr) try { h(...args); } catch {}
  }

  async enqueue(fn: Fn<T>, opts: EnqueueOptions = {}): Promise<string> {
    const id = opts.meta?.id || randomId();
    this.queue.push({ id, fn, meta: opts.meta, retries: 0 });
    this.emit('enqueue', { id, meta: opts.meta });
    await this.persist('pending');
    this.pump();
    return id;
  }

  private pump() {
    while (this.running < this.opts.concurrency && this.queue.length > 0) this.runNext();
    if (this.running === 0 && this.queue.length === 0) this.emit('drain');
  }

  private async runNext() {
    const item = this.queue.shift();
    if (!item) return;
    this.running++;
    this.emit('start', { id: item.id, meta: item.meta });
    try {
      const out = await item.fn();
      this.emit('success', { id: item.id, result: out, meta: item.meta });
      await this.persist('done', item.id);
    } catch (err) {
      if (item.retries < this.opts.maxRetries) {
        const delay = Math.min(this.opts.backoffMs * Math.pow(2, item.retries) + Math.floor(Math.random() * 50), this.opts.maxBackoffMs);
        item.retries++;
        this.emit('retry', { id: item.id, retries: item.retries, meta: item.meta, error: err });
        setTimeout(() => { this.queue.unshift(item); this.pump(); }, delay);
      } else {
        this.emit('failed', { id: item.id, error: err, meta: item.meta });
        await this.persist('failed', item.id, item.retries, item.meta);
      }
    } finally {
      this.running--;
      this.pump();
    }
  }

  private async persist(status: SerializedJob['status'], id?: string, retries = 0, meta?: JobMeta) {
    const current = await this.opts.storage.load();
    let jobs = current.filter((j) => !id || j.id !== id);
    if (status === 'pending' && this.queue.length) {
      const q = this.queue.map((q) => ({ id: q.id, status: 'pending' as const, retries: q.retries, meta: q.meta }));
      jobs = mergeJobs(jobs, q);
    } else if (id) {
      jobs.push({ id, status, retries, meta });
    }
    await this.opts.storage.save(jobs);
  }
}

function mergeJobs(a: SerializedJob[], b: SerializedJob[]): SerializedJob[] {
  const map = new Map<string, SerializedJob>();
  for (const j of [...a, ...b]) map.set(j.id, j);
  return [...map.values()];
}

function randomId() {
  const s = Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
  return s.slice(0, 24);
}


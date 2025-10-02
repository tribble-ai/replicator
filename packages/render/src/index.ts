export interface MarkdownRenderer {
  fromMarkdown(md: string, opts?: { baseUrl?: string }): Promise<Uint8Array | Blob>;
  fromHtml?(html: string, opts?: { baseUrl?: string }): Promise<Uint8Array | Blob>;
}

let renderer: MarkdownRenderer | null = null;

export function setRenderer(r: MarkdownRenderer) {
  renderer = r;
}

export async function fromMarkdown(md: string, opts?: { baseUrl?: string }) {
  if (!renderer) throw new Error('No Markdown renderer configured. Provide an adapter via setRenderer().');
  return renderer.fromMarkdown(md, opts);
}

export async function fromHtml(html: string, opts?: { baseUrl?: string }) {
  if (!renderer?.fromHtml) throw new Error('fromHtml not supported by current renderer');
  return renderer.fromHtml(html, opts);
}


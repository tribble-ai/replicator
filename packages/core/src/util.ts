export function createRequestId(): string {
  // RFC4122-ish v4 without crypto dependency if unavailable
  const rnd = (n = 16) => [...cryptoGetRandom(n)].map((b) => b.toString(16).padStart(2, '0')).join('');
  const s = rnd(16);
  return [s.slice(0, 8), s.slice(8, 12), '4' + s.slice(13, 16), s.slice(16, 20), s.slice(20, 32)].join('-');
}

function cryptoGetRandom(n: number): Uint8Array {
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const arr = new Uint8Array(n);
    globalThis.crypto.getRandomValues(arr);
    return arr;
  }
  // Fallback (not cryptographically strong)
  const arr = new Uint8Array(n);
  for (let i = 0; i < n; i++) arr[i] = Math.floor(Math.random() * 256);
  return arr;
}

export function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

export function toBase64(data: ArrayBuffer | Uint8Array): string {
  const buf = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
  const Buf: any = (globalThis as any).Buffer;
  if (Buf) return Buf.from(buf).toString('base64');
  let s = '';
  buf.forEach((b) => (s += String.fromCharCode(b)));
  // btoa may be undefined on some server runtimes
  // @ts-ignore
  return typeof btoa === 'function' ? btoa(s) : (Buf ? Buf.from(s, 'binary').toString('base64') : s);
}

export function subtleCrypto(): SubtleCrypto | undefined {
  return globalThis.crypto?.subtle;
}

// Minimal Instagram API (Instagram Login) client. Tokens are read from .env and never logged; every error
// message is redacted before it surfaces.
import { loadEnv } from '../data/db.ts';

export const IG_HOST = 'https://graph.instagram.com/v25.0';

export const redact = (s: string) =>
  s.replace(/access_token=[^&"\s]+/g, 'access_token=<redacted>').replace(/"access_token"\s*:\s*"[^"]+"/g, '"access_token":"<redacted>"');

export class IgError extends Error {
  status: number;
  code: number | undefined;
  subcode: number | undefined;
  constructor(status: number, code: number | undefined, subcode: number | undefined, message: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.subcode = subcode;
  }
}

export function igClient(token = loadEnv().IG_ACCESS_TOKEN) {
  if (!token) throw new Error('IG_ACCESS_TOKEN missing in .env');

  async function request<T = any>(method: 'GET' | 'POST' | 'DELETE', path: string, params: Record<string, string | number | boolean> = {}): Promise<T> {
    const qs = new URLSearchParams({ ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])), access_token: token });
    const url = path.startsWith('http') ? `${path}${path.includes('?') ? '&' : '?'}access_token=${token}` : `${IG_HOST}/${path.replace(/^\//, '')}`;
    const res = method === 'GET' || method === 'DELETE'
      ? await fetch(path.startsWith('http') ? url : `${url}?${qs}`, { method })
      : await fetch(url, { method, body: qs });
    const text = await res.text();
    if (!res.ok) {
      let err: any = {};
      try { err = JSON.parse(text).error ?? {}; } catch { /* not JSON */ }
      throw new IgError(res.status, err.code, err.error_subcode, `Instagram API ${res.status} ${method} /${path.split('?')[0]}: ${redact(err.message ?? text).slice(0, 300)}`);
    }
    return JSON.parse(text) as T;
  }

  /** Follows cursor pagination and returns every item. */
  async function all<T = any>(path: string, params: Record<string, string | number> = {}): Promise<T[]> {
    const out: T[] = [];
    let page = await request<{ data: T[]; paging?: { next?: string } }>('GET', path, params);
    for (;;) {
      out.push(...page.data);
      if (!page.paging?.next) return out;
      const next = new URL(page.paging.next);
      next.searchParams.delete('access_token');
      page = await request('GET', next.toString());
    }
  }

  return { get: <T = any>(p: string, q?: Record<string, string | number | boolean>) => request<T>('GET', p, q), post: <T = any>(p: string, q?: Record<string, string | number | boolean>) => request<T>('POST', p, q), all };
}

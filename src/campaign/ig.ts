// Read-only Instagram access for the campaign tools. Everything here is a GET: the campaign never replies, hides,
// deletes, sends messages or publishes (owner rule: those need explicit approval and go through other tools).
// Wraps src/ig/api.ts (token from .env, errors redacted) and refuses any other method by construction.
import { igClient, redact } from '../ig/api.ts';

export interface ReadOnlyIg {
  get<T = any>(path: string, params?: Record<string, string | number | boolean>): Promise<T>;
  /** Follows cursor pagination and returns every item. */
  all<T = any>(path: string, params?: Record<string, string | number>): Promise<T[]>;
  /** Follows a `paging.next` URL (the token is stripped from it and re-added by the client). */
  next<T = any>(url: string): Promise<T>;
}

export class ReadOnlyViolation extends Error {}

/** A GET-only client. `post`/`delete` don't exist on it; a guard also rejects non-GET use through a Proxy. */
export function readOnlyIg(token?: string): ReadOnlyIg {
  const ig = igClient(token);
  const ro: ReadOnlyIg = {
    get: (p, q) => ig.get(p, q),
    all: (p, q) => ig.all(p, q),
    next: url => {
      const u = new URL(url);
      u.searchParams.delete('access_token');
      return ig.get(u.toString());
    },
  };
  return new Proxy(ro, {
    get(t, k) {
      if (k === 'get' || k === 'all' || k === 'next' || k === 'then' || typeof k === 'symbol') return (t as any)[k];
      throw new ReadOnlyViolation(`campaign tools are read-only: "${String(k)}" is not allowed (GET only)`);
    },
  });
}

export const redactAll = (s: string) => redact(s).replace(/Bearer\s+[\w.-]+/g, 'Bearer <redacted>');

export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/** Instagram returns "2026-10-14T12:34:56+0000"; store ISO UTC with Z. */
export const isoUtc = (t: string) => new Date(t.replace(/([+-]\d{2})(\d{2})$/, '$1:$2')).toISOString();

/** "jan.mikes" → "j…s"; never print a full username in tool output. */
export const maskUser = (u?: string | null, id?: string | null) => {
  const name = !u ? '?' : u.length <= 2 ? `${u[0]}…` : `${u[0]}…${u[u.length - 1]}`;
  return id ? `${name} (id …${String(id).slice(-4)})` : name;
};

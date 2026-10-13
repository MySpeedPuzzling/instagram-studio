// Read-only queries against MSP production, cached locally.
//
// SQL lives in queries/<name>.sql (committed; it holds no secrets). Connection details come from .env
// (MSP_DB_SSH, MSP_DB_CONTAINER, MSP_DB_ROLE, MSP_DB_NAME) and are never printed. Results are cached in
// content/cache/<name>.json (gitignored) with the query date, so design iteration never re-queries
// production; pass { fresh: true } right before a number goes into a post.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../render/server.ts';

export interface QueryResult<Row = Record<string, string>> {
  name: string;
  queried_at: string;
  sql_sha256: string;
  rows: Row[];
}

export function loadEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const line of readFileSync(join(ROOT, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^"(.*)"$/, '$1');
  }
  return env;
}

export function query(name: string, opts: { fresh?: boolean } = {}): QueryResult {
  const sql = readFileSync(join(ROOT, 'queries', `${name}.sql`), 'utf8');
  const sha = createHash('sha256').update(sql).digest('hex');
  const cacheFile = join(ROOT, 'content/cache', `${name}.json`);
  if (!opts.fresh && existsSync(cacheFile)) {
    const cached = JSON.parse(readFileSync(cacheFile, 'utf8')) as QueryResult;
    if (cached.sql_sha256 === sha) return cached;
  }
  const env = loadEnv();
  for (const k of ['MSP_DB_SSH', 'MSP_DB_CONTAINER', 'MSP_DB_ROLE', 'MSP_DB_NAME']) {
    if (!env[k]) throw new Error(`${k} missing in .env`);
  }
  // Production rules: read-only role, a statement timeout, one query at a time.
  const remote = `docker exec -i ${env.MSP_DB_CONTAINER} psql -U ${env.MSP_DB_ROLE} -d ${env.MSP_DB_NAME} -X -q --csv -v ON_ERROR_STOP=1`;
  let csv: string;
  try {
    csv = execFileSync('ssh', ['-o', 'BatchMode=yes', env.MSP_DB_SSH, remote], {
      input: `SET statement_timeout = '60s';\n${sql}`,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (e) {
    const stderr = String((e as { stderr?: string }).stderr ?? '').split('\n').filter(l => /ERROR|error/.test(l)).join(' ');
    throw new Error(`query ${name} failed: ${stderr.slice(0, 300) || (e as Error).message.split('\n')[0]}`);
  }
  const result: QueryResult = { name, queried_at: new Date().toISOString(), sql_sha256: sha, rows: parseCsv(csv) };
  mkdirSync(join(ROOT, 'content/cache'), { recursive: true });
  writeFileSync(cacheFile, JSON.stringify(result, null, 1) + '\n');
  return result;
}

/** Minimal RFC 4180 parser; the first row is the header. */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [header, ...body] = rows.filter(r => r.length > 1 || r[0] !== '');
  return (body ?? []).map(r => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
}

// CLI: node src/data/db.ts <name> [--fresh]
if (import.meta.main) {
  const [name, flag] = process.argv.slice(2);
  if (!name) { console.error('usage: node src/data/db.ts <query-name> [--fresh]'); process.exit(2); }
  const r = query(name, { fresh: flag === '--fresh' });
  console.log(`${r.name}: ${r.rows.length} rows, queried ${r.queried_at}`);
  console.table(r.rows.slice(0, 40));
}

// Tiny static server for renders and the local gallery. Binds to 127.0.0.1 and serves only allow-listed
// folders, so nothing outside them (.env, CLAUDE.local.md, …) can ever be fetched by a page.
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

export const ROOT = resolve(import.meta.dirname, '../..');
const ALLOWED = ['/assets/', '/content/', '/var/render/', '/var/ig-compression/', '/node_modules/d3/dist/', '/node_modules/circle-flags/flags/'];

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.mp4': 'video/mp4',
};

export type Handler = (req: IncomingMessage, res: ServerResponse) => boolean | Promise<boolean>;

export async function startServer(opts: { port?: number; host?: string; handlers?: Handler[] } = {}) {
  const server: Server = createServer(async (req, res) => {
    try {
      for (const h of opts.handlers ?? []) if (await h(req, res)) return;
      const path = normalize(decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname));
      if (!ALLOWED.some(p => path.startsWith(p)) || path.includes('..')) return send(res, 404, 'not found');
      let file = join(ROOT, path);
      if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
      if (!existsSync(file)) return send(res, 404, 'not found');
      res.writeHead(200, { 'content-type': TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream', 'cache-control': 'no-store' });
      createReadStream(file).pipe(res);
    } catch (e) {
      send(res, 500, String(e));
    }
  });
  await new Promise<void>(ok => server.listen(opts.port ?? 0, opts.host ?? '127.0.0.1', ok));
  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : 0;
  return { url: `http://${opts.host ?? '127.0.0.1'}:${port}`, close: () => new Promise<void>(ok => server.close(() => ok())) };
}

function send(res: ServerResponse, code: number, body: string) {
  res.writeHead(code, { 'content-type': 'text/plain; charset=utf-8' });
  res.end(body);
}

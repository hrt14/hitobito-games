import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.txt': 'text/plain; charset=utf-8',
};

function sendVirtualRoute(res, route) {
  const normalized = typeof route === 'string'
    ? { content: route, type: 'text/html; charset=utf-8', status: 200 }
    : route;

  res.writeHead(normalized.status || 200, {
    'content-type': normalized.type || 'text/plain; charset=utf-8',
    'cache-control': 'no-store',
    ...(normalized.headers || {}),
  });
  res.end(normalized.content ?? '');
}

export function createLocalServer({
  root = process.cwd(),
  port = Number(process.env.PORT || 4173),
  host = '127.0.0.1',
  virtualRoutes = {},
} = {}) {
  const absoluteRoot = path.resolve(root);

  const server = http.createServer((req, res) => {
    try {
      const requestUrl = new URL(req.url || '/', 'http://localhost');
      const pathname = decodeURIComponent(requestUrl.pathname);

      if (Object.prototype.hasOwnProperty.call(virtualRoutes, pathname)) {
        sendVirtualRoute(res, virtualRoutes[pathname]);
        return;
      }

      let candidate = path.resolve(absoluteRoot, `.${pathname}`);

      if (!candidate.startsWith(absoluteRoot + path.sep) && candidate !== absoluteRoot) {
        res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
        res.end('Forbidden');
        return;
      }

      if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
        candidate = path.join(candidate, 'index.html');
      }

      if (!fs.existsSync(candidate) || !fs.statSync(candidate).isFile()) {
        res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
        res.end('Not Found');
        return;
      }

      const ext = path.extname(candidate).toLowerCase();
      const type = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, {
        'content-type': type,
        'cache-control': 'no-store',
      });
      fs.createReadStream(candidate).pipe(res);
    } catch (error) {
      res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
      res.end(`Local server error: ${error.message}`);
    }
  });

  return {
    server,
    port,
    host,
    start() {
      return new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, host, () => {
          server.off('error', reject);
          resolve();
        });
      });
    },
    stop() {
      return new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    },
  };
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  const local = createLocalServer();
  await local.start();
  console.log('Hitobito Games local server is running.');
  console.log(`Top:   http://localhost:${local.port}/`);
  console.log(`Games: http://localhost:${local.port}/apps/<game-slug>/`);
  console.log('Press Ctrl+C to stop.');
}

import { createReadStream, existsSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', 'dist-check');
const requestedPort = Number(process.argv[2] || process.env.PORT || 19088);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.wav': 'audio/wav',
};

function resolveRequest(requestUrl = '/') {
  const url = new URL(requestUrl, 'http://127.0.0.1');
  const pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
  const candidate = path.resolve(root, `.${pathname}`);
  return candidate.startsWith(root) && existsSync(candidate) ? candidate : path.join(root, 'index.html');
}

if (!existsSync(path.join(root, 'index.html'))) {
  throw new Error('dist-check não encontrado. Rode a exportação web antes de iniciar a prévia.');
}

const server = http.createServer((request, response) => {
  const filePath = resolveRequest(request.url);
  response.writeHead(200, {
    'content-type': MIME[path.extname(filePath)] || 'application/octet-stream',
    'cache-control': 'no-store',
  });
  createReadStream(filePath).pipe(response);
});

server.listen(requestedPort, '127.0.0.1', () => {
  console.log(`Finance Quest preview: http://127.0.0.1:${requestedPort}`);
});

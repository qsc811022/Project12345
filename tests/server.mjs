import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml' };
http.createServer(async (request, response) => {
  try {
    let pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    // Exercise repository subpath hosting without copying the site.
    if (pathname.startsWith('/korean-start/')) pathname = pathname.slice('/korean-start'.length);
    if (pathname.split('/').some(part => part.startsWith('.'))) throw new Error('Hidden path');
    const filename = path.resolve(root, '.' + pathname, pathname.endsWith('/') ? 'index.html' : '');
    if (!filename.startsWith(root)) throw new Error('Outside root');
    const content = await readFile(filename);
    response.writeHead(200, { 'Content-Type': `${types[path.extname(filename)] || 'application/octet-stream'}; charset=utf-8`, 'Cache-Control': 'no-store' }); response.end(content);
  } catch { response.writeHead(404, { 'Content-Type': 'text/plain' }); response.end('Not found'); }
}).listen(4173, '127.0.0.1', () => console.log('Local preview: http://127.0.0.1:4173/'));

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, sep, extname } from 'node:path';
import { createCatalog } from './database.mjs';

const publicDir = fileURLToPath(new URL('./public/', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon' };
export function createApp(catalog) {
  return http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
    const send = (status, body, type = 'application/json; charset=utf-8') => {
      res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
      res.end(req.method === 'HEAD' ? undefined : body);
    };
    if (!['GET', 'HEAD'].includes(req.method)) { res.setHeader('Allow', 'GET, HEAD'); return send(405, '{"error":"Method not allowed"}'); }
    let path;
    try { path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
    catch { return send(400, '{"error":"Invalid URL"}'); }
    if (path.includes('\0') || path.includes('\\') || path.split('/').includes('..')) return send(400, '{"error":"Invalid path"}');
    try {
      if (path === '/api/categories') return send(200, JSON.stringify({ categories: catalog.all() }));
      if (path.startsWith('/api/categories/')) {
        const category = catalog.find(path.slice('/api/categories/'.length));
        return send(category ? 200 : 404, JSON.stringify(category ? { category } : { error: 'Category not found' }));
      }
      if (path.startsWith('/api/')) return send(404, '{"error":"Not found"}');
      const categoryRoute = /^\/catalog\/([a-z-]+)\/?$/.exec(path);
      const isPage = path === '/' || /^\/catalog\/?$/.test(path) || Boolean(categoryRoute);
      const knownPage = !categoryRoute || Boolean(catalog.find(categoryRoute[1]));
      const file = resolve(publicDir, isPage ? 'index.html' : `.${path}`);
      if (!file.startsWith(publicDir.endsWith(sep) ? publicDir : publicDir + sep)) return send(404, '{"error":"Not found"}');
      const content = await readFile(file);
      send(knownPage ? 200 : 404, content, types[extname(file)] || 'application/octet-stream');
    } catch (error) {
      if (error.code === 'ENOENT' || error.code === 'EISDIR') return send(404, '{"error":"Not found"}');
      console.error('Request failed:', error.message);
      send(500, '{"error":"Internal server error"}');
    }
  });
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const catalog = createCatalog(fileURLToPath(new URL('./storage/catalog.sqlite', import.meta.url)));
  const server = createApp(catalog);
  server.listen(Number(process.env.PORT || 4182), '127.0.0.1', () => console.log(`ВЕНТУС ДВ → http://127.0.0.1:${server.address().port}`));
  const shutdown = () => server.close(() => { catalog.close(); process.exit(0); });
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

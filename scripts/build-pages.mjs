import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCatalog } from '../database.mjs';
import { rebaseMarkup } from '../public/routing.js';

const root = fileURLToPath(new URL('../', import.meta.url));
export async function buildPages({ outDir = resolve(root, 'dist'), base = '/ventus-dv/' } = {}) {
  if (!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(base)) throw new Error('Base must be an absolute directory path');
  // Export public seed data only. Never include the local SQLite file or private docs.
  const catalog = createCatalog(':memory:');
  let categories;
  try { categories = catalog.all(); } finally { catalog.close(); }
  await mkdir(outDir, { recursive: true });
  await cp(resolve(root, 'public'), outDir, { recursive: true });
  const original = await readFile(resolve(root, 'public/index.html'), 'utf8');
  const html = rebaseMarkup(original, base).replace('<head>', `<head>\n  <meta name="catalog-source" content="${base}data/categories.json">\n  <meta name="robots" content="noindex, nofollow">`);
  // Real files for every route: shared links and reloads work without a server fallback.
  const routes = ['', 'catalog', ...categories.map(c => `catalog/${c.slug}`)];
  for (const route of routes) {
    await mkdir(resolve(outDir, route), { recursive: true });
    await writeFile(resolve(outDir, route, 'index.html'), html);
  }
  await mkdir(resolve(outDir, 'data'), { recursive: true });
  await writeFile(resolve(outDir, 'data/categories.json'), JSON.stringify({ categories }, null, 2) + '\n');
  await writeFile(resolve(outDir, '404.html'), html);
  await writeFile(resolve(outDir, '.nojekyll'), '');
  return { outDir, base, routes };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await buildPages({ base: process.env.PAGES_BASE || '/ventus-dv/' });
  console.log(`Static export: ${result.outDir}; ${result.routes.length} pages; base=${result.base}`);
}

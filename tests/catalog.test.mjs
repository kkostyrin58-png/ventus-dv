import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { createCatalog } from '../database.mjs';
import { createApp } from '../server.mjs';

test('SQL seeds seven ordered, unique categories without products', () => {
  const catalog = createCatalog(':memory:');
  try {
    const rows = catalog.all();
    assert.equal(rows.length, 7);
    assert.equal(new Set(rows.map(r => r.slug)).size, 7);
    assert.deepEqual(rows.map(r => r.sort_order), [1,2,3,4,5,6,7]);
    assert.equal(catalog.find('fans').title, 'Вытяжные и приточные вентиляторы');
    assert.equal(catalog.find("' OR 1=1 --"), undefined);
    for (const row of rows) { assert.ok(row.description.length > 20); assert.match(row.slug, /^[a-z-]+$/); }
  } finally { catalog.close(); }
});

test('SQLite persists categories and seed is idempotent', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ventus-dv-test-'));
  let catalog;
  try {
    catalog = createCatalog(join(directory, 'catalog.sqlite'));
    const initial = catalog.all();
    catalog.close(); catalog = null;
    catalog = createCatalog(join(directory, 'catalog.sqlite'));
    assert.deepEqual(catalog.all(), initial);
  } finally {
    catalog?.close();
    // Only this unique, test-owned temporary directory is removed.
    await rm(directory, { recursive: true, force: true });
  }
});

test('HTTP API, routes, static files and method restrictions', async t => {
  const catalog = createCatalog(':memory:');
  const server = createApp(catalog);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => { await new Promise(resolve => server.close(resolve)); catalog.close(); });
  const list = await fetch(origin + '/api/categories');
  assert.equal(list.status, 200);
  assert.equal((await list.json()).categories.length, 7);
  assert.match(list.headers.get('content-security-policy'), /default-src 'self'/);
  for (const category of catalog.all()) {
    const response = await fetch(`${origin}/api/categories/${category.slug}`);
    assert.equal((await response.json()).category.slug, category.slug);
    const page = await fetch(`${origin}/catalog/${category.slug}`);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /lang="ru"/);
  }
  for (const path of ['/', '/catalog', '/catalog/']) assert.equal((await fetch(origin + path)).status, 200);
  for (const path of ['/api/categories/missing', '/catalog/missing', '/api/unknown', '/storage/catalog.sqlite', '/server.mjs', '/sql/catalog.sql', '/assets/missing.svg']) assert.equal((await fetch(origin + path)).status, 404, path);
  for (const path of ['/%00', '/%E0%A4%A', '/assets/%2e%2e%2f%2e%2e/server.mjs', '/assets/%5c..%5cserver.mjs']) assert.equal((await fetch(origin + path)).status, 400, path);
  const denied = await fetch(origin + '/api/categories', { method: 'POST' });
  assert.equal(denied.status, 405);
  assert.equal(denied.headers.get('allow'), 'GET, HEAD');
  const head = await fetch(origin + '/', { method: 'HEAD' });
  assert.equal(head.status, 200); assert.equal(await head.text(), '');
  for (const [path, mime] of [['/styles.css','text/css'], ['/app.js','text/javascript'], ['/assets/logo-mark.svg','image/svg+xml'], ['/assets/office-hero.png','image/png']]) {
    const response = await fetch(origin + path);
    assert.equal(response.status, 200);
    assert.ok(response.headers.get('content-type').startsWith(mime));
    await response.arrayBuffer();
  }
});

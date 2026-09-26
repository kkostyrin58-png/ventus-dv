import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildPages } from '../scripts/build-pages.mjs';
import { rebaseMarkup, routePath } from '../public/routing.js';

test('routing works at root and under a GitHub project prefix', () => {
  for (const base of ['/', '/ventus-dv/']) {
    assert.equal(routePath(base, base), '/');
    assert.equal(routePath(base + 'catalog/fans/', base), '/catalog/fans');
    assert.equal(rebaseMarkup('<a href="/catalog">x</a><img src="/assets/a.png">', base), `<a href="${base}catalog">x</a><img src="${base}assets/a.png">`);
  }
  assert.equal(rebaseMarkup('<a href="https://example.com">x</a><a href="#main">y</a>', '/ventus-dv/'), '<a href="https://example.com">x</a><a href="#main">y</a>');
  assert.equal(routePath('/ventus-dv-other/catalog', '/ventus-dv/'), '/ventus-dv-other/catalog');
});

test('static export includes all deep links, assets and SQL-derived data, no private files', async () => {
  const outDir = await mkdtemp(join(tmpdir(), 'ventus-pages-test-'));
  try {
    const built = await buildPages({ outDir });
    assert.equal(built.routes.length, 9);
    for (const route of built.routes) {
      const html = await readFile(join(outDir, route, 'index.html'), 'utf8');
      assert.ok(html.includes('content="/ventus-dv/data/categories.json"'));
      assert.ok(html.includes('src="/ventus-dv/app.js"'));
      assert.ok(html.includes('href="/ventus-dv/styles.css"'));
      assert.equal(/(?:src|href)="\/(?!ventus-dv\/)/.test(html), false);
    }
    const data = JSON.parse(await readFile(join(outDir, 'data/categories.json'), 'utf8'));
    assert.equal(data.categories.length, 7);
    for (const category of data.categories) assert.ok(built.routes.includes('catalog/' + category.slug));
    const files = await readdir(outDir, { recursive: true });
    assert.ok(files.includes('404.html'));
    assert.ok(files.includes('.nojekyll'));
    assert.ok(files.includes('routing.js'));
    assert.equal(files.some(f => /sqlite|server\.mjs|DISCOVERY|MEMORY|\.log$/.test(f)), false);
    assert.ok((await readFile(join(outDir, 'assets/office-hero.png'))).length > 1000);
    await assert.rejects(buildPages({ outDir, base: '/../' }));
  } finally { await rm(outDir, { recursive: true, force: true }); }
});

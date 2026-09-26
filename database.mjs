import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export function createCatalog(filename = fileURLToPath(new URL('./storage/catalog.sqlite', import.meta.url))) {
  if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec(readFileSync(new URL('./sql/catalog.sql', import.meta.url), 'utf8'));
  const all = db.prepare('SELECT id, slug, title, short_title, description, icon, sort_order FROM categories ORDER BY sort_order');
  const bySlug = db.prepare('SELECT id, slug, title, short_title, description, icon, sort_order FROM categories WHERE slug = ?');
  return { all: () => all.all(), find: (slug) => bySlug.get(slug), close: () => db.close() };
}

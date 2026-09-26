import { rebaseMarkup, routePath } from './routing.js';

const siteBase = new URL('.', import.meta.url).pathname;
const main = document.querySelector('#main');
const setMain = markup => { main.innerHTML = rebaseMarkup(markup, siteBase); };
const menu = document.querySelector('#catalog-menu');
const toggle = document.querySelector('.menu-toggle');
const search = document.querySelector('#category-search');
const transition = document.querySelector('.page-transition');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let categories = [];
let navigationId = 0;

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const arrow = '<span aria-hidden="true">↗</span>';
const number = i => String(i + 1).padStart(2, '0');
const pathFor = c => `/catalog/${encodeURIComponent(c.slug)}`;
function fan(className = '') {
  const blade = 'M-6-72C19-69 39-53 47-34C30-38 13-33 2-20C-7-34-9-54-6-72Z';
  return `<svg class="fan ${className}" viewBox="-112 -112 224 224" aria-hidden="true"><circle class="fan-ring" r="105"/><circle class="fan-inner" r="87"/><g class="fan-blades">${[0,72,144,216,288].map(a => `<path d="${blade}" transform="rotate(${a})"/>`).join('')}</g><circle class="fan-hub" r="22"/><circle class="fan-dot" r="8"/></svg>`;
}
document.querySelector('#transition-mark').innerHTML = fan();
function icon(type, className = '') {
  if (type === 'fan') return fan(className);
  const paths = {
    supply: '<rect x="28" y="20" width="64" height="84" rx="12"/><path d="M40 40h40M40 48h40M40 56h40M45 86h30"/><circle cx="60" cy="73" r="3"/>',
    recovery: '<rect x="14" y="27" width="92" height="64" rx="7"/><path d="M36 27v64m48-64v64M19 17h24v10m34 0V17h24v10M29 108V91m62 0v17M47 49l26 22M73 49L47 71"/>',
    kitchen: '<path d="M48 15h24v44l31 30H17l31-30ZM48 59h24M17 89v13h86V89M30 96h60"/>',
    components: '<path d="M23 96V59c0-22 18-40 40-40h36v27H66c-10 0-16 6-16 16v34ZM17 88h39v12H17Zm72-75h12v40H89M28 43l24 16M39 29l21 21M57 20l9 26"/>',
    climate: '<rect x="13" y="27" width="94" height="45" rx="9"/><path d="M14 56h92M23 65h74M81 38h14M35 85c-7 7 7 10 0 19m25-19c-7 7 7 10 0 19m25-19c-7 7 7 10 0 19"/>',
    industrial: '<path d="M20 103V26h80v77M14 103h92M20 83h80M33 90v13m54-13v13"/><circle cx="60" cy="55" r="23"/><circle cx="60" cy="55" r="5"/><path d="m60 50 6-15c12 2 14 10 12 14l-13 5m-9 4-17 2c-3-11 2-18 7-18l11 10m5 8 10 13c-8 8-17 6-20 2l5-15"/>'
  };
  return `<svg class="equipment-icon ${className}" viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[type] || paths.supply}</svg>`;
}
function rail(active = 'home') {
  return `<nav class="side-rail" aria-label="Быстрая навигация"><a href="/" class="${active === 'home' ? 'active' : ''}" aria-label="Главная" ${active === 'home' ? 'aria-current="page"' : ''}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m4 10 8-7 8 7v10h-6v-7h-4v7H4Z"/></svg></a><a href="/catalog" class="${active === 'catalog' ? 'active' : ''}" aria-label="Каталог" ${active === 'catalog' ? 'aria-current="page"' : ''}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></svg></a><span class="rail-line"></span><span class="rail-caption">ВОЗДУХ / КОМФОРТ</span></nav>`;
}
function cards() {
  return categories.map((c, i) => `<a class="category-card category-${escapeHtml(c.icon)}" href="${pathFor(c)}"><div class="card-top"><span class="card-number">${number(i)}</span><span class="card-arrow" aria-hidden="true">↗</span></div><div class="card-art">${icon(c.icon)}</div><div class="card-caption"><h3>${escapeHtml(c.short_title)}</h3><p>${escapeHtml(c.title)}</p></div></a>`).join('');
}
function home() {
  return `<section class="hero" aria-labelledby="page-title">
    <img class="hero-image" src="/assets/office-hero.png" alt="Светлый офисный интерьер с панорамными окнами и встроенной потолочной вентиляцией" width="1672" height="941" fetchpriority="high">
    <div class="hero-shade"></div>
    <div class="hero-topline"><span><i></i> Климат, в котором хочется быть</span><span>ВЕНТУС ДВ / 01</span></div>
    ${rail()}
    <div class="hero-copy"><h1 id="page-title">Чистый воздух.<br><span>Новый уровень</span><br>комфорта.</h1><p>Вентиляция и климатическое оборудование<br>для жизни, работы и больших идей.</p></div>
    <div class="hero-bottom"><a href="/catalog" class="hero-catalog"><span class="eyebrow">Ваше пространство. Ваш климат.</span><h2>Всё для<br>правильного воздуха.</h2><div class="hero-card-bottom"><span><strong>07</strong><span>направлений<br>оборудования</span></span><span class="round-arrow" aria-hidden="true">↗</span></div></a><div class="hero-spacer"></div><div class="hero-note"><span class="note-index">01 / ПРОСТРАНСТВО</span><h2>Комфорт незаметен.<br>Пока он есть.</h2><p>Свежий воздух, приятная температура<br>и ничего лишнего.</p><div class="note-footer"><span>Для дома и бизнеса</span>${fan('note-fan')}</div></div></div>
    <span class="hero-image-caption">Архитектура комфорта</span>
  </section>
  <section class="directions section" id="directions" aria-labelledby="directions-title"><div class="section-heading"><div><span class="eyebrow"><span class="tiny-cross">+</span> Каталог оборудования</span><h2 id="directions-title">Воздух — один.<br><span>Решений — много.</span></h2></div><p>От бризера в квартире до вентиляции<br>целого здания. Найдите своё направление.</p></div><div class="category-grid">${cards()}<div class="category-note"><span class="eyebrow">ВЕНТУС ДВ</span>${fan()}<p>Хороший климат<br>начинается с деталей.</p></div></div></section>
  <section class="approach section" id="approach"><div class="approach-label"><span class="eyebrow">Наш подход</span><span class="approach-coordinate">43°07′ N · 131°54′ E</span></div><div><h2>Техника работает.<br><span>Вы просто дышите.</span></h2><div class="approach-bottom"><p>Мы за продуманные решения: оборудование,<br>которое подходит пространству и его задачам.<br>Без лишнего шума. Во всех смыслах.</p><a class="pill-button" href="/catalog">Найти своё решение ${arrow}</a></div></div></section>`;
}
function catalogPage() {
  return `<section class="catalog-page section"><div class="breadcrumb"><a href="/">Главная</a><span>/</span><span>Каталог</span></div><div class="section-heading"><div><span class="eyebrow">07 направлений · один комфорт</span><h1 id="page-title">Оборудование<br><span>для вашего воздуха.</span></h1></div><p>Выберите направление.<br>Товары и характеристики добавим позже.</p></div><div class="category-grid">${cards()}<div class="category-note"><span class="eyebrow">ВЕНТУС ДВ</span>${fan()}<p>В основе комфорта —<br>правильный выбор.</p></div></div></section>`;
}
function categoryPage(category) {
  const i = categories.findIndex(c => c.slug === category.slug);
  const next = categories[(i + 1) % categories.length];
  return `<section class="category-page section"><div class="breadcrumb"><a href="/">Главная</a><span>/</span><a href="/catalog">Каталог</a><span>/</span><span>${escapeHtml(category.short_title)}</span></div><div class="category-intro"><div><span class="eyebrow">Направление ${number(i)} / 07</span><h1 id="page-title">${escapeHtml(category.title)}</h1><p>${escapeHtml(category.description)}</p></div><div class="category-illustration">${icon(category.icon)}<span>ВЕНТУС ДВ / ${number(i)}</span></div></div><nav class="category-tabs" aria-label="Категории оборудования">${categories.map(c => `<a href="${pathFor(c)}" ${c.slug === category.slug ? 'aria-current="page"' : ''}>${escapeHtml(c.short_title)}</a>`).join('')}</nav><div class="empty-catalog"><div class="empty-symbol">${fan()}</div><span class="eyebrow">Скоро в каталоге</span><h2>Готовим ассортимент.</h2><p>Здесь появятся товары, характеристики и цены.<br>Пока можно познакомиться с другими направлениями.</p><a href="/catalog" class="pill-button">Все категории ${arrow}</a></div><a href="${pathFor(next)}" class="next-category"><span><small>Следующее направление</small><strong>${escapeHtml(next.short_title)}</strong></span><span class="round-arrow" aria-hidden="true">→</span></a></section>`;
}
function render() {
  const pathname = routePath(location.pathname, siteBase);
  let title = 'ВЕНТУС ДВ — воздух для вашего пространства';
  if (pathname === '/') setMain(home());
  else if (pathname === '/catalog') { setMain(catalogPage()); title = 'Каталог оборудования — ВЕНТУС ДВ'; }
  else {
    const category = categories.find(c => pathFor(c) === pathname);
    if (category) { setMain(categoryPage(category)); title = `${category.short_title} — ВЕНТУС ДВ`; }
    else { setMain('<section class="error-state"><span class="eyebrow">404</span><h1 id="page-title">Такой страницы нет.</h1><p>Вернитесь к направлениям оборудования.</p><a class="pill-button" href="/catalog">Открыть каталог ↗</a></section>'); title = 'Страница не найдена — ВЕНТУС ДВ'; }
  }
  document.title = title;
  document.querySelector('#route-status').textContent = title;
  document.querySelectorAll('#menu-categories a').forEach(a => { if (routePath(a.pathname, siteBase) === pathname) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
}
function setMenu(open, returnFocus = false) {
  menu.hidden = !open;
  toggle.setAttribute('aria-expanded', String(open));
  if (open) { search.value = ''; filterMenu(); search.focus(); }
  else if (returnFocus) toggle.focus();
}
function filterMenu() {
  const query = search.value.trim().toLocaleLowerCase('ru');
  let count = 0;
  document.querySelectorAll('#menu-categories a').forEach(a => { a.hidden = !a.textContent.toLocaleLowerCase('ru').includes(query); if (!a.hidden) count++; });
  document.querySelector('.menu-empty').hidden = count > 0;
}
async function navigate(url, push = true) {
  const id = ++navigationId;
  setMenu(false);
  main.setAttribute('aria-busy', 'true');
  transition.classList.add('is-visible');
  if (!reducedMotion.matches) await new Promise(resolve => setTimeout(resolve, 380));
  if (id !== navigationId) return;
  if (push) history.pushState({}, '', url.pathname + url.search + url.hash);
  render();
  const target = url.hash ? document.getElementById(url.hash.slice(1)) : null;
  if (target) target.scrollIntoView({ behavior: 'instant' }); else window.scrollTo({ top: 0, behavior: 'instant' });
  const heading = main.querySelector('h1');
  if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
  main.removeAttribute('aria-busy');
  if (!reducedMotion.matches) await new Promise(resolve => setTimeout(resolve, 100));
  if (id === navigationId) transition.classList.remove('is-visible');
}
toggle.addEventListener('click', () => setMenu(menu.hidden));
document.querySelector('.close-menu').addEventListener('click', () => setMenu(false, true));
search.addEventListener('input', filterMenu);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) setMenu(false, true); });
document.addEventListener('click', e => {
  if (!menu.hidden && !menu.contains(e.target) && !toggle.contains(e.target)) setMenu(false);
  const a = e.target.closest('a[href]');
  if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target || a.hasAttribute('download')) return;
  const url = new URL(a.href);
  if (url.origin !== location.origin) return;
  if (url.pathname === location.pathname && url.hash) return;
  e.preventDefault();
  if (url.pathname === location.pathname && url.hash === location.hash) { window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth' }); return; }
  navigate(url);
});
document.addEventListener('focusin', e => { if (!menu.hidden && !menu.contains(e.target) && !toggle.contains(e.target)) setMenu(false); });
window.addEventListener('popstate', () => navigate(new URL(location.href), false));

async function initialize() {
  try {
    const response = await fetch(document.querySelector('meta[name="catalog-source"]')?.content || `${siteBase}api/categories`);
    if (!response.ok) throw new Error('Не удалось загрузить категории');
    const data = await response.json();
    if (!Array.isArray(data.categories) || !data.categories.length) throw new Error('Категории пока не добавлены');
    categories = data.categories;
    document.querySelector('#menu-categories').innerHTML = rebaseMarkup(categories.map((c, i) => `<a href="${pathFor(c)}"><span>${number(i)}</span>${escapeHtml(c.title)}${arrow}</a>`).join(''), siteBase);
    render();
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
  } catch {
    main.innerHTML = '<section class="error-state"><span class="eyebrow">Нет соединения с каталогом</span><h1>Не получилось загрузить категории.</h1><p>Проверьте соединение и попробуйте ещё раз.</p><button class="pill-button" id="retry">Повторить загрузку ↻</button></section>';
    document.querySelector('#retry').addEventListener('click', () => { main.innerHTML = '<div class="initial-loading" role="status">Загружаем направления…</div>'; initialize(); });
  }
}
initialize();

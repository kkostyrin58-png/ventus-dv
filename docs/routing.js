// Shared by the local application and the static GitHub Pages export.
export function rebaseMarkup(markup, base = '/') {
  return markup.replace(/((?:href|src)=")\/(?!\/)/g, `$1${base}`);
}

export function routePath(pathname, base = '/') {
  const prefix = base.replace(/\/$/, '');
  const local = prefix && (pathname === prefix || pathname.startsWith(prefix + '/'))
    ? pathname.slice(prefix.length) : pathname;
  return local.replace(/\/$/, '') || '/';
}

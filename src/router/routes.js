export const ROUTES = Object.freeze({
  home: '#/',
  projects: '#/projects',
  'glass-ui': '#/glass-ui',
  community: '#/community',
  activity: '#/activity',
  about: '#/about',
  settings: '#/settings',
  'glass-test': '#/glass-test',
});

const HASH_TO_PAGE = new Map(Object.entries(ROUTES).map(([page, hash]) => [hash, page]));
const LEGACY_PATHS = new Map([
  ['index.html', 'home'],
  ['projects.html', 'projects'],
  ['glass-ui.html', 'glass-ui'],
  ['community.html', 'community'],
  ['activity.html', 'activity'],
  ['about.html', 'about'],
  ['glass-test.html', 'glass-test'],
]);

function normalizedHash(hash = location.hash) {
  if (!hash || hash === '#') return '#/';
  const clean = hash.split('?')[0].replace(/\/+$/, '') || '#/';
  if (clean === '#') return '#/';
  return clean;
}

export function routeHref(page) {
  return ROUTES[page] || ROUTES.home;
}

export function pageFromLocation() {
  const hash = normalizedHash();
  if (HASH_TO_PAGE.has(hash)) return HASH_TO_PAGE.get(hash);

  // Development/backward compatibility: opening one of the old HTML shells
  // still enters the SPA on the equivalent logical route.
  const current = document.body?.dataset.page;
  if (current && ROUTES[current]) return current;
  const filename = location.pathname.split('/').pop() || 'index.html';
  return LEGACY_PATHS.get(filename) || 'home';
}

export function pageFromHref(href) {
  if (!href) return null;
  let url;
  try { url = new URL(href, location.href); } catch { return null; }
  if (url.origin !== location.origin) return null;

  if (url.hash) {
    const hash = normalizedHash(url.hash);
    if (HASH_TO_PAGE.has(hash)) return HASH_TO_PAGE.get(hash);
    return null;
  }

  const filename = url.pathname.split('/').pop() || 'index.html';
  return LEGACY_PATHS.get(filename) || null;
}

export function canonicalSpaUrl(page) {
  const url = new URL('./index.html', location.href);
  url.hash = routeHref(page);
  return url;
}

import { navbar, bindNavbar, syncMobileNavbar } from './components/navbar.js';
import { bindLiquidBottomTabs, setLiquidBottomTabsSelected } from './components/liquid-bottom-tabs.js';
import { hero } from './components/hero.js';
import { projectExplorer } from './components/project-explorer.js';
import { projectCard } from './components/project-card.js';
import { drawerShell, renderDrawer } from './components/project-drawer.js';
import { community } from './components/community.js';
import { activitySection } from './components/activity.js';
import { techMap } from './components/tech-map.js';
import { joinSection } from './components/join.js';
import { footer } from './components/footer.js';
import { homeProjects } from './components/home-projects.js';
import { homeActivity } from './components/home-activity.js';
import { pageIntro } from './components/page-intro.js';
import { aboutCopy } from './components/about-copy.js';
import { glassTest } from './components/glass-test.js';
import { glassControlsLab, bindGlassControls } from './components/glass-controls.js';
import { settingsPage, bindSettingsPage } from './components/settings.js';
import { prepareReadabilityGlass } from './glass/readability-glass.js';
import { bindLiquidButtons, destroyLiquidButtonsWithin } from './components/liquid-button.js';
import { fetchRepositories, fetchOrgActivity, fetchLanguages, fetchReadme, decodeBase64Utf8 } from './github/api.js';
import { CATEGORIES, normalizeRepository, sortRepositories } from './github/repositories.js';
import { initReveal } from './animation/reveal.js';
import {
  initLiquidGlass,
  preloadLiquidGlass,
  hydrateLiquidGlass,
  destroyLiquidGlassWithin,
} from './glass/liquid-glass.js';
import { pageFromLocation, pageFromHref, routeHref } from './router/routes.js';

const app = document.querySelector('#app');
let page = pageFromLocation();
let repositories = [];
let repoState = 'loading';
let activity = [];
let activityState = 'loading';
let activeFilter = 'All';
let drawerRepo = null;
let previousFocus = null;
let drawerTransitionCleanup = null;

function stopDrawerTransitionWatch() {
  drawerTransitionCleanup?.();
  drawerTransitionCleanup = null;
}

// The close control now uses a native live backdrop and therefore follows the
// Drawer/content compositor automatically. We only watch the Drawer transform so
// the lens remains active through the closing animation; no per-frame wallpaper
// coordinate chasing is needed anymore.
function watchDrawerTransform(drawer, { onDone } = {}) {
  stopDrawerTransitionWatch();
  if (!drawer) {
    onDone?.();
    return;
  }
  let finished = false;
  let timer = 0;
  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    drawer.removeEventListener('transitionend', onTransitionEnd);
    drawerTransitionCleanup = null;
    onDone?.();
  };
  const onTransitionEnd = (event) => {
    if (event.target === drawer && event.propertyName === 'transform') finish();
  };
  drawer.addEventListener('transitionend', onTransitionEnd);
  timer = window.setTimeout(finish, 620);
  drawerTransitionCleanup = () => {
    clearTimeout(timer);
    drawer.removeEventListener('transitionend', onTransitionEnd);
  };
}

let repoPromise = null;
let activityPromise = null;
let routeSerial = 0;

const routeMeta = {
  home: ['ViudiraTech — 开放技术社区', 'ViudiraTech 开源社区官方网站：操作系统、内核、系统软件与开发者工具。'],
  projects: ['项目 — ViudiraTech', 'ViudiraTech 公开项目与 GitHub 仓库浏览。'],
  'glass-ui': ['Liquid UI Lab — ViudiraTech', 'ViudiraTech Liquid UI Lab：Backdrop Catalog 风格 Liquid Glass 控件实验室。'],
  community: ['社区 — ViudiraTech', 'ViudiraTech 开源社区协作与参与方式。'],
  activity: ['动态 — ViudiraTech', 'ViudiraTech GitHub Public Events 开发动态。'],
  about: ['关于 — ViudiraTech', '关于 ViudiraTech 开放技术社区。'],
  settings: ['设置 — ViudiraTech', '调整 ViudiraTech 网站界面的 Liquid Glass 透明度与模糊度。'],
  'glass-test': ['Liquid Glass Test — ViudiraTech', 'ViudiraTech Liquid Glass 折射测试。'],
};

function ambientLayer() {
  return `<div id="ambient" class="ambient" data-glass-backdrop-mode="fixed-cover" data-glass-backdrop-width="2560" data-glass-backdrop-height="1440" aria-hidden="true">
    <div class="ambient__mesh ambient__mesh--a"></div>
    <div class="ambient__mesh ambient__mesh--b"></div>
    <div class="ambient__noise"></div>
  </div>`;
}

const pageIntros = {
  projects: {
    eyebrow: 'Projects / Repository Explorer',
    title: '完整浏览 ViudiraTech 公开项目。',
    copy: '这里集中展示 ViudiraTech 的公开仓库。筛选、Stars、Forks、语言、Topics、License、更新时间与 README 详情均围绕 GitHub 公开数据组织。',
  },
  community: {
    eyebrow: 'Community / Collaboration',
    title: '社区，是发生在代码旁边的协作。',
    copy: '参与方式围绕公开仓库展开，从 Issue、Pull Request、Review、文档和测试进入完整的协作流程。',
  },
  activity: {
    eyebrow: 'Activity / Public Events',
    title: '把开发动态留给一整页。',
    copy: '展示 GitHub Public Events 中的 Push、Release、Pull Request、Issue 与创建事件，并保持与公开活动数据同步。',
  },
  about: {
    eyebrow: 'About / ViudiraTech',
    title: '一个关注底层技术的开放组织。',
    copy: 'ViudiraTech 聚焦操作系统、内核、系统软件、开发者工具和前沿技术探索，官网用于连接项目、技术方向与开放协作。',
  },
};

function pageBody() {
  if (page === 'home') return `${hero(repositories, repoState)}${homeProjects(repositories, repoState)}${homeActivity(activity, activityState)}`;
  if (page === 'projects') return `${pageIntro(pageIntros.projects)}${projectExplorer(repositories, { state: repoState === 'error' ? 'error' : repoState === 'loading' ? 'loading' : 'ready', active: activeFilter })}`;
  if (page === 'community') return `${pageIntro(pageIntros.community)}${community()}${joinSection()}`;
  if (page === 'activity') return `${pageIntro(pageIntros.activity)}${activitySection(activity, activityState)}`;
  if (page === 'about') return `${pageIntro(pageIntros.about)}${aboutCopy()}${techMap(repositories)}`;
  if (page === 'glass-ui') return glassControlsLab();
  if (page === 'settings') return settingsPage();
  if (page === 'glass-test') return glassTest();
  return hero(repositories, repoState);
}

function needsRepos(target = page) {
  return ['home', 'projects', 'about'].includes(target);
}

function needsActivity(target = page) {
  return ['home', 'activity'].includes(target);
}

function updateMetadata() {
  const [title, description] = routeMeta[page] || routeMeta.home;
  document.title = title;
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute('content', description);
  document.body.dataset.page = page;
}

function mountShell() {
  app.innerHTML = `${ambientLayer()}${navbar(page)}<main id="main" data-spa-view tabindex="-1"></main>${footer()}${drawerShell()}`;
  document.querySelector('#main').innerHTML = pageBody();
  bindNavbar();
  bindGlobalInteractions();
  bindRouteInteractions();
  updateMetadata();
  syncMobileNavbar(page);
  initReveal();
}

function filteredRepositories() {
  return activeFilter === 'All' ? repositories : repositories.filter((repo) => repo.category === activeFilter);
}

function updateProjectGrid() {
  const grid = document.querySelector('[data-project-grid]');
  if (!grid) return;
  const repos = filteredRepositories();
  // Tear down top-level LiquidButton proxies before replacing their owners.
  // Waiting for a MutationObserver sweep leaves a one-frame orphan that is very
  // visible on phones during rapid tab changes.
  destroyLiquidButtonsWithin(grid);
  destroyLiquidGlassWithin(grid);
  grid.innerHTML = repos.length ? repos.map(projectCard).join('') : '<div class="empty-state">当前分类没有可由公开元数据可靠归入的仓库。</div>';
  prepareReadabilityGlass(grid);
  hydrateLiquidGlass(grid).then(() => bindLiquidButtons(grid));
  bindProjectCards();
  initReveal();
}

function bindProjectCards() {
  document.querySelectorAll('#main [data-repo]').forEach((card) => {
    if (card.dataset.repoBound === '1') return;
    card.dataset.repoBound = '1';
    const open = () => openDrawer(card.dataset.repo);
    card.addEventListener('click', open);
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); }
    });
  });
}

function bindRouteInteractions() {
  document.querySelectorAll('#main .project-filter-tabs[data-liquid-bottom-tabs]').forEach((tabs) => {
    if (tabs.dataset.projectFilterBound === '1') return;
    tabs.dataset.projectFilterBound = '1';
    bindLiquidBottomTabs(tabs);
    tabs.addEventListener('liquidtabs:change', (event) => {
      const category = event.detail?.tabId;
      if (!category || !CATEGORIES.includes(category) || category === activeFilter) return;
      activeFilter = category;
      updateProjectGrid();
    });
  });
  bindProjectCards();
  document.querySelector('#main [data-glass-test-close]')?.addEventListener('click', () => navigateSpa('home'));
}

function bindGlobalInteractions() {
  if (document.documentElement.dataset.spaBound === '1') return;
  document.documentElement.dataset.spaBound = '1';

  document.querySelector('[data-drawer-backdrop]')?.addEventListener('click', closeDrawer);
  document.querySelector('[data-drawer-close]')?.addEventListener('click', closeDrawerAfterButtonMotion);
  document.querySelector('.skip-link')?.addEventListener('click', (event) => {
    event.preventDefault();
    document.querySelector('#main')?.focus({ preventScroll: false });
  });
  document.addEventListener('keydown', handleEscape);

  document.addEventListener('liquidtabs:navigate', (event) => {
    const next = pageFromHref(event.detail?.href);
    if (!next) return;
    event.preventDefault();
    navigateSpa(next, { syncHeader: false });
  });

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = event.target.closest('a[href]');
    if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
    const next = pageFromHref(anchor.getAttribute('href'));
    if (!next) return;
    event.preventDefault();
    navigateSpa(next, { syncHeader: true });
  });

  const locationRoute = () => {
    const next = pageFromLocation();
    if (next !== page) navigateSpa(next, { historyMode: 'none', syncHeader: true, scrollToTop: false });
  };
  window.addEventListener('popstate', locationRoute);
  window.addEventListener('hashchange', locationRoute);
}

function handleEscape(event) {
  if (!drawerRepo) return;
  if (event.key === 'Escape') { closeDrawer(); return; }
  if (event.key !== 'Tab') return;
  const drawer = document.querySelector('[data-drawer]');
  const focusable = [...(drawer?.querySelectorAll('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])') || [])];
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}

async function openDrawer(fullName) {
  const repo = repositories.find((item) => item.fullName === fullName);
  if (!repo) return;
  drawerRepo = repo;
  previousFocus = document.activeElement;
  const drawer = document.querySelector('[data-drawer]');
  const backdrop = document.querySelector('[data-drawer-backdrop]');
  const content = document.querySelector('[data-drawer-content]');
  if (!drawer || !backdrop || !content) return;
  bindLiquidButtons(drawer);
  destroyLiquidButtonsWithin(content);
  content.innerHTML = renderDrawer(repo, { loading: true });
  await hydrateLiquidGlass(content);
  bindLiquidButtons(content);
  drawer.classList.add('is-open');
  backdrop.classList.add('is-open');
  drawer.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  // The close button uses the shared top-level optical proxy. Its rectangle is
  // synchronized by the LiquidButton controller during ancestor transforms;
  // backdrop pixels remain a real live capture rather than a copied wallpaper.
  await new Promise((resolve) => requestAnimationFrame(resolve));
  watchDrawerTransform(drawer);
  drawer.querySelector('[data-drawer-close]')?.focus();

  const [readmeResult, languagesResult] = await Promise.allSettled([fetchReadme(fullName), fetchLanguages(fullName)]);
  if (drawerRepo?.fullName !== fullName) return;
  let readme = '';
  let languages = {};
  if (readmeResult.status === 'fulfilled') {
    try { readme = decodeBase64Utf8(readmeResult.value.data.content || ''); } catch { readme = ''; }
  }
  if (languagesResult.status === 'fulfilled') languages = languagesResult.value.data || {};
  destroyLiquidButtonsWithin(content);
  destroyLiquidGlassWithin(content);
  content.innerHTML = renderDrawer(repo, { readme, languages, loading: false });
  await hydrateLiquidGlass(content);
  bindLiquidButtons(content);
}

let drawerClosePending = false;

async function closeDrawerAfterButtonMotion(event) {
  event?.preventDefault?.();
  if (drawerClosePending || !drawerRepo) return;
  drawerClosePending = true;
  const button = document.querySelector('[data-drawer-close]');
  try {
    // A fast click may happen within one frame, before the press spring becomes
    // visible. The shared LiquidButton completes a real activation pulse and
    // only resolves after the release is stably at rest.
    const controller = button?._liquidButtonController;
    if (controller?.completeActivationAndWait) {
      await controller.completeActivationAndWait({ timeout: 1700, minimumPeak: 0.72 });
    } else {
      await controller?.waitForRest?.({ timeout: 1400, stableFrames: 3 });
    }
  } finally {
    drawerClosePending = false;
  }
  if (drawerRepo) closeDrawer();
}

function closeDrawer() {
  drawerRepo = null;
  const drawerElement = document.querySelector('[data-drawer]');
  const drawerContent = document.querySelector('[data-drawer-content]');
  const focusToRestore = previousFocus;
  previousFocus = null;

  if (drawerContent) {
    destroyLiquidButtonsWithin(drawerContent);
    destroyLiquidGlassWithin(drawerContent);
  }
  document.querySelector('[data-drawer-backdrop]')?.classList.remove('is-open');
  drawerElement?.setAttribute('aria-hidden', 'true');

  if (!drawerElement) {
    document.body.style.overflow = '';
    if (focusToRestore instanceof HTMLElement && focusToRestore.isConnected) focusToRestore.focus();
    return;
  }

  // Keep the close button's real lens alive while the Drawer slides out. The old
  // code suspended it at the first closing frame, which visibly turned it into a
  // plain surface and also froze its sampled backdrop at the old coordinate.
  drawerElement.classList.remove('is-open');
  watchDrawerTransform(drawerElement, {
    onDone: () => {
      drawerElement.querySelector('[data-drawer-close]')?._liquidButtonController?.destroy?.();
      document.body.style.overflow = '';
      if (focusToRestore instanceof HTMLElement && focusToRestore.isConnected) focusToRestore.focus();
    },
  });
}

async function hydrateCurrentView(serial = routeSerial) {
  const main = document.querySelector('#main');
  if (!main || serial !== routeSerial) return;
  prepareReadabilityGlass(main);
  await hydrateLiquidGlass(main);
  if (serial !== routeSerial) return;
  bindLiquidButtons(main);
  if (page === 'glass-ui') bindGlassControls();
  if (page === 'settings') bindSettingsPage(main);
  initReveal();
}

function renderCurrentViewWithoutTransition() {
  const main = document.querySelector('#main');
  if (!main) return;
  destroyLiquidButtonsWithin(main);
  destroyLiquidGlassWithin(main);
  main.innerHTML = pageBody();
  bindRouteInteractions();
  hydrateCurrentView();
}

async function navigateSpa(next, {
  historyMode = 'push',
  syncHeader = true,
  scrollToTop = true,
} = {}) {
  if (!routeMeta[next]) next = 'home';
  if (next === page) return;
  const serial = ++routeSerial;
  closeDrawer();

  if (historyMode === 'push') history.pushState({ page: next }, '', routeHref(next));
  else if (historyMode === 'replace') history.replaceState({ page: next }, '', routeHref(next));

  if (syncHeader) {
    const tabs = document.querySelector('.site-nav__tabs[data-liquid-bottom-tabs]');
    setLiquidBottomTabsSelected(tabs, next, { animate: true });
  }

  const main = document.querySelector('#main');
  const swap = () => {
    if (serial !== routeSerial || !main) return;
    destroyLiquidButtonsWithin(main);
    destroyLiquidGlassWithin(main);
    page = next;
    main.innerHTML = pageBody();
    // Route transitions already provide the entrance motion. Mark reveal nodes
    // visible before the new-view snapshot so we do not crossfade into an
    // intentionally invisible IntersectionObserver state.
    main.querySelectorAll('.reveal').forEach((node) => {
      node.dataset.revealBound = '1';
      node.classList.add('is-visible');
    });
    updateMetadata();
    syncMobileNavbar(page);
    bindRouteInteractions();
  };

  if (document.startViewTransition && main) {
    const transition = document.startViewTransition(swap);
    try { await transition.updateCallbackDone; } catch {}
  } else {
    swap();
  }

  if (serial !== routeSerial) return;
  await hydrateCurrentView(serial);
  ensureDataForPage(page);
  if (scrollToTop && page !== 'glass-test') requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }));
}

function ensureRepos() {
  if (repoPromise || repoState === 'ready' || repoState === 'stale') return repoPromise;
  repoState = 'loading';
  repoPromise = fetchRepositories()
    .then((result) => {
      repositories = sortRepositories(result.data.filter((repo) => !repo.private && repo.name !== '.github').map(normalizeRepository));
      repoState = result.stale ? 'stale' : 'ready';
    })
    .catch(() => { repoState = 'error'; })
    .finally(() => {
      repoPromise = null;
      if (needsRepos()) renderCurrentViewWithoutTransition();
    });
  return repoPromise;
}

function ensureActivity() {
  if (activityPromise || activityState === 'ready') return activityPromise;
  activityState = 'loading';
  activityPromise = fetchOrgActivity()
    .then((result) => {
      activity = Array.isArray(result.data) ? result.data : [];
      activityState = 'ready';
    })
    .catch(() => { activityState = 'error'; })
    .finally(() => {
      activityPromise = null;
      if (needsActivity()) renderCurrentViewWithoutTransition();
    });
  return activityPromise;
}

function ensureDataForPage(target = page) {
  if (needsRepos(target)) ensureRepos();
  if (needsActivity(target)) ensureActivity();
}

async function boot() {
  if (!location.hash) history.replaceState({ page }, '', routeHref(page));
  mountShell();
  preloadLiquidGlass().catch(() => {});
  prepareReadabilityGlass(document);
  await initLiquidGlass();
  bindLiquidButtons(document);
  if (page === 'glass-ui') bindGlassControls();
  if (page === 'settings') bindSettingsPage(document.querySelector('#main'));
  ensureDataForPage(page);
}

boot();

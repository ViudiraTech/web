import { icons } from '../utils/icons.js';
import { liquidBottomTabs, bindLiquidBottomTabs } from './liquid-bottom-tabs.js';
import { activateLiquidGlassElement, suspendLiquidGlassElement } from '../glass/liquid-glass.js';
import { routeHref } from '../router/routes.js';

const links = [
  ['home', '首页'],
  ['projects', '项目'],
  ['glass-ui', '控件'],
  ['community', '社区'],
  ['activity', '动态'],
  ['about', '关于'],
  ['settings', '设置'],
];

export function navbar(current = 'home') {
  const navItems = [
    ...links.map(([id, label]) => ({ id, label, href: routeHref(id), className: 'site-nav__tab' })),
    { id: 'github', label: 'GitHub', href: 'https://github.com/ViudiraTech', target: '_blank', rel: 'noreferrer', className: 'site-nav__tab site-nav__tab--github' },
  ];
  const mobileLinks = links.map(([id, label]) => `<a href="${routeHref(id)}" data-spa-route="${id}"${id === current ? ' class="is-current" aria-current="page"' : ''}><span>${label}</span>${icons.arrow(15)}</a>`).join('');

  return `
    <nav class="site-nav" aria-label="主导航" data-glass-settings-scope="site">
      <span class="site-nav__backplate liquid-glass" data-glass-preset="header-backplate" data-glass-live="true" data-glass-keep-active="true" aria-hidden="true"></span>
      <div class="site-nav__content">
        <a class="brand" href="${routeHref('home')}" data-spa-route="home" aria-label="ViudiraTech 首页">
          <img src="./assets/logo-mark.svg" alt="" />
          <span>ViudiraTech</span>
        </a>
        ${liquidBottomTabs({
          items: navItems,
          selected: current,
          className: 'site-nav__tabs',
          mode: 'navigation',
          ariaLabel: 'ViudiraTech 主导航',
          live: true,
          surfaceOnly: false,
          navigateOnDrag: true,
          // Backdrop Catalog light-theme selected capsule: Black 10%
          // fading to Black 3% while pressed. Keep 60% of authored alpha as
          // an accessibility/selection floor when site transparency is maxed.
          indicatorSurfaceRgb: '0 0 0',
          indicatorIdleAlpha: 0.10,
          indicatorPressedAlpha: 0.03,
          indicatorSurfaceFloorRatio: 0.60,
        })}
        <button class="icon-button nav-menu-btn" type="button" aria-label="打开导航菜单" aria-expanded="false" data-menu-toggle>${icons.menu(20)}</button>
      </div>
    </nav>
    <div class="mobile-menu liquid-glass glass-shell" data-mobile-menu data-glass-preset="mobile-menu" data-glass-settings-scope="site" data-glass-defer="true">
      <div class="glass-content mobile-menu__content">
        ${mobileLinks}
        <a href="https://github.com/ViudiraTech" target="_blank" rel="noreferrer"><span>GitHub</span>${icons.external(15)}</a>
      </div>
    </div>`;
}

export function bindNavbar() {
  const toggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-mobile-menu]');
  const headerTabs = document.querySelector('.site-nav__tabs[data-liquid-bottom-tabs]');
  const update = () => document.querySelector('.site-nav')?.classList.toggle('is-scrolled', window.scrollY > 28);

  if (!document.documentElement.dataset.navScrollBound) {
    document.documentElement.dataset.navScrollBound = '1';
    window.addEventListener('scroll', update, { passive: true });
  }
  update();
  bindLiquidBottomTabs(headerTabs);

  toggle?.addEventListener('click', () => {
    const open = menu?.classList.toggle('is-open') || false;
    if (menu) {
      if (open) activateLiquidGlassElement(menu);
      else suspendLiquidGlassElement(menu);
    }
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? '关闭导航菜单' : '打开导航菜单');
  });
  menu?.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      menu.classList.remove('is-open');
      suspendLiquidGlassElement(menu);
      toggle?.setAttribute('aria-expanded', 'false');
    }
  });
}

export function syncMobileNavbar(current) {
  document.querySelectorAll('[data-mobile-menu] [data-spa-route]').forEach((link) => {
    const active = link.dataset.spaRoute === current;
    link.classList.toggle('is-current', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

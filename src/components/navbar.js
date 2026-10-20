import { icons } from '../utils/icons.js';
import { liquidBottomTabs, bindLiquidBottomTabs } from './liquid-bottom-tabs.js';
import { activateLiquidGlassElement, suspendLiquidGlassElement } from '../glass/liquid-glass.js';
import { isSiteLiquidEnabled } from '../glass/site-preferences.js';
import { routeHref } from '../router/routes.js';
import { liquidButton } from './liquid-button.js';
import { glassSwitch } from './site-action.js';

const links = [
  ['home', '首页'],
  ['projects', '项目'],
  ['about', '关于我们'],
  ['community', '社区'],
  ['activity', '动态'],
];

function brand() {
  return `<a class="brand" href="${routeHref('home')}" data-spa-route="home" aria-label="ViudiraTech 首页">
    <img src="./assets/logo-mark.svg" alt="" />
    <span>ViudiraTech</span>
  </a>`;
}

function mobileMenu(current, liquid) {
  const items = links.map(([id, label]) => `<a href="${routeHref(id)}" data-spa-route="${id}"${id === current ? ' class="is-current" aria-current="page"' : ''}><span>${label}</span>${icons.arrow(15)}</a>`).join('');
  const glass = liquid
    ? ' class="mobile-menu liquid-glass glass-shell" data-glass-preset="mobile-menu" data-glass-settings-scope="site" data-glass-defer="true"'
    : ' class="mobile-menu"';
  return `<div${glass} data-mobile-menu>
      <div class="glass-content mobile-menu__content">
        ${items}
        <a href="https://github.com/ViudiraTech" target="_blank" rel="noreferrer"><span>GitHub</span>${icons.external(15)}</a>
        ${glassSwitch({ className: 'glass-switch--menu' })}
      </div>
    </div>`;
}

// Flat, paper-like header used when Liquid Glass is off.
function plainNavbar(current) {
  const items = links.map(([id, label]) => `<a class="site-header__link${id === current ? ' is-current' : ''}" href="${routeHref(id)}" data-spa-route="${id}"${id === current ? ' aria-current="page"' : ''}>${label}</a>`).join('');
  return `
    <header class="site-header" data-site-header>
      <div class="container site-header__inner">
        ${brand()}
        <nav class="site-header__links" aria-label="主导航">${items}</nav>
        <div class="site-header__tools">
          <a class="site-header__icon" href="https://github.com/ViudiraTech" target="_blank" rel="noreferrer" aria-label="ViudiraTech GitHub">${icons.github(18)}</a>
          ${glassSwitch()}
          <button class="site-header__menu" type="button" aria-label="打开导航菜单" aria-expanded="false" data-menu-toggle>${icons.menu(20)}</button>
        </div>
      </div>
    </header>
    ${mobileMenu(current, false)}`;
}

// Liquid Glass header: shared backplate + LiquidBottomTabs.
function liquidNavbar(current) {
  const navItems = [
    ...links.map(([id, label]) => ({ id, label, href: routeHref(id), className: 'site-nav__tab' })),
    { id: 'github', label: 'GitHub', href: 'https://github.com/ViudiraTech', target: '_blank', rel: 'noreferrer', className: 'site-nav__tab site-nav__tab--github' },
  ];
  return `
    <nav class="site-nav" aria-label="主导航" data-glass-settings-scope="site">
      <span class="site-nav__backplate liquid-glass" data-glass-preset="header-backplate" data-glass-live="true" data-glass-keep-active="true" aria-hidden="true"></span>
      <div class="site-nav__content">
        ${brand()}
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
        ${glassSwitch({ className: 'glass-switch--nav' })}
        ${liquidButton({ label: icons.menu(20), preset: 'catalog-button-surface', className: 'catalog-icon-button nav-menu-btn', backdrop: 'ambient', inlineLive: true, attributes: 'aria-label="打开导航菜单" aria-expanded="false" data-menu-toggle data-glass-settings-scope="site"' })}
      </div>
    </nav>
    ${mobileMenu(current, true)}`;
}

export function navbar(current = 'home') {
  return isSiteLiquidEnabled() ? liquidNavbar(current) : plainNavbar(current);
}

export function bindNavbar() {
  const toggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-mobile-menu]');
  const headerTabs = document.querySelector('.site-nav__tabs[data-liquid-bottom-tabs]');
  const update = () => {
    const scrolled = window.scrollY > 28;
    document.querySelector('.site-nav')?.classList.toggle('is-scrolled', scrolled);
    document.querySelector('[data-site-header]')?.classList.toggle('is-scrolled', scrolled);
  };

  if (!document.documentElement.dataset.navScrollBound) {
    document.documentElement.dataset.navScrollBound = '1';
    window.addEventListener('scroll', update, { passive: true });
  }
  update();
  if (headerTabs) bindLiquidBottomTabs(headerTabs);

  const setOpen = (open) => {
    if (!menu) return;
    menu.classList.toggle('is-open', open);
    if (menu.classList.contains('liquid-glass')) {
      if (open) activateLiquidGlassElement(menu);
      else suspendLiquidGlassElement(menu);
    }
    toggle?.setAttribute('aria-expanded', String(open));
    toggle?.setAttribute('aria-label', open ? '关闭导航菜单' : '打开导航菜单');
  };

  toggle?.addEventListener('click', () => setOpen(!menu?.classList.contains('is-open')));
  menu?.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });
}

export function syncMobileNavbar(current) {
  document.querySelectorAll('[data-mobile-menu] [data-spa-route], .site-header__links [data-spa-route]').forEach((link) => {
    const active = link.dataset.spaRoute === current;
    link.classList.toggle('is-current', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

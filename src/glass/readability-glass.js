import { getSiteGlassPreferences } from './site-preferences.js';
import { activateLiquidGlassElement, deactivateLiquidGlassElement } from './liquid-glass.js';

export const READABILITY_SURFACE_SELECTOR = [
  '.hero-kicker',
  '.hero h1',
  '.hero-lead',
  '.hero-copy',
  '.section-head .eyebrow',
  '.section-head .section-title',
  '.section-head .section-copy',
  '.page-intro .eyebrow',
  '.page-intro h1',
  '.page-intro__copy',
  '.about-copy__lead .eyebrow',
  '.about-copy__lead h2',
  '.about-copy__lead p',
  '.activity-intro .eyebrow',
  '.activity-intro .section-title',
  '.activity-intro .section-copy',
  '.community-note',
  '.settings-hero .eyebrow',
  '.settings-hero h1',
  '.settings-hero p',
  '.catalog-hero .eyebrow',
  '.catalog-hero h1',
  '.catalog-hero p',
  '.about-principles>div',
  '.stat',
  '.activity-item',
  '.settings-control__copy',
  '.settings-isolation-note',
  '.control-doc-copy',
  '.join-panel>div:first-child',
  '.footer-copy',
  '.footer-brand',
].join(',');

function surfacesWithin(root = document) {
  const found = [];
  if (root instanceof Element && root.matches(READABILITY_SURFACE_SELECTOR)) found.push(root);
  root?.querySelectorAll?.(READABILITY_SURFACE_SELECTOR).forEach((element) => found.push(element));
  return [...new Set(found)];
}

function markLiquid(element) {
  if (element.dataset.readabilityLiquid === '1') return;
  element.dataset.readabilityLiquid = '1';
  element.classList.add('readability-surface', 'readability-liquid', 'liquid-glass');
  element.dataset.glassPreset = 'readability-full';
  // Use the same stable foreground SVG lens path as LiquidButton. The sampled
  // wallpaper is aligned by a native root ScrollTimeline, so there is no JS
  // background-position chasing during scroll.
  element.dataset.glassBackdrop = 'ambient';
  element.dataset.glassSampleMode = 'scroll-timeline';
  element.dataset.glassSettingsScope = 'site';
}

function unmarkLiquid(element) {
  if (element.dataset.readabilityLiquid !== '1') return;
  deactivateLiquidGlassElement(element);
  delete element.dataset.readabilityLiquid;
  delete element.dataset.glassPreset;
  delete element.dataset.glassBackdrop;
  delete element.dataset.glassSampleMode;
  delete element.dataset.glassLive;
  delete element.dataset.glassSettingsScope;
  element.classList.remove('readability-liquid', 'liquid-glass');
  element.classList.add('readability-surface');
}

export function prepareReadabilityGlass(root = document) {
  const enabled = getSiteGlassPreferences().readabilityLiquid;
  const surfaces = surfacesWithin(root);
  for (const element of surfaces) {
    element.classList.add('readability-surface');
    if (enabled) markLiquid(element);
    else unmarkLiquid(element);
  }
  return surfaces;
}

export function applyReadabilityGlassMode(root = document) {
  const enabled = getSiteGlassPreferences().readabilityLiquid;
  const surfaces = prepareReadabilityGlass(root);
  if (enabled) {
    for (const element of surfaces) activateLiquidGlassElement(element);
  }
  return surfaces;
}

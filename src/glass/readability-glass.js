import { getSiteGlassPreferences } from './site-preferences.js';
import {
  deactivateLiquidGlassElement,
  hydrateLiquidGlass,
} from './liquid-glass.js';

export const READABILITY_SURFACE_SELECTOR = [
  // Only the lightweight plates that were introduced specifically to keep
  // copy readable over the photographic wallpaper belong to this preference.
  // Product/project/network cards keep their own authored material and never
  // get promoted by the readability toggle.
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
  '.settings-control__copy',
  '.settings-isolation-note',
  '.control-doc-copy',
  '.join-panel>div:first-child',
  '.footer-copy',
  '.footer-brand',
].join(',');

// Full-readability material policy:
// - visible surfaces remain full Liquid Glass while scrolling;
// - the Liquid Glass engine's IntersectionObserver alone suspends elements that
//   are genuinely off-screen;
// - there is deliberately no global "scrolling => frost" downgrade. Native
//   ScrollTimeline/local sampling keeps the scene aligned without changing the
//   material under the user's eyes.
const knownSurfaces = new Set();

function surfacesWithin(root = document) {
  const found = [];
  if (root instanceof Element && root.matches(READABILITY_SURFACE_SELECTOR)) found.push(root);
  root?.querySelectorAll?.(READABILITY_SURFACE_SELECTOR).forEach((element) => found.push(element));
  return [...new Set(found)];
}

function markLiquid(element) {
  knownSurfaces.add(element);
  element.classList.add('readability-surface', 'readability-liquid', 'liquid-glass');
  element.dataset.readabilityLiquid = '1';
  element.dataset.readabilityPolicy = 'persistent';
  element.dataset.glassPreset = 'readability-full';
  element.dataset.glassBackdrop = 'ambient';
  element.dataset.glassSampleMode = 'scroll-timeline';
  element.dataset.glassSettingsScope = 'site';
}

function unmarkLiquid(element) {
  knownSurfaces.delete(element);
  deactivateLiquidGlassElement(element);
  delete element.dataset.readabilityLiquid;
  delete element.dataset.readabilityPolicy;
  delete element.dataset.glassPreset;
  delete element.dataset.glassBackdrop;
  delete element.dataset.glassSampleMode;
  delete element.dataset.glassLive;
  delete element.dataset.glassSettingsScope;
  element.classList.remove('readability-liquid', 'liquid-glass');
  element.classList.add('readability-surface');
}

function prepareSurface(element, enabled) {
  element.classList.add('readability-surface');
  if (enabled) markLiquid(element);
  else unmarkLiquid(element);
}

export function prepareReadabilityGlass(root = document) {
  const enabled = getSiteGlassPreferences().readabilityLiquid;
  const surfaces = surfacesWithin(root);
  for (const element of surfaces) prepareSurface(element, enabled);
  return surfaces;
}

export function applyReadabilityGlassMode(root = document) {
  const enabled = getSiteGlassPreferences().readabilityLiquid;
  const surfaces = prepareReadabilityGlass(root);

  if (!enabled) {
    // Remove any stale motion marker left by older builds so CSS cannot silently
    // fall back to the former scrolling frost mode after a hot reload/update.
    delete document.documentElement.dataset.readabilityMotion;
    if (root === document) {
      for (const element of [...knownSurfaces]) unmarkLiquid(element);
      knownSurfaces.clear();
    }
    return surfaces;
  }

  delete document.documentElement.dataset.readabilityMotion;
  // The engine lazily creates near-viewport controllers and suspends only truly
  // off-screen ones. Scrolling no longer changes the selected material.
  hydrateLiquidGlass(root);
  return surfaces;
}

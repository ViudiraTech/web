const STORAGE_KEY = 'viudiratech:glass-settings:v1';
export const DEFAULT_SITE_GLASS_PREFERENCES = Object.freeze({
  transparency: 50,
  blur: 50,
  readabilityLiquid: false,
  // Master switch for Liquid Glass on the public site. Off by default: the site
  // renders as a flat, paper-like reading surface and the SVG engine only runs
  // on pages that are about glass (Liquid UI Lab, Glass Test, Settings preview).
  liquid: false,
});

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
let current = null;

function syncCssPreferences(values) {
  if (typeof document === 'undefined') return;
  const transparencyFactor = 2 - (values.transparency / 50);
  const drawerAlpha = clamp(0.78 * transparencyFactor, 0.18, 0.94);
  const drawerBlur = Math.max(0, 12 * (values.blur / 50));
  document.documentElement.style.setProperty('--site-drawer-frost-alpha', drawerAlpha.toFixed(3));
  document.documentElement.style.setProperty('--site-drawer-frost-blur', `${drawerBlur.toFixed(2)}px`);
  document.documentElement.dataset.readabilityGlass = values.readabilityLiquid ? 'liquid' : 'frosted';
  document.documentElement.dataset.siteGlass = values.liquid ? 'on' : 'off';
}

function normalize(input = {}) {
  return {
    transparency: clamp(Number(input.transparency ?? DEFAULT_SITE_GLASS_PREFERENCES.transparency) || 0, 0, 100),
    blur: clamp(Number(input.blur ?? DEFAULT_SITE_GLASS_PREFERENCES.blur) || 0, 0, 100),
    readabilityLiquid: input.readabilityLiquid === true || input.readabilityLiquid === 'true',
    liquid: input.liquid === true || input.liquid === 'true',
  };
}

function load() {
  if (current) return current;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    current = raw ? normalize(JSON.parse(raw)) : { ...DEFAULT_SITE_GLASS_PREFERENCES };
  } catch {
    current = { ...DEFAULT_SITE_GLASS_PREFERENCES };
  }
  syncCssPreferences(current);
  return current;
}

export function getSiteGlassPreferences() {
  return { ...load() };
}

export function isSiteLiquidEnabled() {
  return load().liquid;
}

export function setSiteGlassPreferences(next = {}) {
  current = normalize({ ...load(), ...next });
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(current)); } catch {}
  syncCssPreferences(current);
  window.dispatchEvent(new CustomEvent('siteglass:change', { detail: { ...current } }));
  return { ...current };
}

export function resetSiteGlassPreferences() {
  // Reset restores material values only; the master on/off switch is kept.
  current = { ...DEFAULT_SITE_GLASS_PREFERENCES, liquid: load().liquid };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(current)); } catch {}
  syncCssPreferences(current);
  window.dispatchEvent(new CustomEvent('siteglass:change', { detail: { ...current } }));
  return { ...current };
}

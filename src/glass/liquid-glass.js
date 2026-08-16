import { detectGlassProfile } from './performance.js';
import { markGlassFallback } from './fallback.js';
import { getSiteGlassPreferences } from './site-preferences.js';

// Backdrop Catalog-inspired SVG/backdrop renderer.
//
// Performance architecture:
// - one shared hidden SVG <defs> root for every filter;
// - cached displacement PNGs keyed by geometry/preset;
// - static Catalog buttons/panels filter a local background sample instead of
//   forcing a live backdrop capture;
// - dynamic thumbs enable the SVG filter only while the glass is actually
//   transparent/interactive;
// - blur is an SVG primitive while the lens is active, so animation does not
//   rewrite the whole backdrop-filter string every frame;
// - off-screen Catalog controls are initialized lazily.

const SVG_NS = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';
const controllers = [];
const controllerMap = new WeakMap();
const pendingStateMap = new WeakMap();
const mapCache = new Map();
let preloadPromise = null;
let sharedSvg = null;
let sharedDefs = null;
let lazyObserver = null;
let activityObserver = null;
let currentProfile = null;
let localSampleSyncRaf = 0;
let localSampleSyncBound = false;
let localSampleLayoutObserver = null;
let rootScrollTimelineSupport = null;

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function supportsRootScrollTimeline() {
  if (rootScrollTimelineSupport != null) return rootScrollTimelineSupport;
  rootScrollTimelineSupport = Boolean(
    window.CSS?.supports?.('animation-timeline', 'scroll(root block)')
    || window.CSS?.supports?.('animation-timeline: scroll(root block)')
  );
  return rootScrollTimelineSupport;
}

function refreshScrollTimelineSceneGeometry() {
  for (const controller of controllers) {
    if (!controller?.scrollTimelineSample || controller.suspended || !controller.element?.isConnected) continue;
    controller.updateLocalLayers();
  }
}

function ensureScrollTimelineLayoutSync() {
  if (localSampleLayoutObserver || !('ResizeObserver' in window)) return;
  localSampleLayoutObserver = new ResizeObserver(() => {
    requestAnimationFrame(refreshScrollTimelineSceneGeometry);
  });
  localSampleLayoutObserver.observe(document.body);
  window.addEventListener('resize', refreshScrollTimelineSceneGeometry, { passive: true });
  window.visualViewport?.addEventListener('resize', refreshScrollTimelineSceneGeometry, { passive: true });
}

// Local-sampled glass is a foreground copy of another element's background.
// Any viewport movement (page scroll, nested scrolling container, browser UI
// resize/zoom) changes which scene pixels sit behind a fixed button even when
// that button's own transform/springs are idle. Coalesce those events into one
// rAF and only touch visible local-sample controllers.
function refreshVisibleLocalBackdropSamples() {
  localSampleSyncRaf = 0;
  const vw = window.innerWidth || document.documentElement.clientWidth || 0;
  const vh = window.innerHeight || document.documentElement.clientHeight || 0;
  const margin = 120;
  for (const controller of controllers) {
    if (!controller?.localSample || controller.suspended || !controller.element?.isConnected) continue;
    // CSS-fixed samples are already viewport-locked by the browser; they do not
    // need the historical JS scroll/resize background-position synchronizer.
    if (controller.element.dataset.glassSampleMode === 'fixed-css' || controller.scrollTimelineSample) continue;
    const rect = controller.element.getBoundingClientRect();
    if (rect.bottom < -margin || rect.top > vh + margin || rect.right < -margin || rect.left > vw + margin) continue;
    controller.updateLocalLayers();
  }
}

function scheduleLocalBackdropSampleSync() {
  if (localSampleSyncRaf) return;
  localSampleSyncRaf = requestAnimationFrame(refreshVisibleLocalBackdropSamples);
}

function ensureLocalBackdropSampleSync() {
  if (localSampleSyncBound) return;
  localSampleSyncBound = true;
  // Capture scroll so nested scrolling surfaces (drawers/panels) are covered too.
  document.addEventListener('scroll', scheduleLocalBackdropSampleSync, { passive: true, capture: true });
  window.addEventListener('scroll', scheduleLocalBackdropSampleSync, { passive: true });
  window.addEventListener('resize', scheduleLocalBackdropSampleSync, { passive: true });
  window.visualViewport?.addEventListener('scroll', scheduleLocalBackdropSampleSync, { passive: true });
  window.visualViewport?.addEventListener('resize', scheduleLocalBackdropSampleSync, { passive: true });
}

function ensureSharedDefs() {
  if (sharedDefs?.isConnected) return sharedDefs;
  sharedSvg = document.createElementNS(SVG_NS, 'svg');
  sharedSvg.setAttribute('aria-hidden', 'true');
  sharedSvg.setAttribute('width', '0');
  sharedSvg.setAttribute('height', '0');
  sharedSvg.classList.add('liquid-filter-defs');
  sharedSvg.style.cssText = 'position:fixed;inline-size:0;block-size:0;overflow:hidden;pointer-events:none;';
  sharedDefs = document.createElementNS(SVG_NS, 'defs');
  sharedSvg.append(sharedDefs);
  document.body.append(sharedSvg);
  return sharedDefs;
}

function sdRoundedRect(x, y, halfW, halfH, radius) {
  const qx = Math.abs(x) - (halfW - radius);
  const qy = Math.abs(y) - (halfH - radius);
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - radius;
  const inside = Math.min(Math.max(qx, qy), 0);
  return outside + inside;
}

function gradSdRoundedRect(x, y, halfW, halfH, radius) {
  const qx = Math.abs(x) - (halfW - radius);
  const qy = Math.abs(y) - (halfH - radius);
  let gx;
  let gy;
  if (qx >= 0 || qy >= 0) {
    gx = Math.max(qx, 0);
    gy = Math.max(qy, 0);
    const len = Math.hypot(gx, gy) || 1;
    gx /= len;
    gy /= len;
  } else if (qx >= qy) {
    gx = 1;
    gy = 0;
  } else {
    gx = 0;
    gy = 1;
  }
  return {
    x: (x < 0 ? -1 : 1) * gx,
    y: (y < 0 ? -1 : 1) * gy,
  };
}

function circleMap(x) {
  const t = clamp(x, 0, 1);
  return 1 - Math.sqrt(Math.max(0, 1 - t * t));
}

function supportsSvgBackdropFilter() {
  if (!window.CSS?.supports) return false;
  return CSS.supports('backdrop-filter', 'url("#lg-test")')
    || CSS.supports('-webkit-backdrop-filter', 'url("#lg-test")');
}

const LOCAL_STATIC_PRESETS = new Set([
  // Catalog demo controls sample their photographic canvas into a foreground
  // layer and apply the SVG SDF lens with `filter:url(...)`. This is more
  // deterministic in Chromium than `backdrop-filter:url(...)` and preserves
  // the exact 12/24 LiquidButton lens without increasing its strength.
  'catalog-button',
  'catalog-button-surface',
  'catalog-button-blue',
  'catalog-button-orange',
  'catalog-tabs-panel',
  // Full readability/Dialog surfaces use the same deterministic foreground SVG
  // pipeline as LiquidButton. Their wallpaper sample is viewport-fixed in CSS.
  'readability-full',
  'catalog-dialog',
]);

function makeLayer(className) {
  const layer = document.createElement('span');
  layer.className = className;
  layer.setAttribute('aria-hidden', 'true');
  return layer;
}

function presetFor(element, profile) {
  const preset = element.dataset.glassPreset || 'default';
  const base = {
    mapResolution: profile.mapResolution,
    lensHeight: 12,
    lensAmount: 24,
    blur: 2,
    vibrancy: 1.06,
    brightness: 1.01,
    chromaticAberration: false,
    depthEffect: 0,
    surfaceRgb: '255 255 255',
    surfaceAlpha: 0,
    tintRgb: '255 255 255',
    tintAlpha: 0,
    highlightAlpha: 1,
    innerShadowAlpha: 0.08,
    outerShadowAlpha: 0.07,
    intensity: 1,
  };

  const presets = {
    'header-backplate': { lensHeight: 24, lensAmount: 24, blur: 8, vibrancy: 1.08, surfaceRgb: '250 250 250', surfaceAlpha: 0.20, highlightAlpha: 1, innerShadowAlpha: 0.045, outerShadowAlpha: 0.10, mapResolution: 1 },
    'mobile-menu': { lensHeight: 20, lensAmount: 22, blur: 7, surfaceAlpha: 0.28, highlightAlpha: 0.78 },

    'catalog-button': { lensHeight: 12, lensAmount: 24, blur: 2, vibrancy: 1.08, surfaceAlpha: 0, highlightAlpha: 1, outerShadowAlpha: 0.08, mapResolution: Math.max(profile.mapResolution, 0.82) },
    'catalog-button-surface': { lensHeight: 12, lensAmount: 24, blur: 2, vibrancy: 1.08, surfaceAlpha: 0.3, highlightAlpha: 1, mapResolution: Math.max(profile.mapResolution, 0.82) },
    'catalog-button-blue': { lensHeight: 12, lensAmount: 24, blur: 2, vibrancy: 1.04, tintRgb: '0 136 255', tintAlpha: 0.75, highlightAlpha: 1, innerShadowAlpha: 0.06, mapResolution: Math.max(profile.mapResolution, 0.82) },
    'catalog-button-orange': { lensHeight: 12, lensAmount: 24, blur: 2, vibrancy: 1.04, tintRgb: '255 141 40', tintAlpha: 0.75, highlightAlpha: 1, innerShadowAlpha: 0.06, mapResolution: Math.max(profile.mapResolution, 0.82) },

    // Idle thumb is opaque white, so running a backdrop blur behind it is wasted.
    // The blur/lens chain is enabled as press progresses and the surface fades.
    'catalog-toggle-thumb': { lensHeight: 5, lensAmount: 10, blur: 8, chromaticAberration: true, surfaceAlpha: 1, highlightAlpha: 0, innerShadowAlpha: 0, outerShadowAlpha: 0.05, intensity: 0, mapResolution: Math.max(profile.mapResolution, 0.82) },
    'catalog-slider-thumb': { lensHeight: 10, lensAmount: 14, blur: 8, chromaticAberration: true, surfaceAlpha: 1, highlightAlpha: 0, innerShadowAlpha: 0, outerShadowAlpha: 0.05, intensity: 0, mapResolution: Math.max(profile.mapResolution, 0.82) },

    'catalog-tabs-panel': { lensHeight: 24, lensAmount: 24, blur: 8, vibrancy: 1.08, surfaceRgb: '250 250 250', surfaceAlpha: 0.4, highlightAlpha: 1, innerShadowAlpha: 0.05, outerShadowAlpha: 0.09, mapResolution: Math.max(profile.mapResolution, 0.82) },
    'catalog-tab-indicator': { lensHeight: 10, lensAmount: 14, blur: 0, chromaticAberration: true, surfaceRgb: '0 0 0', surfaceAlpha: 0.10, highlightAlpha: 0, innerShadowAlpha: 0, outerShadowAlpha: 0, intensity: 0, mapResolution: Math.max(profile.mapResolution, 0.82) },

    // Backdrop Catalog DialogContent.kt (light theme): RoundedRectangle(48dp),
    // colorControls(brightness=.2, saturation=1.5), blur(16), lens(24,48, depth).
    'catalog-dialog': { lensHeight: 24, lensAmount: 48, blur: 16, vibrancy: 1.5, brightness: 1.2, depthEffect: 0.18, surfaceRgb: '250 250 250', surfaceAlpha: 0.60, highlightAlpha: 1, innerShadowAlpha: 0.05, outerShadowAlpha: 0.12, mapResolution: 1 },

    // Optional full-fidelity reading material. Unlike the default readability
    // plates this uses the complete local-sampled SVG lens pipeline.
    'readability-full': { lensHeight: 16, lensAmount: 32, blur: 10, vibrancy: 1.12, brightness: 1.03, depthEffect: 0.14, surfaceRgb: '248 251 250', surfaceAlpha: 0.44, highlightAlpha: 1, innerShadowAlpha: 0.055, outerShadowAlpha: 0.08, mapResolution: 1 },

    test: { lensHeight: 24, lensAmount: 32, blur: 2, chromaticAberration: true, surfaceAlpha: 0.06, mapResolution: Math.max(profile.mapResolution, 0.86) },
  };
  return { ...base, ...(presets[preset] || {}) };
}

function channelMatrix(channel) {
  if (channel === 'r') return '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0';
  if (channel === 'g') return '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0';
  return '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0';
}

function createFilter(id, chromatic) {
  const defs = ensureSharedDefs();
  const filter = document.createElementNS(SVG_NS, 'filter');
  filter.setAttribute('id', id);
  filter.setAttribute('filterUnits', 'userSpaceOnUse');
  filter.setAttribute('primitiveUnits', 'userSpaceOnUse');
  filter.setAttribute('x', '0');
  filter.setAttribute('y', '0');
  filter.setAttribute('width', '1');
  filter.setAttribute('height', '1');
  filter.setAttribute('color-interpolation-filters', 'sRGB');

  const makeImage = (name) => {
    const image = document.createElementNS(SVG_NS, 'feImage');
    image.setAttribute('x', '0');
    image.setAttribute('y', '0');
    image.setAttribute('width', '1');
    image.setAttribute('height', '1');
    image.setAttribute('preserveAspectRatio', 'none');
    image.setAttribute('result', `${name}Map`);
    filter.append(image);
    return image;
  };

  const gaussian = document.createElementNS(SVG_NS, 'feGaussianBlur');
  gaussian.setAttribute('in', 'SourceGraphic');
  gaussian.setAttribute('stdDeviation', '0');
  gaussian.setAttribute('edgeMode', 'duplicate');
  gaussian.setAttribute('result', 'blurredSource');
  filter.append(gaussian);

  const makeDisp = (name, mapName) => {
    const node = document.createElementNS(SVG_NS, 'feDisplacementMap');
    node.setAttribute('in', 'blurredSource');
    node.setAttribute('in2', `${mapName}Map`);
    node.setAttribute('xChannelSelector', 'R');
    node.setAttribute('yChannelSelector', 'G');
    node.setAttribute('scale', '0');
    node.setAttribute('result', name);
    filter.append(node);
    return node;
  };

  const nodes = { images: {}, displacements: [], gaussian };
  if (!chromatic) {
    nodes.images.base = makeImage('base');
    // Move the map before the blur primitive so all inputs are available.
    filter.insertBefore(nodes.images.base, gaussian);
    nodes.displacements.push(makeDisp('refracted', 'base'));
  } else {
    nodes.images.red = makeImage('red');
    nodes.images.green = makeImage('green');
    nodes.images.blue = makeImage('blue');
    filter.insertBefore(nodes.images.blue, gaussian);
    filter.insertBefore(nodes.images.green, nodes.images.blue);
    filter.insertBefore(nodes.images.red, nodes.images.green);
    const redDisp = makeDisp('redDisp', 'red');
    const greenDisp = makeDisp('greenDisp', 'green');
    const blueDisp = makeDisp('blueDisp', 'blue');
    nodes.displacements.push(redDisp, greenDisp, blueDisp);

    for (const [channel, input, result] of [['r', 'redDisp', 'redOnly'], ['g', 'greenDisp', 'greenOnly'], ['b', 'blueDisp', 'blueOnly']]) {
      const matrix = document.createElementNS(SVG_NS, 'feColorMatrix');
      matrix.setAttribute('in', input);
      matrix.setAttribute('type', 'matrix');
      matrix.setAttribute('values', channelMatrix(channel));
      matrix.setAttribute('result', result);
      filter.append(matrix);
    }

    const rg = document.createElementNS(SVG_NS, 'feBlend');
    rg.setAttribute('in', 'redOnly');
    rg.setAttribute('in2', 'greenOnly');
    rg.setAttribute('mode', 'screen');
    rg.setAttribute('result', 'rg');
    filter.append(rg);

    const rgb = document.createElementNS(SVG_NS, 'feBlend');
    rgb.setAttribute('in', 'rg');
    rgb.setAttribute('in2', 'blueOnly');
    rgb.setAttribute('mode', 'screen');
    rgb.setAttribute('result', 'spectral');
    filter.append(rgb);
  }

  defs.append(filter);
  return { filter, ...nodes };
}

function mapsFor(width, height, radius, config) {
  const res = clamp(config.mapResolution, 0.42, 1);
  const key = [width, height, Math.round(radius * 10), config.lensHeight, config.lensAmount, Math.round((config.depthEffect || 0) * 1000), config.chromaticAberration ? 1 : 0, Math.round(res * 100)].join(':');
  if (mapCache.has(key)) return mapCache.get(key);

  const w = clamp(Math.round(width * res), 40, 1400);
  const h = clamp(Math.round(height * res), 28, 1000);
  const halfW = width * 0.5;
  const halfH = height * 0.5;
  const r = clamp(radius, 0, Math.min(halfW, halfH));
  const gradRadius = Math.min(r * 1.5, Math.min(halfW, halfH));
  const lensHeight = Math.max(0.5, config.lensHeight);
  const amount = config.lensAmount;
  const sx = width / w;
  const sy = height / h;
  const vectorScale = Math.max(Math.abs(amount), 1);

  const names = config.chromaticAberration ? ['red', 'green', 'blue'] : ['base'];
  const stores = Object.fromEntries(names.map((name) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { alpha: false });
    return [name, { canvas, ctx, image: ctx.createImageData(w, h) }];
  }));

  const write = (store, index, dx, dy) => {
    const data = store.image.data;
    data[index] = clamp(Math.round((dx / vectorScale + 0.5) * 255), 0, 255);
    data[index + 1] = clamp(Math.round((dy / vectorScale + 0.5) * 255), 0, 255);
    data[index + 2] = 0;
    data[index + 3] = 255;
  };

  let index = 0;
  for (let py = 0; py < h; py += 1) {
    const y = (py + 0.5) * sy - halfH;
    for (let px = 0; px < w; px += 1) {
      const x = (px + 0.5) * sx - halfW;
      const sd = sdRoundedRect(x, y, halfW, halfH, r);
      let dx = 0;
      let dy = 0;
      let dispersion = 0;
      const inside = -Math.min(sd, 0);
      if (sd <= 0 && inside < lensHeight) {
        const d = circleMap(1 - inside / lensHeight) * amount;
        const grad = gradSdRoundedRect(x, y, halfW, halfH, gradRadius);
        let gx = grad.x + config.depthEffect * (x / Math.max(halfW, 1));
        let gy = grad.y + config.depthEffect * (y / Math.max(halfH, 1));
        const len = Math.hypot(gx, gy) || 1;
        gx /= len;
        gy /= len;
        dx = -d * gx;
        dy = -d * gy;
        dispersion = clamp((x * y) / Math.max(halfW * halfH, 1), -1, 1);
      }

      if (!config.chromaticAberration) {
        write(stores.base, index, dx, dy);
      } else {
        write(stores.red, index, dx * (1 + dispersion), dy * (1 + dispersion));
        write(stores.green, index, dx, dy);
        write(stores.blue, index, dx * (1 - dispersion), dy * (1 - dispersion));
      }
      index += 4;
    }
  }

  const urls = {};
  for (const [name, store] of Object.entries(stores)) {
    store.ctx.putImageData(store.image, 0, 0);
    urls[name] = store.canvas.toDataURL('image/png');
  }
  const result = { urls, vectorScale };
  mapCache.set(key, result);
  if (mapCache.size > 96) mapCache.delete(mapCache.keys().next().value);
  return result;
}

function setHref(image, url) {
  image.setAttribute('href', url);
  image.setAttributeNS(XLINK_NS, 'href', url);
}

class LiquidBackdrop {
  constructor(element, profile) {
    this.element = element;
    this.profile = profile;
    this.config = presetFor(element, profile);
    if (element.dataset.glassSurfaceRgb) this.config.surfaceRgb = element.dataset.glassSurfaceRgb;
    if (element.dataset.glassSurfaceAlpha != null && element.dataset.glassSurfaceAlpha !== '') {
      const alpha = Number(element.dataset.glassSurfaceAlpha);
      if (Number.isFinite(alpha)) this.config.surfaceAlpha = alpha;
    }
    this.surfaceOnly = element.dataset.glassSurfaceOnly === 'true';
    this.surfaceFloorRatio = clamp(Number(element.dataset.glassSurfaceFloorRatio || 0), 0, 1);
    this.siteSettingsScoped = element.dataset.glassSettingsScope === 'site' || Boolean(element.closest('[data-glass-settings-scope="site"]'));
    this.suspended = false;
    this.preset = element.dataset.glassPreset || 'default';
    const localSampleEligible = LOCAL_STATIC_PRESETS.has(this.preset) && element.dataset.glassLive !== 'true';
    const requestedBackdrop = element.dataset.glassBackdrop || '';
    const explicitBackdrop = requestedBackdrop === 'ambient' ? document.querySelector('#ambient') : null;
    this.localBackdrop = localSampleEligible ? (element.closest('.catalog-canvas') || explicitBackdrop) : null;
    this.localSample = Boolean(this.localBackdrop);
    this.scrollTimelineSample = this.localSample
      && element.dataset.glassSampleMode === 'scroll-timeline'
      && supportsRootScrollTimeline();
    this.id = `viudira-liquid-${Math.random().toString(36).slice(2, 10)}`;
    this.filter = this.surfaceOnly ? null : createFilter(this.id, this.config.chromaticAberration);
    this.state = {
      intensity: Number(element.dataset.glassIntensity ?? this.config.intensity),
      blur: this.config.blur,
      surfaceAlpha: this.config.surfaceAlpha,
      tintAlpha: this.config.tintAlpha,
      highlightAlpha: this.config.highlightAlpha,
      innerShadowAlpha: this.config.innerShadowAlpha,
      outerShadowAlpha: this.config.outerShadowAlpha,
      press: 0,
      pointerX: 50,
      pointerY: 50,
    };
    const pendingState = pendingStateMap.get(element);
    if (pendingState) {
      Object.assign(this.state, pendingState);
      pendingStateMap.delete(element);
    }

    this.vectorScale = this.config.lensAmount;
    this.resizeTimer = 0;
    this.lastKey = '';
    this.lastFilterMode = '';
    this.lastDisplacementScale = NaN;
    this.lastBlur = NaN;
    this.lastCssVars = new Map();
    this.opticLayer = null;
    this.opticSceneLayer = null;
    this.interactiveLayer = null;
    this.hueLayer = null;
    this.tintLayer = null;
    this.surfaceLayer = null;

    if (this.localSample && !this.surfaceOnly) {
      element.classList.add('liquid-local-sample');
      this.opticLayer = makeLayer('liquid-optic-layer');
      if (this.scrollTimelineSample) {
        this.opticSceneLayer = makeLayer('liquid-optic-scene');
        this.opticLayer.append(this.opticSceneLayer);
      }
      this.interactiveLayer = makeLayer('liquid-interactive-layer');
      this.hueLayer = makeLayer('liquid-hue-layer');
      this.tintLayer = makeLayer('liquid-tint-layer');
      this.surfaceLayer = makeLayer('liquid-surface-layer');
      element.prepend(this.surfaceLayer);
      element.prepend(this.tintLayer);
      element.prepend(this.hueLayer);
      element.prepend(this.interactiveLayer);
      element.prepend(this.opticLayer);
    }

    element.classList.add('liquid-live');
    this.promotedStaticPosition = getComputedStyle(element).position === 'static';
    if (this.promotedStaticPosition) element.style.position = 'relative';
    element.style.setProperty('--lg-surface-rgb', this.config.surfaceRgb);
    element.style.setProperty('--lg-tint-rgb', this.config.tintRgb);
    if (this.localSample) this.updateLocalLayers();
    this.applyVisualState();

    if (!this.surfaceOnly) {
      this.observer = new ResizeObserver(() => this.scheduleUpdate());
      this.observer.observe(element);
      this.update();
    } else {
      this.observer = null;
      this.element.dataset.liquidReady = 'true';
    }
  }

  sitePreferenceValues() {
    return this.siteSettingsScoped ? getSiteGlassPreferences() : null;
  }

  effectiveSurfaceAlpha(value = this.state.surfaceAlpha) {
    const prefs = this.sitePreferenceValues();
    if (!prefs) return clamp(value, 0, 1);
    // 50% preserves the authored material. Moving toward 100% removes the
    // surface coat while keeping refraction/highlight intact; moving toward 0%
    // increases opacity without flattening every preset to the same alpha.
    const factor = 2 - (prefs.transparency / 50);
    // Interactive selection indicators may request a small authored-alpha floor
    // so the selected capsule never disappears completely at 100% transparency.
    // The floor is proportional to the *current* authored alpha, so Catalog's
    // 0.10 -> 0.03 press fade is preserved instead of being flattened.
    const authored = clamp(value, 0, 1);
    const floor = authored * this.surfaceFloorRatio;
    return clamp(Math.max(authored * factor, floor), 0, 0.96);
  }

  effectiveBlur(value = this.state.blur) {
    const prefs = this.sitePreferenceValues();
    if (!prefs) return Math.max(0, value);
    // Relative scaling keeps Header / drawer / menu material relationships.
    // 50% is the exact authored blur, 0% is no blur, 100% is 2x.
    return Math.max(0, value * (prefs.blur / 50));
  }

  setCssVar(name, value) {
    if (this.lastCssVars.get(name) === value) return;
    this.lastCssVars.set(name, value);
    this.element.style.setProperty(name, value);
  }

  updateLocalLayers() {
    if (!this.localSample || !this.localBackdrop || !this.opticLayer) return;
    const canvas = this.localBackdrop;
    const canvasStyle = getComputedStyle(canvas);
    const canvasRect = canvas.getBoundingClientRect();
    const elementRect = this.element.getBoundingClientRect();
    const mode = canvas.dataset.glassBackdropMode || '';
    const sourceWidth = Math.max(Number(canvas.dataset.glassBackdropWidth || 0), 1);
    const sourceHeight = Math.max(Number(canvas.dataset.glassBackdropHeight || 0), 1);
    const sampleTarget = this.scrollTimelineSample && this.opticSceneLayer
      ? this.opticSceneLayer
      : this.opticLayer;

    sampleTarget.style.backgroundImage = canvasStyle.backgroundImage;
    sampleTarget.style.backgroundColor = canvasStyle.backgroundColor;
    sampleTarget.style.backgroundRepeat = 'no-repeat';

    if (this.scrollTimelineSample && this.opticSceneLayer) {
      const viewportWidth = Math.max(window.innerWidth || document.documentElement.clientWidth, 1);
      const viewportHeight = Math.max(window.innerHeight || document.documentElement.clientHeight, 1);
      const scrollX = window.scrollX || window.pageXOffset || 0;
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const scrollingElement = document.scrollingElement || document.documentElement;
      const scrollRange = Math.max((scrollingElement?.scrollHeight || 0) - viewportHeight, 0);
      const documentLeft = elementRect.left + scrollX;
      const documentTop = elementRect.top + scrollY;

      this.opticLayer.style.backgroundImage = 'none';
      this.opticLayer.style.backgroundColor = 'transparent';
      this.opticSceneLayer.style.width = `${viewportWidth}px`;
      this.opticSceneLayer.style.height = `${viewportHeight}px`;
      this.opticSceneLayer.style.backgroundSize = canvasStyle.backgroundSize || 'cover';
      this.opticSceneLayer.style.backgroundPosition = canvasStyle.backgroundPosition || 'center center';
      this.opticSceneLayer.style.backgroundAttachment = 'scroll';
      this.opticSceneLayer.style.setProperty('--lg-scene-x', `${(-documentLeft).toFixed(3)}px`);
      this.opticSceneLayer.style.setProperty('--lg-scene-y-start', `${(-documentTop).toFixed(3)}px`);
      this.opticSceneLayer.style.setProperty('--lg-scene-y-end', `${(scrollRange - documentTop).toFixed(3)}px`);
    } else if (this.element.dataset.glassSampleMode === 'fixed-css') {
      this.opticLayer.style.backgroundSize = canvasStyle.backgroundSize || 'cover';
      this.opticLayer.style.backgroundPosition = canvasStyle.backgroundPosition || 'center center';
      this.opticLayer.style.backgroundAttachment = 'fixed';
      this.opticLayer.style.backgroundOrigin = 'border-box';
      this.opticLayer.style.backgroundClip = 'border-box';
    } else if ((mode === 'fixed-cover' || mode === 'element-cover') && sourceWidth > 1 && sourceHeight > 1) {
      const fixed = mode === 'fixed-cover';
      const frameWidth = Math.max(fixed ? (window.innerWidth || document.documentElement.clientWidth) : canvasRect.width, 1);
      const frameHeight = Math.max(fixed ? (window.innerHeight || document.documentElement.clientHeight) : canvasRect.height, 1);
      const frameLeft = fixed ? 0 : canvasRect.left;
      const frameTop = fixed ? 0 : canvasRect.top;
      const scale = Math.max(frameWidth / sourceWidth, frameHeight / sourceHeight);
      const photoWidth = sourceWidth * scale;
      const photoHeight = sourceHeight * scale;
      const photoLeft = (frameWidth - photoWidth) / 2;
      const photoTop = (frameHeight - photoHeight) / 2;
      const localLeft = elementRect.left - frameLeft;
      const localTop = elementRect.top - frameTop;

      this.opticLayer.style.backgroundAttachment = 'scroll';
      this.opticLayer.style.backgroundSize = `${frameWidth.toFixed(2)}px ${frameHeight.toFixed(2)}px, ${photoWidth.toFixed(2)}px ${photoHeight.toFixed(2)}px`;
      this.opticLayer.style.backgroundPosition = `${(-localLeft).toFixed(2)}px ${(-localTop).toFixed(2)}px, ${(photoLeft - localLeft).toFixed(2)}px ${(photoTop - localTop).toFixed(2)}px`;
    } else {
      const width = Math.max(canvas.clientWidth, 1);
      const height = Math.max(canvas.clientHeight, 1);
      const x = elementRect.left - canvasRect.left;
      const y = elementRect.top - canvasRect.top;
      this.opticLayer.style.backgroundAttachment = 'scroll';
      this.opticLayer.style.backgroundSize = `${width}px ${height}px`;
      this.opticLayer.style.backgroundPosition = `${(-x).toFixed(2)}px ${(-y).toFixed(2)}px`;
    }

    const tintVisible = this.config.tintAlpha > 0.001;
    this.hueLayer.style.display = tintVisible ? 'block' : 'none';
    this.tintLayer.style.display = tintVisible ? 'block' : 'none';
    this.hueLayer.style.background = `rgb(${this.config.tintRgb})`;
    this.tintLayer.style.background = `rgb(${this.config.tintRgb} / ${clamp(this.state.tintAlpha, 0, 1)})`;
    this.surfaceLayer.style.background = `rgb(${this.config.surfaceRgb} / ${this.effectiveSurfaceAlpha()})`;
  }

  applyFilterMode() {
    if (this.surfaceOnly || this.suspended) {
      if (this.localSample && this.opticLayer) this.opticLayer.style.filter = 'none';
      this.element.style.removeProperty('backdrop-filter');
      this.element.style.removeProperty('-webkit-backdrop-filter');
      this.lastFilterMode = this.surfaceOnly ? 'surface-only' : 'suspended';
      return;
    }
    const lensActive = this.state.intensity > 0.002;
    const effectiveSurfaceAlpha = this.effectiveSurfaceAlpha();
    const effectiveBlur = this.effectiveBlur();
    const opaqueIdle = effectiveSurfaceAlpha > 0.955 && !lensActive;
    const blurOnly = !lensActive && !opaqueIdle && effectiveBlur > 0.01;
    const mode = lensActive ? 'lens' : blurOnly ? 'blur' : 'none';
    if (mode === this.lastFilterMode) return;
    this.lastFilterMode = mode;

    let value = 'none';
    if (mode === 'lens') value = `saturate(${this.config.vibrancy}) brightness(${this.config.brightness}) url("#${this.id}")`;
    else if (mode === 'blur') value = `saturate(${this.config.vibrancy}) brightness(${this.config.brightness}) blur(${effectiveBlur.toFixed(2)}px)`;

    if (this.localSample && this.opticLayer) {
      this.opticLayer.style.filter = value;
      this.element.style.removeProperty('backdrop-filter');
      this.element.style.removeProperty('-webkit-backdrop-filter');
    } else {
      this.element.style.backdropFilter = value;
      this.element.style.webkitBackdropFilter = value;
    }
  }

  applyVisualState() {
    const s = this.state;
    const effectiveSurfaceAlpha = this.effectiveSurfaceAlpha(s.surfaceAlpha);
    const effectiveBlur = this.effectiveBlur(s.blur);
    this.setCssVar('--lg-surface-alpha', String(effectiveSurfaceAlpha));
    this.setCssVar('--lg-tint-alpha', String(clamp(s.tintAlpha, 0, 1)));
    this.setCssVar('--lg-highlight-alpha', String(clamp(s.highlightAlpha, 0, 1)));
    this.setCssVar('--lg-inner-shadow-alpha', String(clamp(s.innerShadowAlpha, 0, 1)));
    this.setCssVar('--lg-outer-shadow-alpha', String(clamp(s.outerShadowAlpha, 0, 1)));
    if (this.localSample) {
      if (this.tintLayer) this.tintLayer.style.background = `rgb(${this.config.tintRgb} / ${clamp(s.tintAlpha, 0, 1)})`;
      if (this.surfaceLayer) this.surfaceLayer.style.background = `rgb(${this.config.surfaceRgb} / ${effectiveSurfaceAlpha})`;
    }

    const press = clamp(s.press, 0, 1);
    this.setCssVar('--lg-press', String(press));
    this.setCssVar('--lg-press-alpha', String(0.15 * press));
    this.setCssVar('--lg-press-soft-alpha', String(0.08 * press));
    this.setCssVar('--lg-pointer-x', `${clamp(s.pointerX, 0, 100).toFixed(2)}%`);
    this.setCssVar('--lg-pointer-y', `${clamp(s.pointerY, 0, 100).toFixed(2)}%`);

    if (!this.surfaceOnly && this.filter) {
      const scale = this.vectorScale * clamp(s.intensity, 0, 1.35);
      if (!Number.isFinite(this.lastDisplacementScale) || Math.abs(scale - this.lastDisplacementScale) > 0.012) {
        this.lastDisplacementScale = scale;
        const scaleText = scale.toFixed(3);
        for (const node of this.filter.displacements) node.setAttribute('scale', scaleText);
      }

      // Blur lives inside the SVG pipeline while the lens is active. Updating a
      // primitive attribute is materially cheaper than replacing backdrop-filter
      // strings every spring frame.
      const blur = effectiveBlur;
      if (!Number.isFinite(this.lastBlur) || Math.abs(blur - this.lastBlur) > 0.02) {
        this.lastBlur = blur;
        this.filter.gaussian.setAttribute('stdDeviation', (blur * 0.5).toFixed(3));
        if (this.lastFilterMode === 'blur') this.lastFilterMode = '';
      }
    }
    this.applyFilterMode();
  }

  setState(patch = {}) {
    let changed = false;
    for (const [key, value] of Object.entries(patch)) {
      if (this.state[key] === value) continue;
      this.state[key] = value;
      changed = true;
    }
    if (changed) this.applyVisualState();
  }

  suspend() {
    if (this.surfaceOnly || this.suspended) return;
    this.suspended = true;
    this.applyFilterMode();
  }

  resume() {
    if (this.surfaceOnly || !this.suspended) return;
    this.suspended = false;
    this.lastFilterMode = '';
    if (this.localSample) this.updateLocalLayers();
    this.applyFilterMode();
  }

  scheduleUpdate() {
    clearTimeout(this.resizeTimer);
    this.resizeTimer = window.setTimeout(() => this.update(), 100);
  }

  update() {
    if (this.surfaceOnly || !this.filter) {
      this.element.dataset.liquidReady = 'true';
      return;
    }
    const width = Math.max(1, Math.round(this.element.offsetWidth || this.element.clientWidth));
    const height = Math.max(1, Math.round(this.element.offsetHeight || this.element.clientHeight));
    const computed = getComputedStyle(this.element);
    const radius = parseFloat(computed.borderTopLeftRadius) || Math.min(width, height) * 0.5;
    // InteractiveHighlight.kt uses radius = size.minDimension * 1.5. Cache it
    // from untransformed layout size so press scaling cannot feed back into glow size.
    this.setCssVar('--lg-interactive-radius', `${(Math.min(width, height) * 1.5).toFixed(2)}px`);
    if (this.localSample) this.updateLocalLayers();
    const key = `${width}x${height}@${Math.round(radius * 10)}`;
    if (key === this.lastKey) return;
    this.lastKey = key;

    const { urls, vectorScale } = mapsFor(width, height, radius, this.config);
    this.vectorScale = vectorScale;
    this.filter.filter.setAttribute('width', String(width));
    this.filter.filter.setAttribute('height', String(height));
    for (const image of Object.values(this.filter.images)) {
      image.setAttribute('width', String(width));
      image.setAttribute('height', String(height));
    }
    if (this.config.chromaticAberration) {
      setHref(this.filter.images.red, urls.red);
      setHref(this.filter.images.green, urls.green);
      setHref(this.filter.images.blue, urls.blue);
    } else {
      setHref(this.filter.images.base, urls.base);
    }
    this.applyVisualState();
    this.element.dataset.liquidReady = 'true';
  }

  destroy() {
    clearTimeout(this.resizeTimer);
    this.observer?.disconnect();
    activityObserver?.unobserve(this.element);
    this.filter?.filter?.remove();
    this.opticLayer?.remove();
    this.opticSceneLayer = null;
    this.interactiveLayer?.remove();
    this.hueLayer?.remove();
    this.tintLayer?.remove();
    this.surfaceLayer?.remove();
    this.element.style.removeProperty('backdrop-filter');
    this.element.style.removeProperty('-webkit-backdrop-filter');
    this.element.classList.remove('liquid-live', 'liquid-local-sample');
    if (this.promotedStaticPosition) this.element.style.removeProperty('position');
    controllerMap.delete(this.element);
    delete this.element.dataset.liquidReady;
  }
}

function ensureActivityObserver() {
  if (activityObserver || !('IntersectionObserver' in window)) return activityObserver;
  activityObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const controller = controllerMap.get(entry.target);
      if (!controller) continue;
      if (entry.isIntersecting) controller.resume();
      else controller.suspend();
    }
  }, { rootMargin: '80px 0px' });
  return activityObserver;
}

function createController(element, profile) {
  if (!element?.isConnected || controllerMap.has(element)) return controllerMap.get(element) || null;
  const controller = new LiquidBackdrop(element, profile);
  controllers.push(controller);
  controllerMap.set(element, controller);
  if (element.dataset.glassKeepActive !== 'true' && !controller.surfaceOnly) {
    ensureActivityObserver()?.observe(element);
  }
  if (controller.localSample) ensureLocalBackdropSampleSync();
  if (controller.scrollTimelineSample) ensureScrollTimelineLayoutSync();
  return controller;
}

export function setLiquidGlassState(element, patch) {
  const controller = controllerMap.get(element);
  if (controller) {
    controller.setState(patch);
    return;
  }
  pendingStateMap.set(element, { ...(pendingStateMap.get(element) || {}), ...patch });
}

export function getLiquidGlassController(element) {
  return controllerMap.get(element) || null;
}

// Re-sample a cached/local backdrop after an interactive control has moved.
// LiquidButton uses transform-based drag motion, so ResizeObserver does not fire;
// without this explicit sync the glass shell moves while the sampled scene stays
// pinned to the button's original location.
export function refreshLiquidGlassBackdropSample(element) {
  const controller = controllerMap.get(element);
  if (!controller?.localSample || controller.suspended) return;
  controller.updateLocalLayers();
}

export function refreshSiteGlassPreferences() {
  for (const controller of controllers) {
    if (!controller?.siteSettingsScoped) continue;
    controller.lastFilterMode = '';
    controller.lastBlur = NaN;
    controller.applyVisualState();
  }
}

export function preloadLiquidGlass() {
  if (!preloadPromise) preloadPromise = Promise.resolve(true);
  return preloadPromise;
}

export function destroyLiquidGlass() {
  lazyObserver?.disconnect();
  lazyObserver = null;
  activityObserver?.disconnect();
  activityObserver = null;
  if (localSampleSyncRaf) cancelAnimationFrame(localSampleSyncRaf);
  localSampleSyncRaf = 0;
  if (localSampleSyncBound) {
    document.removeEventListener('scroll', scheduleLocalBackdropSampleSync, true);
    window.removeEventListener('scroll', scheduleLocalBackdropSampleSync);
    window.removeEventListener('resize', scheduleLocalBackdropSampleSync);
    window.visualViewport?.removeEventListener('scroll', scheduleLocalBackdropSampleSync);
    window.visualViewport?.removeEventListener('resize', scheduleLocalBackdropSampleSync);
    localSampleSyncBound = false;
  }
  while (controllers.length) controllers.pop().destroy();
}

export function activateLiquidGlassElement(element) {
  if (!element?.isConnected) return null;
  const existing = controllerMap.get(element);
  if (existing) {
    existing.resume();
    return existing;
  }
  if (!supportsSvgBackdropFilter()) return null;
  const profile = currentProfile || detectGlassProfile();
  currentProfile = profile;
  const controller = createController(element, profile);
  if (controller) {
    controller.resume();
    document.documentElement.dataset.glass = 'svg';
    document.documentElement.dataset.glassEngine = 'svg-catalog-optimized';
  }
  return controller;
}

export function suspendLiquidGlassElement(element) {
  controllerMap.get(element)?.suspend();
}

export function deactivateLiquidGlassElement(element) {
  if (!element) return;
  lazyObserver?.unobserve(element);
  const controller = controllerMap.get(element);
  if (!controller) return;
  controller.destroy();
  const index = controllers.indexOf(controller);
  if (index >= 0) controllers.splice(index, 1);
}

function glassTargetsWithin(root = document) {
  const targets = [];
  if (root instanceof Element && root.matches('.liquid-glass')) targets.push(root);
  if (root?.querySelectorAll) targets.push(...root.querySelectorAll('.liquid-glass'));
  return targets;
}

function ensureLazyObserver() {
  if (lazyObserver || !('IntersectionObserver' in window)) return lazyObserver;
  lazyObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      if (entry.target.isConnected) createController(entry.target, currentProfile || detectGlassProfile());
      lazyObserver.unobserve(entry.target);
    }
  }, { rootMargin: '180px 0px' });
  return lazyObserver;
}

export function destroyLiquidGlassWithin(root) {
  if (!root) return;
  for (const element of glassTargetsWithin(root)) {
    lazyObserver?.unobserve(element);
    const controller = controllerMap.get(element);
    if (!controller) continue;
    controller.destroy();
    const index = controllers.indexOf(controller);
    if (index >= 0) controllers.splice(index, 1);
  }
}

export async function hydrateLiquidGlass(root = document) {
  const profile = currentProfile || detectGlassProfile();
  currentProfile = profile;
  document.documentElement.dataset.glassProfile = profile.name;

  if (new URLSearchParams(location.search).has('layout-test')) {
    markGlassFallback('test');
    return [];
  }
  if (!supportsSvgBackdropFilter()) {
    markGlassFallback('svg-backdrop');
    return [];
  }

  const targets = glassTargetsWithin(root);
  try {
    const lazyTargets = [];
    for (const element of targets) {
      if (controllerMap.has(element) || element.dataset.glassDefer === 'true') continue;
      if (element.dataset.glassKeepActive === 'true') {
        createController(element, profile);
        continue;
      }
      // Do not eagerly allocate an SVG filter + optical scene for every glass
      // surface in the SPA. Build only elements near the viewport and let the
      // observer hydrate the rest just before they are needed.
      const rect = element.getBoundingClientRect();
      const nearViewport = rect.bottom > -160
        && rect.top < innerHeight + 220
        && rect.right > -120
        && rect.left < innerWidth + 120;
      if (nearViewport) createController(element, profile);
      else lazyTargets.push(element);
    }

    const observer = ensureLazyObserver();
    if (observer) lazyTargets.forEach((element) => observer.observe(element));
    else lazyTargets.forEach((element) => createController(element, profile));

    if (targets.length || controllers.length) {
      document.documentElement.dataset.glass = 'svg';
      document.documentElement.dataset.glassEngine = 'svg-catalog-optimized';
      delete document.documentElement.dataset.glassReason;
    } else {
      markGlassFallback('no-targets');
    }
    return controllers;
  } catch (error) {
    console.warn('[ViudiraTech] optimized SVG Liquid Glass hydrate fallback:', error);
    markGlassFallback('hydrate');
    return [];
  }
}

export async function initLiquidGlass() {
  destroyLiquidGlass();
  currentProfile = detectGlassProfile();
  return hydrateLiquidGlass(document);
}

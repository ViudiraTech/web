import { getLiquidGlassController } from '../glass/liquid-glass.js';

const boundRoots = new WeakMap();
const visibilityState = new WeakMap();
const materialTimers = new WeakMap();
const reducedMotionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
const finePointerQuery = window.matchMedia?.('(hover:hover) and (pointer:fine)');

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));

function isActuallyVisible(element) {
  if (!(element instanceof Element) || !element.isConnected) return false;
  if (element.getAttribute('aria-hidden') === 'true') return false;
  if (element.classList.contains('is-hidden')) return false;
  const style = getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0.01;
}

function systemGlassWithin(target) {
  if (!(target instanceof Element)) return [];
  const result = [];
  if (target.matches('.liquid-glass.liquid-live')) result.push(target);
  target.querySelectorAll?.('.liquid-glass.liquid-live').forEach((element) => result.push(element));
  return result;
}

function isMajorSystemGlass(element) {
  return element instanceof Element
    && element.matches('.liquid-glass.liquid-live:not(.system-liquid-button)')
    && element.dataset.glassSurfaceOnly !== 'true';
}

/**
 * Visual-only materialization.
 *
 * IMPORTANT: this deliberately does NOT animate SVG filter attributes. The old
 * implementation used a SpringValue which rewrote displacement/blur state on
 * every frame. Worse, the MutationObserver watched `class`, so the
 * `is-glass-materializing` class could retrigger its own materialization loop.
 * We keep the optical lens static and animate only a compositor-friendly
 * highlight sweep on major system glass.
 */
function materializeGlass(element, { force = false } = {}) {
  if (!(element instanceof HTMLElement) || !isActuallyVisible(element)) return;
  const controller = getLiquidGlassController(element);
  if (controller?.suspended) return;
  if (!isMajorSystemGlass(element)) return;

  if (reducedMotionQuery?.matches) {
    element.classList.remove('is-glass-materializing');
    return;
  }

  const oldTimer = materialTimers.get(element);
  if (oldTimer && !force) return;
  if (oldTimer) clearTimeout(oldTimer);

  // No forced layout. Remove now, then re-add on the next frame so repeated
  // popover openings can replay the sweep without offsetWidth/getComputedStyle.
  element.classList.remove('is-glass-materializing');
  requestAnimationFrame(() => {
    if (!element.isConnected || !isActuallyVisible(element)) return;
    element.classList.add('is-glass-materializing');
    const timer = setTimeout(() => {
      element.classList.remove('is-glass-materializing');
      materialTimers.delete(element);
    }, 760);
    materialTimers.set(element, timer);
  });
}

function seedVisibility(root) {
  root.querySelectorAll('.liquid-glass.liquid-live').forEach((element) => {
    visibilityState.set(element, isActuallyVisible(element));
  });
}

function visibleMajorSystemGlass(root) {
  return [...root.querySelectorAll('.liquid-glass.liquid-live')]
    .filter((element) => isMajorSystemGlass(element) && isActuallyVisible(element));
}

export function energizeSystemGlass(root, scope = root) {
  if (!root?.isConnected) return;
  const target = scope instanceof Element ? scope : root;
  systemGlassWithin(target).forEach((element) => {
    if (isMajorSystemGlass(element) && isActuallyVisible(element)) materializeGlass(element, { force: true });
  });
}

export function bindSystemGlassDynamics(root, { platform = 'ios' } = {}) {
  if (!(root instanceof HTMLElement) || boundRoots.has(root)) return boundRoots.get(root) || null;

  root.classList.add('system-glass-dynamics', `system-glass-dynamics--${platform}`);
  root.style.setProperty('--system-glass-light-x', platform === 'macos' ? '26%' : '32%');
  root.style.setProperty('--system-glass-light-y', platform === 'macos' ? '10%' : '14%');
  root.style.setProperty('--system-glass-light-energy', '0.42');

  seedVisibility(root);

  let pointerRaf = 0;
  let lastPointerEvent = null;
  let hoveredGlass = null;

  // Pointer lighting is intentionally LOCAL. The old code updated root custom
  // properties every pointermove; every glass surface depended on those vars,
  // so one mouse move repainted the entire simulated OS. Now only the hovered
  // shared control receives two CSS variables. SVG displacement never changes.
  const updatePointerLight = () => {
    pointerRaf = 0;
    const event = lastPointerEvent;
    if (!event || !root.isConnected || !finePointerQuery?.matches) return;

    const next = event.target instanceof Element
      ? event.target.closest('.system-liquid-button.liquid-live')
      : null;
    const nextGlass = next instanceof HTMLElement && root.contains(next) ? next : null;

    if (hoveredGlass !== nextGlass) {
      if (hoveredGlass?.isConnected) {
        hoveredGlass.classList.remove('is-glass-hovered');
        hoveredGlass.style.removeProperty('--lg-specular-x');
        hoveredGlass.style.removeProperty('--lg-specular-y');
      }
      hoveredGlass = nextGlass;
      hoveredGlass?.classList.add('is-glass-hovered');
    }

    if (!hoveredGlass) return;
    const rect = hoveredGlass.getBoundingClientRect();
    const gx = clamp((event.clientX - rect.left) / Math.max(rect.width, 1), 0, 1);
    const gy = clamp((event.clientY - rect.top) / Math.max(rect.height, 1), 0, 1);
    hoveredGlass.style.setProperty('--lg-specular-x', `${(gx * 100).toFixed(1)}%`);
    hoveredGlass.style.setProperty('--lg-specular-y', `${(gy * 100).toFixed(1)}%`);
  };

  const onPointerMove = (event) => {
    if (!finePointerQuery?.matches) return;
    lastPointerEvent = event;
    if (!pointerRaf) pointerRaf = requestAnimationFrame(updatePointerLight);
  };

  const onPointerLeave = () => {
    if (hoveredGlass?.isConnected) {
      hoveredGlass.classList.remove('is-glass-hovered');
      hoveredGlass.style.removeProperty('--lg-specular-x');
      hoveredGlass.style.removeProperty('--lg-specular-y');
    }
    hoveredGlass = null;
  };

  const onPointerDown = (event) => {
    const glass = event.target instanceof Element ? event.target.closest('.liquid-glass.liquid-live') : null;
    if (!(glass instanceof HTMLElement) || !root.contains(glass)) return;
    glass.classList.add('is-glass-energized');
  };

  const clearPressed = () => {
    root.querySelectorAll('.is-glass-energized').forEach((element) => element.classList.remove('is-glass-energized'));
  };

  root.addEventListener('pointermove', onPointerMove, { passive: true });
  root.addEventListener('pointerleave', onPointerLeave, { passive: true });
  root.addEventListener('pointerdown', onPointerDown, { passive: true });
  root.addEventListener('pointerup', clearPressed, { passive: true });
  root.addEventListener('pointercancel', clearPressed, { passive: true });

  let visibilityRaf = 0;
  const pendingVisibilityCandidates = new Set();

  const flushVisibility = () => {
    visibilityRaf = 0;
    for (const element of pendingVisibilityCandidates) {
      if (!(element instanceof HTMLElement) || !root.contains(element)) continue;
      const visible = isActuallyVisible(element);
      const wasVisible = visibilityState.get(element) ?? false;
      visibilityState.set(element, visible);
      // Only a real hidden -> visible transition is allowed to materialize.
      // Internal animation classes therefore cannot recursively retrigger this.
      if (visible && !wasVisible) materializeGlass(element, { force: true });
    }
    pendingVisibilityCandidates.clear();
  };

  const queueVisibilityCandidate = (element) => {
    if (!(element instanceof Element)) return;
    systemGlassWithin(element).forEach((glass) => pendingVisibilityCandidates.add(glass));
    if (!visibilityRaf) visibilityRaf = requestAnimationFrame(flushVisibility);
  };

  const INTERNAL_GLASS_CLASSES = new Set(['is-glass-materializing', 'is-glass-energized', 'is-glass-hovered']);
  const normalizedClassState = (value = '') => value.split(/\s+/).filter(Boolean).filter((name) => !INTERNAL_GLASS_CLASSES.has(name)).sort().join(' ');
  const visibilityObserver = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'attributes') {
        // Ignore our own highlight/press/materialization class churn entirely.
        // Only external visibility/state classes and aria-hidden can wake glass.
        if (record.attributeName === 'class'
          && normalizedClassState(record.oldValue || '') === normalizedClassState(record.target.getAttribute('class') || '')) continue;
        queueVisibilityCandidate(record.target);
        continue;
      }
      record.addedNodes.forEach((node) => {
        if (node instanceof Element) queueVisibilityCandidate(node);
      });
    }
  });
  visibilityObserver.observe(root, {
    subtree: true,
    attributes: true,
    attributeOldValue: true,
    attributeFilter: ['class', 'aria-hidden'],
    childList: true,
  });

  // A few major surfaces get one arrival sweep after hydration. Shared buttons
  // do not all animate together, avoiding a startup compositor storm.
  requestAnimationFrame(() => visibleMajorSystemGlass(root).slice(0, 4).forEach((element) => materializeGlass(element)));

  const controller = {
    destroy() {
      if (pointerRaf) cancelAnimationFrame(pointerRaf);
      if (visibilityRaf) cancelAnimationFrame(visibilityRaf);
      visibilityObserver.disconnect();
      root.removeEventListener('pointermove', onPointerMove);
      root.removeEventListener('pointerleave', onPointerLeave);
      root.removeEventListener('pointerdown', onPointerDown);
      root.removeEventListener('pointerup', clearPressed);
      root.removeEventListener('pointercancel', clearPressed);
      for (const element of root.querySelectorAll('.is-glass-materializing')) {
        const timer = materialTimers.get(element);
        if (timer) clearTimeout(timer);
        materialTimers.delete(element);
        element.classList.remove('is-glass-materializing');
      }
      root.classList.remove('system-glass-dynamics', `system-glass-dynamics--${platform}`);
      boundRoots.delete(root);
    },
  };

  boundRoots.set(root, controller);
  return controller;
}

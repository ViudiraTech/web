import {
  activateLiquidGlassElement,
  deactivateLiquidGlassElement,
  setLiquidGlassState,
  refreshLiquidGlassBackdropSample,
} from '../glass/liquid-glass.js';
import { SpringValue, queueCatalogRender, SPRING_INTERACTIVE } from '../animation/catalog-motion.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const proxyRoots = new Map();
const activeButtonControllers = new Set();
let proxyLifecycleObserver = null;
let proxyLifecycleRaf = 0;

function effectiveOwnerState(button) {
  if (!button?.isConnected) return { visible: false, opacity: 0 };
  let opacity = 1;
  let node = button;
  while (node && node instanceof Element) {
    const style = getComputedStyle(node);
    if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse') {
      return { visible: false, opacity: 0 };
    }
    const nodeOpacity = Number.parseFloat(style.opacity);
    if (Number.isFinite(nodeOpacity)) opacity *= nodeOpacity;
    if (opacity < 0.015) return { visible: false, opacity: 0 };
    node = node.parentElement;
  }
  return { visible: true, opacity: clamp(opacity, 0, 1) };
}

function sweepButtonProxies({ sync = true } = {}) {
  for (const controller of [...activeButtonControllers]) {
    if (!controller.ownerElement?.isConnected) {
      controller.destroy?.();
      continue;
    }
    if (sync) controller.syncProxy?.();
  }

  for (const [key, root] of [...proxyRoots]) {
    if (!root?.isConnected) {
      proxyRoots.delete(key);
      continue;
    }
    root.querySelectorAll('.liquid-button-proxy').forEach((proxy) => {
      const owner = proxy._liquidButtonOwner;
      if (!owner?.isConnected || owner._liquidButtonProxy !== proxy) {
        deactivateLiquidGlassElement(proxy);
        proxy.remove();
      }
    });
    if (!root.childElementCount) {
      root.remove();
      proxyRoots.delete(key);
    }
  }
}

function scheduleProxyLifecycleSweep() {
  if (proxyLifecycleRaf) return;
  proxyLifecycleRaf = requestAnimationFrame(() => {
    proxyLifecycleRaf = 0;
    sweepButtonProxies({ sync: true });
  });
}

function ensureProxyLifecycleObserver() {
  if (proxyLifecycleObserver || !document.documentElement) return;
  proxyLifecycleObserver = new MutationObserver(scheduleProxyLifecycleSweep);
  proxyLifecycleObserver.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('orientationchange', scheduleProxyLifecycleSweep, { passive: true });
  window.addEventListener('load', scheduleProxyLifecycleSweep, { once: true });
  document.fonts?.ready?.then(scheduleProxyLifecycleSweep).catch?.(() => {});
}


function proxyLayer(button) {
  if (button.closest('.liquid-dialog-layer')) return { key: 'dialog', z: 246 };
  if (button.closest('.glass-test')) return { key: 'glass-test', z: 206 };
  if (button.closest('[data-drawer]')) return { key: 'drawer', z: 114 };
  if (button.closest('.site-nav')) return { key: 'header', z: 98 };
  return { key: 'site', z: 40 };
}

function ensureProxyRoot(button) {
  const layer = proxyLayer(button);
  if (proxyRoots.get(layer.key)?.isConnected) return proxyRoots.get(layer.key);
  const root = document.createElement('div');
  root.className = `liquid-button-portal-root liquid-button-portal-root--${layer.key}`;
  root.dataset.liquidButtonPortalRoot = layer.key;
  root.setAttribute('aria-hidden', 'true');
  root.style.zIndex = String(layer.z);
  document.body.append(root);
  proxyRoots.set(layer.key, root);
  return root;
}

function syncProxyRect(button, proxy) {
  if (!proxy || !button?.isConnected) return;
  const ownerState = effectiveOwnerState(button);
  const rect = button.getBoundingClientRect();
  if (!ownerState.visible || rect.width <= 0.5 || rect.height <= 0.5) {
    proxy.style.display = 'none';
    proxy.style.opacity = '0';
    return;
  }
  proxy.style.display = 'flex';
  // Portal visuals do not inherit ancestor opacity (reveal/Dialog transitions),
  // so mirror the effective owner opacity explicitly. Without this, an old or
  // closing proxy can float above the next UI and look like a button collage.
  proxy.style.opacity = ownerState.opacity.toFixed(4);
  // Feed geometry through dedicated CSS variables. The proxy CSS consumes
  // these with !important so inherited/legacy button rules cannot pin the
  // optical proxy back to the portal origin.
  proxy.style.setProperty('--liquid-proxy-left', `${rect.left.toFixed(3)}px`);
  proxy.style.setProperty('--liquid-proxy-top', `${rect.top.toFixed(3)}px`);
  proxy.style.setProperty('--liquid-proxy-width', `${rect.width.toFixed(3)}px`);
  proxy.style.setProperty('--liquid-proxy-height', `${rect.height.toFixed(3)}px`);
}

function ensureLiveProxy(button) {
  if (button?._liquidButtonProxy?.isConnected) return button._liquidButtonProxy;
  if (!button?.dataset.liquidLiveProxy) return null;

  const root = ensureProxyRoot(button);
  const proxy = document.createElement('span');
  const inheritedClasses = [...button.classList].filter((name) => ![
    'liquid-button-anchor', 'liquid-glass', 'liquid-live', 'liquid-local-sample',
  ].includes(name));
  proxy.className = [...inheritedClasses, 'liquid-button-proxy', 'liquid-glass'].join(' ');
  proxy.setAttribute('aria-hidden', 'true');
  proxy.dataset.glassPreset = button.dataset.liquidGlassPreset || 'catalog-button';
  proxy.dataset.glassLive = 'true';
  proxy.dataset.glassKeepActive = 'true';
  if (button.dataset.glassSettingsScope === 'site' || button.closest('[data-glass-settings-scope="site"]')) {
    proxy.dataset.glassSettingsScope = 'site';
  }
  proxy.innerHTML = button.innerHTML;
  proxy._liquidButtonOwner = button;

  root.append(proxy);
  button.classList.add('liquid-button-anchor');
  button._liquidButtonProxy = proxy;
  // CSS Anchor Positioning reports partial support on some Chromium builds but
  // may fail to resolve an anchor across our fixed optical portal, collapsing
  // every proxy to the initial containing block (0, 0). Keep the optical layer
  // top-level, but tether only its rectangle with getBoundingClientRect().
  // This never copies or chases backdrop pixels; the proxy still refracts the
  // browser's real live backdrop at the resolved viewport position.
  syncProxyRect(button, proxy);
  activateLiquidGlassElement(proxy);
  return proxy;
}

function removeLiveProxy(button) {
  const proxy = button?._liquidButtonProxy;
  if (proxy) {
    deactivateLiquidGlassElement(proxy);
    delete proxy._liquidButtonOwner;
    proxy.remove();
  }
  button?.classList.remove('liquid-button-anchor');
  if (button) {
    delete button._liquidButtonProxy;
  }
}

export function liquidButton({
  label,
  preset = 'catalog-button',
  className = '',
  backdrop = '',
  sampleMode = '',
  live = null,
  inlineLive = false,
  portal = false,
  attributes = '',
  type = 'button',
  href = '',
  target = '',
  rel = '',
} = {}) {
  // Site buttons use a top-level live optical proxy. This keeps the actual
  // backdrop-filter outside card/Dialog/Drawer stacking and backdrop roots while
  // the semantic button remains in normal document flow. Catalog Lab controls
  // keep their deterministic local-sample renderer as the reference implementation.
  const resolvedLive = live == null ? backdrop === 'ambient' : Boolean(live);
  // Body-level optical portals cannot reproduce arbitrary CSS stacking contexts:
  // on mobile they can float above unrelated sections even when the real button
  // is underneath them. Keep ordinary controls in their own stacking context.
  // Dialog/Drawer controls explicitly opt into a portal when they need to cross
  // a local backdrop boundary.
  const useLiveProxy = resolvedLive && Boolean(portal) && !inlineLive;
  const useInlineLive = resolvedLive && !useLiveProxy;
  const classes = ['catalog-button', useLiveProxy ? '' : 'liquid-glass', className].filter(Boolean).join(' ');
  const backdropAttr = backdrop && !resolvedLive ? ` data-glass-backdrop="${backdrop}"` : '';
  const resolvedSampleMode = resolvedLive ? '' : (sampleMode || (backdrop === 'ambient' ? 'scroll-timeline' : ''));
  const sampleModeAttr = resolvedSampleMode ? ` data-glass-sample-mode="${resolvedSampleMode}"` : '';
  const proxyAttr = useLiveProxy
    ? ` data-liquid-live-proxy="true" data-liquid-glass-preset="${preset}"`
    : useInlineLive
      ? ` data-glass-preset="${preset}" data-glass-live="true" data-glass-keep-active="true"`
      : ` data-glass-preset="${preset}"`;
  const common = `class="${classes}" data-liquid-button${proxyAttr}${backdropAttr}${sampleModeAttr}`;
  if (href) {
    const targetAttr = target ? ` target="${target}"` : '';
    const relAttr = rel ? ` rel="${rel}"` : '';
    return `<a ${common} href="${href}"${targetAttr}${relAttr} ${attributes}>${label ?? ''}</a>`;
  }
  return `<button ${common} type="${type}" ${attributes}>${label ?? ''}</button>`;
}

function pointerPercent(clientX, clientY, rect, width, height) {
  return {
    x: clamp(((clientX - rect.left) / Math.max(width, 1)) * 100, 0, 100),
    y: clamp(((clientY - rect.top) / Math.max(height, 1)) * 100, 0, 100),
  };
}

/**
 * Shared Backdrop Catalog LiquidButton motion.
 * Used by both Liquid UI Lab and site controls such as the project drawer close button.
 */
export function bindLiquidButton(button) {
  if (!button || button.dataset.liquidButtonBound === '1') return button?._liquidButtonController || null;
  button.dataset.liquidButtonBound = '1';

  const proxy = ensureLiveProxy(button);
  const visual = proxy || button;
  let width = button.offsetWidth || 48;
  let height = button.offsetHeight || 48;
  let baseRect = null;
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let offsetX = 0;
  let offsetY = 0;
  let press = 0;
  let peakPress = 0;
  let pointerX = 50;
  let pointerY = 50;
  let proxySyncRaf = 0;

  const syncProxy = () => {
    if (!proxy) return;
    if (proxySyncRaf) return;
    proxySyncRaf = requestAnimationFrame(() => {
      proxySyncRaf = 0;
      syncProxyRect(button, proxy);
    });
  };

  const render = () => {
    const maxOffset = Math.min(width, height);
    const maxDimension = Math.max(width, height);
    const tx = maxOffset * Math.tanh(0.05 * offsetX / Math.max(maxOffset, 1));
    const ty = maxOffset * Math.tanh(0.05 * offsetY / Math.max(maxOffset, 1));
    // Exact Backdrop Catalog LiquidButton.kt geometry:
    //   scale = lerp(1, 1 + 4dp / height, pressProgress)
    //   maxDragScale = 4dp / height
    //   scaleX/Y add the pointer offset projected onto each axis and normalized
    //   by size.maxDimension. There is intentionally no extra web-only clamp.
    const baseScale = 1 + (4 / Math.max(height, 1)) * press;
    const maxDragScale = 4 / Math.max(height, 1);
    const angle = Math.atan2(offsetY, offsetX);
    const aspectX = Math.min(width / Math.max(height, 1), 1);
    const aspectY = Math.min(height / Math.max(width, 1), 1);
    const sx = baseScale
      + maxDragScale * Math.abs(Math.cos(angle) * offsetX / Math.max(maxDimension, 1)) * aspectX;
    const sy = baseScale
      + maxDragScale * Math.abs(Math.sin(angle) * offsetY / Math.max(maxDimension, 1)) * aspectY;
    visual.style.transform = `translate3d(${tx.toFixed(3)}px,${ty.toFixed(3)}px,0) scale(${sx.toFixed(5)},${sy.toFixed(5)})`;
    if (!proxy) refreshLiquidGlassBackdropSample(button);
    setLiquidGlassState(visual, { press, highlightAlpha: 1, pointerX, pointerY });
  };

  const requestRender = () => queueCatalogRender(render);
  const pressSpring = new SpringValue(0, (value) => {
    press = clamp(value, 0, 1.1);
    peakPress = Math.max(peakPress, press);
    requestRender();
  });
  const xSpring = new SpringValue(0, (value) => { offsetX = value; requestRender(); });
  const ySpring = new SpringValue(0, (value) => { offsetY = value; requestRender(); });

  const resizeObserver = new ResizeObserver(() => {
    width = button.offsetWidth || width;
    height = button.offsetHeight || height;
    syncProxy();
    requestRender();
  });
  resizeObserver.observe(button);

  const onViewportMove = () => syncProxy();
  let motionSyncRaf = 0;
  const movingAncestors = new Set();
  const runMotionSync = () => {
    if (!proxy || motionSyncRaf) return;
    const tick = () => {
      motionSyncRaf = 0;
      syncProxyRect(button, proxy);
      if (movingAncestors.size && button.isConnected && proxy.isConnected) {
        motionSyncRaf = requestAnimationFrame(tick);
      }
    };
    motionSyncRaf = requestAnimationFrame(tick);
  };
  const onTransitionRun = (event) => {
    const target = event.target;
    if (!(target instanceof Element) || target === button || !target.contains(button)) return;
    movingAncestors.add(target);
    runMotionSync();
  };
  const onTransitionDone = (event) => {
    const target = event.target;
    if (!(target instanceof Element) || !movingAncestors.has(target)) return;
    movingAncestors.delete(target);
    syncProxy();
  };
  if (proxy) {
    document.addEventListener('scroll', onViewportMove, { passive: true, capture: true });
    window.addEventListener('resize', onViewportMove, { passive: true });
    window.visualViewport?.addEventListener('resize', onViewportMove, { passive: true });
    window.visualViewport?.addEventListener('scroll', onViewportMove, { passive: true });
    document.addEventListener('transitionrun', onTransitionRun, true);
    document.addEventListener('transitionend', onTransitionDone, true);
    document.addEventListener('transitioncancel', onTransitionDone, true);
  }

  const onPointerDown = (event) => {
    dragging = true;
    peakPress = 0;
    startX = event.clientX;
    startY = event.clientY;
    baseRect = button.getBoundingClientRect();
    button.setPointerCapture(event.pointerId);
    ({ x: pointerX, y: pointerY } = pointerPercent(event.clientX, event.clientY, baseRect, width, height));
    xSpring.snap(0);
    ySpring.snap(0);
    pressSpring.to(1, SPRING_INTERACTIVE);
  };

  const onPointerMove = (event) => {
    if (!dragging) return;
    xSpring.snap(event.clientX - startX);
    ySpring.snap(event.clientY - startY);
    if (baseRect) ({ x: pointerX, y: pointerY } = pointerPercent(event.clientX, event.clientY, baseRect, width, height));
    requestRender();
  };

  const release = () => {
    if (!dragging) return;
    dragging = false;
    pressSpring.to(0, SPRING_INTERACTIVE);
    xSpring.to(0, SPRING_INTERACTIVE);
    ySpring.to(0, SPRING_INTERACTIVE);
  };

  button.addEventListener('pointerdown', onPointerDown);
  button.addEventListener('pointermove', onPointerMove);
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);

  const waitForRest = ({ timeout = 1200, stableFrames = 2 } = {}) => new Promise((resolve) => {
    const start = performance.now();
    let stable = 0;
    const check = () => {
      const settled = !dragging
        && pressSpring.isSettled()
        && xSpring.isSettled()
        && ySpring.isSettled();
      stable = settled ? stable + 1 : 0;
      if (stable >= stableFrames || performance.now() - start >= timeout) {
        requestRender();
        resolve();
        return;
      }
      requestAnimationFrame(check);
    };
    check();
  });

  const waitUntil = (predicate, timeout = 500) => new Promise((resolve) => {
    const start = performance.now();
    const check = () => {
      if (predicate() || performance.now() - start >= timeout) {
        resolve();
        return;
      }
      requestAnimationFrame(check);
    };
    check();
  });

  const completeActivationAndWait = async ({ timeout = 1600, minimumPeak = 0.72 } = {}) => {
    const started = performance.now();
    dragging = false;
    xSpring.to(0, SPRING_INTERACTIVE);
    ySpring.to(0, SPRING_INTERACTIVE);

    if (peakPress < minimumPeak && press < minimumPeak) {
      pressSpring.to(1, SPRING_INTERACTIVE);
      await waitUntil(() => press >= minimumPeak || pressSpring.isSettled(), Math.min(520, timeout));
    }

    pressSpring.to(0, SPRING_INTERACTIVE);
    const remaining = Math.max(180, timeout - (performance.now() - started));
    await waitForRest({ timeout: remaining, stableFrames: 3 });
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    peakPress = 0;
  };

  let destroyed = false;
  const controller = {
    ownerElement: button,
    visualElement: visual,
    syncProxy,
    waitForRest,
    completeActivationAndWait,
    release,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      activeButtonControllers.delete(controller);
      resizeObserver.disconnect();
      if (proxySyncRaf) cancelAnimationFrame(proxySyncRaf);
      if (proxy) {
        document.removeEventListener('scroll', onViewportMove, true);
        window.removeEventListener('resize', onViewportMove);
        window.visualViewport?.removeEventListener('resize', onViewportMove);
        window.visualViewport?.removeEventListener('scroll', onViewportMove);
        document.removeEventListener('transitionrun', onTransitionRun, true);
        document.removeEventListener('transitionend', onTransitionDone, true);
        document.removeEventListener('transitioncancel', onTransitionDone, true);
        movingAncestors.clear();
        if (motionSyncRaf) cancelAnimationFrame(motionSyncRaf);
      }
      button.removeEventListener('pointerdown', onPointerDown);
      button.removeEventListener('pointermove', onPointerMove);
      button.removeEventListener('pointerup', release);
      button.removeEventListener('pointercancel', release);
      button.removeEventListener('lostpointercapture', release);
      if (proxy) removeLiveProxy(button);
      else button.style.removeProperty('transform');
      delete button.dataset.liquidButtonBound;
      delete button._liquidButtonController;
    },
  };
  button._liquidButtonController = controller;
  activeButtonControllers.add(controller);
  ensureProxyLifecycleObserver();
  syncProxy();
  requestRender();
  return controller;
}

export function bindLiquidButtons(root = document) {
  if (!root) return;
  ensureProxyLifecycleObserver();
  sweepButtonProxies({ sync: false });
  const buttons = [];
  if (root instanceof Element && root.matches('[data-liquid-button]')) buttons.push(root);
  if (root.querySelectorAll) buttons.push(...root.querySelectorAll('[data-liquid-button]'));
  buttons.forEach(bindLiquidButton);
  scheduleProxyLifecycleSweep();
}

export function destroyLiquidButtonsWithin(root) {
  if (!root) return;
  const buttons = [];
  if (root instanceof Element && root.matches('[data-liquid-button]')) buttons.push(root);
  if (root.querySelectorAll) buttons.push(...root.querySelectorAll('[data-liquid-button]'));
  buttons.forEach((button) => button._liquidButtonController?.destroy?.());
  scheduleProxyLifecycleSweep();
}

export function syncLiquidButtonProxies() {
  scheduleProxyLifecycleSweep();
}


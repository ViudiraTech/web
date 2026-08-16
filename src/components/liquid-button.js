import { setLiquidGlassState, refreshLiquidGlassBackdropSample } from '../glass/liquid-glass.js';
import { SpringValue, queueCatalogRender, SPRING_INTERACTIVE } from '../animation/catalog-motion.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function liquidButton({
  label,
  preset = 'catalog-button',
  className = '',
  backdrop = '',
  sampleMode = '',
  attributes = '',
  type = 'button',
} = {}) {
  const classes = ['catalog-button', 'liquid-glass', className].filter(Boolean).join(' ');
  const backdropAttr = backdrop ? ` data-glass-backdrop="${backdrop}"` : '';
  // Global/site LiquidButtons see the same fixed mountain scene as readability
  // glass and shared dialogs. Bind those buttons to the native root scroll
  // timeline sampler by default. Catalog-lab buttons intentionally omit an
  // explicit backdrop and keep sampling their own moving demo canvas instead.
  const resolvedSampleMode = sampleMode || (backdrop === 'ambient' ? 'scroll-timeline' : '');
  const sampleModeAttr = resolvedSampleMode ? ` data-glass-sample-mode="${resolvedSampleMode}"` : '';
  return `<button class="${classes}" data-liquid-button data-glass-preset="${preset}"${backdropAttr}${sampleModeAttr} type="${type}" ${attributes}>${label ?? ''}</button>`;
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

  const render = () => {
    const maxOffset = Math.min(width, height);
    const maxDimension = Math.max(width, height);
    const tx = maxOffset * Math.tanh(0.05 * offsetX / Math.max(maxOffset, 1));
    const ty = maxOffset * Math.tanh(0.05 * offsetY / Math.max(maxOffset, 1));
    const baseScale = 1 + (4 / Math.max(height, 1)) * press;
    const dragScale = 4 / Math.max(height, 1);
    const angle = Math.atan2(offsetY, offsetX);
    const sx = baseScale + dragScale * Math.abs(Math.cos(angle) * offsetX / Math.max(maxDimension, 1)) * Math.min(width / Math.max(height, 1), 1);
    const sy = baseScale + dragScale * Math.abs(Math.sin(angle) * offsetY / Math.max(maxDimension, 1)) * Math.min(height / Math.max(width, 1), 1);
    button.style.transform = `translate3d(${tx.toFixed(3)}px,${ty.toFixed(3)}px,0) scale(${sx.toFixed(5)},${sy.toFixed(5)})`;
    // Root scrolling is handled natively by ScrollTimeline for ambient-backed
    // buttons. Button drag/press transforms still move the capsule relative to
    // that scene, so only those animation frames need a geometry refresh here.
    refreshLiquidGlassBackdropSample(button);
    setLiquidGlassState(button, { press, highlightAlpha: 1, pointerX, pointerY });
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
    requestRender();
  });
  resizeObserver.observe(button);

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

  // A very fast click can complete pointerdown -> pointerup before the first rAF,
  // leaving press at 0 and making a naive rest-check close the UI immediately.
  // Finish one visible Catalog-style activation pulse first, then let every
  // spring settle for several consecutive display frames.
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
    // Keep the fully-rested frame on screen before the parent starts moving.
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    peakPress = 0;
  };

  const controller = {
    waitForRest,
    completeActivationAndWait,
    release,
    destroy() {
      resizeObserver.disconnect();
      button.removeEventListener('pointerdown', onPointerDown);
      button.removeEventListener('pointermove', onPointerMove);
      button.removeEventListener('pointerup', release);
      button.removeEventListener('pointercancel', release);
      button.removeEventListener('lostpointercapture', release);
      delete button.dataset.liquidButtonBound;
      delete button._liquidButtonController;
    },
  };
  button._liquidButtonController = controller;
  requestRender();
  return controller;
}

export function bindLiquidButtons(root = document) {
  if (!root) return;
  const buttons = [];
  if (root instanceof Element && root.matches('[data-liquid-button]')) buttons.push(root);
  if (root.querySelectorAll) buttons.push(...root.querySelectorAll('[data-liquid-button]'));
  buttons.forEach(bindLiquidButton);
}

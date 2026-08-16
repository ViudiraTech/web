import { setLiquidGlassState } from '../glass/liquid-glass.js';
import { SpringValue, queueCatalogRender as queueRender, SPRING_VALUE, SPRING_PRESS, SPRING_SCALE_X, SPRING_SCALE_Y } from '../animation/catalog-motion.js';
import { escapeHtml } from '../utils/html.js';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function pointPercent(clientX, clientY, left, top, width, height) {
  return {
    x: clamp(((clientX - left) / Math.max(width, 1)) * 100, 0, 100),
    y: clamp(((clientY - top) / Math.max(height, 1)) * 100, 0, 100),
  };
}

export function liquidToggle({
  checked = false,
  ariaLabel = 'Liquid toggle',
  className = '',
  setting = '',
  attributes = '',
} = {}) {
  const classes = ['catalog-toggle', className].filter(Boolean).join(' ');
  const attrs = [
    'data-liquid-toggle',
    setting ? `data-setting-toggle="${escapeHtml(setting)}"` : '',
    attributes,
  ].filter(Boolean).join(' ');

  return `<button class="${classes}" ${attrs} type="button" role="switch" aria-checked="${checked ? 'true' : 'false'}" aria-label="${escapeHtml(ariaLabel)}">
    <span class="catalog-toggle__thumb liquid-glass" data-glass-preset="catalog-toggle-thumb"></span>
  </button>`;
}

export function bindLiquidToggle(root) {
  if (!root || root.dataset.liquidToggleBound === '1') return root?._liquidToggleController || null;
  root.dataset.liquidToggleBound = '1';
  const thumb = root.querySelector('.catalog-toggle__thumb');
  if (!thumb) return null;

  let rootWidth = root.offsetWidth || 64;
  let thumbWidth = thumb.offsetWidth || 40;
  let thumbHeight = thumb.offsetHeight || 24;
  let travel = Math.max(rootWidth - thumbWidth - 4, 1);
  let dragRect = null;
  let pointerClientX = 0;
  let pointerClientY = 0;
  let targetFraction = root.getAttribute('aria-checked') === 'true' ? 1 : 0;
  let visualFraction = targetFraction;
  let press = 0;
  let scaleX = 1;
  let scaleY = 1;
  let dragging = false;
  let moved = false;
  let downX = 0;
  let downY = 0;
  let dragThreshold = 3;

  const render = () => {
    const f = clamp(visualFraction, 0, 1);
    root.style.setProperty('--toggle-fraction', f.toFixed(4));
    const velocity = fractionSpring.velocity / 50;
    const velocityX = clamp(velocity * 0.75, -0.2, 0.2);
    const velocityY = clamp(velocity * 0.25, -0.2, 0.2);
    const sx = scaleX / (1 - velocityX);
    const sy = scaleY * (1 - velocityY);
    const x = 2 + travel * f;
    thumb.style.transform = `translate3d(${x.toFixed(3)}px,2px,0) scale(${sx.toFixed(5)},${sy.toFixed(5)})`;
    let pointerX = 50;
    let pointerY = 50;
    if (dragRect && dragging) {
      ({ x: pointerX, y: pointerY } = pointPercent(pointerClientX, pointerClientY, dragRect.left + x, dragRect.top + 2, thumbWidth, thumbHeight));
    }
    setLiquidGlassState(thumb, {
      intensity: press,
      blur: 8 * (1 - press),
      surfaceAlpha: 1 - press,
      highlightAlpha: press,
      innerShadowAlpha: 0.15 * press,
      outerShadowAlpha: 0.05,
      press: 0,
      pointerX,
      pointerY,
    });
  };

  const requestRender = () => queueRender(render);
  const fractionSpring = new SpringValue(targetFraction, (value) => { visualFraction = value; requestRender(); });
  const pressSpring = new SpringValue(0, (value) => { press = clamp(value, 0, 1); requestRender(); });
  const scaleXSpring = new SpringValue(1, (value) => { scaleX = value; requestRender(); });
  const scaleYSpring = new SpringValue(1, (value) => { scaleY = value; requestRender(); });

  const resizeObserver = new ResizeObserver(() => {
    rootWidth = root.offsetWidth || rootWidth;
    thumbWidth = thumb.offsetWidth || thumbWidth;
    thumbHeight = thumb.offsetHeight || thumbHeight;
    travel = Math.max(rootWidth - thumbWidth - 4, 1);
    requestRender();
  });
  resizeObserver.observe(root);

  const setPressed = (pressed) => {
    pressSpring.to(pressed ? 1 : 0, SPRING_PRESS);
    scaleXSpring.to(pressed ? 1.5 : 1, SPRING_SCALE_X);
    scaleYSpring.to(pressed ? 1.5 : 1, SPRING_SCALE_Y);
  };

  const emitChange = (checked, source = 'pointer') => {
    root.dispatchEvent(new CustomEvent('liquidtoggle:change', {
      bubbles: true,
      detail: { checked, source },
    }));
  };

  const commit = (checked, { animate = true, emit = true, source = 'api' } = {}) => {
    targetFraction = checked ? 1 : 0;
    root.setAttribute('aria-checked', String(checked));
    if (animate) fractionSpring.to(targetFraction, SPRING_VALUE);
    else fractionSpring.snap(targetFraction);
    if (emit) emitChange(checked, source);
    requestRender();
  };

  render();
  root.addEventListener('pointerdown', (event) => {
    dragging = true;
    moved = false;
    downX = event.clientX;
    downY = event.clientY;
    // A finger almost always jitters by a few CSS pixels. Treat that as a tap,
    // not as a horizontal drag; otherwise mobile users need several attempts
    // before a simple tap actually toggles the switch.
    dragThreshold = event.pointerType === 'touch' ? 10 : event.pointerType === 'pen' ? 7 : 3;
    pointerClientX = event.clientX;
    pointerClientY = event.clientY;
    dragRect = root.getBoundingClientRect();
    root.setPointerCapture(event.pointerId);
    setPressed(true);
  });

  root.addEventListener('pointermove', (event) => {
    if (!dragging || !dragRect) return;
    pointerClientX = event.clientX;
    pointerClientY = event.clientY;
    const dx = event.clientX - downX;
    const dy = event.clientY - downY;
    if (!moved && Math.abs(dx) >= dragThreshold && Math.abs(dx) > Math.abs(dy) * 1.12) moved = true;
    // Until horizontal intent is clear, keep the visual at the committed value.
    // This makes a slightly wandering phone tap deterministic.
    if (!moved) {
      requestRender();
      return;
    }
    targetFraction = clamp((event.clientX - dragRect.left - (2 + thumbWidth * 0.5)) / travel, 0, 1);
    fractionSpring.to(targetFraction, SPRING_VALUE);
    requestRender();
  });

  const release = () => {
    if (!dragging) return;
    dragging = false;
    const checked = moved ? targetFraction >= 0.5 : root.getAttribute('aria-checked') !== 'true';
    commit(checked, { animate: true, emit: true, source: moved ? 'drag' : 'pointer' });
    setPressed(false);
    dragRect = null;
  };
  const cancelGesture = () => {
    if (!dragging) return;
    dragging = false;
    targetFraction = root.getAttribute('aria-checked') === 'true' ? 1 : 0;
    fractionSpring.to(targetFraction, SPRING_VALUE);
    setPressed(false);
    dragRect = null;
  };
  root.addEventListener('pointerup', release);
  root.addEventListener('pointercancel', cancelGesture);
  root.addEventListener('lostpointercapture', () => {
    // pointerup normally runs first. If capture is lost for another reason
    // (native scrolling/gesture arbitration), cancel instead of toggling.
    if (dragging) cancelGesture();
  });
  root.addEventListener('keydown', (event) => {
    if (![' ', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    let checked;
    if (event.key === 'ArrowLeft') checked = false;
    else if (event.key === 'ArrowRight') checked = true;
    else checked = root.getAttribute('aria-checked') !== 'true';
    commit(checked, { animate: true, emit: true, source: 'keyboard' });
  });

  const controller = {
    setChecked(checked, options = {}) { commit(Boolean(checked), { animate: true, emit: false, ...options }); },
    getChecked() { return root.getAttribute('aria-checked') === 'true'; },
    destroy() { resizeObserver.disconnect(); },
  };
  root._liquidToggleController = controller;
  return controller;
}

export function bindLiquidToggles(root = document) {
  root?.querySelectorAll?.('[data-liquid-toggle]').forEach(bindLiquidToggle);
}

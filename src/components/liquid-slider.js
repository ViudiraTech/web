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

export function liquidSlider({
  value = 46,
  min = 0,
  max = 100,
  step = 1,
  ariaLabel = 'Liquid slider',
  className = '',
  id = '',
  name = '',
  setting = '',
} = {}) {
  const classes = ['catalog-slider', className].filter(Boolean).join(' ');
  const attrs = [
    'data-liquid-slider',
    setting ? `data-setting-slider="${escapeHtml(setting)}"` : '',
  ].filter(Boolean).join(' ');
  const inputAttrs = [
    id ? `id="${escapeHtml(id)}"` : '',
    name ? `name="${escapeHtml(name)}"` : '',
  ].filter(Boolean).join(' ');
  return `<div class="${classes}" ${attrs}>
    <div class="catalog-slider__track"><span></span></div>
    <span class="catalog-slider__thumb liquid-glass" data-glass-preset="catalog-slider-thumb"></span>
    <input type="range" min="${Number(min)}" max="${Number(max)}" step="${Number(step)}" value="${Number(value)}" aria-label="${escapeHtml(ariaLabel)}" ${inputAttrs}/>
  </div>`;
}

export function bindLiquidSlider(root) {
  if (!root || root.dataset.liquidSliderBound === '1') return root?._liquidSliderController || null;
  root.dataset.liquidSliderBound = '1';
  const thumb = root.querySelector('.catalog-slider__thumb');
  const track = root.querySelector('.catalog-slider__track');
  const input = root.querySelector('input[type="range"]');
  if (!thumb || !track || !input) return null;
  const min = Number(input.min || 0);
  const max = Number(input.max || 100);
  const targetFromInput = () => clamp((Number(input.value) - min) / Math.max(max - min, 1), 0, 1);

  let trackWidth = root.offsetWidth || 420;
  let thumbWidth = thumb.offsetWidth || 40;
  let thumbHeight = thumb.offsetHeight || 24;
  let visualFraction = targetFromInput();
  let press = 0;
  let scaleX = 1;
  let scaleY = 1;
  let pressed = false;
  let dragRect = null;
  let pointerClientX = 0;
  let pointerClientY = 0;

  const render = () => {
    const f = clamp(visualFraction, 0, 1);
    root.style.setProperty('--slider-fraction', f.toFixed(4));
    const x = clamp((trackWidth - thumbWidth) * f, 0, Math.max(trackWidth - thumbWidth, 0));
    root.style.setProperty('--slider-fill', `${(x + thumbWidth * 0.5).toFixed(2)}px`);
    const velocity = valueSpring.velocity / 10;
    const velocityX = clamp(velocity * 0.75, -0.2, 0.2);
    const velocityY = clamp(velocity * 0.25, -0.2, 0.2);
    const sx = scaleX / (1 - velocityX);
    const sy = scaleY * (1 - velocityY);
    thumb.style.transform = `translate3d(${x.toFixed(3)}px,0,0) scale(${sx.toFixed(5)},${sy.toFixed(5)})`;
    let pointerX = 50;
    let pointerY = 50;
    if (dragRect && pressed) {
      ({ x: pointerX, y: pointerY } = pointPercent(pointerClientX, pointerClientY, dragRect.left + x, dragRect.top + 9, thumbWidth, thumbHeight));
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
  const valueSpring = new SpringValue(visualFraction, (value) => { visualFraction = value; requestRender(); });
  const pressSpring = new SpringValue(0, (value) => { press = clamp(value, 0, 1); requestRender(); });
  const scaleXSpring = new SpringValue(1, (value) => { scaleX = value; requestRender(); });
  const scaleYSpring = new SpringValue(1, (value) => { scaleY = value; requestRender(); });

  const resizeObserver = new ResizeObserver(() => {
    trackWidth = root.offsetWidth || trackWidth;
    thumbWidth = thumb.offsetWidth || thumbWidth;
    thumbHeight = thumb.offsetHeight || thumbHeight;
    requestRender();
  });
  resizeObserver.observe(root);

  const setPressed = (next) => {
    pressed = next;
    pressSpring.to(next ? 1 : 0, SPRING_PRESS);
    scaleXSpring.to(next ? 1.5 : 1, SPRING_SCALE_X);
    scaleYSpring.to(next ? 1.5 : 1, SPRING_SCALE_Y);
  };

  const emitValue = () => {
    root.dispatchEvent(new CustomEvent('liquidslider:input', {
      bubbles: true,
      detail: { value: Number(input.value), min, max, fraction: targetFromInput(), input },
    }));
  };

  render();
  input.addEventListener('input', () => {
    valueSpring.to(targetFromInput(), SPRING_VALUE);
    emitValue();
  });
  input.addEventListener('pointerdown', (event) => {
    dragRect = root.getBoundingClientRect();
    pointerClientX = event.clientX;
    pointerClientY = event.clientY;
    setPressed(true);
  });
  input.addEventListener('pointermove', (event) => {
    if (!pressed) return;
    pointerClientX = event.clientX;
    pointerClientY = event.clientY;
    requestRender();
  });
  const release = () => {
    if (!pressed) return;
    setPressed(false);
    dragRect = null;
  };
  input.addEventListener('pointerup', release);
  input.addEventListener('pointercancel', release);
  input.addEventListener('blur', release);
  input.addEventListener('keydown', () => requestAnimationFrame(() => valueSpring.to(targetFromInput(), SPRING_VALUE)));

  const controller = {
    input,
    setValue(next, { emit = false, animate = true } = {}) {
      const value = clamp(Number(next), min, max);
      input.value = String(value);
      if (animate) valueSpring.to(targetFromInput(), SPRING_VALUE);
      else valueSpring.snap(targetFromInput());
      if (emit) emitValue();
    },
    destroy() { resizeObserver.disconnect(); },
  };
  root._liquidSliderController = controller;
  return controller;
}

export function bindLiquidSliders(root = document) {
  const scope = root?.querySelectorAll ? root : document;
  scope.querySelectorAll('[data-liquid-slider]').forEach(bindLiquidSlider);
}

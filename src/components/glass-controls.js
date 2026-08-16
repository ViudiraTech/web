import { setLiquidGlassState } from '../glass/liquid-glass.js';
import { SpringValue, queueCatalogRender as queueRender, SPRING_INTERACTIVE, SPRING_VALUE, SPRING_PRESS, SPRING_SCALE_X, SPRING_SCALE_Y } from '../animation/catalog-motion.js';
import { liquidBottomTabs, bindLiquidBottomTabs } from './liquid-bottom-tabs.js';
import { liquidSlider, bindLiquidSliders } from './liquid-slider.js';
import { liquidButton, bindLiquidButtons } from './liquid-button.js';

const svg = (body, size = 22) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const planeIcon = svg('<path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2.5 1.5V22L11.5 21l4 1v-1.5L13 19v-5.5L21 16Z"/>', 27);

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
function pointPercent(clientX, clientY, left, top, width, height) {
  return {
    x: clamp(((clientX - left) / Math.max(width, 1)) * 100, 0, 100),
    y: clamp(((clientY - top) / Math.max(height, 1)) * 100, 0, 100),
  };
}

function bindCatalogToggle(root) {
  if (root.dataset.catalogBound === '1') return;
  root.dataset.catalogBound = '1';
  const thumb = root.querySelector('.catalog-toggle__thumb');
  if (!thumb) return;

  let rootWidth = root.offsetWidth || 64;
  let rootHeight = root.offsetHeight || 28;
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

  new ResizeObserver(() => {
    rootWidth = root.offsetWidth || rootWidth;
    rootHeight = root.offsetHeight || rootHeight;
    thumbWidth = thumb.offsetWidth || thumbWidth;
    thumbHeight = thumb.offsetHeight || thumbHeight;
    travel = Math.max(rootWidth - thumbWidth - 4, 1);
    requestRender();
  }).observe(root);

  const setPressed = (pressed) => {
    pressSpring.to(pressed ? 1 : 0, SPRING_PRESS);
    scaleXSpring.to(pressed ? 1.5 : 1, SPRING_SCALE_X);
    scaleYSpring.to(pressed ? 1.5 : 1, SPRING_SCALE_Y);
  };

  render();
  root.addEventListener('pointerdown', (event) => {
    dragging = true;
    moved = false;
    downX = event.clientX;
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
    if (Math.abs(event.clientX - downX) > 2) moved = true;
    targetFraction = clamp((event.clientX - dragRect.left - (2 + thumbWidth * 0.5)) / travel, 0, 1);
    fractionSpring.to(targetFraction, SPRING_VALUE);
    requestRender();
  });

  const release = () => {
    if (!dragging) return;
    dragging = false;
    if (!moved) targetFraction = targetFraction >= 0.5 ? 0 : 1;
    else targetFraction = targetFraction >= 0.5 ? 1 : 0;
    root.setAttribute('aria-checked', String(targetFraction === 1));
    fractionSpring.to(targetFraction, SPRING_VALUE);
    setPressed(false);
    dragRect = null;
  };
  root.addEventListener('pointerup', release);
  root.addEventListener('pointercancel', release);
  root.addEventListener('lostpointercapture', release);
  root.addEventListener('keydown', (event) => {
    if (![' ', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'ArrowLeft') targetFraction = 0;
    else if (event.key === 'ArrowRight') targetFraction = 1;
    else targetFraction = targetFraction >= 0.5 ? 0 : 1;
    root.setAttribute('aria-checked', String(targetFraction === 1));
    fractionSpring.to(targetFraction, SPRING_VALUE);
  });
}


export function glassControlsLab() {
  return `
    <section class="catalog-hero">
      <div class="container catalog-hero__inner reveal">
        <span class="eyebrow">Backdrop Catalog / Web Recreation</span>
        <h1>Liquid Glass<br>不是一层毛玻璃。</h1>
        <p>这一页按 Kyant0 / AndroidLiquidGlass 的 Backdrop Catalog 组件参数重构。核心控件不再使用旧的普通玻璃皮肤，而是按 Catalog 的 lens、blur、色散、按压高光和拖拽形变模型运行。</p>
      </div>
    </section>

    <section class="catalog-showcase">
      <div class="container catalog-showcase__grid">
        <article class="catalog-demo reveal">
          <div class="catalog-demo__copy">
            <span>01 / LiquidButton</span>
            <h2>Buttons</h2>
            <p>48px 高度、2px blur、12/24 lens。按压时整体弹性放大，并根据手指拖动方向产生轻微非均匀拉伸和局部高光。</p>
          </div>
          <div class="catalog-canvas catalog-canvas--buttons">
            ${liquidButton({ label: 'Transparent Liquid Button', preset: 'catalog-button' })}
            ${liquidButton({ label: 'Surface Liquid Button', preset: 'catalog-button-surface', attributes: 'data-shared-surface-button' })}
            ${liquidButton({ label: 'Tinted Liquid Button', preset: 'catalog-button-blue', className: 'catalog-button--tinted' })}
            ${liquidButton({ label: 'Tinted Liquid Button', preset: 'catalog-button-orange', className: 'catalog-button--tinted' })}
          </div>
        </article>

        <article class="catalog-demo reveal">
          <div class="catalog-demo__copy">
            <span>02 / LiquidToggle</span>
            <h2>Toggle</h2>
            <p>轨道 64×28，thumb 40×24。空闲时 thumb 是柔焦白色实体；按下/拖动时白色表面逐渐消失，切换为带色散的 5/10 lens，并放大到 1.5×。</p>
          </div>
          <div class="catalog-canvas catalog-canvas--center">
            <button class="catalog-toggle" data-catalog-toggle type="button" role="switch" aria-checked="false" aria-label="Liquid toggle">
              <span class="catalog-toggle__thumb liquid-glass" data-glass-preset="catalog-toggle-thumb"></span>
            </button>
          </div>
        </article>

        <article class="catalog-demo reveal">
          <div class="catalog-demo__copy">
            <span>03 / LiquidSlider</span>
            <h2>Slider</h2>
            <p>6px 轨道，thumb 同样为 40×24。按住时启用 10/14 lens 与 RGB dispersion，拖得越快，thumb 越明显地沿速度方向弹性变形。</p>
          </div>
          <div class="catalog-canvas catalog-canvas--center">
            ${liquidSlider({ value: 46, ariaLabel: 'Liquid slider' })}
          </div>
        </article>

        <article class="catalog-demo catalog-demo--wide reveal">
          <div class="catalog-demo__copy">
            <span>04 / LiquidBottomTabs</span>
            <h2>Bottom tabs</h2>
            <p>外层 64px 高、4px padding、8px blur、24/24 lens；选中胶囊 56px 高。你可以直接按住选中胶囊左右拖，它会按速度拉伸并弹回最近的 Tab。</p>
          </div>
          <div class="catalog-canvas catalog-canvas--tabs">
            ${liquidBottomTabs({
              items: [1, 2, 3, 4].map((n) => ({ id: `tab-${n}`, label: `Tab ${n}`, icon: planeIcon })),
              selected: 0,
              ariaLabel: 'Catalog Liquid Bottom Tabs',
              indicatorSurfaceRgb: '0 0 0',
              indicatorIdleAlpha: 0.10,
              indicatorPressedAlpha: 0.03,
            })}
          </div>
        </article>
      </div>
    </section>

    <section class="section section--compact catalog-note">
      <div class="container catalog-note__inner reveal">
        <div><span class="eyebrow">Implementation</span><h2>按 Backdrop Catalog 的状态模型重写。</h2></div>
        <p>控件页回到实时 SVG displacement / backdrop 管线，但重构为共享滤镜资源、位移图缓存、接近视口才初始化；静态 Button 与 Tabs 外壳使用局部背景缓存，动态 thumb 只在真正按压时启用折射。视觉参数仍按 Backdrop Catalog 的 lens / blur / 高光与弹簧模型。</p>
      </div>
    </section>`;
}

export function bindGlassControls() {
  bindLiquidButtons(document.querySelector('#main') || document);
  document.querySelectorAll('[data-catalog-toggle]').forEach(bindCatalogToggle);
  bindLiquidSliders(document.querySelector('#main') || document);
  document.querySelectorAll('[data-liquid-bottom-tabs]').forEach(bindLiquidBottomTabs);
}

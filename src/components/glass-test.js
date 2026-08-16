import { icons } from '../utils/icons.js';

export function glassTest() {
  return `<div class="glass-test" data-glass-test>
    <div class="glass-test__scene" aria-hidden="true">
      <div class="glass-test__shape"></div>
      <div class="glass-test__shape glass-test__shape--small"></div>
      <div class="glass-test__ribbon"></div>
      <p class="mono glass-test__label">Text / soft gradient / color / geometric shape</p>
      <p class="glass-test__copy">玻璃中心应该保持接近原始页面的清晰度；真正明显的位移集中在圆角和边缘附近。滚动页面时，玻璃处理的是背后的实时内容，不再生成 WebGL 页面截图。</p>
    </div>
    <button class="icon-button glass-test__close" aria-label="关闭 Liquid Glass 测试" data-glass-test-close>${icons.close(20)}</button>
    <div class="glass-test__pane liquid-glass" data-glass-preset="test">
      <div class="glass-content">
        <span class="eyebrow">LiquidGlassTest · SVG displacement</span>
        <h2>Clear center. Refracted edge.</h2>
        <p class="muted">Live backdrop · SDF edge map · feDisplacementMap · zero tint</p>
      </div>
    </div>
  </div>`;
}

export function maybeMountGlassTest() {
  const params = new URLSearchParams(location.search);
  if (!params.has('glass-test') || document.querySelector('[data-glass-test]')) return false;
  document.body.insertAdjacentHTML('beforeend', glassTest());
  document.querySelector('[data-glass-test-close]')?.addEventListener('click', () => {
    const url = new URL(location.href);
    url.searchParams.delete('glass-test');
    location.href = url.toString();
  });
  return true;
}

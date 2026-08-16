import { setLiquidGlassState } from '../glass/liquid-glass.js';
import {
  SpringValue,
  queueCatalogRender,
  SPRING_INTERACTIVE,
  SPRING_VALUE,
  SPRING_PRESS,
  SPRING_SCALE_X,
  SPRING_SCALE_Y,
} from '../animation/catalog-motion.js';
import { escapeHtml } from '../utils/html.js';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const sign = (v) => (v < 0 ? -1 : v > 0 ? 1 : 0);

// androidx.compose.animation.core.EaseOut = CubicBezierEasing(0, 0, .58, 1).
// Solve x(t)=fraction, then return y(t), matching Compose instead of substituting
// a generic cubic-out curve. This only drives the tiny ±4dp panel drag offset.
function easeOut(fraction) {
  const x = clamp(fraction, 0, 1);
  if (x === 0 || x === 1) return x;
  const x2 = 0.58;
  let t = x;
  for (let i = 0; i < 5; i += 1) {
    const mt = 1 - t;
    const estimate = 3 * mt * t * t * x2 + t * t * t;
    const derivative = 6 * mt * t * x2 + 3 * t * t * (1 - x2);
    if (Math.abs(derivative) < 1e-6) break;
    t = clamp(t - (estimate - x) / derivative, 0, 1);
  }
  const mt = 1 - t;
  return 3 * mt * t * t + t * t * t;
}

function renderItem(item, index, selectedIndex) {
  const selected = index === selectedIndex;
  const tag = item.href ? 'a' : 'button';
  const href = item.href ? ` href="${escapeHtml(item.href)}"` : '';
  const target = item.target ? ` target="${escapeHtml(item.target)}"` : '';
  const rel = item.rel ? ` rel="${escapeHtml(item.rel)}"` : '';
  const type = tag === 'button' ? ' type="button"' : '';
  const current = selected && item.href ? ' aria-current="page"' : '';
  const itemId = item.id ? ` data-tab-id="${escapeHtml(item.id)}"` : '';
  const className = ['catalog-tab', item.className || '', selected ? 'is-selected' : ''].filter(Boolean).join(' ');
  const icon = item.icon || '';
  return `<${tag} class="${className}"${href}${target}${rel}${type}${current}${itemId}>${icon}<span>${escapeHtml(item.label)}</span></${tag}>`;
}

/**
 * The one Bottom Tabs implementation used by both the Catalog lab and Header.
 * `live` only selects the backdrop source; geometry, optics and motion are shared.
 */
export function liquidBottomTabs({
  items = [],
  selected = 0,
  className = '',
  mode = 'control',
  ariaLabel = 'Liquid Bottom Tabs',
  live = false,
  surfaceOnly = false,
  navigateOnDrag = false,
  // Site usages default to a light capsule. The Catalog lab passes the
  // upstream light-theme black surface explicitly so site tabs can never
  // accidentally regress to an opaque-looking black pill.
  indicatorSurfaceRgb = '255 255 255',
  indicatorIdleAlpha = 0.11,
  indicatorPressedAlpha = 0.04,
} = {}) {
  const selectedIndex = typeof selected === 'string'
    ? Math.max(0, items.findIndex((item) => item.id === selected))
    : clamp(Number(selected) || 0, 0, Math.max(items.length - 1, 0));
  const classes = ['catalog-tabs', 'liquid-bottom-tabs', className].filter(Boolean).join(' ');
  const liveAttr = live ? ' data-glass-live="true"' : '';
  const surfaceOnlyAttr = surfaceOnly ? ' data-glass-surface-only="true"' : '';
  return `
    <div class="${classes}" data-liquid-bottom-tabs data-tabs-mode="${escapeHtml(mode)}" data-tabs-navigate-on-drag="${navigateOnDrag ? 'true' : 'false'}" data-tabs-indicator-idle-alpha="${indicatorIdleAlpha}" data-tabs-indicator-pressed-alpha="${indicatorPressedAlpha}" style="--liquid-tab-count:${Math.max(items.length, 1)}" aria-label="${escapeHtml(ariaLabel)}">
      <span class="catalog-tabs__glass liquid-glass" data-glass-preset="catalog-tabs-panel"${liveAttr}${surfaceOnlyAttr} aria-hidden="true"></span>
      <span class="catalog-tabs__indicator liquid-glass" data-glass-preset="catalog-tab-indicator" data-glass-surface-rgb="${escapeHtml(indicatorSurfaceRgb)}"${liveAttr}${surfaceOnlyAttr} aria-hidden="true"></span>
      <div class="catalog-tabs__items">${items.map((item, index) => renderItem(item, index, selectedIndex)).join('')}</div>
    </div>`;
}

const tabsControllerMap = new WeakMap();

function requestNavigation(root, item, selectedIndex) {
  if (!(item instanceof HTMLAnchorElement) || !item.href) return;
  if (item.target === '_blank') {
    window.open(item.href, '_blank', 'noopener,noreferrer');
    return;
  }
  const event = new CustomEvent('liquidtabs:navigate', {
    bubbles: true,
    cancelable: true,
    detail: { href: item.href, tabId: item.dataset.tabId || '', selectedIndex },
  });
  if (root.dispatchEvent(event)) location.assign(item.href);
}

function emitSelection(root, item, selectedIndex, source = 'click') {
  root.dispatchEvent(new CustomEvent('liquidtabs:change', {
    bubbles: true,
    detail: {
      tabId: item?.dataset?.tabId || '',
      selectedIndex,
      source,
    },
  }));
}

export function setLiquidBottomTabsSelected(root, selected, options = {}) {
  return tabsControllerMap.get(root)?.select(selected, options) ?? false;
}

export function bindLiquidBottomTabs(root) {
  if (!root || root.dataset.liquidBottomTabsBound === '1') return;
  root.dataset.liquidBottomTabsBound = '1';

  const panel = root.querySelector('.catalog-tabs__glass');
  const indicator = root.querySelector('.catalog-tabs__indicator');
  const itemsLayer = root.querySelector('.catalog-tabs__items');
  const items = [...root.querySelectorAll('.catalog-tab')];
  if (!panel || !indicator || !itemsLayer || !items.length) return;

  const maxIndex = items.length - 1;
  const valueRange = Math.max(maxIndex, 1);
  let rootWidth = Math.max(root.offsetWidth || 520, 1);
  let tabWidth = Math.max((rootWidth - 8) / items.length, 1);
  let selectedIndex = Math.max(0, items.findIndex((item) => item.classList.contains('is-selected')));
  let targetValue = selectedIndex;
  let visualValue = selectedIndex;
  let press = 0;
  let interactivePress = 0;
  let scaleX = 1;
  let scaleY = 1;
  let smoothVelocity = 0;
  let panelDrag = 0;
  let dragging = false;
  let lastPointerX = 0;
  let dragStartIndex = selectedIndex;
  let releasePending = false;
  const indicatorIdleAlpha = Number(root.dataset.tabsIndicatorIdleAlpha ?? 0.10);
  const indicatorPressedAlpha = Number(root.dataset.tabsIndicatorPressedAlpha ?? 0.03);

  const syncSelection = () => {
    items.forEach((item, index) => {
      const active = index === selectedIndex;
      item.classList.toggle('is-selected', active);
      if (item instanceof HTMLAnchorElement) {
        if (active && root.dataset.tabsMode === 'navigation') item.setAttribute('aria-current', 'page');
        else item.removeAttribute('aria-current');
      }
    });
  };

  const panelOffsetFor = (raw) => {
    const fraction = clamp(raw / Math.max(rootWidth, 1), -1, 1);
    return 4 * sign(fraction) * easeOut(Math.abs(fraction));
  };

  const beginRelease = () => {
    // InteractiveHighlight fades immediately on gesture end with its own soft
    // .5/300 spring. The selected capsule keeps its DampedDrag press state until
    // the value spring is close to target, matching Catalog's two-stage release.
    interactivePressSpring.to(0, SPRING_INTERACTIVE);
    releasePending = true;
    panelSpring.to(0, { dampingRatio: 1, stiffness: 300, threshold: 0.5 });
    velocitySpring.to(0, SPRING_INTERACTIVE);
    requestRender();
  };

  const finishReleaseIfReady = () => {
    if (!releasePending) return;
    const threshold = valueRange * 0.025;
    if (Math.abs(visualValue - targetValue) > threshold) return;
    releasePending = false;
    pressSpring.to(0, SPRING_PRESS);
    scaleXSpring.to(1, SPRING_SCALE_X);
    scaleYSpring.to(1, SPRING_SCALE_Y);

    // Navigation deliberately does NOT happen here. Catalog has only just begun
    // the release springs at this point; unloading the document now visibly cuts
    // the lens/scale animation. render() waits for the full release handoff below.
  };

  const render = () => {
    const panelOffset = panelOffsetFor(panelDrag);
    const x = 4 + clamp(visualValue, 0, maxIndex) * tabWidth + panelOffset;
    const velocity = smoothVelocity / 10;
    const velocityX = clamp(velocity * 0.75, -0.2, 0.2);
    const velocityY = clamp(velocity * 0.25, -0.2, 0.2);
    const sx = scaleX / (1 - velocityX);
    const sy = scaleY * (1 - velocityY);
    const panelScale = 1 + (16 / Math.max(rootWidth, 1)) * press;

    // Match Catalog's secondary panel motion. Panel + its visible content drift
    // together by at most 4dp, while the selected capsule adds its own motion.
    const panelTransform = `translate3d(${panelOffset.toFixed(3)}px,0,0) scale(${panelScale.toFixed(6)})`;
    panel.style.transform = panelTransform;
    itemsLayer.style.transform = panelTransform;
    indicator.style.transform = `translate3d(${x.toFixed(3)}px,4px,0) scale(${sx.toFixed(5)},${sy.toFixed(5)})`;

    // InteractiveHighlight on the Catalog panel follows the selected capsule's
    // center, not the raw pointer. The static 0.5px Highlight.Default remains on.
    const panelHighlightX = clamp(((x + tabWidth * 0.5) / Math.max(rootWidth, 1)) * 100, 0, 100);
    setLiquidGlassState(panel, {
      press: interactivePress,
      pointerX: panelHighlightX,
      pointerY: 50,
    });

    // Surface colour/alpha are supplied per usage. The Catalog lab explicitly
    // requests its upstream black 10%/3% capsule; site UI defaults to light.
    setLiquidGlassState(indicator, {
      intensity: press,
      highlightAlpha: press,
      innerShadowAlpha: 0.15 * press,
      outerShadowAlpha: 0.10 * press,
      surfaceAlpha: indicatorIdleAlpha * (1 - press) + indicatorPressedAlpha * press,
      // Catalog's indicator samples a combined backdrop that already contains
      // InteractiveHighlight. Web SVG filters cannot sample that sibling layer
      // reliably, so mirror the same local highlight inside the indicator.
      press: interactivePress,
      pointerX: 50,
      pointerY: 50,
    });

    finishReleaseIfReady();

  };

  const requestRender = () => queueCatalogRender(render);
  const velocitySpring = new SpringValue(0, (value) => {
    smoothVelocity = value;
    requestRender();
  });
  const valueSpring = new SpringValue(selectedIndex, (value, velocity) => {
    visualValue = value;
    // Catalog feeds measured value velocity through a second 0.5/300 spring.
    velocitySpring.to(velocity / valueRange, SPRING_INTERACTIVE);
    requestRender();
  });
  const pressSpring = new SpringValue(0, (value) => {
    press = clamp(value, 0, 1);
    requestRender();
  });
  // InteractiveHighlight is a distinct Catalog animation: dampingRatio .5 /
  // stiffness 300. Do not couple it to the much stiffer DampedDrag press spring.
  const interactivePressSpring = new SpringValue(0, (value) => {
    interactivePress = clamp(value, 0, 1);
    requestRender();
  });
  const scaleXSpring = new SpringValue(1, (value) => {
    scaleX = value;
    requestRender();
  });
  const scaleYSpring = new SpringValue(1, (value) => {
    scaleY = value;
    requestRender();
  });
  const panelSpring = new SpringValue(0, (value) => {
    panelDrag = value;
    requestRender();
  });

  const updateMetrics = () => {
    rootWidth = Math.max(root.offsetWidth || rootWidth, 1);
    tabWidth = Math.max((rootWidth - 8) / items.length, 1);
    // Width only changes on actual layout resize, never on every spring frame.
    indicator.style.width = `${tabWidth.toFixed(2)}px`;
    requestRender();
  };

  const resizeObserver = new ResizeObserver(updateMetrics);
  resizeObserver.observe(root);

  const setPressed = (pressed) => {
    if (pressed) releasePending = false;
    pressSpring.to(pressed ? 1 : 0, SPRING_PRESS);
    const pressedScale = 78 / 56;
    scaleXSpring.to(pressed ? pressedScale : 1, SPRING_SCALE_X);
    scaleYSpring.to(pressed ? pressedScale : 1, SPRING_SCALE_Y);
  };

  const animateToIndex = (index) => {
    selectedIndex = clamp(index, 0, maxIndex);
    targetValue = selectedIndex;
    syncSelection();
    setPressed(true);
    valueSpring.to(targetValue, SPRING_VALUE);
    velocitySpring.to(0, SPRING_INTERACTIVE);
    beginRelease();
  };

  syncSelection();
  updateMetrics();
  render();

  items.forEach((item, index) => {
    item.addEventListener('click', (event) => {
      if (item instanceof HTMLAnchorElement) {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || item.hasAttribute('download') || item.target === '_blank') return;
        event.preventDefault();
      }
      animateToIndex(index);
      if (item instanceof HTMLAnchorElement) {
        // Give the Catalog spring scheduler one frame to visibly begin, then
        // hand the route to the SPA. The Header itself remains mounted.
        queueCatalogRender(() => requestNavigation(root, item, selectedIndex));
      } else {
        emitSelection(root, item, selectedIndex, 'click');
      }
    });
  });

  indicator.addEventListener('pointerdown', (event) => {
    dragging = true;
    dragStartIndex = selectedIndex;
    lastPointerX = event.clientX;
    indicator.setPointerCapture(event.pointerId);
    setPressed(true);
    interactivePressSpring.to(1, SPRING_INTERACTIVE);
  });

  indicator.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const dx = event.clientX - lastPointerX;
    lastPointerX = event.clientX;
    if (!Number.isFinite(dx) || Math.abs(dx) < 0.001) return;

    // Catalog updates from the current target + drag delta, instead of deriving
    // value from an absolute pointer coordinate. This keeps fast drags damped.
    targetValue = clamp(valueSpring.target + dx / tabWidth, 0, maxIndex);
    valueSpring.to(targetValue, SPRING_VALUE);
    panelSpring.snap(panelSpring.value + dx);
  });

  const release = () => {
    if (!dragging) return;
    dragging = false;
    selectedIndex = clamp(Math.round(valueSpring.target), 0, maxIndex);
    targetValue = selectedIndex;
    syncSelection();
    valueSpring.to(targetValue, SPRING_VALUE);
    beginRelease();

    if (selectedIndex !== dragStartIndex) {
      const destination = items[selectedIndex];
      if (root.dataset.tabsMode === 'navigation'
        && root.dataset.tabsNavigateOnDrag === 'true'
        && destination instanceof HTMLAnchorElement) {
        queueCatalogRender(() => requestNavigation(root, destination, selectedIndex));
      } else if (root.dataset.tabsMode !== 'navigation') {
        emitSelection(root, destination, selectedIndex, 'drag');
      }
    }
  };

  const select = (selected, { animate = true } = {}) => {
    const index = typeof selected === 'string'
      ? items.findIndex((item) => item.dataset.tabId === selected)
      : Number(selected);
    if (!Number.isInteger(index) || index < 0 || index > maxIndex) return false;
    selectedIndex = index;
    targetValue = index;
    syncSelection();
    if (animate) {
      setPressed(true);
      valueSpring.to(targetValue, SPRING_VALUE);
      velocitySpring.to(0, SPRING_INTERACTIVE);
      beginRelease();
    } else {
      valueSpring.snap(targetValue);
      velocitySpring.snap(0);
      pressSpring.snap(0);
      interactivePressSpring.snap(0);
      scaleXSpring.snap(1);
      scaleYSpring.snap(1);
      panelSpring.snap(0);
    }
    requestRender();
    return true;
  };
  tabsControllerMap.set(root, { select });

  indicator.addEventListener('pointerup', release);
  indicator.addEventListener('pointercancel', release);
  indicator.addEventListener('lostpointercapture', release);
}

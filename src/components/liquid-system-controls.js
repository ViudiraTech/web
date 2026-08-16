import { liquidButton, bindLiquidButtons } from './liquid-button.js';
import { liquidToggle, bindLiquidToggles } from './liquid-toggle.js';
import { liquidSlider, bindLiquidSliders } from './liquid-slider.js';
import { liquidBottomTabs, bindLiquidBottomTabs } from './liquid-bottom-tabs.js';

const PLATFORM_PRESETS = {
  ios: {
    control: 'ios-control',
    clear: 'ios-clear-control',
    popover: 'ios-popover',
  },
  macos: {
    control: 'macos-control',
    clear: 'macos-clear-control',
    popover: 'macos-popover',
  },
};

function normalizedPlatform(platform) {
  return platform === 'macos' ? 'macos' : 'ios';
}

export function systemButton({
  platform = 'ios',
  role = 'control',
  label = '',
  className = '',
  attributes = '',
  ariaLabel = '',
  type = 'button',
  href = '',
  target = '',
  rel = '',
} = {}) {
  const key = normalizedPlatform(platform);
  const preset = PLATFORM_PRESETS[key][role] || PLATFORM_PRESETS[key].control;
  const classes = [
    'system-liquid-button',
    `system-liquid-button--${key}`,
    `system-liquid-button--${role}`,
    className,
  ].filter(Boolean).join(' ');
  const aria = ariaLabel ? ` aria-label="${String(ariaLabel).replaceAll('"', '&quot;')}"` : '';
  return liquidButton({
    label,
    preset,
    className: classes,
    live: true,
    inlineLive: true,
    // Shared system buttons keep LiquidButton geometry/spring/highlights, but
    // do not allocate one independent live SVG backdrop filter each. The parent
    // system chrome (Dock/toolbars/popovers) owns real refraction; controls sit
    // on that optical plane as a lightweight interactive glass surface.
    attributes: `${attributes}${aria} data-glass-surface-only="true"`,
    type,
    href,
    target,
    rel,
  });
}

export function systemToggle({ platform = 'ios', className = '', ...options } = {}) {
  const key = normalizedPlatform(platform);
  return liquidToggle({
    ...options,
    className: ['system-liquid-toggle', `system-liquid-toggle--${key}`, className].filter(Boolean).join(' '),
  });
}

export function systemSlider({ platform = 'ios', className = '', ...options } = {}) {
  const key = normalizedPlatform(platform);
  return liquidSlider({
    ...options,
    className: ['system-liquid-slider', `system-liquid-slider--${key}`, className].filter(Boolean).join(' '),
  });
}

export function systemTabs({ platform = 'ios', className = '', live = true, ...options } = {}) {
  const key = normalizedPlatform(platform);
  return liquidBottomTabs({
    ...options,
    live,
    className: ['system-liquid-tabs', `system-liquid-tabs--${key}`, className].filter(Boolean).join(' '),
  });
}

export function bindSystemControls(root = document) {
  bindLiquidButtons(root);
  bindLiquidToggles(root);
  bindLiquidSliders(root);
  root?.querySelectorAll?.('[data-liquid-bottom-tabs]').forEach(bindLiquidBottomTabs);
}

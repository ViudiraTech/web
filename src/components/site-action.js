import { isSiteLiquidEnabled } from '../glass/site-preferences.js';
import { liquidButton } from './liquid-button.js';

const LIQUID_PRESETS = {
  primary: 'catalog-button-clay',
  secondary: 'catalog-button-surface',
};

/**
 * Button-shaped call to action used across the public site.
 *
 * With Liquid Glass off it is a plain, flat button. With Liquid Glass on it is
 * the shared Catalog LiquidButton, so material + motion stay in liquid-button.js.
 */
export function siteAction({
  label,
  href = '',
  variant = 'secondary',
  compact = false,
  external = false,
  className = '',
  sampleMode = '',
  attributes = '',
} = {}) {
  const target = external ? '_blank' : '';
  const rel = external ? 'noreferrer' : '';

  if (isSiteLiquidEnabled()) {
    return liquidButton({
      label,
      preset: LIQUID_PRESETS[variant] || LIQUID_PRESETS.secondary,
      className: [
        variant === 'primary' ? 'catalog-button--tinted' : '',
        'site-liquid-action',
        compact ? 'site-liquid-action--compact' : '',
        className,
      ].filter(Boolean).join(' '),
      backdrop: 'ambient',
      sampleMode,
      href,
      target,
      rel,
      attributes: `data-glass-settings-scope="site" ${attributes}`.trim(),
    });
  }

  const classes = ['btn', `btn--${variant}`, compact ? 'btn--compact' : '', className].filter(Boolean).join(' ');
  if (!href) return `<button class="${classes}" type="button" ${attributes}>${label}</button>`;
  const targetAttr = target ? ` target="${target}" rel="${rel}"` : '';
  return `<a class="${classes}" href="${href}"${targetAttr} ${attributes}>${label}</a>`;
}

/** The header switch that turns site-wide Liquid Glass on and off. */
export function glassSwitch({ className = '' } = {}) {
  const on = isSiteLiquidEnabled();
  return `<button class="glass-switch ${className}" type="button" role="switch" aria-checked="${on}" data-glass-switch title="${on ? '关闭' : '开启'}液态玻璃">
    <span class="glass-switch__label">液态玻璃</span>
    <span class="glass-switch__track" aria-hidden="true"><span class="glass-switch__thumb"></span></span>
  </button>`;
}

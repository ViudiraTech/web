import { liquidSlider, bindLiquidSliders } from './liquid-slider.js';
import { liquidButton, bindLiquidButtons } from './liquid-button.js';
import {
  DEFAULT_SITE_GLASS_PREFERENCES,
  getSiteGlassPreferences,
  setSiteGlassPreferences,
  resetSiteGlassPreferences,
} from '../glass/site-preferences.js';
import { refreshSiteGlassPreferences } from '../glass/liquid-glass.js';

function settingRow({ key, title, description, value }) {
  return `<div class="settings-control" data-setting-row="${key}">
    <div class="settings-control__copy">
      <div class="settings-control__title"><strong>${title}</strong><output data-setting-output="${key}">${Math.round(value)}%</output></div>
      <p>${description}</p>
    </div>
    ${liquidSlider({
      value,
      min: 0,
      max: 100,
      step: 1,
      ariaLabel: `${title} ${Math.round(value)}%`,
      setting: key,
      className: 'settings-control__slider',
    })}
  </div>`;
}

export function settingsPage() {
  const settings = getSiteGlassPreferences();
  return `<section class="settings-hero">
    <div class="container settings-hero__inner reveal">
      <span class="eyebrow">Settings / Liquid Glass</span>
      <h1>玻璃材质，按你的屏幕来。</h1>
      <p>这里调整的是网站界面使用的 Liquid Glass。Header、导航玻璃、移动菜单和项目详情会实时跟随；Liquid UI Lab 的 Catalog 测试控件保持原始参数，不被这些设置修改。</p>
    </div>
  </section>

  <section class="section settings-section">
    <div class="container settings-layout">
      <div class="settings-panel reveal">
        <div class="settings-panel__head">
          <div>
            <span class="eyebrow">Material</span>
            <h2>透明与模糊</h2>
          </div>
          ${liquidButton({
            label: '恢复默认',
            preset: 'catalog-button-surface',
            backdrop: 'ambient',
            attributes: 'data-settings-reset data-shared-surface-button',
          })}
        </div>
        ${settingRow({
          key: 'transparency',
          title: '透明度',
          description: '调整站点玻璃表面的透明程度。50% 保持设计默认；向右更通透，向左更实体。',
          value: settings.transparency,
        })}
        ${settingRow({
          key: 'blur',
          title: '模糊度',
          description: '调整站点玻璃的背景模糊强度。50% 保持设计默认；不会改变折射位移图分辨率。',
          value: settings.blur,
        })}
        <div class="settings-isolation-note">
          <span>LAB ISOLATION</span>
          <p><strong>控件测试页被隔离。</strong> Buttons、Toggle、Liquid Slider、Bottom Tabs 仍使用 Backdrop Catalog 的固定 blur / surface 参数，因此这里怎么调都不会把测试数据改掉。</p>
        </div>
      </div>

      <aside class="settings-preview reveal" aria-label="Liquid Glass 设置实时预览">
        <div class="settings-preview__scene">
          <div class="settings-preview__orb settings-preview__orb--a"></div>
          <div class="settings-preview__orb settings-preview__orb--b"></div>
          <div class="settings-preview__glass liquid-glass" data-glass-preset="header-backplate" data-glass-settings-scope="site" data-glass-live="true">
            <span>LIVE PREVIEW</span>
            <strong>Viudira Liquid Glass</strong>
            <p>拖动左侧与下方的 Catalog Slider，这块玻璃和 Header 会同步变化。</p>
          </div>
        </div>
      </aside>
    </div>
  </section>`;
}

function updateOutputs(root, settings) {
  for (const key of ['transparency', 'blur']) {
    const output = root.querySelector(`[data-setting-output="${key}"]`);
    if (output) output.textContent = `${Math.round(settings[key])}%`;
    const input = root.querySelector(`[data-setting-slider="${key}"] input[type="range"]`);
    if (input) input.setAttribute('aria-label', `${key === 'transparency' ? '透明度' : '模糊度'} ${Math.round(settings[key])}%`);
  }
}

export function bindSettingsPage(root = document.querySelector('#main') || document) {
  if (!root) return;
  bindLiquidSliders(root);
  bindLiquidButtons(root);
  updateOutputs(root, getSiteGlassPreferences());

  root.querySelectorAll('[data-setting-slider]').forEach((slider) => {
    if (slider.dataset.settingBound === '1') return;
    slider.dataset.settingBound = '1';
    slider.addEventListener('liquidslider:input', (event) => {
      const key = slider.dataset.settingSlider;
      if (!['transparency', 'blur'].includes(key)) return;
      const settings = setSiteGlassPreferences({ [key]: event.detail.value });
      refreshSiteGlassPreferences();
      updateOutputs(root, settings);
    });
  });

  const reset = root.querySelector('[data-settings-reset]');
  if (reset && reset.dataset.settingBound !== '1') {
    reset.dataset.settingBound = '1';
    reset.addEventListener('click', () => {
      const settings = resetSiteGlassPreferences();
      root.querySelectorAll('[data-setting-slider]').forEach((slider) => {
        const key = slider.dataset.settingSlider;
        const controller = slider._liquidSliderController;
        controller?.setValue(settings[key] ?? DEFAULT_SITE_GLASS_PREFERENCES[key], { animate: true });
      });
      refreshSiteGlassPreferences();
      updateOutputs(root, settings);
    });
  }
}

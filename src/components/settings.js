import { liquidSlider, bindLiquidSliders } from './liquid-slider.js';
import { liquidButton, bindLiquidButtons } from './liquid-button.js';
import { liquidToggle, bindLiquidToggles } from './liquid-toggle.js';
import { showLiquidDialog } from './liquid-dialog.js';
import {
  DEFAULT_SITE_GLASS_PREFERENCES,
  getSiteGlassPreferences,
  setSiteGlassPreferences,
  resetSiteGlassPreferences,
} from '../glass/site-preferences.js';
import { refreshSiteGlassPreferences } from '../glass/liquid-glass.js';
import { applyReadabilityGlassMode } from '../glass/readability-glass.js';

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

function liquidReadabilityRow(enabled) {
  return `<div class="settings-control settings-control--toggle" data-setting-row="readabilityLiquid">
    <div class="settings-control__copy">
      <div class="settings-control__title"><strong>易读背景使用完整 Liquid Glass</strong><output data-setting-output="readabilityLiquid">${enabled ? '开启' : '关闭'}</output></div>
      <p>关闭时，文字易读层使用轻量 CSS 毛玻璃；开启后，仅这些阅读底切换为完整 Liquid Glass。项目卡、Network、技术图和其它内容卡仍保持各自原有材质。</p>
    </div>
    <div class="settings-control__toggle-wrap">
      ${liquidToggle({
        checked: enabled,
        ariaLabel: '易读背景使用完整 Liquid Glass',
        setting: 'readabilityLiquid',
        className: 'settings-control__toggle',
      })}
    </div>
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
            <h2 data-macos-easter-trigger tabindex="0" aria-label="透明与模糊">透明与模糊</h2>
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
        ${liquidReadabilityRow(settings.readabilityLiquid)}
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
  const readability = root.querySelector('[data-setting-output="readabilityLiquid"]');
  if (readability) readability.textContent = settings.readabilityLiquid ? '开启' : '关闭';
}

function syncControlsToSettings(root, settings, { animate = true } = {}) {
  root.querySelectorAll('[data-setting-slider]').forEach((slider) => {
    const key = slider.dataset.settingSlider;
    slider._liquidSliderController?.setValue(settings[key] ?? DEFAULT_SITE_GLASS_PREFERENCES[key], { animate });
  });
  const toggle = root.querySelector('[data-setting-toggle="readabilityLiquid"]');
  toggle?._liquidToggleController?.setChecked(settings.readabilityLiquid, { animate, emit: false, source: 'settings-sync' });
  updateOutputs(root, settings);
}

export function bindSettingsPage(root = document.querySelector('#main') || document) {
  if (!root) return;
  bindLiquidSliders(root);
  bindLiquidButtons(root);
  bindLiquidToggles(root);
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

  const readabilityToggle = root.querySelector('[data-setting-toggle="readabilityLiquid"]');
  if (readabilityToggle && readabilityToggle.dataset.settingBound !== '1') {
    readabilityToggle.dataset.settingBound = '1';
    let promptPending = false;

    readabilityToggle.addEventListener('liquidtoggle:change', async (event) => {
      const wantsEnabled = Boolean(event.detail?.checked);
      const controller = readabilityToggle._liquidToggleController;
      const committed = getSiteGlassPreferences().readabilityLiquid;

      // The setting is transactional: the switch mirrors only the committed
      // preference. While the confirmation dialog is open, ignore duplicate
      // touch/pointer events instead of opening/closing multiple dialog states.
      if (promptPending) {
        controller?.setChecked(committed, { animate: true, emit: false, source: 'dialog-pending' });
        return;
      }

      if (wantsEnabled === committed) {
        controller?.setChecked(committed, { animate: true, emit: false, source: 'already-committed' });
        updateOutputs(root, getSiteGlassPreferences());
        return;
      }

      if (!wantsEnabled) {
        const settings = setSiteGlassPreferences({ readabilityLiquid: false });
        applyReadabilityGlassMode(document);
        refreshSiteGlassPreferences();
        updateOutputs(root, settings);
        return;
      }

      // Do not visually commit ON before the user confirms. This removes the
      // phone-only race where a tiny pointer drift could leave the switch ON,
      // close/reopen a dialog, or require several taps before one dialog survives.
      controller?.setChecked(false, { animate: true, emit: false, source: 'awaiting-confirmation' });
      promptPending = true;
      readabilityToggle.disabled = true;
      readabilityToggle.setAttribute('aria-busy', 'true');

      let approved = false;
      try {
        approved = await showLiquidDialog({
          title: '开启完整 Liquid Glass？',
          message: '用于提升文字可读性的毛玻璃阅读底将切换为完整的折射材质。',
          detail: '开启后，可见的易读层保持完整 SVG lens、blur、depth、highlight 与阴影；页面滚动不会再自动退回普通毛玻璃。Liquid UI Lab 仍保持隔离。',
          cancelLabel: '保持毛玻璃',
          confirmLabel: '开启',
        });
      } finally {
        promptPending = false;
        readabilityToggle.disabled = false;
        readabilityToggle.removeAttribute('aria-busy');
      }

      if (!approved) {
        controller?.setChecked(false, { animate: true, emit: false, source: 'dialog-cancel' });
        updateOutputs(root, getSiteGlassPreferences());
        return;
      }

      const settings = setSiteGlassPreferences({ readabilityLiquid: true });
      applyReadabilityGlassMode(document);
      refreshSiteGlassPreferences();
      controller?.setChecked(true, { animate: true, emit: false, source: 'dialog-confirm' });
      updateOutputs(root, settings);
    });
  }

  const easterTrigger = root.querySelector('[data-macos-easter-trigger]');
  if (easterTrigger && easterTrigger.dataset.easterBound !== '1') {
    easterTrigger.dataset.easterBound = '1';
    let taps = 0;
    let lastTapAt = 0;
    let easterPending = false;

    const attemptEasterEgg = async () => {
      const now = performance.now();
      if (now - lastTapAt > 1200) taps = 0;
      lastTapAt = now;
      taps += 1;
      easterTrigger.classList.remove('is-easter-tapped');
      requestAnimationFrame(() => easterTrigger.classList.add('is-easter-tapped'));
      if (taps < 3 || easterPending) return;
      taps = 0;
      easterPending = true;
      let enter = false;
      try {
        enter = await showLiquidDialog({
          title: '进入模拟 macOS 27？',
          message: '你发现了 ViudiraTech 设置里的隐藏入口。',
          detail: '进入后会打开一个全屏 macOS 27 Golden Gate 风格桌面模拟器。Finder、系统设置、控制中心、Dock 以及 Liquid Glass 控件都可以交互。',
          cancelLabel: '留在设置',
          confirmLabel: '进入桌面',
        });
      } finally {
        easterPending = false;
      }
      if (enter) location.hash = '#/macos27';
    };

    easterTrigger.addEventListener('click', attemptEasterEgg);
    easterTrigger.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      attemptEasterEgg();
    });
  }

  const reset = root.querySelector('[data-settings-reset]');
  if (reset && reset.dataset.settingBound !== '1') {
    reset.dataset.settingBound = '1';
    reset.addEventListener('click', () => {
      const settings = resetSiteGlassPreferences();
      syncControlsToSettings(root, settings, { animate: true });
      applyReadabilityGlassMode(document);
      refreshSiteGlassPreferences();
    });
  }
}

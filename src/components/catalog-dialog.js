import { activateLiquidGlassElement, suspendLiquidGlassElement } from '../glass/liquid-glass.js';
import { escapeHtml } from '../utils/html.js';

export function catalogDialog({
  id = 'catalog-dialog',
  title,
  body,
  cancelLabel = '取消',
  confirmLabel = '确定',
  eyebrow = 'Liquid Glass',
} = {}) {
  return `<div class="catalog-dialog-layer" data-catalog-dialog="${escapeHtml(id)}" aria-hidden="true">
    <button class="catalog-dialog__scrim" type="button" tabindex="-1" aria-label="关闭对话框" data-catalog-dialog-cancel></button>
    <section class="catalog-dialog__panel liquid-glass" data-glass-preset="catalog-dialog" data-glass-backdrop="ambient" data-glass-defer="true" role="dialog" aria-modal="true" aria-labelledby="${escapeHtml(id)}-title">
      <div class="catalog-dialog__copy">
        <span class="catalog-dialog__eyebrow">${escapeHtml(eyebrow)}</span>
        <h2 id="${escapeHtml(id)}-title">${escapeHtml(title || '')}</h2>
        <p>${escapeHtml(body || '')}</p>
      </div>
      <div class="catalog-dialog__actions">
        <button class="catalog-dialog__button catalog-dialog__button--cancel" type="button" data-catalog-dialog-cancel>${escapeHtml(cancelLabel)}</button>
        <button class="catalog-dialog__button catalog-dialog__button--confirm" type="button" data-catalog-dialog-confirm>${escapeHtml(confirmLabel)}</button>
      </div>
    </section>
  </div>`;
}

function waitForExit(layer) {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      layer.removeEventListener('transitionend', onEnd);
      resolve();
    };
    const onEnd = (event) => {
      if (event.target === layer && event.propertyName === 'opacity') finish();
    };
    layer.addEventListener('transitionend', onEnd);
    setTimeout(finish, 280);
  });
}

export function bindCatalogDialog(layer) {
  if (!layer || layer.dataset.catalogDialogBound === '1') return layer?._catalogDialogController || null;
  layer.dataset.catalogDialogBound = '1';
  const panel = layer.querySelector('.catalog-dialog__panel');
  const confirm = layer.querySelector('[data-catalog-dialog-confirm]');
  const cancelButtons = [...layer.querySelectorAll('[data-catalog-dialog-cancel]')];
  let resolver = null;
  let previousFocus = null;
  let previousOverflow = '';

  const close = async (accepted) => {
    if (!resolver) return;
    const resolve = resolver;
    resolver = null;
    layer.classList.remove('is-open');
    layer.setAttribute('aria-hidden', 'true');
    await waitForExit(layer);
    suspendLiquidGlassElement(panel);
    document.body.style.overflow = previousOverflow;
    if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    previousFocus = null;
    resolve(Boolean(accepted));
  };

  const onKeyDown = (event) => {
    if (!resolver) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close(false);
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [...panel.querySelectorAll('button:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])')];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };

  confirm?.addEventListener('click', () => close(true));
  cancelButtons.forEach((button) => button.addEventListener('click', () => close(false)));
  document.addEventListener('keydown', onKeyDown);

  const controller = {
    open() {
      if (resolver) return Promise.resolve(false);
      previousFocus = document.activeElement;
      previousOverflow = document.body.style.overflow;
      activateLiquidGlassElement(panel);
      layer.setAttribute('aria-hidden', 'false');
      // Force the hidden state to commit before the entrance transition.
      layer.getBoundingClientRect();
      layer.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => confirm?.focus());
      return new Promise((resolve) => { resolver = resolve; });
    },
    close,
  };
  layer._catalogDialogController = controller;
  return controller;
}

export function bindCatalogDialogs(root = document) {
  root?.querySelectorAll?.('[data-catalog-dialog]').forEach(bindCatalogDialog);
}

export function openCatalogDialog(target) {
  const layer = typeof target === 'string' ? document.querySelector(`[data-catalog-dialog="${CSS.escape(target)}"]`) : target;
  const controller = bindCatalogDialog(layer);
  return controller?.open?.() ?? Promise.resolve(false);
}

import { escapeHtml } from '../utils/html.js';
import { activateLiquidGlassElement, deactivateLiquidGlassElement } from '../glass/liquid-glass.js';

let activeDialog = null;

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function dialogMarkup({ title, message, detail = '', confirmLabel = '确定', cancelLabel = '取消', accent = true }) {
  return `<div class="liquid-dialog-layer" data-liquid-dialog-layer>
    <div class="liquid-dialog-dim" data-liquid-dialog-dismiss aria-hidden="true"></div>
    <section class="liquid-dialog liquid-glass" data-liquid-dialog data-glass-preset="catalog-dialog" data-glass-backdrop="ambient" data-glass-sample-mode="scroll-timeline" role="dialog" aria-modal="true" aria-labelledby="liquid-dialog-title" aria-describedby="liquid-dialog-description" tabindex="-1">
      <div class="liquid-dialog__content">
        <h2 id="liquid-dialog-title">${escapeHtml(title)}</h2>
        <p id="liquid-dialog-description">${escapeHtml(message)}</p>
        ${detail ? `<p class="liquid-dialog__detail">${escapeHtml(detail)}</p>` : ''}
      </div>
      <div class="liquid-dialog__actions">
        <button class="liquid-dialog__action liquid-dialog__action--cancel" type="button" data-liquid-dialog-cancel>${escapeHtml(cancelLabel)}</button>
        <button class="liquid-dialog__action ${accent ? 'liquid-dialog__action--confirm' : ''}" type="button" data-liquid-dialog-confirm>${escapeHtml(confirmLabel)}</button>
      </div>
    </section>
  </div>`;
}

async function closeDialog(state, result) {
  if (!state || state.closing) return;
  state.closing = true;
  state.layer.classList.add('is-closing');
  await Promise.race([wait(180), new Promise((resolve) => state.dialog.addEventListener('transitionend', resolve, { once: true }))]);
  deactivateLiquidGlassElement(state.dialog);
  state.layer.remove();
  document.body.style.overflow = state.previousOverflow;
  document.removeEventListener('keydown', state.onKeyDown, true);
  if (state.previousFocus instanceof HTMLElement && state.previousFocus.isConnected) state.previousFocus.focus({ preventScroll: true });
  if (activeDialog === state) activeDialog = null;
  state.resolve(result);
}

/**
 * Shared Catalog-style dialog. Resolves true for confirm and false for cancel.
 * The caller owns the setting/action; this component only owns dialog rendering,
 * focus management, Catalog material and dismissal behavior.
 */
export async function showLiquidDialog(options = {}) {
  if (activeDialog) await closeDialog(activeDialog, false);

  const host = document.createElement('div');
  host.innerHTML = dialogMarkup(options);
  const layer = host.firstElementChild;
  const dialog = layer.querySelector('[data-liquid-dialog]');
  const confirm = layer.querySelector('[data-liquid-dialog-confirm]');
  const cancel = layer.querySelector('[data-liquid-dialog-cancel]');
  const dismiss = layer.querySelector('[data-liquid-dialog-dismiss]');
  const previousFocus = document.activeElement;
  const previousOverflow = document.body.style.overflow;

  let resolveResult;
  const result = new Promise((resolve) => { resolveResult = resolve; });
  const state = {
    layer,
    dialog,
    confirm,
    cancel,
    previousFocus,
    previousOverflow,
    resolve: resolveResult,
    closing: false,
    onKeyDown: null,
  };

  state.onKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDialog(state, false);
      return;
    }
    if (event.key !== 'Tab') return;
    const focusables = [cancel, confirm].filter(Boolean);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  activeDialog = state;
  document.body.append(layer);
  document.body.style.overflow = 'hidden';
  activateLiquidGlassElement(dialog);
  document.addEventListener('keydown', state.onKeyDown, true);

  confirm?.addEventListener('click', () => closeDialog(state, true));
  cancel?.addEventListener('click', () => closeDialog(state, false));
  dismiss?.addEventListener('click', () => closeDialog(state, false));

  await nextFrame();
  layer.classList.add('is-open');
  await nextFrame();
  cancel?.focus({ preventScroll: true });
  return result;
}

export function markGlassFallback(reason = 'unsupported') {
  document.documentElement.dataset.glass = 'fallback';
  document.documentElement.dataset.glassReason = reason;
  document.querySelectorAll('.liquid-glass').forEach((node) => node.classList.add('glass-shell'));
}

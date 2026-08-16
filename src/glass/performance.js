export function detectGlassProfile() {
  const mobile = matchMedia('(max-width: 760px)').matches || matchMedia('(pointer: coarse)').matches;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const memory = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  const dpr = Math.max(1, Math.min(devicePixelRatio || 1, 3));

  // SVG displacement maps are generated on the main thread. A full 1:1 map on
  // phone-sized Docks/popovers creates first-interaction stalls for little visible
  // benefit. The vector field scales smoothly, so mobile keeps optical strength
  // while using fewer pixels. Desktop quality remains full-resolution.
  if (mobile || memory <= 4 || cores <= 4) {
    return { name: 'mobile-balanced', mapResolution: dpr >= 2.5 ? 0.66 : 0.72, reduced };
  }
  if (memory <= 8 || cores <= 6) {
    return { name: 'balanced', mapResolution: 0.84, reduced };
  }
  return { name: 'quality', mapResolution: 1.0, reduced };
}

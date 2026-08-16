export function detectGlassProfile() {
  const mobile = matchMedia('(max-width: 760px)').matches;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const memory = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;

  // Map resolution only affects one-time displacement-map generation, not the
  // per-frame compositor cost. Keep it high even on modest hardware and obtain
  // runtime speed from caching/lazy activation instead of lowering glass quality.
  if (mobile || memory <= 4 || cores <= 4) {
    return { name: 'low', mapResolution: 1.0, reduced };
  }
  if (memory <= 8 || cores <= 6) {
    return { name: 'medium', mapResolution: 1.0, reduced };
  }
  return { name: 'high', mapResolution: 1.0, reduced };
}

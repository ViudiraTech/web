const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

// Shared singleton scheduler for every Catalog-style control, including the
// Bottom Tabs used by both the header and the controls lab.
const activeSprings = new Set();
const renderQueue = new Set();
let schedulerFrame = 0;
let lastFrameTime = 0;
let insideFrame = false;

function ensureFrame() {
  if (!schedulerFrame) schedulerFrame = requestAnimationFrame(runFrame);
}

function runFrame(now) {
  schedulerFrame = 0;
  insideFrame = true;
  const elapsed = lastFrameTime ? Math.min(Math.max((now - lastFrameTime) / 1000, 0), 0.05) : 1 / 60;
  lastFrameTime = now;

  for (const spring of [...activeSprings]) {
    if (!spring.step(elapsed)) activeSprings.delete(spring);
  }

  const renders = [...renderQueue];
  renderQueue.clear();
  for (const render of renders) render();
  insideFrame = false;

  if (activeSprings.size || renderQueue.size) ensureFrame();
  else lastFrameTime = 0;
}

export function queueCatalogRender(render) {
  renderQueue.add(render);
  if (!insideFrame) ensureFrame();
}

export class SpringValue {
  constructor(value, onUpdate) {
    this.value = value;
    this.target = value;
    this.velocity = 0;
    this.onUpdate = onUpdate;
    this.stiffness = 300;
    this.dampingRatio = 1;
    this.threshold = 0.001;
  }

  snap(value) {
    activeSprings.delete(this);
    this.value = value;
    this.target = value;
    this.velocity = 0;
    this.onUpdate?.(this.value, this.velocity);
  }

  to(target, { stiffness = 300, dampingRatio = 1, threshold = 0.001 } = {}) {
    this.target = target;
    this.stiffness = stiffness;
    this.dampingRatio = dampingRatio;
    this.threshold = threshold;
    if (reducedMotion) {
      this.snap(target);
      return;
    }
    activeSprings.add(this);
    ensureFrame();
  }

  isSettled(multiplier = 1) {
    const positionThreshold = Math.max(this.threshold * multiplier, 0.0001);
    const velocityThreshold = Math.max(positionThreshold * 20, 0.01);
    return Math.abs(this.value - this.target) <= positionThreshold
      && Math.abs(this.velocity) <= velocityThreshold;
  }

  step(elapsed) {
    // Exact damped-harmonic-oscillator integration. This preserves the Catalog
    // spring constants/velocity while replacing multiple 120 Hz Euler substeps
    // with one stable closed-form solve per display frame.
    const t = Math.min(Math.max(elapsed, 0), 0.05);
    const omega = Math.sqrt(Math.max(this.stiffness, 1e-6));
    const zeta = Math.max(this.dampingRatio, 0);
    const x0 = this.value - this.target;
    const v0 = this.velocity;
    let x;
    let v;

    if (zeta < 0.999999) {
      const decay = zeta * omega;
      const wd = omega * Math.sqrt(Math.max(1 - zeta * zeta, 1e-8));
      const exp = Math.exp(-decay * t);
      const cos = Math.cos(wd * t);
      const sin = Math.sin(wd * t);
      const a = x0;
      const b = (v0 + decay * x0) / wd;
      x = exp * (a * cos + b * sin);
      v = exp * ((-decay * (a * cos + b * sin)) + (-a * wd * sin + b * wd * cos));
    } else if (zeta > 1.000001) {
      const q = Math.sqrt(zeta * zeta - 1);
      const r1 = -omega * (zeta - q);
      const r2 = -omega * (zeta + q);
      const c1 = (v0 - r2 * x0) / (r1 - r2);
      const c2 = x0 - c1;
      const e1 = Math.exp(r1 * t);
      const e2 = Math.exp(r2 * t);
      x = c1 * e1 + c2 * e2;
      v = c1 * r1 * e1 + c2 * r2 * e2;
    } else {
      const exp = Math.exp(-omega * t);
      const b = v0 + omega * x0;
      x = (x0 + b * t) * exp;
      v = (v0 - omega * b * t) * exp;
    }

    this.value = this.target + x;
    this.velocity = v;
    this.onUpdate?.(this.value, this.velocity);
    const settled = Math.abs(x) <= this.threshold
      && Math.abs(v) <= Math.max(this.threshold * 20, 0.01);
    if (!settled) return true;
    this.value = this.target;
    this.velocity = 0;
    this.onUpdate?.(this.value, this.velocity);
    return false;
  }
}

export const SPRING_INTERACTIVE = { dampingRatio: 0.5, stiffness: 300, threshold: 0.001 };
export const SPRING_VALUE = { dampingRatio: 1, stiffness: 1000, threshold: 0.001 };
export const SPRING_PRESS = { dampingRatio: 1, stiffness: 1000, threshold: 0.001 };
export const SPRING_SCALE_X = { dampingRatio: 0.6, stiffness: 250, threshold: 0.001 };
export const SPRING_SCALE_Y = { dampingRatio: 0.7, stiffness: 250, threshold: 0.001 };

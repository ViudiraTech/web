// Single-context Backdrop Catalog renderer.
//
// The previous implementation attached one SVG/backdrop-filter pipeline to every
// control. Chromium then had to capture, filter and composite several independent
// backdrop surfaces. This renderer keeps the DOM only for layout/input/text and
// draws every Catalog optical surface through one WebGL2 context.
//
// Optical geometry follows Kyant0/AndroidLiquidGlass:
// rounded-rect SDF -> circleMap edge lens -> optional dispersion -> highlight.

const items = [];
const itemMap = new WeakMap();
const groups = new Map();
let renderer = null;
let scheduledFrame = 0;
let layoutDirty = true;
const dirtyCanvases = new Set();

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const PRESETS = {
  'catalog-button': {
    kind: 0, lensHeight: 12, lensAmount: 24, blur: 2, intensity: 1,
    surface: [1, 1, 1], surfaceAlpha: 0, tint: [1, 1, 1], tintAlpha: 0,
    vibrancy: 1.08, brightness: 1.01, chroma: 0, highlightAlpha: 1,
    innerShadowAlpha: 0.0, press: 0,
  },
  'catalog-button-surface': {
    kind: 0, lensHeight: 12, lensAmount: 24, blur: 2, intensity: 1,
    surface: [1, 1, 1], surfaceAlpha: 0.30, tint: [1, 1, 1], tintAlpha: 0,
    vibrancy: 1.08, brightness: 1.01, chroma: 0, highlightAlpha: 1,
    innerShadowAlpha: 0.0, press: 0,
  },
  'catalog-button-blue': {
    kind: 0, lensHeight: 12, lensAmount: 24, blur: 2, intensity: 1,
    surface: [1, 1, 1], surfaceAlpha: 0, tint: [0 / 255, 136 / 255, 255 / 255], tintAlpha: 0.75,
    vibrancy: 1.04, brightness: 1.0, chroma: 0, highlightAlpha: 1,
    innerShadowAlpha: 0.0, press: 0,
  },
  'catalog-button-orange': {
    kind: 0, lensHeight: 12, lensAmount: 24, blur: 2, intensity: 1,
    surface: [1, 1, 1], surfaceAlpha: 0, tint: [255 / 255, 141 / 255, 40 / 255], tintAlpha: 0.75,
    vibrancy: 1.04, brightness: 1.0, chroma: 0, highlightAlpha: 1,
    innerShadowAlpha: 0.0, press: 0,
  },
  'catalog-toggle-track': {
    kind: 1, fraction: 0,
  },
  'catalog-toggle-thumb': {
    kind: 0, lensHeight: 5, lensAmount: 10, blur: 8, intensity: 0,
    surface: [1, 1, 1], surfaceAlpha: 1, tint: [1, 1, 1], tintAlpha: 0,
    vibrancy: 1.0, brightness: 1.0, chroma: 1, highlightAlpha: 0,
    innerShadowAlpha: 0, press: 0,
  },
  'catalog-slider-track': {
    kind: 2, fraction: 0.46,
  },
  'catalog-slider-thumb': {
    kind: 0, lensHeight: 10, lensAmount: 14, blur: 8, intensity: 0,
    surface: [1, 1, 1], surfaceAlpha: 1, tint: [1, 1, 1], tintAlpha: 0,
    vibrancy: 1.0, brightness: 1.0, chroma: 1, highlightAlpha: 0,
    innerShadowAlpha: 0, press: 0,
  },
  'catalog-tabs-panel': {
    kind: 0, lensHeight: 24, lensAmount: 24, blur: 8, intensity: 1,
    surface: [250 / 255, 250 / 255, 250 / 255], surfaceAlpha: 0.40,
    tint: [1, 1, 1], tintAlpha: 0, vibrancy: 1.08, brightness: 1.0,
    chroma: 0, highlightAlpha: 1, innerShadowAlpha: 0, press: 0,
  },
  'catalog-tab-indicator': {
    kind: 0, lensHeight: 10, lensAmount: 14, blur: 0, intensity: 0,
    surface: [0, 0, 0], surfaceAlpha: 0.10, tint: [1, 1, 1], tintAlpha: 0,
    vibrancy: 1.0, brightness: 1.0, chroma: 1, highlightAlpha: 0,
    innerShadowAlpha: 0, press: 0,
  },
};

const VS = `#version 300 es
precision highp float;
in vec2 a_pos;
uniform vec4 u_rect;
uniform vec2 u_viewport;
out vec2 v_local;
out vec2 v_screen;
void main(){
  vec2 px = u_rect.xy + a_pos * u_rect.zw;
  v_local = a_pos * u_rect.zw;
  v_screen = px;
  vec2 ndc = px / u_viewport * 2.0 - 1.0;
  gl_Position = vec4(ndc.x, -ndc.y, 0.0, 1.0);
}`;

const FS = `#version 300 es
precision highp float;
in vec2 v_local;
in vec2 v_screen;
out vec4 outColor;

uniform vec4 u_rect;
uniform vec4 u_canvasRect;
uniform float u_radius;
uniform int u_kind;
uniform float u_fraction;
uniform float u_lensHeight;
uniform float u_lensAmount;
uniform float u_blur;
uniform float u_intensity;
uniform float u_chroma;
uniform float u_highlightAlpha;
uniform float u_innerShadowAlpha;
uniform float u_press;
uniform vec2 u_pointer;
uniform vec3 u_surface;
uniform float u_surfaceAlpha;
uniform vec3 u_tint;
uniform float u_tintAlpha;
uniform float u_vibrancy;
uniform float u_brightness;

float sdRoundRect(vec2 p, vec2 halfSize, float r){
  vec2 q = abs(p) - (halfSize - vec2(r));
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

vec2 gradRoundRect(vec2 p, vec2 halfSize, float r){
  vec2 q = abs(p) - (halfSize - vec2(r));
  vec2 g;
  if(q.x >= 0.0 || q.y >= 0.0){
    g = normalize(max(q, 0.0) + vec2(1e-5));
  }else{
    float gx = step(q.y, q.x);
    g = vec2(gx, 1.0 - gx);
  }
  return sign(p) * g;
}

float circleMap(float x){
  x = clamp(x, 0.0, 1.0);
  return 1.0 - sqrt(max(0.0, 1.0 - x*x));
}

vec3 linMix3(vec3 a, vec3 b, vec3 c, float t){
  if(t < 0.43) return mix(a, b, t / 0.43);
  return mix(b, c, (t - 0.43) / 0.57);
}

vec3 backgroundAt(vec2 screenPx){
  // Match the CSS backdrop in pixel space. CSS gradient 135deg projects along
  // (+x,+y), and radial 28% stops are relative to each farthest corner radius.
  vec2 size = max(u_canvasRect.zw,vec2(1.0));
  vec2 p = clamp(screenPx-u_canvasRect.xy,vec2(0.0),size);
  float t = clamp((p.x+p.y)/(size.x+size.y),0.0,1.0);
  vec3 base = linMix3(vec3(0.859,0.910,1.0),vec3(0.965,0.894,0.871),vec3(0.847,0.933,0.906),t);

  vec2 cb = size*vec2(0.18,0.22);
  vec2 co = size*vec2(0.82,0.70);
  float rb = max(max(length(cb),length(vec2(size.x-cb.x,cb.y))),max(length(vec2(cb.x,size.y-cb.y)),length(size-cb))) * 0.28;
  float ro = max(max(length(co),length(vec2(size.x-co.x,co.y))),max(length(vec2(co.x,size.y-co.y)),length(size-co))) * 0.28;
  float ab = (1.0-smoothstep(0.0,max(rb,1.0),distance(p,cb))) * 0.18;
  float ao = (1.0-smoothstep(0.0,max(ro,1.0),distance(p,co))) * 0.18;
  base = mix(base,vec3(0.0,0.533,1.0),ab);
  base = mix(base,vec3(1.0,0.553,0.157),ao);
  return base;
}

vec3 sampleBlur(vec2 p, float radius){
  if(radius < 0.05) return backgroundAt(p);
  float r = radius * 0.62;
  vec3 c = backgroundAt(p) * 0.28;
  c += backgroundAt(p + vec2(r,0.0)) * 0.12;
  c += backgroundAt(p - vec2(r,0.0)) * 0.12;
  c += backgroundAt(p + vec2(0.0,r)) * 0.12;
  c += backgroundAt(p - vec2(0.0,r)) * 0.12;
  c += backgroundAt(p + vec2(r,r)) * 0.06;
  c += backgroundAt(p + vec2(-r,r)) * 0.06;
  c += backgroundAt(p + vec2(r,-r)) * 0.06;
  c += backgroundAt(p + vec2(-r,-r)) * 0.06;
  return c;
}

vec3 rgb2hsv(vec3 c){
  vec4 K = vec4(0.0,-1.0/3.0,2.0/3.0,-1.0);
  vec4 p = mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g));
  vec4 q = mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r));
  float d = q.x - min(q.w,q.y);
  float e = 1e-10;
  return vec3(abs(q.z + (q.w-q.y)/(6.0*d+e)), d/(q.x+e), q.x);
}
vec3 hsv2rgb(vec3 c){
  vec3 p = abs(fract(c.xxx + vec3(0.0,2.0/3.0,1.0/3.0))*6.0-3.0);
  return c.z * mix(vec3(1.0),clamp(p-1.0,0.0,1.0),c.y);
}
vec3 hueBlend(vec3 backdrop, vec3 tint){
  vec3 bh = rgb2hsv(backdrop);
  vec3 th = rgb2hsv(tint);
  return hsv2rgb(vec3(th.x, bh.y, bh.z));
}
vec3 saturateColor(vec3 c, float amount){
  float l = dot(c,vec3(0.299,0.587,0.114));
  return mix(vec3(l),c,amount);
}

void main(){
  // Plain tracks are rendered in the same GPU pass so the DOM can remain a
  // transparent input/layout layer above this canvas.
  if(u_kind == 1){
    vec2 halfSize = u_rect.zw * 0.5;
    float sd = sdRoundRect(v_local-halfSize,halfSize,u_radius);
    float mask = 1.0-smoothstep(-0.75,0.75,sd);
    vec3 off = vec3(120.0/255.0);
    vec3 on = vec3(52.0/255.0,199.0/255.0,89.0/255.0);
    vec3 col = mix(off,on,clamp(u_fraction,0.0,1.0));
    float alpha = mix(0.20,1.0,clamp(u_fraction,0.0,1.0));
    outColor = vec4(col,mask*alpha);
    return;
  }
  if(u_kind == 2){
    vec2 halfSize = u_rect.zw * 0.5;
    float sd = sdRoundRect(v_local-halfSize,halfSize,u_radius);
    float mask = 1.0-smoothstep(-0.75,0.75,sd);
    float edge = clamp(u_fraction,0.0,1.0) * u_rect.z;
    vec3 col = v_local.x <= edge ? vec3(0.0,136.0/255.0,1.0) : vec3(120.0/255.0);
    float alpha = v_local.x <= edge ? 1.0 : 0.20;
    outColor = vec4(col,mask*alpha);
    return;
  }

  vec2 halfSize = u_rect.zw * 0.5;
  vec2 centered = v_local - halfSize;
  float r = min(u_radius,min(halfSize.x,halfSize.y));
  float sd = sdRoundRect(centered,halfSize,r);
  float mask = 1.0-smoothstep(-0.85,0.85,sd);
  if(mask <= 0.001){ outColor = vec4(0.0); return; }

  float inside = max(-sd,0.0);
  float h = max(u_lensHeight,0.001);
  vec2 sampleP = v_screen;
  vec2 grad = vec2(0.0);
  float d = 0.0;

  // This branch is the important Catalog invariant: the centre is untouched.
  // Only pixels within refractionHeight of the rounded-rect edge are bent.
  if(u_intensity > 0.001 && inside < h){
    float cm = circleMap(1.0 - inside / h);
    float gradRadius = min(r*1.5,min(halfSize.x,halfSize.y));
    grad = normalize(gradRoundRect(centered,halfSize,gradRadius)+vec2(1e-6));
    d = -cm * u_lensAmount * u_intensity;
    sampleP += d * grad;
  }

  vec3 col;
  if(u_chroma > 0.5 && u_intensity > 0.001 && inside < h){
    float dispersionIntensity = (centered.x*centered.y) / max(halfSize.x*halfSize.y,1.0);
    vec2 dispersed = d * grad * dispersionIntensity;
    vec3 r1 = sampleBlur(sampleP + dispersed,u_blur);
    vec3 o  = sampleBlur(sampleP + dispersed*(2.0/3.0),u_blur);
    vec3 y  = sampleBlur(sampleP + dispersed*(1.0/3.0),u_blur);
    vec3 g  = sampleBlur(sampleP,u_blur);
    vec3 cy = sampleBlur(sampleP - dispersed*(1.0/3.0),u_blur);
    vec3 b  = sampleBlur(sampleP - dispersed*(2.0/3.0),u_blur);
    vec3 p  = sampleBlur(sampleP - dispersed,u_blur);
    col = vec3(
      r1.r/3.5 + o.r/3.5 + y.r/3.5 + p.r/7.0,
      o.g/7.0 + y.g/3.5 + g.g/3.5 + cy.g/3.5,
      cy.b/3.0 + b.b/3.0 + p.b/3.0
    );
  }else{
    col = sampleBlur(sampleP,u_blur);
  }

  col = saturateColor(col,u_vibrancy) * u_brightness;
  if(u_tintAlpha > 0.001){
    col = hueBlend(col,u_tint);
    col = mix(col,u_tint,u_tintAlpha);
  }
  col = mix(col,u_surface,u_surfaceAlpha);

  // Default Highlight: narrow 0.5px directional rim at 45 degrees.
  float rim = 1.0-smoothstep(0.0,0.95,inside);
  vec2 edgeGrad = normalize(gradRoundRect(centered,halfSize,min(r*1.5,min(halfSize.x,halfSize.y)))+vec2(1e-6));
  float directional = pow(abs(dot(edgeGrad,normalize(vec2(0.7071,0.7071)))),1.0);
  col += vec3(1.0) * rim * directional * 0.50 * u_highlightAlpha;

  // Catalog InteractiveHighlight: subtle global + pointer-local additive light.
  if(u_press > 0.001){
    col += vec3(0.08*u_press);
    float pr = min(halfSize.x,halfSize.y)*1.5;
    float pd = distance(v_local,u_pointer);
    float pi = smoothstep(pr,pr*0.5,pd);
    col += vec3(0.15*u_press*pi);
  }

  // Press-only inner shadow; keep it close to the rim so the centre never
  // becomes a dark/bright pillar.
  float inner = exp(-inside/4.0) * u_innerShadowAlpha;
  col *= 1.0 - inner*0.15;

  outColor = vec4(clamp(col,0.0,1.0),mask);
}`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) || 'unknown shader error';
    gl.deleteShader(shader);
    throw new Error(info);
  }
  return shader;
}

function makeProgram(gl) {
  const program = gl.createProgram();
  const vs = compile(gl, gl.VERTEX_SHADER, VS);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FS);
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program) || 'unknown link error';
    gl.deleteProgram(program);
    throw new Error(info);
  }
  return program;
}

class CatalogWebGLRenderer {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'catalog-webgl-canvas';
    this.canvas.setAttribute('aria-hidden', 'true');
    document.body.append(this.canvas);

    const gl = this.canvas.getContext('webgl2', {
      alpha: true,
      antialias: false,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
      depth: false,
      stencil: false,
    });
    if (!gl) throw new Error('WebGL2 unavailable');
    this.gl = gl;
    this.program = makeProgram(gl);
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0,0, 1,0, 0,1,
      0,1, 1,0, 1,1,
    ]), gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(this.program, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    this.u = {};
    for (const name of [
      'u_rect','u_canvasRect','u_viewport','u_radius','u_kind','u_fraction',
      'u_lensHeight','u_lensAmount','u_blur','u_intensity','u_chroma',
      'u_highlightAlpha','u_innerShadowAlpha','u_press','u_pointer',
      'u_surface','u_surfaceAlpha','u_tint','u_tintAlpha','u_vibrancy','u_brightness',
    ]) this.u[name] = gl.getUniformLocation(this.program, name);

    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    this.dpr = 0;
    this.viewportW = 0;
    this.viewportH = 0;
    this.resize();
    this.onResize = () => { layoutDirty = true; this.resize(); scheduleCatalogRender(); };
    this.onScroll = () => { layoutDirty = true; scheduleCatalogRender(); };
    window.addEventListener('resize', this.onResize, { passive: true });
    window.addEventListener('scroll', this.onScroll, { passive: true });
  }

  resize() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const w = Math.max(1, window.innerWidth);
    const h = Math.max(1, window.innerHeight);
    if (dpr === this.dpr && w === this.viewportW && h === this.viewportH) return;
    this.dpr = dpr;
    this.viewportW = w;
    this.viewportH = h;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    layoutDirty = true;
  }

  register(element) {
    const presetName = element.dataset.catalogGlassPreset;
    const preset = PRESETS[presetName];
    if (!preset) return;
    const item = {
      element,
      canvasElement: element.closest('.catalog-canvas'),
      presetName,
      state: { ...preset },
      rect: null,
      canvasRect: null,
      dirty: true,
      order: preset.kind === 0 ? 2 : 1,
    };
    items.push(item);
    itemMap.set(element,item);
    if(item.canvasElement){
      let group = groups.get(item.canvasElement);
      if(!group){
        group = { element:item.canvasElement, items:[], rect:null };
        groups.set(item.canvasElement,group);
      }
      group.items.push(item);
      group.items.sort((a,b)=>a.order-b.order);
      dirtyCanvases.add(item.canvasElement);
    }
    element.dataset.catalogGlassReady = 'true';
  }

  measure(item) {
    item.rect = item.element.getBoundingClientRect();
    item.canvasRect = item.canvasElement?.getBoundingClientRect() || item.rect;
    item.dirty = false;
  }

  scissorFor(rect) {
    const gl = this.gl;
    const left = clamp(rect.left, 0, this.viewportW);
    const top = clamp(rect.top, 0, this.viewportH);
    const right = clamp(rect.right, 0, this.viewportW);
    const bottom = clamp(rect.bottom, 0, this.viewportH);
    if (right <= left || bottom <= top) return false;
    const x = Math.floor(left * this.dpr);
    const y = Math.floor((this.viewportH - bottom) * this.dpr);
    const w = Math.ceil((right - left) * this.dpr);
    const h = Math.ceil((bottom - top) * this.dpr);
    gl.scissor(x, y, w, h);
    return true;
  }

  drawCanvasGroup(canvasElement) {
    const group = groups.get(canvasElement);
    if(!group) return;
    if(layoutDirty || !group.rect) group.rect = canvasElement.getBoundingClientRect();
    const canvasRect = group.rect;
    if(!this.scissorFor(canvasRect)) return;
    const gl = this.gl;
    gl.clear(gl.COLOR_BUFFER_BIT);
    for(const item of group.items){
      item.canvasRect = canvasRect;
      this.draw(item);
    }
  }

  draw(item) {
    if (layoutDirty || item.dirty || !item.rect) this.measure(item);
    const r = item.rect;
    if (r.width <= 0 || r.height <= 0 || r.right < 0 || r.bottom < 0 || r.left > this.viewportW || r.top > this.viewportH) return;
    const c = item.canvasRect || r;
    const s = item.state;
    const radius = Math.min(r.height * 0.5, r.width * 0.5);
    const gl = this.gl;
    const u = this.u;
    gl.uniform4f(u.u_rect, r.left, r.top, r.width, r.height);
    gl.uniform4f(u.u_canvasRect, c.left, c.top, c.width, c.height);
    gl.uniform2f(u.u_viewport, this.viewportW, this.viewportH);
    gl.uniform1f(u.u_radius, radius);
    gl.uniform1i(u.u_kind, s.kind || 0);
    gl.uniform1f(u.u_fraction, s.fraction ?? 0);
    gl.uniform1f(u.u_lensHeight, s.lensHeight ?? 0);
    gl.uniform1f(u.u_lensAmount, s.lensAmount ?? 0);
    gl.uniform1f(u.u_blur, s.blur ?? 0);
    gl.uniform1f(u.u_intensity, s.intensity ?? 0);
    gl.uniform1f(u.u_chroma, s.chroma ?? 0);
    gl.uniform1f(u.u_highlightAlpha, s.highlightAlpha ?? 0);
    gl.uniform1f(u.u_innerShadowAlpha, s.innerShadowAlpha ?? 0);
    gl.uniform1f(u.u_press, s.press ?? 0);
    const px = (s.pointerX ?? 50) / 100 * r.width;
    const py = (s.pointerY ?? 50) / 100 * r.height;
    gl.uniform2f(u.u_pointer, px, py);
    const surface = s.surface || [1,1,1];
    gl.uniform3f(u.u_surface, surface[0], surface[1], surface[2]);
    gl.uniform1f(u.u_surfaceAlpha, s.surfaceAlpha ?? 0);
    const tint = s.tint || [1,1,1];
    gl.uniform3f(u.u_tint, tint[0], tint[1], tint[2]);
    gl.uniform1f(u.u_tintAlpha, s.tintAlpha ?? 0);
    gl.uniform1f(u.u_vibrancy, s.vibrancy ?? 1);
    gl.uniform1f(u.u_brightness, s.brightness ?? 1);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  render() {
    this.resize();
    const gl = this.gl;
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0,0,0,0);
    gl.enable(gl.SCISSOR_TEST);

    if (layoutDirty) {
      gl.disable(gl.SCISSOR_TEST);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.SCISSOR_TEST);
      const visibleCanvases = [...groups.keys()];
      for (const canvasElement of visibleCanvases) this.drawCanvasGroup(canvasElement);
      for (const item of items) item.dirty = false;
      dirtyCanvases.clear();
      layoutDirty = false;
      gl.disable(gl.SCISSOR_TEST);
      return;
    }

    if (!dirtyCanvases.size) {
      gl.disable(gl.SCISSOR_TEST);
      return;
    }
    for (const canvasElement of [...dirtyCanvases]) this.drawCanvasGroup(canvasElement);
    dirtyCanvases.clear();
    gl.disable(gl.SCISSOR_TEST);
  }

  destroy() {
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('scroll', this.onScroll);
    const gl = this.gl;
    gl.deleteBuffer(this.buffer);
    gl.deleteVertexArray(this.vao);
    gl.deleteProgram(this.program);
    this.canvas.remove();
  }
}

export function initCatalogGlassRenderer() {
  if (renderer) renderer.destroy();
  items.length = 0;
  groups.clear();
  dirtyCanvases.clear();
  renderer = null;
  document.documentElement.dataset.catalogGlass = 'fallback';
  try {
    renderer = new CatalogWebGLRenderer();
    document.querySelectorAll('[data-catalog-glass-preset]').forEach((element) => renderer.register(element));
    document.documentElement.dataset.catalogGlass = 'webgl';
    layoutDirty = true;
    renderer.render();
    return true;
  } catch (error) {
    console.warn('[ViudiraTech] Catalog WebGL fallback:', error);
    renderer?.destroy();
    renderer = null;
    return false;
  }
}

export function setCatalogGlassState(element, patch = {}) {
  const item = itemMap.get(element);
  if (!item) return;
  let changed = false;
  for (const [key, value] of Object.entries(patch)) {
    if (item.state[key] === value) continue;
    item.state[key] = value;
    changed = true;
  }
  if (!changed) return;
  // Transforms are written immediately before this call by the control layer.
  // Re-measure just this item, not every glass surface on the page.
  item.dirty = true;
  if (item.canvasElement) dirtyCanvases.add(item.canvasElement);
}

export function renderCatalogGlassFrame() {
  renderer?.render();
}

export function scheduleCatalogRender() {
  if (!renderer || scheduledFrame) return;
  scheduledFrame = requestAnimationFrame(() => {
    scheduledFrame = 0;
    renderer?.render();
  });
}

export function markCatalogGlassLayoutDirty() {
  layoutDirty = true;
  for (const item of items) {
    item.dirty = true;
    if (item.canvasElement) dirtyCanvases.add(item.canvasElement);
  }
}

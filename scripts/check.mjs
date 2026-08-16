import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const legacyPages = ['projects.html','community.html','activity.html','about.html','glass-ui.html','glass-test.html'];
const required = [
  'index.html', ...legacyPages, 'vite.config.js', 'src/main.js', 'src/router/routes.js',
  'src/styles/tokens.css', 'src/styles/components.css', 'src/styles/responsive.css',
  'src/github/api.js', 'src/github/repositories.js', 'src/glass/liquid-glass.js',
  'src/components/project-drawer.js', 'src/components/liquid-bottom-tabs.js', 'src/components/liquid-slider.js', 'src/components/liquid-button.js', 'src/components/liquid-dialog.js', 'src/components/settings.js',
  'src/animation/catalog-motion.js', 'src/glass/site-preferences.js', 'src/glass/readability-glass.js', 'public/assets/logo-mark.svg', '.github/workflows/deploy-pages.yml',
];
const missing = required.filter((f) => !fs.existsSync(path.join(root, f)));
if (missing.length) {
  console.error('Missing required files:', missing.join(', '));
  process.exit(1);
}

const jsFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.isFile() && p.endsWith('.js')) jsFiles.push(p);
  }
}
walk(path.join(root, 'src'));

for (const file of jsFiles) {
  const text = fs.readFileSync(file, 'utf8');
  if (/\b(?:TODO|lorem ipsum)\b/i.test(text)) {
    console.error(`Forbidden placeholder marker in ${path.relative(root, file)}`);
    process.exit(1);
  }
  const importRe = /from\s+['"](\.\.?\/[^'"]+)['"]/g;
  for (const match of text.matchAll(importRe)) {
    const target = path.resolve(path.dirname(file), match[1]);
    const candidates = [target, `${target}.js`, path.join(target, 'index.js')];
    if (!candidates.some(fs.existsSync)) {
      console.error(`Broken import in ${path.relative(root, file)}: ${match[1]}`);
      process.exit(1);
    }
  }
}

const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const asset of ['reset.css','tokens.css','layout.css','components.css','responsive.css','./src/main.js']) {
  if (!index.includes(asset)) {
    console.error(`index.html does not reference ${asset}`);
    process.exit(1);
  }
}
for (const page of legacyPages) {
  const text = fs.readFileSync(path.join(root, page), 'utf8');
  if (!text.includes('index.html#/')) {
    console.error(`${page} is not a compatibility redirect into the SPA`);
    process.exit(1);
  }
}

const main = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');
for (const marker of ['navigateSpa(', 'document.startViewTransition', 'hydrateLiquidGlass(main)', 'destroyLiquidGlassWithin(main)', "document.addEventListener('liquidtabs:navigate'", 'history.pushState']) {
  if (!main.includes(marker)) {
    console.error(`SPA routing regression: missing ${marker}`);
    process.exit(1);
  }
}
const routes = fs.readFileSync(path.join(root, 'src/router/routes.js'), 'utf8');
for (const marker of ["projects: '#/projects'", "'glass-ui': '#/glass-ui'", "settings: '#/settings'", 'pageFromLocation', 'pageFromHref']) {
  if (!routes.includes(marker)) {
    console.error(`SPA route map regression: missing ${marker}`);
    process.exit(1);
  }
}

const glass = fs.readFileSync(path.join(root, 'src/glass/liquid-glass.js'), 'utf8');
for (const marker of ['feDisplacementMap', 'backdropFilter', 'sdRoundedRect', 'userSpaceOnUse', 'hydrateLiquidGlass', 'destroyLiquidGlassWithin', 'dataset.glassSurfaceRgb', 'glassSurfaceFloorRatio', 'refreshSiteGlassPreferences', 'siteSettingsScoped']) {
  if (!glass.includes(marker)) {
    console.error(`Live SVG Liquid Glass implementation missing ${marker}`);
    process.exit(1);
  }
}
if (glass.includes('@ybouane/liquidglass') || glass.includes('liquidGL')) {
  console.error('Legacy snapshot Liquid Glass implementation still referenced');
  process.exit(1);
}

const controls = fs.readFileSync(path.join(root, 'src/components/glass-controls.js'), 'utf8');
const motion = fs.readFileSync(path.join(root, 'src/animation/catalog-motion.js'), 'utf8');
const bottomTabs = fs.readFileSync(path.join(root, 'src/components/liquid-bottom-tabs.js'), 'utf8');
for (const marker of [
  'dampingRatio: 0.5, stiffness: 300',
  'dampingRatio: 1, stiffness: 1000',
  'dampingRatio: 0.6, stiffness: 250',
  'dampingRatio: 0.7, stiffness: 250',
  'class SpringValue',
]) {
  if (!motion.includes(marker)) {
    console.error(`Catalog spring regression: missing ${marker}`);
    process.exit(1);
  }
}
for (const marker of ['const activeSprings = new Set()', 'const renderQueue = new Set()', 'function runFrame(now)']) {
  if (!motion.includes(marker)) {
    console.error(`Catalog performance regression: missing shared scheduler marker ${marker}`);
    process.exit(1);
  }
}
if (motion.includes('this.frame = requestAnimationFrame') || motion.includes('cancelAnimationFrame(this.frame)')) {
  console.error('Catalog performance regression: per-spring rAF loop returned');
  process.exit(1);
}
if (controls.includes('withReleaseTransition')) {
  console.error('Legacy CSS release transition returned');
  process.exit(1);
}
for (const marker of ['data-glass-preset="catalog-tabs-panel"', 'data-glass-preset="catalog-tab-indicator"', 'bindLiquidBottomTabs', 'setLiquidBottomTabsSelected', 'liquidtabs:navigate', 'indicatorIdleAlpha']) {
  if (!bottomTabs.includes(marker)) {
    console.error(`Shared LiquidBottomTabs regression: missing ${marker}`);
    process.exit(1);
  }
}
if (/NAV_HANDOFF_KEY|prefetchNavigation|fullyReleased|navigationSettled/.test(bottomTabs)) {
  console.error('MPA navigation handoff code returned after SPA conversion');
  process.exit(1);
}
for (const marker of ['panelOffsetFor', 'valueRange * 0.025', 'smoothVelocity', 'SPRING_INTERACTIVE', '78 / 56']) {
  if (!bottomTabs.includes(marker)) {
    console.error(`Catalog BottomTabs motion fidelity regression: missing ${marker}`);
    process.exit(1);
  }
}


const liquidButton = fs.readFileSync(path.join(root, 'src/components/liquid-button.js'), 'utf8');
const drawer = fs.readFileSync(path.join(root, 'src/components/project-drawer.js'), 'utf8');
for (const marker of ['data-liquid-button', 'SPRING_INTERACTIVE', 'Math.tanh(0.05', 'setLiquidGlassState']) {
  if (!liquidButton.includes(marker)) {
    console.error(`Shared LiquidButton regression: missing ${marker}`);
    process.exit(1);
  }
}
for (const marker of ['project-drawer__surface', 'data-liquid-button', 'drawer-summary--plain']) {
  if (!drawer.includes(marker)) {
    console.error(`Frosted Drawer regression: missing ${marker}`);
    process.exit(1);
  }
}
if (glass.includes("'drawer-frame-edge'") || glass.includes("'drawer-dialog'")) {
  console.error('Obsolete Drawer SVG refraction preset returned after frosted-glass conversion');
  process.exit(1);
}
const liquidSlider = fs.readFileSync(path.join(root, 'src/components/liquid-slider.js'), 'utf8');
const settings = fs.readFileSync(path.join(root, 'src/components/settings.js'), 'utf8');
const sitePreferences = fs.readFileSync(path.join(root, 'src/glass/site-preferences.js'), 'utf8');
for (const marker of ['data-liquid-slider', 'catalog-slider__thumb liquid-glass', 'bindLiquidSlider', 'SPRING_VALUE', "dispatchEvent(new CustomEvent('liquidslider:input'"]) {
  if (!liquidSlider.includes(marker)) {
    console.error(`Shared LiquidSlider regression: missing ${marker}`);
    process.exit(1);
  }
}
for (const marker of ["key: 'transparency'", "key: 'blur'", 'bindLiquidSliders(root)', 'refreshSiteGlassPreferences()', 'data-glass-settings-scope=\"site\"']) {
  if (!settings.includes(marker)) {
    console.error(`Settings page regression: missing ${marker}`);
    process.exit(1);
  }
}
for (const marker of ['viudiratech:glass-settings:v1', 'transparency: 50', 'blur: 50']) {
  if (!sitePreferences.includes(marker)) {
    console.error(`Site glass preference persistence regression: missing ${marker}`);
    process.exit(1);
  }
}
const liquidDialog = fs.readFileSync(path.join(root, 'src/components/liquid-dialog.js'), 'utf8');
const readabilityGlass = fs.readFileSync(path.join(root, 'src/glass/readability-glass.js'), 'utf8');
for (const marker of ['showLiquidDialog', 'data-glass-preset=\"catalog-dialog\"', 'data-liquid-dialog-confirm', 'aria-modal=\"true\"']) {
  if (!liquidDialog.includes(marker)) {
    console.error(`Shared LiquidDialog regression: missing ${marker}`);
    process.exit(1);
  }
}
for (const marker of ['READABILITY_SURFACE_SELECTOR', 'readability-full', 'applyReadabilityGlassMode', 'deactivateLiquidGlassElement']) {
  if (!readabilityGlass.includes(marker)) {
    console.error(`Readability full-liquid regression: missing ${marker}`);
    process.exit(1);
  }
}
for (const marker of ['readabilityLiquid', 'liquidToggle({', 'bindLiquidToggles(root)', 'showLiquidDialog({', 'applyReadabilityGlassMode(document)']) {
  if (!settings.includes(marker)) {
    console.error(`Readability setting regression: missing ${marker}`);
    process.exit(1);
  }
}
if (!main.includes('prepareReadabilityGlass(main)') || !main.includes('prepareReadabilityGlass(document)')) {
  console.error('Readability Liquid Glass is not wired into the SPA lifecycle');
  process.exit(1);
}

if (!controls.includes('liquidSlider({ value: 46') || !controls.includes('bindLiquidSliders(')) {
  console.error('Liquid UI Lab no longer uses the shared LiquidSlider');
  process.exit(1);
}

const projectExplorer = fs.readFileSync(path.join(root, 'src/components/project-explorer.js'), 'utf8');
for (const marker of ['liquidBottomTabs({', "className: 'project-filter-tabs'", "mode: 'filter'", "indicatorSurfaceRgb: '0 0 0'", "indicatorIdleAlpha: 0.10", 'indicatorSurfaceFloorRatio: 0.60']) {
  if (!projectExplorer.includes(marker)) {
    console.error(`Projects shared BottomTabs regression: missing ${marker}`);
    process.exit(1);
  }
}
if (projectExplorer.includes('filter-button') || projectExplorer.includes('data-filter=')) {
  console.error('Legacy project category buttons returned after shared BottomTabs conversion');
  process.exit(1);
}
if (!main.includes("'liquidtabs:change'") || !main.includes('bindLiquidBottomTabs(tabs)')) {
  console.error('Projects shared BottomTabs binding regression');
  process.exit(1);
}
for (const marker of ['PROJECT_CATEGORY_MOBILE_LABELS', 'mobileLabel: PROJECT_CATEGORY_MOBILE_LABELS']) {
  if (!projectExplorer.includes(marker)) {
    console.error(`Projects mobile BottomTabs regression: missing ${marker}`);
    process.exit(1);
  }
}
if (controls.includes('data-glass-preset="catalog-button" data-glass-live="true"')) {
  console.error('Catalog LiquidButton regression: test button forced back to unreliable live backdrop SVG filtering');
  process.exit(1);
}
for (const marker of ["'catalog-button'", "'catalog-button-surface'", "requestedBackdrop === 'ambient'"]) {
  if (!glass.includes(marker)) {
    console.error(`LiquidButton local refraction regression: missing ${marker}`);
    process.exit(1);
  }
}

const navbar = fs.readFileSync(path.join(root, 'src/components/navbar.js'), 'utf8');
for (const marker of ['liquidBottomTabs({', "className: 'site-nav__tabs'", 'bindLiquidBottomTabs(headerTabs)', "indicatorSurfaceRgb: '0 0 0'", "indicatorIdleAlpha: 0.10", 'indicatorSurfaceFloorRatio: 0.60', "['settings', '设置']", 'data-glass-settings-scope="site"']) {
  if (!navbar.includes(marker)) {
    console.error(`Shared BottomTabs Header regression: missing ${marker}`);
    process.exit(1);
  }
}

const componentCss = fs.readFileSync(path.join(root, 'src/styles/components.css'), 'utf8');
for (const marker of ['liquid-local-sample', 'content-visibility:auto', '.catalog-tabs__glass', '.catalog-tabs__indicator', '.site-nav__backplate']) {
  if (!componentCss.includes(marker)) {
    console.error(`Optimized SVG Catalog CSS regression: missing ${marker}`);
    process.exit(1);
  }
}
if (componentCss.includes('catalog-webgl-canvas') || componentCss.includes('data-catalog-glass="webgl"')) {
  console.error('WebGL Catalog compositor CSS returned after SVG rollback');
  process.exit(1);
}
for (const marker of ['Public-site readability over the photographic background', 'data-mobile-label', 'picsum.photos/id/1015/1200/800']) {
  if (!componentCss.includes(marker)) {
    console.error(`Public readability/mobile/refraction CSS regression: missing ${marker}`);
    process.exit(1);
  }
}

const layoutCss = fs.readFileSync(path.join(root, 'src/styles/layout.css'), 'utf8');
for (const marker of ['animation:mesh-a 28s', 'animation:mesh-b 34s', 'will-change:transform', 'content-visibility:auto', 'viudira-page-content', 'viudira-spa-page-in']) {
  if (!layoutCss.includes(marker)) {
    console.error(`SPA/ambient animation regression: missing ${marker}`);
    process.exit(1);
  }
}
if (layoutCss.includes('@view-transition {') || layoutCss.includes('viudira-liquid-header')) {
  console.error('Cross-document MPA View Transition returned after SPA conversion');
  process.exit(1);
}
if (layoutCss.includes('filter:blur(72px)') || layoutCss.includes('ambient__mesh{display:none}')) {
  console.error('Ambient performance regression: expensive live blur or disabled animation returned');
  process.exit(1);
}

const vite = fs.readFileSync(path.join(root, 'vite.config.js'), 'utf8');
if (vite.includes('rollupOptions') || vite.includes('projects.html')) {
  console.error('Vite returned to multi-page build after SPA conversion');
  process.exit(1);
}

console.log(`Project structure check passed (${jsFiles.length} JS modules, single-entry SPA + ${legacyPages.length} redirect shells).`);

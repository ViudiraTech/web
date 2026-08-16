# iOS 27 / macOS 27 Optimization Pass — 2026-08-16

## Liquid Glass
- Reworked the SVG displacement map so refraction affects the full optical body, not only the bevel edge.
- Increased iOS/macOS lens depth while reducing the milky surface/blur bias.
- Added platform-specific specular rims and more transparent Dock/search/menu surfaces.
- Added adaptive displacement-map resolution for mobile and lower-end devices.

## iOS 27
- Pauses Home and Spotlight live glass when hidden; resumes only when visible/interactive.
- Removed permanent `will-change` from full-screen layers and reduced paint work for hidden scenes.
- Replaced giant blurred wallpaper blobs with cheaper layered gradients.
- Kept Control Center/secondary cards on cheaper materials instead of stacking live displacement filters.
- Improved interruptible app/home/overlay animation behavior without adding persistent compositor layers.
- Added camera shutter feedback, App Store install state, Photos tab selection, Phone filtering, and Maps shortcut feedback.

## macOS 27
- Pauses live glass inside hidden/minimized windows and closed popovers.
- Clearer menubar/Dock/popover glass and less opaque unified window toolbar material.
- Hidden windows/popovers are removed from paint visibility.
- Added top-edge maximize, left/right window snap, toolbar double-click zoom, and Cmd/Ctrl+Tab window cycling.

## Validation
- `node --check` passed for all JavaScript modules.
- `npm run check` passed (38 JS modules, single-entry SPA + 6 redirect shells).
- Production `vite build` was not run because the uploaded archive does not include installed npm dependencies in this environment (`vite: not found`).
- Headless Chromium visual smoke testing was unavailable because the sandbox Chromium GPU/EGL backend could not initialize.

## 2026-08-16 — CTA refraction / stacking-context regression fix

- Ordinary public-site CTAs no longer treat `backdrop="ambient"` as an implicit live-backdrop request.
- They now stay in their real stacking context and use the deterministic local foreground sampler aligned to `#ambient`, so SVG displacement remains visible without a body-level visual proxy.
- `inlineLive` and `portal` are now explicit renderer choices. The only body portal opt-ins remain Drawer close + Dialog cancel/confirm.
- Site CTA lenses receive a slightly deeper optical profile (31px lens amount / 14px lens height minimum) to keep refraction legible over reading plates and cards.
- Regression checks now enforce the 3-control portal policy and the local ambient-sample path.

## OS 27 fidelity + system-wide Liquid Glass pass (2026-08-16)

### macOS 27
- Promoted window toolbars, Finder/Notes/Messages/Calendar/Settings sidebars, Finder status strip, Safari tabs, message composer and Launchpad search into the shared live Liquid Glass controller.
- Added live desktop widgets with the same optical material as system chrome.
- Added Mission Control / Spaces UI with keyboard entry (`Control+↑` or `F3`) and clickable window switching.
- Added Finder selection + Space-bar Quick Look with a live glass preview panel.
- Improved front/inactive window depth, selection states, sidebar feedback and mobile desktop-simulator layouts.

### iOS 27
- Promoted lock-screen widgets/notifications, app navigation chrome, Safari bottom bar, Photos tab bar, Maps sheet, Messages chrome, Control Center, Notification Center items, Spotlight and long-press action menu into system Liquid Glass.
- Removed mobile CSS rules that accidentally disabled real `backdrop-filter` displacement on the exact surfaces that should refract.
- Added app-icon long press/right click menu and Home Screen edit/jiggle mode.
- Live glass is activated only for the visible scene/app/panel and suspended when hidden to keep touch gestures responsive.
- App content uses lower-cost translucent material while the actual OS navigation/control layer keeps SVG refraction.

### Validation
- `node --check` passes for every JS/MJS source file.
- `npm run check` passes: 38 JS modules, single-entry SPA + 6 redirect shells.
- A local Vite production build could not be run in this sandbox because dependencies are not bundled in the supplied project and the package install attempt timed out; no build success is claimed.

## 2026-08-16 — Shared control architecture repair

The iOS 27/macOS 27 simulators no longer maintain a second visual implementation
of the Liquid controls.

- Added `liquid-system-controls.js` as a thin platform adapter over the existing
  `LiquidButton`, `LiquidToggle`, `LiquidSlider`, and `LiquidBottomTabs`.
- Added shared LiquidButton geometry tokens to `components.css`; simulator code
  can select density/size without redrawing the glass surface.
- `system-controls.css` only supplies semantic size/layout/tint variables. It does
  not define its own backdrop blur/refraction/highlight implementation.
- Removed simulator-local button backgrounds/borders/padding that were overriding
  the Catalog controls, including iOS nav/Safari/Spotlight/Control Center/context
  actions and macOS menubar/menu/Control Center/Quick Look/message controls.
- Dock magnification now transforms the app icon inside the shared button instead
  of overriding the LiquidButton controller's transform.
- Photos now keeps `LiquidBottomTabs`' own selected state instead of adding the
  legacy `is-active` tab state on top.
- Intentional non-Liquid controls remain native: app icons/content rows, camera
  shutter, macOS traffic lights, desktop files, and other content-specific rows.
- `npm run check` now fails if iOS/macOS bypass the shared system adapter, redraw
  `.catalog-button` in platform CSS, or load the shared token stylesheet in the
  wrong order.

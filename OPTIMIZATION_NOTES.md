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

## 2026-08-16 — iOS/macOS system Liquid Glass dynamics pass

- Added one shared `system-glass-dynamics.js` adapter used by both simulators.
- System glass now tracks an ambient pointer light and local specular position without forking control DOM/CSS.
- Shared SVG lens strength now reacts to hover/press; pressing changes real displacement intensity and blur instead of only drawing a white overlay.
- Added spring-driven optical materialization for newly revealed popovers, Control Center, Spotlight, Quick Look, etc.
- Added subtle bounded chromatic dispersion only to Clear controls.
- Rebalanced iOS/macOS presets away from milky blur toward clearer lensing, bevel depth, edge highlights, richer shadows and ambient color spill.
- Rebalanced the iOS/macOS glass-level sliders so higher tint does not destroy refraction.
- All optical paint stays in the shared `components.css`; `system-controls.css` remains layout/token-only.
- Added regression checks for shared system-glass dynamics wiring and optical interaction state.

## 2026-08-16 — OS 27 performance correction

- Fixed a self-retriggering glass materialization path: the visibility
  `MutationObserver` watched `class`, while the materialization animation itself
  changed `class`. Visibility is now edge-triggered (`hidden -> visible`) and
  internal animation classes cannot recursively restart the effect.
- Removed per-frame SVG displacement/blur animation from system hover and
  materialization. Pointer light is local to the hovered control and touches CSS
  variables only.
- Shared iOS/macOS LiquidButton controls are surface-only. They keep the exact
  shared geometry, spring, highlight and material tokens, while parent Dock /
  toolbar / popover glass owns the expensive live refraction.
- iOS compact `ios-control` chrome is surface-only. Dock and large popovers keep
  live lensing.
- macOS sidebars, status strips, tab strips and message composers are
  surface-only. Menu bar, Dock, main window toolbar and transient popovers keep
  live lensing.
- Reduced system displacement-map raster resolution; optical displacement scale
  is unchanged, so the refraction remains visible while map generation and GPU
  sampling are cheaper.
- Removed `plus-lighter` from moving system highlights to avoid unnecessary
  offscreen compositing.

## 2026-08-16 Control Center / Notification Center polish

- Reworked iOS 27 Control Center into a modular, paged system layout: top add/power affordances, connectivity group, Now Playing, Focus/Mirroring, portrait brightness/volume controls, utilities and page rail.
- Removed the fake “控制中心 / 完成” web-panel header.
- Softened the iOS Control Center and Notification Center springs and separated panel travel from inner-content materialization for a less rigid pull-down.
- Interactive controls no longer accidentally start the panel-close drag gesture.
- Reworked macOS 27 Control Center into a network group + Focus/Mirroring + Now Playing + display/sound hierarchy, with top-right-origin popover motion and subtle child settling.
- Hid browser-native scrollbars in iOS/macOS Notification Center and the macOS Messages sidebar/chat while keeping wheel/touch scrolling.

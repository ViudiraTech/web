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

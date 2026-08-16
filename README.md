# ViudiraTech Community Website

ViudiraTech 官方开源社区网站。Vite + Vanilla JavaScript + GitHub API + Backdrop Catalog 风格 SVG Liquid Glass。

## 架构：Single-Entry SPA

生产环境现在只有一个真正入口：`index.html`。

站内路由使用 hash SPA，适合 GitHub Pages / 任意静态托管，不依赖服务器 rewrite：

- `#/` — 首页
- `#/projects` — Repository Explorer
- `#/glass-ui` — Liquid UI Lab
- `#/community` — 社区
- `#/activity` — GitHub Public Events
- `#/about` — 关于
- `#/settings` — Liquid Glass 设置
- `#/glass-test` — Liquid Glass 折射测试

`projects.html`、`community.html` 等旧文件只作为源码目录下的兼容跳转壳，不再进入 Vite production multi-page build。

SPA 切页只替换 `<main>`：Header、LiquidBottomTabs、SVG glass controller、Catalog spring scheduler 和 ambient scene 都不会卸载。`document.startViewTransition()` 只捕获正文，因此 Header 的 lens / indicator / InteractiveHighlight 可以在正文切换期间继续完成动画。

## Shared Liquid Bottom Tabs

Header 和 Liquid UI Lab 使用同一个 `src/components/liquid-bottom-tabs.js` 与同一个 `src/animation/catalog-motion.js` scheduler。

共享内容包括：

- 64px panel / 56px indicator
- 24 / 24 panel lens
- 10 / 14 indicator lens
- `78 / 56` pressed scale
- panel 4dp damped offset
- velocity deformation
- InteractiveHighlight
- Catalog spring 参数

Header 不创建第二套 tabs。它只给共享组件传导航 items 和较亮的 indicator surface；Catalog demo 保留原版偏黑的 10% idle indicator surface。

## Shared Liquid Slider

Liquid UI Lab 与设置页使用同一个 `src/components/liquid-slider.js`。设置页没有复制 Slider 样式或动画：40×24 thumb、10 / 14 chromatic lens、Catalog spring、速度形变和 InteractiveHighlight 都来自同一个共享组件。

## Liquid Glass 设置

`#/settings` 提供透明度与模糊度两个共享 Liquid Slider，并持久化到 `localStorage`。50% 对应网站原始材质参数；透明度向右更通透，模糊度 0–100% 对应 0–2× 各 preset 原始 blur。

设置采用显式 `data-glass-settings-scope="site"` 作用域，只影响 Header、Header Bottom Tabs、移动菜单、项目 Drawer 与设置实时预览。Liquid UI Lab / Glass Test 没有该 scope，因此 Catalog 的固定 blur / surface 数据不会被全局设置覆盖。

## Liquid Glass

当前运行时使用优化过的 SVG / backdrop-filter 管线，不使用 WebGL：

1. 所有 filter 共用一个隐藏 SVG `<defs>` root；
2. rounded-rect SDF displacement map 按几何尺寸缓存；
3. 静态 Catalog Button / panel 使用局部背景 sample；
4. Toggle / Slider 空闲时不执行无意义 lens；
5. blur 放在 SVG filter primitive 内，动画时不重写整条 filter string；
6. 屏幕外玻璃通过 IntersectionObserver suspend；
7. SPA 路由只销毁旧 `<main>` 内的 controller，Header controller 永久保留；
8. displacement map 保持完整分辨率，不通过降采样换性能。

## Backdrop Catalog 控件

- **LiquidButton**：48px；2px blur；12 / 24 lens；InteractiveHighlight 和弹性拖动。
- **LiquidToggle**：64×28 track + 40×24 thumb；按下进入 5 / 10 chromatic lens。
- **LiquidSlider**：6px track + 40×24 thumb；10 / 14 chromatic lens；速度形变。
- **LiquidBottomTabs**：64px panel、4px padding、8px blur、24 / 24 lens；56px indicator。

## GitHub 数据

仓库和公开 Activity 从 GitHub API 读取，并带 localStorage cache / stale fallback。SPA 中数据只需加载一次即可在各 route 之间复用，不生成假仓库、假 commit 或假 release。

## 开发

```bash
npm install
npm run dev
```

Production：

```bash
npm run check
npm run build
npm run preview
```

## GitHub Pages

Vite 已改为 single-entry SPA build。Hash routing 不需要 GitHub Pages 提供 history fallback。


### Project Drawer glass

Project detail drawer follows Backdrop Catalog Dialog geometry without applying a 100vh SVG displacement filter: the translucent body uses four narrow live 24/48 depth-lens perimeter strips, while the summary card keeps the Catalog-style 24/48 + 16px blur dialog material. The close control reuses the same shared LiquidButton motion used in Liquid UI Lab.


## Project Drawer

- Drawer 外壳使用单层 CSS 毛玻璃（`backdrop-filter: blur() saturate()`），不运行 SVG displacement / lens。
- 内部长内容与滚动区域不参与光学滤镜，避免滚动时反复重绘大面积折射。
- Drawer 毛玻璃仍响应设置页的站点透明度与模糊度。
- 关闭按钮继续复用共享 LiquidButton；快速点击会完成可见按压脉冲并等待回弹稳定后再关闭 Drawer。



## Background

The site backdrop uses the fixed Lorem Picsum image ID 1015 (mountain landscape) so the glass optics always refract the same scene.

The Projects category selector reuses the same shared `LiquidBottomTabs` component used by the Header and Liquid UI Lab.

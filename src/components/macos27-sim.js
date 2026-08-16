import { liquidButton, bindLiquidButtons } from './liquid-button.js';
import { liquidToggle, bindLiquidToggles } from './liquid-toggle.js';
import { liquidSlider, bindLiquidSliders } from './liquid-slider.js';
import { activateLiquidGlassElement, deactivateLiquidGlassElement, suspendLiquidGlassElement, setLiquidGlassState } from '../glass/liquid-glass.js';

function svg(body, size = 18, viewBox = '0 0 24 24') {
  return `<svg viewBox="${viewBox}" width="${size}" height="${size}" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

const icon = {
  wifi: (s = 18) => svg('<path d="M4.5 9.5a11 11 0 0 1 15 0"/><path d="M7.5 12.5a6.8 6.8 0 0 1 9 0"/><path d="M10.5 15.5a2.7 2.7 0 0 1 3 0"/><circle cx="12" cy="18.3" r=".7" fill="currentColor" stroke="none"/>', s),
  battery: (s = 20) => svg('<rect x="3" y="7" width="16" height="10" rx="2.5"/><path d="M21 10v4"/><path d="M5.5 9.5h10v5h-10z" fill="currentColor" stroke="none"/>', s),
  control: (s = 18) => svg('<path d="M5 7h14M5 17h14"/><circle cx="9" cy="7" r="2" fill="currentColor" stroke="none"/><circle cx="15" cy="17" r="2" fill="currentColor" stroke="none"/>', s),
  search: (s = 18) => svg('<circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/>', s),
  folder: (s = 26) => svg('<path d="M3 7.5h7l2 2h9v9.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M3 9.5h18"/>', s),
  grid: (s = 18) => svg('<rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/>', s),
  list: (s = 18) => svg('<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1" fill="currentColor" stroke="none"/>', s),
  gear: (s = 26) => svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06-2.12 2.12-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.55V20.3h-3v-.1a1.7 1.7 0 0 0-1.03-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06-2.12-2.12.06-.06A1.7 1.7 0 0 0 7.05 15a1.7 1.7 0 0 0-1.55-1.03H5.4v-3h.1a1.7 1.7 0 0 0 1.55-1.03 1.7 1.7 0 0 0-.34-1.87l-.06-.06L8.77 5.9l.06.06a1.7 1.7 0 0 0 1.87.34A1.7 1.7 0 0 0 11.73 4.75v-.1h3v.1a1.7 1.7 0 0 0 1.03 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06 2.12 2.12-.06.06a1.7 1.7 0 0 0-.34 1.87 1.7 1.7 0 0 0 1.55 1.03h.1v3h-.1A1.7 1.7 0 0 0 19.4 15Z"/>', s),
  compass: (s = 26) => svg('<circle cx="12" cy="12" r="9"/><path d="m15.7 8.3-2.2 5.2-5.2 2.2 2.2-5.2 5.2-2.2Z"/>', s),
  terminal: (s = 26) => svg('<rect x="3" y="4" width="18" height="16" rx="3"/><path d="m7 9 3 3-3 3M12.5 15H17"/>', s),
  note: (s = 26) => svg('<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M4 8h16M8 12h8M8 16h6"/>', s),
  mail: (s = 26) => svg('<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m5 8 7 5 7-5"/>', s),
  calendar: (s = 26) => svg('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4M17 3v4M3 10h18"/><path d="M8 14h3M13 14h3M8 17h3"/>', s),
  message: (s = 26) => svg('<path d="M20 15a4 4 0 0 1-4 4H9l-5 2 1.4-4A7 7 0 0 1 4 13V9a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4Z"/>', s),
  plus: (s = 18) => svg('<path d="M12 5v14M5 12h14"/>', s),
  back: (s = 18) => svg('<path d="m15 5-7 7 7 7"/>', s),
  forward: (s = 18) => svg('<path d="m9 5 7 7-7 7"/>', s),
  share: (s = 18) => svg('<path d="M12 15V3m0 0-4 4m4-4 4 4"/><path d="M5 11v8h14v-8"/>', s),
  sidebar: (s = 18) => svg('<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16"/>', s),
  bell: (s = 18) => svg('<path d="M6 10a6 6 0 0 1 12 0v4l2 2H4l2-2Z"/><path d="M10 19h4"/>', s),
  moon: (s = 18) => svg('<path d="M19 15.5A7.5 7.5 0 0 1 8.5 5 7.5 7.5 0 1 0 19 15.5Z"/>', s),
  chevron: (s = 14) => svg('<path d="m9 6 6 6-6 6"/>', s),
};

const apps = {
  finder: { label: 'Finder' },
  launchpad: { label: '启动台' },
  safari: { label: 'Safari' },
  notes: { label: '备忘录' },
  terminal: { label: '终端' },
  messages: { label: '信息' },
  calendar: { label: '日历' },
  settings: { label: '系统设置' },
};

function appGlyph(kind) {
  const content = {
    finder: '<span class="macos27-finder-face"><i></i><i></i><b></b></span>',
    settings: icon.gear(30),
    safari: icon.compass(31),
    terminal: icon.terminal(30),
    notes: icon.note(30),
    launchpad: icon.grid(29),
    messages: icon.message(30),
    calendar: '<span class="macos27-calendar-glyph"><b>16</b></span>',
    mail: icon.mail(30),
  }[kind] || icon.folder(28);
  return `<span class="macos27-app-icon macos27-app-icon--${kind}">${content}</span>`;
}

function macButton({ label, className = '', preset = 'macos-control', attributes = '', ariaLabel = '' }) {
  return liquidButton({
    label,
    preset,
    className: `macos27-liquid-button ${className}`.trim(),
    live: true,
    inlineLive: true,
    attributes: `${attributes}${ariaLabel ? ` aria-label=\"${ariaLabel}\"` : ''}`,
  });
}

function dockButton(kind, label) {
  return macButton({
    label: `${appGlyph(kind)}<span class="macos27-dock-tip">${label}</span><span class="macos27-running-dot" aria-hidden="true"></span>`,
    preset: 'macos-clear-control',
    className: 'macos27-dock-button',
    attributes: `data-macos-app="${kind}" aria-label="${label}"`,
  });
}

function trafficLights() {
  return `<div class="macos27-traffic">
    <button class="is-close" data-window-action="close" aria-label="关闭"></button>
    <button class="is-minimize" data-window-action="minimize" aria-label="最小化"></button>
    <button class="is-zoom" data-window-action="zoom" aria-label="缩放"></button>
  </div>`;
}

function toolbarButton(label, svgIcon, attrs = '') {
  return macButton({ label: svgIcon, ariaLabel: label, className: 'macos27-toolbar-button', attributes: attrs });
}

const finderFiles = {
  recents: [
    ['folder', 'ViudiraTech', '今天 14:26', '12 个项目'], ['code', 'Uinxed-Agent', '今天 12:08', 'Go'], ['doc', 'README.md', '昨天', 'Markdown'],
    ['folder', 'Projects', '星期五', '8 个项目'], ['code', 'LiquidGlass.js', '星期四', 'JavaScript'], ['doc', 'notes.txt', '星期三', '文本'],
  ],
  applications: [
    ['app:safari', 'Safari', '应用程序', '浏览器'], ['app:notes', '备忘录', '应用程序', '效率'], ['app:terminal', '终端', '应用程序', '开发工具'],
    ['app:messages', '信息', '应用程序', '通讯'], ['app:calendar', '日历', '应用程序', '效率'], ['app:settings', '系统设置', '应用程序', '系统'],
  ],
  desktop: [['folder', 'Screenshots', '今天', '4 个项目'], ['doc', 'roadmap.md', '昨天', 'Markdown'], ['code', 'demo.html', '昨天', 'HTML']],
  documents: [['folder', 'Design', '今天', '6 个项目'], ['doc', 'kernel-notes.md', '昨天', 'Markdown'], ['doc', 'ideas.txt', '星期五', '文本']],
  downloads: [['doc', 'release-notes.pdf', '今天', 'PDF'], ['code', 'sample.zip', '昨天', '归档'], ['doc', 'wallpaper.heic', '星期五', '图像']],
  airdrop: [['doc', '等待附近设备…', '—', 'AirDrop 已开启']],
};

function finderCards(section = 'recents') {
  return (finderFiles[section] || finderFiles.recents).map(([type, name, date, meta]) => {
    let visual = '';
    if (type === 'folder') visual = `<span class="macos27-file-icon macos27-file-icon--folder">${icon.folder(35)}</span>`;
    else if (type.startsWith('app:')) visual = appGlyph(type.slice(4));
    else if (type === 'code') visual = '<span class="macos27-file-icon macos27-file-icon--code">&lt;/&gt;</span>';
    else visual = `<span class="macos27-file-icon macos27-file-icon--doc">${name.split('.').pop().slice(0,3).toUpperCase()}</span>`;
    const appAttr = type.startsWith('app:') ? ` data-macos-app="${type.slice(4)}"` : '';
    return `<button class="macos27-file"${appAttr}><span class="macos27-file-visual">${visual}</span><b>${name}</b><small>${date}</small><em>${meta}</em></button>`;
  }).join('');
}

function finderWindow() {
  const sidebar = [
    ['airdrop', 'AirDrop', '◌'], ['recents', '最近使用', '◷'], ['applications', '应用程序', 'A'],
    ['desktop', '桌面', '▣'], ['documents', '文稿', '▤'], ['downloads', '下载', '↓'],
  ].map(([id, label, glyph], index) => `<button class="macos27-sidebar-item${index === 1 ? ' is-active' : ''}" data-finder-section="${id}"><span>${glyph}</span><b>${label}</b></button>`).join('');

  return `<section class="macos27-window macos27-window--finder is-front" data-macos-window="finder" aria-label="Finder 窗口">
    <div class="macos27-window-toolbar" data-macos-drag-handle>
      ${trafficLights()}
      <div class="macos27-toolbar-leading">
        ${toolbarButton('显示或隐藏侧边栏', icon.sidebar(16), 'data-finder-sidebar-toggle')}
        <span class="macos27-toolbar-pair">${toolbarButton('后退', icon.back(16))}${toolbarButton('前进', icon.forward(16))}</span>
      </div>
      <div class="macos27-window-title" data-window-title>最近使用</div>
      <div class="macos27-toolbar-trailing">
        <span class="macos27-toolbar-pair">${toolbarButton('图标视图', icon.grid(16), 'data-finder-view="grid"')}${toolbarButton('列表视图', icon.list(16), 'data-finder-view="list"')}</span>
        ${toolbarButton('搜索', icon.search(16), 'data-macos-spotlight-open')}
      </div>
    </div>
    <div class="macos27-window-content macos27-finder-body">
      <aside class="macos27-finder-sidebar">
        <span class="macos27-sidebar-caption">个人收藏</span>${sidebar}
        <span class="macos27-sidebar-caption">iCloud</span>
        <button class="macos27-sidebar-item"><span>◇</span><b>iCloud Drive</b></button>
        <span class="macos27-sidebar-caption">位置</span>
        <button class="macos27-sidebar-item"><span>▰</span><b>Viudira</b></button>
      </aside>
      <div class="macos27-finder-content">
        <div class="macos27-finder-head"><div><span data-finder-heading>最近使用</span><b data-finder-subheading>过去 7 天</b></div><span data-finder-count>6 个项目</span></div>
        <div class="macos27-file-grid" data-finder-grid>${finderCards()}</div>
        <div class="macos27-finder-status"><span data-finder-status>6 个项目</span><span>iCloud 已同步</span></div>
      </div>
    </div>
  </section>`;
}

function safariWindow() {
  return `<section class="macos27-window macos27-window--safari is-hidden" data-macos-window="safari" aria-label="Safari 窗口">
    <div class="macos27-window-toolbar macos27-safari-toolbar" data-macos-drag-handle>
      ${trafficLights()}
      <div class="macos27-toolbar-leading"><span class="macos27-toolbar-pair">${toolbarButton('后退', icon.back(16), 'data-safari-back')}${toolbarButton('前进', icon.forward(16))}</span></div>
      <form class="macos27-address-field liquid-glass" data-safari-form data-glass-preset="macos-toolbar" data-glass-live="true" data-glass-keep-active="true">
        ${icon.search(14)}<input data-safari-address value="viudiratech.local" aria-label="地址与搜索" autocomplete="off"><span>⟳</span>
      </form>
      <div class="macos27-toolbar-trailing">${toolbarButton('分享', icon.share(16))}${toolbarButton('新建标签页', icon.plus(16), 'data-safari-new-tab')}</div>
    </div>
    <div class="macos27-safari-tabs"><button class="is-active">ViudiraTech Start</button><button>Liquid Glass</button><span></span></div>
    <div class="macos27-window-content macos27-safari-page" data-safari-page>
      <div class="macos27-safari-hero"><small>Safari</small><h2>起始页</h2><p>在模拟桌面里浏览本地页面，不会离开这个彩蛋。</p></div>
      <div class="macos27-safari-favorites">
        <button data-safari-site="viudiratech">${appGlyph('finder')}<b>ViudiraTech</b><small>社区主页</small></button>
        <button data-safari-site="github"><span class="macos27-site-tile">GH</span><b>GitHub</b><small>代码托管</small></button>
        <button data-safari-site="docs"><span class="macos27-site-tile is-docs">⌘</span><b>开发文档</b><small>本地演示</small></button>
        <button data-safari-site="glass"><span class="macos27-site-tile is-glass">◌</span><b>Liquid Glass</b><small>设计概览</small></button>
      </div>
      <section class="macos27-safari-card"><div><small>隐私报告</small><strong>Safari 已阻止 18 个跟踪器</strong></div><span>18</span></section>
    </div>
  </section>`;
}

function notesWindow() {
  return `<section class="macos27-window macos27-window--notes is-hidden" data-macos-window="notes" aria-label="备忘录窗口">
    <div class="macos27-window-toolbar" data-macos-drag-handle>
      ${trafficLights()}<div class="macos27-toolbar-leading">${toolbarButton('显示文件夹', icon.sidebar(16))}</div>
      <div class="macos27-window-title">备忘录</div>
      <div class="macos27-toolbar-trailing">${toolbarButton('新建备忘录', icon.plus(16), 'data-note-new')}${toolbarButton('搜索', icon.search(16))}</div>
    </div>
    <div class="macos27-window-content macos27-notes-body">
      <aside class="macos27-notes-list"><h3>备忘录</h3><button class="is-active"><b>ViudiraTech 网站</b><small>今天</small><span>继续完善 macOS 27 彩蛋…</span></button><button><b>Uinxed-Agent</b><small>昨天</small><span>Go TUI、性能、交互</span></button><button><b>待办</b><small>星期五</small><span>检查 GitHub Pages</span></button></aside>
      <article class="macos27-note-editor"><div class="macos27-note-date">2026年8月16日 15:15</div><input data-note-title value="ViudiraTech 网站" aria-label="备忘录标题"><textarea data-note-body aria-label="备忘录正文">继续完善 macOS 27 Golden Gate 彩蛋。\n\n• Finder / Safari / 终端 / 系统设置\n• 更真实的 Liquid Glass\n• 完整窗口管理\n• 控制中心、聚焦、通知中心\n\n这份内容会保存在浏览器 localStorage 中。</textarea></article>
    </div>
  </section>`;
}

function terminalWindow() {
  return `<section class="macos27-window macos27-window--terminal is-hidden" data-macos-window="terminal" aria-label="终端窗口">
    <div class="macos27-window-toolbar macos27-terminal-toolbar" data-macos-drag-handle>
      ${trafficLights()}<div></div><div class="macos27-window-title">jitianyu — zsh — 80×24</div><div></div>
    </div>
    <div class="macos27-window-content macos27-terminal-body" data-terminal-output>
      <div class="macos27-terminal-line is-muted">Last login: Sun Aug 16 15:14:02 on ttys001</div>
      <div class="macos27-terminal-line"><span class="is-green">jitianyu@Viudira-Mac</span> <span class="is-blue">~</span> % <span>uname -a</span></div>
      <div class="macos27-terminal-line">Darwin Viudira-Mac 27.0.0 GoldenGate arm64</div>
    </div>
    <form class="macos27-terminal-input" data-terminal-form><span><b>jitianyu@Viudira-Mac</b> ~ %</span><input data-terminal-input aria-label="终端命令" autocomplete="off" spellcheck="false"></form>
  </section>`;
}

function messagesWindow() {
  return `<section class="macos27-window macos27-window--messages is-hidden" data-macos-window="messages" aria-label="信息窗口">
    <div class="macos27-window-toolbar" data-macos-drag-handle>${trafficLights()}<div class="macos27-toolbar-leading">${toolbarButton('新信息', icon.plus(16))}</div><div class="macos27-window-title">信息</div><div class="macos27-toolbar-trailing">${toolbarButton('搜索', icon.search(16))}</div></div>
    <div class="macos27-window-content macos27-messages-body"><aside><h3>信息</h3><button class="is-active"><span>V</span><div><b>ViudiraTech</b><small>15:12</small><p>macOS 27 模拟器继续扩充中</p></div></button><button><span>U</span><div><b>Uinxed</b><small>昨天</small><p>构建通过</p></div></button></aside><main><header><span>V</span><b>ViudiraTech</b></header><div class="macos27-chat"><p class="is-them">新的桌面模拟器看起来怎么样？</p><p class="is-me">这次不再是空壳了。</p><p class="is-me">Finder、Safari、Terminal、Settings、Spotlight 都能用了。</p></div><div class="macos27-message-composer liquid-glass" data-glass-preset="macos-toolbar" data-glass-live="true"><input placeholder="iMessage" aria-label="信息"><button aria-label="发送">↑</button></div></main></div>
  </section>`;
}

function calendarWindow() {
  const days = Array.from({ length: 35 }, (_, i) => {
    const n = i - 4;
    if (n < 1 || n > 31) return '<span class="is-outside"></span>';
    return `<button class="${n === 16 ? 'is-today' : ''}">${n}${n === 18 ? '<i></i>' : ''}</button>`;
  }).join('');
  return `<section class="macos27-window macos27-window--calendar is-hidden" data-macos-window="calendar" aria-label="日历窗口">
    <div class="macos27-window-toolbar" data-macos-drag-handle>${trafficLights()}<div class="macos27-toolbar-leading">${macButton({ label: '今天', className: 'macos27-toolbar-text-button' })}</div><div class="macos27-window-title">2026年8月</div><div class="macos27-toolbar-trailing">${toolbarButton('新建日程', icon.plus(16))}${toolbarButton('搜索', icon.search(16))}</div></div>
    <div class="macos27-window-content macos27-calendar-body"><aside><h3>日历</h3><label><i class="is-blue"></i>工作</label><label><i class="is-orange"></i>个人</label><label><i class="is-green"></i>ViudiraTech</label></aside><main><div class="macos27-weekdays"><span>周一</span><span>周二</span><span>周三</span><span>周四</span><span>周五</span><span>周六</span><span>周日</span></div><div class="macos27-month-grid">${days}</div></main></div>
  </section>`;
}

function settingRow(title, sub, control) {
  return `<div class="macos27-setting-row"><div><b>${title}</b><small>${sub}</small></div>${control}</div>`;
}

function settingsPanel(section = 'appearance') {
  if (section === 'desktop') return `<div class="macos27-settings-title"><h2>桌面与 Dock</h2><p>调整 Dock、桌面项目和窗口行为</p></div>
    <section class="macos27-settings-card macos27-settings-card--rows">
      ${settingRow('Dock 大小', '调整 Dock 图标尺寸', liquidSlider({ value: 62, min: 44, max: 76, ariaLabel: 'Dock 大小', className: 'macos27-shared-slider', setting: 'dockSize' }))}
      ${settingRow('放大', '将指针移到 Dock 图标上时放大', liquidToggle({ checked: true, ariaLabel: 'Dock 放大', className: 'macos27-shared-toggle', setting: 'dockMagnify' }))}
      ${settingRow('自动隐藏和显示 Dock', '靠近屏幕底部时显示 Dock', liquidToggle({ checked: false, ariaLabel: '自动隐藏 Dock', className: 'macos27-shared-toggle', setting: 'dockAutohide' }))}
      ${settingRow('点按墙纸显示桌面', '隐藏窗口以查看桌面', liquidToggle({ checked: true, ariaLabel: '点按墙纸显示桌面', className: 'macos27-shared-toggle', setting: 'clickWallpaper' }))}
    </section>`;
  if (section === 'display') return `<div class="macos27-settings-title"><h2>显示器</h2><p>内建显示器</p></div>
    <section class="macos27-display-preview"><div><span>Viudira Display</span></div></section>
    <section class="macos27-settings-card macos27-settings-card--rows">
      ${settingRow('亮度', '根据环境自动调节', liquidSlider({ value: 72, min: 0, max: 100, ariaLabel: '亮度', className: 'macos27-shared-slider', setting: 'displayBrightness' }))}
      ${settingRow('原彩显示', '让颜色适应环境光线', liquidToggle({ checked: true, ariaLabel: '原彩显示', className: 'macos27-shared-toggle', setting: 'trueTone' }))}
    </section>`;
  if (section === 'wallpaper') return `<div class="macos27-settings-title"><h2>墙纸</h2><p>Golden Gate 动态配色</p></div>
    <section class="macos27-wallpaper-choices"><button class="is-selected" data-wallpaper="golden"><i class="is-golden"></i><b>Golden Gate</b></button><button data-wallpaper="ocean"><i class="is-ocean"></i><b>Pacific</b></button><button data-wallpaper="dusk"><i class="is-dusk"></i><b>Dusk</b></button><button data-wallpaper="mono"><i class="is-mono"></i><b>Graphite</b></button></section>`;
  if (section === 'accessibility') return `<div class="macos27-settings-title"><h2>辅助功能</h2><p>显示与动态效果</p></div>
    <section class="macos27-settings-card macos27-settings-card--rows">
      ${settingRow('减少透明度', '以更高不透明度显示半透明区域', liquidToggle({ checked: false, ariaLabel: '减少透明度', className: 'macos27-shared-toggle', setting: 'reduceTransparency' }))}
      ${settingRow('提高对比度', '增强控件和窗口边界', liquidToggle({ checked: false, ariaLabel: '提高对比度', className: 'macos27-shared-toggle', setting: 'macosContrast' }))}
      ${settingRow('减少动态效果', '减少窗口与界面动画', liquidToggle({ checked: false, ariaLabel: '减少动态效果', className: 'macos27-shared-toggle', setting: 'reduceMotion' }))}
    </section>`;
  return `<div class="macos27-settings-title"><h2>外观</h2><p>macOS 27 Golden Gate</p></div>
    <section class="macos27-settings-card"><div class="macos27-appearance-options"><button class="is-selected" data-appearance="auto"><span class="macos27-appearance-preview is-auto"></span><b>自动</b></button><button data-appearance="light"><span class="macos27-appearance-preview is-light"></span><b>浅色</b></button><button data-appearance="dark"><span class="macos27-appearance-preview is-dark"></span><b>深色</b></button></div></section>
    <section class="macos27-settings-card macos27-settings-card--rows">
      ${settingRow('Liquid Glass', '从超清透到完整色调', liquidSlider({ value: 52, min: 0, max: 100, ariaLabel: 'Liquid Glass 透明度', className: 'macos27-shared-slider', setting: 'macosGlass' }))}
      ${settingRow('显示边框', '增强窗口和控件边缘', liquidToggle({ checked: false, ariaLabel: '显示边框', className: 'macos27-shared-toggle', setting: 'macosBorders' }))}
    </section>`;
}

function settingsWindow() {
  const nav = [
    ['appearance', '外观', 'appearance'], ['wallpaper', '墙纸', 'wallpaper'], ['display', '显示器', 'display'], ['desktop', '桌面与 Dock', 'desktop'], ['accessibility', '辅助功能', 'access'],
  ].map(([id, label, cls], index) => `<button class="${index === 0 ? 'is-active' : ''}" data-settings-section="${id}"><i class="macos27-setting-icon macos27-setting-icon--${cls}"></i><span>${label}</span></button>`).join('');
  return `<section class="macos27-window macos27-window--settings is-hidden" data-macos-window="settings" aria-label="系统设置窗口">
    <div class="macos27-window-toolbar" data-macos-drag-handle>${trafficLights()}<div></div><div class="macos27-window-title">系统设置</div><div class="macos27-toolbar-trailing">${toolbarButton('搜索设置', icon.search(16), 'data-settings-search')}</div></div>
    <div class="macos27-window-content macos27-settings-body">
      <aside class="macos27-settings-sidebar"><div class="macos27-settings-profile"><span>V</span><div><b>Viudira</b><small>Apple Account</small></div></div><div class="macos27-settings-nav">${nav}</div></aside>
      <div class="macos27-settings-content" data-settings-content>${settingsPanel()}</div>
    </div>
  </section>`;
}

function controlCenter() {
  return `<aside class="macos27-control-center liquid-glass" data-macos-control-center data-glass-preset="macos-popover" data-glass-live="true" data-glass-keep-active="true" aria-hidden="true">
    <div class="macos27-cc-grid">
      <button class="macos27-cc-connect is-active" data-cc-tile="wifi"><span class="macos27-cc-icon">${icon.wifi(18)}</span><p><b>Wi‑Fi</b><small>Viudira 5G</small></p></button>
      <button class="macos27-cc-connect is-active" data-cc-tile="bluetooth"><span class="macos27-cc-icon">B</span><p><b>蓝牙</b><small>开启</small></p></button>
      <button class="macos27-cc-connect" data-cc-tile="airdrop"><span class="macos27-cc-icon">◌</span><p><b>AirDrop</b><small>仅限联系人</small></p></button>
      <button class="macos27-cc-connect" data-cc-tile="focus"><span class="macos27-cc-icon">${icon.moon(17)}</span><p><b>专注模式</b><small>关闭</small></p></button>
    </div>
    <div class="macos27-cc-now-playing"><span class="macos27-now-art">V</span><div><b>Night Flight</b><small>Viudira Mix</small></div><button aria-label="播放">▶</button></div>
    <div class="macos27-cc-slider"><span>显示器</span>${liquidSlider({ value: 72, ariaLabel: '显示器亮度', className: 'macos27-shared-slider', setting: 'ccBrightness' })}</div>
    <div class="macos27-cc-slider"><span>声音</span>${liquidSlider({ value: 42, ariaLabel: '声音', className: 'macos27-shared-slider', setting: 'ccVolume' })}</div>
    <div class="macos27-cc-actions">${macButton({ label: '系统设置', className: 'macos27-cc-button', attributes: 'data-macos-open-settings' })}${macButton({ label: '退出模拟器', className: 'macos27-cc-button', attributes: 'data-macos-exit' })}</div>
  </aside>`;
}

function systemMenu() {
  return `<div class="macos27-system-menu liquid-glass" data-macos-system-popover data-glass-preset="macos-popover" data-glass-live="true" data-glass-keep-active="true" aria-hidden="true">
    <strong>Viudira macOS 27</strong><button data-toast="这是一个网站内的交互式模拟器">关于本模拟器</button><hr/><button data-macos-open-settings>系统设置…</button><button data-macos-spotlight-open>Spotlight…</button><hr/><button data-toast="已模拟锁定">锁定屏幕</button><button data-macos-exit>退出到 ViudiraTech</button>
  </div>`;
}

function spotlight() {
  return `<section class="macos27-spotlight liquid-glass" data-macos-spotlight data-glass-preset="macos-popover" data-glass-live="true" data-glass-keep-active="true" aria-hidden="true">
    <div class="macos27-spotlight-input">${icon.search(23)}<input data-spotlight-input placeholder="Spotlight 搜索" aria-label="Spotlight 搜索" autocomplete="off"><kbd>esc</kbd></div>
    <div class="macos27-spotlight-results" data-spotlight-results></div>
  </section>`;
}

function notifications() {
  return `<aside class="macos27-notifications" data-macos-notifications aria-hidden="true">
    <section class="macos27-widget macos27-widget--date"><small>星期日</small><strong>16</strong><span>八月</span></section>
    <section class="macos27-widget macos27-widget--weather"><div><small>天津</small><strong>30°</strong><span>晴朗</span></div><b>☀</b></section>
    <section class="macos27-notification liquid-glass" data-glass-preset="macos-popover" data-glass-live="true"><span class="macos27-notification-icon">V</span><div><b>ViudiraTech</b><small>现在</small><p>macOS 27 模拟桌面已扩充。</p></div></section>
    <section class="macos27-notification liquid-glass" data-glass-preset="macos-popover" data-glass-live="true"><span class="macos27-notification-icon is-blue">G</span><div><b>Git</b><small>12 分钟前</small><p>工作区检查通过。</p></div></section>
  </aside>`;
}

function launchpad() {
  return `<div class="macos27-launchpad" data-macos-launchpad aria-hidden="true">
    <div class="macos27-launchpad-search liquid-glass" data-glass-preset="macos-toolbar" data-glass-live="true">${icon.search(16)}<input placeholder="搜索应用" data-launchpad-search aria-label="搜索应用"></div>
    <div class="macos27-launchpad-grid">${Object.entries(apps).filter(([key]) => key !== 'launchpad').map(([key, app]) => `<button data-macos-app="${key}" data-app-label="${app.label}">${appGlyph(key)}<span>${app.label}</span></button>`).join('')}</div>
  </div>`;
}

export function macos27Simulator() {
  return `<section class="macos27-sim" data-macos27-sim aria-label="macOS 27 Golden Gate 模拟桌面">
    <div class="macos27-wallpaper" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
    <header class="macos27-menubar liquid-glass" data-glass-preset="macos-menubar" data-glass-live="true" data-glass-keep-active="true">
      <div class="macos27-menubar__left"><button class="macos27-menu-mark" data-macos-system-menu aria-label="系统菜单"><span>V</span></button><b data-macos-active-app>Finder</b><button data-menu-label="文件">文件</button><button data-menu-label="编辑">编辑</button><button data-menu-label="显示">显示</button><button data-menu-label="前往">前往</button><button data-menu-label="窗口">窗口</button><button data-menu-label="帮助">帮助</button></div>
      <div class="macos27-menubar__right"><span class="macos27-status-glyph">${icon.battery(19)}</span><span class="macos27-status-glyph">${icon.wifi(18)}</span><button class="macos27-status-button" data-macos-cc-toggle aria-label="控制中心">${icon.control(18)}</button><button class="macos27-status-button" data-macos-spotlight-open aria-label="聚焦搜索">${icon.search(17)}</button><button class="macos27-clock-button" data-macos-notifications-toggle><time data-macos-clock></time></button></div>
    </header>

    ${systemMenu()}
    ${controlCenter()}
    ${spotlight()}
    ${notifications()}

    <div class="macos27-app-menu liquid-glass" data-macos-app-menu data-glass-preset="macos-popover" data-glass-live="true" data-glass-keep-active="true" aria-hidden="true"></div>

    <div class="macos27-desktop-icons" aria-label="桌面项目">
      <button data-macos-app="settings"><span class="macos27-desktop-icon macos27-desktop-icon--settings">${icon.gear(30)}</span><b>系统设置</b></button>
      <button data-macos-app="finder"><span class="macos27-desktop-icon macos27-desktop-icon--disk">V</span><b>Viudira</b></button>
      <button data-macos-app="notes"><span class="macos27-desktop-icon macos27-desktop-icon--file">TXT</span><b>notes</b></button>
    </div>

    ${finderWindow()}
    ${safariWindow()}
    ${notesWindow()}
    ${terminalWindow()}
    ${messagesWindow()}
    ${calendarWindow()}
    ${settingsWindow()}
    ${launchpad()}

    <nav class="macos27-dock liquid-glass" data-glass-preset="macos-dock" data-glass-live="true" data-glass-keep-active="true" aria-label="Dock">
      ${dockButton('finder', 'Finder')}${dockButton('launchpad', '启动台')}${dockButton('safari', 'Safari')}${dockButton('messages', '信息')}${dockButton('calendar', '日历')}${dockButton('notes', '备忘录')}${dockButton('terminal', '终端')}<span class="macos27-dock-separator" aria-hidden="true"></span>${dockButton('settings', '系统设置')}
    </nav>
  </section>`;
}

let frontZ = 45;

function appLabel(name) { return apps[name]?.label || name || 'Finder'; }

function setActiveApp(root, name) {
  const active = root.querySelector('[data-macos-active-app]');
  if (active) active.textContent = appLabel(name);
  root.dataset.activeApp = name;
}

function bringToFront(root, windowEl) {
  if (!windowEl) return;
  frontZ += 1;
  root.querySelectorAll('[data-macos-window]').forEach((item) => item.classList.remove('is-front'));
  windowEl.classList.add('is-front');
  windowEl.style.zIndex = String(frontZ);
  setActiveApp(root, windowEl.dataset.macosWindow);
}

function updateDockRunning(root) {
  root.querySelectorAll('[data-macos-app]').forEach((button) => {
    const name = button.dataset.macosApp;
    const windowEl = root.querySelector(`[data-macos-window="${name}"]`);
    if (!windowEl) return;
    button.classList.toggle('is-running', !windowEl.classList.contains('is-hidden'));
    button.classList.toggle('is-minimized', windowEl.classList.contains('is-minimized'));
  });
}

function setWindowGlassActive(windowEl, active) {
  windowEl?.querySelectorAll('.liquid-glass').forEach(active ? activateLiquidGlassElement : suspendLiquidGlassElement);
}

function openWindow(root, name) {
  const windowEl = root.querySelector(`[data-macos-window="${name}"]`);
  if (!windowEl) return false;
  windowEl.classList.remove('is-hidden', 'is-minimized');
  setWindowGlassActive(windowEl, true);
  bringToFront(root, windowEl);
  updateDockRunning(root);
  return true;
}

function closeWindow(root, windowEl) {
  windowEl.classList.add('is-hidden');
  windowEl.classList.remove('is-minimized', 'is-maximized');
  setWindowGlassActive(windowEl, false);
  updateDockRunning(root);
  const visible = [...root.querySelectorAll('[data-macos-window]:not(.is-hidden)')].sort((a, b) => (+b.style.zIndex || 0) - (+a.style.zIndex || 0));
  setActiveApp(root, visible[0]?.dataset.macosWindow || 'Finder');
}

function minimizeWindow(root, windowEl) {
  windowEl.classList.add('is-minimized');
  window.setTimeout(() => { windowEl.classList.add('is-hidden'); setWindowGlassActive(windowEl, false); }, 210);
  updateDockRunning(root);
}

function toggleZoom(windowEl) {
  windowEl.classList.remove('is-snapped');
  if (!windowEl.classList.contains('is-maximized')) {
    const rect = windowEl.getBoundingClientRect();
    windowEl.dataset.restoreGeometry = JSON.stringify({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
    windowEl.classList.add('is-maximized');
    windowEl.style.left = '';
    windowEl.style.top = '';
    windowEl.style.width = '';
    windowEl.style.height = '';
    windowEl.style.transform = '';
  } else {
    windowEl.classList.remove('is-maximized');
    try {
      const g = JSON.parse(windowEl.dataset.restoreGeometry || '{}');
      if (Number.isFinite(g.left)) windowEl.style.left = `${g.left}px`;
      if (Number.isFinite(g.top)) windowEl.style.top = `${g.top}px`;
      if (Number.isFinite(g.width)) windowEl.style.width = `${g.width}px`;
      if (Number.isFinite(g.height)) windowEl.style.height = `${g.height}px`;
    } catch {}
  }
}

function bindWindowDrag(root, windowEl) {
  const handle = windowEl.querySelector('[data-macos-drag-handle]');
  if (!handle || handle.dataset.dragBound === '1') return;
  handle.dataset.dragBound = '1';
  let pointerId = null;
  let startX = 0; let startY = 0; let startLeft = 0; let startTop = 0;

  handle.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || event.target.closest('button,input,form,.macos27-address-field')) return;
    if (windowEl.classList.contains('is-maximized') || innerWidth <= 780) return;
    pointerId = event.pointerId;
    const rect = windowEl.getBoundingClientRect();
    startX = event.clientX; startY = event.clientY; startLeft = rect.left; startTop = rect.top;
    windowEl.style.transform = 'none'; windowEl.style.left = `${rect.left}px`; windowEl.style.top = `${rect.top}px`;
    bringToFront(root, windowEl); handle.setPointerCapture(pointerId); windowEl.classList.add('is-dragging');
  });
  handle.addEventListener('pointermove', (event) => {
    if (event.pointerId !== pointerId) return;
    const width = windowEl.offsetWidth; const height = windowEl.offsetHeight;
    const x = Math.max(6, Math.min(innerWidth - width - 6, startLeft + event.clientX - startX));
    const y = Math.max(34, Math.min(innerHeight - Math.min(height, 110), startTop + event.clientY - startY));
    windowEl.style.left = `${x}px`; windowEl.style.top = `${y}px`;
  });
  const release = (event) => {
    if (pointerId == null || (event?.pointerId != null && event.pointerId !== pointerId)) return;
    pointerId = null; windowEl.classList.remove('is-dragging');
  };
  handle.addEventListener('pointerup', release); handle.addEventListener('pointercancel', release);
  handle.addEventListener('dblclick', (event) => { if (!event.target.closest('button,input,form')) toggleZoom(windowEl); });
  windowEl.addEventListener('pointerdown', () => bringToFront(root, windowEl));

  windowEl.querySelectorAll('[data-window-action]').forEach((button) => button.addEventListener('click', (event) => {
    event.stopPropagation();
    const action = button.dataset.windowAction;
    if (action === 'close') closeWindow(root, windowEl);
    else if (action === 'minimize') minimizeWindow(root, windowEl);
    else if (action === 'zoom') toggleZoom(windowEl);
  }));
}

function showToast(root, text) {
  root.dataset.toast = text;
  clearTimeout(root._macosToastTimer);
  root._macosToastTimer = setTimeout(() => { if (root.isConnected) delete root.dataset.toast; }, 1700);
}

function setOverlay(root, name, open) {
  const target = root.querySelector(`[data-macos-${name}]`);
  if (!target) return;
  target.classList.toggle('is-open', open);
  target.setAttribute('aria-hidden', String(!open));
  if (target.classList.contains('liquid-glass')) {
    if (open) activateLiquidGlassElement(target);
    else suspendLiquidGlassElement(target);
  }
}

function closeOverlays(root, except = '') {
  ['control-center', 'system-popover', 'app-menu', 'spotlight', 'notifications'].forEach((name) => {
    if (name !== except) setOverlay(root, name, false);
  });
  root.classList.remove('show-launchpad');
}

function bindFinder(root) {
  const finder = root.querySelector('[data-macos-window="finder"]');
  if (!finder) return;
  const grid = finder.querySelector('[data-finder-grid]');
  const heading = finder.querySelector('[data-finder-heading]');
  const sub = finder.querySelector('[data-finder-subheading]');
  const count = finder.querySelector('[data-finder-count]');
  const status = finder.querySelector('[data-finder-status]');
  const title = finder.querySelector('[data-window-title]');
  const labels = { recents: '最近使用', applications: '应用程序', desktop: '桌面', documents: '文稿', downloads: '下载', airdrop: 'AirDrop' };
  finder.querySelectorAll('[data-finder-section]').forEach((button) => button.addEventListener('click', () => {
    const section = button.dataset.finderSection;
    finder.querySelectorAll('[data-finder-section]').forEach((item) => item.classList.toggle('is-active', item === button));
    const items = finderFiles[section] || finderFiles.recents;
    grid.innerHTML = finderCards(section);
    grid.classList.remove('is-list');
    const label = labels[section] || 'Finder';
    if (heading) heading.textContent = label; if (title) title.textContent = label;
    if (sub) sub.textContent = section === 'airdrop' ? '附近设备' : section === 'applications' ? '本机应用' : '此 Mac';
    if (count) count.textContent = `${items.length} 个项目`; if (status) status.textContent = `${items.length} 个项目`;
    bindAppLaunchers(root, grid);
  }));
  finder.querySelector('[data-finder-sidebar-toggle]')?.addEventListener('click', () => finder.classList.toggle('sidebar-collapsed'));
  finder.querySelectorAll('[data-finder-view]').forEach((button) => button.addEventListener('click', () => grid.classList.toggle('is-list', button.dataset.finderView === 'list')));
}

function safariPageMarkup(site) {
  if (site === 'glass') return `<article class="macos27-browser-article"><small>Design System</small><h1>Liquid Glass</h1><p>控制和导航浮在内容之上。背景颜色会穿过材质，边缘出现轻微折射与高光；大面积正文仍保持标准材质。</p><div class="macos27-browser-glass-demo"><span class="liquid-glass" data-glass-preset="macos-popover" data-glass-live="true">Control</span><span class="liquid-glass" data-glass-preset="macos-toolbar" data-glass-live="true">Toolbar</span></div></article>`;
  if (site === 'github') return `<article class="macos27-browser-article"><small>Code Hosting</small><h1>ViudiraTech / web</h1><p>本页是离线模拟内容。实际站点代码仍由 ViudiraTech SPA 提供。</p><pre>main\n├── src/components\n├── src/glass\n└── src/styles</pre></article>`;
  if (site === 'docs') return `<article class="macos27-browser-article"><small>Developer</small><h1>Golden Gate UI Notes</h1><p>统一工具栏、edge-to-edge 侧边栏、圆润窗口和更高对比度的 Liquid Glass，是这个模拟器采用的核心设计语言。</p></article>`;
  return `<article class="macos27-browser-article"><small>ViudiraTech</small><h1>Build strange things well.</h1><p>操作系统、内核、系统软件和开发者工具社区。</p><div class="macos27-browser-stats"><span><b>System</b><small>Kernel / Runtime</small></span><span><b>Tools</b><small>Agents / TUI</small></span><span><b>Open</b><small>Open source</small></span></div></article>`;
}

function bindSafari(root) {
  const safari = root.querySelector('[data-macos-window="safari"]');
  if (!safari) return;
  const page = safari.querySelector('[data-safari-page]'); const address = safari.querySelector('[data-safari-address]');
  const navigate = (site, label = '') => {
    page.innerHTML = safariPageMarkup(site); address.value = label || `${site}.local`;
    page.querySelectorAll('.liquid-glass').forEach((el) => activateLiquidGlassElement(el));
  };
  safari.querySelectorAll('[data-safari-site]').forEach((button) => button.addEventListener('click', () => navigate(button.dataset.safariSite)));
  safari.querySelector('[data-safari-form]')?.addEventListener('submit', (event) => {
    event.preventDefault(); const value = address.value.toLowerCase();
    const site = value.includes('glass') ? 'glass' : value.includes('github') ? 'github' : value.includes('doc') ? 'docs' : 'viudiratech'; navigate(site, address.value);
  });
  safari.querySelector('[data-safari-new-tab]')?.addEventListener('click', () => { address.value = ''; address.focus(); });
}

function bindNotes(root) {
  const title = root.querySelector('[data-note-title]'); const body = root.querySelector('[data-note-body]');
  if (!title || !body) return;
  title.value = localStorage.getItem('viudira.macos27.noteTitle') || title.value;
  body.value = localStorage.getItem('viudira.macos27.noteBody') || body.value;
  const save = () => { localStorage.setItem('viudira.macos27.noteTitle', title.value); localStorage.setItem('viudira.macos27.noteBody', body.value); };
  title.addEventListener('input', save); body.addEventListener('input', save);
  root.querySelector('[data-note-new]')?.addEventListener('click', () => { title.value = '新建备忘录'; body.value = ''; save(); body.focus(); });
}

function bindTerminal(root) {
  const form = root.querySelector('[data-terminal-form]'); const input = root.querySelector('[data-terminal-input]'); const output = root.querySelector('[data-terminal-output]');
  if (!form || !input || !output) return;
  const append = (html, cls = '') => { const div = document.createElement('div'); div.className = `macos27-terminal-line ${cls}`.trim(); div.innerHTML = html; output.append(div); output.scrollTop = output.scrollHeight; };
  const commands = {
    help: () => '可用命令：help · ls · pwd · date · uname · clear · echo · open',
    ls: () => 'Desktop&nbsp;&nbsp;Documents&nbsp;&nbsp;Downloads&nbsp;&nbsp;Projects&nbsp;&nbsp;README.md',
    pwd: () => '/Users/jitianyu',
    date: () => new Date().toString(),
    uname: () => 'Darwin Viudira-Mac 27.0.0 GoldenGate arm64',
  };
  form.addEventListener('submit', (event) => {
    event.preventDefault(); const raw = input.value.trim(); input.value = ''; if (!raw) return;
    append(`<span class="is-green">jitianyu@Viudira-Mac</span> <span class="is-blue">~</span> % ${raw}`);
    const [cmd, ...args] = raw.split(/\s+/);
    if (cmd === 'clear') { output.innerHTML = ''; return; }
    if (cmd === 'echo') { append(args.join(' ')); return; }
    if (cmd === 'open') { const target = (args[0] || 'finder').toLowerCase(); const map = { finder: 'finder', safari: 'safari', notes: 'notes', settings: 'settings', calendar: 'calendar', messages: 'messages' }; if (map[target]) openWindow(root, map[target]); else append(`open: ${target}: 未找到应用`, 'is-error'); return; }
    if (commands[cmd]) append(commands[cmd]()); else append(`zsh: command not found: ${cmd}`, 'is-error');
  });
}

function bindSettings(root) {
  const settings = root.querySelector('[data-macos-window="settings"]'); if (!settings) return;
  const content = settings.querySelector('[data-settings-content]');
  const rebindContent = () => { bindLiquidButtons(content); bindLiquidToggles(content); bindLiquidSliders(content); bindSettingsControls(root, content); };
  settings.querySelectorAll('[data-settings-section]').forEach((button) => button.addEventListener('click', () => {
    settings.querySelectorAll('[data-settings-section]').forEach((item) => item.classList.toggle('is-active', item === button));
    content.querySelectorAll('[data-liquid-button]').forEach((el) => el._liquidButtonController?.destroy?.());
    content.querySelectorAll('.liquid-glass').forEach((el) => deactivateLiquidGlassElement(el));
    content.innerHTML = settingsPanel(button.dataset.settingsSection); rebindContent();
  }));
  rebindContent();
}

function bindSettingsControls(root, scope) {
  scope.querySelector('[data-setting-slider="macosGlass"]')?.addEventListener('liquidslider:input', (event) => {
    root._updateMacGlassLevel?.(Number(event.detail?.value ?? 52));
  });
  scope.querySelector('[data-setting-toggle="macosBorders"]')?.addEventListener('liquidtoggle:change', (event) => root.classList.toggle('show-borders', Boolean(event.detail?.checked)));
  scope.querySelector('[data-setting-toggle="macosContrast"]')?.addEventListener('liquidtoggle:change', (event) => root.classList.toggle('high-contrast', Boolean(event.detail?.checked)));
  scope.querySelector('[data-setting-toggle="reduceTransparency"]')?.addEventListener('liquidtoggle:change', (event) => root.classList.toggle('reduce-transparency', Boolean(event.detail?.checked)));
  scope.querySelector('[data-setting-toggle="reduceMotion"]')?.addEventListener('liquidtoggle:change', (event) => root.classList.toggle('reduce-motion', Boolean(event.detail?.checked)));
  scope.querySelector('[data-setting-toggle="dockMagnify"]')?.addEventListener('liquidtoggle:change', (event) => root.classList.toggle('dock-no-magnify', !event.detail?.checked));
  scope.querySelector('[data-setting-toggle="dockAutohide"]')?.addEventListener('liquidtoggle:change', (event) => root.classList.toggle('dock-autohide', Boolean(event.detail?.checked)));
  scope.querySelector('[data-setting-slider="dockSize"]')?.addEventListener('liquidslider:input', (event) => root.style.setProperty('--macos27-dock-size', `${Number(event.detail?.value ?? 62)}px`));
  scope.querySelector('[data-setting-slider="displayBrightness"]')?.addEventListener('liquidslider:input', (event) => root.style.setProperty('--macos27-brightness', (0.55 + Number(event.detail?.value ?? 72) / 100 * 0.6).toFixed(2)));
  scope.querySelectorAll('[data-appearance]').forEach((button) => button.addEventListener('click', () => {
    scope.querySelectorAll('[data-appearance]').forEach((item) => item.classList.toggle('is-selected', item === button)); root.dataset.appearance = button.dataset.appearance;
  }));
  scope.querySelectorAll('[data-wallpaper]').forEach((button) => button.addEventListener('click', () => {
    scope.querySelectorAll('[data-wallpaper]').forEach((item) => item.classList.toggle('is-selected', item === button)); root.dataset.wallpaper = button.dataset.wallpaper;
  }));
}

function spotlightResults(query = '') {
  const items = [
    ...Object.entries(apps).filter(([key]) => key !== 'launchpad').map(([key, app]) => ({ type: 'app', key, label: app.label, meta: '应用程序' })),
    { type: 'file', key: 'finder', label: 'README.md', meta: '文稿 · ViudiraTech' },
    { type: 'file', key: 'finder', label: 'Uinxed-Agent', meta: '项目文件夹' },
    { type: 'setting', key: 'settings', label: 'Liquid Glass', meta: '系统设置 · 外观' },
  ];
  const q = query.trim().toLowerCase();
  return items.filter((item) => !q || `${item.label} ${item.meta}`.toLowerCase().includes(q)).slice(0, 7).map((item, index) => `<button class="${index === 0 ? 'is-selected' : ''}" data-spotlight-open="${item.key}"><span>${item.type === 'app' ? appGlyph(item.key) : icon.search(20)}</span><div><b>${item.label}</b><small>${item.meta}</small></div><kbd>↵</kbd></button>`).join('') || '<p class="macos27-spotlight-empty">没有找到结果</p>';
}

function bindSpotlight(root) {
  const panel = root.querySelector('[data-macos-spotlight]'); const input = root.querySelector('[data-spotlight-input]'); const results = root.querySelector('[data-spotlight-results]'); if (!panel || !input || !results) return;
  const render = () => { results.innerHTML = spotlightResults(input.value); results.querySelectorAll('[data-spotlight-open]').forEach((button) => button.addEventListener('click', () => { openWindow(root, button.dataset.spotlightOpen); setOverlay(root, 'spotlight', false); })); };
  render(); input.addEventListener('input', render);
  panel.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') { const selected = results.querySelector('.is-selected,[data-spotlight-open]'); if (selected) { openWindow(root, selected.dataset.spotlightOpen); setOverlay(root, 'spotlight', false); } }
    if (event.key === 'Escape') setOverlay(root, 'spotlight', false);
  });
  root.querySelectorAll('[data-macos-spotlight-open]').forEach((button) => button.addEventListener('click', (event) => { event.stopPropagation(); closeOverlays(root, 'spotlight'); setOverlay(root, 'spotlight', true); input.value = ''; render(); requestAnimationFrame(() => input.focus()); }));
}

function bindAppLaunchers(root, scope = root) {
  scope.querySelectorAll('[data-macos-app]').forEach((button) => {
    if (button.dataset.appBound === '1') return; button.dataset.appBound = '1';
    button.addEventListener('click', () => {
      const name = button.dataset.macosApp;
      if (name === 'launchpad') { closeOverlays(root); root.classList.toggle('show-launchpad'); root.querySelector('[data-macos-launchpad]')?.setAttribute('aria-hidden', String(!root.classList.contains('show-launchpad'))); return; }
      root.classList.remove('show-launchpad');
      if (!openWindow(root, name)) showToast(root, `${appLabel(name)} · 演示 App`);
    });
  });
}

function bindMenuBar(root) {
  const appMenu = root.querySelector('[data-macos-app-menu]');
  const menuItems = {
    文件: [['新建 Finder 窗口', 'finder'], ['新建 Safari 窗口', 'safari'], ['关闭窗口', 'close']],
    编辑: [['撤销', 'toast'], ['拷贝', 'toast'], ['粘贴', 'toast']],
    显示: [['显示启动台', 'launchpad'], ['显示 Spotlight', 'spotlight'], ['显示桌面', 'desktop']],
    前往: [['应用程序', 'finder'], ['文稿', 'finder'], ['下载', 'finder']],
    窗口: [['最小化', 'minimize'], ['缩放', 'zoom'], ['前置全部窗口', 'front']],
    帮助: [['macOS 27 模拟器帮助', 'toast'], ['Liquid Glass 设计说明', 'safari']],
  };
  root.querySelectorAll('[data-menu-label]').forEach((button) => button.addEventListener('click', (event) => {
    event.stopPropagation(); const label = button.dataset.menuLabel; closeOverlays(root, 'app-menu');
    appMenu.innerHTML = (menuItems[label] || []).map(([text, action]) => `<button data-menu-action="${action}">${text}</button>`).join('');
    const rect = button.getBoundingClientRect(); appMenu.style.left = `${Math.max(6, rect.left - 8)}px`; appMenu.style.top = '34px'; setOverlay(root, 'app-menu', true);
    appMenu.querySelectorAll('[data-menu-action]').forEach((item) => item.addEventListener('click', () => {
      const action = item.dataset.menuAction; const active = root.querySelector('[data-macos-window].is-front:not(.is-hidden)');
      if (apps[action]) openWindow(root, action); else if (action === 'launchpad') root.classList.add('show-launchpad'); else if (action === 'spotlight') root.querySelector('[data-macos-spotlight-open]')?.click(); else if (action === 'close' && active) closeWindow(root, active); else if (action === 'minimize' && active) minimizeWindow(root, active); else if (action === 'zoom' && active) toggleZoom(active); else if (action === 'desktop') root.classList.toggle('show-desktop'); else showToast(root, `${label} · ${item.textContent}`); setOverlay(root, 'app-menu', false);
    }));
  }));
}

export function bindMacos27Simulator(root = document.querySelector('[data-macos27-sim]')) {
  if (!root || root.dataset.macosBound === '1') return;
  root.dataset.macosBound = '1';
  // macOS 27 treats the toolbar as part of the floating control layer. Promote
  // non-terminal title/toolbar strips to the shared live glass engine here so
  // the HTML stays readable and newly-added windows inherit the same material.
  root.querySelectorAll('.macos27-window-toolbar:not(.macos27-terminal-toolbar)').forEach((toolbar) => {
    toolbar.classList.add('liquid-glass');
    toolbar.dataset.glassPreset = 'macos-toolbar';
    toolbar.dataset.glassLive = 'true';
    toolbar.dataset.glassKeepActive = 'true';
    activateLiquidGlassElement(toolbar);
  });
  bindLiquidButtons(root); bindLiquidToggles(root); bindLiquidSliders(root);
  root.querySelectorAll('[data-macos-window]').forEach((windowEl) => bindWindowDrag(root, windowEl));
  bindAppLaunchers(root); bindFinder(root); bindSafari(root); bindNotes(root); bindTerminal(root); bindSettings(root); bindSpotlight(root); bindMenuBar(root);

  const setPopover = (name, open) => setOverlay(root, name, open);
  root.querySelector('[data-macos-cc-toggle]')?.addEventListener('click', (event) => { event.stopPropagation(); closeOverlays(root, 'control-center'); const panel = root.querySelector('[data-macos-control-center]'); setPopover('control-center', !panel?.classList.contains('is-open')); });
  root.querySelector('[data-macos-system-menu]')?.addEventListener('click', (event) => { event.stopPropagation(); closeOverlays(root, 'system-popover'); const panel = root.querySelector('[data-macos-system-popover]'); setPopover('system-popover', !panel?.classList.contains('is-open')); });
  root.querySelector('[data-macos-notifications-toggle]')?.addEventListener('click', (event) => { event.stopPropagation(); closeOverlays(root, 'notifications'); const panel = root.querySelector('[data-macos-notifications]'); setPopover('notifications', !panel?.classList.contains('is-open')); });

  root.addEventListener('click', (event) => {
    if (!event.target.closest('[data-macos-control-center],[data-macos-cc-toggle]')) setPopover('control-center', false);
    if (!event.target.closest('[data-macos-system-popover],[data-macos-system-menu]')) setPopover('system-popover', false);
    if (!event.target.closest('[data-macos-app-menu],[data-menu-label]')) setPopover('app-menu', false);
    if (!event.target.closest('[data-macos-notifications],[data-macos-notifications-toggle]')) setPopover('notifications', false);
    const toast = event.target.closest('[data-toast]'); if (toast) showToast(root, toast.dataset.toast);
  });

  root.querySelectorAll('[data-macos-open-settings]').forEach((button) => button.addEventListener('click', () => { closeOverlays(root); openWindow(root, 'settings'); }));
  root.querySelectorAll('[data-macos-exit]').forEach((button) => button.addEventListener('click', () => { location.hash = '#/settings'; }));
  root.querySelectorAll('[data-cc-tile]').forEach((tile) => tile.addEventListener('click', () => { tile.classList.toggle('is-active'); const small = tile.querySelector('small'); if (small && tile.dataset.ccTile === 'focus') small.textContent = tile.classList.contains('is-active') ? '勿扰模式' : '关闭'; }));

  const updateMacGlassLevel = (value) => {
    const t = Math.max(0, Math.min(1, Number(value ?? 52) / 100));
    root.style.setProperty('--macos27-glass-level', t.toFixed(3));
    const ranges = {
      'macos-menubar': [0.07, 0.34, 2.5, 10],
      'macos-toolbar': [0.09, 0.40, 2, 10],
      'macos-control': [0.05, 0.34, 0.8, 6],
      'macos-clear-control': [0.025, 0.20, 0.4, 3.5],
      'macos-dock': [0.07, 0.38, 3, 13],
      'macos-popover': [0.18, 0.66, 6, 18],
    };
    root.querySelectorAll('.liquid-glass[data-glass-preset^="macos-"]').forEach((element) => {
      const range = ranges[element.dataset.glassPreset];
      if (!range) return;
      const [a0, a1, b0, b1] = range;
      setLiquidGlassState(element, {
        surfaceAlpha: a0 + (a1 - a0) * t,
        blur: b0 + (b1 - b0) * t,
        intensity: 1.22 - t * 0.22,
      });
    });
  };
  root._updateMacGlassLevel = updateMacGlassLevel;
  updateMacGlassLevel(52);
  root.querySelectorAll('[data-macos-window].is-hidden').forEach((windowEl)=>setWindowGlassActive(windowEl,false));
  ['control-center','system-popover','app-menu','spotlight'].forEach((name)=>{
    const panel=root.querySelector(`[data-macos-${name}]`); if(panel && !panel.classList.contains('is-open'))suspendLiquidGlassElement(panel);
  });

  root.querySelector('[data-setting-slider="ccBrightness"]')?.addEventListener('liquidslider:input', (event) => root.style.setProperty('--macos27-brightness', (0.55 + Number(event.detail?.value ?? 72) / 100 * 0.6).toFixed(2)));
  root.querySelector('[data-setting-slider="ccVolume"]')?.addEventListener('liquidslider:input', (event) => root.style.setProperty('--macos27-volume', `${Number(event.detail?.value ?? 42)}%`));

  const launchSearch = root.querySelector('[data-launchpad-search]');
  launchSearch?.addEventListener('input', () => { const q = launchSearch.value.trim().toLowerCase(); root.querySelectorAll('.macos27-launchpad-grid [data-app-label]').forEach((item) => item.hidden = Boolean(q) && !item.dataset.appLabel.toLowerCase().includes(q)); });

  root.addEventListener('pointerdown', (event) => {
    if (event.target === root || event.target.classList.contains('macos27-wallpaper')) root.classList.remove('show-desktop');
  });

  const keyHandler = (event) => {
    if (!root.isConnected) { document.removeEventListener('keydown', keyHandler); return; }
    const mod = event.metaKey || event.ctrlKey;
    if (mod && event.code === 'Space') { event.preventDefault(); root.querySelector('[data-macos-spotlight-open]')?.click(); return; }
    if (event.key === 'Escape') { closeOverlays(root); return; }
    if (mod && event.key.toLowerCase() === 'w') { const active = root.querySelector('[data-macos-window].is-front:not(.is-hidden)'); if (active) { event.preventDefault(); closeWindow(root, active); } }
    if (mod && event.key.toLowerCase() === 'm') { const active = root.querySelector('[data-macos-window].is-front:not(.is-hidden)'); if (active) { event.preventDefault(); minimizeWindow(root, active); } return; }
    if (mod && event.key === 'Tab') {
      event.preventDefault();
      const windows=[...root.querySelectorAll('[data-macos-window]')].filter(el=>!el.classList.contains('is-hidden'));
      if(!windows.length)return;
      const active=windows.findIndex(el=>el.classList.contains('is-front'));
      bringToFront(root,windows[(active+1+windows.length)%windows.length]);
    }
  };
  document.addEventListener('keydown', keyHandler);

  const clock = root.querySelector('[data-macos-clock]');
  const updateClock = () => {
    if (!root.isConnected) return false;
    const now = new Date(); if (clock) clock.textContent = new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).format(now); return true;
  };
  updateClock(); const timer = setInterval(() => { if (!updateClock()) clearInterval(timer); }, 15000);

  updateDockRunning(root);
  requestAnimationFrame(() => root.classList.add('is-ready'));
}

import { liquidButton, bindLiquidButtons } from './liquid-button.js';
import { liquidToggle, bindLiquidToggles } from './liquid-toggle.js';
import { liquidSlider, bindLiquidSliders } from './liquid-slider.js';
import { SpringValue, queueCatalogRender } from '../animation/catalog-motion.js';
import { activateLiquidGlassElement, suspendLiquidGlassElement, setLiquidGlassState } from '../glass/liquid-glass.js';

const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, v));
const mix = (a, b, p) => a + (b - a) * p;

export function prefersIos27Simulator() {
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  return coarse || Math.min(window.innerWidth || 9999, window.innerHeight || 9999) <= 760;
}

function svg(body, size = 22, viewBox = '0 0 24 24') {
  return `<svg viewBox="${viewBox}" width="${size}" height="${size}" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

const icon = {
  wifi: (s=17) => svg('<path d="M4.5 9.6a11 11 0 0 1 15 0"/><path d="M7.6 12.6a6.6 6.6 0 0 1 8.8 0"/><path d="M10.5 15.5a2.5 2.5 0 0 1 3 0"/><circle cx="12" cy="18.4" r=".7" fill="currentColor" stroke="none"/>', s),
  battery: (s=20) => svg('<rect x="3" y="7" width="16" height="10" rx="2.4"/><path d="M21 10v4"/><path d="M5.3 9.3h10.6v5.4H5.3z" fill="currentColor" stroke="none"/>', s),
  signal: (s=18) => svg('<path d="M4 18v-2M8 18v-5M12 18V10M16 18V7M20 18V4"/>', s),
  search: (s=19) => svg('<circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/>', s),
  chevron: (s=18) => svg('<path d="m9 5 7 7-7 7"/>', s),
  back: (s=19) => svg('<path d="m15 5-7 7 7 7"/>', s),
  sliders: (s=20) => svg('<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2.2" fill="currentColor" stroke="none"/><circle cx="15" cy="17" r="2.2" fill="currentColor" stroke="none"/>', s),
  play: (s=20) => svg('<path d="m9 7 8 5-8 5Z" fill="currentColor" stroke="none"/>', s),
  pause: (s=20) => svg('<path d="M8 6h3v12H8zM14 6h3v12h-3z" fill="currentColor" stroke="none"/>', s),
  sun: (s=20) => svg('<circle cx="12" cy="12" r="3.5"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.5 1.5M17.2 17.2l1.5 1.5M18.7 5.3l-1.5 1.5M6.8 17.2l-1.5 1.5"/>', s),
  speaker: (s=20) => svg('<path d="M5 10v4h4l5 4V6l-5 4Z"/><path d="M17 9a4 4 0 0 1 0 6"/>', s),
  lock: (s=20) => svg('<rect x="6" y="10" width="12" height="10" rx="3"/><path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10"/>', s),
  camera: (s=22) => svg('<path d="M4 8.5h4l1.5-2h5l1.5 2h4v10H4z"/><circle cx="12" cy="13.5" r="3.2"/>', s),
  torch: (s=22) => svg('<path d="M8 3h8l-1.5 6h-5Z"/><path d="M10 9h4v10a2 2 0 0 1-4 0Z"/>', s),
  airplane: (s=20) => svg('<path d="m3 14 8-3V4l2-1 1 7 6-2 1 2-6 4 1 6-2 1-3-6-5 2Z"/>', s),
  bluetooth: (s=20) => svg('<path d="m12 3 5 5-10 8 5 5V3Zm0 0v18M7 8l10 8"/>', s),
};

const apps = [
  ['messages','信息'],['calendar','日历'],['photos','照片'],['camera','相机'],
  ['weather','天气'],['maps','地图'],['clock','时钟'],['notes','备忘录'],
  ['store','App Store'],['files','文件'],['settings','设置'],['music','音乐'],
];
const dockApps = [['phone','电话'],['safari','Safari'],['messages','信息'],['music','音乐']];

function appGlyph(kind, badge = '') {
  const label = {
    messages:'•••', calendar:'16', photos:'✣', camera:'◎', weather:'☼', maps:'⌁', clock:'◷', notes:'≡', store:'A', files:'▰', settings:'⚙', music:'♪', phone:'⌕', safari:'⌖'
  }[kind] || '·';
  return `<span class="ios27-icon ios27-icon--${kind}"><span>${label}</span>${badge ? `<b class="ios27-icon-badge">${badge}</b>` : ''}</span>`;
}

function appIcon(kind, label, { dock = false, badge = '' } = {}) {
  return `<button class="ios27-app-icon-button${dock ? ' is-dock' : ''}" type="button" data-ios-app-open="${kind}" data-ios-app-label="${label}" aria-label="打开${label}">${appGlyph(kind, badge)}${dock ? '' : `<small>${label}</small>`}</button>`;
}

function iosButton({label, className='', preset='ios-control', attrs=''}) {
  return liquidButton({ label, preset, className:`ios27-liquid-button ${className}`.trim(), live:true, inlineLive:true, attributes:attrs });
}

function statusBar() {
  return `<div class="ios27-statusbar" data-ios-statusbar>
    <strong data-ios-time>9:41</strong>
    <button class="ios27-dynamic-island" data-ios-island type="button" aria-label="实时活动"><span class="ios27-island-dot"></span><span class="ios27-island-wave"><i></i><i></i><i></i><i></i></span><span class="ios27-island-copy"><b>夜航星</b><small>Viudira Music</small></span><span class="ios27-island-play">${icon.pause(17)}</span></button>
    <div class="ios27-status-icons">${icon.signal()}${icon.wifi()}${icon.battery()}</div>
  </div>`;
}

function lockScreen() {
  return `<section class="ios27-lockscreen" data-ios-lockscreen aria-label="iOS 27 锁定屏幕">
    <div class="ios27-lock-top"><span>${icon.lock(17)}</span><div data-ios-lock-date>8月16日 星期日</div><strong data-ios-lock-time>9:41</strong></div>
    <div class="ios27-lock-widgets">
      <div class="ios27-lock-widget"><span>天津</span><b>28°</b><small>晴朗 · 最高 31°</small></div>
      <div class="ios27-lock-widget"><span>日程</span><b>今天</b><small>ViudiraTech · 20:00</small></div>
    </div>
    <div class="ios27-lock-notification ios27-material"><span>${appGlyph('messages')}</span><div><b>信息</b><small>Liquid Glass 已准备完成</small></div><time>现在</time></div>
    <div class="ios27-lock-actions">
      ${iosButton({label:icon.torch(),className:'ios27-lock-action',preset:'ios-clear-control',attrs:'aria-label="手电筒" data-ios-toast="手电筒"'})}
      ${iosButton({label:icon.camera(),className:'ios27-lock-action',preset:'ios-clear-control',attrs:'aria-label="相机" data-ios-app-open="camera"'})}
    </div>
    <div class="ios27-swipe-hint">向上轻扫以打开</div>
  </section>`;
}

function homeScreen() {
  const grid = apps.map(([k,l], i) => appIcon(k,l,{badge:k==='messages'?'3':''})).join('');
  const dock = dockApps.map(([k,l]) => appIcon(k,l,{dock:true,badge:k==='messages'?'3':''})).join('');
  return `<section class="ios27-home" data-ios-home aria-label="iOS 27 主屏幕">
    <div class="ios27-home-pages" data-ios-home-pages>
      <div class="ios27-home-page ios27-home-page--main">
        <div class="ios27-widget-stack">
          <article class="ios27-widget ios27-widget--weather"><small>天津</small><strong>28°</strong><span>晴朗</span><em>31° / 23°</em></article>
          <article class="ios27-widget ios27-widget--calendar"><small>8月</small><strong>16</strong><span>星期日</span><em>ViudiraTech · 20:00</em></article>
        </div>
        <div class="ios27-app-grid">${grid}</div>
      </div>
      <div class="ios27-home-page ios27-home-page--library">
        <div class="ios27-library-title"><b>App 资源库</b><span>${icon.search(17)} 搜索</span></div>
        <div class="ios27-library-groups">
          <article><b>建议</b><div>${appGlyph('safari')}${appGlyph('messages')}${appGlyph('photos')}${appGlyph('music')}</div></article>
          <article><b>效率</b><div>${appGlyph('files')}${appGlyph('notes')}${appGlyph('calendar')}${appGlyph('settings')}</div></article>
          <article><b>创意</b><div>${appGlyph('camera')}${appGlyph('photos')}${appGlyph('music')}${appGlyph('store')}</div></article>
          <article><b>工具</b><div>${appGlyph('clock')}${appGlyph('weather')}${appGlyph('maps')}${appGlyph('settings')}</div></article>
        </div>
      </div>
    </div>
    <button class="ios27-home-search liquid-glass ios27-glass-primary ios27-material" data-ios-spotlight-open data-glass-preset="ios-control" data-glass-live="true" data-glass-keep-active="true">${icon.search(16)}<span>搜索</span></button>
    <div class="ios27-page-dots"><i class="is-active"></i><i></i></div>
    <div class="ios27-dock liquid-glass ios27-glass-primary ios27-material" data-glass-preset="ios-dock" data-glass-live="true" data-glass-keep-active="true">${dock}</div>
  </section>`;
}

function appChrome(title, { back = false, trailing = '' } = {}) {
  return `<header class="ios27-app-nav"><div>${back ? `<button data-ios-app-back aria-label="返回">${icon.back()}</button>` : '<span></span>'}</div><b>${title}</b><div>${trailing}</div></header>`;
}

function settingsApp() {
  return `<article class="ios27-app ios27-app--settings" data-ios-app="settings" aria-label="设置">
    ${appChrome('设置')}
    <div class="ios27-app-scroll">
      <h1>设置</h1>
      <div class="ios27-settings-search">${icon.search(18)}<span>搜索</span></div>
      <section class="ios27-settings-profile"><span class="ios27-avatar">V</span><div><b>Viudira</b><small>Apple 账户、iCloud 与更多</small></div>${icon.chevron(15)}</section>
      <section class="ios27-settings-group">
        <button><span class="ios27-setting-glyph is-blue">⌁</span><b>Wi‑Fi</b><small>Viudira 5G</small>${icon.chevron(14)}</button>
        <button><span class="ios27-setting-glyph is-blue">ᛒ</span><b>蓝牙</b><small>打开</small>${icon.chevron(14)}</button>
        <button><span class="ios27-setting-glyph is-green">▰</span><b>蜂窝网络</b>${icon.chevron(14)}</button>
      </section>
      <section class="ios27-settings-group ios27-glass-settings">
        <div class="ios27-setting-row"><span class="ios27-setting-glyph is-violet">◌</span><div><b>Liquid Glass</b><small>iOS 27 外观</small></div></div>
        <div class="ios27-setting-slider"><label>超透明</label>${liquidSlider({value:58,ariaLabel:'Liquid Glass 外观',setting:'iosGlass'})}<label>着色</label></div>
        <div class="ios27-setting-row"><div><b>减少透明度</b><small>使用更不透明的标准材质</small></div>${liquidToggle({checked:false,ariaLabel:'减少透明度',setting:'iosReduceTransparency'})}</div>
        <div class="ios27-setting-row"><div><b>减少动态效果</b><small>降低界面位移和缩放</small></div>${liquidToggle({checked:false,ariaLabel:'减少动态效果',setting:'iosReduceMotion'})}</div>
      </section>
      <section class="ios27-settings-group"><button><span class="ios27-setting-glyph is-orange">☼</span><b>显示与亮度</b>${icon.chevron(14)}</button><button><span class="ios27-setting-glyph is-gray">⌂</span><b>主屏幕与 App 资源库</b>${icon.chevron(14)}</button><button><span class="ios27-setting-glyph is-red">◉</span><b>通知</b>${icon.chevron(14)}</button></section>
    </div>
  </article>`;
}

function safariApp() {
  return `<article class="ios27-app ios27-app--safari" data-ios-app="safari" aria-label="Safari">
    <div class="ios27-safari-page" data-ios-safari-page>
      <div class="ios27-safari-hero"><small>Safari</small><h1>起始页</h1><p>iOS 27 把搜索与常用操作放在更靠近拇指的位置。</p></div>
      <div class="ios27-safari-favorites"><button data-ios-toast="ViudiraTech"><span>V</span><b>ViudiraTech</b></button><button data-ios-toast="GitHub"><span>GH</span><b>GitHub</b></button><button data-ios-toast="开发文档"><span>⌘</span><b>开发文档</b></button><button data-ios-toast="Liquid Glass"><span>◌</span><b>Liquid Glass</b></button></div>
      <section class="ios27-safari-card"><small>隐私报告</small><b>Safari 已阻止 18 个跨站跟踪器</b><span>18</span></section>
      <section class="ios27-safari-card ios27-safari-reading"><small>阅读列表</small><b>Designing for Liquid Glass</b><p>让内容延伸到边缘，把导航和控件浮在最上层。</p></section>
    </div>
    <form class="ios27-safari-bottom ios27-material" data-ios-safari-form><button type="button">${icon.back(18)}</button><label>${icon.search(16)}<input data-ios-safari-input value="viudiratech.local" aria-label="Safari 地址"/></label><button type="button" data-ios-toast="标签页">▢</button></form>
  </article>`;
}

function messagesApp() {
  return `<article class="ios27-app ios27-app--messages" data-ios-app="messages" aria-label="信息">
    ${appChrome('信息', { trailing:'<button data-ios-toast="新信息">＋</button>' })}
    <div class="ios27-app-scroll"><h1>信息</h1><div class="ios27-settings-search">${icon.search(18)}<span>搜索</span></div>
      <div class="ios27-message-list">
        <button data-ios-thread="viudira"><span class="ios27-avatar is-blue">V</span><div><b>ViudiraTech</b><small>Liquid Glass 已准备完成</small></div><time>15:30</time></button>
        <button data-ios-thread="dev"><span class="ios27-avatar is-violet">D</span><div><b>开发讨论</b><small>iOS 27 动画已经接入。</small></div><time>14:52</time></button>
        <button><span class="ios27-avatar is-green">U</span><div><b>Uinxed</b><small>新的构建通过了。</small></div><time>昨天</time></button>
      </div>
    </div>
    <div class="ios27-thread" data-ios-thread-view aria-hidden="true"><header><button data-ios-thread-close>${icon.back()}</button><span class="ios27-avatar is-blue">V</span><b>ViudiraTech</b></header><div class="ios27-thread-body"><span class="is-in">iOS 27 手机端已经不是缩小版 macOS 了。</span><span class="is-out">这次动画能随时打断吗？</span><span class="is-in">可以，直接从当前手势进度接管。</span></div><form data-ios-message-form><input placeholder="iMessage"/><button>↑</button></form></div>
  </article>`;
}

function photosApp() {
  const tiles = Array.from({length:24},(_,i)=>`<button style="--h:${(i*37)%360};--p:${i%5}" data-ios-toast="照片 ${i+1}"></button>`).join('');
  return `<article class="ios27-app ios27-app--photos" data-ios-app="photos" aria-label="照片">${appChrome('照片')}<div class="ios27-app-scroll"><div class="ios27-photos-head"><h1>图库</h1><button>选择</button></div><div class="ios27-photo-grid">${tiles}</div></div><nav class="ios27-app-tabbar ios27-material"><button class="is-active">▦<small>图库</small></button><button>◇<small>精选</small></button><button>${icon.search(17)}<small>搜索</small></button></nav></article>`;
}

function musicApp() {
  return `<article class="ios27-app ios27-app--music" data-ios-app="music" aria-label="音乐">${appChrome('音乐')}<div class="ios27-app-scroll"><h1>主页</h1><div class="ios27-album-art"><i></i><i></i><i></i><span>Viudira</span></div><div class="ios27-now-title"><small>正在播放</small><b>夜航星</b><span>Viudira Mix</span></div><div class="ios27-music-progress"><i></i><span>1:48</span><span>-2:31</span></div><div class="ios27-music-controls"><button>↶</button><button data-ios-music-play>${icon.pause(28)}</button><button>↷</button></div><div class="ios27-music-volume">${icon.speaker(18)}${liquidSlider({value:46,ariaLabel:'音乐音量',setting:'iosMusicVolume'})}</div></div></article>`;
}

function notesApp() {
  return `<article class="ios27-app ios27-app--notes" data-ios-app="notes" aria-label="备忘录">${appChrome('备忘录',{trailing:'<button data-ios-toast="新备忘录">＋</button>'})}<div class="ios27-note-sheet"><small>8月16日 15:30</small><h1 contenteditable="true" data-ios-note-title>iOS 27 模拟器</h1><div contenteditable="true" data-ios-note-body>• 手机端直接进入 iOS 27\n• Liquid Glass 控件层\n• 手势动画可以随时打断\n• 设置会自动保存在浏览器里</div></div></article>`;
}

function filesApp() {
  return `<article class="ios27-app ios27-app--files" data-ios-app="files" aria-label="文件">${appChrome('文件')}<div class="ios27-app-scroll"><h1>浏览</h1><div class="ios27-files-locations"><button><span class="is-blue">☁</span><div><b>iCloud Drive</b><small>12 个项目</small></div>${icon.chevron(14)}</button><button><span class="is-blue">⌕</span><div><b>我的 iPhone</b><small>4 个项目</small></div>${icon.chevron(14)}</button><button><span class="is-orange">⇩</span><div><b>下载项</b><small>3 个项目</small></div>${icon.chevron(14)}</button></div><h2>最近使用</h2><div class="ios27-file-cards"><button><span>MD</span><b>README.md</b><small>今天</small></button><button><span>GO</span><b>agent.go</b><small>今天</small></button><button><span>ZIP</span><b>build.zip</b><small>昨天</small></button></div></div></article>`;
}

function weatherApp() {
  return `<article class="ios27-app ios27-app--weather" data-ios-app="weather" aria-label="天气">${appChrome('天气')}<div class="ios27-weather-scene"><small>天津市</small><strong>28°</strong><span>晴朗</span><em>最高 31°　最低 23°</em><div class="ios27-weather-hours"><i>现在<b>28°</b></i><i>16时<b>29°</b></i><i>17时<b>29°</b></i><i>18时<b>28°</b></i><i>19时<b>27°</b></i></div><section><b>10 日天气预报</b><p>今天　☀　23° ━━━━━ 31°</p><p>周一　☀　24° ━━━━━ 32°</p><p>周二　☁　24° ━━━━━ 30°</p></section></div></article>`;
}

function genericApp(kind, title) {
  let body = '';
  if (kind === 'camera') {
    body = `<div class="ios27-camera-view"><div class="ios27-camera-top"><span>⚡</span><b>照片</b><span>⌃</span></div><div class="ios27-camera-focus"></div><div class="ios27-camera-modes"><b>电影</b><b>视频</b><b class="is-active">照片</b><b>人像</b><b>全景</b></div><div class="ios27-camera-controls"><span class="ios27-camera-preview"></span><button data-ios-toast="已拍摄" aria-label="拍照"></button><span>↻</span></div></div>`;
  } else if (kind === 'calendar') {
    body = `<div class="ios27-app-scroll ios27-calendar-app"><div class="ios27-calendar-head"><div><small>2026年</small><h1>8月</h1></div><button data-ios-toast="今天">今天</button></div><div class="ios27-calendar-week"><b>日</b><b>一</b><b>二</b><b>三</b><b>四</b><b>五</b><b>六</b></div><div class="ios27-calendar-grid">${Array.from({length:35},(_,i)=>{const d=i-5;return `<button class="${d===16?'is-today':''}${d<1||d>31?' is-outside':''}">${d<1?31+d:d>31?d-31:d}${d===16?'<i></i>':''}</button>`}).join('')}</div><section class="ios27-calendar-agenda"><b>今天</b><article><i></i><div><strong>ViudiraTech</strong><small>20:00–21:00</small></div></article><article><i class="is-blue"></i><div><strong>整理项目计划</strong><small>全天</small></div></article></section></div>`;
  } else if (kind === 'maps') {
    body = `<div class="ios27-map-app"><div class="ios27-map-canvas"><i class="r1"></i><i class="r2"></i><i class="river"></i><span class="pin p1">V</span><span class="pin p2">●</span><b>天津</b><small>南开区</small></div><div class="ios27-map-sheet ios27-material"><label>${icon.search(17)}<input placeholder="搜索地图"/></label><div class="ios27-map-shortcuts"><button><span>⌂</span><b>家</b></button><button><span>★</span><b>收藏</b></button><button><span>＋</span><b>添加</b></button></div><p><strong>附近</strong><span>咖啡 · 公园 · 地铁</span></p></div></div>`;
  } else if (kind === 'clock') {
    body = `<div class="ios27-app-scroll ios27-clock-app"><h1>世界时钟</h1><div class="ios27-clock-card"><div><b>天津</b><small>今天，+0 小时</small></div><strong>19:32</strong></div><div class="ios27-clock-card"><div><b>东京</b><small>今天，+1 小时</small></div><strong>20:32</strong></div><h2>闹钟</h2><div class="ios27-alarm-card"><span><b>07:00</b><small>工作日</small></span>${liquidToggle({checked:true,ariaLabel:'07:00 闹钟',setting:'iosAlarm'})}</div><div class="ios27-alarm-card"><span><b>09:30</b><small>周末</small></span>${liquidToggle({checked:false,ariaLabel:'09:30 闹钟',setting:'iosAlarmWeekend'})}</div></div>`;
  } else if (kind === 'store') {
    body = `<div class="ios27-app-scroll ios27-store-app"><small>星期日 · 8月16日</small><h1>今天</h1><article class="ios27-store-feature"><div><small>编辑精选</small><b>为创造而生</b><p>发现适合开发、设计与创作的新 App。</p></div><span>A</span></article><h2>本周热门</h2><div class="ios27-store-list">${[['V','Viudira Tools','开发工具'],['N','Nova Notes','效率'],['P','Pixel Lab','图形与设计']].map(([g,n,c])=>`<button><span>${g}</span><div><b>${n}</b><small>${c}</small></div><em>获取</em></button>`).join('')}</div></div>`;
  } else if (kind === 'phone') {
    body = `<div class="ios27-app-scroll ios27-phone-app"><h1>最近通话</h1><div class="ios27-phone-filter"><button class="is-active">全部</button><button>未接来电</button></div><div class="ios27-phone-list">${[['Viudira Team','19:06','↗'],['同学','昨天','↙'],['家人','星期五','↗'],['GitHub Voice','星期四','↙']].map(([n,t,a])=>`<button><span>${a}</span><div><b>${n}</b><small>手机</small></div><time>${t}</time><i>ⓘ</i></button>`).join('')}</div></div>`;
  } else {
    body = `<div class="ios27-generic-content">${appGlyph(kind)}<h1>${title}</h1><p>${title} 已接入 iOS 27 模拟器的系统导航与交互层。</p></div>`;
  }
  return `<article class="ios27-app ios27-app--${kind}" data-ios-app="${kind}" aria-label="${title}">${appChrome(title)}${body}</article>`;
}

function appStage() {
  return `<div class="ios27-app-stage" data-ios-app-stage aria-hidden="true">${settingsApp()}${safariApp()}${messagesApp()}${photosApp()}${musicApp()}${notesApp()}${filesApp()}${weatherApp()}${genericApp('camera','相机')}${genericApp('calendar','日历')}${genericApp('maps','地图')}${genericApp('clock','时钟')}${genericApp('store','App Store')}${genericApp('phone','电话')}</div>`;
}

function controlCenter() {
  return `<aside class="ios27-overlay ios27-control-center" data-ios-control-center aria-hidden="true">
    <div class="ios27-cc-head"><b>控制中心</b><button data-ios-cc-close>完成</button></div>
    <div class="ios27-cc-grid">
      <section class="ios27-cc-connectivity ios27-material"><button class="is-active" data-ios-cc-tile="airplane">${icon.airplane()}<span>飞行模式</span></button><button class="is-active" data-ios-cc-tile="wifi">${icon.wifi(20)}<span>Wi‑Fi</span></button><button class="is-active" data-ios-cc-tile="bluetooth">${icon.bluetooth()}<span>蓝牙</span></button><button data-ios-cc-tile="cell">▰<span>蜂窝网络</span></button></section>
      <section class="ios27-cc-nowplaying ios27-material"><span class="ios27-cc-art">V</span><div><b>夜航星</b><small>Viudira Mix</small></div><button data-ios-music-play>${icon.pause()}</button></section>
      <section class="ios27-cc-slider ios27-material"><span>${icon.sun()}</span>${liquidSlider({value:72,ariaLabel:'亮度',setting:'iosBrightness'})}</section>
      <section class="ios27-cc-slider ios27-material"><span>${icon.speaker()}</span>${liquidSlider({value:44,ariaLabel:'音量',setting:'iosVolume'})}</section>
      <button class="ios27-cc-small ios27-material" data-ios-cc-tile="focus"><b>◐</b><span>专注模式</span></button>
      <button class="ios27-cc-small ios27-material" data-ios-cc-tile="rotation"><b>↻</b><span>方向锁定</span></button>
      <button class="ios27-cc-small ios27-material" data-ios-toast="屏幕镜像"><b>▣</b><span>屏幕镜像</span></button>
      <button class="ios27-cc-small ios27-material" data-ios-toast="相机"><b>◎</b><span>相机</span></button>
    </div>
  </aside>`;
}

function notificationCenter() {
  return `<aside class="ios27-overlay ios27-notification-center" data-ios-notifications aria-hidden="true"><header><small>8月16日</small><strong>星期日</strong></header><div class="ios27-notification-stack"><article class="ios27-material"><span>${appGlyph('messages')}</span><div><b>信息</b><p>iOS 27 手机端模拟已经启用。</p></div><time>现在</time></article><article class="ios27-material"><span>${appGlyph('calendar')}</span><div><b>日历</b><p>20:00 · ViudiraTech</p></div><time>1小时前</time></article></div></aside>`;
}

function spotlight() {
  return `<aside class="ios27-spotlight" data-ios-spotlight aria-hidden="true"><div class="ios27-spotlight-search liquid-glass ios27-glass-primary ios27-material" data-glass-preset="ios-popover" data-glass-live="true" data-glass-keep-active="true">${icon.search(20)}<input data-ios-spotlight-input placeholder="搜索 App 和内容"/><button data-ios-spotlight-close>取消</button></div><div class="ios27-spotlight-results" data-ios-spotlight-results></div></aside>`;
}

export function ios27Simulator() {
  return `<section class="ios27-sim" data-ios27-sim data-ios-state="locked" aria-label="iOS 27 模拟器">
    <div class="ios27-wallpaper" aria-hidden="true"><i></i><i></i><i></i></div>
    <div class="ios27-scene-dim" data-ios-scene-dim></div>
    ${statusBar()}${homeScreen()}${lockScreen()}${appStage()}${controlCenter()}${notificationCenter()}${spotlight()}
    <div class="ios27-top-gesture ios27-top-gesture--left" data-ios-notification-gesture></div><div class="ios27-top-gesture ios27-top-gesture--right" data-ios-cc-gesture></div>
    <div class="ios27-home-gesture" data-ios-home-gesture><span></span></div>
    <div class="ios27-toast ios27-material" data-ios-toast-box aria-live="polite"></div>
    <button class="ios27-exit" type="button" data-ios-exit aria-label="退出 iOS 27 模拟器">退出模拟器</button>
  </section>`;
}

function makeSpring(initial, render, options={ dampingRatio:.82, stiffness:420, threshold:.001 }) {
  const spring = new SpringValue(initial, render);
  return {
    spring,
    get value(){ return spring.value; },
    get velocity(){ return spring.velocity; },
    snap(v){ spring.snap(clamp(v)); },
    interrupt(){ spring.interrupt({ preserveVelocity: true }); },
    direct(v, velocity=0){ spring.direct(clamp(v), velocity); },
    to(v, opts={}){ spring.to(clamp(v), {...options,...opts}); },
  };
}

function bindDirectGesture(zone, { onStart, onMove, onEnd }) {
  if (!zone) return () => {};
  let active = false, id = null;
  let sx=0, sy=0, lx=0, ly=0, lastT=0, velocityY=0, velocityX=0;
  let pendingMove=null, moveRaf=0;
  const flushMove=()=>{ moveRaf=0; if(!pendingMove)return; const payload=pendingMove; pendingMove=null; onMove?.(payload); };
  const queueMove=(payload)=>{ pendingMove=payload; if(!moveRaf)moveRaf=requestAnimationFrame(flushMove); };
  const onDown=(e)=>{
    if(e.pointerType==='mouse'&&e.button!==0)return;
    active=true; id=e.pointerId; sx=lx=e.clientX; sy=ly=e.clientY; lastT=performance.now(); velocityX=velocityY=0; pendingMove=null;
    zone.setPointerCapture?.(id); onStart?.(e);
  };
  const onPointerMove=(e)=>{
    if(!active||e.pointerId!==id)return;
    const now=performance.now(),dt=Math.max(now-lastT,1);
    const vx=(e.clientX-lx)/dt,vy=(e.clientY-ly)/dt;
    velocityX=velocityX*.62+vx*.38; velocityY=velocityY*.62+vy*.38;
    lx=e.clientX;ly=e.clientY;lastT=now;
    queueMove({event:e,dx:e.clientX-sx,dy:e.clientY-sy,velocityX,velocityY});
  };
  const finish=(e,cancel=false)=>{
    if(!active||(e.pointerId!=null&&e.pointerId!==id))return;
    active=false; if(moveRaf)cancelAnimationFrame(moveRaf); moveRaf=0; flushMove();
    onEnd?.({event:e,dx:lx-sx,dy:ly-sy,velocityX,velocityY,cancel}); id=null;
  };
  const onUp=e=>finish(e,false),onCancel=e=>finish(e,true);
  zone.addEventListener('pointerdown',onDown); zone.addEventListener('pointermove',onPointerMove); zone.addEventListener('pointerup',onUp); zone.addEventListener('pointercancel',onCancel);
  return ()=>{ if(moveRaf)cancelAnimationFrame(moveRaf); zone.removeEventListener('pointerdown',onDown); zone.removeEventListener('pointermove',onPointerMove); zone.removeEventListener('pointerup',onUp); zone.removeEventListener('pointercancel',onCancel); };
}

function showToast(root, text) {
  const box=root.querySelector('[data-ios-toast-box]'); if(!box) return; box.textContent=text; box.classList.add('is-visible'); clearTimeout(root._iosToastTimer); root._iosToastTimer=setTimeout(()=>box.classList.remove('is-visible'),1300);
}

function searchResults(root, query='') {
  const q=query.trim().toLowerCase();
  const matches=[...apps,...dockApps].filter(([k,l])=>!q || `${k} ${l}`.toLowerCase().includes(q)).slice(0,8);
  return matches.map(([k,l])=>`<button data-ios-app-open="${k}">${appGlyph(k)}<span><b>${l}</b><small>App</small></span>${icon.chevron(14)}</button>`).join('') || '<p>没有找到结果</p>';
}

export function bindIos27Simulator(root=document.querySelector('[data-ios27-sim]')) {
  if(!root || root.dataset.iosBound==='1') return;
  root.dataset.iosBound='1';
  root.querySelectorAll('.ios27-glass-primary[data-glass-preset^="ios-"]').forEach((el)=>{const r=el.getBoundingClientRect();if(r.width>.5&&r.height>.5)activateLiquidGlassElement(el);});
  bindLiquidButtons(root); bindLiquidToggles(root); bindLiquidSliders(root);

  const status=root.querySelector('[data-ios-statusbar]');
  const home=root.querySelector('[data-ios-home]');
  const lock=root.querySelector('[data-ios-lockscreen]');
  const stage=root.querySelector('[data-ios-app-stage]');
  const cc=root.querySelector('[data-ios-control-center]');
  const notifications=root.querySelector('[data-ios-notifications]');
  const spotlight=root.querySelector('[data-ios-spotlight]');
  const dim=root.querySelector('[data-ios-scene-dim]');
  const homePages=root.querySelector('[data-ios-home-pages]');
  const pageDots=[...root.querySelectorAll('.ios27-page-dots i')];
  let unlocked=false, activeApp='', sourceRect=null, page=0;
  let simWidth=Math.max(root.clientWidth,1), simHeight=Math.max(root.clientHeight,1), simLeft=0, simTop=0;
  const updateSimMetrics=()=>{const r=root.getBoundingClientRect();simWidth=Math.max(r.width,1);simHeight=Math.max(r.height,1);simLeft=r.left;simTop=r.top;};
  updateSimMetrics();
  const simResizeObserver=new ResizeObserver(updateSimMetrics); simResizeObserver.observe(root);
  const homePrimaryGlass=[...root.querySelectorAll('.ios27-home .ios27-glass-primary')];
  let homePrimaryActive=true;
  const setHomePrimaryActive=(active)=>{
    if(homePrimaryActive===active)return; homePrimaryActive=active;
    homePrimaryGlass.forEach(active?activateLiquidGlassElement:suspendLiquidGlassElement);
  };

  const renderUnlock=(p)=>{
    root.style.setProperty('--ios-unlock',p.toFixed(4));
    lock.style.transform=`translate3d(0,${(-22*p).toFixed(2)}%,0) scale(${mix(1,.985,p).toFixed(4)})`;
    lock.style.opacity=(1-p).toFixed(4); home.style.opacity=p.toFixed(4); home.style.transform=`scale(${mix(.94,1,p).toFixed(4)})`;
    if(p>.995){ lock.style.pointerEvents='none'; unlocked=true; root.dataset.iosState='home'; } else if(p<.005){ lock.style.pointerEvents='auto'; unlocked=false; root.dataset.iosState='locked'; }
  };
  const unlock=makeSpring(0,renderUnlock,{dampingRatio:.88,stiffness:360});

  const renderApp=(p)=>{
    const src=sourceRect||{left:simWidth/2-28,top:simHeight-95,width:56,height:56};
    const cx=src.left+src.width/2-simLeft,cy=src.top+src.height/2-simTop;
    const dx=cx-simWidth/2,dy=cy-simHeight/2;
    const s0=Math.max(.075,Math.min(src.width/simWidth,src.height/simHeight)*1.15),scale=mix(s0,1,p);
    stage.style.transform=`translate3d(${(dx*(1-p)).toFixed(2)}px,${(dy*(1-p)).toFixed(2)}px,0) scale(${scale.toFixed(5)})`;
    stage.style.opacity=clamp(p*1.35).toFixed(4); stage.style.pointerEvents=p>.97?'auto':'none'; stage.classList.toggle('is-open',p>.985);
    home.style.transform=`translate3d(0,0,0) scale(${mix(1,.925,p).toFixed(4)})`; home.style.opacity=mix(1,.52,p).toFixed(4);
    status.classList.toggle('is-app',p>.55);
    if(p>.08)setHomePrimaryActive(false); else if(p<.02)setHomePrimaryActive(true);
    if(p<.005){stage.setAttribute('aria-hidden','true');stage.style.pointerEvents='none';activeApp='';root.dataset.iosState='home';}
    else{stage.removeAttribute('aria-hidden');root.dataset.iosState='app';}
  };
  const appMotion=makeSpring(0,renderApp,{dampingRatio:.86,stiffness:430});

  const renderCC=(p)=>{ root.style.setProperty('--ios-cc',p.toFixed(4)); cc.style.transform=`translate3d(0,${(-104*(1-p)).toFixed(3)}%,0)`; cc.style.opacity=clamp(p*1.6).toFixed(4); cc.style.pointerEvents=p>.04?'auto':'none'; cc.setAttribute('aria-hidden',String(p<.02)); dim.style.opacity=(.34*p).toFixed(3); };
  const ccMotion=makeSpring(0,renderCC,{dampingRatio:.9,stiffness:430});
  const renderNC=(p)=>{ notifications.style.transform=`translate3d(0,${(-103*(1-p)).toFixed(3)}%,0)`; notifications.style.opacity=clamp(p*1.6).toFixed(4); notifications.style.pointerEvents=p>.04?'auto':'none'; notifications.setAttribute('aria-hidden',String(p<.02)); dim.style.opacity=(Math.max(ccMotion.value,p)*.34).toFixed(3); };
  const ncMotion=makeSpring(0,renderNC,{dampingRatio:.9,stiffness:430});
  const renderSpot=(p)=>{ spotlight.style.opacity=p.toFixed(4); spotlight.style.transform=`translate3d(0,${mix(28,0,p).toFixed(2)}px,0) scale(${mix(.97,1,p).toFixed(4)})`; spotlight.style.pointerEvents=p>.04?'auto':'none'; spotlight.setAttribute('aria-hidden',String(p<.02)); dim.style.opacity=(Math.max(ccMotion.value,ncMotion.value,p*.75)*.34).toFixed(3); };
  const spotMotion=makeSpring(0,renderSpot,{dampingRatio:.92,stiffness:460});
  const renderPage=(p)=>{page=clamp(p);homePages.style.transform=`translate3d(${(-50*page).toFixed(3)}%,0,0)`;pageDots.forEach((dot,i)=>dot.classList.toggle('is-active',i===Math.round(page)));};
  const pageMotion=makeSpring(0,renderPage,{dampingRatio:.9,stiffness:420});

  const closeOverlays=()=>{ccMotion.to(0);ncMotion.to(0);spotMotion.to(0);};
  const openApp=(kind, trigger)=>{
    if(!unlocked){ unlock.snap(1); }
    closeOverlays();
    const app=root.querySelector(`[data-ios-app="${kind}"]`); if(!app){showToast(root,`${kind} · 演示`);return;}
    root.querySelectorAll('[data-ios-app]').forEach(el=>el.classList.toggle('is-active',el===app));
    updateSimMetrics(); sourceRect=trigger?.getBoundingClientRect?.() || sourceRect; activeApp=kind;
    appMotion.interrupt(); appMotion.to(1);
  };

  root.addEventListener('click',(e)=>{
    const opener=e.target.closest('[data-ios-app-open]'); if(opener){ e.preventDefault(); openApp(opener.dataset.iosAppOpen,opener); return; }
    const toast=e.target.closest('[data-ios-toast]'); if(toast) showToast(root,toast.dataset.iosToast);
  });

  // Lock screen: direct manipulation. New pointer input snaps the spring at its
  // current value, so an in-flight settle animation is immediately interruptible.
  let homeGestureStart = 0;
  bindDirectGesture(root.querySelector('[data-ios-home-gesture]'),{
    onStart(){
      if(!unlocked){homeGestureStart=unlock.value;unlock.interrupt();}
      else if(activeApp){homeGestureStart=appMotion.value;appMotion.interrupt();}
    },
    onMove({dy,velocityY}){
      const h=simHeight;
      if(!unlocked)unlock.direct(homeGestureStart+(-dy/h)*.92,(-velocityY*1000/h)*.92);
      else if(activeApp)appMotion.direct(homeGestureStart+(dy/h)*1.22,(velocityY*1000/h)*1.22);
    },
    onEnd({dy,velocityY,cancel}){
      if(!unlocked){ const target=!cancel && (unlock.value>.38 || dy<-80 || velocityY<-.45) ? 1:0; unlock.to(target); return; }
      if(activeApp){ const goHome=!cancel && (appMotion.value<.72 || dy<-92 || velocityY<-.55); appMotion.to(goHome?0:1); }
    }
  });

  let ccGestureStart=0, ncGestureStart=0;
  bindDirectGesture(root.querySelector('[data-ios-cc-gesture]'),{
    onStart(){ccGestureStart=ccMotion.value;ccMotion.interrupt(); ncMotion.to(0); spotMotion.to(0); },
    onMove({dy,velocityY}){const d=Math.max(simHeight*.55,1);ccMotion.direct(ccGestureStart+dy/d,velocityY*1000/d);},
    onEnd({dy,velocityY,cancel}){ ccMotion.to(!cancel && (ccMotion.value>.4 || dy>75 || velocityY>.5)?1:0); }
  });
  bindDirectGesture(root.querySelector('[data-ios-notification-gesture]'),{
    onStart(){ncGestureStart=ncMotion.value;ncMotion.interrupt(); ccMotion.to(0); spotMotion.to(0); },
    onMove({dy,velocityY}){const d=Math.max(simHeight*.58,1);ncMotion.direct(ncGestureStart+dy/d,velocityY*1000/d);},
    onEnd({dy,velocityY,cancel}){ ncMotion.to(!cancel && (ncMotion.value>.4 || dy>75 || velocityY>.5)?1:0); }
  });
  // Panels themselves can be pushed back before their spring finishes opening.
  let ccPanelStart=0,ncPanelStart=0;
  bindDirectGesture(cc,{onStart(){ccPanelStart=ccMotion.value;ccMotion.interrupt();},onMove({dy,velocityY}){const d=Math.max(simHeight*.5,1);ccMotion.direct(ccPanelStart+dy/d,velocityY*1000/d);},onEnd({dy,velocityY}){ccMotion.to(ccMotion.value>.58 && !(dy<-55||velocityY<-.45)?1:0);}});
  bindDirectGesture(notifications,{onStart(){ncPanelStart=ncMotion.value;ncMotion.interrupt();},onMove({dy,velocityY}){const d=Math.max(simHeight*.5,1);ncMotion.direct(ncPanelStart+dy/d,velocityY*1000/d);},onEnd({dy,velocityY}){ncMotion.to(ncMotion.value>.58 && !(dy<-55||velocityY<-.45)?1:0);}});

  // Horizontal Home/App Library paging: fully interruptible spring + direct drag.
  let pageStart=0;
  bindDirectGesture(home,{
    onStart(e){ if(activeApp || e.target.closest('button,input,[data-liquid-slider]')) return; pageStart=pageMotion.value;pageMotion.interrupt(); home.dataset.pageGesture='1'; },
    onMove({dx,dy,velocityX}){if(home.dataset.pageGesture!=='1'||Math.abs(dy)>Math.abs(dx)*1.3)return;const d=Math.max(simWidth*.72,1);pageMotion.direct(pageStart-dx/d,-velocityX*1000/d);},
    onEnd({dx,velocityX}){ if(home.dataset.pageGesture!=='1')return; delete home.dataset.pageGesture; const next=(pageMotion.value>.5||dx<-80||velocityX<-.5)?1:0; pageMotion.to(next); }
  });

  root.querySelector('[data-ios-cc-close]')?.addEventListener('click',()=>ccMotion.to(0));
  root.querySelector('[data-ios-spotlight-open]')?.addEventListener('click',()=>{closeOverlays();const search=root.querySelector('.ios27-spotlight-search');activateLiquidGlassElement(search);spotMotion.interrupt();spotMotion.to(1);const input=root.querySelector('[data-ios-spotlight-input]');const results=root.querySelector('[data-ios-spotlight-results]');results.innerHTML=searchResults(root,'');setTimeout(()=>input?.focus(),120);});
  root.querySelector('[data-ios-spotlight-close]')?.addEventListener('click',()=>spotMotion.to(0));
  const spotInput=root.querySelector('[data-ios-spotlight-input]'); spotInput?.addEventListener('input',()=>root.querySelector('[data-ios-spotlight-results]').innerHTML=searchResults(root,spotInput.value));
  root.querySelector('[data-ios-spotlight-results]')?.addEventListener('click',(e)=>{const b=e.target.closest('[data-ios-app-open]');if(b)openApp(b.dataset.iosAppOpen,b);});
  dim.addEventListener('click',closeOverlays);

  const island=root.querySelector('[data-ios-island]');
  const renderIsland=(p)=>{island.style.setProperty('--island-open',p.toFixed(4));island.classList.toggle('is-expanded',p>.5);};
  const islandMotion=makeSpring(0,renderIsland,{dampingRatio:.72,stiffness:390}); island.addEventListener('click',()=>{islandMotion.interrupt();islandMotion.to(islandMotion.value>.45?0:1);});

  root.querySelectorAll('[data-ios-cc-tile]').forEach(tile=>tile.addEventListener('click',()=>tile.classList.toggle('is-active')));
  let playing=true; root.querySelectorAll('[data-ios-music-play]').forEach(btn=>btn.addEventListener('click',()=>{playing=!playing;root.querySelectorAll('[data-ios-music-play]').forEach(x=>x.innerHTML=playing?icon.pause(20):icon.play(20));}));

  root.querySelectorAll('[data-ios-thread]').forEach(btn=>btn.addEventListener('click',()=>{const view=root.querySelector('[data-ios-thread-view]');view.classList.add('is-open');view.setAttribute('aria-hidden','false');}));
  root.querySelector('[data-ios-thread-close]')?.addEventListener('click',()=>{const view=root.querySelector('[data-ios-thread-view]');view.classList.remove('is-open');view.setAttribute('aria-hidden','true');});
  root.querySelector('[data-ios-message-form]')?.addEventListener('submit',(e)=>{e.preventDefault();const input=e.currentTarget.querySelector('input');if(!input.value.trim())return;const body=root.querySelector('.ios27-thread-body');const bubble=document.createElement('span');bubble.className='is-out';bubble.textContent=input.value.trim();body.append(bubble);input.value='';body.scrollTop=body.scrollHeight;});

  const noteTitle=root.querySelector('[data-ios-note-title]'), noteBody=root.querySelector('[data-ios-note-body]');
  try{noteTitle.textContent=localStorage.getItem('viudira-ios27-note-title')||noteTitle.textContent;noteBody.textContent=localStorage.getItem('viudira-ios27-note-body')||noteBody.textContent;}catch{}
  const saveNote=()=>{try{localStorage.setItem('viudira-ios27-note-title',noteTitle.textContent);localStorage.setItem('viudira-ios27-note-body',noteBody.textContent);}catch{}}; noteTitle?.addEventListener('input',saveNote);noteBody?.addEventListener('input',saveNote);

  root.querySelector('[data-ios-safari-form]')?.addEventListener('submit',(e)=>{e.preventDefault();const input=root.querySelector('[data-ios-safari-input]');showToast(root,`打开 ${input.value || '起始页'}`);input.blur();});
  root.querySelector('[data-ios-exit]')?.addEventListener('click',()=>{location.hash='#/settings';});

  const glassSlider=root.querySelector('[data-setting-slider="iosGlass"]'); glassSlider?.addEventListener('liquidslider:input',(e)=>{
    const t=Number(e.detail?.value??58)/100; root.style.setProperty('--ios-glass-level',t.toFixed(3));
    root.style.setProperty('--ios-material-alpha',mix(.11,.38,t).toFixed(3));
    root.style.setProperty('--ios-material-blur',`${mix(8,17,t).toFixed(1)}px`);
    root.querySelectorAll('.ios27-glass-primary').forEach(el=>setLiquidGlassState(el,{surfaceAlpha:mix(.10,.34,t),blur:mix(4,10,t),intensity:mix(1.12,.96,t),highlightAlpha:1}));
  });
  root.querySelector('[data-setting-toggle="iosReduceTransparency"]')?.addEventListener('liquidtoggle:change',(e)=>root.classList.toggle('reduce-transparency',Boolean(e.detail?.checked)));
  root.querySelector('[data-setting-toggle="iosReduceMotion"]')?.addEventListener('liquidtoggle:change',(e)=>root.classList.toggle('reduce-motion',Boolean(e.detail?.checked)));
  root.querySelector('[data-setting-slider="iosBrightness"]')?.addEventListener('liquidslider:input',(e)=>root.style.setProperty('--ios-brightness',(0.55+Number(e.detail?.value??72)/100*.65).toFixed(3)));

  const updateClock=()=>{if(!root.isConnected)return false;const now=new Date();const time=now.toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false});root.querySelectorAll('[data-ios-time],[data-ios-lock-time]').forEach(el=>el.textContent=time);root.querySelector('[data-ios-lock-date]')?.replaceChildren(document.createTextNode(new Intl.DateTimeFormat('zh-CN',{month:'long',day:'numeric',weekday:'long'}).format(now)));return true;};
  updateClock(); const timer=setInterval(()=>{if(!updateClock()){clearInterval(timer);simResizeObserver.disconnect();}},15000);

  renderUnlock(0); renderApp(0); renderCC(0); renderNC(0); renderSpot(0); renderPage(0); renderIsland(0);
  requestAnimationFrame(()=>root.classList.add('is-ready'));
}

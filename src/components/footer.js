import { routeHref } from '../router/routes.js';
import { ORG } from '../data/organization.js';

const columns = [
  ['社区', [['projects', '项目'], ['about', '关于我们'], ['community', '参与方式'], ['activity', '动态']]],
  ['实验室', [['glass-ui', 'Liquid UI Lab'], ['glass-test', '折射测试'], ['settings', '玻璃设置']]],
];

export function footer() {
  const cols = columns.map(([title, items]) => `<div class="footer-col">
      <h2>${title}</h2>
      ${items.map(([id, label]) => `<a href="${routeHref(id)}" data-spa-route="${id}">${label}</a>`).join('')}
    </div>`).join('');
  return `<footer class="footer">
    <div class="container footer-inner">
      <div class="footer-about">
        <span class="footer-brand"><img src="./assets/logo-mark.svg" alt="" width="24" height="24" />ViudiraTech</span>
        <p class="footer-copy">${ORG.mottoZh}</p>
      </div>
      <nav class="footer-links" aria-label="页脚导航">
        ${cols}
        <div class="footer-col">
          <h2>外部链接</h2>
          <a href="${ORG.github}" target="_blank" rel="noreferrer">GitHub</a>
          <a href="https://github.com/ViudiraTech/Uinxed-Kernel" target="_blank" rel="noreferrer">Uinxed-Kernel</a>
        </div>
      </nav>
    </div>
    <div class="container footer-bottom">
      <span>© ViudiraTech · 项目代码遵循各自仓库的开源许可证</span>
      <span>数据来自 GitHub 公开 API</span>
    </div>
  </footer>`;
}

import { icons } from '../utils/icons.js';
import { escapeHtml } from '../utils/html.js';

const positions = [
  [17, 22], [77, 20], [86, 54], [72, 82], [25, 81], [10, 53], [50, 10], [50, 90],
];

function networkNodes(repos = []) {
  const items = repos.slice(0, positions.length);
  const lines = items.map((_, i) => {
    const [x, y] = positions[i];
    return `<line class="network-line" x1="50%" y1="50%" x2="${x}%" y2="${y}%" />`;
  }).join('');
  const nodes = items.map((repo, i) => {
    const [x, y] = positions[i];
    return `<a class="network-node" href="${repo.url}" target="_blank" rel="noreferrer" style="left:${x}%;top:${y}%" aria-label="${escapeHtml(repo.name)} GitHub 仓库">
      <strong>${escapeHtml(repo.name)}</strong><small>${escapeHtml(repo.category)}${repo.language ? ` · ${escapeHtml(repo.language)}` : ''}</small>
    </a>`;
  }).join('');
  return `<svg aria-hidden="true">${lines}</svg>${nodes}`;
}

export function hero(repos = [], state = 'loading') {
  const stars = repos.reduce((sum, repo) => sum + repo.stars, 0);
  const forks = repos.reduce((sum, repo) => sum + repo.forks, 0);
  const languages = new Set(repos.map((repo) => repo.language).filter(Boolean)).size;
  const statusText = state === 'ready' ? 'GitHub 数据已同步' : state === 'stale' ? '使用缓存数据' : '正在读取 GitHub';

  return `
    <section class="hero" id="top">
      <div class="container hero-grid">
        <div class="hero-copy-block reveal">
          <span class="hero-kicker">Open Source Engineering Community</span>
          <h1>Viudira<br/>Tech</h1>
          <p class="hero-lead">一个由开发者共同构建的开放技术社区。</p>
          <p class="hero-copy">我们关注操作系统、内核、系统软件、开发者工具与实验性技术。这里的内容直接来自公开仓库与真实开发活动，而不是一组用来装饰首页的假数字。</p>
          <div class="button-row">
            <a class="button button--primary" href="#/projects">查看项目 ${icons.arrow(16)}</a>
            <a class="button button--secondary" href="https://github.com/ViudiraTech" target="_blank" rel="noreferrer">${icons.github(17)} 探索 GitHub</a>
          </div>
          <div class="hero-domains" aria-label="关注领域">
            ${['Operating Systems','Kernels','System Software','Developer Tools','Open Source'].map((x) => `<span class="hero-domain">${x}</span>`).join('')}
          </div>
        </div>
        <div class="network reveal" aria-label="ViudiraTech 项目网络">
          <div class="network-grid"></div>
          ${networkNodes(repos)}
          <div class="network-center"><strong>ViudiraTech</strong><small>project network</small></div>
          <div class="network-status">${statusText}</div>
        </div>
      </div>
    </section>
    <div class="container stats-strip reveal" aria-label="GitHub 公开仓库统计">
      <div class="stat"><strong>${state === 'loading' ? '—' : repos.length}</strong><span>公开仓库</span></div>
      <div class="stat"><strong>${state === 'loading' ? '—' : stars}</strong><span>GitHub Stars 合计</span></div>
      <div class="stat"><strong>${state === 'loading' ? '—' : forks}</strong><span>Forks 合计</span></div>
      <div class="stat"><strong>${state === 'loading' ? '—' : languages}</strong><span>主要语言种类</span></div>
    </div>`;
}

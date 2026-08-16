import { icons } from '../utils/icons.js';
import { escapeHtml } from '../utils/html.js';
import { liquidButton } from './liquid-button.js';

function networkProjects(repos = [], state = 'loading') {
  if (!repos.length) {
    const label = state === 'loading' ? '正在读取公开仓库…' : '暂无可展示的公开仓库';
    return `<div class="network-empty">${label}</div>`;
  }

  return repos.slice(0, 6).map((repo) => `
    <a class="network-project" href="${repo.url}" target="_blank" rel="noreferrer" aria-label="${escapeHtml(repo.name)} GitHub 仓库">
      <span class="network-project__dot" aria-hidden="true"></span>
      <span class="network-project__body">
        <strong>${escapeHtml(repo.name)}</strong>
        <small>${escapeHtml(repo.category)}${repo.language ? ` · ${escapeHtml(repo.language)}` : ''}</small>
      </span>
      <span class="network-project__arrow" aria-hidden="true">↗</span>
    </a>`).join('');
}

export function hero(repos = [], state = 'loading') {
  const stars = repos.reduce((sum, repo) => sum + repo.stars, 0);
  const forks = repos.reduce((sum, repo) => sum + repo.forks, 0);
  const languages = new Set(repos.map((repo) => repo.language).filter(Boolean)).size;
  const statusText = state === 'ready' ? 'GitHub 数据已同步' : state === 'stale' ? '使用缓存数据' : '正在读取 GitHub';
  const domains = [
    ['操作系统', 'Operating Systems'],
    ['内核', 'Kernels'],
    ['系统软件', 'System Software'],
    ['开发工具', 'Developer Tools'],
    ['开源协作', 'Open Source'],
  ];

  return `
    <section class="hero" id="top">
      <div class="container hero-grid">
        <div class="hero-copy-block reveal">
          <span class="hero-kicker">开源工程社区 · Open Source Engineering</span>
          <h1>Viudira<br/>Tech</h1>
          <p class="hero-lead">由开发者共同构建的开放技术社区。</p>
          <p class="hero-copy">关注操作系统、内核、系统软件与开发工具。项目状态和开发动态直接来自公开仓库与 GitHub 活动，便于持续了解社区正在推进的工作。</p>
          <div class="button-row">
            ${liquidButton({ label: `查看项目 ${icons.arrow(16)}`, preset: 'catalog-button-blue', className: 'catalog-button--tinted site-liquid-action', backdrop: 'ambient', href: '#/projects', attributes: 'data-glass-settings-scope="site"' })}
            ${liquidButton({ label: `${icons.github(17)} GitHub`, preset: 'catalog-button-surface', className: 'site-liquid-action', backdrop: 'ambient', href: 'https://github.com/ViudiraTech', target: '_blank', rel: 'noreferrer', attributes: 'data-glass-settings-scope="site"' })}
          </div>
          <div class="hero-domains" aria-label="关注领域">
            ${domains.map(([label, english]) => `<span class="hero-domain"><strong>${label}</strong><small>${english}</small></span>`).join('')}
          </div>
        </div>
        <section class="network reveal" aria-label="ViudiraTech 项目网络">
          <div class="network-grid" aria-hidden="true"></div>
          <header class="network-head">
            <div>
              <span class="network-overline">PUBLIC PROJECTS</span>
              <h2>ViudiraTech Network</h2>
              <p>公开项目与主要技术方向</p>
            </div>
            <span class="network-status">${statusText}</span>
          </header>
          <div class="network-projects">
            ${networkProjects(repos, state)}
          </div>
          <footer class="network-foot">
            <span>${state === 'loading' ? '—' : repos.length} 个公开仓库</span>
            <span>${state === 'loading' ? '—' : languages} 种主要语言</span>
          </footer>
        </section>
      </div>
    </section>
    <div class="container stats-strip reveal" aria-label="GitHub 公开仓库统计">
      <div class="stat"><strong>${state === 'loading' ? '—' : repos.length}</strong><span>公开仓库</span></div>
      <div class="stat"><strong>${state === 'loading' ? '—' : stars}</strong><span>GitHub Stars 合计</span></div>
      <div class="stat"><strong>${state === 'loading' ? '—' : forks}</strong><span>Forks 合计</span></div>
      <div class="stat"><strong>${state === 'loading' ? '—' : languages}</strong><span>主要语言种类</span></div>
    </div>`;
}

import { icons } from '../utils/icons.js';
import { formatDate } from '../github/repositories.js';
import { escapeHtml } from '../utils/html.js';
import { liquidButton } from './liquid-button.js';

function meta(label, value) {
  if (value === null || value === undefined || value === '') return '';
  return `<div class="drawer-meta"><span>${label}</span><strong>${escapeHtml(value)}</strong></div>`;
}

export function drawerShell() {
  return `<div class="drawer-backdrop" data-drawer-backdrop></div>
    <aside class="project-drawer" aria-hidden="true" aria-label="项目详情" data-drawer>
      <div class="project-drawer__surface">
        ${liquidButton({ label: icons.close(19), preset: 'catalog-button-surface', className: 'catalog-icon-button drawer-close-floating', live: true, attributes: 'aria-label="关闭项目详情" data-drawer-close data-glass-settings-scope="site"' })}
        <div class="project-drawer__content" data-drawer-content>
          <div class="loading-state">选择一个项目查看详细信息。</div>
        </div>
      </div>
    </aside>`;
}

function stripMarkdown(markdown = '') {
  return markdown
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[>*_~|-]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function readmeExcerpt(text) {
  const clean = stripMarkdown(text);
  if (!clean) return 'README 暂无可显示的文本摘要。';
  const excerpt = clean.length > 1200 ? `${clean.slice(0, 1200).trim()}…` : clean;
  return escapeHtml(excerpt);
}

function languageView(languages = {}) {
  const entries = Object.entries(languages).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, bytes]) => sum + bytes, 0) || 1;
  if (!entries.length) return '<p class="muted">GitHub 未返回语言统计。</p>';
  return `<div class="language-bars">${entries.slice(0, 7).map(([name, bytes]) => {
    const pct = (bytes / total) * 100;
    return `<div class="language-row"><span>${escapeHtml(name)}</span><div class="language-track"><span style="width:${pct.toFixed(1)}%"></span></div><span class="language-pct">${pct.toFixed(1)}%</span></div>`;
  }).join('')}</div>`;
}

export function renderDrawer(repo, { readme = '', languages = {}, loading = false } = {}) {
  return `
    <section class="drawer-summary drawer-summary--plain">
      <div class="drawer-summary__content">
        <div class="drawer-head"><span class="eyebrow">${escapeHtml(repo.category)} / GitHub</span></div>
        <h2 class="drawer-title">${escapeHtml(repo.name)}</h2>
        <p class="drawer-desc">${escapeHtml(repo.description)}</p>
        <div class="drawer-meta-grid">
          ${meta('Language', repo.language || '—')}${meta('Stars', repo.stars)}${meta('Forks', repo.forks)}${meta('License', repo.license || '未标注')}${meta('Updated', formatDate(repo.updatedAt))}${meta('Default branch', repo.defaultBranch)}
        </div>
      </div>
    </section>
    <section class="drawer-section drawer-section-card"><h4>Topics</h4><div class="project-card__topics">${repo.topics.length ? repo.topics.map((x) => `<span class="topic">${escapeHtml(x)}</span>`).join('') : '<span class="muted">未设置公开 topics</span>'}</div></section>
    <section class="drawer-section drawer-section-card"><h4>Languages</h4>${loading ? '<p class="muted">正在读取语言统计…</p>' : languageView(languages)}</section>
    <section class="drawer-section drawer-section-card"><h4>README 摘要</h4><div class="readme-summary">${loading ? '正在读取 README…' : readmeExcerpt(readme)}</div></section>
    <div class="button-row drawer-actions">
      ${liquidButton({ label: `${icons.github(17)} 查看 GitHub`, preset: 'catalog-button-blue', className: 'catalog-button--tinted site-liquid-action', backdrop: 'ambient', sampleMode: 'dynamic', href: repo.url, target: '_blank', rel: 'noreferrer', attributes: 'data-glass-settings-scope="site"' })}
      ${repo.homepage ? liquidButton({ label: `${icons.external(16)} 项目主页`, preset: 'catalog-button-surface', className: 'site-liquid-action', backdrop: 'ambient', sampleMode: 'dynamic', href: repo.homepage, target: '_blank', rel: 'noreferrer', attributes: 'data-glass-settings-scope="site"' }) : ''}
    </div>`;
}

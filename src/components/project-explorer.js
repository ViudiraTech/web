import { CATEGORIES, CATEGORY_LABELS } from '../github/repositories.js';
import { isSiteLiquidEnabled } from '../glass/site-preferences.js';
import { projectCard } from './project-card.js';
import { liquidBottomTabs } from './liquid-bottom-tabs.js';
import { siteAction } from './site-action.js';
import { icons } from '../utils/icons.js';

const PROJECT_CATEGORY_MOBILE_LABELS = {
  All: '全部',
  Kernel: '内核',
  Language: '语言',
  System: '固件',
  Tool: '工具',
  Web: 'Web',
  Experimental: '实验',
};

function countFor(repos, category) {
  return category === 'All' ? repos.length : repos.filter((repo) => repo.category === category).length;
}

function filterControl(repos, active) {
  if (isSiteLiquidEnabled()) {
    return liquidBottomTabs({
      items: CATEGORIES.map((category) => ({ id: category, label: CATEGORY_LABELS[category] || category, mobileLabel: PROJECT_CATEGORY_MOBILE_LABELS[category] || category })),
      selected: active,
      className: 'project-filter-tabs',
      mode: 'filter',
      ariaLabel: '项目分类筛选',
      live: true,
      indicatorSurfaceRgb: '0 0 0',
      indicatorIdleAlpha: 0.10,
      indicatorPressedAlpha: 0.03,
      indicatorSurfaceFloorRatio: 0.60,
    });
  }
  return `<div class="filter-chips" role="group" aria-label="项目分类筛选">
    ${CATEGORIES.map((category) => {
      const count = countFor(repos, category);
      if (category !== 'All' && repos.length && !count) return '';
      return `<button class="filter-chip" type="button" data-project-filter="${category}" aria-pressed="${category === active}">${CATEGORY_LABELS[category] || category}${repos.length ? `<span>${count}</span>` : ''}</button>`;
    }).join('')}
  </div>`;
}

export function projectExplorer(repos = [], { state = 'loading', active = 'All' } = {}) {
  const filtered = active === 'All' ? repos : repos.filter((repo) => repo.category === active);
  let content = filtered.map(projectCard).join('');
  if (state === 'loading') content = '<div class="loading-state">正在读取 ViudiraTech GitHub 仓库…<div class="loading-bar"></div></div>';
  else if (state === 'error') content = `<div class="empty-state"><p>GitHub API 暂时不可用。你仍可以直接前往 ViudiraTech GitHub 查看最新项目。</p>${siteAction({ label: `${icons.github(15)} 打开 GitHub`, href: 'https://github.com/ViudiraTech', variant: 'primary', compact: true, external: true, className: 'empty-state__action' })}</div>`;
  else if (!filtered.length) content = '<div class="empty-state">这个分类下暂时没有公开仓库。</div>';

  return `
    <section class="section section--tight" id="projects">
      <div class="container">
        <div class="project-toolbar reveal" data-glass-settings-scope="site">
          ${filterControl(repos, active)}
        </div>
        <div class="project-grid" data-project-grid>${content}</div>
      </div>
    </section>`;
}

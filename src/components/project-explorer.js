import { CATEGORIES } from '../github/repositories.js';
import { projectCard } from './project-card.js';
import { liquidBottomTabs } from './liquid-bottom-tabs.js';

const PROJECT_CATEGORY_MOBILE_LABELS = {
  All: '全部',
  'Operating System': 'OS',
  Kernel: 'Kernel',
  System: 'System',
  Tool: 'Tool',
  Web: 'Web',
  Experimental: '探索',
};

export function projectExplorer(repos = [], { state = 'loading', active = 'All' } = {}) {
  const filtered = active === 'All' ? repos : repos.filter((repo) => repo.category === active);
  let content = filtered.map(projectCard).join('');
  if (state === 'loading') content = '<div class="loading-state">正在读取 ViudiraTech GitHub 仓库…<div class="loading-bar"></div></div>';
  else if (state === 'error') content = '<div class="empty-state">GitHub API 暂时不可用。你仍可以直接前往 ViudiraTech GitHub 查看最新项目。</div>';
  else if (!filtered.length) content = '<div class="empty-state">当前分类没有可由公开元数据可靠归入的仓库。</div>';

  return `
    <section class="section" id="projects">
      <div class="container">
        <header class="section-head reveal">
          <div><span class="eyebrow">Projects / Repository Explorer</span><h2 class="section-title">以代码仓库为核心，<br/>组织项目与技术信息。</h2></div>
          <p class="section-copy">项目名称、描述、Stars、Forks、语言、Topics、License 与更新时间均从 GitHub API 读取。分类仅依据公开的 topics、description 与 language 做前端推断。</p>
        </header>
        <div class="project-toolbar reveal" data-glass-settings-scope="site">
          ${liquidBottomTabs({
            items: CATEGORIES.map((category) => ({ id: category, label: category, mobileLabel: PROJECT_CATEGORY_MOBILE_LABELS[category] || category })),
            selected: active,
            className: 'project-filter-tabs',
            mode: 'filter',
            ariaLabel: '项目分类筛选',
            live: true,
            indicatorSurfaceRgb: '0 0 0',
            indicatorIdleAlpha: 0.10,
            indicatorPressedAlpha: 0.03,
            indicatorSurfaceFloorRatio: 0.60,
          })}
          <span class="project-toolbar__note">分类 = 公开元数据推断</span>
        </div>
        <div class="project-grid" data-project-grid>${content}</div>
      </div>
    </section>`;
}

import { projectCard } from './project-card.js';
import { icons } from '../utils/icons.js';
import { liquidButton } from './liquid-button.js';

export function homeProjects(repos = [], state = 'loading') {
  let content = '';
  if (state === 'loading') content = '<div class="loading-state">正在读取 GitHub 仓库…<div class="loading-bar"></div></div>';
  else if (state === 'error') content = `<div class="empty-state"><p>GitHub API 暂时不可用，请稍后重试或直接前往 GitHub 查看项目。</p>${liquidButton({ label: `${icons.github(15)} 打开 GitHub`, preset: 'catalog-button-blue', className: 'catalog-button--tinted site-liquid-action site-liquid-action--compact empty-state__action', backdrop: 'ambient', href: 'https://github.com/ViudiraTech', target: '_blank', rel: 'noreferrer', attributes: 'data-glass-settings-scope="site"' })}</div>`;
  else content = repos.slice(0, 3).map(projectCard).join('');

  return `<section class="section section--home"><div class="container">
    <header class="section-head reveal">
      <div><span class="eyebrow">Selected Projects</span><h2 class="section-title">从正在演进的代码开始。</h2></div>
      <div class="section-action"><p class="section-copy">这里只取少量公开仓库做入口；完整筛选、元数据与 README 详情放在独立项目页。</p>${liquidButton({ label: `全部项目 ${icons.arrow(15)}`, preset: 'catalog-button-surface', className: 'site-liquid-action site-liquid-action--compact', backdrop: 'ambient', href: '#/projects', attributes: 'data-glass-settings-scope="site"' })}</div>
    </header>
    <div class="project-grid project-grid--preview" data-home-project-grid>${content}</div>
  </div></section>`;
}

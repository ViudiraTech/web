import { projectCard } from './project-card.js';
import { icons } from '../utils/icons.js';

export function homeProjects(repos = [], state = 'loading') {
  let content = '';
  if (state === 'loading') content = '<div class="loading-state">正在读取 GitHub 仓库…<div class="loading-bar"></div></div>';
  else if (state === 'error') content = '<div class="empty-state">GitHub API 暂时不可用。首页不会填充假项目。</div>';
  else content = repos.slice(0, 3).map(projectCard).join('');

  return `<section class="section section--home"><div class="container">
    <header class="section-head reveal">
      <div><span class="eyebrow">Selected Projects</span><h2 class="section-title">先看正在写的代码。</h2></div>
      <div class="section-action"><p class="section-copy">这里只取少量公开仓库做入口；完整筛选、元数据与 README 详情放在独立项目页。</p><a class="text-link" href="#/projects">全部项目 ${icons.arrow(15)}</a></div>
    </header>
    <div class="project-grid project-grid--preview" data-home-project-grid>${content}</div>
  </div></section>`;
}

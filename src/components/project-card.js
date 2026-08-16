import { icons } from '../utils/icons.js';
import { formatRelative } from '../github/repositories.js';
import { escapeHtml } from '../utils/html.js';

export function projectCard(repo) {
  const topics = repo.topics.slice(0, 4).map((topic) => `<span class="topic">${escapeHtml(topic)}</span>`).join('');
  return `<article class="project-card reveal" tabindex="0" role="button" aria-label="查看 ${escapeHtml(repo.name)} 详情" data-repo="${repo.fullName}">
    <div class="project-card__top">
      <div>
        <div class="project-card__category">${escapeHtml(repo.category)}</div>
        <h3>${escapeHtml(repo.name)}</h3>
      </div>
      ${repo.archived ? '<span class="project-state">Archived</span>' : ''}
    </div>
    <p class="project-card__desc">${escapeHtml(repo.description)}</p>
    <div class="project-card__topics">${topics || '<span class="topic">无公开 topics</span>'}</div>
    <div class="project-card__meta">
      ${repo.language ? `<span class="meta-item">${icons.code(14)} ${escapeHtml(repo.language)}</span>` : ''}
      <span class="meta-item">${icons.star(14)} ${repo.stars}</span>
      <span class="meta-item">${icons.fork(14)} ${repo.forks}</span>
      <span class="meta-item">${icons.clock(14)} ${formatRelative(repo.updatedAt)}</span>
    </div>
    <span class="project-card__arrow">${icons.arrow(18)}</span>
  </article>`;
}

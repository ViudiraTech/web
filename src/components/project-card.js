import { icons } from '../utils/icons.js';
import { formatRelative, CATEGORY_LABELS } from '../github/repositories.js';
import { escapeHtml } from '../utils/html.js';
import { FEATURED_PROJECTS } from '../data/organization.js';

export function projectCard(repo) {
  const curated = FEATURED_PROJECTS.find((project) => project.name === repo.name);
  const title = curated?.title || repo.name;
  const description = curated?.tagline ? `${curated.tagline}。${curated.copy}` : repo.description;
  const topics = repo.topics.slice(0, 4).map((topic) => `<span class="chip">${escapeHtml(topic)}</span>`).join('');
  return `<article class="project-card reveal" tabindex="0" role="button" aria-label="查看 ${escapeHtml(title)} 详情" data-repo="${escapeHtml(repo.fullName)}">
    <div class="project-card__top">
      <span class="project-card__category">${escapeHtml(CATEGORY_LABELS[repo.category] || repo.category)}</span>
      ${repo.archived ? '<span class="project-state">已归档</span>' : ''}
    </div>
    <h3>${escapeHtml(title)}</h3>
    <p class="project-card__desc">${escapeHtml(description)}</p>
    ${topics ? `<div class="chip-row">${topics}</div>` : ''}
    <div class="project-card__meta">
      ${repo.language ? `<span class="meta-item">${icons.code(14)} ${escapeHtml(repo.language)}</span>` : ''}
      <span class="meta-item">${icons.star(14)} ${repo.stars}</span>
      <span class="meta-item">${icons.fork(14)} ${repo.forks}</span>
      <span class="meta-item">${icons.clock(14)} ${formatRelative(repo.pushedAt || repo.updatedAt)}</span>
    </div>
  </article>`;
}

import { icons } from '../utils/icons.js';
import { escapeHtml } from '../utils/html.js';
import { formatRelative } from '../github/repositories.js';
import { FOCUS_AREAS, FEATURED_PROJECTS, MEMBERS } from '../data/organization.js';
import { siteAction } from './site-action.js';

export function repoByName(repos = [], name) {
  return repos.find((repo) => repo.name === name) || null;
}

export function displayName(name) {
  return FEATURED_PROJECTS.find((project) => project.name === name)?.title || name;
}

export function sectionHeading({ eyebrow, title, copy = '', action = '' }) {
  return `<header class="section-heading reveal">
    <div>
      ${eyebrow ? `<p class="kicker">${eyebrow}</p>` : ''}
      <h2>${title}</h2>
      ${copy ? `<p class="section-heading__copy">${copy}</p>` : ''}
    </div>
    ${action ? `<div class="section-heading__action">${action}</div>` : ''}
  </header>`;
}

function stat(value, label, state) {
  return `<div class="stat"><strong>${state === 'loading' ? '—' : value}</strong><span>${label}</span></div>`;
}

export function orgStats(repos = [], state = 'loading') {
  const stars = repos.reduce((sum, repo) => sum + repo.stars, 0);
  const languages = new Set(repos.map((repo) => repo.language).filter(Boolean)).size;
  const live = state === 'error' ? 'loading' : state;
  return `<div class="stats reveal" aria-label="GitHub 公开数据">
    ${stat(repos.length, '公开仓库', live)}
    ${stat(stars, 'GitHub Stars', live)}
    ${stat(languages, '主要语言', live)}
    ${stat(MEMBERS.length, '核心成员', 'ready')}
  </div>`;
}

export function homeAbout(repos, state) {
  return `<section class="section section--tight">
    <div class="container about-strip">
      <div class="about-strip__copy reveal">
        <p class="kicker">关于我们</p>
        <h2>一群想弄懂计算机每一层的学生。</h2>
        <p>ViudiraTech 是由学生发起的独立社区。我们写内核、做语言、读硬件手册，把每一次实验的代码和过程都放在 GitHub 上。项目都标注了真实的完成度——有些已经能启动完整的 Linux 用户态，有些还停留在引导阶段。</p>
        <a class="inline-link" href="#/about">我们的故事与成员 ${icons.arrow(15)}</a>
      </div>
      ${orgStats(repos, state)}
    </div>
  </section>`;
}

function repoChips(names = []) {
  return `<div class="chip-row">${names.map((name) => `<span class="chip">${escapeHtml(displayName(name))}</span>`).join('')}</div>`;
}

export function focusSection() {
  return `<section class="section">
    <div class="container">
      ${sectionHeading({ eyebrow: '我们在做什么', title: '从固件到应用，沿着系统栈向上。' })}
      <div class="focus-grid">
        ${FOCUS_AREAS.map((area, index) => `<article class="focus-card reveal">
          <span class="focus-card__index">0${index + 1}</span>
          <h3>${area.title}</h3>
          <p>${area.copy}</p>
          ${repoChips(area.repos)}
        </article>`).join('')}
      </div>
    </div>
  </section>`;
}

function liveMeta(repo, project) {
  const language = repo?.language || project.language;
  const parts = [];
  if (language) parts.push(`<span class="meta-item">${icons.code(14)} ${escapeHtml(language)}</span>`);
  if (repo) parts.push(`<span class="meta-item">${icons.star(14)} ${repo.stars}</span>`);
  if (repo?.pushedAt || repo?.updatedAt) parts.push(`<span class="meta-item">${icons.clock(14)} ${formatRelative(repo.pushedAt || repo.updatedAt)}</span>`);
  return `<div class="feature-card__meta">${parts.join('')}</div>`;
}

function featureCard(project, repos) {
  const repo = repoByName(repos, project.name);
  const fullName = `ViudiraTech/${project.name}`;
  const url = repo?.url || `https://github.com/${fullName}`;
  const highlights = project.highlights
    ? `<ul class="feature-card__list">${project.highlights.map((item) => `<li>${item}</li>`).join('')}</ul>`
    : '';
  return `<a class="feature-card${project.flagship ? ' feature-card--flagship' : ''} reveal" href="${url}" target="_blank" rel="noreferrer" data-repo="${fullName}">
    <div class="feature-card__head">
      <span class="feature-card__tagline">${project.flagship ? '旗舰项目 · ' : ''}${project.tagline}</span>
      <span class="feature-card__arrow" aria-hidden="true">${icons.arrowUpRight(18)}</span>
    </div>
    <h3>${project.title}</h3>
    <p>${project.copy}</p>
    ${highlights}
    ${liveMeta(repo, project)}
  </a>`;
}

export function featuredSection(repos = []) {
  const [flagship, ...rest] = FEATURED_PROJECTS;
  return `<section class="section">
    <div class="container">
      ${sectionHeading({
        eyebrow: '代表项目',
        title: '正在演进的代码。',
        action: siteAction({ label: `全部项目 ${icons.arrow(15)}`, href: '#/projects', compact: true }),
      })}
      <div class="feature-layout">
        ${featureCard(flagship, repos)}
        <div class="feature-grid">${rest.slice(0, 4).map((project) => featureCard(project, repos)).join('')}</div>
      </div>
    </div>
  </section>`;
}

import { icons } from '../utils/icons.js';
import { formatRelative } from '../github/repositories.js';
import { escapeHtml } from '../utils/html.js';

function eventText(event) {
  const repo = event.repo?.name?.replace('ViudiraTech/', '') || 'ViudiraTech';
  const payload = event.payload || {};
  if (event.type === 'PushEvent') {
    const count = payload.size ?? payload.commits?.length ?? 0;
    const msg = payload.commits?.[0]?.message;
    return { title: `${repo} · Push`, message: msg ? `${count} 个提交 · ${msg}` : `${count} 个提交` };
  }
  if (event.type === 'ReleaseEvent') return { title: `${repo} · Release`, message: payload.release?.name || payload.release?.tag_name || '发布了新版本' };
  if (event.type === 'PullRequestEvent') return { title: `${repo} · Pull Request`, message: `${payload.action || 'updated'} · ${payload.pull_request?.title || ''}`.trim() };
  if (event.type === 'IssuesEvent') return { title: `${repo} · Issue`, message: `${payload.action || 'updated'} · ${payload.issue?.title || ''}`.trim() };
  if (event.type === 'CreateEvent') return { title: `${repo} · Create`, message: `创建 ${payload.ref_type || '资源'}${payload.ref ? ` ${payload.ref}` : ''}` };
  return { title: `${repo} · ${event.type?.replace('Event','') || 'Activity'}`, message: 'GitHub 公开活动' };
}

function eventUrl(event) {
  const repoUrl = event.repo?.name ? `https://github.com/${event.repo.name}` : 'https://github.com/ViudiraTech';
  const payload = event.payload || {};
  return payload.pull_request?.html_url || payload.issue?.html_url || payload.release?.html_url || repoUrl;
}

export function activitySection(events = [], state = 'loading', options = {}) {
  const limit = options.limit || 10;
  const title = options.title || '最近发生了什么。';
  const copy = options.copy || '时间线基于 GitHub Public Events 展示公开开发活动；当 API 暂时不可用时，会提供 GitHub 入口以便继续查看。';
  const useful = events.filter((event) => ['PushEvent','ReleaseEvent','PullRequestEvent','IssuesEvent','CreateEvent'].includes(event.type)).slice(0, limit);
  let list = '';
  if (state === 'loading') list = '<div class="loading-state">正在读取 GitHub Public Events…<div class="loading-bar"></div></div>';
  else if (!useful.length) list = `<div class="empty-state">暂未取得可展示的公开 Activity。你可以前往 GitHub 查看最新提交、发布与协作动态。<br/><a class="activity-link" href="https://github.com/ViudiraTech" target="_blank" rel="noreferrer">前往 GitHub 查看最新开发动态 ${icons.arrow(14)}</a></div>`;
  else list = useful.map((event) => {
    const text = eventText(event);
    return `<article class="activity-item reveal"><span class="activity-dot"></span><div class="activity-time">${formatRelative(event.created_at)}</div><h3>${escapeHtml(text.title)}</h3><p class="activity-message">${escapeHtml(text.message)}</p><a class="activity-link" href="${eventUrl(event)}" target="_blank" rel="noreferrer">在 GitHub 查看 ${icons.external(13)}</a></article>`;
  }).join('');

  return `<section class="section ${options.compact ? 'section--home' : ''}" id="activity"><div class="container activity-layout">
    <div class="activity-intro reveal"><span class="eyebrow">Activity / Public Events</span><h2 class="section-title">${title}</h2><p class="section-copy" style="margin-top:18px">${copy}</p>${options.compact ? `<a class="text-link" href="#/activity">完整动态 ${icons.arrow(15)}</a>` : ''}</div>
    <div class="activity-list" data-activity-list>${list}</div>
  </div></section>`;
}

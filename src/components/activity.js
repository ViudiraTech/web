import { icons } from '../utils/icons.js';
import { formatRelative } from '../github/repositories.js';
import { escapeHtml } from '../utils/html.js';
import { siteAction } from './site-action.js';
import { sectionHeading } from './home-sections.js';

const ACTIONS = { opened: '打开', closed: '关闭', reopened: '重新打开', merged: '合并', published: '发布', created: '创建', edited: '编辑' };
const action = (value) => ACTIONS[value] || value || '更新';

function eventText(event) {
  const repo = event.repo?.name?.replace('ViudiraTech/', '') || 'ViudiraTech';
  const payload = event.payload || {};
  if (event.type === 'PushEvent') {
    const count = payload.size ?? payload.commits?.length ?? 0;
    const msg = payload.commits?.[0]?.message;
    return { kind: 'Push', title: repo, message: msg ? `${count} 个提交 · ${msg.split('\n')[0]}` : `${count} 个提交` };
  }
  if (event.type === 'ReleaseEvent') return { kind: 'Release', title: repo, message: payload.release?.name || payload.release?.tag_name || '发布了新版本' };
  if (event.type === 'PullRequestEvent') return { kind: 'PR', title: repo, message: `${action(payload.action)} · ${payload.pull_request?.title || ''}`.trim() };
  if (event.type === 'IssuesEvent') return { kind: 'Issue', title: repo, message: `${action(payload.action)} · ${payload.issue?.title || ''}`.trim() };
  if (event.type === 'CreateEvent') return { kind: 'Create', title: repo, message: `创建 ${payload.ref_type || '资源'}${payload.ref ? ` ${payload.ref}` : ''}` };
  return { kind: event.type?.replace('Event', '') || 'Event', title: repo, message: 'GitHub 公开活动' };
}

function eventUrl(event) {
  const repoUrl = event.repo?.name ? `https://github.com/${event.repo.name}` : 'https://github.com/ViudiraTech';
  const payload = event.payload || {};
  return payload.pull_request?.html_url || payload.issue?.html_url || payload.release?.html_url || repoUrl;
}

export function activitySection(events = [], state = 'loading', options = {}) {
  const limit = options.limit || 10;
  const title = options.title || '最近发生了什么。';
  const copy = options.copy || '';
  const useful = events.filter((event) => ['PushEvent','ReleaseEvent','PullRequestEvent','IssuesEvent','CreateEvent'].includes(event.type)).slice(0, limit);
  let list = '';
  if (state === 'loading') list = '<div class="loading-state">正在读取 GitHub Public Events…<div class="loading-bar"></div></div>';
  else if (!useful.length) list = `<div class="empty-state"><p>暂未取得可展示的公开 Activity。你可以前往 GitHub 查看最新提交、发布与协作动态。</p>${siteAction({ label: `前往 GitHub ${icons.arrow(14)}`, href: 'https://github.com/ViudiraTech', variant: 'primary', compact: true, external: true, className: 'empty-state__action' })}</div>`;
  else list = useful.map((event) => {
    const text = eventText(event);
    return `<a class="activity-item reveal" href="${escapeHtml(eventUrl(event))}" target="_blank" rel="noreferrer">
      <span class="activity-item__type">${escapeHtml(text.kind)}</span>
      <div class="activity-item__body"><h3>${escapeHtml(text.title)}</h3><p>${escapeHtml(text.message)}</p></div>
      <time class="activity-item__time" datetime="${escapeHtml(event.created_at || '')}">${formatRelative(event.created_at)}</time>
    </a>`;
  }).join('');

  const headingAction = options.compact ? siteAction({ label: `完整动态 ${icons.arrow(15)}`, href: '#/activity', compact: true }) : '';
  return `<section class="section" id="activity"><div class="container">
    ${options.compact ? sectionHeading({ eyebrow: '动态', title, copy, action: headingAction }) : ''}
    <div class="activity-list" data-activity-list>${list}</div>
  </div></section>`;
}

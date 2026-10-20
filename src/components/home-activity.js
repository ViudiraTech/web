import { activitySection } from './activity.js';

export function homeActivity(events = [], state = 'loading') {
  return activitySection(events, state, {
    limit: 4,
    compact: true,
    title: '最近在推进的事。',
    copy: '来自 GitHub 公开事件的最新提交、发布与讨论。',
  });
}

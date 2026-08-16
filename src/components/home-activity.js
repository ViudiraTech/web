import { activitySection } from './activity.js';

export function homeActivity(events = [], state = 'loading') {
  return activitySection(events, state, {
    limit: 4,
    compact: true,
    title: '最近的公开开发动作。',
    copy: '首页仅保留最近几条公开事件；完整时间线放在独立动态页。',
  });
}

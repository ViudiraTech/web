import { icons } from '../utils/icons.js';
import { CONTRIBUTION_WAYS, STARTING_POINTS } from '../data/organization.js';
import { sectionHeading, displayName } from './home-sections.js';

const WORKFLOW = ['阅读 README', '提出 Issue', '讨论方案', '编写代码', 'Pull Request', 'Review 与合并'];

export function community() {
  return `<section class="section section--tight" id="community">
      <div class="container">
        ${sectionHeading({ eyebrow: '参与方式', title: '任何一个小改动都算数。' })}
        <div class="way-grid">
          ${CONTRIBUTION_WAYS.map(([title, copy]) => `<article class="way-card reveal"><h3>${title}</h3><p>${copy}</p></article>`).join('')}
        </div>
      </div>
    </section>

    <section class="section section--tight">
      <div class="container">
        ${sectionHeading({ eyebrow: '协作流程', title: '一切都发生在 GitHub 上。', copy: '我们沿用开源社区最普通的流程：先读、再问、再改。讨论和 Review 都是公开的，你可以随时看到一个改动是怎样被接受的。' })}
        <ol class="workflow reveal">
          ${WORKFLOW.map((step, index) => `<li><span>${String(index + 1).padStart(2, '0')}</span>${step}</li>`).join('')}
        </ol>
      </div>
    </section>

    <section class="section section--tight">
      <div class="container">
        ${sectionHeading({ eyebrow: '从哪里开始', title: '按兴趣挑一个入口。' })}
        <div class="start-list reveal">
          ${STARTING_POINTS.map(([interest, repo, copy]) => `<a class="start-item" href="https://github.com/ViudiraTech/${repo}" target="_blank" rel="noreferrer">
            <span class="start-item__interest">${interest}</span>
            <strong>${displayName(repo)}</strong>
            <p>${copy}</p>
            <span class="start-item__arrow" aria-hidden="true">${icons.arrowUpRight(17)}</span>
          </a>`).join('')}
        </div>
      </div>
    </section>`;
}

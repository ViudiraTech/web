import { icons } from '../utils/icons.js';
import { liquidButton } from './liquid-button.js';

export function joinSection() {
  const actions = [
    ['查看项目','从 README 与源码理解上下文'],['提交 Issue','报告问题或提出可讨论的需求'],['Pull Request','提交可以被 review 的改动'],['改进文档','让构建、调试与设计更清楚'],['参与测试','提供可复现的环境与结果'],['Code Review','从实现细节推动质量提升'],
  ];
  return `<section class="section section--compact"><div class="container join-panel reveal">
    <div><span class="eyebrow">Join ViudiraTech</span><h2 class="section-title">参与一个真实的<br/>开源工作流。</h2><p class="section-copy" style="margin:18px 0 24px">你可以从任意公开项目开始参与，通过代码、Issue、文档、测试或 Review 加入协作。</p><div class="button-row">${liquidButton({ label: `${icons.github(17)} 探索 GitHub`, preset: 'catalog-button-blue', className: 'catalog-button--tinted site-liquid-action', backdrop: 'ambient', href: 'https://github.com/ViudiraTech', target: '_blank', rel: 'noreferrer', attributes: 'data-glass-settings-scope="site"' })}${liquidButton({ label: `查看项目 ${icons.arrow(15)}`, preset: 'catalog-button-surface', className: 'site-liquid-action', backdrop: 'ambient', href: '#/projects', attributes: 'data-glass-settings-scope="site"' })}</div></div>
    <div class="join-actions">${actions.map(([a,b]) => `<div class="join-action"><strong>${a}</strong><span>${b}</span></div>`).join('')}</div>
  </div></section>`;
}

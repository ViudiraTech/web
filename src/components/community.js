import { icons } from '../utils/icons.js';

const steps = [
  ['01','Idea'],['02','Issue'],['03','Discussion'],['04','Development'],['05','Pull Request'],['06','Review'],['07','Merge'],
];

export function community() {
  return `<section class="section section--compact" id="community">
    <div class="container">
      <header class="section-head reveal">
        <div><span class="eyebrow">Viudira Community</span><h2 class="section-title">协作发生在代码旁边。</h2></div>
        <p class="section-copy">ViudiraTech 的社区协作以公开工作流为核心：Issue、Pull Request、Review、文档与测试都可以被追踪、讨论和持续改进。</p>
      </header>
      <div class="community-flow reveal">${steps.map(([n,label]) => `<div class="flow-step"><span>${n}</span><strong>${label}</strong></div>`).join('')}</div>
      <p class="community-note reveal">任何参与都可以从很小的动作开始：复现一个问题、补充一条文档、提出设计讨论，或者提交一份可以被 review 的代码改动。</p>
    </div>
  </section>`;
}

import { icons } from '../utils/icons.js';
import { escapeHtml } from '../utils/html.js';
import { ORG, PRINCIPLES, STACK_LAYERS, MEMBERS, RECENT_NOTES } from '../data/organization.js';
import { sectionHeading, displayName, repoByName, orgStats } from './home-sections.js';

function story(repos, state) {
  return `<section class="section section--tight">
    <div class="container story">
      <div class="story__copy reveal">
        <p>${ORG.summary}</p>
        <p>组织里既有早期的小实验，比如 DLL 模组加载器 ModLoader、基于 GPT-2 的模型训练套件；也有持续投入的长期项目：x86-64 内核 Uinxed-Kernel 已经实现了 Linux 兼容的系统调用接口，可以启动 Alpine Linux 用户态；它的 Rust 版本 SpaceKernel 正在向 aarch64 和 RISC-V 扩展；系统编程语言 Uinx 面向内核、驱动与嵌入式软件，自带裸机内核工程生成器。</p>
        <p>我们相信理解系统最好的方式是亲手实现它。这些项目大多仍是实验性的，README 里会如实写明哪些部分尚在验证——欢迎你来读代码、提问题，或者直接动手改。</p>
        <blockquote class="motto">“${ORG.motto}”</blockquote>
      </div>
      <aside class="story__aside reveal">
        ${orgStats(repos, state)}
      </aside>
    </div>
  </section>`;
}

function principles() {
  return `<section class="section section--tight">
    <div class="container">
      ${sectionHeading({ eyebrow: '我们相信', title: '几条朴素的做事方式。' })}
      <div class="principle-grid">
        ${PRINCIPLES.map(([title, copy], index) => `<article class="principle reveal"><span>0${index + 1}</span><h3>${title}</h3><p>${copy}</p></article>`).join('')}
      </div>
    </div>
  </section>`;
}

function stack(repos) {
  return `<section class="section section--tight">
    <div class="container">
      ${sectionHeading({ eyebrow: '技术版图', title: '我们的项目，覆盖完整的系统栈。', copy: '从机器上电执行的第一条指令，到用户每天使用的工具。点击任一项目可以前往它的仓库。' })}
      <div class="stack reveal" role="list">
        ${STACK_LAYERS.map((layer) => `<div class="stack__layer" role="listitem">
          <span class="stack__label">${layer.label}</span>
          <div class="stack__repos">${layer.repos.map((name) => {
            const repo = repoByName(repos, name);
            const stars = repo ? `<small>${icons.star(12)} ${repo.stars}</small>` : '';
            return `<a class="stack__repo" href="https://github.com/ViudiraTech/${name}" target="_blank" rel="noreferrer">${escapeHtml(displayName(name))}${stars}</a>`;
          }).join('')}</div>
        </div>`).join('')}
      </div>
    </div>
  </section>`;
}

function members() {
  return `<section class="section section--tight">
    <div class="container">
      ${sectionHeading({ eyebrow: '成员', title: '目前的核心成员。', copy: '组织公开页面列出的成员。更多贡献者记录在各仓库的提交历史与 CREDITS 中。' })}
      <div class="member-grid">
        ${MEMBERS.map(({ login }) => `<a class="member reveal" href="https://github.com/${login}" target="_blank" rel="noreferrer">
          <img src="https://github.com/${login}.png?size=96" alt="" width="48" height="48" loading="lazy" decoding="async" />
          <span><strong>${login}</strong><small>@${login}</small></span>
          <span class="member__arrow" aria-hidden="true">${icons.arrowUpRight(16)}</span>
        </a>`).join('')}
      </div>
    </div>
  </section>`;
}

function recent() {
  return `<section class="section section--tight">
    <div class="container">
      ${sectionHeading({ eyebrow: '近况', title: '各项目最近的进展。' })}
      <dl class="notes reveal">
        ${RECENT_NOTES.map(([repo, note]) => `<div><dt>${escapeHtml(displayName(repo))}</dt><dd>${note}</dd></div>`).join('')}
      </dl>
    </div>
  </section>`;
}

export function aboutCopy(repos = [], state = 'loading') {
  return `${story(repos, state)}${principles()}${stack(repos)}${members()}${recent()}`;
}

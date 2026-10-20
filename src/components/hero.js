import { icons } from '../utils/icons.js';
import { ORG } from '../data/organization.js';
import { siteAction } from './site-action.js';

// Illustrative boot sequence of Uinxed-Kernel, summarised from its README.
const BOOT_LINES = [
  ['$', 'make && make run'],
  ['boot', 'Limine → kernel_entry()'],
  ['mm', 'buddy allocator · 4-level paging · heap'],
  ['acpi', 'probing ACPI / TSC / SMP'],
  ['smp', 'all cores online'],
  ['sched', 'EEVDF scheduler started'],
  ['init', 'PID 1 → Alpine Linux userspace'],
];

function terminal() {
  const lines = BOOT_LINES.map(([tag, text], index) => {
    const prompt = tag === '$'
      ? '<span class="terminal__prompt">$</span>'
      : `<span class="terminal__tag">[${tag.padEnd(5, ' ')}]</span>`;
    return `<span class="terminal__line" style="--line:${index}">${prompt} ${text}</span>`;
  }).join('');
  return `<figure class="terminal reveal" aria-label="Uinxed-Kernel 启动流程示意">
    <div class="terminal__bar" aria-hidden="true"><i></i><i></i><i></i><span>uinxed-kernel — qemu</span></div>
    <pre class="terminal__body"><code>${lines}<span class="terminal__cursor" aria-hidden="true"></span></code></pre>
    <figcaption>Uinxed-Kernel 启动流程示意</figcaption>
  </figure>`;
}

export function hero() {
  return `
    <section class="hero" id="top">
      <div class="container hero__grid">
        <div class="hero-intro reveal">
          <p class="kicker">独立开源技术社区 · 由学生发起</p>
          <h1 class="hero__title">我们不只是使用系统，<br />我们亲手构建它们。</h1>
          <p class="hero-lead">${ORG.summary}</p>
          <div class="button-row">
            ${siteAction({ label: `认识我们 ${icons.arrow(16)}`, href: '#/about', variant: 'primary' })}
            ${siteAction({ label: `${icons.github(17)} GitHub`, href: ORG.github, external: true })}
          </div>
        </div>
        ${terminal()}
      </div>
    </section>`;
}

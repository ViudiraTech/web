import { escapeHtml } from '../utils/html.js';
function namesBy(repos, category) {
  const names = repos.filter((r) => r.category === category).slice(0, 3).map((r) => r.name);
  return names.length ? names.map(escapeHtml).join(' · ') : '由公开仓库持续映射';
}

export function techMap(repos = []) {
  return `<section class="section section--compact" id="about"><div class="container">
    <header class="section-head reveal"><div><span class="eyebrow">What We Build</span><h2 class="section-title">从内核向外，连接系统与工具。</h2></div><p class="section-copy">这里不是传统 Feature Cards，而是一张技术关系图。仓库会依据其公开元数据映射到最接近的领域。</p></header>
    <div class="tech-graph reveal">
      <article class="tech-node tech-node--primary"><span class="tech-label">01 / FOUNDATION</span><h3>Operating Systems & Kernels</h3><p>调度、内存、VFS、设备、ABI 与用户空间之间的边界。</p><div class="tech-repos">${namesBy(repos,'Kernel')}</div></article>
      <article class="tech-node"><span class="tech-label">02 / SYSTEM</span><h3>System Software</h3><p>BIOS、模拟器、runtime 与其他靠近机器边界的软件。</p><div class="tech-repos">${namesBy(repos,'System')}</div></article>
      <article class="tech-node"><span class="tech-label">03 / TOOLING</span><h3>Developer Tools</h3><p>帮助开发、测试、交互或探索系统的软件工具。</p><div class="tech-repos">${namesBy(repos,'Tool')}</div></article>
      <article class="tech-node"><span class="tech-label">04 / WEB</span><h3>Web & Interface</h3><p>面向使用者和社区的界面层与 Web 工程。</p><div class="tech-repos">${namesBy(repos,'Web')}</div></article>
      <article class="tech-node"><span class="tech-label">05 / RESEARCH</span><h3>Experimental</h3><p>难以稳定归类、仍处于技术探索阶段的公开仓库。</p><div class="tech-repos">${namesBy(repos,'Experimental')}</div></article>
    </div>
  </div></section>`;
}

import { escapeHtml } from '../utils/html.js';
function namesBy(repos, category) {
  const names = repos.filter((r) => r.category === category).slice(0, 3).map((r) => r.name);
  return names.length ? names.map(escapeHtml).join(' · ') : '由公开仓库持续映射';
}

export function techMap(repos = []) {
  return `<section class="section section--compact" id="about"><div class="container">
    <header class="section-head reveal"><div><span class="eyebrow">What We Build</span><h2 class="section-title">从内核向外，连接系统与工具。</h2></div><p class="section-copy">这张技术关系图依据仓库公开元数据，将项目映射到最接近的工程领域，帮助理解不同方向之间的连接。</p></header>
    <div class="tech-graph reveal">
      <article class="tech-node tech-node--primary"><span class="tech-label">01 / FOUNDATION</span><h3>操作系统与内核</h3><p>调度、内存、VFS、设备、ABI 与用户空间之间的边界。</p><div class="tech-repos">${namesBy(repos,'Kernel')}</div></article>
      <article class="tech-node"><span class="tech-label">02 / SYSTEM</span><h3>系统软件</h3><p>BIOS、模拟器、runtime 与其他靠近机器边界的软件。</p><div class="tech-repos">${namesBy(repos,'System')}</div></article>
      <article class="tech-node"><span class="tech-label">03 / TOOLING</span><h3>开发者工具</h3><p>帮助开发、测试、交互或探索系统的软件工具。</p><div class="tech-repos">${namesBy(repos,'Tool')}</div></article>
      <article class="tech-node"><span class="tech-label">04 / WEB</span><h3>Web 与界面</h3><p>面向使用者和社区的界面层与 Web 工程。</p><div class="tech-repos">${namesBy(repos,'Web')}</div></article>
      <article class="tech-node"><span class="tech-label">05 / RESEARCH</span><h3>实验与研究</h3><p>处于技术探索阶段、用于验证新方向与工程方法的公开仓库。</p><div class="tech-repos">${namesBy(repos,'Experimental')}</div></article>
    </div>
  </div></section>`;
}

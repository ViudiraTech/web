import { icons } from '../utils/icons.js';
import { siteAction } from './site-action.js';

export function joinSection({
  title = '想一起写点底层的东西？',
  copy = '不需要申请，也没有门槛。挑一个感兴趣的仓库读一读，从一个 Issue 或一处文档改进开始。',
} = {}) {
  return `<section class="section section--tight">
    <div class="container">
      <div class="cta-band reveal">
        <div class="cta-band__inner">
          <h2>${title}</h2>
          <p>${copy}</p>
        </div>
        <div class="button-row">
          ${siteAction({ label: `${icons.github(17)} 前往 GitHub`, href: 'https://github.com/ViudiraTech', variant: 'primary', external: true })}
          ${siteAction({ label: `参与方式 ${icons.arrow(15)}`, href: '#/community' })}
        </div>
      </div>
    </div>
  </section>`;
}

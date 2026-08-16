import { routeHref } from '../router/routes.js';

export function footer() {
  return `<footer class="footer"><div class="container footer-row"><span class="footer-brand">ViudiraTech</span><span class="footer-copy">Open Source Community · 网站内容以 GitHub 公开数据为准</span><nav class="footer-links" aria-label="页脚导航"><a href="${routeHref('projects')}" data-spa-route="projects">Projects</a><a href="${routeHref('community')}" data-spa-route="community">Community</a><a href="${routeHref('activity')}" data-spa-route="activity">Activity</a><a href="https://github.com/ViudiraTech" target="_blank" rel="noreferrer">GitHub</a></nav></div></footer>`;
}

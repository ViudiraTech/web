export function pageIntro({ eyebrow, title, copy }) {
  return `<section class="page-intro"><div class="container page-intro__grid">
    <div class="reveal"><span class="eyebrow">${eyebrow}</span><h1>${title}</h1></div>
    <p class="page-intro__copy reveal">${copy}</p>
  </div></section>`;
}
